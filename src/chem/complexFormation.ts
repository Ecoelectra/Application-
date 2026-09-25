/**
 * Komplexbildung in der Werkbank.
 *
 * Gibt man eine Metallquelle (Salz, Niederschlag oder Metall, das eine Säure
 * löst) mit einem Stoff zusammen, der einen Liganden liefert, entscheidet
 * dieses Modul, ob und welcher Komplex entsteht:
 *
 *  1. Metallquelle erkennen – über das Ionenmodell, auch für schwer lösliche
 *     Salze, Hydroxide, Oxide und Metalle.
 *  2. Ligandenquelle erkennen – für jeden Stoff der Datenbank: Anionen von
 *     Salzen und Säuren, bekannte Liganden (Ammoniak, en, EDTA …) und über die
 *     Struktur ganze Stoffklassen (Amine, Aminosäuren, Pyridine, Phenole,
 *     1,3-Dicarbonyle).
 *  3. Entscheiden:
 *     - bekannte Redoxreaktionen und Fällungen schließen einen Komplex aus
 *       (Cu²⁺ + I⁻ ergibt CuI und Iod, nicht [CuI₄]²⁻),
 *     - basische Liganden wie Ammoniak konkurrieren mit der Hydroxidfällung:
 *       Stabilitätskonstante gegen Löslichkeitsprodukt,
 *     - Niederschläge lösen sich nur, wenn lg β das Löslichkeitsprodukt
 *       überwiegt (AgCl in Ammoniak ja, AgI nein),
 *     - sonst nach dem HSAB-Prinzip (harte und weiche Säuren und Basen).
 *  4. Stöchiometrie: bekannte Komplexe aus einer Tabelle, sonst aus der
 *     bevorzugten Koordinationszahl und der Zähnigkeit.
 *
 * Tabellierte Komplexe gelten als Lehrbuchreaktion, alles andere als
 * Vorhersage – und wird so gekennzeichnet.
 */
import type { MainModule } from '@rdkit/rdkit';
import { balanceSpecies } from './balance';
import {
  analyseComplex,
  chargeSuffix,
  CENTRAL_ION_BY_ID,
  LIGAND_BY_ID,
  prettySpecies,
  stabilityConstant,
  type CentralIon,
  type ComplexAnalysis,
  type Ligand,
  type LigandCount,
} from './complexes';
import { parseFormula, toHillFormula } from './formula';
import { dissolvesInAcid, solubility, splitHydrate, splitSalt, type Ion } from './ions';
import { matchSmarts } from './rdkit';
import type { Requirements } from '../data/workbenchSpecs';
import type { SafetyLevel, Substance } from '../data/types';

// ---------------------------------------------------------------------
// Metallquellen
// ---------------------------------------------------------------------

export type MetalForm = 'gelöst' | 'Niederschlag' | 'Metall';

export interface MetalSource {
  substance: Substance;
  metal: CentralIon;
  form: MetalForm;
  /** Formel des Feststoffs ohne Kristallwasser */
  solid?: string;
  /** Gegenion, das beim Lösen eines Niederschlags frei wird */
  anion?: { formula: string; charge: number; perMetal: number };
  /** pKL des Niederschlags, bezogen auf ein Metall-Ion */
  pKsp?: number;
  /** Hydroxid oder Oxid – beim Lösen werden Hydroxid-Ionen frei */
  hydroxide?: boolean;
  /** reaktionsträges Oxid (geglüht), das sich praktisch nicht löst */
  inert?: boolean;
}

/**
 * Negativer dekadischer Logarithmus der Löslichkeitsprodukte bei 25 °C,
 * je Formeleinheit mit einem Metall-Ion (Oxide wie das entsprechende Hydroxid).
 */
const PKSP: Record<string, number> = {
  AgCl: 9.75, AgBr: 12.3, AgI: 16.1, CuCl: 6.7, CuBr: 8.3, CuI: 12.0,
  PbCl2: 4.8, PbI2: 8.0, PbSO4: 7.8, BaSO4: 10.0, CaSO4: 4.6,
  CaCO3: 8.5, BaCO3: 8.6, MgCO3: 7.5, ZnCO3: 10.0, CaC2O4: 8.6, CaF2: 10.4,
  ZnS: 23.8, CuS: 35.2, PbS: 27.5, FeS: 18.1,
  'Cu(OH)2': 19.3, 'Zn(OH)2': 16.9, 'Al(OH)3': 32.9, 'Fe(OH)3': 38.8, 'Fe(OH)2': 15.1,
  'Mg(OH)2': 11.2, 'Ca(OH)2': 5.3, 'Ni(OH)2': 15.2, 'Co(OH)2': 14.9, 'Mn(OH)2': 12.7,
  'Pb(OH)2': 15.3, 'Cr(OH)3': 30.2, 'Sn(OH)2': 26.3,
  ZnO: 16.9, CuO: 20.4, Ag2O: 7.7, HgO: 25.4, PbO: 15.3, MgO: 11.2, FeO: 15.1, Cu2O: 14.7,
};

/** pKL der Hydroxide, für die Konkurrenz zwischen Komplex und Hydroxidfällung. */
const HYDROXIDE_PKSP: Record<string, number> = {
  cu2: 19.3, zn2: 16.9, al3: 32.9, fe3: 38.8, fe2: 15.1, mg2: 11.2, ca2: 5.3, ni2: 15.2,
  co2: 14.9, mn2: 12.7, pb2: 15.3, cr3: 30.2, sn2: 26.3, cd2: 13.7, ag1: 7.7, hg2: 25.4, cu1: 14.7,
};

/** Geglühte Oxide, die sich weder in Säuren noch in Komplexbildnern merklich lösen. */
const INERT_OXIDES = new Set(['Al2O3', 'Fe2O3', 'Cr2O3', 'TiO2', 'SiO2', 'PbO2', 'MnO2', 'Fe3O4']);

/** Stoffe, deren Metall das Ionenmodell nicht erkennt. */
const MANUAL_METALS: Record<string, { metal: string; form: MetalForm; anion?: string }> = {
  'kupfercarbonat-basisch': { metal: 'cu2', form: 'Niederschlag' },
  kaliumalaun: { metal: 'al3', form: 'gelöst' },
  'palladium-ii-chlorid': { metal: 'pd2', form: 'gelöst', anion: 'Cl' },
  'palladium-ii-acetat': { metal: 'pd2', form: 'gelöst', anion: 'CH3COO' },
};

/** Stoffe, die schon Komplexe sind oder als Nachweisreagenz gemischt vorliegen. */
const NOT_A_METAL_SOURCE = new Set([
  'kaliumhexacyanoferrat-ii', 'kaliumhexacyanoferrat-iii', 'tollens-reagenz', 'fehling-reagenz',
  'tetrakis-triphenylphosphin-palladium', 'grubbs-katalysator',
]);

const ELEMENT_ION: Record<string, string> = {
  Cu: 'cu2', Ag: 'ag1', Au: 'au3', Pt: 'pt4', Pd: 'pd2', Fe: 'fe2', Zn: 'zn2', Al: 'al3', Ni: 'ni2',
  Sn: 'sn2', Pb: 'pb2', Hg: 'hg2', Mg: 'mg2', Ca: 'ca2',
};

function isIonic(substance: Substance): boolean {
  return !substance.smiles || /[+-]\]/.test(substance.smiles);
}

function centralIonOf(cation: Ion): CentralIon | undefined {
  return CENTRAL_ION_BY_ID.get(`${cation.formula.toLowerCase()}${cation.charge}`);
}

/** Erkennt, ob und wie ein Stoff Metall-Ionen liefern kann. */
export function metalSourceOf(substance: Substance): MetalSource | null {
  if (NOT_A_METAL_SOURCE.has(substance.id)) return null;

  const manual = MANUAL_METALS[substance.id];
  if (manual) {
    const metal = CENTRAL_ION_BY_ID.get(manual.metal);
    if (!metal) return null;
    return {
      substance,
      metal,
      form: manual.form,
      solid: manual.form === 'Niederschlag' ? substance.formula : undefined,
      pKsp: manual.form === 'Niederschlag' ? HYDROXIDE_PKSP[manual.metal] : undefined,
      hydroxide: manual.form === 'Niederschlag',
      anion: manual.anion ? { formula: manual.anion, charge: -1, perMetal: 2 } : undefined,
    };
  }

  // Elemente: Metall muss erst in Lösung gehen
  if (substance.category === 'Element' || /^[A-Z][a-z]?$/.test(substance.formula)) {
    const id = ELEMENT_ION[substance.formula];
    const metal = id ? CENTRAL_ION_BY_ID.get(id) : undefined;
    return metal && !substance.smiles ? { substance, metal, form: 'Metall' } : null;
  }

  if (!isIonic(substance)) return null;
  const salt = splitSalt(substance.formula);
  if (!salt) return null;
  const metal = centralIonOf(salt.cation);
  if (!metal) return null;
  // PbO2 und MnO2 sind keine Peroxide – das Ionenmodell deutet sie falsch
  if (salt.anion.formula === 'O2' && salt.cation.charge > 1) return null;

  const anhydrous = splitHydrate(substance.formula).rest;
  const perMetal = salt.anionCount / salt.cationCount;
  const anion = { formula: salt.anion.formula, charge: salt.anion.charge, perMetal };
  const oxide = salt.anion.formula === 'O';
  const hydroxide = salt.anion.formula === 'OH' || oxide;

  if (INERT_OXIDES.has(anhydrous)) {
    return { substance, metal, form: 'Niederschlag', solid: anhydrous, anion, inert: true, hydroxide };
  }

  const soluble =
    solubility(salt.cation, salt.anion).solubility === 'löslich' && (PKSP[anhydrous] === undefined || PKSP[anhydrous] < 5);
  if (soluble && !oxide) return { substance, metal, form: 'gelöst', anion };

  return {
    substance,
    metal,
    form: 'Niederschlag',
    solid: anhydrous,
    anion: oxide ? { formula: 'OH', charge: -1, perMetal: metal.charge } : anion,
    pKsp: PKSP[anhydrous] ?? (hydroxide ? HYDROXIDE_PKSP[metal.id] : undefined),
    hydroxide,
  };
}

// ---------------------------------------------------------------------
// Ligandenquellen
// ---------------------------------------------------------------------

export interface LigandSource {
  substance: Substance;
  ligand: Ligand;
  /** Ammoniak und Amine: machen die Lösung basisch und können Hydroxide fällen */
  basic: boolean;
  /** Ligand entsteht erst in alkalischer Lösung (Glycerin, Tartrat) */
  needsBase?: boolean;
  /** Stellvertreter-Ligand, dessen Daten für die Abschätzung dienen */
  analog: string;
  /** über die Struktur erkannt, nicht einzeln hinterlegt */
  generic?: boolean;
}

/** Stoffe der Datenbank, die einen bestimmten Liganden liefern. */
const LIGAND_BY_SUBSTANCE: Record<string, { ligand: string; basic?: boolean; needsBase?: boolean }> = {
  ammoniak: { ligand: 'nh3', basic: true },
  wasser: { ligand: 'h2o' },
  ethylendiamin: { ligand: 'en', basic: true },
  pyridin: { ligand: 'py' },
  imidazol: { ligand: 'im' },
  '2-2-bipyridin': { ligand: 'bipy' },
  '1-10-phenanthrolin': { ligand: 'phen' },
  'dinatrium-edta': { ligand: 'edta' },
  glycin: { ligand: 'gly' },
  thioharnstoff: { ligand: 'tu' },
  triphenylphosphin: { ligand: 'pph3' },
  acetylaceton: { ligand: 'acac' },
  salicylsaeure: { ligand: 'sal' },
  weinsaeure: { ligand: 'tart', needsBase: true },
  kaliumnatriumtartrat: { ligand: 'tart' },
  citronensaeure: { ligand: 'cit' },
  glycerin: { ligand: 'glyc', needsBase: true },
  phenol: { ligand: 'phenolato' },
  dimethylglyoxim: { ligand: 'dmg' },
  '8-hydroxychinolin': { ligand: 'oxin' },
  oxalsaeure: { ligand: 'ox' },
  salzsaeure: { ligand: 'cl' },
  bromwasserstoffsaeure: { ligand: 'br' },
  iodwasserstoffsaeure: { ligand: 'i' },
  flusssaeure: { ligand: 'f' },
  essigsaeure: { ligand: 'oac' },
  'lugolsche-loesung': { ligand: 'i' },
  kohlenstoffmonoxid: { ligand: 'co' },
};

/** Anionen von Salzen, die als Ligand wirken. */
const LIGAND_BY_ANION: Record<string, string> = {
  Cl: 'cl', Br: 'br', I: 'i', F: 'f', OH: 'oh', CN: 'cn', SCN: 'scn', NO2: 'no2',
  C2O4: 'ox', S2O3: 's2o3', CH3COO: 'oac',
};

type GenericKind = 'aminosaeure' | 'diamin' | 'catechol' | 'diketon' | 'phenol' | 'amin' | 'pyridin' | 'imidazol';

/** Strukturmuster für Stoffklassen, die als Ligand wirken, mit Stellvertreter-Ligand. */
const GENERIC_PATTERNS: Array<{ kind: GenericKind; smarts: string; analog: string; charge: number; denticity: number; basic: boolean }> = [
  { kind: 'aminosaeure', smarts: '[NX3;H2,H1;!$(NC=O)][CX4][CX3](=O)[OX2H1,OX1-]', analog: 'gly', charge: -1, denticity: 2, basic: false },
  {
    kind: 'diamin',
    smarts: '[NX3;H2,H1;!$(NC=[O,S,N]);!$(N-a)][CX4][CX4][NX3;H2,H1;!$(NC=[O,S,N]);!$(N-a)]',
    analog: 'en', charge: 0, denticity: 2, basic: true,
  },
  { kind: 'catechol', smarts: 'c([OX2H1])c[OX2H1]', analog: 'sal', charge: -2, denticity: 2, basic: false },
  { kind: 'diketon', smarts: '[CX3;!R](=O)[CH2][CX3;!R](=O)[#6]', analog: 'acac', charge: -1, denticity: 2, basic: false },
  { kind: 'phenol', smarts: '[OX2H1]c', analog: 'phenolato', charge: -1, denticity: 1, basic: false },
  {
    kind: 'amin',
    smarts: '[NX3;H2,H1;!$(NC=[O,S,N]);!$(N-a);!$(N-[#7,#8,#16]);!$(N#*);!$(N=*)][CX4]',
    analog: 'nh3', charge: 0, denticity: 1, basic: true,
  },
  { kind: 'pyridin', smarts: '[nX2;H0]1ccccc1', analog: 'py', charge: 0, denticity: 1, basic: false },
  { kind: 'imidazol', smarts: '[nX2]1cc[nH]c1', analog: 'im', charge: 0, denticity: 1, basic: false },
];

/** Tertiäre Amine: basisch, aber sterisch zu anspruchsvoll für stabile Komplexe. */
const TERTIARY_AMINE = '[NX3;H0;!$(NC=[O,S,N]);!$(N-a);!$(N-[#7,#8,#16])]([CX4])([CX4])[CX4]';

function withoutHydrogens(formula: string, count: number): string {
  const counts = { ...parseFormula(formula).counts };
  counts.H = (counts.H ?? 0) - count;
  if (counts.H <= 0) delete counts.H;
  return toHillFormula(counts);
}

/** Ligand für einen Stoff, der über seine Struktur erkannt wurde. */
function dynamicLigand(substance: Substance, pattern: (typeof GENERIC_PATTERNS)[number]): Ligand {
  const analog = LIGAND_BY_ID.get(pattern.analog) as Ligand;
  const formula = pattern.charge < 0 ? withoutHydrogens(substance.formula, -pattern.charge) : substance.formula;
  const base = substance.name.charAt(0).toLowerCase() + substance.name.slice(1);
  const name = pattern.charge < 0 ? `${base.replace(/säure$/, '')}ato` : base;
  return {
    id: `dyn-${substance.id}`,
    label: prettySpecies(`${formula}${pattern.charge ? `^${chargeSuffix(pattern.charge)}` : ''}`),
    formula,
    charge: pattern.charge,
    name,
    denticity: pattern.denticity,
    rank: analog.rank,
    f: analog.f,
    donor: analog.donor,
    enclose: true,
  };
}

const ligandCache = new Map<string, LigandSource[]>();

/** Welche Liganden liefert dieser Stoff? */
export function ligandSourcesOf(rdkit: MainModule | null, substance: Substance): LigandSource[] {
  const key = `${rdkit ? 's' : 'o'}|${substance.id}|${substance.smiles ?? substance.formula}`;
  const cached = ligandCache.get(key);
  if (cached) return cached.map((entry) => ({ ...entry, substance }));
  const result = detectLigands(rdkit, substance);
  ligandCache.set(key, result);
  return result;
}

function detectLigands(rdkit: MainModule | null, substance: Substance): LigandSource[] {
  const explicit = LIGAND_BY_SUBSTANCE[substance.id];
  if (explicit) {
    const ligand = LIGAND_BY_ID.get(explicit.ligand) as Ligand;
    return [{ substance, ligand, basic: Boolean(explicit.basic), needsBase: explicit.needsBase, analog: ligand.id }];
  }

  if (isIonic(substance)) {
    const salt = splitSalt(substance.formula);
    const ligandId = salt ? LIGAND_BY_ANION[salt.anion.formula] : undefined;
    if (!ligandId || !salt || salt.cation.formula === 'H') return [];
    const ligand = LIGAND_BY_ID.get(ligandId) as Ligand;
    return [{ substance, ligand, basic: ligandId === 'oh', analog: ligandId }];
  }

  if (!rdkit || !substance.smiles) return [];
  for (const pattern of GENERIC_PATTERNS) {
    if (!matchSmarts(rdkit, substance.smiles, pattern.smarts).length) continue;
    return [
      {
        substance,
        ligand: dynamicLigand(substance, pattern),
        basic: pattern.basic,
        analog: pattern.analog,
        generic: true,
      },
    ];
  }
  return [];
}

/** Stoffe, die als Base Hydroxide fällen, ohne selbst Ligand zu sein. */
function isAmineBase(rdkit: MainModule | null, substance: Substance): boolean {
  return Boolean(rdkit && substance.smiles && !isIonic(substance) && matchSmarts(rdkit, substance.smiles, TERTIARY_AMINE).length);
}

// ---------------------------------------------------------------------
// Chemisches Wissen: Tabellen und Regeln
// ---------------------------------------------------------------------

/** Bekannte Komplexe: Zentralion|Ligand → Zusammensetzung. */
const RECIPES: Record<string, Array<[string, number]>> = {
  'cu2|nh3': [['nh3', 4], ['h2o', 2]], 'cu2|en': [['en', 2]], 'cu2|gly': [['gly', 2]], 'cu2|cl': [['cl', 4]],
  'cu2|br': [['br', 4]], 'cu2|acac': [['acac', 2]], 'cu2|tart': [['tart', 2]], 'cu2|glyc': [['glyc', 2]],
  'cu2|ox': [['ox', 2]], 'cu2|py': [['py', 4]], 'cu2|im': [['im', 4]], 'cu2|bipy': [['bipy', 2]], 'cu2|phen': [['phen', 2]],
  'cu1|nh3': [['nh3', 2]], 'cu1|cl': [['cl', 2]], 'cu1|cn': [['cn', 4]],
  'ag1|nh3': [['nh3', 2]], 'ag1|s2o3': [['s2o3', 2]], 'ag1|cn': [['cn', 2]], 'ag1|py': [['py', 2]],
  'au3|cl': [['cl', 4]], 'pt4|cl': [['cl', 6]], 'pt2|cl': [['cl', 4]], 'pd2|cl': [['cl', 4]],
  'fe3|scn': [['scn', 1], ['h2o', 5]], 'fe3|f': [['f', 6]], 'fe3|cn': [['cn', 6]], 'fe3|ox': [['ox', 3]],
  'fe3|acac': [['acac', 3]], 'fe3|sal': [['sal', 1], ['h2o', 4]], 'fe3|phenolato': [['phenolato', 6]], 'fe3|cl': [['cl', 4]],
  'fe2|cn': [['cn', 6]], 'fe2|phen': [['phen', 3]], 'fe2|bipy': [['bipy', 3]],
  'ni2|nh3': [['nh3', 6]], 'ni2|en': [['en', 3]], 'ni2|cn': [['cn', 4]], 'ni2|dmg': [['dmg', 2]],
  'ni2|bipy': [['bipy', 3]], 'ni2|phen': [['phen', 3]], 'ni2|cl': [['cl', 4]],
  'co2|cl': [['cl', 4]], 'co2|nh3': [['nh3', 6]], 'co2|en': [['en', 3]], 'co2|scn': [['scn', 4]],
  'co3|nh3': [['nh3', 6]], 'co3|en': [['en', 3]],
  'zn2|nh3': [['nh3', 4]], 'zn2|oh': [['oh', 4]], 'zn2|cn': [['cn', 4]], 'zn2|en': [['en', 3]],
  'cd2|nh3': [['nh3', 4]], 'cd2|i': [['i', 4]], 'cd2|cn': [['cn', 4]], 'cd2|en': [['en', 3]],
  'hg2|i': [['i', 4]], 'hg2|cn': [['cn', 4]], 'hg2|cl': [['cl', 4]],
  'al3|oh': [['oh', 4]], 'al3|f': [['f', 6]], 'al3|oxin': [['oxin', 3]], 'al3|ox': [['ox', 3]],
  'pb2|oh': [['oh', 4]], 'sn2|oh': [['oh', 4]], 'cr3|oh': [['oh', 6]],
};

/** Komplexe, die nur bei hoher Ligandkonzentration entstehen. */
const CONCENTRATED = new Set(['cu2|cl', 'cu2|br', 'co2|cl', 'ni2|cl', 'fe3|cl', 'cu1|cl', 'hg2|cl']);

/**
 * Kombinationen, bei denen statt eines Komplexes etwas anderes passiert.
 * Leerer Text: Das erledigen die anorganischen Regeln (Fällung), kein Hinweis nötig.
 */
const EXCLUDED: Record<string, string> = {
  'cu2|i': 'Kupfer(II) oxidiert Iodid: Weißes Kupfer(I)-iodid fällt aus, freies Iod färbt die Lösung braun (2 Cu²⁺ + 4 I⁻ → 2 CuI + I₂). Ein Iodidokomplex entsteht nicht.',
  'cu2|cn': 'Cyanid reduziert Kupfer(II) zu Kupfer(I); dabei entsteht das sehr giftige Gas Dicyan. Einen stabilen Cyanidokomplex des Kupfer(II) gibt es nicht.',
  'fe3|i': 'Eisen(III) oxidiert Iodid zu Iod (2 Fe³⁺ + 2 I⁻ → 2 Fe²⁺ + I₂) – die Lösung wird braun, ein Komplex entsteht nicht.',
  'cu2|s2o3': 'Thiosulfat reduziert Kupfer(II) zu Kupfer(I); ein Kupfer(II)-Komplex entsteht nicht.',
  'fe3|s2o3': 'Die Lösung färbt sich kurz violett und wird dann farblos: Thiosulfat reduziert Eisen(III) zu Eisen(II).',
  'au3|i': 'Iodid reduziert Gold(III) – statt eines Komplexes entsteht Iod.',
  'fe2|scn': 'Eisen(II) gibt mit Thiocyanat keine Rotfärbung – genau daran unterscheidet man es von Eisen(III).',
  'hg2|nh3': 'Mit Ammoniak fällt weißes Quecksilberamidchlorid aus – ein Amminkomplex entsteht nicht.',
  'co2|no2': 'Nitrit oxidiert Cobalt(II) in essigsaurer Lösung zu Cobalt(III); es fällt gelbes Kaliumhexanitritocobaltat(III) aus (Fischers Salz).',
  'ag1|cl': '', 'ag1|br': '', 'ag1|i': '', 'pb2|cl': '', 'pb2|br': '', 'pb2|i': '', 'cu1|i': '', 'cu1|br': '',
};

/** Liganden, die nur mit bestimmten Zentralionen nennenswerte Komplexe bilden. */
const ONLY_WITH: Record<string, string[]> = {
  phenolato: ['fe3'],
  sal: ['fe3', 'cu2'],
  glyc: ['cu2'],
  tart: ['cu2', 'fe3'],
  cit: ['cu2', 'fe3', 'al3'],
  pph3: ['pd2', 'pt2', 'ag1', 'cu1', 'au3', 'ni2', 'hg2', 'cd2'],
  no2: ['co3', 'pt2', 'pd2'],
  co: [],
  dmg: ['ni2', 'pd2', 'cu2', 'co2'],
  oxin: ['al3', 'fe3', 'cu2', 'zn2', 'mg2', 'ni2', 'co2', 'mn2', 'cd2', 'pb2'],
};

/** Amphotere Hydroxide lösen sich im Laugenüberschuss als Hydroxidokomplex. */
const AMPHOTERIC = new Set(['al3', 'zn2', 'pb2', 'sn2', 'cr3']);

type MetalClass = 'hart' | 'mittel' | 'weich';
type DonorClass = 'hart' | 'N' | 'mittel' | 'weich';

const METAL_CLASS: Record<string, MetalClass> = {
  al3: 'hart', fe3: 'hart', cr3: 'hart', ti3: 'hart', co3: 'hart', mg2: 'hart', ca2: 'hart', ba2: 'hart', mn2: 'hart',
  fe2: 'mittel', co2: 'mittel', ni2: 'mittel', cu2: 'mittel', zn2: 'mittel', pb2: 'mittel', sn2: 'mittel',
  cu1: 'weich', ag1: 'weich', au3: 'weich', hg2: 'weich', cd2: 'weich', pd2: 'weich', pt2: 'weich', pt4: 'weich',
};

const DONOR_CLASS: Record<string, DonorClass> = {
  f: 'hart', oh: 'hart', h2o: 'hart', ox: 'hart', oac: 'hart', sal: 'hart', tart: 'hart', glyc: 'hart', acac: 'hart',
  cit: 'hart', phenolato: 'hart', edta: 'hart',
  nh3: 'N', en: 'N', py: 'N', bipy: 'N', phen: 'N', im: 'N', gly: 'N', dmg: 'N', oxin: 'N', scn: 'N', no2: 'N',
  cl: 'mittel', br: 'mittel',
  i: 'weich', cn: 'weich', s2o3: 'weich', tu: 'weich', pph3: 'weich', co: 'weich',
};

const AFFINITY: Record<MetalClass, Record<DonorClass, number>> = {
  hart: { hart: 3, N: 1, mittel: 1, weich: 0 },
  mittel: { hart: 1, N: 3, mittel: 1, weich: 2 },
  weich: { hart: 0, N: 2, mittel: 2, weich: 3 },
};

/**
 * Wie stark bindet der Ligand an das Zentralion? 0 = gar nicht, 1 = kaum,
 * 2 = mäßig, 3 und mehr = deutlich (HSAB-Prinzip, Chelateffekt).
 */
export function affinity(metal: CentralIon, source: LigandSource): number {
  const ligand = source.ligand;
  if (ligand.id === 'edta' || ligand.denticity >= 6) return 3;
  if (['mg2', 'ca2', 'ba2'].includes(metal.id)) return source.analog === 'oxin' ? 3 : 0;
  const allowed = ONLY_WITH[source.analog];
  if (allowed && !allowed.includes(metal.id)) return 0;
  if (source.analog === 'cn') return metal.series > 0 && metal.id !== 'ti3' ? 3 : 0;
  if (source.analog === 'oh') return AMPHOTERIC.has(metal.id) ? 3 : 0;
  const donor = DONOR_CLASS[source.analog] ?? 'N';
  let score = AFFINITY[METAL_CLASS[metal.id] ?? 'mittel'][donor];
  if (ligand.denticity >= 2 && score >= 1) score += 1;
  return score;
}

/** Bevorzugte Koordinationszahl für einen Liganden ohne Tabelleneintrag. */
function targetCN(metal: CentralIon, ligand: Ligand): number {
  if (metal.id === 'ag1') return 2;
  if (metal.id === 'cu1') return ligand.id === 'cn' ? 4 : 2;
  if (['au3', 'pd2', 'pt2', 'pb2', 'sn2', 'cu2'].includes(metal.id)) return 4;
  if (['zn2', 'cd2', 'hg2'].includes(metal.id)) return ligand.denticity === 2 && ligand.charge === 0 ? 6 : 4;
  if (['cl', 'br', 'i', 'scn'].includes(ligand.id) && metal.series === 3) return 4;
  return Math.max(...metal.preferredCN);
}

function recipeFor(metal: CentralIon, source: LigandSource, metalSource?: MetalSource): LigandCount[] {
  const ligand = source.ligand;
  if (source.analog === 'h2o') {
    return [{ ligand, count: metal.preferredCN.includes(6) ? 6 : Math.max(...metal.preferredCN) }];
  }
  // Quadratisch-planare d⁸-Ionen behalten zwei Anionen des Salzes: [PdCl₂(PPh₃)₂]
  const anionLigand = metalSource?.anion ? LIGAND_BY_ANION[metalSource.anion.formula] : undefined;
  if (['pd2', 'pt2'].includes(metal.id) && ligand.charge === 0 && ligand.denticity === 1 && anionLigand && source.analog !== anionLigand) {
    return [
      { ligand: LIGAND_BY_ID.get(anionLigand) as Ligand, count: 2 },
      { ligand, count: 2 },
    ];
  }
  const table = RECIPES[`${metal.id}|${source.analog}`];
  if (table && !source.generic) {
    return table.map(([id, count]) => ({ ligand: LIGAND_BY_ID.get(id) as Ligand, count }));
  }
  if (table && source.generic) {
    // Stoffklasse wie der Stellvertreter: gleiche Zahl, Wasser bleibt Wasser
    return table.map(([id, count]) => ({ ligand: id === source.analog ? ligand : (LIGAND_BY_ID.get(id) as Ligand), count }));
  }
  if (ligand.denticity >= 6) return [{ ligand, count: 1 }];
  const cn = targetCN(metal, ligand);
  const count = Math.max(1, Math.floor(cn / ligand.denticity));
  const rest = cn - count * ligand.denticity;
  const list: LigandCount[] = [{ ligand, count }];
  if (rest > 0) list.push({ ligand: LIGAND_BY_ID.get('h2o') as Ligand, count: rest });
  return list;
}

/** lg β des passenden Komplexes – für Stellvertreter-Liganden der Wert des Stellvertreters. */
function logBetaFor(metal: CentralIon, source: LigandSource, ligands: LigandCount[]): number | undefined {
  const exact = stabilityConstant(metal, ligands);
  if (exact !== undefined || !source.generic) return exact;
  const analog = ligands.map((entry) =>
    entry.ligand === source.ligand ? { ligand: LIGAND_BY_ID.get(source.analog) as Ligand, count: entry.count } : entry,
  );
  return stabilityConstant(metal, analog);
}

/** Zahl der Liganden eines Typs im Komplex. */
function ligandCount(ligands: LigandCount[], ligand: Ligand): number {
  return ligands.find((entry) => entry.ligand === ligand)?.count ?? 0;
}

type Dissolution = 'löst sich' | 'teilweise' | 'nicht';

/**
 * Löst sich der Niederschlag im Ligandenüberschuss (etwa 2 mol/L)?
 * Abschätzung der Löslichkeit S aus lg β und pKL; ab 0,01 mol/L gilt er als gelöst.
 */
function dissolution(source: MetalSource, ligand: LigandSource, n: number, logBeta: number): { result: Dissolution; lgS: number } {
  const lgL = Math.log10(2);
  const pK = source.pKsp as number;
  const b = source.anion?.perMetal ?? 1;
  let lgS: number;
  if (source.hydroxide && ligand.analog === 'oh') {
    lgS = -pK + logBeta + (n - b) * lgL;
  } else if (source.hydroxide && ligand.basic) {
    // Ammoniaklösung puffert: pOH ≈ 2,5
    lgS = -pK + logBeta + n * lgL + b * 2.5;
  } else {
    lgS = (-pK + logBeta + n * lgL - b * Math.log10(b)) / (1 + b);
  }
  return { result: lgS >= -2 ? 'löst sich' : lgS >= -4 ? 'teilweise' : 'nicht', lgS };
}

// ---------------------------------------------------------------------
// Gleichungen
// ---------------------------------------------------------------------

interface Term {
  ascii: string;
  display: string;
}

function ionTerm(symbol: string, charge: number): Term {
  const ascii = `${symbol}${charge ? `^${chargeSuffix(charge)}` : ''}`;
  return { ascii, display: prettySpecies(ascii) };
}

function ligandTerm(ligand: Ligand): Term {
  return { ascii: `${ligand.formula}${ligand.charge ? `^${chargeSuffix(ligand.charge)}` : ''}`, display: ligand.label };
}

function complexTerm(analysis: ComplexAnalysis): Term {
  const body = analysis.ligands.map((entry) => `(${entry.ligand.formula})${entry.count}`).join('');
  return { ascii: `[${analysis.metal.symbol}${body}]${chargeSuffix(analysis.charge)}`, display: analysis.formulaPretty };
}

const WATER: Term = { ascii: 'H2O', display: 'H₂O' };
const HYDROXIDE_ION: Term = { ascii: 'OH^-', display: 'OH⁻' };

/** Zuletzt ausgeglichene Gleichung in Summenformeln – für die Prüfung in den Tests. */
let lastBalanced: string | null = null;

/** Gleicht die Gleichung über die Summenformeln aus und schreibt sie lesbar. */
function writeEquation(left: Term[], right: Term[], arrow: string): string | null {
  try {
    const result = balanceSpecies(left.map((term) => term.ascii), right.map((term) => term.ascii));
    const side = (terms: Term[], coefficients: number[], key: 'display' | 'ascii') =>
      terms.map((term, index) => `${coefficients[index] > 1 ? `${coefficients[index]} ` : ''}${term[key]}`).join(' + ');
    const reactants = result.reactants.map((entry) => entry.coefficient);
    const products = result.products.map((entry) => entry.coefficient);
    lastBalanced = `${side(left, reactants, 'ascii')} → ${side(right, products, 'ascii')}`;
    return `${side(left, reactants, 'display')} ${arrow} ${side(right, products, 'display')}`;
  } catch {
    lastBalanced = null;
    return null;
  }
}

function aquaTerm(metal: CentralIon): Term {
  const sixfold = metal.preferredCN.includes(6) && !['pd2', 'pt2', 'pt4', 'au3'].includes(metal.id);
  if (!sixfold) return ionTerm(metal.symbol, metal.charge);
  const suffix = chargeSuffix(metal.charge);
  return { ascii: `[${metal.symbol}(H2O)6]${suffix}`, display: prettySpecies(`[${metal.symbol}(H2O)6]${suffix}`) };
}

function formationEquation(analysis: ComplexAnalysis, source: LigandSource, metal: MetalSource): string | null {
  // Salz löst sich in Wasser: Das Metall-Ion umgibt sich mit Wassermolekülen
  if (source.analog === 'h2o' && metal.form === 'gelöst' && metal.anion) {
    const salt = splitHydrate(metal.substance.formula).rest;
    return writeEquation(
      [{ ascii: salt, display: prettySpecies(salt) }, WATER],
      [complexTerm(analysis), ionTerm(metal.anion.formula, metal.anion.charge)],
      '→',
    );
  }
  const ligandsIn = analysis.ligands.filter((entry) => entry.ligand.id !== 'h2o').map((entry) => ligandTerm(entry.ligand));
  const complex = complexTerm(analysis);
  const hasWater = analysis.ligands.some((entry) => entry.ligand.id === 'h2o');

  if (metal.form === 'Niederschlag' && metal.solid) {
    const solid: Term = { ascii: metal.solid, display: prettySpecies(metal.solid) };
    const left = [solid, ...ligandsIn];
    const right = [complex];
    const oxide = /O$/.test(metal.solid) && !/OH\)?\d*$/.test(metal.solid) && metal.hydroxide;
    if (hasWater || oxide) left.push(WATER);
    if (metal.anion && !(metal.hydroxide && source.analog === 'oh')) {
      right.push(metal.hydroxide ? HYDROXIDE_ION : ionTerm(metal.anion.formula, metal.anion.charge));
    }
    return writeEquation(left, right, '→');
  }

  // Das Anion des Salzes bleibt am Metall: PdCl₂ + 2 PPh₃ → [PdCl₂(PPh₃)₂]
  const saltLigand = metal.anion ? LIGAND_BY_ANION[metal.anion.formula] : undefined;
  if (saltLigand && saltLigand !== source.analog && analysis.ligands.some((entry) => entry.ligand.id === saltLigand)) {
    const salt = splitHydrate(metal.substance.formula).rest;
    const others = analysis.ligands.filter((entry) => entry.ligand.id !== saltLigand && entry.ligand.id !== 'h2o');
    return writeEquation([{ ascii: salt, display: prettySpecies(salt) }, ...others.map((entry) => ligandTerm(entry.ligand))], [complex], '→');
  }

  const aqua = aquaTerm(metal.metal);
  const left = [aqua, ...ligandsIn];
  const right = [complex];
  if (aqua.ascii.includes('H2O')) {
    const waterLeft = 6 - (analysis.ligands.find((entry) => entry.ligand.id === 'h2o')?.count ?? 0);
    if (waterLeft > 0) right.push(WATER);
  } else if (hasWater) {
    left.push(WATER);
  }
  return writeEquation(left, right, '⇌');
}

/** Sonderfälle: Metalle, die sich unter Komplexbildung selbst lösen. */
function metalDissolution(metal: MetalSource, helpers: Substance[], source: LigandSource): string | null {
  const symbol = metal.metal.symbol;
  const base = source.substance.formula.replace(/OH$/, '');
  if (symbol === 'Al' && source.analog === 'oh') return `2 Al + 2 ${base}OH + 6 H₂O → 2 ${base}[Al(OH)₄] + 3 H₂`;
  if (symbol === 'Zn' && source.analog === 'oh') return `Zn + 2 ${base}OH + 2 H₂O → ${base}₂[Zn(OH)₄] + H₂`;
  if (symbol === 'Cu' && source.analog === 'nh3') return '2 Cu + 8 NH₃ + O₂ + 2 H₂O → 2 [Cu(NH₃)₄]²⁺ + 4 OH⁻';
  const ids = helpers.map((substance) => substance.id);
  if (symbol === 'Au' && ids.includes('salpetersaeure')) return 'Au + 3 HNO₃ + 4 HCl → H[AuCl₄] + 3 NO₂ + 3 H₂O';
  if (symbol === 'Pt' && ids.includes('salpetersaeure')) return '3 Pt + 4 HNO₃ + 18 HCl → 3 H₂[PtCl₆] + 4 NO + 8 H₂O';
  return null;
}

// ---------------------------------------------------------------------
// Hauptfunktion
// ---------------------------------------------------------------------

export interface ComplexReaction {
  id: string;
  title: string;
  type: 'Komplexbildung' | 'Fällungsreaktion';
  equation: string;
  reactants: string[];
  products: string[];
  observation: string;
  explanation: string;
  conditions: string;
  requires: Requirements;
  safetyLevel: SafetyLevel;
  hazards: string[];
  tags: string[];
  evidence: 'lehrbuch' | 'vorhersage';
  evidenceNote: string;
  /** zusätzlich fehlende Voraussetzungen (Metall nicht gelöst, Lauge fehlt) */
  missing: string[];
  /** dieselbe Gleichung in Summenformeln, falls sie ausgeglichen berechnet wurde */
  balancedFormulas?: string;
  complex?: ComplexAnalysis;
  /** Adresse im Komplex-Baukasten, falls alle Liganden dort vorkommen */
  builderLink?: string;
  /** beteiligte Stoffe (Kennungen) */
  participants?: string[];
  /** für den Vergleich konkurrierender Liganden */
  strength?: number;
  metalKey?: string;
}

export interface ComplexChemistry {
  reactions: ComplexReaction[];
  hints: string[];
}

export interface ComplexConditions {
  aqueous: boolean;
  catalysis: string;
}

const NON_OXIDIZING_ACIDS = ['salzsaeure', 'schwefelsaeure', 'phosphorsaeure', 'bromwasserstoffsaeure', 'iodwasserstoffsaeure', 'essigsaeure'];

/** Welche Stoffe im Gefäß bringen das Metall als Ion in Lösung? */
function dissolvingAgents(symbol: string, substances: Substance[], source: LigandSource): Substance[] | null {
  const ids = new Set(substances.map((substance) => substance.id));
  const pick = (list: string[]) => substances.filter((substance) => list.includes(substance.id));
  if (['Al', 'Zn'].includes(symbol) && source.analog === 'oh') return [source.substance];
  if (symbol === 'Cu' && source.analog === 'nh3') return [source.substance];
  if (['Au', 'Pt'].includes(symbol)) return ids.has('salzsaeure') && ids.has('salpetersaeure') ? pick(['salzsaeure', 'salpetersaeure']) : null;
  if (['Cu', 'Ag', 'Hg', 'Pd'].includes(symbol)) return ids.has('salpetersaeure') ? pick(['salpetersaeure']) : null;
  if (dissolvesInAcid(symbol)) {
    const acids = pick([...NON_OXIDIZING_ACIDS, 'salpetersaeure']);
    return acids.length ? acids : null;
  }
  return null;
}

const HYDROXIDE_CLASSICS = new Set(['al3', 'fe3', 'fe2', 'mg2', 'mn2', 'cr3', 'pb2', 'sn2']);

function builderLink(metal: CentralIon, ligands: LigandCount[]): string | undefined {
  if (!ligands.every((entry) => LIGAND_BY_ID.get(entry.ligand.id) === entry.ligand)) return undefined;
  return `/werkbank?modus=komplexe&zentral=${metal.id}&liganden=${ligands.map((entry) => `${entry.ligand.id}:${entry.count}`).join(',')}`;
}

function describeColor(analysis: ComplexAnalysis): string {
  if (analysis.colorSource === 'd0/d10') return analysis.color;
  if (analysis.color === 'farblos') return 'farblos';
  if (analysis.color === 'nicht abschätzbar') return '';
  return analysis.colorSource === 'gemessen' ? analysis.color : `vermutlich ${analysis.color}`;
}

function hydroxideFormula(metal: CentralIon): string {
  // Silber, Kupfer(I) und Quecksilber fallen als Oxid aus, nicht als Hydroxid
  if (metal.id === 'ag1') return 'Ag2O';
  if (metal.id === 'cu1') return 'Cu2O';
  if (metal.id === 'hg2') return 'HgO';
  return metal.charge === 1 ? `${metal.symbol}OH` : `${metal.symbol}(OH)${metal.charge}`;
}

/** Metalle, die mit Ammoniak und einfachen Aminen keine Amminkomplexe bilden. */
const NO_AMMINE = new Set(['pb2', 'sn2', 'fe3', 'al3', 'cr3', 'mn2', 'mg2', 'ca2', 'ba2', 'ti3']);

/** Fällt die Base das Hydroxid? Calcium- und Bariumhydroxid sind dafür zu gut löslich. */
function precipitatesHydroxide(metal: CentralIon): boolean {
  return (HYDROXIDE_PKSP[metal.id] ?? 0) >= 10;
}

/** Hydroxidfällung durch Ammoniak oder Amine, wenn kein Komplex entsteht. */
const HYDROXIDE_COLORS: Record<string, string> = { fe2: 'grünlich-weiß', cu1: 'gelb', ag1: 'braun', hg2: 'gelb' };

function hydroxidePrecipitation(metal: MetalSource, base: Substance, isAmmonia: boolean, tertiary = false): ComplexReaction | null {
  const ion = metal.metal;
  const hydroxide = hydroxideFormula(ion);
  const [amine, ammonium] = isAmmonia ? ['NH₃', 'NH₄⁺'] : tertiary ? ['R₃N', 'R₃NH⁺'] : ['R–NH₂', 'R–NH₃⁺'];
  const equation = writeEquation(
    [ionTerm(ion.symbol, ion.charge), { ascii: 'NH3', display: amine }, WATER],
    [{ ascii: hydroxide, display: prettySpecies(hydroxide) }, { ascii: 'NH4^+', display: ammonium }],
    '→',
  );
  if (!equation) return null;
  const balancedFormulas = lastBalanced ?? undefined;
  const cationIon: Ion = { formula: ion.symbol, charge: ion.charge, name: '', label: '' };
  const color = HYDROXIDE_COLORS[ion.id] ?? solubility(cationIon, { formula: 'OH', charge: -1, name: '', label: '' }).color;
  const classic = isAmmonia && HYDROXIDE_CLASSICS.has(ion.id);
  return {
    id: `hydroxid-${metal.substance.id}-${base.id}`,
    title: `Hydroxidfällung mit ${base.name}`,
    type: 'Fällungsreaktion',
    equation,
    reactants: [metal.substance.formula, base.formula],
    products: [hydroxide],
    observation: `Es fällt ${color ? `ein ${color}er` : 'ein'} Niederschlag von ${prettySpecies(hydroxide)} aus, der sich auch im Überschuss von ${base.name} nicht löst.`,
    explanation: `${base.name} ist eine Base: In Wasser entstehen Hydroxid-Ionen, die ${ion.element}-Ionen als Hydroxid fällen. Einen ${isAmmonia ? 'Ammin' : 'Amin'}komplex bildet ${ion.element}(${['', 'I', 'II', 'III', 'IV'][ion.charge]}) nicht – dafür bindet ${isAmmonia ? 'Ammoniak' : 'das Amin'} zu schwach, das Hydroxid ist zu schwer löslich.`,
    conditions: 'wässrige Lösung, Raumtemperatur',
    requires: { aqueous: true },
    safetyLevel: 'Schulversuch',
    hazards: isAmmonia ? ['Ammoniak reizt Augen und Atemwege.'] : [],
    tags: ['Niederschlag', color ?? ''].filter(Boolean),
    evidence: classic ? 'lehrbuch' : 'vorhersage',
    evidenceNote: classic
      ? 'Lehrbuchreaktion: Die Hydroxidfällung mit Ammoniak ist ein Standardschritt des Kationentrennungsgangs.'
      : 'Vorhersage: abgeleitet aus der Basizität des Amins und der Schwerlöslichkeit des Hydroxids.',
    missing: [],
    balancedFormulas,
    participants: [metal.substance.id, base.id],
  };
}

/**
 * Sucht alle Komplexbildungen im Gefäß.
 * `substances` sind die Stoffe im Gefäß (ohne Nachweisreagenzien).
 */
export function complexChemistry(
  rdkit: MainModule | null,
  substances: Substance[],
  conditions: ComplexConditions,
): ComplexChemistry {
  const reactions: ComplexReaction[] = [];
  const hints: string[] = [];
  const metals = substances.map(metalSourceOf).filter((entry): entry is MetalSource => Boolean(entry));
  if (!metals.length) return { reactions, hints };

  const ligandSources = substances.flatMap((substance) => ligandSourcesOf(rdkit, substance));
  const tertiaryBases = substances.filter((substance) => isAmineBase(rdkit, substance));
  const baseAvailable =
    conditions.catalysis === 'basisch' ||
    ligandSources.some((source) => source.analog === 'oh' || source.basic) ||
    tertiaryBases.length > 0;

  for (const metal of metals) {
    for (const source of ligandSources) {
      if (source.substance === metal.substance) continue;
      // Wasser als Ligand nur für farbige Ionen fester Salze: «warum ist die Lösung blau?»
      if (source.analog === 'h2o' && (metal.form !== 'gelöst' || metal.metal.d === 0 || metal.metal.d === 10)) continue;

      const pair = `${metal.metal.id}|${source.analog}`;
      const excluded = EXCLUDED[pair];
      if (excluded !== undefined) {
        if (excluded) hints.push(`${metal.substance.name} + ${source.substance.name}: ${excluded}`);
        continue;
      }

      if (CONCENTRATED.has(pair) && source.substance.category !== 'Säure') {
        hints.push(`${metal.substance.name} + ${source.substance.name}: Der Komplex ${analyseComplex(metal.metal, recipeFor(metal.metal, source, metal)).formulaPretty} entsteht nur bei sehr hoher Konzentration – etwa in konzentrierter Säure, nicht mit einer Salzlösung.`);
        continue;
      }

      // Metall muss erst gelöst werden
      const agents = metal.form === 'Metall' ? dissolvingAgents(metal.metal.symbol, substances, source) : null;
      const dissolved = metal.form !== 'Niederschlag' && (metal.form === 'gelöst' || Boolean(agents));

      const ligands = recipeFor(metal.metal, source, metal);
      const analysis = analyseComplex(metal.metal, ligands);
      if (!analysis.valid) continue;
      const curated =
        !source.generic &&
        (Boolean(RECIPES[pair]) || source.analog === 'h2o' || source.ligand.id === 'edta' || analysis.colorSource === 'gemessen' || Boolean(analysis.trivialName));
      const score = affinity(metal.metal, source);
      const logBeta = logBetaFor(metal.metal, source, ligands);
      const n = ligandCount(ligands, source.ligand);

      // Kommt der Komplex überhaupt zustande?
      const notes: string[] = [];
      let observationStart = '';
      if (!curated && score < 2 && source.analog !== 'h2o') {
        if (!source.generic || score === 1) {
          if (source.basic && source.analog !== 'oh') {
            if (metal.form === 'gelöst' && precipitatesHydroxide(metal.metal)) {
              const precipitation = hydroxidePrecipitation(metal, source.substance, source.analog === 'nh3');
              if (precipitation) reactions.push(precipitation);
            } else if (metal.form === 'gelöst') {
              hints.push(`${metal.substance.name} + ${source.substance.name}: ${metal.metal.element}-Ionen bilden damit keinen Komplex, und ${metal.metal.element}hydroxid ist zu gut löslich, um in der schwach basischen Lösung auszufallen.`);
            }
          } else if (LIGAND_BY_SUBSTANCE[source.substance.id] || source.generic) {
            hints.push(
              `${metal.substance.name} + ${source.substance.name}: kaum Komplexbildung – ${metal.metal.element}-Ionen (${METAL_CLASS[metal.metal.id] ?? 'mittel'}) und ${source.ligand.label} (${DONOR_CLASS[source.analog] === 'N' ? 'Stickstoff-Donor' : `${DONOR_CLASS[source.analog] ?? ''} Donor`}) passen nach dem HSAB-Prinzip schlecht zusammen.`,
            );
          }
        }
        continue;
      }

      // Basische Liganden: Konkurrenz mit der Hydroxidfällung
      if (source.basic && source.analog !== 'oh' && metal.form !== 'Niederschlag' && precipitatesHydroxide(metal.metal)) {
        const asHydroxide: MetalSource = {
          ...metal,
          form: 'Niederschlag',
          pKsp: HYDROXIDE_PKSP[metal.metal.id],
          hydroxide: true,
          anion: { formula: 'OH', charge: -1, perMetal: metal.metal.charge },
        };
        const noAmmine = source.ligand.denticity === 1 && NO_AMMINE.has(metal.metal.id);
        const strongEnough: Dissolution = noAmmine
          ? 'nicht'
          : logBeta !== undefined
            ? dissolution(asHydroxide, source, n, logBeta).result
            : score >= 3
              ? 'löst sich'
              : 'nicht';
        if (strongEnough === 'nicht') {
          if (dissolved) {
            const precipitation = hydroxidePrecipitation(metal, source.substance, source.analog === 'nh3');
            if (precipitation) reactions.push(precipitation);
          }
          continue;
        }
        observationStart = `Mit wenig ${source.substance.name} fällt zuerst ${prettySpecies(hydroxideFormula(metal.metal))} aus; im Überschuss löst es sich${strongEnough === 'teilweise' ? ' nur teilweise' : ''} wieder. `;
        if (strongEnough === 'teilweise') notes.push('Der Komplex ist nur mäßig stabil – das Hydroxid löst sich nur zum Teil.');
      }

      if (source.analog === 'oh' && metal.form === 'gelöst') {
        observationStart = `Mit wenig ${source.substance.name} fällt zuerst ${prettySpecies(hydroxideFormula(metal.metal))} aus; im Laugenüberschuss löst es sich wieder (amphoteres Hydroxid). `;
      }

      // Niederschläge lösen sich nur, wenn der Komplex stabil genug ist
      if (metal.form === 'Niederschlag') {
        if (metal.inert) {
          hints.push(`${metal.substance.name} + ${source.substance.name}: Das geglühte Oxid ist reaktionsträge und löst sich praktisch nicht – ein Komplex bildet sich nicht.`);
          continue;
        }
        if (metal.pKsp !== undefined && logBeta !== undefined) {
          const { result, lgS } = dissolution(metal, source, n, logBeta);
          const detail = `lg β = ${String(logBeta).replace('.', ',')}, pKL = ${String(metal.pKsp).replace('.', ',')}, geschätzte Löslichkeit 10^${lgS.toFixed(1).replace('.', ',')} mol/L`;
          if (result === 'nicht') {
            hints.push(`${metal.substance.name} + ${source.substance.name}: Der Niederschlag löst sich nicht – der Komplex ist nicht stabil genug gegen das kleine Löslichkeitsprodukt (${detail}).`);
            continue;
          }
          observationStart = result === 'löst sich'
            ? `Der Niederschlag von ${metal.substance.name} löst sich auf. `
            : `Der Niederschlag von ${metal.substance.name} löst sich nur teilweise – erst in konzentrierter Lösung und großem Überschuss. `;
          notes.push(`Abgeschätzt aus Stabilitätskonstante und Löslichkeitsprodukt (${detail}).`);
        } else if (score < 3) {
          hints.push(`${metal.substance.name} + ${source.substance.name}: Ob sich der Niederschlag löst, ist ohne Daten nicht sicher zu sagen – vermutlich kaum.`);
          continue;
        } else {
          observationStart = `Der Niederschlag von ${metal.substance.name} löst sich vermutlich auf. `;
        }
      }

      // Voraussetzungen
      const missing: string[] = [];
      let dissolutionText = '';
      if (metal.form === 'Metall') {
        if (!agents) {
          hints.push(
            `${metal.substance.name} + ${source.substance.name}: Das Metall selbst bildet keinen Komplex, erst seine Ionen. ${metal.substance.name} muss dafür in Lösung gehen – ${
              ['Au', 'Pt'].includes(metal.metal.symbol)
                ? 'das gelingt nur mit Königswasser (Salzsäure und Salpetersäure)'
                : ['Cu', 'Ag', 'Hg', 'Pd'].includes(metal.metal.symbol)
                  ? 'dafür Salpetersäure dazugeben'
                  : 'dafür eine Säure wie Salzsäure dazugeben'
            } oder gleich ein Salz des Metalls verwenden. Dann entstünde ${analysis.formulaPretty}.`,
          );
          continue;
        }
        {
          const special = metalDissolution(metal, agents, source);
          dissolutionText = special ?? '';
          const solvent =
            agents.length > 1 && ['Au', 'Pt'].includes(metal.metal.symbol)
              ? 'Königswasser (Salzsäure und Salpetersäure)'
              : agents.map((agent) => agent.name).join(' und ');
          observationStart = `${metal.substance.name} löst sich in ${solvent}${metal.metal.symbol === 'Cu' && source.analog === 'nh3' ? ' unter Luftzutritt langsam' : ''}. `;
        }
      }
      if (source.needsBase && !baseAvailable) {
        missing.push('Alkalische Lösung nötig: Natronlauge zugeben oder «Basenkatalysiert» wählen – erst dann gibt der Ligand seine Protonen ab.');
      }

      lastBalanced = null;
      const formed = dissolutionText ? null : formationEquation(analysis, source, metal);
      const balancedFormulas = formed ? (lastBalanced ?? undefined) : undefined;
      const equation = dissolutionText || formed || analysis.formation || analysis.formula;
      const color = describeColor(analysis);
      const neutralChelate = analysis.charge === 0 && analysis.chelate;
      const aquaColor = metal.form === 'gelöst' ? analyseComplex(metal.metal, [{ ligand: LIGAND_BY_ID.get('h2o') as Ligand, count: 6 }]) : null;
      const colorText = neutralChelate
        ? `Es fällt ein ${color && color !== 'farblos' ? `${color}er ` : ''}Niederschlag aus – der neutrale Chelatkomplex ist in Wasser schwer löslich.`
        : color === 'farblos'
          ? aquaColor && aquaColor.color !== 'farblos' && metal.form === 'gelöst'
            ? 'Die Farbe des Aquakomplexes verschwindet, die Lösung wird farblos.'
            : 'Die Lösung ist farblos.'
          : color
            ? `Die Lösung färbt sich ${color}.`
            : `Es bildet sich ${analysis.formulaPretty}; seine Farbe lässt sich ohne Messwerte für diesen Liganden nicht abschätzen.`;
      const concentrated = CONCENTRATED.has(pair);

      const ligandText = source.generic
        ? `${source.substance.name} bindet über ${source.ligand.donor === 'N' ? 'sein Stickstoffatom' : 'seine Donoratome'} wie ${LIGAND_BY_ID.get(source.analog)?.label}`
        : `${source.substance.name} liefert ${source.ligand.label}-Liganden`;
      const betaText = analysis.logBeta !== undefined ? ` Stabilitätskonstante lg β = ${String(analysis.logBeta).replace('.', ',')}.` : '';

      reactions.push({
        id: `komplex-${metal.substance.id}-${source.substance.id}`,
        title: `Komplexbildung: ${analysis.name}`,
        type: 'Komplexbildung',
        equation,
        reactants: [metal.substance.formula, source.substance.formula],
        products: [analysis.formula],
        // Beschreibt die hinterlegte Notiz den Verlauf schon, entfällt die eigene Einleitung
        observation: [
          (analysis.note && /zuerst/.test(analysis.note) && observationStart.startsWith('Mit wenig') ? '' : observationStart) + colorText,
          analysis.note ?? '',
        ]
          .filter(Boolean)
          .join(' '),
        explanation: `${ligandText}, die sich an das ${metal.metal.element}-Ion anlagern und das Wasser verdrängen. Es entsteht ${analysis.formulaPretty}: ${analysis.geometry}, Koordinationszahl ${analysis.coordinationNumber}, ${analysis.unpaired} ungepaarte Elektronen (${analysis.magnetism}).${betaText}${notes.length ? ` ${notes.join(' ')}` : ''}`,
        conditions: concentrated
          ? 'nur bei hoher Ligandkonzentration, etwa in konzentrierter Salzsäure; beim Verdünnen zerfällt der Komplex'
          : source.analog === 'pph3'
            ? 'in Ethanol oder Dichlormethan'
            : 'wässrige Lösung, Ligand im Überschuss, Raumtemperatur',
        requires: source.analog === 'pph3' ? {} : { aqueous: true },
        safetyLevel: source.analog === 'cn' || metal.metal.id === 'hg2' || metal.metal.id === 'cd2' ? 'Nur Fachlabor' : 'Schulversuch',
        hazards: [
          ...(source.analog === 'cn' ? ['Cyanide sind sehr giftig; mit Säuren entsteht Blausäure.'] : []),
          ...(source.analog === 'nh3' ? ['Ammoniak reizt Augen und Atemwege.'] : []),
          ...(['hg2', 'cd2', 'pb2'].includes(metal.metal.id) ? [`${metal.metal.element}verbindungen sind giftig und umweltgefährlich.`] : []),
          ...(concentrated ? ['Konzentrierte Säuren sind ätzend.'] : []),
        ],
        tags: ['Komplexbildung', ...(color && color !== 'farblos' ? [color] : [])],
        evidence: curated ? 'lehrbuch' : 'vorhersage',
        evidenceNote: curated
          ? 'Lehrbuchreaktion: Dieser Komplex ist bekannt und hinterlegt; Farbe und Stabilität stammen, soweit angegeben, aus Messwerten.'
          : `Vorhersage: ${source.generic ? `${source.substance.name} wurde über seine Struktur als Ligand erkannt und wie ${LIGAND_BY_ID.get(source.analog)?.label} behandelt. ` : ''}Ob und wie fest der Komplex entsteht, ist nach dem HSAB-Prinzip abgeschätzt${analysis.colorSource === 'abgeschätzt' ? ', die Farbe über die Ligandenfeldaufspaltung' : ''} – für genau diese Kombination nicht belegt.`,
        missing,
        balancedFormulas,
        complex: analysis,
        builderLink: builderLink(metal.metal, ligands),
        strength: logBeta ?? score * 3,
        metalKey: metal.substance.id,
        participants: [metal.substance.id, source.substance.id],
      });
    }
  }

  // Tertiäre Amine sind Basen, aber zu sperrig für stabile Komplexe
  for (const metal of metals) {
    if (metal.form !== 'gelöst' || !precipitatesHydroxide(metal.metal)) continue;
    for (const base of tertiaryBases) {
      const precipitation = hydroxidePrecipitation(metal, base, false, true);
      if (precipitation) reactions.push(precipitation);
    }
  }

  // Mehrere Liganden am selben Metall: der stärkste setzt sich durch
  const byMetal = new Map<string, ComplexReaction[]>();
  for (const reaction of reactions) {
    if (!reaction.complex || !reaction.metalKey) continue;
    byMetal.set(reaction.metalKey, [...(byMetal.get(reaction.metalKey) ?? []), reaction]);
  }
  for (const group of byMetal.values()) {
    if (group.length < 2) continue;
    const strongest = group.reduce((best, entry) => ((entry.strength ?? 0) > (best.strength ?? 0) ? entry : best));
    for (const entry of group) {
      entry.explanation +=
        entry === strongest
          ? ` Von den Liganden im Gefäß bindet dieser am festesten – gibt man alle zusammen, setzt sich ${strongest.complex?.formulaPretty} durch.`
          : ` Gibt man alle Liganden zusammen, verdrängt der stärkere Ligand diesen: Es bildet sich bevorzugt ${strongest.complex?.formulaPretty}.`;
    }
  }

  // Ein Stoff kann über zwei Wege als Base erkannt werden (primäres und tertiäres Amin)
  const seen = new Set<string>();
  const unique = reactions.filter((reaction) => {
    if (seen.has(reaction.id)) return false;
    seen.add(reaction.id);
    return true;
  });

  return { reactions: unique, hints: [...new Set(hints)] };
}
