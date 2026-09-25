/**
 * Reaktionen, die sich weder über Reaktions-SMARTS noch über das Ionenmodell
 * beschreiben lassen: Nachweisreaktionen mit Reagenzgemischen, die Spaltung
 * von Zuckern und die technischen Verfahren mit fester Gleichung.
 */
import type { MainModule } from '@rdkit/rdkit';
import type { InorganicReaction } from './inorganicRules';
import { matchSmarts } from './rdkit';
import { splitSalt } from './ions';
import { analyseComplex, CENTRAL_ION_BY_ID, LIGAND_BY_ID } from './complexes';
import { formulaKey } from '../data/substances';
import { REACTIONS } from '../data/reactions';
import { WORKBENCH_SPECS, type Requirements } from '../data/workbenchSpecs';
import type { SafetyLevel, Substance } from '../data/types';

export interface SpecialReaction extends InorganicReaction {
  /** Produkte als Stoffkennungen, soweit bekannt */
  productIds: string[];
  /** Verweis auf die Detailseite */
  ruleId?: string;
  /** Adresse in der Komplex-Werkbank, falls ein Komplex entsteht */
  complexLink?: string;
}

/** Stoffe, die als Ligandenquelle dienen, und der gebildete Ligand. */
const LIGAND_SOURCES: Record<string, string> = {
  ammoniak: 'nh3',
  kaliumthiocyanat: 'scn',
  natriumthiosulfat: 's2o3',
  ethylendiamin: 'en',
  'dinatrium-edta': 'edta',
  natriumfluorid: 'f',
  salzsaeure: 'cl',
  kaliumiodid: 'i',
};

/** Welcher Komplex sich aus Zentralion und Ligand typischerweise bildet. */
const TYPICAL_COMPLEX: Record<string, Array<[string, number]>> = {
  'cu2|nh3': [['nh3', 4], ['h2o', 2]],
  'cu2|en': [['en', 2]],
  'cu2|edta': [['edta', 1]],
  'cu2|cl': [['cl', 4]],
  'ni2|nh3': [['nh3', 6]],
  'ni2|en': [['en', 3]],
  'ni2|edta': [['edta', 1]],
  'co2|cl': [['cl', 4]],
  'co2|nh3': [['nh3', 6]],
  'co2|edta': [['edta', 1]],
  'fe3|scn': [['scn', 1], ['h2o', 5]],
  'fe3|f': [['f', 6]],
  'fe3|edta': [['edta', 1]],
  'fe2|edta': [['edta', 1]],
  'ag1|nh3': [['nh3', 2]],
  'ag1|s2o3': [['s2o3', 2]],
  'zn2|nh3': [['nh3', 4]],
  'zn2|edta': [['edta', 1]],
  'ca2|edta': [['edta', 1]],
  'mg2|edta': [['edta', 1]],
  'mn2|edta': [['edta', 1]],
  'hg2|i': [['i', 4]],
};

/** Aldehydgruppe einschließlich Formaldehyd */
const ALDEHYDE = '[$([CX3H1](=O)[#6]),$([CX3H2]=O)]';
/** Aromatische Aldehyde (Benzaldehyd) sind Tollens-, aber nicht Fehling-positiv */
const AROMATIC_ALDEHYDE = '[CX3H1](=O)a';
const REDUCING_SUGAR = '[OX2H1][CX4H1;R]([OX2;R])';
const KETOSE = '[OX2H1][CX4;R]([OX2;R])[CH2][OX2H1]';
const AMINO_ACID = '[NX3H2][CX4][CX3](=O)[OX2H1]';

function has(substances: Substance[], id: string): Substance | undefined {
  return substances.find((substance) => substance.id === id);
}

function special(options: {
  id: string;
  type: InorganicReaction['type'];
  title: string;
  equation: string;
  reactants: string[];
  products: string[];
  productIds?: string[];
  observation: string;
  explanation: string;
  conditions: string;
  requires: Requirements;
  level: SafetyLevel;
  hazards: string[];
  tags: string[];
  ruleId?: string;
}): SpecialReaction {
  return {
    id: options.id,
    type: options.type,
    title: options.title,
    reactants: options.reactants,
    products: options.products,
    productIds: options.productIds ?? [],
    equation: options.equation,
    observation: options.observation,
    explanation: options.explanation,
    conditions: options.conditions,
    safetyLevel: options.level,
    hazards: options.hazards,
    tags: options.tags,
    requires: options.requires,
    ruleId: options.ruleId,
  };
}

/** Findet Nachweis- und Sonderreaktionen für die Stoffe im Gefäß. */
export function specialReactions(rdkit: MainModule | null, substances: Substance[]): SpecialReaction[] {
  const results: SpecialReaction[] = [];
  const structural = substances.filter((substance) => substance.smiles);

  const reducing = (substance: Substance): boolean =>
    Boolean(
      rdkit &&
        substance.smiles &&
        (matchSmarts(rdkit, substance.smiles, ALDEHYDE).length ||
          matchSmarts(rdkit, substance.smiles, REDUCING_SUGAR).length ||
          matchSmarts(rdkit, substance.smiles, KETOSE).length),
    );

  // Fehling-Probe
  if (has(substances, 'fehling-reagenz')) {
    for (const substance of structural) {
      const onlyAromaticAldehyde = Boolean(
        rdkit &&
          substance.smiles &&
          matchSmarts(rdkit, substance.smiles, AROMATIC_ALDEHYDE).length &&
          !matchSmarts(rdkit, substance.smiles, REDUCING_SUGAR).length &&
          matchSmarts(rdkit, substance.smiles, ALDEHYDE).length === matchSmarts(rdkit, substance.smiles, AROMATIC_ALDEHYDE).length,
      );
      const positive = reducing(substance) && !onlyAromaticAldehyde;
      results.push(
        special({
          id: `fehling-${substance.id}`,
          type: 'Nachweisreaktion',
          title: `Fehling-Probe mit ${substance.name}`,
          equation: positive
            ? 'R–CHO + 2 Cu²⁺ + 5 OH⁻ → R–COO⁻ + Cu₂O↓ + 3 H₂O'
            : 'keine Reaktion – die Lösung bleibt tiefblau',
          reactants: [substance.formula, 'Cu²⁺'],
          products: positive ? ['Cu2O'] : [],
          productIds: positive ? ['kupfer-i-oxid'] : [],
          observation: positive
            ? 'Beim Erwärmen schlägt die tiefblaue Farbe über Grün nach Orange um; es fällt ziegelroter Kupfer(I)-oxid aus. Die Probe ist positiv.'
            : 'Die Lösung bleibt auch beim Erwärmen tiefblau – die Probe ist negativ.',
          explanation: positive
            ? 'Aldehydgruppen – auch die offenkettige Form reduzierender Zucker – reduzieren Kupfer(II) zu Kupfer(I). Das Tartrat hält das Kupfer in alkalischer Lösung gelöst, bis es als rotes Cu₂O ausfällt.'
            : onlyAromaticAldehyde
              ? 'Aromatische Aldehyde wie Benzaldehyd reduzieren Fehlingsche Lösung nicht – anders als die Tollens-Probe, die sie nachweist.'
              : 'Ohne freie Aldehydgruppe (oder Halbacetal, das sich öffnen kann) findet keine Reduktion statt. Saccharose ist deshalb Fehling-negativ, obwohl sie aus zwei Zuckern besteht.',
          conditions: 'im siedenden Wasserbad erwärmen',
          requires: { heat: true, aqueous: true },
          level: 'Schulversuch',
          hazards: ['Fehling II enthält konzentrierte Natronlauge – ätzend.'],
          tags: positive ? ['Nachweis', 'Niederschlag', 'ziegelrot'] : ['Nachweis', 'negativ'],
        }),
      );
    }
  }

  // Tollens-Probe (Silberspiegel)
  if (has(substances, 'tollens-reagenz')) {
    for (const substance of structural) {
      const positive = reducing(substance);
      results.push(
        special({
          id: `tollens-${substance.id}`,
          type: 'Nachweisreaktion',
          title: `Silberspiegelprobe mit ${substance.name}`,
          equation: positive
            ? 'R–CHO + 2 [Ag(NH₃)₂]⁺ + 3 OH⁻ → R–COO⁻ + 2 Ag↓ + 4 NH₃ + 2 H₂O'
            : 'keine Reaktion',
          reactants: [substance.formula, '[Ag(NH3)2]+'],
          products: positive ? ['Ag'] : [],
          productIds: positive ? ['silber'] : [],
          observation: positive
            ? 'An der Wand des sauberen Reagenzglases scheidet sich ein glänzender Silberspiegel ab.'
            : 'Die Lösung bleibt klar – kein Silberspiegel.',
          explanation: positive
            ? 'Die Aldehydgruppe wird zur Carbonsäure oxidiert und reduziert dabei die Silber-Ionen des Diamminkomplexes zu metallischem Silber.'
            : 'Ketone und nichtreduzierende Zucker reduzieren das Silber nicht.',
          conditions: 'im Wasserbad bei 60 °C, ohne zu schütteln',
          requires: { heat: true, aqueous: true },
          level: 'Schulversuch',
          hazards: ['Tollens-Reagenz nie aufbewahren – beim Stehen kann sich explosives Silbernitrid bilden. Reste sofort mit verdünnter Salpetersäure vernichten.'],
          tags: positive ? ['Nachweis', 'Silberspiegel'] : ['Nachweis', 'negativ'],
        }),
      );
    }
  }

  // Iod-Stärke-Reaktion
  const iodine = has(substances, 'iod') ?? has(substances, 'lugolsche-loesung');
  if (iodine && has(substances, 'staerke')) {
    results.push(
      special({
        id: 'iod-staerke',
        type: 'Nachweisreaktion',
        title: 'Iod-Stärke-Reaktion',
        equation: 'Amylose + I₂ (als I₃⁻/I₅⁻) → Iod-Stärke-Einschlussverbindung (blauschwarz)',
        reactants: ['(C6H10O5)n', 'I2'],
        products: [],
        observation: 'Die Lösung färbt sich tiefblau bis schwarz. Beim Erhitzen verschwindet die Farbe, beim Abkühlen kehrt sie zurück.',
        explanation:
          'Die Amylose der Stärke bildet eine Helix, in deren Innerem sich Polyiodid-Ketten einlagern. Diese Einschlussverbindung absorbiert fast das ganze sichtbare Licht. Wärme entwindet die Helix – deshalb verschwindet die Farbe beim Erhitzen.',
        conditions: 'kalt, wässrige Lösung',
        requires: { aqueous: true },
        level: 'Schulversuch',
        hazards: ['Iod färbt Haut und Kleidung.'],
        tags: ['Nachweis', 'blauschwarz', 'Einschlussverbindung'],
      }),
    );
  }

  // Ninhydrin-Reaktion
  if (has(substances, 'ninhydrin') && rdkit) {
    for (const substance of structural) {
      if (!substance.smiles || !matchSmarts(rdkit, substance.smiles, AMINO_ACID).length) continue;
      results.push(
        special({
          id: `ninhydrin-${substance.id}`,
          type: 'Nachweisreaktion',
          title: `Ninhydrin-Reaktion mit ${substance.name}`,
          equation: 'Aminosäure + 2 Ninhydrin → Ruhemanns Purpur + Aldehyd + CO₂ + 3 H₂O',
          reactants: [substance.formula, 'C9H6O4'],
          products: ['CO2', 'H2O'],
          observation: 'Beim Erwärmen färbt sich die Lösung tief violett (Ruhemanns Purpur).',
          explanation:
            'Ninhydrin baut die Aminosäure unter Decarboxylierung ab; der freigesetzte Stickstoff verbindet zwei Ninhydrinmoleküle zu einem violetten Farbstoff. So macht man Fingerabdrücke und Aminosäuren auf Chromatogrammen sichtbar.',
          conditions: 'erwärmen',
          requires: { heat: true },
          level: 'Schulversuch',
          hazards: ['Ninhydrin färbt die Haut violett und ist gesundheitsschädlich.'],
          tags: ['Nachweis', 'violett'],
        }),
      );
    }
  }

  // Säurekatalysierte Spaltung von Disacchariden
  const water = has(substances, 'wasser');
  const disaccharides: Record<string, { products: [string, string]; names: string; title: string }> = {
    saccharose: { products: ['glucose', 'fructose'], names: 'Glucose und Fructose', title: 'Inversion des Rohrzuckers' },
    lactose: { products: ['glucose', 'galactose'], names: 'Glucose und Galactose', title: 'Spaltung des Milchzuckers' },
  };
  for (const [id, entry] of Object.entries(disaccharides)) {
    if (!has(substances, id)) continue;
    results.push(
      special({
        id: `hydrolyse-${id}`,
        type: 'Hydrolyse',
        title: entry.title,
        equation: `C₁₂H₂₂O₁₁ + H₂O → C₆H₁₂O₆ + C₆H₁₂O₆  (${entry.names})`,
        reactants: ['C12H22O11', 'H2O'],
        products: ['C6H12O6', 'C6H12O6'],
        productIds: entry.products,
        observation:
          id === 'saccharose'
            ? 'Äußerlich ändert sich nichts. Die Lösung dreht polarisiertes Licht danach aber nach links statt nach rechts, und sie ist Fehling-positiv geworden.'
            : 'Äußerlich ändert sich nichts; die entstandenen Monosaccharide lassen sich mit der Fehling-Probe nachweisen.',
        explanation:
          'Die Säure protoniert den Sauerstoff der glykosidischen Bindung; Wasser spaltet sie. Weil Fructose stärker links dreht als Glucose rechts, kehrt sich die Drehrichtung um – daher der Name Invertzucker, der Hauptbestandteil von Honig.',
        conditions: 'verdünnte Säure, erwärmen',
        requires: { heat: true, aqueous: true, catalysis: ['sauer'] },
        level: 'Schulversuch',
        hazards: ['Säuren sind ätzend.'],
        tags: ['Hydrolyse', 'Säurekatalyse', 'Kohlenhydrate'],
      }),
    );
    if (!water) {
      // Wasser fehlt – die Werkbank zeigt das über die Bedingung «in Wasser».
    }
  }

  // Komplexbildung: Metallsalz und Ligandenquelle
  for (const ligandSource of substances) {
    const ligandId = LIGAND_SOURCES[ligandSource.id];
    if (!ligandId) continue;
    for (const saltSubstance of substances) {
      if (saltSubstance === ligandSource) continue;
      const salt = splitSalt(saltSubstance.formula);
      if (!salt) continue;
      const metalId = `${salt.cation.formula.toLowerCase()}${salt.cation.charge}`;
      const recipe = TYPICAL_COMPLEX[`${metalId}|${ligandId}`];
      const metal = CENTRAL_ION_BY_ID.get(metalId);
      if (!recipe || !metal) continue;
      const complex = analyseComplex(
        metal,
        recipe.map(([id, count]) => ({ ligand: LIGAND_BY_ID.get(id)!, count })),
      );
      const insoluble = ['AgCl', 'AgBr', 'AgI'].includes(salt.anhydrous);
      const copperAmmonia = metalId === 'cu2' && ligandId === 'nh3';
      results.push(
        special({
          id: `komplex-${saltSubstance.id}-${ligandSource.id}`,
          type: 'Nachweisreaktion',
          title: `Komplexbildung: ${complex.name}`,
          equation: complex.formation ?? `${saltSubstance.formula} + ${ligandSource.formula} → ${complex.formula}`,
          reactants: [saltSubstance.formula, ligandSource.formula],
          products: [complex.formula],
          observation: [
            copperAmmonia
              ? 'Mit wenig Ammoniak fällt zuerst hellblaues Kupferhydroxid aus; im Überschuss löst es sich zu einer tiefblauen Lösung.'
              : insoluble
                ? `Der Niederschlag von ${saltSubstance.name} löst sich auf.`
                : complex.color === 'farblos'
                  ? 'Die Lösung bleibt bzw. wird farblos.'
                  : `Die Lösung färbt sich ${complex.color}.`,
            complex.note ?? '',
          ].filter(Boolean).join(' '),
          explanation: `Die ${ligandSource.name} liefert ${LIGAND_BY_ID.get(ligandId)?.label}-Liganden, die das Wasser am ${metal.element}-Ion verdrängen. Es entsteht ${complex.formulaPretty}${complex.logBeta !== undefined ? ` (lg β = ${String(complex.logBeta).replace('.', ',')})` : ''} – ${complex.geometry}, ${complex.unpaired} ungepaarte Elektronen.`,
          conditions: ligandId === 'cl' ? 'konzentrierte Salzsäure' : 'wässrige Lösung, Raumtemperatur',
          requires: { aqueous: true },
          level: 'Schulversuch',
          hazards: ligandId === 'nh3' ? ['Ammoniak reizt Augen und Atemwege.'] : [],
          tags: ['Komplexbildung', complex.color],
        }),
      );
      results[results.length - 1].complexLink = `/komplexe?zentral=${metalId}&liganden=${recipe.map(([id, count]) => `${id}:${count}`).join(',')}`;
    }
  }

  // Berliner Blau und Turnbulls Blau
  const hexacyanido = [
    { id: 'kaliumhexacyanoferrat-ii', partner: 3, name: 'Berliner Blau' },
    { id: 'kaliumhexacyanoferrat-iii', partner: 2, name: 'Turnbulls Blau' },
  ];
  for (const entry of hexacyanido) {
    if (!has(substances, entry.id)) continue;
    const iron = substances.find((substance) => {
      const salt = splitSalt(substance.formula);
      return salt?.cation.formula === 'Fe' && salt.cation.charge === entry.partner;
    });
    if (!iron) continue;
    results.push(
      special({
        id: `blau-${entry.id}-${iron.id}`,
        type: 'Nachweisreaktion',
        title: entry.name,
        equation:
          entry.partner === 3
            ? 'Fe³⁺ + K⁺ + [Fe(CN)₆]⁴⁻ → KFe[Fe(CN)₆]↓'
            : 'Fe²⁺ + K⁺ + [Fe(CN)₆]³⁻ → KFe[Fe(CN)₆]↓',
        reactants: [iron.formula, entry.partner === 3 ? 'K4[Fe(CN)6]' : 'K3[Fe(CN)6]'],
        products: ['KFe[Fe(CN)6]'],
        observation: 'Sofort fällt ein tiefblauer Niederschlag aus.',
        explanation:
          `Nachweis für Eisen(${entry.partner === 3 ? 'III' : 'II'})-Ionen. Berliner Blau und Turnbulls Blau sind – wie man heute weiß – derselbe Stoff: In beiden liegen Eisen(II) und Eisen(III) nebeneinander vor, und die Elektronenübertragung zwischen ihnen (Intervalenz-Charge-Transfer) verursacht die intensive Farbe.`,
        conditions: 'wässrige Lösung',
        requires: { aqueous: true },
        level: 'Schulversuch',
        hazards: [],
        tags: ['Nachweis', 'Niederschlag', 'tiefblau'],
      }),
    );
  }

  // Technische Verfahren und Versuche mit fester Gleichung
  const keys = new Set(substances.map((substance) => formulaKey(substance.formula)).filter(Boolean));
  for (const rule of REACTIONS) {
    const fixed = rule.fixedEquation;
    if (!fixed) continue;
    const reactantKeys = fixed.reactants.map((formula) => formulaKey(formula));
    if (!reactantKeys.length || !reactantKeys.every((key) => key && keys.has(key))) continue;
    if (fixed.reactants.join('|') === fixed.products.join('|')) continue;
    // Einstoff-Verfahren wie die Wasserelektrolyse nur anbieten, wenn der Stoff
    // allein im Gefäß ist – sonst stünde sie bei jeder wässrigen Mischung da.
    if (fixed.reactants.length < 2 && substances.length > 1) continue;
    const spec = WORKBENCH_SPECS[rule.id];
    results.push(
      special({
        id: `verfahren-${rule.id}`,
        type: 'Nichtmetall-Synthese',
        title: rule.name,
        equation: fixed.balanced,
        reactants: fixed.reactants,
        products: fixed.products,
        observation: rule.summary,
        explanation: rule.mechanism.summary,
        conditions: rule.conditions.temperature,
        requires: spec ?? { heat: true, electro: Boolean(rule.electro) },
        level: rule.safety.level,
        hazards: rule.safety.hazards,
        tags: rule.keywords.slice(0, 3),
        ruleId: rule.id,
      }),
    );
  }

  return results;
}
