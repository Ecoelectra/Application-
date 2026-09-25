/**
 * Erzeugt die erweiterte Offline-Stoffdatenbank (src/data/substanceTables/generated.ts).
 *
 * Aufruf: npm run stoffe
 *
 * Die Grundtabellen enthalten von Hand geprüfte Stoffe. Dieses Skript ergänzt
 * systematisch, was sich sicher ableiten lässt:
 *
 *  - alle natürlich vorkommenden Elemente (Ordnungszahl 1 bis 92),
 *  - Salze, Hydroxide, Oxide und Säuren aus den Ionen des Ionenmodells, soweit
 *    es sie als Stoff tatsächlich gibt,
 *  - weitere anorganische Stoffe, die das Ionenmodell nicht abdeckt,
 *  - homologe Reihen organischer Stoffe mit IUPAC-Namen,
 *  - zweifach substituierte Benzolderivate (ortho, meta, para),
 *  - die proteinogenen Aminosäuren und wichtige Heterocyclen.
 *
 * Summenformeln organischer Stoffe berechnet RDKit aus der Struktur. Stoffe,
 * die schon in den Grundtabellen stehen (gleiche Struktur oder gleiche
 * anorganische Formel), werden übersprungen. Stoffe, die die
 * Sicherheitsprüfung sperrt, kommen nicht in die Tabelle.
 */
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import initRDKitModule, { type MainModule } from '@rdkit/rdkit';
import { ELEMENTS } from '../src/chem/elements';
import { molarMass, parseFormula, toHillFormula } from '../src/chem/formula';
import { ANIONS, CATIONS, saltFormula, solubility, splitHydrate, type Ion } from '../src/chem/ions';
import { prettySpecies } from '../src/chem/complexes';
import { canonicalSmiles, molecularFormula } from '../src/chem/rdkit';
import { assessSubstance } from '../src/chem/safety';
import { CURATED_SUBSTANCES, substanceSlug } from '../src/data/substances';

const ROOT = resolve(import.meta.dirname ?? __dirname, '..');
const OUTPUT = resolve(ROOT, 'src/data/substanceTables/generated.ts');

interface Entry {
  name: string;
  synonyms?: string[];
  formula?: string;
  smiles?: string;
  category: string;
  description: string;
}

const rdkit = (await (initRDKitModule as unknown as () => Promise<MainModule>)()) as MainModule;

// ---------------------------------------------------------------------
// Vergleich mit den Grundtabellen
// ---------------------------------------------------------------------

function hill(formula: string): string | null {
  try {
    return toHillFormula(parseFormula(splitHydrate(formula).rest).counts);
  } catch {
    return null;
  }
}

function isOrganic(formula: string): boolean {
  try {
    const counts = parseFormula(formula).counts;
    return Boolean(counts.C && counts.H);
  } catch {
    return false;
  }
}

const takenIds = new Set(CURATED_SUBSTANCES.map((substance) => substance.id));
const takenNames = new Set(
  CURATED_SUBSTANCES.flatMap((substance) => [substance.name, ...substance.synonyms].map((name) => name.toLowerCase())),
);
const takenStructures = new Set(
  CURATED_SUBSTANCES.map((substance) => (substance.smiles ? canonicalSmiles(rdkit, substance.smiles.replace(/@+/g, '').replace(/[/\\]/g, '')) : null)).filter(
    (key): key is string => Boolean(key),
  ),
);
const takenFormulas = new Set(
  CURATED_SUBSTANCES.filter((substance) => !isOrganic(substance.formula))
    .map((substance) => hill(substance.formula))
    .filter((key): key is string => Boolean(key)),
);

const entries: Entry[] = [];
const skipped: Record<string, number> = { vorhanden: 0, gesperrt: 0, ungültig: 0 };

function add(entry: Entry): void {
  const id = substanceSlug(entry.name);
  if (takenIds.has(id) || takenNames.has(entry.name.toLowerCase())) {
    skipped.vorhanden++;
    return;
  }
  let formula = entry.formula;
  let smiles = entry.smiles;
  if (smiles) {
    const canonical = canonicalSmiles(rdkit, smiles);
    if (!canonical) {
      skipped.ungültig++;
      console.warn(`Ungültiges SMILES für ${entry.name}: ${smiles}`);
      return;
    }
    const flat = canonicalSmiles(rdkit, smiles.replace(/@+/g, '').replace(/[/\\]/g, ''));
    if (flat && takenStructures.has(flat)) {
      skipped.vorhanden++;
      return;
    }
    if (assessSubstance(entry.name, smiles, rdkit).restricted) {
      skipped.gesperrt++;
      return;
    }
    formula = formula ?? molecularFormula(rdkit, smiles) ?? undefined;
    if (flat) takenStructures.add(flat);
  } else if (formula) {
    const key = hill(formula);
    if (key && takenFormulas.has(key)) {
      skipped.vorhanden++;
      return;
    }
    if (assessSubstance(entry.name, undefined, null).restricted) {
      skipped.gesperrt++;
      return;
    }
    if (key) takenFormulas.add(key);
  }
  if (!formula) {
    skipped.ungültig++;
    return;
  }
  try {
    if (!(molarMass(formula) > 0)) throw new Error('Masse');
  } catch {
    skipped.ungültig++;
    console.warn(`Ungültige Formel für ${entry.name}: ${formula}`);
    return;
  }
  takenIds.add(id);
  takenNames.add(entry.name.toLowerCase());
  entries.push({ ...entry, formula, smiles });
}

// ---------------------------------------------------------------------
// 1. Elemente
// ---------------------------------------------------------------------

const DIATOMIC = new Set(['H', 'N', 'O', 'F', 'Cl', 'Br', 'I']);
const RADIOACTIVE = new Set(['Tc', 'Pm', 'Po', 'Rn', 'Ra', 'Ac', 'Th', 'Pa', 'U']);
/** Nur in Spuren vorhanden, nicht als Stoff handhabbar */
const TRACE_ONLY = new Set(['At', 'Fr']);

for (const element of ELEMENTS) {
  if (element.z > 92 || TRACE_ONLY.has(element.symbol)) continue;
  const formula = DIATOMIC.has(element.symbol) ? `${element.symbol}2` : element.symbol;
  const group = element.group ? `Gruppe ${element.group}, ` : '';
  const radioactive = RADIOACTIVE.has(element.symbol) ? '; radioaktiv – nur in Speziallaboren' : '';
  add({
    name: element.name,
    formula,
    category: 'Element',
    description: `${element.category} (${group}Periode ${element.period})${radioactive}`,
  });
}

// ---------------------------------------------------------------------
// 2. Salze aus dem Ionenmodell
// ---------------------------------------------------------------------

const ALKALI = ['Li', 'Na', 'K'];
const ALKALINE_EARTH = ['Mg', 'Ca', 'Sr', 'Ba'];

/** Anionen, deren Salze nur mit bestimmten Kationen als Stoff existieren. */
const ANION_CATIONS: Record<string, string[]> = {
  CN: [], // Cyanide: sehr giftig, bewusst nicht erzeugt
  H: [...ALKALI, ...ALKALINE_EARTH],
  NH2: ALKALI,
  C2: [...ALKALI, ...ALKALINE_EARTH],
  N: ['Li', ...ALKALINE_EARTH, 'Al'],
  O2: [...ALKALI, ...ALKALINE_EARTH, 'Zn'],
  ClO: ['Li', 'Na', 'K', 'Ca'],
  ClO3: [...ALKALI, ...ALKALINE_EARTH],
  ClO4: [...ALKALI, ...ALKALINE_EARTH],
  MnO4: [...ALKALI, 'Ba', 'Ca'],
  Cr2O7: ALKALI,
  CrO4: [...ALKALI, 'Ag', 'Pb', 'Ba', 'Sr', 'Ca', 'Zn'],
  B4O7: ALKALI,
  SiO3: [...ALKALI, 'Mg', 'Ca', 'Ba', 'Zn', 'Pb'],
  HCO3: [...ALKALI, 'NH4'],
  HSO4: [...ALKALI, 'NH4'],
  H2PO4: [...ALKALI, 'NH4', 'Ca', 'Mg'],
  HPO4: [...ALKALI, 'NH4', 'Ca', 'Mg', 'Ba', 'Sr'],
  S2O3: [...ALKALI, 'NH4', 'Mg', 'Ca', 'Ba', 'Sr'],
  SO3: [...ALKALI, 'NH4', 'Mg', 'Ca', 'Ba', 'Sr', 'Zn'],
  IO3: [...ALKALI, 'Ca', 'Ba', 'Sr', 'Ag', 'Pb'],
  NO2: [...ALKALI, 'Ca', 'Ba', 'Sr', 'Ag'],
};

/** Kationen, die nur mit wenigen Anionen stabile Stoffe bilden. */
const CATION_ANIONS: Record<string, string[]> = {
  'Cu+1': ['Cl', 'Br', 'I', 'O', 'S', 'SCN', 'CH3COO'],
  'Hg+2': ['F', 'Cl', 'Br', 'I', 'O', 'S', 'SO4', 'NO3', 'SCN', 'CH3COO'],
  'Sn+2': ['F', 'Cl', 'Br', 'I', 'O', 'S', 'SO4', 'OH', 'CH3COO', 'C2O4'],
  'Fe+3': ['F', 'Cl', 'Br', 'O', 'OH', 'SO4', 'NO3', 'PO4', 'CH3COO', 'C2O4', 'SCN', 'ClO4'],
  'Al+3': ['F', 'Cl', 'Br', 'I', 'O', 'OH', 'SO4', 'NO3', 'PO4', 'CH3COO', 'C2O4', 'S', 'N', 'ClO4'],
  'Cr+3': ['F', 'Cl', 'Br', 'I', 'O', 'OH', 'SO4', 'NO3', 'PO4', 'CH3COO', 'S'],
  'NH4+1': ['F', 'Cl', 'Br', 'I', 'NO3', 'SO4', 'CO3', 'HCO3', 'HSO4', 'H2PO4', 'HPO4', 'PO4', 'CH3COO', 'SCN', 'S', 'C2O4', 'S2O3', 'SO3', 'CrO4', 'IO3'],
};

const ANION_NAME_STEM: Record<string, string> = {
  C2: 'carbid',
};

function stem(ionEntry: Ion): string {
  if (ANION_NAME_STEM[ionEntry.formula] && ionEntry.charge < 0) return ANION_NAME_STEM[ionEntry.formula];
  return ionEntry.name.replace(/-Ion.*$/, '');
}

function saltName(cation: Ion, anion: Ion): string {
  const cationStem = stem(cation);
  const anionStem = stem(anion).toLowerCase();
  return cationStem.endsWith(')') ? `${cationStem}-${anionStem}` : `${cationStem}${anionStem}`;
}

/** Anionen, deren Salze mit Wasser reagieren statt sich zu lösen. */
const WATER_REACTIONS: Record<string, string> = {
  H: 'reagiert mit Wasser unter Wasserstoffentwicklung',
  N: 'reagiert mit Wasser unter Ammoniakbildung',
  NH2: 'reagiert heftig mit Wasser unter Ammoniakbildung',
  C2: 'reagiert mit Wasser unter Ethinbildung',
  O2: 'reagiert mit Wasser unter Bildung von Wasserstoffperoxid und Sauerstoff',
};

/** Anionen, für die das Ionenmodell die Farbe des Niederschlags je Kation kennt. */
const EXCEPTION_COLORED = new Set(['OH', 'S']);

function label(ionEntry: Ion): string {
  return prettySpecies(`${ionEntry.formula}^${Math.abs(ionEntry.charge) === 1 ? '' : Math.abs(ionEntry.charge)}${ionEntry.charge > 0 ? '+' : '-'}`);
}

function allowed(cation: Ion, anion: Ion): boolean {
  const restrictedCations = ANION_CATIONS[anion.formula];
  if (restrictedCations && !restrictedCations.includes(cation.formula)) return false;
  const restrictedAnions = CATION_ANIONS[`${cation.formula}+${cation.charge}`];
  if (restrictedAnions && !restrictedAnions.includes(anion.formula)) return false;
  // Eisen(III) und Kupfer(II) oxidieren Iodid; Carbonate dreiwertiger Ionen gibt es nicht
  if (anion.formula === 'I' && ((cation.formula === 'Fe' && cation.charge === 3) || (cation.formula === 'Cu' && cation.charge === 2))) return false;
  if (anion.formula === 'CO3' && cation.charge === 3) return false;
  if (anion.formula === 'S' && cation.formula === 'Fe' && cation.charge === 3) return false;
  if (cation.formula === 'Ag' && ['OH', 'O2', 'H', 'NH2', 'C2', 'N'].includes(anion.formula)) return false;
  if (cation.formula === 'Hg' && anion.formula === 'OH') return false;
  return true;
}

for (const cation of CATIONS) {
  if (cation.formula === 'H') continue;
  for (const anion of ANIONS) {
    if (!allowed(cation, anion)) continue;
    const formula = saltFormula(cation, anion);
    const name = saltName(cation, anion);
    const info = solubility(cation, anion);
    const color = cation.solutionColor ?? anion.solutionColor;
    const category = anion.formula === 'OH' ? 'Base' : ['O', 'O2'].includes(anion.formula) ? 'Oxid' : 'Salz';
    const water =
      WATER_REACTIONS[anion.formula] ??
      (anion.formula === 'O' && [...ALKALI, ...ALKALINE_EARTH].includes(cation.formula) && cation.formula !== 'Mg'
        ? 'reagiert mit Wasser zum Hydroxid'
        : `in Wasser ${info.solubility}`);
    // Die allgemeine Regel «weißer Niederschlag» gilt nicht für farbige Ionen
    const precipitateColor = info.color === 'weiß' && cation.solutionColor && !EXCEPTION_COLORED.has(anion.formula) ? undefined : info.color;
    const parts = [
      `Aus ${label(cation)} und ${label(anion)}`,
      water,
      water.startsWith('in Wasser') && info.solubility !== 'löslich' && precipitateColor ? `Farbe ${precipitateColor}` : '',
      water.startsWith('in Wasser') && info.solubility === 'löslich' && color ? `Lösung ${color}` : '',
    ].filter(Boolean);
    add({ name, formula, category, description: parts.join(', ') });
  }
}

// Säuren aus Wasserstoff-Ionen und Anionen, soweit als Stoff gebräuchlich
const ACIDS: Array<[string, string, string]> = [
  ['Salpetrige Säure', 'NO2', 'Nur in verdünnter Lösung beständig, zerfällt zu NO und NO2'],
  ['Hypochlorige Säure', 'ClO', 'Schwache Säure des Chlorwassers, bleichend'],
  ['Chlorsäure', 'ClO3', 'Starke Säure und starkes Oxidationsmittel, nur in Lösung'],
  ['Perchlorsäure', 'ClO4', 'Eine der stärksten Säuren; konzentriert mit organischen Stoffen explosionsgefährlich'],
  ['Iodsäure', 'IO3', 'Feste, mittelstarke Säure und Oxidationsmittel'],
  ['Thiocyansäure', 'SCN', 'Starke Säure, nur in verdünnter Lösung beständig'],
  ['Kieselsäure', 'SiO3', 'Sehr schwache Säure, geht in Kieselgel über'],
  ['Chromsäure', 'CrO4', 'Entsteht aus Chromtrioxid und Wasser; krebserzeugend'],
];
const proton = CATIONS.find((entry) => entry.formula === 'H') as Ion;
for (const [name, anionFormula, description] of ACIDS) {
  const anion = ANIONS.find((entry) => entry.formula === anionFormula) as Ion;
  add({ name, formula: saltFormula(proton, anion), category: 'Säure', description });
}

// ---------------------------------------------------------------------
// 3. Anorganische Stoffe außerhalb des Ionenmodells
// ---------------------------------------------------------------------

const INORGANIC: Array<[string, string, string, string]> = [
  ['Phosphortrichlorid', 'PCl3', 'Nichtmetallverbindung', 'Farblose, an feuchter Luft rauchende Flüssigkeit; Chlorierungsmittel'],
  ['Phosphorpentachlorid', 'PCl5', 'Nichtmetallverbindung', 'Chlorierungsmittel, macht aus Carbonsäuren Säurechloride'],
  ['Phosphorpentoxid', 'P4O10', 'Nichtmetallverbindung', 'Stärkstes gebräuchliches Trockenmittel'],
  ['Siliciumtetrachlorid', 'SiCl4', 'Nichtmetallverbindung', 'Hydrolysiert an feuchter Luft zu Kieselsäure und HCl'],
  ['Bortrifluorid', 'BF3', 'Nichtmetallverbindung', 'Gasförmige Lewis-Säure, Katalysator'],
  ['Bortrichlorid', 'BCl3', 'Nichtmetallverbindung', 'Lewis-Säure, spaltet Ether'],
  ['Borsäure', 'H3BO3', 'Säure', 'Sehr schwache Säure, Puffer und Flammenfärbung grün mit Methanol'],
  ['Schwefelhexafluorid', 'SF6', 'Gas', 'Reaktionsträges, sehr schweres Isoliergas'],
  ['Dischwefeldichlorid', 'S2Cl2', 'Nichtmetallverbindung', 'Gelbe Flüssigkeit, Vulkanisationsmittel'],
  ['Sulfurylchlorid', 'SO2Cl2', 'Nichtmetallverbindung', 'Chlorierungsmittel'],
  ['Phosphan', 'PH3', 'Gas', 'Sehr giftiges Gas'],
  ['Silan', 'SiH4', 'Gas', 'Selbstentzündliches Gas'],
  ['Distickstofftetroxid', 'N2O4', 'Gas', 'Dimer von NO2, farblos; Gleichgewicht mit braunem NO2'],
  ['Distickstoffpentoxid', 'N2O5', 'Oxid', 'Anhydrid der Salpetersäure'],
  ['Chlordioxid', 'ClO2', 'Gas', 'Gelbes Gas, Bleich- und Desinfektionsmittel'],
  ['Iodmonochlorid', 'ICl', 'Nichtmetallverbindung', 'Interhalogenverbindung, Wijs-Lösung zur Iodzahl'],
  ['Kohlenstoffdisulfid', 'CS2', 'Nichtmetallverbindung', 'Leicht entzündliches Lösungsmittel'],
  ['Titan(IV)-chlorid', 'TiCl4', 'Salz', 'Raucht an feuchter Luft, Ziegler-Natta-Katalysator'],
  ['Zinn(IV)-chlorid', 'SnCl4', 'Salz', 'Lewis-Säure, raucht an feuchter Luft'],
  ['Zinn(IV)-oxid', 'SnO2', 'Oxid', 'Weißes Pigment und Poliermittel'],
  ['Vanadium(V)-oxid', 'V2O5', 'Oxid', 'Katalysator des Kontaktverfahrens'],
  ['Chrom(VI)-oxid', 'CrO3', 'Oxid', 'Starkes Oxidationsmittel, krebserzeugend'],
  ['Wolfram(VI)-oxid', 'WO3', 'Oxid', 'Gelbes Oxid, elektrochrome Schichten'],
  ['Molybdän(VI)-oxid', 'MoO3', 'Oxid', 'Katalysator'],
  ['Zirconium(IV)-oxid', 'ZrO2', 'Oxid', 'Keramik, Diamantimitat'],
  ['Cer(IV)-oxid', 'CeO2', 'Oxid', 'Poliermittel und Katalysator'],
  ['Blei(IV)-oxid', 'PbO2', 'Oxid', 'Plus-Pol des Bleiakkus'],
  ['Arsen(III)-oxid', 'As2O3', 'Oxid', 'Sehr giftig («Arsenik»)'],
  ['Antimon(III)-chlorid', 'SbCl3', 'Salz', 'Lewis-Säure'],
  ['Bismut(III)-chlorid', 'BiCl3', 'Salz', 'Hydrolysiert zu Bismutoxidchlorid'],
  ['Bismut(III)-nitrat', 'Bi(NO3)3', 'Salz', 'Bestandteil des Dragendorff-Reagenzes'],
  ['Gold(III)-chlorid', 'AuCl3', 'Salz', 'Gelbes Goldsalz'],
  ['Platin(IV)-chlorid', 'PtCl4', 'Salz', 'Ausgangsstoff für Platinkatalysatoren'],
  ['Rhodium(III)-chlorid', 'RhCl3', 'Salz', 'Ausgangsstoff für Wilkinson-Katalysator'],
  ['Ruthenium(III)-chlorid', 'RuCl3', 'Salz', 'Oxidationskatalysator'],
  ['Iridium(III)-chlorid', 'IrCl3', 'Salz', 'Katalysatorvorstufe'],
  ['Gallium(III)-chlorid', 'GaCl3', 'Salz', 'Lewis-Säure'],
  ['Indium(III)-chlorid', 'InCl3', 'Salz', 'Milde Lewis-Säure'],
  ['Cer(III)-chlorid', 'CeCl3', 'Salz', 'Luche-Reduktion mit NaBH4'],
  ['Lanthan(III)-chlorid', 'LaCl3', 'Salz', 'Lanthanoidsalz'],
  ['Vanadium(III)-chlorid', 'VCl3', 'Salz', 'Reduktionsmittel'],
  ['Zirconium(IV)-chlorid', 'ZrCl4', 'Salz', 'Lewis-Säure'],
  ['Molybdän(V)-chlorid', 'MoCl5', 'Salz', 'Chlorierungs- und Oxidationsmittel'],
  ['Wolfram(VI)-chlorid', 'WCl6', 'Salz', 'Katalysator der Olefinmetathese'],
  ['Titan(III)-chlorid', 'TiCl3', 'Salz', 'Violettes Reduktionsmittel'],
  ['Cer(IV)-sulfat', 'Ce(SO4)2', 'Salz', 'Maßlösung der Cerimetrie'],
  ['Ammoniumcer(IV)-nitrat', '(NH4)2Ce(NO3)6', 'Salz', 'Oxidationsmittel (CAN)'],
  ['Kaliumhexacyanidoferrat(II)', 'K4[Fe(CN)6]', 'Salz', 'Gelbes Blutlaugensalz, ungiftig, da das Cyanid fest gebunden ist'],
  ['Kaliumhexacyanidoferrat(III)', 'K3[Fe(CN)6]', 'Salz', 'Rotes Blutlaugensalz, Nachweis von Fe²⁺'],
  ['Natriumtetrahydridoborat', 'NaBH4', 'Reduktionsmittel', 'Mildes Hydrid-Reduktionsmittel für Aldehyde und Ketone'],
  ['Lithiumaluminiumhydrid', 'LiAlH4', 'Reduktionsmittel', 'Starkes Hydrid-Reduktionsmittel, reagiert heftig mit Wasser'],
  ['Kaliumbromat', 'KBrO3', 'Salz', 'Oxidationsmittel der Bromatometrie'],
  ['Natriumbromat', 'NaBrO3', 'Salz', 'Oxidationsmittel'],
  ['Natriumperiodat', 'NaIO4', 'Salz', 'Spaltet vicinale Diole (Malaprade-Reaktion)'],
  ['Kaliumperoxodisulfat', 'K2S2O8', 'Salz', 'Radikalstarter und Oxidationsmittel'],
  ['Ammoniumperoxodisulfat', '(NH4)2S2O8', 'Salz', 'Radikalstarter für Polymerisationen'],
  ['Natriumdisulfit', 'Na2S2O5', 'Salz', 'Reduktions- und Konservierungsmittel'],
  ['Natriumdithionit', 'Na2S2O4', 'Reduktionsmittel', 'Starkes Reduktionsmittel für Küpenfarbstoffe'],
  ['Natriummolybdat', 'Na2MoO4', 'Salz', 'Nachweis von Phosphat'],
  ['Natriumwolframat', 'Na2WO4', 'Salz', 'Oxidationskatalysator'],
  ['Natriumaluminat', 'NaAlO2', 'Salz', 'Entsteht beim Lösen von Aluminium in Natronlauge'],
  ['Natriumzinkat', 'Na2[Zn(OH)4]', 'Salz', 'Entsteht beim Lösen von Zink in Natronlauge'],
  ['Hydroxylamin', 'NH2OH', 'Reduktionsmittel', 'Bildet mit Aldehyden und Ketonen Oxime'],
  ['Hydroxylammoniumchlorid', 'NH3OHCl', 'Salz', 'Handhabbare Form des Hydroxylamins'],
  ['Hydraziniumsulfat', 'N2H6SO4', 'Salz', 'Handhabbare Form des Hydrazins'],
  ['Kaliumaluminiumsulfat', 'KAl(SO4)2·12H2O', 'Salz', 'Alaun, Beizmittel und Blutstillmittel'],
  ['Ammoniumeisen(II)-sulfat', '(NH4)2Fe(SO4)2·6H2O', 'Salz', 'Mohrsches Salz, luftbeständige Fe²⁺-Urtitersubstanz'],
];
for (const [name, formula, category, description] of INORGANIC) add({ name, formula, category, description });

// ---------------------------------------------------------------------
// 4. Homologe Reihen
// ---------------------------------------------------------------------

const STEMS = ['Meth', 'Eth', 'Prop', 'But', 'Pent', 'Hex', 'Hept', 'Oct', 'Non', 'Dec', 'Undec', 'Dodec', 'Tridec', 'Tetradec', 'Pentadec', 'Hexadec', 'Heptadec', 'Octadec', 'Nonadec', 'Icos'];
const ALKYL = STEMS.map((entry) => `${entry}yl`);
const c = (count: number): string => 'C'.repeat(count);
const lower = (text: string): string => text[0].toLowerCase() + text.slice(1);

const ACID_TRIVIAL: Record<number, string> = {
  1: 'Ameisensäure', 2: 'Essigsäure', 3: 'Propionsäure', 4: 'Buttersäure', 5: 'Valeriansäure', 6: 'Capronsäure',
  7: 'Önanthsäure', 8: 'Caprylsäure', 9: 'Pelargonsäure', 10: 'Caprinsäure', 12: 'Laurinsäure', 14: 'Myristinsäure',
  16: 'Palmitinsäure', 18: 'Stearinsäure', 20: 'Arachinsäure',
};

for (let n = 1; n <= 20; n++) {
  const s = STEMS[n - 1];
  add({ name: `${s}an`, smiles: c(n), category: 'Alkan', description: `Unverzweigtes Alkan mit ${n} C-Atomen` });
  if (n >= 2 && n <= 16) {
    add({
      name: n === 2 ? 'Ethen' : n === 3 ? 'Propen' : `${s}-1-en`,
      synonyms: n > 3 ? [`1-${s}en`] : [],
      smiles: `C=C${c(n - 2)}`,
      category: 'Alken',
      description: `Endständiges Alken mit ${n} C-Atomen`,
    });
    add({
      name: n === 2 ? 'Ethin' : n === 3 ? 'Propin' : `${s}-1-in`,
      synonyms: n > 3 ? [`1-${s}in`] : [],
      smiles: `C#C${c(n - 2)}`,
      category: 'Alkin',
      description: `Endständiges Alkin mit ${n} C-Atomen`,
    });
  }
  if (n <= 18) {
    add({
      name: n <= 2 ? `${s}anol` : `${s}an-1-ol`,
      synonyms: [`${ALKYL[n - 1]}alkohol`, `1-${s}anol`],
      smiles: `${c(n)}O`,
      category: 'Alkohol',
      description: `Primärer Alkohol mit ${n} C-Atomen`,
    });
    add({
      name: n === 1 ? 'Methanal' : n === 2 ? 'Ethanal' : `${s}anal`,
      synonyms: [`${ALKYL[n - 1]}aldehyd`.replace('Methylaldehyd', 'Formaldehyd')],
      smiles: n === 1 ? 'C=O' : `${c(n - 1)}C=O`,
      category: 'Aldehyd',
      description: `Aldehyd mit ${n} C-Atomen`,
    });
    add({
      name: `${s}ansäure`,
      synonyms: ACID_TRIVIAL[n] ? [ACID_TRIVIAL[n]] : [],
      smiles: `${c(n - 1)}C(=O)O`,
      category: 'Carbonsäure',
      description: `Gesättigte Carbonsäure mit ${n} C-Atomen`,
    });
  }
  if (n >= 3 && n <= 12) {
    add({
      name: `${s}an-2-ol`,
      synonyms: [`sec-${ALKYL[n - 1]}alkohol`],
      smiles: `CC(O)${c(n - 2)}`,
      category: 'Alkohol',
      description: `Sekundärer Alkohol mit ${n} C-Atomen`,
    });
    add({
      name: n === 3 ? 'Propanon' : `${s}an-2-on`,
      synonyms: [`Methyl${lower(ALKYL[n - 3])}keton`],
      smiles: `CC(=O)${c(n - 2)}`,
      category: 'Keton',
      description: `Methylketon mit ${n} C-Atomen`,
    });
  }
  if (n >= 5 && n <= 10) {
    add({
      name: `${s}an-3-on`,
      synonyms: [`Ethyl${lower(ALKYL[n - 4])}keton`],
      smiles: `CCC(=O)${c(n - 3)}`,
      category: 'Keton',
      description: `Keton mit ${n} C-Atomen`,
    });
  }
  if (n <= 12) {
    add({
      name: `${s}an-1-amin`,
      synonyms: [`${ALKYL[n - 1]}amin`],
      smiles: `${c(n)}N`,
      category: 'Amin',
      description: `Primäres Amin mit ${n} C-Atomen`,
    });
    add({
      name: `${s}anamid`,
      synonyms: n === 1 ? ['Formamid'] : [],
      smiles: n === 1 ? 'NC=O' : `${c(n - 1)}C(N)=O`,
      category: 'Amid',
      description: `Carbonsäureamid mit ${n} C-Atomen`,
    });
    for (const [halogen, symbol] of [['Chlor', 'Cl'], ['Brom', 'Br'], ['Iod', 'I'], ['Fluor', 'F']] as const) {
      add({
        name: n <= 2 ? `${halogen}${lower(s)}an` : `1-${halogen}${lower(s)}an`,
        synonyms: [`${ALKYL[n - 1]}${lower(halogen)}id`],
        smiles: `${c(n)}${symbol}`,
        category: 'Halogenverbindung',
        description: `Halogenalkan mit ${n} C-Atomen`,
      });
    }
  }
  if (n >= 2 && n <= 12) {
    add({
      name: `${s}annitril`,
      synonyms: [`${ALKYL[n - 2] ?? ''}cyanid`].filter((entry) => entry !== 'cyanid'),
      smiles: `${c(n - 1)}C#N`,
      category: 'Nitril',
      description: `Nitril mit ${n} C-Atomen`,
    });
  }
  if (n >= 2 && n <= 8) {
    add({
      name: `Di${lower(ALKYL[n - 1])}ether`,
      smiles: `${c(n)}O${c(n)}`,
      category: 'Ether',
      description: `Symmetrischer Ether aus zwei ${ALKYL[n - 1]}gruppen`,
    });
  }
}

// Ester aus kurzen Säuren und Alkoholen
const ESTER_ACIDS: Array<[number, string, string]> = [
  [1, 'Ameisensäure', 'formiat'],
  [2, 'Essigsäure', 'acetat'],
  [3, 'Propionsäure', 'propanoat'],
  [4, 'Buttersäure', 'butanoat'],
  [5, 'Valeriansäure', 'pentanoat'],
  [6, 'Capronsäure', 'hexanoat'],
];
for (const [n, acid, anion] of ESTER_ACIDS) {
  for (let m = 1; m <= 6; m++) {
    const acidPart = n === 1 ? 'O=CO' : `${c(n - 1)}C(=O)O`;
    add({
      name: `${acid}${lower(ALKYL[m - 1])}ester`,
      synonyms: [`${ALKYL[m - 1]}${anion}`],
      smiles: `${acidPart}${c(m)}`,
      category: 'Ester',
      description: `Ester aus ${acid} und ${STEMS[m - 1]}anol`,
    });
  }
}

// Ringe
const RING = ['', '', 'Cycloprop', 'Cyclobut', 'Cyclopent', 'Cyclohex', 'Cyclohept', 'Cyclooct'];
for (let n = 3; n <= 8; n++) {
  add({ name: `${RING[n - 1]}an`, smiles: `C1${c(n - 1)}1`, category: 'Alkan', description: `Cycloalkan mit ${n} Ringatomen` });
  if (n >= 5) {
    add({ name: `${RING[n - 1]}en`, smiles: `C1=C${c(n - 2)}1`, category: 'Alken', description: `Cycloalken mit ${n} Ringatomen` });
    add({ name: `${RING[n - 1]}anol`, smiles: `OC1${c(n - 1)}1`, category: 'Alkohol', description: `Cyclischer Alkohol mit ${n} Ringatomen` });
    add({ name: `${RING[n - 1]}anon`, smiles: `O=C1${c(n - 1)}1`, category: 'Keton', description: `Cyclisches Keton mit ${n} Ringatomen` });
    add({ name: `${RING[n - 1]}ylamin`, synonyms: [`${RING[n - 1]}anamin`], smiles: `NC1${c(n - 1)}1`, category: 'Amin', description: `Cycloalkylamin mit ${n} Ringatomen` });
  }
}

// Diole, Dicarbonsäuren, Diamine
const DIACIDS: Record<number, string> = { 3: 'Malonsäure', 4: 'Bernsteinsäure', 5: 'Glutarsäure', 6: 'Adipinsäure', 7: 'Pimelinsäure', 8: 'Korksäure', 9: 'Azelainsäure', 10: 'Sebacinsäure' };
const DIAMINES: Record<number, string> = { 4: 'Putrescin', 5: 'Cadaverin' };
for (let n = 2; n <= 10; n++) {
  const s = STEMS[n - 1];
  add({ name: `${s}an-1,${n}-diol`, smiles: `O${c(n)}O`, category: 'Alkohol', description: `Zweiwertiger Alkohol mit endständigen OH-Gruppen` });
  add({ name: `${s}an-1,${n}-diamin`, synonyms: DIAMINES[n] ? [DIAMINES[n]] : [], smiles: `N${c(n)}N`, category: 'Amin', description: 'Diamin, Baustein für Polyamide' });
  if (n >= 3) {
    add({ name: `${s}andisäure`, synonyms: DIACIDS[n] ? [DIACIDS[n]] : [], smiles: `OC(=O)${c(n - 2)}C(=O)O`, category: 'Carbonsäure', description: 'Dicarbonsäure, Baustein für Polyester und Polyamide' });
  }
}
add({ name: 'Propan-1,2-diol', synonyms: ['Propylenglycol'], smiles: 'CC(O)CO', category: 'Alkohol', description: 'Feuchthaltemittel, ungiftiger Frostschutz' });
add({ name: 'Butan-2,3-diol', smiles: 'CC(O)C(C)O', category: 'Alkohol', description: 'Vicinales Diol' });

// Verzweigte und aromatische Kohlenwasserstoffe
const HYDROCARBONS: Array<[string, string[], string, string, string]> = [
  ['Ethylbenzol', [], 'CCc1ccccc1', 'Aromat', 'Vorstufe von Styrol'],
  ['Propylbenzol', [], 'CCCc1ccccc1', 'Aromat', 'Alkylbenzol'],
  ['Cumol', ['Isopropylbenzol'], 'CC(C)c1ccccc1', 'Aromat', 'Ausgangsstoff des Cumolverfahrens zu Phenol und Aceton'],
  ['Butylbenzol', [], 'CCCCc1ccccc1', 'Aromat', 'Alkylbenzol'],
  ['tert-Butylbenzol', [], 'CC(C)(C)c1ccccc1', 'Aromat', 'Sperriges Alkylbenzol'],
  ['Mesitylen', ['1,3,5-Trimethylbenzol'], 'Cc1cc(C)cc(C)c1', 'Aromat', 'Symmetrisches Trimethylbenzol'],
  ['Biphenyl', ['Diphenyl'], 'c1ccc(-c2ccccc2)cc1', 'Aromat', 'Zwei verknüpfte Benzolringe'],
  ['Anthracen', [], 'c1ccc2cc3ccccc3cc2c1', 'Aromat', 'Linearer Dreiringaromat, blau fluoreszierend'],
  ['Phenanthren', [], 'c1ccc2c(c1)ccc1ccccc12', 'Aromat', 'Angularer Dreiringaromat'],
  ['Pyren', [], 'c1cc2ccc3cccc4ccc(c1)c2c34', 'Aromat', 'Vierringaromat, Fluoreszenzsonde'],
  ['Inden', [], 'C1=Cc2ccccc2C1', 'Aromat', 'Bicyclischer Kohlenwasserstoff aus Steinkohlenteer'],
  ['Stilben', ['trans-Stilben'], 'C(=C/c1ccccc1)\\c1ccccc1', 'Aromat', 'Diarylethen'],
  ['Diphenylmethan', [], 'c1ccc(Cc2ccccc2)cc1', 'Aromat', 'Zwei Phenylgruppen an einer CH2-Brücke'],
  ['Triphenylmethan', [], 'c1ccc(C(c2ccccc2)c2ccccc2)cc1', 'Aromat', 'Grundgerüst der Triphenylmethanfarbstoffe'],
  ['2-Methylpropan-1-ol', ['Isobutanol'], 'CC(C)CO', 'Alkohol', 'Verzweigter primärer Alkohol'],
  ['Butan-2-ol', ['sec-Butanol'], 'CCC(C)O', 'Alkohol', 'Chiraler sekundärer Alkohol'],
  ['2-Methylbutan-2-ol', ['tert-Amylalkohol'], 'CCC(C)(C)O', 'Alkohol', 'Tertiärer Alkohol'],
  ['Benzylalkohol', ['Phenylmethanol'], 'OCc1ccccc1', 'Alkohol', 'Aromatischer primärer Alkohol'],
  ['2-Phenylethanol', ['Phenethylalkohol'], 'OCCc1ccccc1', 'Alkohol', 'Rosenduftstoff'],
  ['Allylalkohol', ['Prop-2-en-1-ol'], 'C=CCO', 'Alkohol', 'Ungesättigter Alkohol, giftig'],
  ['Crotonaldehyd', ['But-2-enal'], 'C/C=C/C=O', 'Aldehyd', 'α,β-ungesättigter Aldehyd'],
  ['Acrolein', ['Propenal'], 'C=CC=O', 'Aldehyd', 'Stechend riechender, ungesättigter Aldehyd'],
  ['Zimtaldehyd', ['3-Phenylprop-2-enal'], 'O=C/C=C/c1ccccc1', 'Aldehyd', 'Aromastoff des Zimts'],
  ['Methylvinylketon', ['But-3-en-2-on'], 'C=CC(C)=O', 'Keton', 'Michael-Akzeptor der Robinson-Anellierung'],
  ['Benzophenon', ['Diphenylketon'], 'O=C(c1ccccc1)c1ccccc1', 'Keton', 'Aromatisches Keton, Photoinitiator'],
  ['Mesityloxid', ['4-Methylpent-3-en-2-on'], 'CC(C)=CC(C)=O', 'Keton', 'Kondensationsprodukt des Acetons'],
  ['Cyclohexylbenzol', [], 'c1ccc(C2CCCCC2)cc1', 'Aromat', 'Alkylbenzol'],
];
for (const [name, synonyms, smiles, category, description] of HYDROCARBONS) add({ name, synonyms, smiles, category, description });

// ---------------------------------------------------------------------
// 5. Zweifach substituierte Benzolderivate
// ---------------------------------------------------------------------

interface Parent {
  name: string;
  /** Hauptgruppe am Ring, als SMILES vor dem Ring */
  group: string;
  category: string;
  /** Welche Substituenten als Vorsilbe erlaubt sind (niedrigere Priorität) */
  substituents: string[];
  prime?: boolean;
}

const SUBSTITUENTS: Record<string, string> = {
  Methyl: 'C',
  Chlor: 'Cl',
  Brom: 'Br',
  Fluor: 'F',
  Iod: 'I',
  Nitro: '[N+](=O)[O-]',
  Methoxy: 'OC',
  Hydroxy: 'O',
  Amino: 'N',
};
const BASIC = ['Methyl', 'Chlor', 'Brom', 'Fluor', 'Iod', 'Nitro', 'Methoxy'];
const PARENTS: Parent[] = [
  { name: 'Benzoesäure', group: 'OC(=O)', category: 'Carbonsäure', substituents: [...BASIC, 'Hydroxy', 'Amino'] },
  { name: 'Benzonitril', group: 'N#C', category: 'Nitril', substituents: [...BASIC, 'Hydroxy', 'Amino'] },
  { name: 'Benzaldehyd', group: 'O=C', category: 'Aldehyd', substituents: [...BASIC, 'Hydroxy', 'Amino'] },
  { name: 'Acetophenon', group: 'CC(=O)', category: 'Keton', substituents: [...BASIC, 'Hydroxy', 'Amino'], prime: true },
  { name: 'Phenol', group: 'O', category: 'Phenol', substituents: [...BASIC, 'Amino'] },
  { name: 'Anilin', group: 'N', category: 'Amin', substituents: BASIC },
  { name: 'Toluol', group: 'C', category: 'Aromat', substituents: ['Chlor', 'Brom', 'Fluor', 'Iod', 'Nitro'] },
];
const POSITIONS: Array<[number, string, (group: string, substituent: string) => string]> = [
  [2, 'o', (group, substituent) => `${group}c1ccccc1${substituent}`],
  [3, 'm', (group, substituent) => `${group}c1cccc(${substituent})c1`],
  [4, 'p', (group, substituent) => `${group}c1ccc(${substituent})cc1`],
];
for (const parent of PARENTS) {
  for (const prefix of parent.substituents) {
    for (const [position, letter, build] of POSITIONS) {
      const locant = `${position}${parent.prime ? '′' : ''}`;
      add({
        name: `${locant}-${prefix}${lower(parent.name)}`,
        synonyms: [`${letter}-${prefix}${lower(parent.name)}`],
        smiles: build(parent.group, SUBSTITUENTS[prefix]),
        category: parent.category,
        description: `${parent.name} mit ${prefix}gruppe in ${letter === 'o' ? 'ortho' : letter === 'm' ? 'meta' : 'para'}-Stellung`,
      });
    }
  }
}
for (const [position, letter, build] of POSITIONS) {
  add({ name: `1,${position}-Dimethylbenzol`, synonyms: [`${letter}-Xylol`], smiles: build('C', 'C'), category: 'Aromat', description: `Xylol-Isomer (${letter}-Xylol), Lösungsmittel` });
  for (const [halogen, symbol] of [['Chlor', 'Cl'], ['Brom', 'Br']] as const) {
    add({ name: `1,${position}-Di${lower(halogen)}benzol`, synonyms: [`${letter}-Di${lower(halogen)}benzol`], smiles: build(symbol, symbol), category: 'Halogenverbindung', description: 'Dihalogenbenzol' });
  }
}

// ---------------------------------------------------------------------
// 6. Aminosäuren und Heterocyclen
// ---------------------------------------------------------------------

const AMINO_ACIDS: Array<[string, string, string]> = [
  ['Glycin', 'NCC(=O)O', 'Gly'],
  ['Alanin', 'C[C@H](N)C(=O)O', 'Ala'],
  ['Valin', 'CC(C)[C@H](N)C(=O)O', 'Val'],
  ['Leucin', 'CC(C)C[C@H](N)C(=O)O', 'Leu'],
  ['Isoleucin', 'CC[C@H](C)[C@H](N)C(=O)O', 'Ile'],
  ['Prolin', 'OC(=O)[C@@H]1CCCN1', 'Pro'],
  ['Phenylalanin', 'N[C@@H](Cc1ccccc1)C(=O)O', 'Phe'],
  ['Tryptophan', 'N[C@@H](Cc1c[nH]c2ccccc12)C(=O)O', 'Trp'],
  ['Methionin', 'CSCC[C@H](N)C(=O)O', 'Met'],
  ['Serin', 'N[C@@H](CO)C(=O)O', 'Ser'],
  ['Threonin', 'C[C@@H](O)[C@H](N)C(=O)O', 'Thr'],
  ['Cystein', 'N[C@@H](CS)C(=O)O', 'Cys'],
  ['Tyrosin', 'N[C@@H](Cc1ccc(O)cc1)C(=O)O', 'Tyr'],
  ['Asparagin', 'N[C@@H](CC(N)=O)C(=O)O', 'Asn'],
  ['Glutamin', 'N[C@@H](CCC(N)=O)C(=O)O', 'Gln'],
  ['Asparaginsäure', 'N[C@@H](CC(=O)O)C(=O)O', 'Asp'],
  ['Glutaminsäure', 'N[C@@H](CCC(=O)O)C(=O)O', 'Glu'],
  ['Lysin', 'NCCCC[C@H](N)C(=O)O', 'Lys'],
  ['Arginin', 'N=C(N)NCCC[C@H](N)C(=O)O', 'Arg'],
  ['Histidin', 'N[C@@H](Cc1c[nH]cn1)C(=O)O', 'His'],
];
for (const [name, smiles, code] of AMINO_ACIDS) {
  add({ name, synonyms: [`L-${name}`, code], smiles, category: 'Aminosäure', description: `Proteinogene Aminosäure (${code})` });
}

const HETEROCYCLES: Array<[string, string[], string, string]> = [
  ['Pyrrol', [], 'c1cc[nH]c1', 'Fünfring-Heteroaromat, Baustein von Häm und Chlorophyll'],
  ['Imidazol', [], 'c1c[nH]cn1', 'Heteroaromat der Histidin-Seitenkette'],
  ['Pyrazol', [], 'c1cn[nH]c1', 'Fünfring-Heteroaromat mit zwei benachbarten N-Atomen'],
  ['Thiophen', [], 'c1ccsc1', 'Schwefelhaltiger Heteroaromat'],
  ['Oxazol', [], 'c1cocn1', 'Fünfring-Heteroaromat mit O und N'],
  ['Thiazol', [], 'c1cscn1', 'Heteroaromat, Baustein von Vitamin B1'],
  ['Pyrimidin', [], 'c1cncnc1', 'Grundkörper der Pyrimidinbasen'],
  ['Pyrazin', [], 'c1cnccn1', 'Sechsring-Heteroaromat mit 1,4-Stickstoff'],
  ['Pyridazin', [], 'c1ccnnc1', 'Sechsring-Heteroaromat mit 1,2-Stickstoff'],
  ['1,3,5-Triazin', [], 'c1ncncn1', 'Grundkörper von Melamin'],
  ['Chinolin', [], 'c1ccc2ncccc2c1', 'Benzopyridin, Grundgerüst von Chinin'],
  ['Isochinolin', [], 'c1ccc2cnccc2c1', 'Isomer des Chinolins'],
  ['Indol', [], 'c1ccc2[nH]ccc2c1', 'Grundgerüst des Tryptophans'],
  ['Benzimidazol', [], 'c1ccc2[nH]cnc2c1', 'Baustein von Vitamin B12'],
  ['Benzofuran', [], 'c1ccc2occc2c1', 'Sauerstoffhaltiger Bicyclus'],
  ['Benzothiophen', [], 'c1ccc2sccc2c1', 'Schwefelhaltiger Bicyclus'],
  ['Carbazol', [], 'c1ccc2c(c1)[nH]c1ccccc12', 'Tricyclischer Heteroaromat'],
  ['Acridin', [], 'c1ccc2nc3ccccc3cc2c1', 'Tricyclischer Heteroaromat, Farbstoffgrundkörper'],
  ['Purin', [], 'c1ncc2[nH]cnc2n1', 'Grundkörper von Adenin und Guanin'],
  ['Cumarin', ['2H-Chromen-2-on'], 'O=c1ccc2ccccc2o1', 'Duftstoff (Waldmeister)'],
  ['Pyrrolidin', [], 'C1CCNC1', 'Gesättigter N-Heterocyclus, Baustein des Prolins'],
  ['Piperazin', [], 'C1CNCCN1', 'Gesättigter Heterocyclus mit zwei N-Atomen'],
  ['Tetrahydropyran', ['Oxan'], 'C1CCOCC1', 'Cyclischer Ether'],
  ['Oxetan', [], 'C1COC1', 'Viergliedriger cyclischer Ether'],
  ['2-Methylpyridin', ['α-Picolin'], 'Cc1ccccn1', 'Methylpyridin'],
  ['3-Methylpyridin', ['β-Picolin'], 'Cc1cccnc1', 'Methylpyridin, Vorstufe von Niacin'],
  ['4-Methylpyridin', ['γ-Picolin'], 'Cc1ccncc1', 'Methylpyridin'],
  ['2-Aminopyridin', [], 'Nc1ccccn1', 'Aminopyridin'],
  ['4-Dimethylaminopyridin', ['DMAP'], 'CN(C)c1ccncc1', 'Acylierungskatalysator'],
  ['Nicotinsäure', ['Niacin', 'Pyridin-3-carbonsäure'], 'OC(=O)c1cccnc1', 'Vitamin B3'],
  ['Adenin', [], 'Nc1ncnc2[nH]cnc12', 'Purinbase der DNA und RNA'],
  ['Guanin', [], 'Nc1nc2[nH]cnc2c(=O)[nH]1', 'Purinbase der DNA und RNA'],
  ['Cytosin', [], 'Nc1cc[nH]c(=O)n1', 'Pyrimidinbase der DNA und RNA'],
  ['Thymin', [], 'Cc1c[nH]c(=O)[nH]c1=O', 'Pyrimidinbase der DNA'],
  ['Uracil', [], 'O=c1cc[nH]c(=O)[nH]1', 'Pyrimidinbase der RNA'],
];
for (const [name, synonyms, smiles, description] of HETEROCYCLES) {
  add({ name, synonyms, smiles, category: 'Heteroaromat', description });
}

// ---------------------------------------------------------------------
// Ausgabe
// ---------------------------------------------------------------------

const valid = entries.filter((entry) => entry.name && entry.formula);
const lines = valid.map((entry) =>
  [entry.name, (entry.synonyms ?? []).filter(Boolean).join(';'), entry.formula, entry.smiles ?? '', '', '', entry.category, entry.description].join('|'),
);

const header = `/**
 * Automatisch erzeugte Stoffe – nicht von Hand bearbeiten.
 *
 * Erzeugt mit \`npm run stoffe\` (scripts/build-substances.ts): alle natürlich
 * vorkommenden Elemente, Salze aus dem Ionenmodell, weitere anorganische
 * Stoffe, homologe Reihen, substituierte Benzole, Aminosäuren und
 * Heterocyclen. Formeln organischer Stoffe stammen aus RDKit. Stoffe der
 * Grundtabellen sind ausgelassen.
 *
 * ${valid.length} Stoffe.
 */
export const GENERATED_TABLE = String.raw\`
${lines.join('\n')}
\`;
`;
writeFileSync(OUTPUT, header);
const byCategory: Record<string, number> = {};
for (const entry of valid) byCategory[entry.category] = (byCategory[entry.category] ?? 0) + 1;
console.log(`${valid.length} Stoffe geschrieben nach ${OUTPUT}`);
console.log('Übersprungen:', skipped);
console.log('Nach Kategorie:', byCategory);
