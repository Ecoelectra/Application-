/**
 * Oxidationszahlen und Redox-Gleichungen nach der Halbreaktionsmethode.
 *
 * Die Halbreaktionen werden in der klassischen Reihenfolge ausgeglichen:
 * Hauptelement → Sauerstoff über H2O → Wasserstoff über H+ → Ladung über e-.
 * Im basischen Milieu werden die H+ anschließend mit OH- neutralisiert.
 */
import { parseFormula } from './formula';
import { ELEMENT_BY_SYMBOL, isMetal } from './elements';

export type Medium = 'sauer' | 'basisch' | 'neutral';

export interface HalfReaction {
  /** Stoff -> Koeffizient auf der linken Seite */
  left: Record<string, number>;
  right: Record<string, number>;
  /** Anzahl übertragener Elektronen (immer positiv) */
  electrons: number;
  /** 'Reduktion' = Elektronen links, 'Oxidation' = Elektronen rechts */
  kind: 'Reduktion' | 'Oxidation';
  equation: string;
}

export interface RedoxResult {
  oxidation: HalfReaction;
  reduction: HalfReaction;
  equation: string;
  transferredElectrons: number;
}

/** Elektronegativität nach Pauling für die häufigsten Elemente. */
const ELECTRONEGATIVITY: Record<string, number> = {
  H: 2.20, Li: 0.98, Be: 1.57, B: 2.04, C: 2.55, N: 3.04, O: 3.44, F: 3.98,
  Na: 0.93, Mg: 1.31, Al: 1.61, Si: 1.90, P: 2.19, S: 2.58, Cl: 3.16,
  K: 0.82, Ca: 1.00, Ti: 1.54, V: 1.63, Cr: 1.66, Mn: 1.55, Fe: 1.83,
  Co: 1.88, Ni: 1.91, Cu: 1.90, Zn: 1.65, Ga: 1.81, Ge: 2.01, As: 2.18,
  Se: 2.55, Br: 2.96, Rb: 0.82, Sr: 0.95, Ag: 1.93, Cd: 1.69, Sn: 1.96,
  Sb: 2.05, Te: 2.10, I: 2.66, Cs: 0.79, Ba: 0.89, Pt: 2.28, Au: 2.54,
  Hg: 2.00, Tl: 1.62, Pb: 2.33, Bi: 2.02,
};

/** Stoffe, bei denen die Standardregeln nicht greifen. */
const SPECIAL_OXIDATION_STATES: Record<string, Record<string, number>> = {
  'H2O2': { H: 1, O: -1 },
  'Na2O2': { Na: 1, O: -1 },
  'BaO2': { Ba: 2, O: -1 },
  'KO2': { K: 1, O: -0.5 },
  'OF2': { O: 2, F: -1 },
  'O2F2': { O: 1, F: -1 },
  'NaH': { Na: 1, H: -1 },
  'LiH': { Li: 1, H: -1 },
  'CaH2': { Ca: 2, H: -1 },
  'NaBH4': { Na: 1, B: 3, H: -1 },
  'LiAlH4': { Li: 1, Al: 3, H: -1 },
};

/**
 * Bestimmt die Oxidationszahlen einer Spezies.
 * Ein einzelnes unbekanntes Element wird aus der Ladungsbilanz berechnet;
 * Werte können gebrochen sein (z. B. Fe3O4 → +8/3).
 */
export function oxidationStates(formula: string): Record<string, number> | null {
  const { counts, charge } = parseFormula(formula);
  const elements = Object.keys(counts);

  const special = SPECIAL_OXIDATION_STATES[formula.replace(/\s/g, '')];
  if (special) return special;

  // Element in Reinform (H2, O2, Fe, S8, ...)
  if (elements.length === 1) {
    const only = elements[0];
    return { [only]: charge / counts[only] };
  }

  const known: Record<string, number> = {};
  const unknown: string[] = [];

  for (const element of elements) {
    if (element === 'F') known.F = -1;
    else if (isAlkali(element)) known[element] = 1;
    else if (isAlkalineEarth(element)) known[element] = 2;
    // Hydrid nur in Verbindungen aus Metall und Wasserstoff (NaH, CaH2) – nicht in NaOH
    else if (element === 'H') known.H = elements.every((e) => e === 'H' || isMetal(e)) ? -1 : 1;
    else if (element === 'O') known.O = -2;
    else unknown.push(element);
  }

  // Halogene sind -1, solange kein elektronegativerer Partner vorhanden ist
  let defaultHalogen: string | undefined;
  for (const element of [...unknown]) {
    if (['Cl', 'Br', 'I'].includes(element)) {
      const moreElectronegative = elements.some(
        (e) => e !== element && (ELECTRONEGATIVITY[e] ?? 0) > (ELECTRONEGATIVITY[element] ?? 0),
      );
      if (!moreElectronegative) {
        known[element] = -1;
        defaultHalogen = element;
        unknown.splice(unknown.indexOf(element), 1);
      }
    }
  }

  if (unknown.length === 0) {
    const sum = Object.entries(known).reduce((total, [element, state]) => total + state * counts[element], 0);
    if (sum === charge || !defaultHalogen) return known;
    // Polyhalogenide wie KI3: das Halogen trägt den Rest der Ladung (I: −1/3)
    delete known[defaultHalogen];
    unknown.push(defaultHalogen);
  }
  if (unknown.length > 1) {
    // Mehrdeutig (z. B. organische Verbindungen mit mehreren Zentralatomen)
    return null;
  }

  const target = unknown[0];
  const knownSum = Object.entries(known).reduce(
    (sum, [element, state]) => sum + state * counts[element],
    0,
  );
  return { ...known, [target]: (charge - knownSum) / counts[target] };
}

function isAlkali(symbol: string): boolean {
  const el = ELEMENT_BY_SYMBOL.get(symbol);
  return el?.category === 'Alkalimetall';
}

function isAlkalineEarth(symbol: string): boolean {
  const el = ELEMENT_BY_SYMBOL.get(symbol);
  return el?.category === 'Erdalkalimetall';
}

/** Formatiert eine Oxidationszahl als ±-Wert, auch gebrochen. */
export function formatOxidationState(value: number): string {
  const sign = value > 0 ? '+' : value < 0 ? '−' : '±';
  const magnitude = Math.abs(value);
  if (Number.isInteger(magnitude)) return `${sign}${magnitude}`;
  const thirds = magnitude * 3;
  if (Number.isInteger(thirds)) return `${sign}${thirds}/3`;
  return `${sign}${magnitude.toFixed(2)}`;
}

function addSpecies(target: Record<string, number>, formula: string, amount: number): void {
  if (amount === 0) return;
  target[formula] = (target[formula] ?? 0) + amount;
  if (target[formula] === 0) delete target[formula];
}

function chargeOf(species: Record<string, number>): number {
  return Object.entries(species).reduce(
    (sum, [formula, coeff]) => sum + parseFormula(formula).charge * coeff,
    0,
  );
}

function elementCount(species: Record<string, number>, element: string): number {
  return Object.entries(species).reduce(
    (sum, [formula, coeff]) => sum + (parseFormula(formula).counts[element] ?? 0) * coeff,
    0,
  );
}

function formatSide(species: Record<string, number>, electrons: number): string {
  const parts = Object.entries(species).map(([formula, coeff]) =>
    coeff === 1 ? formula : `${coeff} ${formula}`,
  );
  if (electrons > 0) parts.push(electrons === 1 ? 'e-' : `${electrons} e-`);
  return parts.join(' + ') || '0';
}

/**
 * Gleicht eine Halbreaktion aus, z. B. balanceHalfReaction('MnO4^-', 'Mn2+', 'sauer')
 * → MnO4- + 8 H+ + 5 e- → Mn2+ + 4 H2O
 */
export function balanceHalfReaction(
  educt: string,
  product: string,
  medium: Medium = 'sauer',
): HalfReaction {
  const left: Record<string, number> = {};
  const right: Record<string, number> = {};
  addSpecies(left, educt, 1);
  addSpecies(right, product, 1);

  const eductCounts = parseFormula(educt).counts;
  const productCounts = parseFormula(product).counts;

  // 1. Hauptelemente (außer H und O) ausgleichen
  const mainElements = Array.from(
    new Set([...Object.keys(eductCounts), ...Object.keys(productCounts)]),
  ).filter((e) => e !== 'H' && e !== 'O');

  for (const element of mainElements) {
    const inEduct = eductCounts[element] ?? 0;
    const inProduct = productCounts[element] ?? 0;
    if (inEduct === 0 || inProduct === 0) {
      throw new Error(
        `Das Element ${element} kommt nur auf einer Seite vor – bitte Edukt und Produkt prüfen.`,
      );
    }
    if (inEduct !== inProduct) {
      const factorLeft = inProduct / gcdNumber(inEduct, inProduct);
      const factorRight = inEduct / gcdNumber(inEduct, inProduct);
      left[educt] = (left[educt] ?? 1) * factorLeft;
      right[product] = (right[product] ?? 1) * factorRight;
    }
  }

  // 2. Sauerstoff über Wasser ausgleichen
  const oxygenDiff = elementCount(left, 'O') - elementCount(right, 'O');
  if (oxygenDiff > 0) addSpecies(right, 'H2O', oxygenDiff);
  else if (oxygenDiff < 0) addSpecies(left, 'H2O', -oxygenDiff);

  // 3. Wasserstoff über Protonen ausgleichen
  const hydrogenDiff = elementCount(left, 'H') - elementCount(right, 'H');
  if (hydrogenDiff > 0) addSpecies(right, 'H+', hydrogenDiff);
  else if (hydrogenDiff < 0) addSpecies(left, 'H+', -hydrogenDiff);

  // 4. Ladung über Elektronen ausgleichen
  const chargeDiff = chargeOf(left) - chargeOf(right);
  const electrons = Math.abs(chargeDiff);
  const kind: 'Reduktion' | 'Oxidation' = chargeDiff > 0 ? 'Reduktion' : 'Oxidation';

  // 5. Im Basischen die Protonen mit Hydroxid neutralisieren
  if (medium === 'basisch') {
    const protonsLeft = left['H+'] ?? 0;
    const protonsRight = right['H+'] ?? 0;
    const protons = protonsLeft || protonsRight;
    if (protons > 0) {
      // n OH- auf beiden Seiten ergänzen: H+ + OH- wird zu H2O
      if (protonsLeft > 0) {
        delete left['H+'];
        addSpecies(left, 'H2O', protons);
        addSpecies(right, 'OH-', protons);
      } else {
        delete right['H+'];
        addSpecies(right, 'H2O', protons);
        addSpecies(left, 'OH-', protons);
      }
      cancelCommon(left, right, 'H2O');
    }
  }

  const leftText = formatSide(left, kind === 'Reduktion' ? electrons : 0);
  const rightText = formatSide(right, kind === 'Oxidation' ? electrons : 0);

  return {
    left,
    right,
    electrons,
    kind,
    equation: `${leftText} → ${rightText}`,
  };
}

function cancelCommon(
  left: Record<string, number>,
  right: Record<string, number>,
  formula: string,
): void {
  const shared = Math.min(left[formula] ?? 0, right[formula] ?? 0);
  if (shared > 0) {
    addSpecies(left, formula, -shared);
    addSpecies(right, formula, -shared);
  }
}

function gcdNumber(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y) [x, y] = [y, x % y];
  return x || 1;
}

/**
 * Kombiniert zwei Halbreaktionen zur Gesamtgleichung; die Elektronen werden
 * über das kleinste gemeinsame Vielfache abgeglichen.
 */
export function combineHalfReactions(
  oxidation: HalfReaction,
  reduction: HalfReaction,
): RedoxResult {
  if (oxidation.kind !== 'Oxidation' || reduction.kind !== 'Reduktion') {
    throw new Error('Es werden genau eine Oxidation und eine Reduktion benötigt.');
  }
  const electrons =
    (oxidation.electrons * reduction.electrons) /
    gcdNumber(oxidation.electrons, reduction.electrons);
  const oxFactor = electrons / oxidation.electrons;
  const redFactor = electrons / reduction.electrons;

  const left: Record<string, number> = {};
  const right: Record<string, number> = {};

  for (const [formula, coeff] of Object.entries(oxidation.left)) addSpecies(left, formula, coeff * oxFactor);
  for (const [formula, coeff] of Object.entries(oxidation.right)) addSpecies(right, formula, coeff * oxFactor);
  for (const [formula, coeff] of Object.entries(reduction.left)) addSpecies(left, formula, coeff * redFactor);
  for (const [formula, coeff] of Object.entries(reduction.right)) addSpecies(right, formula, coeff * redFactor);

  // auf beiden Seiten vorhandene Stoffe kürzen (typisch: H2O, H+)
  for (const formula of Object.keys({ ...left })) cancelCommon(left, right, formula);

  return {
    oxidation,
    reduction,
    transferredElectrons: electrons,
    equation: `${formatSide(left, 0)} → ${formatSide(right, 0)}`,
  };
}

/** Komplettlösung: zwei Redoxpaare zur Gesamtgleichung verrechnen. */
export function balanceRedox(
  oxidationPair: { from: string; to: string },
  reductionPair: { from: string; to: string },
  medium: Medium = 'sauer',
): RedoxResult {
  const oxidation = balanceHalfReaction(oxidationPair.from, oxidationPair.to, medium);
  const reduction = balanceHalfReaction(reductionPair.from, reductionPair.to, medium);
  return combineHalfReactions(oxidation, reduction);
}
