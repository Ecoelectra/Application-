/**
 * Reaktionsenthalpie nach dem Satz von Hess:
 *
 *   ΔrH° = Σ ν · ΔfH°(Produkte) − Σ ν · ΔfH°(Edukte)
 *
 * Die Standardbildungsenthalpien stammen aus der Tabelle in
 * src/data/thermoData.ts. Für organische Stoffe ohne Tabellenwert schätzt die
 * App ΔfH° nach der Gruppenbeitragsmethode von Joback und Reid (1987) für das
 * Gas und rechnet mit der geschätzten Verdampfungs- und Schmelzenthalpie auf
 * den Zustand bei 25 °C um.
 *
 * In wässriger Lösung liegen starke Säuren, starke Basen und lösliche Salze
 * als Ionen vor. Die App rechnet dann mit den Ionen – so ergibt die
 * Neutralisation −55,8 kJ/mol, egal welche Säure und welche Lauge.
 */
import type { MainModule } from '@rdkit/rdkit';
import { balanceSpecies } from './balance';
import { parseFormula, toHillFormula } from './formula';
import { solubility, splitHydrate, splitSalt, type Ion } from './ions';
import { jobackEstimate, jobackGroups } from './phase';
import { matchSmarts, molecularFormula } from './rdkit';
import { structureKey } from './reactionKeys';
import { INORGANIC_ENTHALPIES, ORGANIC_ENTHALPIES, type ThermoPhase } from '../data/thermoData';

export type EnthalpySource = 'Tabelle' | 'Element' | 'Joback-Schätzung' | 'Ionen in Lösung';

export interface EnthalpyTerm {
  label: string;
  formula: string;
  coefficient: number;
  side: 'edukt' | 'produkt';
  phase: ThermoPhase;
  /** ΔfH° je Mol in kJ/mol */
  value: number;
  source: EnthalpySource;
}

export interface ReactionEnthalpy {
  /** ΔrH° in kJ je Formelumsatz der angegebenen Gleichung */
  deltaH: number;
  /** ausgeglichene Gleichung, mit der gerechnet wurde */
  equation: string;
  terms: EnthalpyTerm[];
  /** mindestens ein Wert ist geschätzt */
  estimated: boolean;
  /** «Reaktionsenthalpie» oder «Lösungsenthalpie» */
  kind: 'Reaktionsenthalpie' | 'Lösungsenthalpie';
  /** Hinweis, etwa auf formal ergänzte Stoffe */
  note?: string;
}

export interface EnthalpyContext {
  /** in wässriger Lösung: Salze, starke Säuren und Basen als Ionen */
  aqueous?: boolean;
  /** Strukturen zu Summenformeln (etwa aus dem Gefäß), damit organische Stoffe erkannt werden */
  hints?: Array<{ formula: string; smiles?: string; name?: string }>;
}

export interface SpeciesInput {
  formula: string;
  smiles?: string;
  phase?: ThermoPhase;
  label?: string;
}

// ---------------------------------------------------------------------
// Schreibweisen vereinheitlichen
// ---------------------------------------------------------------------

const SUBSCRIPTS: Record<string, string> = { '₀': '0', '₁': '1', '₂': '2', '₃': '3', '₄': '4', '₅': '5', '₆': '6', '₇': '7', '₈': '8', '₉': '9' };
const SUPERSCRIPTS: Record<string, string> = { '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9', '⁺': '+', '⁻': '-' };

/** «SO₄²⁻» → «SO4^2-», «Cu2+» → «Cu^2+», «NO3-» → «NO3^-». */
export function asciiSpecies(text: string): string {
  let term = text.trim();
  const superscript = term.match(/[⁰¹²³⁴⁵⁶⁷⁸⁹]*[⁺⁻]$/);
  if (superscript) {
    const charge = [...superscript[0]].map((char) => SUPERSCRIPTS[char]).join('');
    term = `${term.slice(0, -superscript[0].length)}^${charge}`;
  }
  term = term.replace(/[₀-₉]/g, (char) => SUBSCRIPTS[char]);
  if (term.includes('^')) return term;
  const monatomic = term.match(/^([A-Z][a-z]?)(\d*)([+-])$/);
  if (monatomic) return `${monatomic[1]}^${monatomic[2]}${monatomic[3]}`;
  const polyatomic = term.match(/^(.+?[A-Za-z)\]0-9])([+-])$/);
  return polyatomic ? `${polyatomic[1]}^${polyatomic[2]}` : term;
}

interface Term {
  coefficient: number;
  formula: string;
  phase?: ThermoPhase;
}

const PHASE_WORDS: Record<string, ThermoPhase> = { aq: 'aq', s: 's', f: 's', l: 'l', fl: 'l', g: 'g' };

function parseTerm(text: string): Term | null {
  let term = text.trim().replace(/[↓↑]/g, '').trim();
  let phase: ThermoPhase | undefined;
  const phaseMatch = term.match(/\s*\((aq|s|f|l|fl|g)\)$/);
  if (phaseMatch) {
    phase = PHASE_WORDS[phaseMatch[1]];
    term = term.slice(0, -phaseMatch[0].length);
  }
  const match = term.match(/^(\d+(?:[.,]\d+)?|½)?\s*(.+)$/);
  if (!match) return null;
  const coefficient = match[1] ? (match[1] === '½' ? 0.5 : Number(match[1].replace(',', '.'))) : 1;
  const formula = asciiSpecies(match[2]).replace(/OAc/g, 'CH3COO');
  if (!/^[A-Z(\[]/.test(formula) || /[a-z]{3,}/.test(formula.replace(/\^.*$/, ''))) return null;
  try {
    parseFormula(formula);
  } catch {
    return null;
  }
  return { coefficient, formula, phase };
}

/** Liest eine Gleichung aus Summenformeln; null bei allgemeinen Gleichungen («R–COOH …»). */
export function parseEnthalpyEquation(text: string): { left: Term[]; right: Term[] } | null {
  if (/R[–-]|R′|→\s*\(|Gemisch|Produkte|Lösung|Phasen|\bn\s/.test(text)) return null;
  const cleaned = text
    .replace(/\s*\((?![a-z]{1,2}\))[^()]*[ ,°][^()]*\)/g, '')
    .replace(/\s+\((?!(?:aq|s|f|l|fl|g)\))[^()]*\)/g, '');
  const sides = cleaned.split(/\s*(?:→|⇌|->|=>|<=>|⟶|=)\s*/);
  if (sides.length !== 2) return null;
  const split = (side: string) => (/\s\+\s/.test(side) ? side.split(/\s\+\s/) : side.split(/\s*\+\s*(?=[\d½A-Z(\[])/));
  const left = split(sides[0]).map(parseTerm);
  const right = split(sides[1]).map(parseTerm);
  if (left.some((term) => !term) || right.some((term) => !term) || !left.length || !right.length) return null;
  return { left: left as Term[], right: right as Term[] };
}

// ---------------------------------------------------------------------
// Bildungsenthalpien
// ---------------------------------------------------------------------

function speciesKey(formula: string): string | null {
  try {
    const parsed = parseFormula(formula);
    return `${toHillFormula(parsed.counts)}|${parsed.charge}`;
  } catch {
    return null;
  }
}

const inorganicByKey = new Map<string, Array<{ phase: ThermoPhase; value: number; formula: string }>>();
for (const entry of INORGANIC_ENTHALPIES) {
  const key = speciesKey(entry.key);
  if (!key) continue;
  const list = inorganicByKey.get(key) ?? [];
  list.push({ phase: entry.phase, value: entry.value, formula: entry.key });
  inorganicByKey.set(key, list);
}

let organicIndex: { byStructure: Map<string, Array<{ phase: ThermoPhase; value: number }>>; byFormula: Map<string, string> } | null = null;

function organic(rdkit: MainModule) {
  if (!organicIndex) {
    const byStructure = new Map<string, Array<{ phase: ThermoPhase; value: number }>>();
    const byFormula = new Map<string, string>();
    for (const entry of ORGANIC_ENTHALPIES) {
      const key = structureKey(rdkit, entry.key);
      if (!key) continue;
      const list = byStructure.get(key) ?? [];
      list.push({ phase: entry.phase, value: entry.value });
      byStructure.set(key, list);
      const formula = molecularFormula(rdkit, key);
      const hill = formula ? speciesKey(formula) : null;
      if (hill && !byFormula.has(hill)) byFormula.set(hill, key);
    }
    organicIndex = { byStructure, byFormula };
  }
  return organicIndex;
}

/** Gruppenbeiträge zur Bildungsenthalpie (Gas, 298 K) nach Joback in kJ/mol. */
const JOBACK_HF: Record<string, number> = {
  CH3: -76.45, CH2: -20.64, CH: 29.89, C: 82.23, '=CH2': -9.63, '=CH': 37.97, '=C': 83.99, '=C=': 142.14,
  '#CH': 79.3, '#C': 115.51, rCH2: -26.8, rCH: 8.67, rC: 79.72, 'r=CH': 2.09, 'r=C': 46.43,
  F: -251.92, Cl: -71.55, Br: -29.48, I: 21.06, OH: -208.04, ArOH: -221.65, O: -132.22, rO: -138.16,
  'C=O': -133.22, 'rC=O': -164.5, CHO: -162.03, COOH: -426.72, COO: -337.92, '=O': -247.61,
  NH2: -22.02, NH: 53.47, rNH: 31.65, N: 123.34, rN: 123.34, '=N': 55.52, 'r=N': 55.52, '=NH': 93.7,
  CN: 88.43, NO2: -66.57, SH: -17.33, S: 41.87, rS: 39.1,
};

/** Joback-Schätzung für ΔfH° im Zustand bei 25 °C. */
export function jobackFormation(rdkit: MainModule, smiles: string): { value: number; phase: ThermoPhase; gas: number } | null {
  const result = jobackGroups(rdkit, smiles);
  const points = jobackEstimate(rdkit, smiles);
  if (!result || !points || result.groups.some((group) => JOBACK_HF[group] === undefined)) return null;
  const gas = 68.29 + result.groups.reduce((sum, group) => sum + JOBACK_HF[group], 0);
  const tb = points.bp + 273.15;
  const tm = points.mp + 273.15;
  if (points.bp < 25) return { value: gas, phase: 'g', gas };
  // Verdampfungsenthalpie bei 25 °C: Pictet-Trouton am Siedepunkt, etwas höher bei Raumtemperatur
  const vaporization = 1.08 * tb * (result.hydrogenBonded ? 0.109 : 0.088);
  if (points.mp < 25) return { value: gas - vaporization, phase: 'l', gas };
  // Schmelzenthalpie nach der Walden-Regel (ΔS ≈ 55 J/(mol·K))
  return { value: gas - vaporization - 0.055 * tm, phase: 's', gas };
}

interface Resolved {
  value: number;
  phase: ThermoPhase;
  source: EnthalpySource;
  label: string;
}

const STRONG_ACIDS: Record<string, Array<[string, number]>> = {
  HCl: [['H^+', 1], ['Cl^-', 1]],
  HBr: [['H^+', 1], ['Br^-', 1]],
  HI: [['H^+', 1], ['I^-', 1]],
  HNO3: [['H^+', 1], ['NO3^-', 1]],
  HClO4: [['H^+', 1], ['ClO4^-', 1]],
  H2SO4: [['H^+', 2], ['SO4^2-', 1]],
};
/** Stoffe, die in Wasser überwiegend als Moleküle gelöst bleiben */
const AQUEOUS_MOLECULES = new Set(['H3N|0', 'C2H4O2|0', 'H2O2|0', 'FH|0', 'H3O4P|0', 'CH2O3|0', 'H2S|0', 'O2S|0']);

function ionLabel(ion: Ion): string {
  const magnitude = Math.abs(ion.charge);
  return `${ion.formula}^${magnitude === 1 ? '' : magnitude}${ion.charge > 0 ? '+' : '-'}`;
}

function tableValue(formula: string, phase?: ThermoPhase): { value: number; phase: ThermoPhase } | null {
  const key = speciesKey(formula);
  const list = key ? inorganicByKey.get(key) : undefined;
  if (!list) return null;
  const entry = phase ? list.find((item) => item.phase === phase) : list[0];
  return entry ? { value: entry.value, phase: entry.phase } : null;
}

/** Summe der Ionen in Lösung, oder null, wenn ein Ion fehlt. */
function ionSum(parts: Array<[string, number]>): number | null {
  let sum = 0;
  for (const [ion, count] of parts) {
    const entry = tableValue(ion, 'aq');
    if (!entry) return null;
    sum += entry.value * count;
  }
  return sum;
}

function isElement(formula: string): boolean {
  try {
    const parsed = parseFormula(formula);
    return parsed.charge === 0 && Object.keys(parsed.counts).length === 1;
  } catch {
    return false;
  }
}

/**
 * Organische Ionen in Wasser (Carboxylate, Phenolate, Ammonium-Ionen): aus dem
 * neutralen Stoff geschätzt. Die Ionisierung schwacher Säuren ist nahezu
 * thermoneutral (Essigsäure: −485,8 → Acetat −486,0 kJ/mol); die
 * Protonierung eines Amins entspricht NH3(aq) → NH4⁺(aq), also −52,2 kJ/mol.
 */
function organicIon(rdkit: MainModule, smiles: string, charge: number, context: EnthalpyContext): number | null {
  const protectedNitro = smiles.replace(/\[N\+\]\(=O\)\[O-\]/g, '§').replace(/O=\[N\+\]\(\[O-\]\)/g, '¤');
  let neutral = protectedNitro;
  let steps = 0;
  if (charge < 0) {
    neutral = neutral.replace(/\[O-\]|\[S-\]|\[N-\]|\[n-\]/g, (group) => {
      steps++;
      return group === '[n-]' ? '[nH]' : group[1];
    });
  } else {
    neutral = neutral.replace(/\[NH3\+\]|\[NH2\+\]|\[NH\+\]|\[nH\+\]/g, (group) => {
      steps++;
      return { '[NH3+]': 'N', '[NH2+]': 'N', '[NH+]': 'N', '[nH+]': 'n' }[group] as string;
    });
  }
  if (steps !== Math.abs(charge)) return null;
  neutral = neutral.replace(/§/g, '[N+](=O)[O-]').replace(/¤/g, 'O=[N+]([O-])');
  const formula = molecularFormula(rdkit, neutral);
  if (!formula) return null;
  const parent = formationEnthalpy(rdkit, { formula, smiles: neutral }, { ...context, aqueous: true });
  if (!parent || parent.source === 'Ionen in Lösung') return null;
  return parent.value + ionization(rdkit, neutral, charge);
}

/**
 * Enthalpie, um aus dem neutralen gelösten Stoff das Ion zu machen (bezogen
 * auf H⁺(aq) = 0): Carbonsäuren ≈ 0 (Essigsäure −0,2 kJ/mol), Phenole und
 * Alkohole ≈ +23 kJ/mol (Phenol), Amine −52,2 kJ/mol (wie NH3 → NH4⁺).
 */
function ionization(rdkit: MainModule, neutralSmiles: string, charge: number): number {
  if (charge > 0) return -52.2 * charge;
  const carboxylic = matchSmarts(rdkit, neutralSmiles, '[CX3](=O)[OX2H1]').length > 0;
  return carboxylic ? 0 : 23 * -charge;
}

/** Bildungsenthalpie eines Teilchens im passenden Zustand; null, wenn unbekannt. */
export function formationEnthalpy(rdkit: MainModule | null, species: SpeciesInput, context: EnthalpyContext = {}): Resolved | null {
  const { formula } = species;
  const label = species.label ?? formula;
  let parsed: ReturnType<typeof parseFormula>;
  try {
    parsed = parseFormula(formula);
  } catch {
    return null;
  }

  // Ionen: immer gelöst
  if (parsed.charge !== 0) {
    const entry = tableValue(formula, 'aq');
    if (entry) return { ...entry, source: 'Tabelle', label };
    // Aqua-Komplex [M(H2O)n]^z+: nach Konvention das hydratisierte Ion M^z+(aq) plus n Wasser
    const aqua = formula.match(/^\[([A-Z][a-z]?)\(H2O\)(\d+)\]\^(\d*)\+$/);
    if (aqua) {
      const ion = tableValue(`${aqua[1]}^${aqua[3]}+`, 'aq');
      const water = tableValue('H2O', 'l') as { value: number };
      if (ion) return { value: ion.value + Number(aqua[2]) * water.value, phase: 'aq', source: 'Ionen in Lösung', label };
    }
    const smiles = species.smiles ?? context.hints?.find((hint) => hint.smiles && speciesKey(hint.formula) === speciesKey(formula))?.smiles;
    if (rdkit && smiles) {
      const estimate = organicIon(rdkit, smiles, parsed.charge, context);
      if (estimate !== null) return { value: estimate, phase: 'aq', source: 'Joback-Schätzung', label };
    }
    // Ohne Struktur: das neutrale Molekül (±H⁺) unter den Stoffen im Gefäß suchen
    if (rdkit && parsed.counts.C) {
      const counts = { ...parsed.counts, H: (parsed.counts.H ?? 0) + parsed.charge * -1 };
      if (counts.H >= 0) {
        const parentKey = `${toHillFormula(counts)}|0`;
        const parent = context.hints?.find((hint) => hint.smiles && speciesKey(hint.formula) === parentKey);
        if (parent?.smiles) {
          const neutral = formationEnthalpy(rdkit, { formula: toHillFormula(counts), smiles: parent.smiles }, { ...context, aqueous: true });
          if (neutral) return { value: neutral.value + ionization(rdkit, parent.smiles, parsed.charge), phase: 'aq', source: 'Joback-Schätzung', label };
        }
      }
    }
    return null;
  }

  // Explizit angegebener Zustand
  if (species.phase) {
    const entry = tableValue(formula, species.phase);
    if (entry) return { ...entry, source: 'Tabelle', label };
  }

  // Elemente im Standardzustand
  if (isElement(formula) && formula !== 'O3' && (!species.phase || ['s', 'l', 'g'].includes(species.phase))) {
    const special = tableValue(formula, species.phase);
    if (special) return { ...special, source: 'Tabelle', label };
    return { value: 0, phase: species.phase ?? (['H2', 'N2', 'O2', 'F2', 'Cl2', 'He', 'Ne', 'Ar', 'Kr', 'Xe', 'Rn'].includes(formula) ? 'g' : formula === 'Br2' || formula === 'Hg' ? 'l' : 's'), source: 'Element', label };
  }

  // In Wasser: starke Säuren, starke Basen und lösliche Salze als Ionen
  const key = speciesKey(formula);
  if (context.aqueous && !species.phase && !species.smiles) {
    const acid = STRONG_ACIDS[splitHydrate(formula).rest];
    if (acid) {
      const sum = ionSum(acid);
      if (sum !== null) return { value: sum, phase: 'aq', source: 'Ionen in Lösung', label };
    }
    const salt = splitSalt(formula);
    if (salt && salt.cation.formula !== 'H' && solubility(salt.cation, salt.anion).solubility === 'löslich') {
      const sum = ionSum([
        [ionLabel(salt.cation), salt.cationCount],
        [ionLabel(salt.anion), salt.anionCount],
      ]);
      const water = tableValue('H2O', 'l') as { value: number };
      if (sum !== null) return { value: sum + salt.hydrate * water.value, phase: 'aq', source: 'Ionen in Lösung', label };
    }
    if (key && AQUEOUS_MOLECULES.has(key)) {
      const entry = tableValue(formula, 'aq');
      if (entry) return { ...entry, source: 'Tabelle', label };
    }
  }

  // Organische Stoffe über die Struktur
  if (rdkit) {
    const index = organic(rdkit);
    let smiles = species.smiles ? structureKey(rdkit, species.smiles) : null;
    if (!smiles && key) {
      const hint = context.hints?.find((entry) => entry.smiles && speciesKey(entry.formula) === key);
      smiles = hint?.smiles ? structureKey(rdkit, hint.smiles) : (index.byFormula.get(key) ?? null);
    }
    if (smiles) {
      const list = index.byStructure.get(smiles);
      if (list) {
        const entry = (context.aqueous && list.find((item) => item.phase === 'aq')) || list[0];
        return { ...entry, source: 'Tabelle', label };
      }
      const inorganic = tableValue(formula);
      if (inorganic) return { ...inorganic, source: 'Tabelle', label };
      const estimate = jobackFormation(rdkit, smiles);
      if (estimate) return { value: estimate.value, phase: estimate.phase, source: 'Joback-Schätzung', label };
      return null;
    }
  }

  const entry = tableValue(formula);
  return entry ? { ...entry, source: 'Tabelle', label } : null;
}

// ---------------------------------------------------------------------
// Reaktionsenthalpie
// ---------------------------------------------------------------------

export type EnthalpyResult = { ok: true; enthalpy: ReactionEnthalpy } | { ok: false; missing: string[] };

function balanced(left: Term[], right: Term[]): boolean {
  const tally = new Map<string, number>();
  let charge = 0;
  const add = (terms: Term[], sign: number) => {
    for (const term of terms) {
      const parsed = parseFormula(term.formula);
      for (const [element, count] of Object.entries(parsed.counts)) tally.set(element, (tally.get(element) ?? 0) + sign * count * term.coefficient);
      charge += sign * parsed.charge * term.coefficient;
    }
  };
  add(left, 1);
  add(right, -1);
  return Math.abs(charge) < 1e-9 && [...tally.values()].every((value) => Math.abs(value) < 1e-9);
}

function formatCoefficient(value: number): string {
  if (value === 1) return '';
  if (value === 0.5) return '½ ';
  return `${Number.isInteger(value) ? value : value.toLocaleString('de-DE')} `;
}

function computeTerms(
  rdkit: MainModule | null,
  left: Array<Term & { smiles?: string; label?: string }>,
  right: Array<Term & { smiles?: string; label?: string }>,
  context: EnthalpyContext,
  kind: ReactionEnthalpy['kind'] = 'Reaktionsenthalpie',
): EnthalpyResult {
  const terms: EnthalpyTerm[] = [];
  const missing: string[] = [];
  for (const [side, list] of [['edukt', left], ['produkt', right]] as const) {
    for (const term of list) {
      const key = speciesKey(term.formula);
      const hint = context.hints?.find((entry) => entry.name && entry.formula && speciesKey(entry.formula) === key);
      const resolved = formationEnthalpy(rdkit, { formula: term.formula, smiles: term.smiles, phase: term.phase, label: term.label ?? hint?.name ?? term.formula }, context);
      if (!resolved) {
        missing.push(term.label ?? term.formula);
        continue;
      }
      terms.push({
        label: resolved.label,
        formula: term.formula,
        coefficient: term.coefficient,
        side,
        phase: resolved.phase,
        value: resolved.value,
        source: resolved.source,
      });
    }
  }
  if (missing.length) return { ok: false, missing };
  const deltaH = terms.reduce((sum, term) => sum + (term.side === 'produkt' ? 1 : -1) * term.coefficient * term.value, 0);
  const side = (name: 'edukt' | 'produkt') =>
    terms
      .filter((term) => term.side === name)
      .map((term) => `${formatCoefficient(term.coefficient)}${term.formula}(${term.phase})`)
      .join(' + ');
  return {
    ok: true,
    enthalpy: {
      deltaH: Math.round(deltaH * 10) / 10,
      equation: `${side('edukt')} → ${side('produkt')}`,
      terms,
      estimated: terms.some((term) => term.source === 'Joback-Schätzung'),
      kind,
    },
  };
}

/** Reaktionsenthalpie einer Gleichung aus Summenformeln (auch mit Ionen und Zustandsangaben). */
export function enthalpyOfEquation(rdkit: MainModule | null, text: string, context: EnthalpyContext = {}): EnthalpyResult | null {
  const parsed = parseEnthalpyEquation(text);
  if (!parsed) return null;
  let { left, right } = parsed;
  try {
    if (!balanced(left, right)) {
      const result = balanceSpecies(
        left.map((term) => term.formula),
        right.map((term) => term.formula),
      );
      left = left.map((term, i) => ({ ...term, coefficient: result.reactants[i].coefficient }));
      right = right.map((term, i) => ({ ...term, coefficient: result.products[i].coefficient }));
    }
  } catch {
    return null;
  }
  return computeTerms(rdkit, left, right, context);
}

// ---------------------------------------------------------------------
// Organische Reaktionen aus Strukturen: Nebenprodukte ergänzen
// ---------------------------------------------------------------------

const SMALL: Record<string, SpeciesInput> = {
  H2O: { formula: 'H2O', label: 'Wasser' },
  HCl: { formula: 'HCl', label: 'Chlorwasserstoff' },
  HBr: { formula: 'HBr', label: 'Bromwasserstoff' },
  HI: { formula: 'HI', label: 'Iodwasserstoff' },
  HF: { formula: 'HF', label: 'Fluorwasserstoff' },
  H2: { formula: 'H2', label: 'Wasserstoff' },
  O2: { formula: 'O2', label: 'Sauerstoff' },
  N2: { formula: 'N2', label: 'Stickstoff' },
  CO2: { formula: 'CO2', label: 'Kohlenstoffdioxid' },
  NH3: { formula: 'NH3', label: 'Ammoniak' },
  SO2: { formula: 'SO2', label: 'Schwefeldioxid' },
  MeOH: { formula: 'CH4O', smiles: 'CO', label: 'Methanol' },
  EtOH: { formula: 'C2H6O', smiles: 'CCO', label: 'Ethanol' },
  AcOH: { formula: 'C2H4O2', smiles: 'CC(=O)O', label: 'Essigsäure' },
  Isobuten: { formula: 'C4H8', smiles: 'C=C(C)C', label: 'Isobuten' },
  C2H4: { formula: 'C2H4', smiles: 'C=C', label: 'Ethen' },
  NaCl: { formula: 'NaCl', label: 'Natriumchlorid' },
  NaBr: { formula: 'NaBr', label: 'Natriumbromid' },
  KBr: { formula: 'KBr', label: 'Kaliumbromid' },
  KCl: { formula: 'KCl', label: 'Kaliumchlorid' },
  H3BO3: { formula: 'H3BO3', label: 'Borsäure' },
};

const BYPRODUCTS: string[][] = [
  [], ['H2O'], ['HCl'], ['HBr'], ['HI'], ['HF'], ['H2'], ['CO2'], ['NH3'], ['MeOH'], ['EtOH'], ['AcOH'], ['N2'], ['SO2', 'HCl'],
  ['H2O', 'CO2'], ['CO2', 'Isobuten'], ['NaCl'], ['NaBr'], ['KBr'], ['KCl'], ['H3BO3', 'HBr'], ['H3BO3', 'HCl'], ['H3BO3', 'HI'],
  ['H2O', 'HCl'], ['H2O', 'HBr'], ['H2O', 'NaCl'], ['H2O', 'NaBr'], ['CO2', 'H2'], ['C2H4'],
];
const FORMAL_H2 = 'Die Reduktion ist formal mit Wasserstoff (H₂) gerechnet – mit einem anderen Reduktionsmittel ändert sich der Wert.';
const FORMAL_O2 = 'Die Oxidation ist formal mit Sauerstoff (O₂) gerechnet – mit einem anderen Oxidationsmittel ändert sich der Wert.';

/**
 * Reihenfolge der Versuche: erst ohne Zusatz, dann mit Wasser, formal mit
 * Wasserstoff (Reduktion) oder Sauerstoff (Oxidation). Nebenprodukte mit H2
 * zuletzt – sonst würde jede Oxidation als Dehydrierung gerechnet.
 */
const ATTEMPTS: Array<{ extra: string[]; formal?: string; hydrogen: boolean }> = [
  { extra: [], hydrogen: false },
  { extra: ['H2O'], hydrogen: false },
  { extra: ['H2'], formal: FORMAL_H2, hydrogen: false },
  { extra: ['O2'], formal: FORMAL_O2, hydrogen: false },
  { extra: ['H2O', 'O2'], formal: FORMAL_O2, hydrogen: false },
  { extra: [], hydrogen: true },
  { extra: ['H2O'], hydrogen: true },
];

function formulaOf(rdkit: MainModule, species: SpeciesInput): string | null {
  if (species.smiles) return molecularFormula(rdkit, species.smiles);
  return species.formula;
}

/**
 * Reaktionsenthalpie aus Strukturen: Edukte und Hauptprodukt sind bekannt,
 * kleine Nebenprodukte (Wasser, HCl, CO2 …) werden gesucht, bis die Gleichung
 * aufgeht.
 */
export function enthalpyFromStructures(
  rdkit: MainModule,
  reactants: SpeciesInput[],
  products: SpeciesInput[],
  context: EnthalpyContext = {},
): EnthalpyResult | null {
  const withFormula = (list: SpeciesInput[]) =>
    list.map((entry) => ({ ...entry, formula: formulaOf(rdkit, entry) ?? '' })).filter((entry) => entry.formula && !entry.formula.includes('^'));
  // Gleiche Stoffe nur einmal – die Koeffizienten ergeben sich beim Ausgleichen
  const unique = (list: SpeciesInput[]) => list.filter((entry, i) => list.findIndex((other) => other.formula === entry.formula) === i);
  const allReactants = unique(withFormula(reactants));
  const right0 = unique(withFormula(products));
  if (!allReactants.length || !right0.length) return null;
  const full = balanceWithByproducts(rdkit, allReactants, right0, context, false);
  if (full || allReactants.length === 1) return full;
  // Geht die Gleichung mit allen Stoffen nicht auf, wirkt einer davon nur als
  // Katalysator oder Hilfsstoff: ohne ihn versuchen (dann ohne Vervielfachung)
  for (let skip = 0; skip < allReactants.length; skip++) {
    const result = balanceWithByproducts(rdkit, allReactants.filter((_, i) => i !== skip), right0, context, true);
    if (result) return result;
  }
  return null;
}

function balanceWithByproducts(rdkit: MainModule, left0: SpeciesInput[], right0: SpeciesInput[], context: EnthalpyContext, strict: boolean): EnthalpyResult | null {
  const toTerm = (entry: SpeciesInput, coefficient: number) => ({ coefficient, formula: entry.formula, smiles: entry.smiles, label: entry.label, phase: entry.phase });
  // Geht die Gleichung schon ohne Koeffizienten auf (Additionen, Umlagerungen)?
  const ones = (list: SpeciesInput[]) => list.map((entry) => toTerm(entry, 1));
  try {
    if (balanced(ones(left0), ones(right0))) return computeTerms(rdkit, ones(left0), ones(right0), context);
  } catch {
    return null;
  }
  // Isobuten entsteht nur beim Abspalten von tert-Butylgruppen (Boc, tBu-Ester)
  const tertButyl = left0.some((entry) => entry.smiles && matchSmarts(rdkit, entry.smiles, '[CX4]([CH3])([CH3])([CH3])O').length > 0);
  // Ethen entsteht nur bei der Metathese endständiger Alkene
  const terminalAlkene = left0.some((entry) => entry.smiles && matchSmarts(rdkit, entry.smiles, '[CH2]=[CX3]').length > 0);
  const distinctReactants = left0.length;
  let best: { cost: number; left: SpeciesInput[]; right: SpeciesInput[]; coefficients: number[]; formal?: string } | null = null;
  for (const [attemptIndex, attempt] of ATTEMPTS.entries()) {
    for (const byproducts of BYPRODUCTS) {
      if (byproducts.includes('Isobuten') && !tertButyl) continue;
      if (byproducts.includes('C2H4') && !terminalAlkene) continue;
      if (byproducts.includes('H2') !== attempt.hydrogen) continue;
      const left = [...left0, ...attempt.extra.map((id) => SMALL[id])];
      const right = [...right0, ...byproducts.map((id) => SMALL[id])];
      // Kein Stoff auf beiden Seiten (etwa HCl als Katalysator links und rechts)
      if (right.some((entry) => left.some((other) => other.formula === entry.formula))) continue;
      let coefficients: number[];
      let ambiguous: boolean;
      try {
        const result = balanceSpecies(
          left.map((entry) => entry.formula),
          right.map((entry) => entry.formula),
        );
        coefficients = [...result.reactants, ...result.products].map((entry) => entry.coefficient);
        ambiguous = result.warnings.length > 0;
      } catch {
        continue;
      }
      // Große Koeffizienten deuten auf eine Scheinlösung (etwa Disproportionierung) hin
      const givenReactant = (i: number) => i < left0.length;
      const givenProduct = (i: number) => i >= left.length && i < left.length + right0.length;
      const limit = (i: number) =>
        givenReactant(i) ? (strict || distinctReactants > 1 ? 1 : 2) * (coefficients[left.length] ?? 1) : givenProduct(i) ? 2 : 4;
      if (coefficients.some((value, i) => value > limit(i))) continue;
      // Die einfachste Gleichung gewinnt: wenige Teilchen, möglichst ohne formale Zusätze
      const cost = coefficients.reduce((sum, value) => sum + value, 0) + (attempt.formal ? 1 : 0) + (attempt.hydrogen ? 6 : 0) + (ambiguous ? 1 : 0) + attemptIndex * 0.01;
      // Je Formelumsatz des Hauptprodukts, wenn dabei höchstens Halbe entstehen
      const main = coefficients[left.length];
      if (main > 1 && coefficients.every((value) => Number.isInteger((value / main) * 2))) coefficients = coefficients.map((value) => value / main);
      if (!best || cost < best.cost) best = { cost, left, right, coefficients, formal: attempt.formal };
    }
  }
  if (!best) return null;
  const { left, right, coefficients, formal } = best;
  const result = computeTerms(
    rdkit,
    left.map((entry, i) => toTerm(entry, coefficients[i])),
    right.map((entry, i) => toTerm(entry, coefficients[left.length + i])),
    context,
  );
  if (result.ok && formal) result.enthalpy.note = formal;
  return result;
}

/** Lösungsenthalpie eines Salzes in Wasser (z. B. NH4NO3: +28,1 kJ/mol – die Lösung kühlt ab). */
export function dissolutionEnthalpy(formula: string): ReactionEnthalpy | null {
  const salt = splitSalt(formula);
  if (!salt || salt.cation.formula === 'H') return null;
  const solid = tableValue(formula, 's');
  const dissolved = formationEnthalpy(null, { formula }, { aqueous: true });
  if (!solid || !dissolved || dissolved.phase !== 'aq') return null;
  const deltaH = Math.round((dissolved.value - solid.value) * 10) / 10;
  return {
    deltaH,
    equation: `${formula}(s) → ${salt.cationCount > 1 ? `${salt.cationCount} ` : ''}${ionLabel(salt.cation)}(aq) + ${salt.anionCount > 1 ? `${salt.anionCount} ` : ''}${ionLabel(salt.anion)}(aq)`,
    terms: [
      { label: formula, formula, coefficient: 1, side: 'edukt', phase: 's', value: solid.value, source: 'Tabelle' },
      { label: `${formula} gelöst`, formula, coefficient: 1, side: 'produkt', phase: 'aq', value: dissolved.value, source: 'Ionen in Lösung' },
    ],
    estimated: false,
    kind: 'Lösungsenthalpie',
  };
}

/** «exotherm» oder «endotherm» mit kurzer Deutung. */
export function describeEnthalpy(enthalpy: ReactionEnthalpy): string {
  const value = Math.abs(enthalpy.deltaH);
  if (value < 5) return enthalpy.kind === 'Lösungsenthalpie' ? 'kaum Wärmetönung beim Lösen' : 'nahezu thermoneutral';
  if (enthalpy.deltaH < 0) return enthalpy.kind === 'Lösungsenthalpie' ? 'exotherm – die Lösung erwärmt sich' : 'exotherm – Wärme wird frei';
  return enthalpy.kind === 'Lösungsenthalpie' ? 'endotherm – die Lösung kühlt ab' : 'endotherm – Wärme muss zugeführt werden';
}
