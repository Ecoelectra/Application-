/**
 * Ionenmodell für Salze und Ionenverbindungen.
 *
 * Damit die App anorganische Reaktionen berechnen kann, muss sie ein Salz in
 * seine Ionen zerlegen können: aus CuSO₄ werden Cu²⁺ und SO₄²⁻. Statt die
 * Formel zu zergliedern – was bei Fällen wie NaHCO₃ oder Ca(OH)₂ fehleranfällig
 * wäre – wird sie gegen alle Kombinationen bekannter Ionen geprüft. Passt die
 * Summenformel einer Kombination zur Eingabe, ist die Zerlegung gefunden.
 */
import { parseFormula, toHillFormula } from './formula';

export interface Ion {
  /** Formel ohne Ladung, z. B. "Cu" oder "SO4" */
  formula: string;
  /** Ladung mit Vorzeichen */
  charge: number;
  name: string;
  /** Anzeigeform mit Ladung, z. B. "Cu²⁺" */
  label: string;
  /** Farbe der Lösung, falls charakteristisch */
  solutionColor?: string;
}

/** Hochgestellte Ladungsangabe, z. B. 2 und -1 → "²⁻". */
function superscript(charge: number): string {
  const digits = ['⁰', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹'];
  const magnitude = Math.abs(charge);
  const number = magnitude === 1 ? '' : String(magnitude).split('').map((d) => digits[Number(d)]).join('');
  return `${number}${charge > 0 ? '⁺' : '⁻'}`;
}

function ion(formula: string, charge: number, name: string, solutionColor?: string): Ion {
  return { formula, charge, name, label: `${formula}${superscript(charge)}`, solutionColor };
}

export const CATIONS: Ion[] = [
  ion('H', 1, 'Wasserstoff-Ion (Proton)'),
  ion('Li', 1, 'Lithium-Ion'),
  ion('Na', 1, 'Natrium-Ion'),
  ion('K', 1, 'Kalium-Ion'),
  ion('NH4', 1, 'Ammonium-Ion'),
  ion('Ag', 1, 'Silber-Ion'),
  ion('Cu', 1, 'Kupfer(I)-Ion'),
  ion('Mg', 2, 'Magnesium-Ion'),
  ion('Ca', 2, 'Calcium-Ion'),
  ion('Ba', 2, 'Barium-Ion'),
  ion('Sr', 2, 'Strontium-Ion'),
  ion('Zn', 2, 'Zink-Ion'),
  ion('Fe', 2, 'Eisen(II)-Ion', 'blassgrün'),
  ion('Cu', 2, 'Kupfer(II)-Ion', 'blau'),
  ion('Ni', 2, 'Nickel(II)-Ion', 'grün'),
  ion('Co', 2, 'Cobalt(II)-Ion', 'rosa'),
  ion('Mn', 2, 'Mangan(II)-Ion', 'blassrosa'),
  ion('Pb', 2, 'Blei(II)-Ion'),
  ion('Sn', 2, 'Zinn(II)-Ion'),
  ion('Hg', 2, 'Quecksilber(II)-Ion'),
  ion('Cd', 2, 'Cadmium-Ion'),
  ion('Fe', 3, 'Eisen(III)-Ion', 'gelbbraun'),
  ion('Al', 3, 'Aluminium-Ion'),
  ion('Cr', 3, 'Chrom(III)-Ion', 'grün'),
];

export const ANIONS: Ion[] = [
  ion('F', -1, 'Fluorid-Ion'),
  ion('Cl', -1, 'Chlorid-Ion'),
  ion('Br', -1, 'Bromid-Ion'),
  ion('I', -1, 'Iodid-Ion'),
  ion('OH', -1, 'Hydroxid-Ion'),
  ion('NO3', -1, 'Nitrat-Ion'),
  ion('NO2', -1, 'Nitrit-Ion'),
  ion('HCO3', -1, 'Hydrogencarbonat-Ion'),
  ion('HSO4', -1, 'Hydrogensulfat-Ion'),
  ion('H2PO4', -1, 'Dihydrogenphosphat-Ion'),
  ion('ClO', -1, 'Hypochlorit-Ion'),
  ion('ClO3', -1, 'Chlorat-Ion'),
  ion('ClO4', -1, 'Perchlorat-Ion'),
  ion('MnO4', -1, 'Permanganat-Ion', 'violett'),
  ion('SCN', -1, 'Thiocyanat-Ion'),
  ion('CN', -1, 'Cyanid-Ion'),
  ion('CH3COO', -1, 'Acetat-Ion'),
  ion('IO3', -1, 'Iodat-Ion'),
  ion('O', -2, 'Oxid-Ion'),
  ion('S', -2, 'Sulfid-Ion'),
  ion('SO4', -2, 'Sulfat-Ion'),
  ion('SO3', -2, 'Sulfit-Ion'),
  ion('S2O3', -2, 'Thiosulfat-Ion'),
  ion('CO3', -2, 'Carbonat-Ion'),
  ion('HPO4', -2, 'Hydrogenphosphat-Ion'),
  ion('CrO4', -2, 'Chromat-Ion', 'gelb'),
  ion('Cr2O7', -2, 'Dichromat-Ion', 'orange'),
  ion('C2O4', -2, 'Oxalat-Ion'),
  ion('SiO3', -2, 'Silicat-Ion'),
  ion('O2', -2, 'Peroxid-Ion'),
  ion('B4O7', -2, 'Tetraborat-Ion'),
  ion('H', -1, 'Hydrid-Ion'),
  ion('NH2', -1, 'Amid-Ion'),
  ion('C2', -2, 'Carbid-Ion (Acetylid)'),
  ion('PO4', -3, 'Phosphat-Ion'),
  ion('N', -3, 'Nitrid-Ion'),
];

/**
 * Molekulare Stoffe, die formal zu einer Ionenkombination passen würden.
 * Wasser ließe sich als H⁺ und O²⁻ lesen – das wäre chemisch irreführend.
 */
const NOT_SALTS = new Set(['H2O', 'H2O2', 'H2S', 'NH3', 'CH4', 'HF', 'HCl', 'HBr', 'HI', 'HCN']);

export interface SaltComposition {
  cation: Ion;
  anion: Ion;
  /** Zahl der Kationen in der Formeleinheit */
  cationCount: number;
  /** Zahl der Anionen in der Formeleinheit */
  anionCount: number;
  /** Kristallwasser je Formeleinheit */
  hydrate: number;
  /** Formel ohne Kristallwasser */
  anhydrous: string;
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

/** Summenformel aus Ionen und Anzahlen, in Hill-Notation als Vergleichsschlüssel. */
function combinedKey(cation: Ion, cationCount: number, anion: Ion, anionCount: number): string | null {
  const counts: Record<string, number> = {};
  try {
    for (const [ionFormula, count] of [
      [cation.formula, cationCount],
      [anion.formula, anionCount],
    ] as const) {
      const parsed = parseFormula(ionFormula);
      for (const [element, amount] of Object.entries(parsed.counts)) {
        counts[element] = (counts[element] ?? 0) + amount * count;
      }
    }
  } catch {
    return null;
  }
  return toHillFormula(counts);
}

/** Trennt Kristallwasser ab: "CuSO4·5H2O" → { rest: "CuSO4", hydrate: 5 }. */
export function splitHydrate(formula: string): { rest: string; hydrate: number } {
  const match = formula.match(/^(.*?)\s*[·*x]\s*(\d*)\s*H2O$/i);
  if (!match) return { rest: formula, hydrate: 0 };
  return { rest: match[1], hydrate: match[2] ? Number(match[2]) : 1 };
}

const compositionCache = new Map<string, SaltComposition | null>();

/**
 * Zerlegt die Formel eines Salzes in seine Ionen.
 * Liefert null, wenn keine Kombination bekannter Ionen zur Formel passt.
 */
export function splitSalt(formula: string): SaltComposition | null {
  const cached = compositionCache.get(formula);
  if (cached !== undefined) return cached;

  const { rest, hydrate } = splitHydrate(formula);
  if (NOT_SALTS.has(rest)) {
    compositionCache.set(formula, null);
    return null;
  }

  let target: string;
  try {
    const parsed = parseFormula(rest);
    if (parsed.charge !== 0) {
      compositionCache.set(formula, null);
      return null;
    }
    target = toHillFormula(parsed.counts);
  } catch {
    compositionCache.set(formula, null);
    return null;
  }

  for (const cation of CATIONS) {
    for (const anion of ANIONS) {
      // Ladungsausgleich über das kleinste gemeinsame Vielfache
      const total = (cation.charge * Math.abs(anion.charge)) / gcd(cation.charge, Math.abs(anion.charge));
      const cationCount = total / cation.charge;
      const anionCount = total / Math.abs(anion.charge);
      if (combinedKey(cation, cationCount, anion, anionCount) !== target) continue;

      const result: SaltComposition = {
        cation,
        anion,
        cationCount,
        anionCount,
        hydrate,
        anhydrous: rest,
      };
      compositionCache.set(formula, result);
      return result;
    }
  }

  compositionCache.set(formula, null);
  return null;
}

/** Baut aus Kation und Anion die Formel des Salzes. */
export function saltFormula(cation: Ion, anion: Ion): string {
  const total = (cation.charge * Math.abs(anion.charge)) / gcd(cation.charge, Math.abs(anion.charge));
  const cationCount = total / cation.charge;
  const anionCount = total / Math.abs(anion.charge);

  const part = (ionEntry: Ion, count: number): string => {
    if (count === 1) return ionEntry.formula;
    // Mehratomige Ionen brauchen Klammern: Ca(NO3)2, Fe(OH)3 und Fe2(O2)3,
    // nicht CaNO32, FeOH3 oder Fe2O23.
    const polyatomic = /[A-Z].*[A-Z]|\d/.test(ionEntry.formula);
    return polyatomic ? `(${ionEntry.formula})${count}` : `${ionEntry.formula}${count}`;
  };

  return `${part(cation, cationCount)}${part(anion, anionCount)}`;
}

export type Solubility = 'löslich' | 'schwer löslich' | 'unlöslich';

export interface SolubilityInfo {
  solubility: Solubility;
  /** Farbe des Niederschlags, falls charakteristisch */
  color?: string;
  note?: string;
}

/** Ionen, deren Salze durchweg löslich sind. */
const ALWAYS_SOLUBLE_CATIONS = new Set(['Li', 'Na', 'K', 'NH4', 'H']);
const ALWAYS_SOLUBLE_ANIONS = new Set(['NO3', 'ClO3', 'ClO4', 'CH3COO', 'NO2']);

/** Ausnahmen je Anion: Kationen, deren Salz nicht löslich ist. */
const EXCEPTIONS: Record<string, Record<string, SolubilityInfo>> = {
  Cl: {
    Ag: { solubility: 'unlöslich', color: 'weiß', note: 'löst sich in Ammoniak wieder auf' },
    Pb: { solubility: 'schwer löslich', color: 'weiß', note: 'in heißem Wasser löslich' },
    Hg: { solubility: 'unlöslich', color: 'weiß' },
  },
  Br: {
    Ag: { solubility: 'unlöslich', color: 'blassgelb' },
    Pb: { solubility: 'schwer löslich', color: 'weiß' },
  },
  I: {
    Ag: { solubility: 'unlöslich', color: 'gelb' },
    Pb: { solubility: 'unlöslich', color: 'goldgelb', note: 'Goldregen-Versuch' },
  },
  SO4: {
    Ba: { solubility: 'unlöslich', color: 'weiß', note: 'Nachweis für Sulfat-Ionen' },
    Pb: { solubility: 'unlöslich', color: 'weiß' },
    Sr: { solubility: 'unlöslich', color: 'weiß' },
    Ca: { solubility: 'schwer löslich', color: 'weiß', note: 'als Gips bekannt' },
    Ag: { solubility: 'schwer löslich', color: 'weiß' },
  },
  OH: {
    Ca: { solubility: 'schwer löslich', color: 'weiß', note: 'gesättigte Lösung ist Kalkwasser' },
    Ba: { solubility: 'löslich' },
    Sr: { solubility: 'löslich' },
    Mg: { solubility: 'unlöslich', color: 'weiß' },
    Al: { solubility: 'unlöslich', color: 'weiß', note: 'gallertig, löst sich im Basenüberschuss' },
    Zn: { solubility: 'unlöslich', color: 'weiß', note: 'löst sich im Basenüberschuss' },
    Fe: { solubility: 'unlöslich', color: 'rotbraun' },
    Cu: { solubility: 'unlöslich', color: 'hellblau' },
    Ni: { solubility: 'unlöslich', color: 'grün' },
    Co: { solubility: 'unlöslich', color: 'blau' },
    Mn: { solubility: 'unlöslich', color: 'blassrosa' },
    Cr: { solubility: 'unlöslich', color: 'graugrün' },
    Pb: { solubility: 'unlöslich', color: 'weiß' },
    Ag: { solubility: 'unlöslich', color: 'braun', note: 'zerfällt zu Silberoxid' },
  },
  S: {
    Ca: { solubility: 'löslich' },
    Ba: { solubility: 'löslich' },
    Sr: { solubility: 'löslich' },
    Mg: { solubility: 'löslich' },
    Fe: { solubility: 'unlöslich', color: 'schwarz' },
    Cu: { solubility: 'unlöslich', color: 'schwarz' },
    Pb: { solubility: 'unlöslich', color: 'schwarz' },
    Ag: { solubility: 'unlöslich', color: 'schwarz' },
    Zn: { solubility: 'unlöslich', color: 'weiß' },
    Cd: { solubility: 'unlöslich', color: 'gelb' },
    Mn: { solubility: 'unlöslich', color: 'fleischfarben' },
    Ni: { solubility: 'unlöslich', color: 'schwarz' },
    Co: { solubility: 'unlöslich', color: 'schwarz' },
  },
  CrO4: {
    Ag: { solubility: 'unlöslich', color: 'rotbraun' },
    Pb: { solubility: 'unlöslich', color: 'gelb', note: 'Pigment Chromgelb' },
    Ba: { solubility: 'unlöslich', color: 'gelb' },
  },
  C2O4: {
    Ca: { solubility: 'unlöslich', color: 'weiß', note: 'Bestandteil von Nierensteinen' },
    Ba: { solubility: 'unlöslich', color: 'weiß' },
    Pb: { solubility: 'unlöslich', color: 'weiß' },
  },
};

/** Anionen, deren Salze nur mit Alkali- und Ammonium-Ionen löslich sind. */
const MOSTLY_INSOLUBLE: Record<string, SolubilityInfo> = {
  CO3: { solubility: 'unlöslich', color: 'weiß' },
  PO4: { solubility: 'unlöslich', color: 'weiß' },
  SO3: { solubility: 'unlöslich', color: 'weiß' },
  SiO3: { solubility: 'unlöslich', color: 'weiß' },
  O: { solubility: 'unlöslich', note: 'Oxide sind in Wasser praktisch unlöslich' },
  F: { solubility: 'unlöslich', color: 'weiß' },
};

/** Löslichkeit eines Salzes in Wasser nach den üblichen Regeln. */
export function solubility(cation: Ion, anion: Ion): SolubilityInfo {
  const exception = EXCEPTIONS[anion.formula]?.[cation.formula];
  if (exception) return exception;

  if (ALWAYS_SOLUBLE_CATIONS.has(cation.formula)) return { solubility: 'löslich' };
  if (ALWAYS_SOLUBLE_ANIONS.has(anion.formula)) return { solubility: 'löslich' };

  const mostlyInsoluble = MOSTLY_INSOLUBLE[anion.formula];
  if (mostlyInsoluble) return mostlyInsoluble;

  return { solubility: 'löslich' };
}

/** Löslichkeit direkt aus der Formel eines Salzes. */
export function solubilityOf(formula: string): SolubilityInfo | null {
  const composition = splitSalt(formula);
  if (!composition) return null;
  return solubility(composition.cation, composition.anion);
}

export function isSoluble(formula: string): boolean {
  return solubilityOf(formula)?.solubility === 'löslich';
}

/**
 * Stellung der Metalle in der Spannungsreihe.
 * Kleinere Werte bedeuten unedler; Wasserstoff liegt bei 0.
 */
export const METAL_SERIES: Record<string, number> = {
  Li: -3.04,
  K: -2.93,
  Ca: -2.87,
  Na: -2.71,
  Mg: -2.37,
  Al: -1.66,
  Mn: -1.19,
  Zn: -0.76,
  Cr: -0.74,
  Fe: -0.44,
  Cd: -0.4,
  Co: -0.28,
  Ni: -0.26,
  Sn: -0.14,
  Pb: -0.13,
  H: 0,
  Cu: 0.34,
  Ag: 0.8,
  Hg: 0.85,
  Pt: 1.18,
  Au: 1.5,
};

/** Ist das Metall unedler als Wasserstoff (löst sich also in Säuren)? */
export function dissolvesInAcid(symbol: string): boolean {
  const potential = METAL_SERIES[symbol];
  return potential !== undefined && potential < 0;
}

/** Verdrängt das erste Metall das zweite aus seiner Salzlösung? */
export function displaces(metal: string, other: string): boolean {
  const a = METAL_SERIES[metal];
  const b = METAL_SERIES[other];
  return a !== undefined && b !== undefined && a < b;
}
