/**
 * Aggregatzustände bei eingestellter Temperatur und eingestelltem Druck.
 *
 * - Schmelz- und Siedepunkte stammen aus einer Tabelle (physicalData.ts).
 * - Für organische Moleküle ohne Tabellenwert werden sie nach der
 *   Gruppenbeitragsmethode von Joback und Reid (1987) geschätzt:
 *   T_b = 198 K + Σ ΔT_b,  T_m = 122,5 K + Σ ΔT_m.
 * - Der Siedepunkt bei anderem Druck folgt aus der Clausius-Clapeyron-Gleichung;
 *   die Verdampfungsenthalpie liefert die Pictet-Trouton-Regel
 *   (ΔH ≈ 88 J/(mol·K) · T_b, bei Wasserstoffbrücken ≈ 109 J/(mol·K) · T_b).
 */
import type { MainModule } from '@rdkit/rdkit';
import { withMol } from './rdkit';
import { splitSalt } from './ions';
import { PHYSICAL_DATA } from '../data/physicalData';
import type { Substance } from '../data/types';

export const NORMAL_PRESSURE = 1.01325;
const R = 8.314462618;

export type PhaseState = 'fest' | 'flüssig' | 'gasförmig' | 'gelöst' | 'zersetzt' | 'unbekannt';

export interface PhysicalProperties {
  mp?: number;
  bp?: number;
  sub?: number;
  dec?: number;
  solution?: boolean;
  /** Woher die Werte stammen */
  source: 'Tabelle' | 'Joback-Schätzung' | 'Stoffklasse' | 'unbekannt';
  /** Wasserstoffbrücken: höhere Verdampfungsenthalpie */
  hydrogenBonded?: boolean;
}

// ---------------------------------------------------------------------
// Joback-Methode
// ---------------------------------------------------------------------

/** Gruppenbeiträge nach Joback: [ΔT_b, ΔT_m] in K. */
const JOBACK: Record<string, [number, number]> = {
  CH3: [23.58, -5.1], CH2: [22.88, 11.27], CH: [21.74, 12.64], C: [18.25, 46.43],
  '=CH2': [18.18, -4.32], '=CH': [24.96, 8.73], '=C': [24.14, 11.14], '=C=': [26.15, 17.78],
  '#CH': [9.2, -11.18], '#C': [27.38, 64.32],
  rCH2: [27.15, 7.75], rCH: [21.78, 19.88], rC: [21.32, 60.15], 'r=CH': [26.73, 8.13], 'r=C': [31.01, 37.02],
  F: [-0.03, -15.78], Cl: [38.13, 13.55], Br: [66.86, 43.43], I: [93.84, 41.69],
  OH: [92.88, 44.45], ArOH: [76.34, 82.83], O: [22.42, 22.23], rO: [31.22, 23.05],
  'C=O': [76.75, 61.2], 'rC=O': [94.97, 75.97], CHO: [72.24, 36.9], COOH: [169.09, 155.5], COO: [81.1, 53.6],
  '=O': [-10.5, 2.08],
  NH2: [73.23, 66.89], NH: [50.17, 52.66], rNH: [52.82, 101.51], N: [11.74, 48.84], rN: [11.74, 48.84],
  '=N': [74.6, 68.4], 'r=N': [57.55, 68.4], '=NH': [83.08, 68.91], CN: [125.66, 59.89], NO2: [152.54, 127.24],
  SH: [63.56, 20.09], S: [68.78, 34.4], rS: [52.1, 79.93],
};

interface JsonAtom { z?: number; impHs?: number; chg?: number }
interface JsonBond { bo?: number; atoms: [number, number] }

/**
 * Schätzt Schmelz- und Siedepunkt nach Joback. Liefert null für Ionen,
 * Metallverbindungen und Elemente, die die Methode nicht abdeckt.
 */
export function jobackEstimate(rdkit: MainModule, smiles: string): { mp: number; bp: number; hydrogenBonded: boolean } | null {
  if (smiles.includes('.')) return null;
  return withMol(rdkit, smiles, (mol) => {
    const json = JSON.parse(mol.get_json()) as {
      defaults: { atom: JsonAtom; bond: { bo: number } };
      molecules: Array<{ atoms: JsonAtom[]; bonds?: JsonBond[]; extensions?: Array<{ aromaticAtoms?: number[]; atomRings?: number[][] }> }>;
    };
    const molecule = json.molecules[0];
    const atoms = molecule.atoms.map((atom) => ({
      z: atom.z ?? json.defaults.atom.z ?? 6,
      h: atom.impHs ?? json.defaults.atom.impHs ?? 0,
      chg: atom.chg ?? 0,
    }));
    // Nur neutrale Moleküle aus C, H, N, O, S und Halogenen; Nitrogruppen sind ladungsgetrennt erlaubt
    if (atoms.length < 2 || atoms.some((atom) => ![1, 6, 7, 8, 9, 16, 17, 35, 53].includes(atom.z))) return null;
    if (atoms.reduce((sum, atom) => sum + atom.chg, 0) !== 0) return null;
    const extension = molecule.extensions?.[0] ?? {};
    const aromatic = new Set(extension.aromaticAtoms ?? []);
    const ring = new Set((extension.atomRings ?? []).flat());
    const neighbours: Array<Array<{ atom: number; order: number }>> = atoms.map(() => []);
    for (const bond of molecule.bonds ?? []) {
      const order = bond.bo ?? json.defaults.bond.bo ?? 1;
      neighbours[bond.atoms[0]].push({ atom: bond.atoms[1], order });
      neighbours[bond.atoms[1]].push({ atom: bond.atoms[0], order });
    }

    const used = new Set<number>();
    const groups: string[] = [];
    const add = (group: string, ...indices: number[]) => {
      groups.push(group);
      for (const index of indices) used.add(index);
    };
    const doubleO = (index: number) =>
      neighbours[index].find((entry) => entry.order === 2 && atoms[entry.atom].z === 8 && !used.has(entry.atom));

    // Zuerst Gruppen aus mehreren Atomen: Nitro, Nitril, Carboxyl, Ester, Aldehyd, Keton
    atoms.forEach((atom, index) => {
      if (used.has(index)) return;
      if (atom.z === 7) {
        const oxygens = neighbours[index].filter(
          (entry) => atoms[entry.atom].z === 8 && (entry.order === 2 || atoms[entry.atom].chg === -1),
        );
        if (oxygens.length === 2) add('NO2', index, ...oxygens.map((entry) => entry.atom));
        return;
      }
      if (atom.z === 6) {
        const triple = neighbours[index].find((entry) => entry.order === 3 && atoms[entry.atom].z === 7);
        if (triple) {
          add('CN', index, triple.atom);
          return;
        }
        const carbonyl = doubleO(index);
        if (!carbonyl) return;
        const singleO = neighbours[index].filter((entry) => entry.order === 1 && atoms[entry.atom].z === 8);
        const hydroxyl = singleO.find((entry) => atoms[entry.atom].h === 1);
        if (hydroxyl) add('COOH', index, carbonyl.atom, hydroxyl.atom);
        else if (singleO.length) add('COO', index, carbonyl.atom, singleO[0].atom);
        else if (atom.h >= 1) add('CHO', index, carbonyl.atom);
        else add(ring.has(index) ? 'rC=O' : 'C=O', index, carbonyl.atom);
      }
    });

    if (atoms.some((atom, index) => atom.chg && !used.has(index))) return null;
    let hydrogenBonded = groups.some((group) => group === 'COOH');
    atoms.forEach((atom, index) => {
      if (used.has(index)) return;
      const bonds = neighbours[index];
      const inRing = ring.has(index);
      const maxOrder = Math.max(0, ...bonds.map((entry) => entry.order));
      const doubles = bonds.filter((entry) => entry.order === 2).length;
      switch (atom.z) {
        case 6:
          if (aromatic.has(index)) add(atom.h ? 'r=CH' : 'r=C', index);
          else if (maxOrder === 3) add(atom.h ? '#CH' : '#C', index);
          else if (doubles === 2) add('=C=', index);
          else if (doubles === 1) add(atom.h === 2 ? '=CH2' : atom.h === 1 ? (inRing ? 'r=CH' : '=CH') : inRing ? 'r=C' : '=C', index);
          else if (atom.h >= 3) add('CH3', index);
          else if (atom.h === 2) add(inRing ? 'rCH2' : 'CH2', index);
          else if (atom.h === 1) add(inRing ? 'rCH' : 'CH', index);
          else add(inRing ? 'rC' : 'C', index);
          break;
        case 8:
          if (atom.h >= 1) {
            hydrogenBonded = true;
            add(bonds.some((entry) => aromatic.has(entry.atom)) ? 'ArOH' : 'OH', index);
          } else if (maxOrder === 2) add('=O', index);
          else add(inRing ? 'rO' : 'O', index);
          break;
        case 7:
          if (aromatic.has(index)) add(atom.h ? 'rNH' : 'r=N', index);
          else if (maxOrder === 2) add(atom.h ? '=NH' : inRing ? 'r=N' : '=N', index);
          else if (atom.h >= 2) {
            hydrogenBonded = true;
            add('NH2', index);
          } else if (atom.h === 1) {
            hydrogenBonded = true;
            add(inRing ? 'rNH' : 'NH', index);
          } else add(inRing ? 'rN' : 'N', index);
          break;
        case 16:
          if (atom.h >= 1) add('SH', index);
          else add(inRing || aromatic.has(index) ? 'rS' : 'S', index);
          break;
        case 9: add('F', index); break;
        case 17: add('Cl', index); break;
        case 35: add('Br', index); break;
        case 53: add('I', index); break;
        default:
          break;
      }
    });

    const sum = (position: 0 | 1) => groups.reduce((total, group) => total + (JOBACK[group]?.[position] ?? 0), 0);
    const bp = 198 + sum(0) - 273.15;
    const mp = Math.min(122.5 + sum(1) - 273.15, bp - 1);
    return { mp: Math.round(mp) || 0, bp: Math.round(bp) || 0, hydrogenBonded };
  });
}

// ---------------------------------------------------------------------
// Stoffdaten
// ---------------------------------------------------------------------

const cache = new Map<string, PhysicalProperties>();

/** Schmelz- und Siedepunkt eines Stoffes – aus der Tabelle, geschätzt oder aus der Stoffklasse. */
export function physicalProperties(rdkit: MainModule | null, substance: Substance): PhysicalProperties {
  const key = `${rdkit ? 1 : 0}|${substance.id}|${substance.smiles ?? substance.formula}`;
  const cached = cache.get(key);
  if (cached) return cached;

  let result: PhysicalProperties;
  const table = PHYSICAL_DATA[substance.id];
  if (table) {
    result = { ...table, source: 'Tabelle', hydrogenBonded: /O|N/.test(substance.formula) && /H/.test(substance.formula) };
  } else if (substance.smiles && rdkit && jobackEstimate(rdkit, substance.smiles)) {
    const estimate = jobackEstimate(rdkit, substance.smiles)!;
    result = { mp: estimate.mp, bp: estimate.bp, source: 'Joback-Schätzung', hydrogenBonded: estimate.hydrogenBonded };
  } else if (substance.smiles && /[+-]\]/.test(substance.smiles) && substance.smiles.includes('.')) {
    // Salze organischer Säuren und Basen
    result = { mp: 250, source: 'Stoffklasse' };
  } else if (substance.category === 'Gas') {
    result = { mp: -150, bp: -50, source: 'Stoffklasse' };
  } else if (splitSalt(substance.formula) || ['Salz', 'Oxid', 'Base'].includes(substance.category) || /^[A-Z][a-z]?$/.test(substance.formula)) {
    // Salze, Oxide und Metalle: fest, schmelzen meist erst weit über 250 °C
    result = { mp: 500, source: 'Stoffklasse' };
  } else {
    result = { source: 'unbekannt' };
  }
  cache.set(key, result);
  return result;
}

/** Siedepunkt bei anderem Druck nach Clausius-Clapeyron (in °C). */
export function boilingPointAt(normalBoilingPoint: number, pressureBar: number, hydrogenBonded = false): number {
  const tb = normalBoilingPoint + 273.15;
  const entropy = hydrogenBonded ? 109 : 88;
  const enthalpy = entropy * tb;
  const inverse = 1 / tb - (R / enthalpy) * Math.log(pressureBar / NORMAL_PRESSURE);
  return 1 / inverse - 273.15;
}

export interface StateDescription {
  state: PhaseState;
  /** Siedepunkt beim eingestellten Druck, falls bekannt */
  boilingPoint?: number;
  text: string;
  source: PhysicalProperties['source'];
}

function formatC(value: number): string {
  return `${(Math.round(value) || 0).toLocaleString('de-DE')} °C`;
}

/** Aggregatzustand eines Stoffes bei Temperatur (°C) und Druck (bar). */
export function stateAt(properties: PhysicalProperties, temperature: number, pressure: number): StateDescription {
  const source = properties.source;
  const estimated = source === 'Joback-Schätzung' ? ' (geschätzt)' : '';
  if (properties.dec !== undefined && temperature >= properties.dec) {
    return { state: 'zersetzt', text: `zersetzt sich (ab etwa ${formatC(properties.dec)})`, source };
  }
  if (properties.solution) {
    const boil = boilingPointAt(100, pressure, true);
    return temperature >= boil
      ? { state: 'gasförmig', boilingPoint: boil, text: `Lösung siedet (Wasser verdampft ab etwa ${formatC(boil)})`, source }
      : { state: 'gelöst', boilingPoint: boil, text: 'wässrige Lösung', source };
  }
  if (properties.sub !== undefined && properties.bp === undefined) {
    const sub = boilingPointAt(properties.sub, pressure, false);
    return temperature >= sub
      ? { state: 'gasförmig', boilingPoint: sub, text: `gasförmig (Sublimationspunkt ${formatC(sub)})`, source }
      : { state: 'fest', boilingPoint: sub, text: `fest (sublimiert bei ${formatC(sub)})`, source };
  }
  if (properties.dec !== undefined && properties.mp === undefined && properties.bp === undefined) {
    return { state: 'fest', text: `fest (zersetzt sich ab etwa ${formatC(properties.dec)})`, source };
  }
  if (properties.bp !== undefined) {
    const boil = boilingPointAt(properties.bp, pressure, properties.hydrogenBonded);
    if (temperature >= boil) return { state: 'gasförmig', boilingPoint: boil, text: `gasförmig (Siedepunkt ${formatC(boil)}${estimated})`, source };
    if (properties.mp !== undefined && temperature < properties.mp) {
      return { state: 'fest', boilingPoint: boil, text: `fest (Schmelzpunkt ${formatC(properties.mp)}${estimated})`, source };
    }
    return { state: 'flüssig', boilingPoint: boil, text: `flüssig (siedet bei ${formatC(boil)}${estimated})`, source };
  }
  if (properties.mp !== undefined) {
    if (temperature < properties.mp) {
      return {
        state: 'fest',
        text: source === 'Stoffklasse' ? 'fest' : `fest (Schmelzpunkt ${formatC(properties.mp)}${estimated})`,
        source,
      };
    }
    return { state: 'flüssig', text: source === 'Stoffklasse' ? 'geschmolzen (abgeschätzt)' : 'geschmolzen', source };
  }
  return { state: 'unbekannt', text: 'Aggregatzustand unbekannt', source };
}

/** Faktor, um den eine Reaktion bei T schneller ist als bei 20 °C (RGT-Regel, Faktor 2 je 10 K). */
export function rateFactor(temperature: number, reference = 20): number {
  return 2 ** ((temperature - reference) / 10);
}
