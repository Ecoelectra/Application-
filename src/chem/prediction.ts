/**
 * Vorhersage für ein Stoffpaar, für das keine Regel, Vorlage oder belegte
 * Reaktion greift.
 *
 * Die Werkbank soll für jedes Paar sagen, was passiert – auch wenn das nur
 * eine Abschätzung ist. Geprüft wird der Reihe nach:
 *
 *  1. Redoxreaktion über die Standardpotentiale: Liefert ein Stoff das
 *     Oxidationsmittel eines Redoxpaares und der andere das Reduktionsmittel
 *     eines Paares mit deutlich kleinerem Potential, läuft die Reaktion
 *     thermodynamisch freiwillig ab (ΔG = −z·F·ΔE < 0).
 *  2. Säure-Base-Reaktion über pKs-Werte: Das Proton wandert, wenn die Säure
 *     stärker ist als die konjugierte Säure der Base (K = 10^ΔpKs).
 *  3. Unedle Metalle mit protischen Stoffen (Alkohole, Phenole, Amine):
 *     Wasserstoffentwicklung.
 *  4. Starke Oxidationsmittel mit oxidierbaren organischen Stoffen.
 *  5. Sonst eine physikalische Aussage: löst sich, mischt sich, bildet zwei
 *     Phasen, Feststoffgemenge – und warum keine Reaktion zu erwarten ist.
 *
 * Alle Ergebnisse sind Vorhersagen und tragen eine Einschätzung ihrer
 * Verlässlichkeit.
 */
import type { MainModule } from '@rdkit/rdkit';
import { balanceSpecies } from './balance';
import { prettySpecies } from './complexes';
import { parseFormula, toHillFormula } from './formula';
import { elementBySymbol } from './elements';
import { ANIONS, CATIONS, dissolvesInAcid, solubility, splitHydrate, splitSalt } from './ions';
import { physicalProperties, stateAt, type PhaseState } from './phase';
import { matchSmarts, withMol } from './rdkit';
import { balanceRedox, type Medium } from './redox';
import { STANDARD_POTENTIALS } from '../data/potentials';
import { SUBSTANCES } from '../data/substances';
import type { SafetyLevel, Substance } from '../data/types';

export type Confidence = 'hoch' | 'mittel' | 'gering';

export interface PairPrediction {
  id: string;
  /** chemische Reaktion oder nur physikalisches Verhalten */
  chemical: boolean;
  kind: 'anorganisch' | 'organisch' | 'physikalisch';
  title: string;
  reactionType: string;
  equation: string;
  observation: string;
  explanation: string;
  conditions: string;
  confidence: Confidence;
  /** Modell, auf dem die Vorhersage beruht */
  model: string;
  products: Array<{ formula?: string; name?: string; smiles?: string; substanceId?: string }>;
  missing: string[];
  hazards: string[];
  safetyLevel: SafetyLevel;
  participants: [string, string];
  /** ausgeglichene Gleichung in Summenformeln, für Tests */
  balancedFormulas?: string;
}

export interface PredictionContext {
  temperature: number;
  pressure: number;
  aqueous: boolean;
  /** Reaktionen dieses Paares, denen unter den Bedingungen etwas fehlt */
  blocked: Array<{ title: string; missing: string[] }>;
}

// ---------------------------------------------------------------------
// Hilfsfunktionen
// ---------------------------------------------------------------------

function speciesKey(formula: string): string | null {
  try {
    const parsed = parseFormula(formula);
    return `${toHillFormula(parsed.counts)}|${parsed.charge}`;
  } catch {
    return null;
  }
}

function asIon(formula: string, charge: number): string {
  if (!charge) return formula;
  const magnitude = Math.abs(charge);
  return `${formula}^${magnitude === 1 ? '' : magnitude}${charge > 0 ? '+' : '-'}`;
}

/** Formel nach Abgabe (−1) oder Aufnahme (+1) eines Protons. */
function shiftProton(formula: string, delta: 1 | -1): string {
  const parsed = parseFormula(formula);
  const counts: Record<string, number> = { ...parsed.counts, H: (parsed.counts.H ?? 0) + delta };
  if (counts.H <= 0) delete counts.H;
  return asIon(toHillFormula(counts), parsed.charge + delta);
}

function isIonic(substance: Substance): boolean {
  return !substance.smiles || /[+-]\]/.test(substance.smiles);
}

function isWater(substance: Substance): boolean {
  return substance.id === 'wasser' || substance.formula === 'H2O';
}

function isOrganic(substance: Substance): boolean {
  if (!substance.smiles || isIonic(substance)) return false;
  try {
    const counts = parseFormula(substance.formula).counts;
    return Boolean(counts.C && counts.H);
  } catch {
    return false;
  }
}

function has(rdkit: MainModule | null, substance: Substance, smarts: string): boolean {
  return Boolean(rdkit && substance.smiles && matchSmarts(rdkit, substance.smiles, smarts).length);
}

function writeEquation(left: string[], right: string[], arrow = '→'): { text: string; ascii: string } | null {
  try {
    const result = balanceSpecies(left, right);
    const side = (entries: Array<{ formula: string; coefficient: number }>, pretty: boolean) =>
      entries
        .map((entry) => `${entry.coefficient > 1 ? `${entry.coefficient} ` : ''}${pretty ? prettySpecies(entry.formula) : entry.formula}`)
        .join(' + ');
    return {
      text: `${side(result.reactants, true)} ${arrow} ${side(result.products, true)}`,
      ascii: `${side(result.reactants, false)} → ${side(result.products, false)}`,
    };
  } catch {
    return null;
  }
}

/** Schreibt Ionen einheitlich mit Dach: "Cu2+" → "Cu^2+", "NO3-" → "NO3^-". */
function caretSpecies(species: string): string {
  if (species.includes('^')) return species;
  const monatomic = species.match(/^([A-Z][a-z]?)(\d*)([+-])$/);
  if (monatomic) return `${monatomic[1]}^${monatomic[2]}${monatomic[3]}`;
  const polyatomic = species.match(/^(.+?)([+-])$/);
  return polyatomic ? `${polyatomic[1]}^${polyatomic[2]}` : species;
}

const SPECIES_NAMES: Record<string, string> = {
  H2: 'Wasserstoff', O2: 'Sauerstoff', Cl2: 'Chlor', Br2: 'Brom', I2: 'Iod', CO2: 'Kohlenstoffdioxid',
  NO: 'Stickstoffmonoxid', NO2: 'Stickstoffdioxid', SO2: 'Schwefeldioxid', NH3: 'Ammoniak', S: 'Schwefel',
};

/** Name und, falls vorhanden, Datenbankeintrag zu einem Teilchen. */
function describeSpecies(species: string): PairPrediction['products'][number] {
  const [formula, charge = ''] = species.split('^');
  if (charge) {
    const sign = charge.endsWith('-') ? -1 : 1;
    const magnitude = Number(charge.slice(0, -1) || 1);
    const ion = [...CATIONS, ...ANIONS].find((entry) => entry.formula === formula && entry.charge === sign * magnitude);
    return { formula: species, name: ion?.name ?? prettySpecies(species) };
  }
  const known = SUBSTANCES.find((substance) => substance.formula === formula);
  const name = SPECIES_NAMES[formula] ?? known?.name ?? elementBySymbol(formula)?.name ?? prettySpecies(formula);
  return { formula, name, smiles: known?.smiles, substanceId: known?.id };
}

/** Produkte der rechten Gleichungsseite, ohne Wasser, Protonen und Hydroxid-Ionen. */
function productsOf(equation: string): PairPrediction['products'] {
  const right = equation.split(/\s*(?:→|⇌)\s*/)[1] ?? '';
  const seen = new Set<string>();
  const products: PairPrediction['products'] = [];
  for (const term of right.split(/\s\+\s/)) {
    const species = caretSpecies(term.trim().replace(/^\d+\s+/, ''));
    if (!species || ['H2O', 'H^+', 'OH^-', 'e^-'].includes(species) || seen.has(species)) continue;
    seen.add(species);
    products.push(describeSpecies(species));
  }
  return products;
}

/** Schreibt eine Gleichung aus Summenformeln mit tief- und hochgestellten Zeichen. */
function prettyEquation(equation: string): string {
  return equation
    .split(/(\s*(?:→|⇌)\s*)/)
    .map((part, index) =>
      index % 2
        ? part
        : part
            .split(/\s\+\s/)
            .map((term) => {
              const match = term.trim().match(/^(\d+\s+)?(.+)$/);
              return match ? `${match[1] ?? ''}${prettySpecies(match[2])}` : term;
            })
            .join(' + '),
    )
    .join('');
}

function formatNumber(value: number, digits = 2): string {
  return value.toLocaleString('de-DE', { maximumFractionDigits: digits, minimumFractionDigits: digits });
}

// ---------------------------------------------------------------------
// 1. Redox über Standardpotentiale
// ---------------------------------------------------------------------

interface Couple {
  ox: string;
  red: string;
  potential: number;
  electrons: number;
}

const COUPLES: Couple[] = STANDARD_POTENTIALS.map((entry) => ({
  ox: entry.oxidized,
  red: entry.reduced,
  potential: entry.potential,
  electrons: entry.electrons,
}));

const ACID_IDS = new Set([
  'salzsaeure', 'schwefelsaeure', 'salpetersaeure', 'phosphorsaeure', 'bromwasserstoffsaeure',
  'iodwasserstoffsaeure', 'flusssaeure', 'essigsaeure', 'kohlensaeure', 'schweflige-saeure',
]);

/** Teilchen, die ein Stoff für Redoxpaare liefert. */
function redoxSpecies(substance: Substance): Array<{ species: string; key: string }> {
  const result: Array<{ species: string; key: string }> = [];
  const push = (species: string) => {
    const key = speciesKey(species);
    if (key && !result.some((entry) => entry.key === key)) result.push({ species, key });
  };
  const formula = splitHydrate(substance.formula).rest;
  if (/^([A-Z][a-z]?)\d?$/.test(formula) || ['H2O2', 'O3'].includes(formula)) push(formula);
  if (substance.category === 'Säure' || ACID_IDS.has(substance.id)) push('H+');
  if (isIonic(substance)) {
    const salt = splitSalt(formula);
    if (salt && salt.cation.formula !== 'H') push(asIon(salt.cation.formula, salt.cation.charge));
    if (salt) push(asIon(salt.anion.formula, salt.anion.charge));
    if (formula === 'HCl') push('Cl-');
    if (formula === 'HBr') push('Br-');
    if (formula === 'HI') push('I-');
    if (formula === 'HNO3') push('NO3-');
  }
  return result;
}

const OBSERVATIONS: Record<string, string> = {
  'MnO4-': 'Die violette Farbe des Permanganats verschwindet.',
  'Cr2O7^2-': 'Die orange Lösung wird grün (Chrom(III)-Ionen).',
  I2: 'Iod färbt die Lösung braun.',
  Br2: 'Brom färbt die Lösung gelbbraun.',
  Cl2: 'Es riecht stechend nach Chlor.',
  'Fe3+': 'Die Lösung färbt sich gelblich (Eisen(III)-Ionen).',
  Cu: 'Es scheidet sich rotbraunes Kupfer ab.',
  Ag: 'Es scheidet sich graues Silber ab.',
  Au: 'Es scheidet sich Gold ab.',
  Hg: 'Es bilden sich Quecksilbertröpfchen.',
  H2: 'Es entwickeln sich Gasblasen (Wasserstoff).',
  O2: 'Es entwickelt sich Sauerstoff; ein glimmender Span flammt auf.',
  NO: 'Es entsteht farbloses Stickstoffmonoxid, das an der Luft zu braunem NO₂ reagiert.',
  'Mn2+': '',
};

function predictRedox(a: Substance, b: Substance): PairPrediction | null {
  const acidic = [a, b].some((substance) => substance.category === 'Säure' || ACID_IDS.has(substance.id));
  const basic = [a, b].some((substance) => ['Base'].includes(substance.category) || /OH\)?\d*$/.test(substance.formula));
  const medium: Medium = basic && !acidic ? 'basisch' : 'sauer';

  let best: { oxidizer: Substance; reducer: Substance; ox: Couple; red: Couple; delta: number } | null = null;
  for (const [oxidizer, reducer] of [[a, b], [b, a]] as const) {
    const oxSpecies = redoxSpecies(oxidizer);
    const redSpecies = redoxSpecies(reducer);
    for (const ox of COUPLES) {
      const oxKey = speciesKey(ox.ox);
      if (!oxSpecies.some((entry) => entry.key === oxKey)) continue;
      // Basische Paare nur in basischer Lösung und umgekehrt
      if (ox.red === 'OH-' && medium !== 'basisch') continue;
      for (const red of COUPLES) {
        const redKey = speciesKey(red.red);
        if (!redSpecies.some((entry) => entry.key === redKey)) continue;
        if (red === ox || red.ox === ox.ox) continue;
        if (red.red === 'OH-' || red.red === 'H2O') continue;
        const delta = ox.potential - red.potential;
        if (delta > 0.15 && (!best || delta > best.delta)) best = { oxidizer, reducer, ox, red, delta };
      }
    }
  }
  if (!best) return null;

  let equation: string;
  let electrons: number;
  try {
    const result = balanceRedox({ from: best.red.red, to: best.red.ox }, { from: best.ox.ox, to: best.ox.red }, medium);
    equation = result.equation;
    electrons = result.transferredElectrons;
  } catch {
    return null;
  }
  const leftSide = equation.split('→')[0];
  const needsAcid = /\bH\+/.test(leftSide) && !acidic;
  const gibbs = (-electrons * 96485 * best.delta) / 1000;
  const observation = [
    OBSERVATIONS[best.ox.ox] ?? '',
    OBSERVATIONS[best.ox.red] ?? '',
    OBSERVATIONS[best.red.ox] ?? '',
    /^[A-Z][a-z]?$/.test(best.red.red) ? `${best.reducer.name} löst sich auf.` : '',
  ]
    .filter(Boolean)
    .join(' ');

  return {
    id: `vorhersage-redox-${best.oxidizer.id}-${best.reducer.id}`,
    chemical: true,
    kind: 'anorganisch',
    title: `Redoxreaktion: ${best.oxidizer.name} oxidiert ${best.reducer.name}`,
    reactionType: 'Redoxreaktion (vorhergesagt)',
    equation: prettyEquation(equation),
    observation: observation || 'Die Stoffe setzen sich unter Elektronenübertragung um.',
    explanation: `${best.ox.ox}/${best.ox.red} hat mit E° = ${formatNumber(best.ox.potential)} V ein höheres Standardpotential als ${best.red.ox}/${best.red.red} (E° = ${formatNumber(best.red.potential)} V). Die Differenz von ${formatNumber(best.delta)} V macht die Reaktion freiwillig: ΔG° ≈ −z·F·ΔE ≈ ${formatNumber(gibbs, 0)} kJ/mol. Ob sie auch schnell abläuft, sagen die Potentiale nicht.`,
    conditions: `${medium === 'basisch' ? 'alkalische' : 'saure'} wässrige Lösung, Raumtemperatur`,
    confidence: best.delta > 0.5 ? 'hoch' : 'mittel',
    model: 'Standardpotentiale (Spannungsreihe)',
    products: productsOf(equation),
    missing: needsAcid ? ['Säure nötig: Die Reaktion verbraucht H⁺-Ionen und läuft vollständig nur in saurer Lösung.'] : [],
    hazards: [],
    safetyLevel: 'Laborpraktikum',
    participants: [a.id, b.id],
  };
}

// ---------------------------------------------------------------------
// 2. Säure-Base über pKs-Werte
// ---------------------------------------------------------------------

interface AcidInfo {
  pKa: number;
  acid: string;
  base: string;
  label: string;
}

interface BaseInfo {
  pKaH: number;
  base: string;
  acid: string;
  label: string;
}

const INORGANIC_ACIDS: Record<string, number> = {
  HCl: -6, HBr: -9, HI: -10, HNO3: -1.4, H2SO4: -3, H3PO4: 2.1, HF: 3.2, H2CO3: 6.35, H2SO3: 1.8, H2S: 7, H3BO3: 9.2,
};

const ORGANIC_ACID_PKA: Record<string, number> = {
  trifluoressigsaeure: 0.5, trichloressigsaeure: 0.7, oxalsaeure: 1.3, chloressigsaeure: 2.9, ameisensaeure: 3.75,
  essigsaeure: 4.76, benzoesaeure: 4.2, salicylsaeure: 3.0, citronensaeure: 3.1, milchsaeure: 3.9, ascorbinsaeure: 4.1,
  '4-nitrophenol': 7.2, acetylaceton: 9.0,
};

/** Säurestärke eines Stoffes (kleinster pKs-Wert seiner sauren Gruppen). */
export function acidInfo(rdkit: MainModule | null, substance: Substance): AcidInfo | null {
  const formula = splitHydrate(substance.formula).rest;
  if (INORGANIC_ACIDS[formula] !== undefined && (!substance.smiles || formula === 'HF' || formula === 'H2S')) {
    return { pKa: INORGANIC_ACIDS[formula], acid: formula, base: shiftProton(formula, -1), label: substance.name };
  }
  if (isIonic(substance)) {
    const salt = splitSalt(formula);
    if (!salt) return null;
    if (salt.cation.formula === 'NH4') return { pKa: 9.25, acid: 'NH4^+', base: 'NH3', label: 'Ammonium-Ion' };
    const anionAcids: Record<string, [number, string, string]> = {
      HSO4: [1.99, 'HSO4^-', 'SO4^2-'],
      H2PO4: [7.2, 'H2PO4^-', 'HPO4^2-'],
      HCO3: [10.3, 'HCO3^-', 'CO3^2-'],
    };
    const entry = anionAcids[salt.anion.formula];
    return entry ? { pKa: entry[0], acid: entry[1], base: entry[2], label: salt.anion.name } : null;
  }
  if (!rdkit || !substance.smiles) return null;
  const named = ORGANIC_ACID_PKA[substance.id];
  const patterns: Array<[string, number]> = [
    ['[SX4](=O)(=O)[OX2H1]', -1],
    ['[CX3](=O)[OX2H1]', 4.5],
    ['[OX2H1]c1ccc(cc1)[N+](=O)[O-]', 7.2],
    ['[OX2H1]c', 10],
    ['[NH1](C=O)C=O', 9.6],
    ['[SX2H1]', 10.5],
    ['[CH2](C=O)C=O', 10.7],
    ['[OX2H1][CX4]', 16],
    ['[CH1]#C', 25],
  ];
  for (const [smarts, pKa] of patterns) {
    if (matchSmarts(rdkit, substance.smiles, smarts).length) {
      return { pKa: named ?? pKa, acid: substance.formula, base: shiftProton(substance.formula, -1), label: substance.name };
    }
  }
  return null;
}

const ANION_BASES: Record<string, [number, string, string]> = {
  OH: [15.7, 'OH^-', 'H2O'],
  O: [17, 'O^2-', 'OH^-'],
  H: [35, 'H^-', 'H2'],
  NH2: [38, 'NH2^-', 'NH3'],
  CO3: [10.3, 'CO3^2-', 'HCO3^-'],
  HCO3: [6.35, 'HCO3^-', 'H2CO3'],
  PO4: [12.3, 'PO4^3-', 'HPO4^2-'],
  HPO4: [7.2, 'HPO4^2-', 'H2PO4^-'],
  CH3COO: [4.76, 'C2H3O2^-', 'C2H4O2'],
  S: [13, 'S^2-', 'HS^-'],
  SO3: [7.2, 'SO3^2-', 'HSO3^-'],
  CN: [9.2, 'CN^-', 'HCN'],
  F: [3.2, 'F^-', 'HF'],
  NO2: [3.3, 'NO2^-', 'HNO2'],
  C2O4: [4.3, 'C2O4^2-', 'HC2O4^-'],
};

/** Basenstärke eines Stoffes als pKs der konjugierten Säure. */
export function baseInfo(rdkit: MainModule | null, substance: Substance): BaseInfo | null {
  const formula = splitHydrate(substance.formula).rest;
  if (formula === 'NH3') return { pKaH: 9.25, base: 'NH3', acid: 'NH4^+', label: 'Ammoniak' };
  if (isIonic(substance)) {
    // organische Salze: Carboxylate und Alkoholate
    if (rdkit && substance.smiles) {
      if (matchSmarts(rdkit, substance.smiles, '[OX1-][CX3]=O').length) {
        const anion = substance.smiles.split('.').find((part) => part.includes('-'));
        const counts = anion ? parseFormula(anionFormula(rdkit, anion) ?? '').counts : null;
        if (counts) {
          const ion = asIon(toHillFormula(counts), -1);
          return { pKaH: 4.5, base: ion, acid: shiftProton(ion, 1), label: 'Carboxylat-Ion' };
        }
      }
      if (matchSmarts(rdkit, substance.smiles, '[OX1-][CX4]').length) {
        const anion = substance.smiles.split('.').find((part) => part.includes('-'));
        const counts = anion ? parseFormula(anionFormula(rdkit, anion) ?? '').counts : null;
        if (counts) {
          const ion = asIon(toHillFormula(counts), -1);
          return { pKaH: 16.5, base: ion, acid: shiftProton(ion, 1), label: 'Alkoholat-Ion' };
        }
      }
    }
    const salt = splitSalt(formula);
    const entry = salt ? ANION_BASES[salt.anion.formula] : undefined;
    if (!entry || !salt) return null;
    // Oxide nur von Alkali- und Erdalkalimetallen reagieren basisch mit Wasser und Säuren
    if (salt.anion.formula === 'O' && !['Li', 'Na', 'K', 'Ca', 'Ba', 'Mg', 'Sr'].includes(salt.cation.formula)) return null;
    return { pKaH: entry[0], base: entry[1], acid: entry[2], label: salt.anion.name };
  }
  if (!rdkit || !substance.smiles) return null;
  const patterns: Array<[string, number]> = [
    ['[NX3;H2,H1,H0;!$(N[C,S,P]=[O,S,N]);!$(N-a);!$(N-[#7,#8]);!$(N#*);!$(N=*)]([CX4])', 10.7],
    ['c1cn[nH0]c1', 7.0],
    ['[nX2;H0]1ccccc1', 5.2],
    ['[NX3;H2,H1,H0;!$(NC=O);!$(N-[N,O])]c', 4.6],
  ];
  for (const [smarts, pKaH] of patterns) {
    if (matchSmarts(rdkit, substance.smiles, smarts).length) {
      return { pKaH, base: substance.formula, acid: shiftProton(substance.formula, 1), label: substance.name };
    }
  }
  return null;
}

function anionFormula(rdkit: MainModule, smiles: string): string | null {
  return withMol(rdkit, smiles, (mol) => {
    const json = JSON.parse(mol.get_json()) as { molecules: Array<{ atoms: Array<{ z?: number; impHs?: number }> }> };
    const counts: Record<string, number> = {};
    const symbols: Record<number, string> = { 1: 'H', 6: 'C', 7: 'N', 8: 'O', 9: 'F', 15: 'P', 16: 'S', 17: 'Cl', 35: 'Br', 53: 'I' };
    for (const atom of json.molecules[0].atoms) {
      const symbol = symbols[atom.z ?? 6];
      if (!symbol) return null;
      counts[symbol] = (counts[symbol] ?? 0) + 1;
      if (atom.impHs) counts.H = (counts.H ?? 0) + atom.impHs;
    }
    return toHillFormula(counts);
  });
}

function predictAcidBase(rdkit: MainModule | null, a: Substance, b: Substance): PairPrediction | null {
  let best: { acid: AcidInfo; base: BaseInfo; acidSubstance: Substance; baseSubstance: Substance; delta: number } | null = null;
  for (const [acidSubstance, baseSubstance] of [[a, b], [b, a]] as const) {
    const acid = acidInfo(rdkit, acidSubstance);
    const base = baseInfo(rdkit, baseSubstance);
    if (!acid || !base) continue;
    const delta = base.pKaH - acid.pKa;
    // Auch bei etwa gleich starken Partnern reagiert ein Teil (Gleichgewicht)
    if (delta > -1 && (!best || delta > best.delta)) best = { acid, base, acidSubstance, baseSubstance, delta };
  }
  if (!best) return null;

  const products = [best.acid.base, best.base.acid];
  const releasesCO2 = best.base.acid === 'H2CO3';
  const right = releasesCO2 ? [best.acid.base, 'CO2', 'H2O'] : products;
  const written = writeEquation([best.acid.acid, best.base.base], right, releasesCO2 ? '→' : '⇌');
  if (!written) return null;
  const k = best.delta;
  const confidence: Confidence = k >= 4 ? 'hoch' : k >= 1.5 ? 'mittel' : 'gering';
  const observation = releasesCO2
    ? 'Es schäumt: Kohlenstoffdioxid entweicht.'
    : best.base.acid === 'NH4^+' || best.acid.base === 'NH3'
      ? best.acid.base === 'NH3'
        ? 'Es riecht nach Ammoniak.'
        : 'Die Lösung erwärmt sich; ein Ammoniumsalz entsteht.'
      : k >= 4
        ? 'Die Lösung erwärmt sich (Neutralisationswärme); Indikatoren schlagen um.'
        : 'Äußerlich ändert sich wenig; in der Lösung stellt sich ein Protonen-Gleichgewicht ein.';

  return {
    id: `vorhersage-saeure-base-${best.acidSubstance.id}-${best.baseSubstance.id}`,
    chemical: true,
    kind: isOrganic(best.acidSubstance) || isOrganic(best.baseSubstance) ? 'organisch' : 'anorganisch',
    title: `Säure-Base-Reaktion: ${best.acidSubstance.name} gibt ein Proton an ${best.baseSubstance.name} ab`,
    reactionType: 'Protonenübertragung (vorhergesagt)',
    equation: written.text,
    observation,
    explanation:
      k > 0
        ? `${best.acid.label} ist mit pKs ≈ ${formatNumber(best.acid.pKa, 1)} eine stärkere Säure als die konjugierte Säure der Base (pKs ≈ ${formatNumber(best.base.pKaH, 1)}). Das Gleichgewicht liegt deshalb auf der Produktseite, K ≈ 10^${formatNumber(k, 1)}.${k < 1.5 ? ' Der Unterschied ist klein: Nur ein Teil reagiert.' : ''} Gegenionen, die sich nicht beteiligen, sind in der Gleichung weggelassen.`
        : `${best.acid.label} (pKs ≈ ${formatNumber(best.acid.pKa, 1)}) und die konjugierte Säure der Base (pKs ≈ ${formatNumber(best.base.pKaH, 1)}) sind etwa gleich stark: Es stellt sich ein Gleichgewicht ein, in dem nur ein Teil der Stoffe umgesetzt ist (K ≈ 10^${formatNumber(k, 1)}).`,
    conditions: 'Raumtemperatur, am besten in Lösung',
    confidence,
    model: 'pKs-Werte (Säure-Base-Gleichgewicht)',
    products: productsOf(written.ascii).map((product) => {
      if (product.formula === best.acid.base && best.acid.label === best.acidSubstance.name) {
        return { ...product, name: `Anion von ${best.acidSubstance.name}` };
      }
      if (product.formula === best.base.acid && best.base.label === best.baseSubstance.name) {
        return { ...product, name: `protoniertes ${best.baseSubstance.name}` };
      }
      return product;
    }),
    missing: [],
    hazards: [],
    safetyLevel: 'Schulversuch',
    participants: [a.id, b.id],
    balancedFormulas: written.ascii,
  };
}

// ---------------------------------------------------------------------
// 3. Unedle Metalle mit protischen Stoffen
// ---------------------------------------------------------------------

const REACTIVE_METALS: Record<string, { charge: number; confidence: Confidence }> = {
  Li: { charge: 1, confidence: 'hoch' },
  Na: { charge: 1, confidence: 'hoch' },
  K: { charge: 1, confidence: 'hoch' },
  Ca: { charge: 2, confidence: 'mittel' },
  Mg: { charge: 2, confidence: 'gering' },
};

function predictMetalProton(rdkit: MainModule | null, a: Substance, b: Substance): PairPrediction | null {
  for (const [metal, protic] of [[a, b], [b, a]] as const) {
    const info = REACTIVE_METALS[metal.formula];
    if (!info || !dissolvesInAcid(metal.formula)) continue;
    const acid = acidInfo(rdkit, protic);
    if (!acid || acid.pKa > 18 || acid.pKa < 4 || !isOrganic(protic)) continue;
    const anion = parseFormula(protic.formula).counts;
    const saltCounts: Record<string, number> = {};
    for (const [element, count] of Object.entries(anion)) saltCounts[element] = count * info.charge;
    saltCounts.H = (saltCounts.H ?? 0) - info.charge;
    saltCounts[metal.formula] = (saltCounts[metal.formula] ?? 0) + 1;
    const salt = toHillFormula(saltCounts);
    const written = writeEquation([protic.formula, metal.formula], [salt, 'H2']);
    if (!written) continue;
    return {
      id: `vorhersage-metall-${metal.id}-${protic.id}`,
      chemical: true,
      kind: 'organisch',
      title: `${metal.name} reagiert mit ${protic.name} unter Wasserstoffentwicklung`,
      reactionType: 'Metall und protischer Stoff (vorhergesagt)',
      equation: written.text,
      observation: `${metal.name} löst sich unter Gasentwicklung; es entsteht das Salz von ${protic.name}.`,
      explanation: `${metal.name} ist ein sehr unedles Metall und gibt Elektronen ab; ${protic.name} enthält ein acides Wasserstoffatom (pKs ≈ ${formatNumber(acid.pKa, 0)}), das zu Wasserstoff reduziert wird.${info.confidence !== 'hoch' ? ' Bei Magnesium und Calcium läuft das oft erst beim Erwärmen oder mit aktivierter Oberfläche.' : ''}`,
      conditions: 'unter Schutzgas, wasserfrei',
      confidence: info.confidence,
      model: 'Spannungsreihe und Säurestärke',
      products: [{ formula: salt }, { formula: 'H2', name: 'Wasserstoff' }],
      missing: [],
      hazards: ['Wasserstoff ist hochentzündlich; Alkalimetalle nie mit Wasser in Berührung bringen.'],
      safetyLevel: 'Fortgeschritten',
      participants: [a.id, b.id],
      balancedFormulas: written.ascii,
    };
  }
  return null;
}

// ---------------------------------------------------------------------
// 4. Starke Oxidationsmittel mit organischen Stoffen
// ---------------------------------------------------------------------

const STRONG_OXIDIZERS = new Set([
  'kaliumpermanganat', 'kaliumdichromat', 'salpetersaeure', 'wasserstoffperoxid', 'natriumhypochlorit',
  'chlor', 'brom', 'ozon', 'kaliumchlorat', 'natriumperoxid', 'mangandioxid', 'blei-iv-oxid', 'kaliumchromat',
]);

const OXIDIZABLE: Array<[string, string]> = [
  ['[CX4H2,CX4H1][OX2H1]', 'Alkohole werden zu Aldehyden, Ketonen oder Carbonsäuren oxidiert'],
  ['[CX3H1](=O)[#6]', 'Aldehyde werden zu Carbonsäuren oxidiert'],
  ['C=C', 'Doppelbindungen werden zu Diolen oder gespalten'],
  ['[OX2H1]c', 'Phenole werden zu Chinonen und dunklen Folgeprodukten oxidiert'],
  ['[NX3;H2,H1]', 'Amine werden oxidiert'],
  ['[SX2H1]', 'Thiole werden zu Disulfiden oder Sulfonsäuren oxidiert'],
  ['[CH3,CH2]c', 'Seitenketten am Aromaten werden zu Carbonsäuren oxidiert'],
];

function predictOrganicOxidation(rdkit: MainModule | null, a: Substance, b: Substance): PairPrediction | null {
  for (const [oxidizer, organic] of [[a, b], [b, a]] as const) {
    if (!STRONG_OXIDIZERS.has(oxidizer.id) || !isOrganic(organic)) continue;
    const hit = OXIDIZABLE.find(([smarts]) => has(rdkit, organic, smarts));
    if (!hit) continue;
    return {
      id: `vorhersage-oxidation-${oxidizer.id}-${organic.id}`,
      chemical: true,
      kind: 'organisch',
      title: `Oxidation: ${oxidizer.name} greift ${organic.name} an`,
      reactionType: 'Oxidation organischer Stoffe (vorhergesagt)',
      equation: `${organic.name} + ${oxidizer.name} → Oxidationsprodukte (bei vollständiger Oxidation CO₂ und H₂O)`,
      observation: oxidizer.id === 'kaliumpermanganat'
        ? 'Die violette Lösung entfärbt sich, oft fällt braunes Mangandioxid aus.'
        : oxidizer.id === 'kaliumdichromat'
          ? 'Die orange Lösung wird grün.'
          : 'Die Mischung erwärmt sich; je nach Stoff verfärbt sie sich.',
      explanation: `${hit[1]}. ${oxidizer.name} ist ein starkes Oxidationsmittel. Welche Produkte genau entstehen, hängt von Menge, Temperatur und pH-Wert ab – deshalb nennt die Werkbank hier keine genaue Gleichung.`,
      conditions: 'je nach Oxidationsmittel sauer oder alkalisch; Wärme beschleunigt',
      confidence: 'gering',
        model: 'funktionelle Gruppen und Oxidationskraft',
      products: [{ name: 'Oxidationsprodukte (je nach Bedingungen)' }],
      missing: [],
      hazards: ['Starke Oxidationsmittel können mit organischen Stoffen heftig oder explosionsartig reagieren – nur in kleinen Mengen und mit Schutzausrüstung.'],
      safetyLevel: 'Fortgeschritten',
      participants: [a.id, b.id],
    };
  }
  return null;
}

// ---------------------------------------------------------------------
// 5. Physikalisches Verhalten
// ---------------------------------------------------------------------

const logPCache = new Map<string, number | null>();

/** Oktanol-Wasser-Verteilungskoeffizient nach Crippen (Maß für die Polarität). */
function logP(rdkit: MainModule | null, substance: Substance): number | null {
  if (!rdkit || !substance.smiles) return null;
  const cached = logPCache.get(substance.smiles);
  if (cached !== undefined) return cached;
  const value = withMol(rdkit, substance.smiles, (mol) => {
    const descriptors = JSON.parse(mol.get_descriptors()) as { CrippenClogP?: number };
    return descriptors.CrippenClogP ?? null;
  });
  logPCache.set(substance.smiles, value);
  return value;
}

const WATER_SOLUBLE_GASES = new Set(['NH3', 'HCl', 'HBr', 'HI', 'SO2']);
const MODERATE_GASES = new Set(['CO2', 'Cl2', 'H2S', 'N2O']);

function stateOf(rdkit: MainModule | null, substance: Substance, context: PredictionContext): PhaseState {
  return stateAt(physicalProperties(rdkit, substance), context.temperature, context.pressure).state;
}

const STATE_WORD: Record<PhaseState, string> = {
  fest: 'fest', flüssig: 'flüssig', gasförmig: 'gasförmig', gelöst: 'gelöst', zersetzt: 'zersetzt sich', unbekannt: '?',
};

function waterBehaviour(rdkit: MainModule | null, substance: Substance, state: PhaseState): { dissolves: boolean | null; text: string } {
  const formula = splitHydrate(substance.formula).rest;
  if (state === 'gasförmig') {
    if (WATER_SOLUBLE_GASES.has(formula)) return { dissolves: true, text: `${substance.name} löst sich sehr gut in Wasser` };
    if (MODERATE_GASES.has(formula)) return { dissolves: true, text: `${substance.name} löst sich mäßig in Wasser` };
    return { dissolves: false, text: `${substance.name} löst sich kaum in Wasser` };
  }
  if (/^[A-Z][a-z]?$/.test(formula) && !substance.smiles) {
    return { dissolves: false, text: `${substance.name} löst sich als Element nicht in Wasser` };
  }
  if (isIonic(substance)) {
    const salt = splitSalt(formula);
    if (salt) {
      const info = solubility(salt.cation, salt.anion);
      return info.solubility === 'löslich'
        ? { dissolves: true, text: `${substance.name} löst sich und zerfällt in ${prettySpecies(asIon(salt.cation.formula, salt.cation.charge))}- und ${prettySpecies(asIon(salt.anion.formula, salt.anion.charge))}-Ionen` }
        : { dissolves: false, text: `${substance.name} ist ${info.solubility} und bleibt als Bodensatz zurück` };
    }
    return { dissolves: null, text: `${substance.name}: Löslichkeit unbekannt` };
  }
  const value = logP(rdkit, substance);
  if (value === null) return { dissolves: null, text: `${substance.name}: Löslichkeit unbekannt` };
  if (value < 0.5) return { dissolves: true, text: `${substance.name} ist polar und mischt sich mit Wasser` };
  if (value < 1.5) return { dissolves: true, text: `${substance.name} löst sich teilweise in Wasser` };
  return { dissolves: false, text: `${substance.name} ist unpolar (log P ≈ ${formatNumber(value, 1)}) und mischt sich nicht mit Wasser` };
}

function physicalOutcome(rdkit: MainModule | null, a: Substance, b: Substance, context: PredictionContext): PairPrediction {
  const stateA = stateOf(rdkit, a, context);
  const stateB = stateOf(rdkit, b, context);
  const statesText = `Bei ${Math.round(context.temperature)} °C ist ${a.name} ${STATE_WORD[stateA]}, ${b.name} ${STATE_WORD[stateB]}.`;
  let equation = `${a.name} + ${b.name} → Gemisch`;
  let observation: string;
  let confidence: Confidence = 'mittel';

  const water = isWater(a) ? a : isWater(b) ? b : null;
  const other = water === a ? b : a;
  if (stateA === 'zersetzt' || stateB === 'zersetzt') {
    const decomposing = stateA === 'zersetzt' ? a : b;
    observation = `${decomposing.name} zersetzt sich bei dieser Temperatur. Eine Reaktion mit dem anderen Stoff ist nicht hinterlegt; es reagieren gegebenenfalls die Zersetzungsprodukte.`;
    confidence = 'gering';
  } else if (stateA === 'gasförmig' && stateB === 'gasförmig') {
    observation = 'Die Gase mischen sich vollständig zu einem Gasgemisch.';
    equation = `${a.name}(g) + ${b.name}(g) → Gasgemisch`;
  } else if (!water && isOrganic(a) && isOrganic(b) && stateA !== 'fest' && stateB !== 'fest' && logP(rdkit, a) !== null && logP(rdkit, b) !== null) {
    const [pa, pb] = [logP(rdkit, a) as number, logP(rdkit, b) as number];
    const miscible = Math.abs(pa - pb) < 2.5;
    observation = miscible
      ? `Die Stoffe haben eine ähnliche Polarität (log P ${formatNumber(pa, 1)} und ${formatNumber(pb, 1)}) und mischen sich.`
      : `Die Polaritäten unterscheiden sich stark (log P ${formatNumber(pa, 1)} und ${formatNumber(pb, 1)}): Es bilden sich vermutlich zwei Phasen.`;
    equation = `${a.name} + ${b.name} → ${miscible ? 'homogene Mischung' : 'zwei Phasen'}`;
  } else if (water || context.aqueous) {
    const parts = water ? [other] : [a, b];
    const behaviours = parts.map((substance) => waterBehaviour(rdkit, substance, stateOf(rdkit, substance, context)));
    observation = `${behaviours.map((entry) => entry.text).join('. ')}.`;
    const insoluble = behaviours.filter((entry) => entry.dissolves === false).length;
    if (!water && insoluble === 0 && behaviours.every((entry) => entry.dissolves)) {
      observation += ' Beide liegen gelöst nebeneinander vor, ohne miteinander zu reagieren.';
    } else if (!water && insoluble === 1) {
      observation += ' Es bilden sich zwei Phasen bzw. ein Bodensatz.';
    }
    if (behaviours.some((entry) => entry.dissolves === null)) confidence = 'gering';
    equation = water
      ? `${other.name} + Wasser → ${behaviours[0].dissolves ? 'Lösung' : behaviours[0].dissolves === false ? 'zwei Phasen / Suspension' : 'Gemisch'}`
      : `${a.name} + ${b.name} (in Wasser) → ${insoluble ? 'Gemisch mit ungelöstem Anteil' : 'Lösung beider Stoffe'}`;
  } else if (stateA === 'fest' && stateB === 'fest') {
    observation = 'Es entsteht ein Feststoffgemenge. Feststoffe reagieren ohne Lösungsmittel, Schmelze oder starkes Erhitzen kaum miteinander, weil sich die Teilchen nicht begegnen.';
    equation = `${a.name}(s) + ${b.name}(s) → Feststoffgemenge`;
  } else {
    const [pa, pb] = [logP(rdkit, a), logP(rdkit, b)];
    const ionicA = isIonic(a);
    const ionicB = isIonic(b);
    if (ionicA !== ionicB && (stateA === 'flüssig' || stateB === 'flüssig')) {
      const salt = ionicA ? a : b;
      const liquid = ionicA ? b : a;
      const polar = (logP(rdkit, liquid) ?? 1) < 0;
      observation = polar
        ? `${salt.name} löst sich vermutlich etwas in dem polaren ${liquid.name}.`
        : `${salt.name} löst sich in ${liquid.name} praktisch nicht – Salze lösen sich kaum in unpolaren Flüssigkeiten.`;
    } else if (pa !== null && pb !== null) {
      const difference = Math.abs(pa - pb);
      observation =
        difference < 2.5
          ? `Die Stoffe haben eine ähnliche Polarität (log P ${formatNumber(pa, 1)} und ${formatNumber(pb, 1)}) und mischen bzw. lösen sich ineinander.`
          : `Die Polaritäten unterscheiden sich stark (log P ${formatNumber(pa, 1)} und ${formatNumber(pb, 1)}): Es bilden sich vermutlich zwei Phasen, oder der Feststoff löst sich kaum.`;
    } else {
      observation = 'Die Stoffe vermischen sich.';
      confidence = 'gering';
    }
  }

  const blocked = context.blocked.length
    ? ` Unter anderen Bedingungen wäre eine Reaktion möglich: ${context.blocked
        .slice(0, 2)
        .map((entry) => `${entry.title} (${entry.missing.join('; ')})`)
        .join(' · ')}.`
    : '';

  return {
    id: `vorhersage-gemisch-${a.id}-${b.id}`,
    chemical: false,
    kind: 'physikalisch',
    title: `${a.name} und ${b.name}: keine chemische Reaktion erwartet`,
    reactionType: 'Mischen und Lösen (vorhergesagt)',
    equation,
    observation,
    explanation: `${statesText} Es gibt kein passendes Säure-Base-Paar, keine Redoxpaare mit ausreichender Potentialdifferenz und keine Reaktionsvorlage, die auf beide Stoffe passt. Deshalb ist unter diesen Bedingungen keine chemische Umsetzung zu erwarten – nur physikalisches Mischen oder Lösen.${blocked}`,
    conditions: `${Math.round(context.temperature)} °C, ${formatNumber(context.pressure, context.pressure < 10 ? 2 : 0)} bar`,
    confidence,
    model: 'Aggregatzustände, Löslichkeitsregeln und Polarität (log P)',
    products: [],
    missing: [],
    hazards: [],
    safetyLevel: 'Schulversuch',
    participants: [a.id, b.id],
  };
}

// ---------------------------------------------------------------------
// Hauptfunktion
// ---------------------------------------------------------------------

/** Was passiert, wenn man diese beiden Stoffe zusammengibt? Immer mit Ergebnis. */
export function predictPair(rdkit: MainModule | null, first: Substance, second: Substance, context: PredictionContext): PairPrediction {
  // Feste Reihenfolge, damit das Ergebnis nicht davon abhängt, welcher Stoff zuerst ins Gefäß kam
  const [a, b] = first.id <= second.id ? [first, second] : [second, first];
  return (
    predictMetalProton(rdkit, a, b) ??
    predictRedox(a, b) ??
    predictAcidBase(rdkit, a, b) ??
    predictOrganicOxidation(rdkit, a, b) ??
    physicalOutcome(rdkit, a, b, context)
  );
}
