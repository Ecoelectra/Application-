/**
 * Anorganische Reaktionsregeln.
 *
 * Diese Regeln arbeiten nicht mit SMILES, sondern mit Summenformeln und dem
 * Ionenmodell. Jede Regel prüft, ob sie auf die gegebenen Stoffe anwendbar ist,
 * und liefert dann die Produkte. Die Gleichung wird anschließend mit dem
 * Nullraum-Verfahren exakt ausgeglichen – die Regeln müssen also keine
 * Koeffizienten kennen.
 */
import { balanceSpecies, type BalanceResult } from './balance';
import { parseFormula, sameComposition } from './formula';
import {
  dissolvesInAcid,
  displaces,
  saltFormula,
  solubility,
  splitSalt,
  type Ion,
  type SaltComposition,
} from './ions';
import type { SafetyLevel, Substance } from '../data/types';

export type InorganicReactionType =
  | 'Neutralisation'
  | 'Metall und Säure'
  | 'Metalloxid und Säure'
  | 'Carbonat und Säure'
  | 'Fällungsreaktion'
  | 'Metallverdrängung'
  | 'Salzbildung aus den Elementen'
  | 'Metalloxid und Wasser'
  | 'Nichtmetalloxid und Wasser'
  | 'Alkalimetall und Wasser'
  | 'Thermische Zersetzung'
  | 'Verbrennung'
  | 'Nachweisreaktion'
  | 'Amphoteres Hydroxid';

export interface InorganicReaction {
  /** Kennung, aus Regel und Edukten gebildet */
  id: string;
  type: InorganicReactionType;
  title: string;
  /** Formeln der eingesetzten Stoffe */
  reactants: string[];
  /** Formeln der entstehenden Stoffe */
  products: string[];
  /** ausgeglichene Gleichung als Text */
  equation: string;
  /** Ionengleichung, sofern sinnvoll */
  ionicEquation?: string;
  /** was man im Reagenzglas sieht */
  observation: string;
  explanation: string;
  conditions: string;
  safetyLevel: SafetyLevel;
  hazards: string[];
  /** Gasentwicklung, Niederschlag und Ähnliches für die Darstellung */
  tags: string[];
}

export interface RuleContext {
  substances: Substance[];
}

/** Ein Stoff mit den für die anorganischen Regeln nötigen Zusatzangaben. */
export interface Reagent {
  substance: Substance;
  formula: string;
  salt: SaltComposition | null;
}

export function toReagent(substance: Substance): Reagent {
  const salt = splitSalt(substance.formula);
  return {
    substance,
    // In Lösung spielt das Kristallwasser keine Rolle: Kupfersulfat-Pentahydrat
    // reagiert als CuSO4. Gleichungen werden deshalb wasserfrei geschrieben.
    formula: salt?.hydrate ? salt.anhydrous : substance.formula,
    salt,
  };
}

/** Liegt ein Element vor? Zählt die verschiedenen Elemente in der Formel. */
function isSingleElement(formula: string): boolean {
  try {
    const parsed = parseFormula(formula);
    return parsed.charge === 0 && Object.keys(parsed.counts).length === 1;
  } catch {
    return false;
  }
}

/** Starke und mittelstarke Säuren, die in der Werkbank vorkommen. */
const ACIDS: Record<string, { anion: string; name: string; strong: boolean; oxidizing?: boolean }> = {
  HCl: { anion: 'Cl', name: 'Salzsäure', strong: true },
  HBr: { anion: 'Br', name: 'Bromwasserstoffsäure', strong: true },
  HI: { anion: 'I', name: 'Iodwasserstoffsäure', strong: true },
  HNO3: { anion: 'NO3', name: 'Salpetersäure', strong: true, oxidizing: true },
  H2SO4: { anion: 'SO4', name: 'Schwefelsäure', strong: true },
  H3PO4: { anion: 'PO4', name: 'Phosphorsäure', strong: false },
  H2CO3: { anion: 'CO3', name: 'Kohlensäure', strong: false },
  H2SO3: { anion: 'SO3', name: 'Schweflige Säure', strong: false },
  HF: { anion: 'F', name: 'Flusssäure', strong: false },
  'CH3COOH': { anion: 'CH3COO', name: 'Essigsäure', strong: false },
  C2H4O2: { anion: 'CH3COO', name: 'Essigsäure', strong: false },
};

/** Basen mit dem zugehörigen Kation. */
const BASES: Record<string, { cation: string; charge: number; name: string }> = {
  NaOH: { cation: 'Na', charge: 1, name: 'Natronlauge' },
  KOH: { cation: 'K', charge: 1, name: 'Kalilauge' },
  LiOH: { cation: 'Li', charge: 1, name: 'Lithiumhydroxid' },
  'Ca(OH)2': { cation: 'Ca', charge: 2, name: 'Kalkwasser' },
  'Ba(OH)2': { cation: 'Ba', charge: 2, name: 'Barytwasser' },
  'Mg(OH)2': { cation: 'Mg', charge: 2, name: 'Magnesiumhydroxid' },
  'Al(OH)3': { cation: 'Al', charge: 3, name: 'Aluminiumhydroxid' },
  'Fe(OH)3': { cation: 'Fe', charge: 3, name: 'Eisen(III)-hydroxid' },
  'Fe(OH)2': { cation: 'Fe', charge: 2, name: 'Eisen(II)-hydroxid' },
  'Cu(OH)2': { cation: 'Cu', charge: 2, name: 'Kupfer(II)-hydroxid' },
  'Zn(OH)2': { cation: 'Zn', charge: 2, name: 'Zinkhydroxid' },
};

/** Metalloxide mit der Wertigkeit des Metalls. */
const METAL_OXIDES: Record<string, { metal: string; charge: number }> = {
  Na2O: { metal: 'Na', charge: 1 },
  K2O: { metal: 'K', charge: 1 },
  Li2O: { metal: 'Li', charge: 1 },
  MgO: { metal: 'Mg', charge: 2 },
  CaO: { metal: 'Ca', charge: 2 },
  BaO: { metal: 'Ba', charge: 2 },
  ZnO: { metal: 'Zn', charge: 2 },
  CuO: { metal: 'Cu', charge: 2 },
  FeO: { metal: 'Fe', charge: 2 },
  NiO: { metal: 'Ni', charge: 2 },
  PbO: { metal: 'Pb', charge: 2 },
  Fe2O3: { metal: 'Fe', charge: 3 },
  Al2O3: { metal: 'Al', charge: 3 },
  Cr2O3: { metal: 'Cr', charge: 3 },
};

/** Nichtmetalloxide und die Säure, die sie mit Wasser bilden. */
const ACID_ANHYDRIDES: Record<string, { acid: string; acidName: string }> = {
  CO2: { acid: 'H2CO3', acidName: 'Kohlensäure' },
  SO2: { acid: 'H2SO3', acidName: 'Schweflige Säure' },
  SO3: { acid: 'H2SO4', acidName: 'Schwefelsäure' },
  N2O5: { acid: 'HNO3', acidName: 'Salpetersäure' },
  P4O10: { acid: 'H3PO4', acidName: 'Phosphorsäure' },
};

const ALKALI_METALS = ['Li', 'Na', 'K'];
const ALKALINE_EARTH = ['Ca', 'Ba', 'Sr'];

function isAcid(formula: string): boolean {
  return formula in ACIDS;
}

function isBase(formula: string): boolean {
  return formula in BASES;
}

/**
 * Elementarer Stoff? Die Kategorie allein genügt nicht – Sauerstoff und Chlor
 * stehen in der Datenbank unter «Gas», sind aber Elemente.
 */
function isElement(substance: Substance): boolean {
  if (substance.smiles && !isSingleElement(substance.formula)) return false;
  return isSingleElement(substance.formula);
}

/** Kation-Objekt aus Symbol und Ladung, für den Aufbau von Salzformeln. */
function makeCation(formula: string, charge: number, name: string): Ion {
  return { formula, charge, name, label: `${formula}${charge}+` };
}

function makeAnion(formula: string, charge: number, name: string): Ion {
  return { formula, charge, name, label: `${formula}${charge}-` };
}

const ANION_NAMES: Record<string, string> = {
  Cl: 'Chlorid', Br: 'Bromid', I: 'Iodid', F: 'Fluorid', NO3: 'Nitrat',
  SO4: 'Sulfat', CO3: 'Carbonat', PO4: 'Phosphat', CH3COO: 'Acetat',
  SO3: 'Sulfit', S: 'Sulfid', O: 'Oxid', OH: 'Hydroxid',
};

interface BuildOptions {
  id: string;
  type: InorganicReactionType;
  title: string;
  reactants: string[];
  products: string[];
  observation: string;
  explanation: string;
  conditions?: string;
  safetyLevel?: SafetyLevel;
  hazards?: string[];
  tags?: string[];
  ionicEquation?: string;
}

/** Baut eine Reaktion und gleicht die Gleichung aus; null, wenn das misslingt. */
function build(options: BuildOptions): InorganicReaction | null {
  let balanced: BalanceResult;
  try {
    balanced = balanceSpecies(options.reactants, options.products);
  } catch {
    return null;
  }
  if (balanced.warnings.some((warning) => warning.includes('Keine'))) return null;

  return {
    id: options.id,
    type: options.type,
    title: options.title,
    reactants: options.reactants,
    products: options.products,
    equation: balanced.equation,
    ionicEquation: options.ionicEquation,
    observation: options.observation,
    explanation: options.explanation,
    conditions: options.conditions ?? 'Raumtemperatur, wässrige Lösung',
    safetyLevel: options.safetyLevel ?? 'Laborpraktikum',
    hazards: options.hazards ?? [],
    tags: options.tags ?? [],
  };
}

/** Neutralisation: Säure und Base bilden Salz und Wasser. */
function neutralisation(a: Reagent, b: Reagent): InorganicReaction | null {
  const acidEntry = isAcid(a.formula) ? a : isAcid(b.formula) ? b : null;
  const baseEntry = isBase(a.formula) ? a : isBase(b.formula) ? b : null;
  if (!acidEntry || !baseEntry || acidEntry === baseEntry) return null;

  const acid = ACIDS[acidEntry.formula];
  const base = BASES[baseEntry.formula];
  const cation = makeCation(base.cation, base.charge, '');
  const anionCharge = acid.anion === 'SO4' || acid.anion === 'CO3' || acid.anion === 'SO3' ? -2 : acid.anion === 'PO4' ? -3 : -1;
  const anion = makeAnion(acid.anion, anionCharge, '');
  const salt = saltFormula(cation, anion);
  const info = solubility(cation, anion);
  const anionName = ANION_NAMES[acid.anion] ?? acid.anion;

  return build({
    id: `neutralisation-${acidEntry.formula}-${baseEntry.formula}`,
    type: 'Neutralisation',
    title: `${acidEntry.substance.name} und ${baseEntry.substance.name}`,
    reactants: [acidEntry.formula, baseEntry.formula],
    products: [salt, 'H2O'],
    ionicEquation: 'H+ + OH- → H2O',
    observation:
      info.solubility === 'löslich'
        ? 'Die Lösung erwärmt sich; es bleibt eine klare Salzlösung zurück. Ein Indikator schlägt am Äquivalenzpunkt um.'
        : `Die Lösung erwärmt sich, es fällt ${info.color ?? 'ein'} ${salt} aus.`,
    explanation: `Die Säure gibt Protonen ab, die Base Hydroxid-Ionen. Beide vereinigen sich zu Wasser – das ist die eigentliche Reaktion. ${base.cation}- und ${anionName}-Ionen bleiben in Lösung und bilden beim Eindampfen das Salz.`,
    hazards: [`${acidEntry.substance.name} und ${baseEntry.substance.name} wirken ätzend.`, 'Die Neutralisation ist exotherm – bei konzentrierten Lösungen kann die Mischung spritzen.'],
    tags: ['exotherm', 'Salzbildung'],
  });
}

/** Unedles Metall löst sich in Säure unter Wasserstoffentwicklung. */
function metalAndAcid(a: Reagent, b: Reagent): InorganicReaction | null {
  const metalEntry = isElement(a.substance) ? a : isElement(b.substance) ? b : null;
  const acidEntry = isAcid(a.formula) ? a : isAcid(b.formula) ? b : null;
  if (!metalEntry || !acidEntry) return null;

  const metal = metalEntry.formula;
  if (!dissolvesInAcid(metal)) {
    if (!['Cu', 'Ag', 'Hg', 'Au', 'Pt'].includes(metal)) return null;
    // Edelmetalle lösen sich nur in oxidierenden Säuren
    if (!ACIDS[acidEntry.formula].oxidizing || ['Au', 'Pt'].includes(metal)) return null;
    return build({
      id: `edelmetall-salpetersaeure-${metal}`,
      type: 'Metall und Säure',
      title: `${metalEntry.substance.name} in Salpetersäure`,
      reactants: [metal, 'HNO3'],
      products: [saltFormula(makeCation(metal, metal === 'Ag' ? 1 : 2, ''), makeAnion('NO3', -1, '')), 'NO', 'H2O'],
      observation:
        'Das Metall löst sich unter Bildung eines braunen Gases; die Lösung färbt sich blau (Kupfer) beziehungsweise bleibt farblos (Silber).',
      explanation:
        'Salpetersäure löst auch Metalle, die edler als Wasserstoff sind: Nicht das Proton, sondern das Nitrat-Ion wirkt als Oxidationsmittel. Es entsteht Stickstoffmonoxid, das sich an der Luft sofort zum braunen Stickstoffdioxid weiter oxidiert.',
      conditions: 'verdünnte Salpetersäure, Abzug',
      safetyLevel: 'Nur Fachlabor',
      hazards: [
        'Es entstehen nitrose Gase – nur im Abzug arbeiten.',
        'Salpetersäure wirkt stark ätzend und färbt Haut gelb.',
      ],
      tags: ['Redoxreaktion', 'Gasentwicklung', 'nitrose Gase'],
    });
  }

  const acid = ACIDS[acidEntry.formula];
  const charge = ['Al', 'Cr'].includes(metal) ? 3 : ['Na', 'K', 'Li'].includes(metal) ? 1 : 2;
  const anionCharge = ['SO4', 'CO3', 'SO3'].includes(acid.anion) ? -2 : acid.anion === 'PO4' ? -3 : -1;
  const salt = saltFormula(makeCation(metal, charge, ''), makeAnion(acid.anion, anionCharge, ''));

  return build({
    id: `metall-saeure-${metal}-${acidEntry.formula}`,
    type: 'Metall und Säure',
    title: `${metalEntry.substance.name} in ${acidEntry.substance.name}`,
    reactants: [metal, acidEntry.formula],
    products: [salt, 'H2'],
    ionicEquation: `${metal} + ${charge} H+ → ${metal}${charge}+ + ${charge === 2 ? '' : charge / 2 + ' '}H2`.replace(' 1 H2', ' H2'),
    observation:
      'Das Metall löst sich unter lebhafter Gasentwicklung. Das Gas ist Wasserstoff – die Knallgasprobe fällt positiv aus.',
    explanation: `${metalEntry.substance.name} steht in der Spannungsreihe unter Wasserstoff und ist damit unedler. Es gibt Elektronen an die Protonen der Säure ab; diese werden zu Wasserstoff reduziert.`,
    safetyLevel: metal === 'Na' || metal === 'K' ? 'Nur Fachlabor' : 'Laborpraktikum',
    hazards: [
      'Wasserstoff bildet mit Luft ein explosionsfähiges Gemisch – offene Flammen fernhalten.',
      'Die Reaktion ist exotherm; bei unedlen Metallen kann die Lösung sieden.',
    ],
    tags: ['Redoxreaktion', 'Gasentwicklung', 'Wasserstoff'],
  });
}

/** Metalloxid und Säure ergeben Salz und Wasser. */
function metalOxideAndAcid(a: Reagent, b: Reagent): InorganicReaction | null {
  const oxideEntry = a.formula in METAL_OXIDES ? a : b.formula in METAL_OXIDES ? b : null;
  const acidEntry = isAcid(a.formula) ? a : isAcid(b.formula) ? b : null;
  if (!oxideEntry || !acidEntry) return null;

  const oxide = METAL_OXIDES[oxideEntry.formula];
  const acid = ACIDS[acidEntry.formula];
  const anionCharge = ['SO4', 'CO3', 'SO3'].includes(acid.anion) ? -2 : acid.anion === 'PO4' ? -3 : -1;
  const salt = saltFormula(makeCation(oxide.metal, oxide.charge, ''), makeAnion(acid.anion, anionCharge, ''));

  return build({
    id: `oxid-saeure-${oxideEntry.formula}-${acidEntry.formula}`,
    type: 'Metalloxid und Säure',
    title: `${oxideEntry.substance.name} löst sich in ${acidEntry.substance.name}`,
    reactants: [oxideEntry.formula, acidEntry.formula],
    products: [salt, 'H2O'],
    observation: `Das Oxid löst sich langsam auf; die Lösung färbt sich ${oxide.metal === 'Cu' ? 'blau' : oxide.metal === 'Fe' ? 'gelbbraun' : 'klar'}.`,
    explanation:
      'Metalloxide sind basische Oxide: Das Oxid-Ion nimmt zwei Protonen der Säure auf und wird zu Wasser. Das Metall-Ion bleibt mit dem Säurerest als Salz zurück. Es ist keine Redoxreaktion – die Oxidationszahlen ändern sich nicht.',
    conditions: 'Raumtemperatur, oft leicht erwärmen',
    hazards: ['Säuren wirken ätzend.'],
    tags: ['Salzbildung', 'Säure-Base-Reaktion'],
  });
}

/** Carbonat und Säure: Kohlenstoffdioxid entweicht. */
function carbonateAndAcid(a: Reagent, b: Reagent): InorganicReaction | null {
  const carbonateEntry = [a, b].find(
    (entry) => entry.salt && (entry.salt.anion.formula === 'CO3' || entry.salt.anion.formula === 'HCO3'),
  );
  const acidEntry = isAcid(a.formula) ? a : isAcid(b.formula) ? b : null;
  if (!carbonateEntry || !acidEntry || carbonateEntry === acidEntry) return null;
  if (!carbonateEntry.salt) return null;

  const acid = ACIDS[acidEntry.formula];
  if (acid.anion === 'CO3') return null;
  const anionCharge = ['SO4', 'SO3'].includes(acid.anion) ? -2 : acid.anion === 'PO4' ? -3 : -1;
  const salt = saltFormula(carbonateEntry.salt.cation, makeAnion(acid.anion, anionCharge, ''));

  return build({
    id: `carbonat-saeure-${carbonateEntry.formula}-${acidEntry.formula}`,
    type: 'Carbonat und Säure',
    title: `${carbonateEntry.substance.name} und ${acidEntry.substance.name}`,
    reactants: [carbonateEntry.formula, acidEntry.formula],
    products: [salt, 'H2O', 'CO2'],
    ionicEquation: 'CO3^2- + 2 H+ → H2O + CO2',
    observation:
      'Es schäumt kräftig auf, farbloses Gas entweicht. Leitet man es in Kalkwasser, trübt sich dieses weiß – der Nachweis für Kohlenstoffdioxid.',
    explanation:
      'Die Säure setzt aus dem Carbonat zunächst Kohlensäure frei. Kohlensäure ist instabil und zerfällt sofort in Wasser und Kohlenstoffdioxid – deshalb sprudelt es.',
    hazards: ['Bei geschlossenen Gefäßen entsteht Überdruck – niemals verschließen.'],
    tags: ['Gasentwicklung', 'Kohlenstoffdioxid', 'Schäumen'],
  });
}

/** Zwei lösliche Salze bilden einen Niederschlag. */
function precipitation(a: Reagent, b: Reagent): InorganicReaction | null {
  if (!a.salt || !b.salt) return null;
  const solubleA = solubility(a.salt.cation, a.salt.anion).solubility === 'löslich';
  const solubleB = solubility(b.salt.cation, b.salt.anion).solubility === 'löslich';
  if (!solubleA || !solubleB) return null;

  // Ionen tauschen und prüfen, ob eine der neuen Kombinationen ausfällt
  const first = { cation: a.salt.cation, anion: b.salt.anion };
  const second = { cation: b.salt.cation, anion: a.salt.anion };
  const firstInfo = solubility(first.cation, first.anion);
  const secondInfo = solubility(second.cation, second.anion);

  const precipitate = firstInfo.solubility !== 'löslich' ? first : secondInfo.solubility !== 'löslich' ? second : null;
  if (!precipitate) return null;

  const info = precipitate === first ? firstInfo : secondInfo;
  const other = precipitate === first ? second : first;
  const precipitateFormula = saltFormula(precipitate.cation, precipitate.anion);
  const otherFormula = saltFormula(other.cation, other.anion);
  if (sameComposition(precipitateFormula, a.formula) || sameComposition(precipitateFormula, b.formula)) return null;

  const anionName = ANION_NAMES[precipitate.anion.formula] ?? precipitate.anion.formula;

  return build({
    id: `faellung-${a.formula}-${b.formula}`,
    type: 'Fällungsreaktion',
    title: `${a.substance.name} und ${b.substance.name}`,
    reactants: [a.formula, b.formula],
    products: [precipitateFormula, otherFormula],
    ionicEquation: `${precipitate.cation.label} + ${precipitate.anion.label} → ${precipitateFormula}`,
    observation: `Beim Zusammengeben fällt sofort ein ${info.color ?? ''} Niederschlag von ${precipitateFormula} aus.${info.note ? ` (${info.note})` : ''}`.replace('  ', ' '),
    explanation: `Die Ionen tauschen ihre Partner. ${precipitate.cation.label} und ${precipitate.anion.label} bilden ein schwer lösliches Salz und fallen aus; die übrigen Ionen bleiben als Zuschauerionen in Lösung. Die Reaktion eignet sich als Nachweis für ${anionName}-Ionen.`,
    safetyLevel: 'Schulversuch',
    hazards: info.color === 'goldgelb' ? ['Bleisalze sind giftig und umweltgefährlich – Reste gesondert entsorgen.'] : [],
    tags: ['Niederschlag', 'Ionenaustausch', info.color ?? ''].filter(Boolean),
  });
}

/** Unedleres Metall verdrängt edleres aus seiner Salzlösung. */
function displacement(a: Reagent, b: Reagent): InorganicReaction | null {
  const metalEntry = isElement(a.substance) ? a : isElement(b.substance) ? b : null;
  const saltEntry = metalEntry === a ? b : a;
  if (!metalEntry || !saltEntry.salt) return null;

  const metal = metalEntry.formula;
  const saltMetal = saltEntry.salt.cation.formula;
  if (metal === saltMetal) return null;
  if (!displaces(metal, saltMetal)) return null;
  if (solubility(saltEntry.salt.cation, saltEntry.salt.anion).solubility !== 'löslich') return null;

  const charge = ['Al', 'Cr'].includes(metal) ? 3 : ['Na', 'K', 'Li'].includes(metal) ? 1 : 2;
  const newSalt = saltFormula(makeCation(metal, charge, ''), saltEntry.salt.anion);

  return build({
    id: `verdraengung-${metal}-${saltEntry.formula}`,
    type: 'Metallverdrängung',
    title: `${metalEntry.substance.name} in ${saltEntry.substance.name}-Lösung`,
    reactants: [metal, saltEntry.formula],
    products: [newSalt, saltMetal],
    ionicEquation: `${metal} + ${saltEntry.salt.cation.label} → ${metal}${charge}+ + ${saltMetal}`,
    observation: `Auf dem ${metalEntry.substance.name} scheidet sich ${saltMetal === 'Cu' ? 'rotbraunes Kupfer' : saltMetal === 'Ag' ? 'glänzendes Silber' : `metallisches ${saltMetal}`} ab. Die Lösung entfärbt sich allmählich.`,
    explanation: `${metalEntry.substance.name} ist unedler als ${saltMetal} und gibt daher Elektronen ab. Die ${saltMetal}-Ionen nehmen sie auf und scheiden sich als Metall ab. Die Reaktion läuft nur in dieser Richtung – umgekehrt passiert nichts.`,
    safetyLevel: 'Schulversuch',
    hazards: ['Schwermetallsalze sind umweltgefährlich – Lösungen gesondert entsorgen.'],
    tags: ['Redoxreaktion', 'Metallabscheidung', 'Spannungsreihe'],
  });
}

/** Metall und Nichtmetall reagieren direkt zum Salz. */
function directSynthesis(a: Reagent, b: Reagent): InorganicReaction | null {
  if (!isElement(a.substance) || !isElement(b.substance)) return null;

  const metals = Object.keys({ Li: 1, Na: 1, K: 1, Mg: 1, Ca: 1, Al: 1, Zn: 1, Fe: 1, Cu: 1 });
  const nonMetals: Record<string, { anion: string; charge: number; name: string }> = {
    Cl2: { anion: 'Cl', charge: -1, name: 'Chlor' },
    Br2: { anion: 'Br', charge: -1, name: 'Brom' },
    I2: { anion: 'I', charge: -1, name: 'Iod' },
    S: { anion: 'S', charge: -2, name: 'Schwefel' },
    O2: { anion: 'O', charge: -2, name: 'Sauerstoff' },
  };

  const metalEntry = metals.includes(a.formula) ? a : metals.includes(b.formula) ? b : null;
  const nonMetalEntry = a.formula in nonMetals ? a : b.formula in nonMetals ? b : null;
  if (!metalEntry || !nonMetalEntry) return null;

  const nonMetal = nonMetals[nonMetalEntry.formula];
  const metal = metalEntry.formula;
  const charge = ['Al'].includes(metal) ? 3 : ['Li', 'Na', 'K'].includes(metal) ? 1 : 2;
  const product = saltFormula(makeCation(metal, charge, ''), makeAnion(nonMetal.anion, nonMetal.charge, ''));
  const isOxide = nonMetal.anion === 'O';

  return build({
    id: `synthese-${metal}-${nonMetalEntry.formula}`,
    type: 'Salzbildung aus den Elementen',
    title: `${metalEntry.substance.name} verbrennt in ${nonMetal.name}`,
    reactants: [metal, nonMetalEntry.formula],
    products: [product],
    observation:
      metal === 'Mg' && isOxide
        ? 'Das Magnesium verbrennt mit grellweißem, blendendem Licht zu einem weißen Pulver.'
        : `Unter Aufglühen entsteht ${product}. Die Reaktion ist stark exotherm.`,
    explanation: `Das Metall gibt ${charge} Elektron${charge > 1 ? 'en' : ''} ab und wird oxidiert, das Nichtmetall nimmt sie auf und wird reduziert. Die entgegengesetzt geladenen Ionen ziehen sich an und bilden ein Ionengitter – daher die hohen Schmelzpunkte von Salzen.`,
    conditions: 'Zünden oder kräftig erhitzen',
    safetyLevel: metal === 'Na' || metal === 'K' ? 'Nur Fachlabor' : 'Laborpraktikum',
    hazards: [
      'Stark exotherme Reaktion mit grellem Licht – Schutzbrille und Abstand.',
      'Nicht in geschlossenen Gefäßen durchführen.',
    ],
    tags: ['Redoxreaktion', 'exotherm', 'Ionenbindung'],
  });
}

/** Metalloxid und Wasser bilden eine Base. */
function oxideAndWater(a: Reagent, b: Reagent): InorganicReaction | null {
  const waterEntry = a.formula === 'H2O' ? a : b.formula === 'H2O' ? b : null;
  const other = waterEntry === a ? b : a;
  if (!waterEntry || waterEntry === other) return null;

  if (other.formula in METAL_OXIDES) {
    const oxide = METAL_OXIDES[other.formula];
    if (![...ALKALI_METALS, ...ALKALINE_EARTH].includes(oxide.metal)) return null;
    const hydroxide = saltFormula(makeCation(oxide.metal, oxide.charge, ''), makeAnion('OH', -1, ''));
    return build({
      id: `oxid-wasser-${other.formula}`,
      type: 'Metalloxid und Wasser',
      title: `${other.substance.name} reagiert mit Wasser`,
      reactants: [other.formula, 'H2O'],
      products: [hydroxide],
      observation:
        other.formula === 'CaO'
          ? 'Das Wasser zischt und verdampft teilweise, der Kalk zerfällt zu einem weißen Pulver. Die Mischung wird sehr heiß («Kalklöschen»).'
          : 'Das Oxid löst sich unter starker Erwärmung; die Lösung reagiert stark alkalisch.',
      explanation:
        'Basische Oxide reagieren mit Wasser zu Hydroxiden. Das Oxid-Ion ist eine sehr starke Base: Es entreißt dem Wasser ein Proton, wodurch zwei Hydroxid-Ionen entstehen. Die Lösung färbt Phenolphthalein pink.',
      safetyLevel: 'Laborpraktikum',
      hazards: ['Stark exotherm – Spritzgefahr durch plötzliches Verdampfen.', 'Die entstehende Lauge ist ätzend.'],
      tags: ['exotherm', 'alkalisch'],
    });
  }

  if (other.formula in ACID_ANHYDRIDES) {
    const anhydride = ACID_ANHYDRIDES[other.formula];
    return build({
      id: `anhydrid-wasser-${other.formula}`,
      type: 'Nichtmetalloxid und Wasser',
      title: `${other.substance.name} löst sich in Wasser`,
      reactants: [other.formula, 'H2O'],
      products: [anhydride.acid],
      observation:
        'Das Gas löst sich; die Lösung reagiert sauer. Blaues Lackmuspapier färbt sich rot, Universalindikator schlägt nach Gelb bis Rot um.',
      explanation: `Nichtmetalloxide sind saure Oxide (Säureanhydride): Mit Wasser bilden sie ${anhydride.acidName}. So entsteht auch saurer Regen, wenn Schwefel- und Stickoxide aus Abgasen in Regentropfen gelangen.`,
      safetyLevel: 'Schulversuch',
      hazards: other.formula === 'SO3' ? ['Die Reaktion von SO₃ mit Wasser ist heftig – technisch wird SO₃ deshalb in Schwefelsäure absorbiert.'] : [],
      tags: ['sauer', 'Säureanhydrid'],
    });
  }

  // Alkalimetall und Wasser
  if (isElement(other.substance) && [...ALKALI_METALS, ...ALKALINE_EARTH].includes(other.formula)) {
    const charge = ALKALI_METALS.includes(other.formula) ? 1 : 2;
    const hydroxide = saltFormula(makeCation(other.formula, charge, ''), makeAnion('OH', -1, ''));
    return build({
      id: `metall-wasser-${other.formula}`,
      type: 'Alkalimetall und Wasser',
      title: `${other.substance.name} reagiert mit Wasser`,
      reactants: [other.formula, 'H2O'],
      products: [hydroxide, 'H2'],
      observation:
        other.formula === 'K'
          ? 'Das Kalium schießt über die Oberfläche, der entstehende Wasserstoff entzündet sich sofort und brennt mit violetter Flamme.'
          : other.formula === 'Na'
            ? 'Das Natrium schmilzt zu einer Kugel, die zischend über die Oberfläche fährt; Phenolphthalein färbt die Lösung pink.'
            : 'Das Metall reagiert unter Gasentwicklung; die Lösung wird alkalisch.',
      explanation:
        'Alkali- und Erdalkalimetalle sind so unedel, dass sie sogar Wasser reduzieren. Sie geben Elektronen an die Protonen des Wassers ab: Es entsteht Wasserstoff, zurück bleibt eine Lauge.',
      conditions: 'kaltes Wasser, hinter Schutzscheibe',
      safetyLevel: 'Nur Fachlabor',
      hazards: [
        'Der entstehende Wasserstoff entzündet sich häufig von selbst.',
        'Nur erbsengroße Stücke verwenden, hinter Schutzscheibe und mit Schutzbrille arbeiten.',
        'Die entstehende Lauge ist stark ätzend.',
      ],
      tags: ['Redoxreaktion', 'Gasentwicklung', 'heftig'],
    });
  }

  return null;
}

/** Fällt ein Hydroxid aus? Base plus Schwermetallsalz. */
function hydroxidePrecipitation(a: Reagent, b: Reagent): InorganicReaction | null {
  const baseEntry = isBase(a.formula) ? a : isBase(b.formula) ? b : null;
  const saltEntry = baseEntry === a ? b : a;
  if (!baseEntry || !saltEntry.salt || baseEntry === saltEntry) return null;
  if (!['NaOH', 'KOH', 'LiOH'].includes(baseEntry.formula)) return null;

  const cation = saltEntry.salt.cation;
  const hydroxideInfo = solubility(cation, makeAnion('OH', -1, ''));
  if (hydroxideInfo.solubility === 'löslich') return null;

  const base = BASES[baseEntry.formula];
  const hydroxide = saltFormula(cation, makeAnion('OH', -1, ''));
  const newSalt = saltFormula(makeCation(base.cation, base.charge, ''), saltEntry.salt.anion);
  const amphoteric = ['Al', 'Zn'].includes(cation.formula);

  return build({
    id: `hydroxidfaellung-${saltEntry.formula}-${baseEntry.formula}`,
    type: amphoteric ? 'Amphoteres Hydroxid' : 'Fällungsreaktion',
    title: `${saltEntry.substance.name} und ${baseEntry.substance.name}`,
    reactants: [saltEntry.formula, baseEntry.formula],
    products: [hydroxide, newSalt],
    ionicEquation: `${cation.label} + ${cation.charge} OH- → ${hydroxide}`,
    observation: `Es fällt ein ${hydroxideInfo.color ?? ''} Niederschlag von ${hydroxide} aus.${amphoteric ? ' Gibt man weitere Lauge zu, löst er sich wieder auf.' : ''}`.replace('  ', ' '),
    explanation: amphoteric
      ? `${cation.name} bildet ein amphoteres Hydroxid: Es löst sich sowohl in Säuren als auch im Überschuss an Lauge – dort als Hydroxokomplex. Genau daran erkennt man Aluminium- und Zink-Ionen im Trennungsgang.`
      : `Die Hydroxid-Ionen der Lauge bilden mit ${cation.name} ein schwer lösliches Hydroxid. Die Farbe des Niederschlags ist ein Hinweis auf das Metall-Ion.`,
    safetyLevel: 'Schulversuch',
    hazards: ['Laugen wirken ätzend, besonders an den Augen.'],
    tags: ['Niederschlag', hydroxideInfo.color ?? '', amphoteric ? 'amphoter' : 'Nachweis'].filter(Boolean),
  });
}

type PairRule = (a: Reagent, b: Reagent) => InorganicReaction | null;

const PAIR_RULES: PairRule[] = [
  neutralisation,
  metalAndAcid,
  metalOxideAndAcid,
  carbonateAndAcid,
  hydroxidePrecipitation,
  precipitation,
  displacement,
  directSynthesis,
  oxideAndWater,
];

/** Wendet alle Regeln auf ein Stoffpaar an. */
export function reactPair(a: Substance, b: Substance): InorganicReaction[] {
  const left = toReagent(a);
  const right = toReagent(b);
  const results: InorganicReaction[] = [];
  const seen = new Set<string>();

  for (const rule of PAIR_RULES) {
    const reaction = rule(left, right);
    if (reaction && !seen.has(reaction.equation)) {
      seen.add(reaction.equation);
      results.push(reaction);
    }
  }

  return results;
}

/** Thermische Zersetzungen und andere Reaktionen eines einzelnen Stoffes. */
export function reactSingle(substance: Substance): InorganicReaction[] {
  const reagent = toReagent(substance);
  const results: InorganicReaction[] = [];

  // Carbonate zerfallen beim Erhitzen in Oxid und Kohlenstoffdioxid
  if (reagent.salt?.anion.formula === 'CO3' && ['Ca', 'Mg', 'Ba', 'Zn', 'Cu'].includes(reagent.salt.cation.formula)) {
    const metal = reagent.salt.cation;
    const oxide = saltFormula(metal, makeAnion('O', -2, ''));
    const reaction = build({
      id: `zersetzung-${reagent.formula}`,
      type: 'Thermische Zersetzung',
      title: `${substance.name} wird gebrannt`,
      reactants: [reagent.formula],
      products: [oxide, 'CO2'],
      observation:
        reagent.formula === 'CaCO3'
          ? 'Beim starken Erhitzen zerfällt der Kalkstein zu weißem, porösem Branntkalk; das entweichende Gas trübt Kalkwasser.'
          : 'Der Feststoff zerfällt unter Gasentwicklung; das Gas trübt Kalkwasser.',
      explanation:
        'Schwer lösliche Carbonate zerfallen beim Erhitzen in das Metalloxid und Kohlenstoffdioxid. Das ist der technische Kalkbrennprozess – die Grundlage für Mörtel und Zement. Bei Alkalicarbonaten gelingt das nicht: Natrium- und Kaliumcarbonat sind thermisch stabil.',
      conditions: 'über 900 °C, Gasbrenner oder Ofen',
      safetyLevel: 'Laborpraktikum',
      hazards: ['Sehr hohe Temperaturen – Tiegelzange und Schutzbrille verwenden.'],
      tags: ['endotherm', 'Gasentwicklung', 'technisches Verfahren'],
    });
    if (reaction) results.push(reaction);
  }

  // Hydrogencarbonate zerfallen schon beim Backen
  if (reagent.salt?.anion.formula === 'HCO3') {
    const metal = reagent.salt.cation;
    const carbonate = saltFormula(metal, makeAnion('CO3', -2, ''));
    const reaction = build({
      id: `zersetzung-${reagent.formula}`,
      type: 'Thermische Zersetzung',
      title: `${substance.name} beim Erhitzen`,
      reactants: [reagent.formula],
      products: [carbonate, 'H2O', 'CO2'],
      observation: 'Der Feststoff zerfällt; es entweichen Wasserdampf und Kohlenstoffdioxid, das Volumen nimmt sichtbar zu.',
      explanation:
        'Hydrogencarbonate zerfallen schon bei moderater Hitze. Genau das macht Natron zum Backtriebmittel: Das freigesetzte Kohlenstoffdioxid lockert den Teig.',
      conditions: 'ab etwa 50–100 °C',
      safetyLevel: 'Schulversuch',
      tags: ['Gasentwicklung', 'Backtriebmittel'],
    });
    if (reaction) results.push(reaction);
  }

  return results;
}
