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
  METAL_SERIES,
  saltFormula,
  solubility,
  splitSalt,
  type Ion,
  type SaltComposition,
} from './ions';
import type { SafetyLevel, Substance } from '../data/types';
import type { Requirements } from '../data/workbenchSpecs';

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
  | 'Amphoteres Hydroxid'
  | 'Ammoniak und Säure'
  | 'Ammoniumsalz und Lauge'
  | 'Säureanhydrid und Base'
  | 'Reduktion von Metalloxiden'
  | 'Aluminothermie'
  | 'Halogenverdrängung'
  | 'Nichtmetall-Synthese'
  | 'Hydratbildung'
  | 'Hydrolyse'
  | 'Katalytische Zersetzung'
  | 'Gasentwicklung mit Säure'
  | 'Komplexbildung';

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
  /** Bedingungen, ohne die die Reaktion nicht abläuft */
  requires: Requirements;
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

/** Säureformel zum Säurerest, für Produkte wie HCl oder HNO3. */
const ACID_BY_ANION: Record<string, string> = {
  Cl: 'HCl', Br: 'HBr', I: 'HI', NO3: 'HNO3', SO4: 'H2SO4', PO4: 'H3PO4', F: 'HF',
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

export interface BuildOptions {
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
  requires?: Requirements;
}

/** Baut eine Reaktion und gleicht die Gleichung aus; null, wenn das misslingt. */
export function buildReaction(options: BuildOptions): InorganicReaction | null {
  return build(options);
}

function build(options: BuildOptions): InorganicReaction | null {
  let balanced: BalanceResult;
  try {
    balanced = balanceSpecies(options.reactants, options.products);
  } catch {
    return null;
  }
  if (balanced.warnings.some((warning) => warning.includes('Keine'))) return null;
  // Scheinreaktionen wie «Fe(OH)2 + KOH → Fe(OH)2 + KOH» verwerfen
  const sortedKey = (list: string[]) => [...list].sort().join('|');
  if (sortedKey(options.reactants) === sortedKey(options.products)) return null;

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
    requires: options.requires ?? {},
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
    requires: { aqueous: true },
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
      requires: { aqueous: true },
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
    requires: { aqueous: true },
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
    requires: { aqueous: true },
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
    requires: { aqueous: true },
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

/** Ionenpaar eines Salzes oder einer Säure. */
function ionsOf(reagent: Reagent): SaltComposition | null {
  // Säuren zuerst: H2SO4 soll als 2 H+ und SO4 2- gelten, nicht als H+ und HSO4-
  const acid = ACIDS[reagent.formula];
  if (!acid && reagent.salt) return reagent.salt;
  if (!acid || acid.anion === 'CH3COO') return null;
  const charge = ['SO4', 'CO3', 'SO3'].includes(acid.anion) ? -2 : acid.anion === 'PO4' ? -3 : -1;
  return {
    cation: makeCation('H', 1, 'Proton'),
    anion: makeAnion(acid.anion, charge, ''),
    cationCount: -charge,
    anionCount: 1,
    hydrate: 0,
    anhydrous: reagent.formula,
  };
}

/** Zwei lösliche Salze (oder Salz und Säure) bilden einen Niederschlag. */
function precipitation(left: Reagent, right: Reagent): InorganicReaction | null {
  const leftIons = ionsOf(left);
  const rightIons = ionsOf(right);
  if (!leftIons || !rightIons) return null;
  if (leftIons.cation.formula === 'H' && rightIons.cation.formula === 'H') return null;
  const a = { ...left, salt: leftIons };
  const b = { ...right, salt: rightIons };
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
  const otherFormula = other.cation.formula === 'H' ? ACID_BY_ANION[other.anion.formula] ?? saltFormula(other.cation, other.anion) : saltFormula(other.cation, other.anion);
  if (sameComposition(precipitateFormula, a.formula) || sameComposition(precipitateFormula, b.formula)) return null;

  const anionName = ANION_NAMES[precipitate.anion.formula] ?? precipitate.anion.formula;

  return build({
    id: `faellung-${a.formula}-${b.formula}`,
    type: 'Fällungsreaktion',
    requires: { aqueous: true },
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
  // Säuren sind formal «Wasserstoffsalze» – das regelt metalAndAcid
  if (saltMetal === 'H' || saltMetal === 'NH4') return null;
  if (!displaces(metal, saltMetal)) return null;
  if (solubility(saltEntry.salt.cation, saltEntry.salt.anion).solubility !== 'löslich') return null;

  const charge = ['Al', 'Cr'].includes(metal) ? 3 : ['Na', 'K', 'Li'].includes(metal) ? 1 : 2;
  const newSalt = saltFormula(makeCation(metal, charge, ''), saltEntry.salt.anion);

  return build({
    id: `verdraengung-${metal}-${saltEntry.formula}`,
    type: 'Metallverdrängung',
    requires: { aqueous: true },
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

  // Einige Metalle bilden nicht das «naheliegende» Salz: Eisen verbrennt in
  // Chlor zu FeCl3 und an Luft zu Fe3O4, Kupfer mit Schwefel zu Cu2S,
  // Natrium an Luft zum Peroxid. Kalium bildet das Hyperoxid – das wird nicht
  // angeboten, statt ein falsches Produkt zu zeigen.
  const special: Record<string, string | null> = {
    'Fe|Cl2': 'FeCl3',
    'Fe|Br2': 'FeBr3',
    'Fe|O2': 'Fe3O4',
    'Cu|S': 'Cu2S',
    'Cu|I2': 'CuI',
    'Na|O2': 'Na2O2',
    'K|O2': null,
  };
  const key = `${metal}|${nonMetalEntry.formula}`;
  if (key in special && special[key] === null) return null;
  const product =
    special[key] ?? saltFormula(makeCation(metal, charge, ''), makeAnion(nonMetal.anion, nonMetal.charge, ''));
  const isOxide = nonMetal.anion === 'O';

  return build({
    id: `synthese-${metal}-${nonMetalEntry.formula}`,
    type: 'Salzbildung aus den Elementen',
    requires: { heat: true },
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
    requires: { aqueous: true },
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


// ======================================================================
// Weitere Reaktionstypen
// ======================================================================

/** Summenformel eines organischen Stoffes, falls er nur C, H, O, N, S enthält. */
function combustibleCounts(substance: Substance): Record<string, number> | null {
  if (!substance.smiles) return null;
  try {
    const parsed = parseFormula(substance.formula);
    if (parsed.charge !== 0 || !parsed.counts.C || !parsed.counts.H) return null;
    if (Object.keys(parsed.counts).some((element) => !['C', 'H', 'O', 'N', 'S'].includes(element))) return null;
    return parsed.counts;
  } catch {
    return null;
  }
}

/** Organische Stoffe verbrennen zu Kohlenstoffdioxid und Wasser. */
function combustion(a: Reagent, b: Reagent): InorganicReaction | null {
  const oxygen = a.formula === 'O2' ? a : b.formula === 'O2' ? b : null;
  const fuel = oxygen === a ? b : a;
  if (!oxygen || fuel === oxygen) return null;
  const counts = combustibleCounts(fuel.substance);
  if (!counts) return null;

  const products = ['CO2', 'H2O'];
  if (counts.N) products.push('N2');
  if (counts.S) products.push('SO2');
  const sooty = counts.C >= 6 && counts.C / counts.H >= 0.8;

  return build({
    id: `verbrennung-${fuel.substance.id}`,
    type: 'Verbrennung',
    requires: { heat: true },
    title: `Verbrennung von ${fuel.substance.name}`,
    reactants: [fuel.formula, 'O2'],
    products,
    observation: sooty
      ? 'Der Stoff verbrennt mit stark rußender, gelber Flamme – typisch für kohlenstoffreiche Aromaten.'
      : 'Der Stoff verbrennt mit bläulicher bis gelber Flamme. Das Abgas trübt Kalkwasser (Kohlenstoffdioxid), an einer kalten Glasfläche beschlägt Wasser.',
    explanation:
      'Bei der vollständigen Verbrennung wird der gesamte Kohlenstoff zu Kohlenstoffdioxid und der Wasserstoff zu Wasser oxidiert. Die Reaktion ist stark exotherm – ihre Energie nutzen wir in Motoren, Heizungen und in der Zellatmung (dort in vielen kleinen Schritten).',
    conditions: 'Zünden, ausreichend Sauerstoff',
    safetyLevel: 'Laborpraktikum',
    hazards: ['Brandgefahr – nur kleine Mengen und nie in geschlossenen Gefäßen verbrennen.', 'Bei Sauerstoffmangel entsteht giftiges Kohlenstoffmonoxid.'],
    tags: ['exotherm', 'Verbrennung', 'Redoxreaktion'],
  });
}

/** Nichtmetalle untereinander: Knallgas, Chlorknallgas, Schwefel- und Kohleverbrennung. */
function nonMetalSynthesis(a: Reagent, b: Reagent): InorganicReaction | null {
  const pair = [a.formula, b.formula].sort().join('+');
  const table: Record<string, { products: string[]; title: string; observation: string; explanation: string; requires: Requirements; level: SafetyLevel; hazards: string[] }> = {
    'H2+O2': {
      products: ['H2O'],
      title: 'Knallgasreaktion',
      observation: 'Beim Zünden reagiert das Gemisch mit lautem Knall; an der Gefäßwand beschlägt Wasser.',
      explanation: 'Wasserstoff und Sauerstoff reagieren in einer Radikalkettenreaktion explosionsartig zu Wasser. Genau darauf beruht die Knallgasprobe zum Nachweis von Wasserstoff.',
      requires: { heat: true },
      level: 'Laborpraktikum',
      hazards: ['Explosionsgefahr – nur kleinste Mengen im Reagenzglas zünden.'],
    },
    'Cl2+H2': {
      products: ['HCl'],
      title: 'Chlorknallgas',
      observation: 'Im Dunkeln passiert nichts; bei Belichtung reagiert das Gemisch explosionsartig, es entsteht Chlorwasserstoff (Nebel an feuchter Luft).',
      explanation: 'Licht spaltet Chlormoleküle in Radikale und startet eine Kettenreaktion – das Lehrbuchbeispiel für einen Radikalkettenmechanismus.',
      requires: { light: true },
      level: 'Nur Fachlabor',
      hazards: ['Explosionsgefahr durch Licht.', 'Chlor und Chlorwasserstoff sind giftig und ätzend.'],
    },
    'O2+S': {
      products: ['SO2'],
      title: 'Schwefel verbrennt',
      observation: 'Schwefel schmilzt und verbrennt mit kleiner blauer Flamme; es entsteht ein stechend riechendes Gas.',
      explanation: 'Schwefel wird zu Schwefeldioxid oxidiert, dem Ausgangsstoff der Schwefelsäureherstellung – und einer Ursache des sauren Regens.',
      requires: { heat: true },
      level: 'Laborpraktikum',
      hazards: ['Schwefeldioxid reizt die Atemwege stark – nur im Abzug.'],
    },
    'C+O2': {
      products: ['CO2'],
      title: 'Kohlenstoff verbrennt',
      observation: 'Die Kohle glüht auf; das entstehende Gas trübt Kalkwasser.',
      explanation: 'Kohlenstoff wird vollständig zu Kohlenstoffdioxid oxidiert. Bei Sauerstoffmangel entstünde giftiges Kohlenstoffmonoxid.',
      requires: { heat: true },
      level: 'Schulversuch',
      hazards: ['Glut und heiße Asche.'],
    },
    'O2+P': {
      products: ['P4O10'],
      title: 'Phosphor verbrennt',
      observation: 'Phosphor verbrennt mit greller Flamme zu dichtem weißem Rauch.',
      explanation: 'Phosphor wird zu Phosphor(V)-oxid oxidiert, das mit Luftfeuchtigkeit Phosphorsäure bildet.',
      requires: { heat: true },
      level: 'Nur Fachlabor',
      hazards: ['Heftige Verbrennung, der Rauch ist ätzend.'],
    },
  };
  const entry = table[pair];
  if (!entry) return null;
  return build({
    id: `nichtmetall-${pair}`,
    type: 'Nichtmetall-Synthese',
    requires: entry.requires,
    title: entry.title,
    reactants: [a.formula, b.formula],
    products: entry.products,
    observation: entry.observation,
    explanation: entry.explanation,
    conditions: entry.requires.light ? 'Belichtung' : 'Zünden',
    safetyLevel: entry.level,
    hazards: entry.hazards,
    tags: ['Redoxreaktion', 'exotherm'],
  });
}

/** Ammoniak ist eine Base und bildet mit Säuren Ammoniumsalze. */
function ammoniaAndAcid(a: Reagent, b: Reagent): InorganicReaction | null {
  const ammonia = a.formula === 'NH3' ? a : b.formula === 'NH3' ? b : null;
  const acidEntry = isAcid(a.formula) ? a : isAcid(b.formula) ? b : null;
  if (!ammonia || !acidEntry) return null;
  const acid = ACIDS[acidEntry.formula];
  const charge = ['SO4', 'CO3', 'SO3'].includes(acid.anion) ? -2 : acid.anion === 'PO4' ? -3 : -1;
  const salt = saltFormula(makeCation('NH4', 1, ''), makeAnion(acid.anion, charge, ''));
  return build({
    id: `ammoniak-${acidEntry.formula}`,
    type: 'Ammoniak und Säure',
    title: `Ammoniak und ${acidEntry.substance.name}`,
    reactants: ['NH3', acidEntry.formula],
    products: [salt],
    observation:
      acidEntry.formula === 'HCl'
        ? 'Treffen die Dämpfe von Ammoniak und Salzsäure aufeinander, entsteht ein dichter weißer Rauch aus Ammoniumchlorid.'
        : 'Die Lösung erwärmt sich; beim Eindampfen bleibt das Ammoniumsalz zurück.',
    explanation:
      'Ammoniak nimmt mit seinem freien Elektronenpaar ein Proton der Säure auf und wird zum Ammonium-Ion – eine Säure-Base-Reaktion nach Brønsted ohne Wasserbildung. So werden Ammoniumdünger hergestellt.',
    safetyLevel: 'Schulversuch',
    hazards: ['Ammoniak und konzentrierte Säuren reizen die Atemwege – im Abzug arbeiten.'],
    tags: ['Säure-Base-Reaktion', 'Salzbildung', acidEntry.formula === 'HCl' ? 'Rauch' : 'exotherm'],
  });
}

/** Ammoniumsalze setzen mit starken Laugen Ammoniak frei. */
function ammoniumAndBase(a: Reagent, b: Reagent): InorganicReaction | null {
  const ammonium = [a, b].find((entry) => entry.salt?.cation.formula === 'NH4');
  const baseEntry = [a, b].find((entry) => ['NaOH', 'KOH', 'Ca(OH)2', 'LiOH'].includes(entry.formula));
  if (!ammonium || !baseEntry || !ammonium.salt) return null;
  const base = BASES[baseEntry.formula];
  const newSalt = saltFormula(makeCation(base.cation, base.charge, ''), ammonium.salt.anion);
  return build({
    id: `ammonium-lauge-${ammonium.formula}-${baseEntry.formula}`,
    type: 'Ammoniumsalz und Lauge',
    requires: { heat: true },
    title: `${ammonium.substance.name} und ${baseEntry.substance.name}`,
    reactants: [ammonium.formula, baseEntry.formula],
    products: [newSalt, 'NH3', 'H2O'],
    ionicEquation: 'NH4+ + OH- → NH3 + H2O',
    observation:
      'Beim Erwärmen riecht es stechend nach Ammoniak; ein angefeuchtetes rotes Lackmuspapier über der Öffnung färbt sich blau.',
    explanation:
      'Die starke Base entreißt dem Ammonium-Ion ein Proton. Das freigesetzte Ammoniak entweicht als Gas – der klassische Nachweis für Ammonium-Ionen.',
    safetyLevel: 'Schulversuch',
    hazards: ['Ammoniak reizt Augen und Atemwege.', 'Laugen sind ätzend.'],
    tags: ['Gasentwicklung', 'Nachweis', 'Ammoniak'],
  });
}

/** Saure Oxide reagieren mit Laugen zu Salzen – etwa die Kalkwassertrübung. */
function anhydrideAndBase(a: Reagent, b: Reagent): InorganicReaction | null {
  const anhydrides: Record<string, { anion: string; charge: number }> = {
    CO2: { anion: 'CO3', charge: -2 },
    SO2: { anion: 'SO3', charge: -2 },
    SO3: { anion: 'SO4', charge: -2 },
  };
  const oxide = a.formula in anhydrides ? a : b.formula in anhydrides ? b : null;
  const baseEntry = isBase(a.formula) ? a : isBase(b.formula) ? b : null;
  if (!oxide || !baseEntry) return null;
  const base = BASES[baseEntry.formula];
  if (!['Na', 'K', 'Li', 'Ca', 'Ba'].includes(base.cation)) return null;
  const target = anhydrides[oxide.formula];
  const cation = makeCation(base.cation, base.charge, '');
  const anion = makeAnion(target.anion, target.charge, '');
  const salt = saltFormula(cation, anion);
  const info = solubility(cation, anion);
  const limewater = oxide.formula === 'CO2' && ['Ca', 'Ba'].includes(base.cation);
  return build({
    id: `anhydrid-base-${oxide.formula}-${baseEntry.formula}`,
    type: 'Säureanhydrid und Base',
    requires: { aqueous: true },
    title: limewater ? 'Kalkwasserprobe' : `${oxide.substance.name} in ${baseEntry.substance.name}`,
    reactants: [oxide.formula, baseEntry.formula],
    products: [salt, 'H2O'],
    observation: limewater
      ? 'Das klare Kalkwasser trübt sich milchig weiß – es fällt Carbonat aus. Das ist der Nachweis für Kohlenstoffdioxid.'
      : info.solubility === 'löslich'
        ? 'Das Gas wird von der Lauge aufgenommen; die Lösung bleibt klar.'
        : `Es fällt ${info.color ?? 'ein'} ${salt} aus.`,
    explanation:
      'Nichtmetalloxide sind Säureanhydride: Mit Wasser bilden sie Säuren, mit Laugen deshalb direkt Salze. Kohlenstoffdioxid und Kalkwasser ergeben unlösliches Calciumcarbonat – daher die Trübung.',
    safetyLevel: 'Schulversuch',
    hazards: ['Laugen sind ätzend.'],
    tags: limewater ? ['Niederschlag', 'Nachweis', 'weiß'] : ['Säure-Base-Reaktion'],
  });
}

/** Wasserstoff, Kohle oder Kohlenstoffmonoxid reduzieren edlere Metalloxide. */
function oxideReduction(a: Reagent, b: Reagent): InorganicReaction | null {
  const reducers: Record<string, { product: string; limit: number; name: string }> = {
    H2: { product: 'H2O', limit: -0.5, name: 'Wasserstoff' },
    C: { product: 'CO2', limit: -0.8, name: 'Kohlenstoff' },
    CO: { product: 'CO2', limit: -0.5, name: 'Kohlenstoffmonoxid' },
  };
  const reducer = a.formula in reducers ? a : b.formula in reducers ? b : null;
  const oxide = reducer === a ? b : a;
  if (!reducer || !(oxide.formula in METAL_OXIDES)) return null;
  const { metal } = METAL_OXIDES[oxide.formula];
  const potential = METAL_SERIES[metal];
  const spec = reducers[reducer.formula];
  if (potential === undefined || potential < spec.limit) return null;
  return build({
    id: `reduktion-${oxide.formula}-${reducer.formula}`,
    type: 'Reduktion von Metalloxiden',
    requires: { heat: true },
    title: `${oxide.substance.name} wird mit ${spec.name} reduziert`,
    reactants: [oxide.formula, reducer.formula],
    products: [metal, spec.product],
    observation:
      metal === 'Cu'
        ? 'Das schwarze Kupferoxid glüht auf und wird zu rotbraunem, metallischem Kupfer.'
        : `Aus dem Oxid entsteht metallisches ${metal}.`,
    explanation: `${spec.name} hat eine größere Affinität zum Sauerstoff als ${metal} und entreißt dem Oxid den Sauerstoff. So gewinnt man seit Jahrtausenden Metalle aus Erzen – im Hochofen mit Koks und Kohlenstoffmonoxid.`,
    conditions: 'kräftig erhitzen',
    safetyLevel: reducer.formula === 'H2' ? 'Fortgeschritten' : 'Laborpraktikum',
    hazards:
      reducer.formula === 'H2'
        ? ['Wasserstoff muss vor dem Erhitzen die Luft vollständig verdrängt haben – Knallgasgefahr.']
        : reducer.formula === 'CO'
          ? ['Kohlenstoffmonoxid ist ein farb- und geruchloses Atemgift.']
          : ['Sehr hohe Temperaturen.'],
    tags: ['Redoxreaktion', 'Metallgewinnung'],
  });
}

/** Unedles Metall entreißt einem Metalloxid den Sauerstoff (Thermit-Typ). */
function aluminothermy(a: Reagent, b: Reagent): InorganicReaction | null {
  const metalEntry = ['Al', 'Mg'].includes(a.formula) ? a : ['Al', 'Mg'].includes(b.formula) ? b : null;
  const oxide = metalEntry === a ? b : a;
  if (!metalEntry || !(oxide.formula in METAL_OXIDES)) return null;
  const target = METAL_OXIDES[oxide.formula].metal;
  if (target === metalEntry.formula || !displaces(metalEntry.formula, target)) return null;
  if ((METAL_SERIES[target] ?? -9) - (METAL_SERIES[metalEntry.formula] ?? 0) < 0.8) return null;
  const newOxide = metalEntry.formula === 'Al' ? 'Al2O3' : 'MgO';
  return build({
    id: `thermit-${metalEntry.formula}-${oxide.formula}`,
    type: 'Aluminothermie',
    requires: { heat: true },
    title: `${metalEntry.substance.name} und ${oxide.substance.name}`,
    reactants: [metalEntry.formula, oxide.formula],
    products: [newOxide, target],
    observation:
      'Nach dem Zünden läuft die Reaktion unter grellem Licht und Funkenflug von selbst weiter; es entsteht flüssiges Metall.',
    explanation: `${metalEntry.substance.name} bindet Sauerstoff viel fester als ${target}. Die Differenz der Bildungsenthalpien wird als Wärme frei – so viel, dass das entstehende Metall schmilzt. Mit Eisenoxid schweißt man so Eisenbahnschienen.`,
    conditions: 'Zünden mit Magnesiumband, in Sand',
    safetyLevel: 'Nur Fachlabor',
    hazards: ['Temperaturen über 2000 °C, flüssiges Metall und Funkenflug.', 'Nur im Freien, in Sand und mit großem Abstand.'],
    tags: ['Redoxreaktion', 'stark exotherm'],
  });
}

/** Stärkere Halogene verdrängen schwächere aus ihren Salzen. */
function halogenDisplacement(a: Reagent, b: Reagent): InorganicReaction | null {
  const order = ['Cl2', 'Br2', 'I2'];
  const halogen = order.includes(a.formula) ? a : order.includes(b.formula) ? b : null;
  const salt = halogen === a ? b : a;
  if (!halogen || !salt.salt) return null;
  const anion = salt.salt.anion.formula;
  const anionHalogen = `${anion}2`;
  if (!order.includes(anionHalogen)) return null;
  if (order.indexOf(halogen.formula) >= order.indexOf(anionHalogen)) return null;
  const newSalt = saltFormula(salt.salt.cation, makeAnion(halogen.formula.replace('2', ''), -1, ''));
  return build({
    id: `halogen-${halogen.formula}-${salt.formula}`,
    type: 'Halogenverdrängung',
    requires: { aqueous: true },
    title: `${halogen.substance.name} und ${salt.substance.name}`,
    reactants: [halogen.formula, salt.formula],
    products: [newSalt, anionHalogen],
    observation:
      anionHalogen === 'I2'
        ? 'Die Lösung färbt sich braun; mit Stärke wird sie blauschwarz – es ist Iod entstanden.'
        : 'Die Lösung färbt sich gelbbraun – es ist Brom entstanden.',
    explanation:
      'Die Oxidationskraft der Halogene nimmt von Fluor zu Iod ab. Ein stärkeres Halogen nimmt dem Halogenid-Ion eines schwächeren das Elektron weg.',
    safetyLevel: 'Laborpraktikum',
    hazards: ['Chlor und Brom sind giftig und ätzend – im Abzug arbeiten.'],
    tags: ['Redoxreaktion', 'Halogene'],
  });
}

/** Säuren setzen aus Sulfiden, Sulfiten und Thiosulfat Gase frei. */
function gasFromAcid(a: Reagent, b: Reagent): InorganicReaction | null {
  const acidEntry = isAcid(a.formula) ? a : isAcid(b.formula) ? b : null;
  const saltEntry = acidEntry === a ? b : a;
  if (!acidEntry || !saltEntry.salt) return null;
  const anion = saltEntry.salt.anion.formula;
  const acid = ACIDS[acidEntry.formula];
  if (!acid.strong || !['S', 'SO3', 'S2O3'].includes(anion)) return null;
  const charge = ['SO4'].includes(acid.anion) ? -2 : acid.anion === 'PO4' ? -3 : -1;
  const salt = saltFormula(saltEntry.salt.cation, makeAnion(acid.anion, charge, ''));
  const variants: Record<string, { products: string[]; observation: string; explanation: string; hazards: string[]; level: SafetyLevel }> = {
    S: {
      products: [salt, 'H2S'],
      observation: 'Es entweicht ein Gas mit Geruch nach faulen Eiern; Bleiacetatpapier färbt sich schwarz.',
      explanation: 'Die starke Säure verdrängt die schwache, flüchtige Säure Schwefelwasserstoff aus ihrem Salz.',
      hazards: ['Schwefelwasserstoff ist sehr giftig und lähmt in höherer Konzentration den Geruchssinn – nur im Abzug und in kleinsten Mengen.'],
      level: 'Nur Fachlabor',
    },
    SO3: {
      products: [salt, 'H2O', 'SO2'],
      observation: 'Es entweicht ein stechend riechendes Gas (Schwefeldioxid).',
      explanation: 'Die Säure setzt aus dem Sulfit Schweflige Säure frei, die in Wasser und Schwefeldioxid zerfällt.',
      hazards: ['Schwefeldioxid reizt die Atemwege – im Abzug arbeiten.'],
      level: 'Laborpraktikum',
    },
    S2O3: {
      products: [salt, 'S', 'SO2', 'H2O'],
      observation: 'Nach kurzer Zeit trübt sich die Lösung gelblich-weiß durch ausfallenden Schwefel – die «Schwefeluhr».',
      explanation: 'Thiosulfat zerfällt im Sauren in Schwefel und Schwefeldioxid. Die Zeit bis zur Trübung hängt von Konzentration und Temperatur ab – ein klassischer Versuch zur Reaktionsgeschwindigkeit.',
      hazards: ['Es entsteht Schwefeldioxid – gut lüften.'],
      level: 'Schulversuch',
    },
  };
  const variant = variants[anion];
  return build({
    id: `gas-${saltEntry.formula}-${acidEntry.formula}`,
    type: 'Gasentwicklung mit Säure',
    requires: { aqueous: true },
    title: `${saltEntry.substance.name} und ${acidEntry.substance.name}`,
    reactants: [saltEntry.formula, acidEntry.formula],
    products: variant.products,
    observation: variant.observation,
    explanation: variant.explanation,
    safetyLevel: variant.level,
    hazards: variant.hazards,
    tags: ['Gasentwicklung'],
  });
}

/** Stoffe, die mit Wasser heftig oder charakteristisch reagieren. */
function waterSpecial(a: Reagent, b: Reagent): InorganicReaction | null {
  const water = a.formula === 'H2O' ? a : b.formula === 'H2O' ? b : null;
  const other = water === a ? b : a;
  if (!water || other === water) return null;
  const table: Record<string, { products: string[]; title: string; observation: string; explanation: string; requires: Requirements; level: SafetyLevel; hazards: string[]; type: InorganicReactionType }> = {
    CaC2: {
      products: ['C2H2', 'Ca(OH)2'],
      title: 'Carbid und Wasser',
      observation: 'Heftige Gasentwicklung; das Gas (Ethin) riecht durch Verunreinigungen nach Knoblauch und brennt mit stark rußender Flamme.',
      explanation: 'Das Carbid-Ion ist eine extrem starke Base und nimmt zwei Protonen des Wassers auf. So wurden früher Grubenlampen und Fahrradlampen betrieben.',
      requires: {},
      level: 'Laborpraktikum',
      hazards: ['Ethin ist hochentzündlich und bildet mit Luft explosive Gemische.'],
      type: 'Hydrolyse',
    },
    NaH: {
      products: ['NaOH', 'H2'],
      title: 'Natriumhydrid und Wasser',
      observation: 'Heftige Wasserstoffentwicklung, oft mit Entzündung.',
      explanation: 'Das Hydrid-Ion ist eine sehr starke Base und reagiert mit dem Proton des Wassers zu Wasserstoff.',
      requires: {},
      level: 'Nur Fachlabor',
      hazards: ['Selbstentzündung möglich – niemals mit Wasser in Berührung bringen außer zur kontrollierten Vernichtung.'],
      type: 'Hydrolyse',
    },
    NaNH2: {
      products: ['NaOH', 'NH3'],
      title: 'Natriumamid und Wasser',
      observation: 'Heftige Reaktion, es riecht nach Ammoniak.',
      explanation: 'Das Amid-Ion ist eine stärkere Base als Hydroxid und entreißt dem Wasser ein Proton.',
      requires: {},
      level: 'Nur Fachlabor',
      hazards: ['Heftige Reaktion, ätzende Produkte.'],
      type: 'Hydrolyse',
    },
    Mg: {
      products: ['Mg(OH)2', 'H2'],
      title: 'Magnesium und heißes Wasser',
      observation: 'In kaltem Wasser kaum Reaktion, in siedendem Wasser steigen Gasbläschen auf; Phenolphthalein färbt sich rosa.',
      explanation: 'Magnesium ist unedel genug, um Wasser zu reduzieren, wird aber von einer Hydroxidschicht geschützt. Erst die Wärme macht die Reaktion merklich.',
      requires: { heat: true },
      level: 'Schulversuch',
      hazards: ['Heißes Wasser – Verbrühungsgefahr.'],
      type: 'Alkalimetall und Wasser',
    },
    CuSO4: {
      products: ['CuSO4·5H2O'],
      title: 'Wassernachweis mit Kupfersulfat',
      observation: 'Das weiße Pulver färbt sich sofort blau.',
      explanation: 'Wasserfreies Kupfersulfat nimmt Wasser als Liganden auf. Erst die Aqua-Komplexe der Kupfer-Ionen sind blau – deshalb dient es als empfindlicher Wassernachweis.',
      requires: {},
      level: 'Schulversuch',
      hazards: ['Kupfersulfat ist gesundheitsschädlich und umweltgefährlich.'],
      type: 'Hydratbildung',
    },
  };
  const entry = table[other.formula];
  if (!entry) return null;
  return build({
    id: `wasser-${other.formula}`,
    type: entry.type,
    requires: entry.requires,
    title: entry.title,
    reactants: [other.formula, 'H2O'],
    products: entry.products,
    observation: entry.observation,
    explanation: entry.explanation,
    safetyLevel: entry.level,
    hazards: entry.hazards,
    tags: entry.type === 'Hydratbildung' ? ['Nachweis', 'Farbwechsel'] : ['Gasentwicklung'],
  });
}

/** Magnesium brennt sogar in Kohlenstoffdioxid weiter. */
function magnesiumCarbonDioxide(a: Reagent, b: Reagent): InorganicReaction | null {
  if ([a.formula, b.formula].sort().join('+') !== 'CO2+Mg') return null;
  return build({
    id: 'magnesium-co2',
    type: 'Reduktion von Metalloxiden',
    requires: { heat: true },
    title: 'Magnesium brennt in Kohlenstoffdioxid',
    reactants: ['Mg', 'CO2'],
    products: ['MgO', 'C'],
    observation: 'Das brennende Magnesiumband erlischt nicht, sondern brennt weiter; es bleiben weißes Magnesiumoxid und schwarze Rußflocken zurück.',
    explanation: 'Magnesium bindet Sauerstoff so fest, dass es ihn sogar dem Kohlenstoffdioxid entreißt. Deshalb darf man Metallbrände nie mit CO₂-Löschern löschen.',
    conditions: 'brennendes Magnesium in CO₂-Atmosphäre',
    safetyLevel: 'Laborpraktikum',
    hazards: ['Grelles Licht, nicht direkt hineinsehen.'],
    tags: ['Redoxreaktion', 'Löschmittel'],
  });
}

/** Katalytische Zersetzung von Wasserstoffperoxid. */
function peroxideDecomposition(a: Reagent, b: Reagent): InorganicReaction | null {
  const peroxide = a.formula === 'H2O2' ? a : b.formula === 'H2O2' ? b : null;
  const catalyst = peroxide === a ? b : a;
  if (!peroxide || !['MnO2', 'KI', 'Pt', 'FeCl3'].includes(catalyst.formula)) return null;
  return build({
    id: `peroxid-${catalyst.formula}`,
    type: 'Katalytische Zersetzung',
    title: `Wasserstoffperoxid mit ${catalyst.substance.name}`,
    reactants: ['H2O2'],
    products: ['H2O', 'O2'],
    observation:
      catalyst.formula === 'KI'
        ? 'Stürmische Gasentwicklung; mit Spülmittel entsteht ein dicker Schaumberg («Elefantenzahnpasta»). Ein glimmender Span flammt im Gas auf.'
        : 'Lebhafte Gasentwicklung. Ein glimmender Holzspan flammt im Gas hell auf – der Nachweis für Sauerstoff.',
    explanation: `${catalyst.substance.name} wird nicht verbraucht, senkt aber die Aktivierungsenergie der Zersetzung erheblich. Ohne Katalysator zerfällt Wasserstoffperoxid nur sehr langsam.`,
    safetyLevel: 'Schulversuch',
    hazards: ['Konzentriertes Wasserstoffperoxid verätzt die Haut.', 'Die Reaktion ist exotherm, der Schaum kann heiß sein.'],
    tags: ['Katalyse', 'Gasentwicklung', 'Sauerstoff'],
  });
}

type PairRule = (a: Reagent, b: Reagent) => InorganicReaction | null;

const PAIR_RULES: PairRule[] = [
  peroxideDecomposition,
  combustion,
  nonMetalSynthesis,
  ammoniaAndAcid,
  ammoniumAndBase,
  anhydrideAndBase,
  oxideReduction,
  aluminothermy,
  magnesiumCarbonDioxide,
  halogenDisplacement,
  gasFromAcid,
  waterSpecial,
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
      requires: { heat: true, solid: true },
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
  // (Ammoniumhydrogencarbonat zerfällt vollständig, siehe unten)
  if (reagent.salt?.anion.formula === 'HCO3' && reagent.salt.cation.formula !== 'NH4') {
    const metal = reagent.salt.cation;
    const carbonate = saltFormula(metal, makeAnion('CO3', -2, ''));
    const reaction = build({
      id: `zersetzung-${reagent.formula}`,
      type: 'Thermische Zersetzung',
      requires: { heat: true, solid: true },
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

  // Weitere Zersetzungen beim Erhitzen
  const decompositions: Record<string, { products: string[]; observation: string; explanation: string; level: SafetyLevel; hazards: string[]; tags: string[] }> = {
    NH4Cl: {
      products: ['NH3', 'HCl'],
      observation: 'Der weiße Feststoff verschwindet scheinbar und schlägt sich am kalten Teil des Reagenzglases wieder nieder.',
      explanation: 'Ammoniumchlorid zerfällt in Ammoniak und Chlorwasserstoff, die sich an kälteren Stellen wieder vereinigen – das sieht aus wie Sublimation, ist aber eine Zersetzung mit Rückreaktion.',
      level: 'Schulversuch', hazards: ['Ammoniak und Chlorwasserstoff reizen die Atemwege.'], tags: ['Gleichgewicht', 'Scheinsublimation'],
    },
    '(NH4)2CO3': {
      products: ['NH3', 'CO2', 'H2O'],
      observation: 'Der Feststoff zerfällt vollständig in Gase; es riecht nach Ammoniak.',
      explanation: 'Ammoniumcarbonat zerfällt beim Erwärmen rückstandsfrei. Deshalb eignet sich Hirschhornsalz als Triebmittel für flaches Gebäck, aus dem das Ammoniak entweichen kann.',
      level: 'Schulversuch', hazards: ['Ammoniakgeruch.'], tags: ['Gasentwicklung', 'Backtriebmittel'],
    },
    NH4HCO3: {
      products: ['NH3', 'CO2', 'H2O'],
      observation: 'Der Feststoff zerfällt vollständig in Gase; es riecht nach Ammoniak.',
      explanation: 'Hirschhornsalz zerfällt rückstandsfrei in Ammoniak, Kohlenstoffdioxid und Wasser – die Gase lockern den Teig.',
      level: 'Schulversuch', hazards: ['Ammoniakgeruch.'], tags: ['Gasentwicklung', 'Backtriebmittel'],
    },
    KClO3: {
      products: ['KCl', 'O2'],
      observation: 'Die Schmelze gibt Sauerstoff ab; ein glimmender Span flammt auf. Mit etwas Braunstein gelingt das schon bei niedrigerer Temperatur.',
      explanation: 'Kaliumchlorat ist sauerstoffreich und gibt beim Erhitzen Sauerstoff ab – früher eine übliche Laborquelle für Sauerstoff.',
      level: 'Fortgeschritten', hazards: ['Chlorate bilden mit brennbaren Stoffen explosionsfähige Gemische – nur rein und in kleinen Mengen erhitzen.'], tags: ['Gasentwicklung', 'Sauerstoff'],
    },
    HgO: {
      products: ['Hg', 'O2'],
      observation: 'Das rote Pulver zerfällt; an der kalten Glaswand schlagen sich silbrige Quecksilbertröpfchen nieder, ein glimmender Span flammt auf.',
      explanation: 'Mit genau diesem Versuch entdeckten Priestley und Lavoisier den Sauerstoff. Heute wird er wegen des giftigen Quecksilbers nicht mehr durchgeführt.',
      level: 'Nur Fachlabor', hazards: ['Quecksilberdampf ist sehr giftig – nur als Gedankenexperiment.'], tags: ['Gasentwicklung', 'historisch'],
    },
    Ag2O: {
      products: ['Ag', 'O2'],
      observation: 'Das braune Pulver wird zu glänzendem Silber; es entweicht Sauerstoff.',
      explanation: 'Silberoxid ist so wenig stabil, dass schon mäßiges Erhitzen genügt, um es in die Elemente zu zerlegen – Silber ist ein edles Metall.',
      level: 'Schulversuch', hazards: ['Heiße Glasgeräte.'], tags: ['Gasentwicklung', 'Edelmetall'],
    },
    'Cu(OH)2': {
      products: ['CuO', 'H2O'],
      observation: 'Der hellblaue Niederschlag färbt sich beim Erwärmen schwarz.',
      explanation: 'Kupferhydroxid spaltet schon beim leichten Erwärmen Wasser ab und geht in schwarzes Kupferoxid über.',
      level: 'Schulversuch', hazards: [], tags: ['Farbwechsel'],
    },
    'Fe(OH)3': {
      products: ['Fe2O3', 'H2O'],
      observation: 'Der rotbraune Niederschlag wird zu rotem Eisenoxid.',
      explanation: 'Eisenhydroxid spaltet beim Erhitzen Wasser ab – auf diese Weise entsteht auch das Pigment Eisenoxidrot.',
      level: 'Schulversuch', hazards: [], tags: ['Farbwechsel'],
    },
    KMnO4: {
      products: ['K2MnO4', 'MnO2', 'O2'],
      observation: 'Die violetten Kristalle knistern und zerfallen zu einem dunklen Pulver; ein glimmender Span flammt auf.',
      explanation: 'Permanganat gibt beim Erhitzen einen Teil seines Sauerstoffs ab. Mangan wird dabei von +VII zu +VI und +IV reduziert.',
      level: 'Laborpraktikum', hazards: ['Brandfördernd.'], tags: ['Gasentwicklung', 'Sauerstoff'],
    },
  };
  const reagentFormula = reagent.formula;
  const decomposition = decompositions[reagentFormula];
  if (decomposition) {
    const reaction = build({
      id: `zersetzung-${reagentFormula}`,
      type: 'Thermische Zersetzung',
      requires: { heat: true, solid: true },
      title: `${substance.name} beim Erhitzen`,
      reactants: [reagentFormula],
      products: decomposition.products,
      observation: decomposition.observation,
      explanation: decomposition.explanation,
      conditions: 'kräftig erhitzen',
      safetyLevel: decomposition.level,
      hazards: decomposition.hazards,
      tags: decomposition.tags,
    });
    if (reaction) results.push(reaction);
  }

  // Kristallwasser wird ausgetrieben
  if (reagent.salt && reagent.salt.hydrate > 0 && !decomposition) {
    const water = reagent.salt.hydrate;
    const reaction = build({
      id: `entwaesserung-${substance.id}`,
      type: 'Thermische Zersetzung',
      requires: { heat: true, solid: true },
      title: `${substance.name} verliert sein Kristallwasser`,
      reactants: [substance.formula],
      products: [reagent.salt.anhydrous, 'H2O'],
      observation:
        reagent.salt.cation.formula === 'Cu'
          ? 'Die blauen Kristalle werden weiß; am kalten Glas schlägt sich Wasser nieder. Gibt man Wasser zurück, wird das Pulver wieder blau.'
          : `Das Salz gibt ${water} Moleküle Kristallwasser je Formeleinheit ab; am kalten Glas schlägt sich Wasser nieder.`,
      explanation:
        'Kristallwasser ist im Gitter fest gebunden, lässt sich aber durch Erhitzen austreiben. Bei Kupfersulfat hängt sogar die Farbe daran: Erst die an Kupfer gebundenen Wassermoleküle machen es blau.',
      conditions: 'erhitzen',
      safetyLevel: 'Schulversuch',
      hazards: [],
      tags: ['Kristallwasser', 'Farbwechsel'],
    });
    if (reaction) results.push(reaction);
  }

  return results;
}
