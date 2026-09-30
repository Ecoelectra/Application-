/**
 * Welcher Metallkatalysator passt zu dieser Reaktion?
 *
 * Die Vorhersage stützt sich auf
 *  - die Reaktionsart (Familie der Reaktions-KI, Regel der Werkbank, technisches
 *    Verfahren),
 *  - Strukturmerkmale der Edukte und Produkte (Alkin, Alken, Arylhalogenid,
 *    Boronsäure, Nitro-, Nitril-, Carbonylgruppe, Azid),
 *  - die Katalysatoren, die in den Patenten der KI-Vorlage tatsächlich
 *    verwendet wurden (z. B. «Pd(PPh3)4» in 60 % der Fälle).
 *
 * Jede Reaktion bekommt eine Aussage: den passenden Katalysator mit Begründung
 * und Menge – oder, wo kein Metall hilft (Ionenreaktionen, Säure-Base,
 * Fällungen), die klare Aussage, dass keiner nötig ist, und was stattdessen hilft.
 */
import { METAL_CATALYSTS, metalCatalystById, type MetalCatalyst } from '../data/metalCatalysts';
import type { Substance } from '../data/types';
import type { WorkbenchReaction } from './workbench';

export interface CatalystPick {
  catalyst: MetalCatalyst;
  role: 'Katalysator' | 'Cokatalysator';
  reason: string;
  /** Beleg aus den Patenten der Reaktions-KI */
  evidence?: string;
}

export interface MetalPrediction {
  /** Ein Metallkatalysator ist für diese Reaktion sinnvoll */
  needed: boolean;
  picks: CatalystPick[];
  /** Ein Satz für die Anzeige */
  summary: string;
}

interface Context {
  text: string;
  family: string;
  reactants: string[];
  products: string[];
  kind: WorkbenchReaction['kind'];
  names: string;
}

const ALKYNE = /C#C/;
const ALKENE = /C\]?=\[?C/;
const ARYL_HALIDE = /c(?:\(|\d*)?(?:Br|I|Cl)|(?:Br|I|Cl)c/;
const BORON = /B\(O\)O|OB\(O\)|B\(O/;
const NITRO = /\[N\+\]\(=O\)\[O-\]|N\(=O\)=O/;
const NITRILE = /C#N|N#C/;
const AZIDE = /N=\[N\+\]=\[N-\]|\[N-\]=\[N\+\]=N|N=N=N/;

const has = (list: string[], pattern: RegExp) => list.some((smiles) => pattern.test(smiles));
const aromaticAtoms = (list: string[]) => list.reduce((sum, smiles) => sum + (smiles.match(/[cnos]/g) ?? []).length, 0);

function pick(id: string, reason: string, role: CatalystPick['role'] = 'Katalysator'): CatalystPick {
  const catalyst = metalCatalystById(id);
  if (!catalyst) throw new Error(`Katalysator ${id} fehlt`);
  return { catalyst, role, reason };
}

type Rule = (context: Context) => CatalystPick[] | null;

/** Regeln in fester Reihenfolge – die erste, die greift, entscheidet */
const RULES: Rule[] = [
  // ---------- eindeutig benannte Verfahren zuerst ----------
  (c) => (/lindlar/.test(c.text) ? [pick('lindlar', 'Teilhydrierung eines Alkins: Der vergiftete Lindlar-Katalysator bleibt beim (Z)-Alken stehen.')] : null),
  (c) => (/metathese/.test(c.text) ? [pick('grubbs', 'Ruthenium-Carbenkomplex für Ringschluss- und Kreuzmetathese; das entstehende Ethen entweicht.')] : null),
  // ---------- Technische Katalyse (Gasphase) ----------
  (c) =>
    c.family === 'gaskatalyse-hydrierung' || /sabatier|methanisierung/.test(c.text)
      ? c.products.some((smiles) => /^C?O$|^OC$|CO$/.test(smiles) && smiles.length <= 2)
        ? [pick('cu-zno', 'Methanol aus CO₂ bzw. CO: Kupfer auf Zinkoxid bei 220–280 °C und 50–100 bar.'), pick('ni-al2o3', 'Nickel würde stattdessen Methan liefern.')]
        : [pick('ni-al2o3', 'Sabatier-Reaktion: Nickel auf Aluminiumoxid bei 250–400 °C setzt CO₂ und H₂ zu Methan um; Druck verschiebt das Gleichgewicht zum Methan.'), pick('cu-zno', 'Mit Kupfer/Zinkoxid entstünde vor allem Methanol.')]
      : null,
  (c) =>
    c.family === 'reformierung' || /reformierung|wassergas/.test(c.text)
      ? c.reactants.some((smiles) => smiles === 'C') || /reformierung/.test(c.text)
        ? [pick('ni-al2o3', 'Reformierung von Methan an Nickel bei 700–900 °C.')]
        : [pick('cu-zno', 'Wassergas-Shift und ihre Umkehrung an Kupfer/Zinkoxid (200–300 °C) bzw. Eisenoxid (350–450 °C).'), pick('platin', 'Platin katalysiert die umgekehrte Shift-Reaktion bei hoher Temperatur.')]
      : null,
  (c) => (c.family === 'hydroformylierung' || /hydroformylierung|oxo-synthese|carbonylierung/.test(c.text) ? [pick('hrh-co', 'Rhodium-Phosphin-Komplex: Alken, CO und H₂ werden bei 80–120 °C und 10–50 bar zum Aldehyd verknüpft.')] : null),
  (c) => (c.family === 'gaskatalyse-oxidation' || /ethylenoxid/.test(c.text) ? [pick('silber', 'Silber überträgt ein Sauerstoffatom auf die Doppelbindung bzw. dehydriert Methanol zu Formaldehyd.')] : null),
  (c) =>
    c.family === 'dehydrierung'
      ? has(c.reactants, /O/)
        ? [pick('kupfer', 'Alkohole werden an Kupfer bei 250–300 °C zu Aldehyden und Ketonen dehydriert (Wasserstoff entweicht).'), pick('platin', 'Platin wirkt ähnlich, ist aber teurer.')]
        : [pick('platin', 'Cycloalkane werden an Platin bei 450–500 °C zu Aromaten dehydriert (Reformieren).')]
      : null,
  // ---------- Kreuzkupplungen ----------
  (c) =>
    c.family === 'suzuki' || /suzuki/.test(c.text) || (has(c.reactants, BORON) && has(c.reactants, ARYL_HALIDE))
      ? [
          pick('pd-pph3-4', 'Klassischer Katalysator der Suzuki-Kupplung: Pd(0) schiebt sich in die C–Halogen-Bindung, die Boronsäure überträgt ihren Rest (mit Base, z. B. K₂CO₃).'),
          pick('pd-oac2-ligand', 'Stabiler zu lagern; mit sperrigen Phosphinen (SPhos) auch für Arylchloride.'),
          pick('pd-c', 'Ligandfrei in Wasser/Ethanol – billig, für einfache Arylbromide ausreichend.'),
        ]
      : null,
  (c) =>
    c.family === 'stille' || /stille|stannan|sn\(/.test(c.text)
      ? [pick('pd-pph3-4', 'Standardkatalysator der Stille-Kupplung mit Organozinnverbindungen.'), pick('pdcl2-pph3-2', 'Luftstabile Pd(II)-Vorstufe, wird im Ansatz reduziert.')]
      : null,
  (c) =>
    /sonogashira/.test(c.text) || ((c.family === 'kreuzkupplung' || has(c.reactants, ARYL_HALIDE)) && has(c.reactants, ALKYNE) && c.kind === 'organisch')
      ? [
          pick('pdcl2-pph3-2', 'Sonogashira-Kupplung: Palladium kuppelt das Arylhalogenid mit dem Alkin (mit Amin als Base).'),
          pick('cui', 'Kupfer(I) bildet das Kupferacetylid, das den Alkinrest auf das Palladium überträgt.', 'Cokatalysator'),
        ]
      : null,
  (c) =>
    /heck/.test(c.text) || (c.family === 'kreuzkupplung' && has(c.reactants, ALKENE))
      ? [pick('pd-oac2-ligand', 'Heck-Reaktion: Pd(OAc)₂ mit Triphenylphosphin und Triethylamin, 80–120 °C.'), pick('pd-pph3-4', 'Pd(0) direkt, falls kein Ligand zur Hand ist.')]
      : null,
  (c) => (c.family === 'kreuzkupplung' ? [pick('pd-pph3-4', 'Palladium(0)-Katalysator für Kreuzkupplungen von Arylhalogeniden.'), pick('pd-oac2-ligand', 'Alternative mit frei wählbarem Liganden.')] : null),
  (c) =>
    c.family === 'buchwald' || /buchwald/.test(c.text)
      ? [
          pick('pd-oac2-ligand', 'Buchwald-Hartwig-Aminierung: Pd(OAc)₂ mit sperrigem Biarylphosphin (XPhos) oder BINAP und NaOtBu.'),
          pick('cui', 'Ullmann-Goldberg-Variante mit Kupfer: billiger, braucht aber höhere Temperatur (100–130 °C).'),
        ]
      : null,
  (c) => (/ullmann/.test(c.text) ? [pick('cui', 'Kupfer(I) vermittelt die Kupplung von Arylhalogeniden mit N-, O- und S-Nucleophilen.'), pick('kupfer', 'Klassisch mit aktivem Kupferpulver bei hoher Temperatur.')] : null),
  (c) =>
    c.family === 'snar' && c.kind === 'organisch'
      ? [pick('pd-oac2-ligand', 'Ohne aktivierende Nitrogruppe ist die nucleophile Substitution am Aromaten träge – Palladium (Buchwald-Hartwig) macht sie bei 80–110 °C möglich.'), pick('cui', 'Oder Kupfer(I) nach Ullmann.')]
      : null,
  // ---------- Click, Metathese ----------
  (c) => (has(c.reactants, AZIDE) && has(c.reactants, ALKYNE)) || /click|triazol/.test(c.text) ? [pick('cu-ascorbat', 'Kupfer(I) beschleunigt die Azid-Alkin-Cycloaddition um das 10⁷-Fache und liefert nur das 1,4-Triazol.')] : null,
  // ---------- Hydrierungen und Reduktionen ----------
  (c) =>
    (c.family === 'hydrierung' || /hydrier/.test(c.text)) && has(c.reactants, ALKYNE) && has(c.products, ALKENE)
      ? [pick('lindlar', 'Teilhydrierung eines Alkins: Der vergiftete Lindlar-Katalysator bleibt beim (Z)-Alken stehen.'), pick('pd-c', 'Pd/C hydriert bis zum Alkan durch – nur, wenn das gewünscht ist.')]
      : null,
  (c) =>
    (c.family === 'hydrierung' || /hydrier/.test(c.text)) && aromaticAtoms(c.reactants) > aromaticAtoms(c.products) + 2
      ? [pick('adams', 'Aromaten werden erst mit Platin (Adams-Katalysator) in Essigsäure oder unter Druck hydriert.'), pick('raney-ni', 'Raney-Nickel bei 100 bar und 100–150 °C (technisch).')]
      : null,
  (c) =>
    c.family === 'hydrierung' || /hydrierung|hydrier/.test(c.text) || c.names.includes('wasserstoff') && has(c.reactants, ALKENE)
      ? [
          pick('pd-c', 'Standard für C=C-Hydrierungen: Pd/C unter 1 bar Wasserstoff (Ballon), Raumtemperatur.'),
          pick('adams', 'Platin, falls Palladium Nebenreaktionen (Hydrogenolyse) auslöst.'),
          pick('wilkinson', 'Homogen und selektiv: hydriert nur wenig substituierte Doppelbindungen, andere Gruppen bleiben.'),
        ]
      : null,
  (c) =>
    c.family === 'nitro-reduktion' || (has(c.reactants, NITRO) && /reduktion|anilin|amin/.test(c.text))
      ? [pick('pd-c', 'Nitrogruppe zu Amin: Pd/C mit Wasserstoff, sauber und schnell.'), pick('raney-ni', 'Raney-Nickel – billiger, wenn Halogene am Ring bleiben sollen (weniger Enthalogenierung).')]
      : null,
  (c) =>
    c.family === 'reduktion' && has(c.reactants, NITRILE)
      ? [pick('raney-ni', 'Nitrile werden mit Raney-Nickel (mit Ammoniak) zu primären Aminen hydriert.'), pick('pd-c', 'Pd/C in saurer Lösung als Alternative.')]
      : null,
  (c) =>
    c.family === 'reduktion' || (c.family === 'reduktive-aminierung' && c.names.includes('wasserstoff'))
      ? [pick('adams', 'Carbonylgruppen hydriert Platin zuverlässiger als Palladium.'), pick('raney-ni', 'Raney-Nickel unter Druck.'), pick('pd-c', 'Pd/C, vor allem bei aromatischen Ketonen.')]
      : null,
  (c) =>
    c.family === 'reduktive-aminierung'
      ? [pick('pd-c', 'Reduktive Aminierung mit Wasserstoff: Imin bildet sich, Pd/C hydriert es sofort zum Amin.'), pick('raney-ni', 'Raney-Nickel als billigere Alternative.')]
      : null,
  (c) =>
    c.family === 'schutzgruppe-n' || c.family === 'etherspaltung' || /hydrogenolyse|benzyl.*abspalt|cbz/.test(c.text)
      ? [pick('pd-c', 'Benzyl- und Cbz-Gruppen werden mit Pd/C und Wasserstoff abgespalten (Hydrogenolyse).')]
      : null,
  // ---------- Oxidationen ----------
  (c) =>
    (c.family === 'oxidation' || /oxidation/.test(c.text)) && c.kind === 'organisch' && /methanol|ethanol/.test(c.names)
      ? [pick('kupfer', 'Kupferspirale: Methanol bzw. Ethanol wird am heißen Kupferoxid zum Aldehyd oxidiert – der klassische Schulversuch.'), pick('platin', 'Glühender Platindraht über Alkoholdampf.')]
      : null,
  (c) =>
    (c.family === 'oxidation' || /oxidation/.test(c.text)) && c.kind === 'organisch'
      ? [pick('cu-tempo', 'Primäre Alkohole mit Luftsauerstoff zum Aldehyd – Kupfer/TEMPO oxidiert nicht bis zur Säure weiter.'), pick('platin', 'Platin mit Sauerstoff oxidiert primäre Alkohole in Wasser bis zur Carbonsäure.')]
      : null,
  // ---------- Elektrophile Substitution ----------
  (c) =>
    c.family === 'halogenierung' || c.family === 'aromaten-substitution' || /bromierung|chlorierung|friedel|halogenierung/.test(c.text)
      ? [pick('febr3', 'Eisen(III)-halogenid aus Eisenspänen polarisiert das Halogen – bei aktivierten Aromaten (Phenol, Anilin) ist es gar nicht nötig.')]
      : null,
  // ---------- Carbonylchemie mit Metall-Lewis-Säuren ----------
  (c) =>
    c.family === 'ester' || /veresterung|umesterung/.test(c.text)
      ? [pick('ti-oipr4', 'Titan(IV)-isopropanolat katalysiert (Um-)Esterungen ohne starke Säure – technisch bei Polyestern üblich. Im Schullabor genügt Schwefelsäure (Säurekatalyse).')]
      : null,
  (c) =>
    c.family === 'amid-saeure' || /amidbildung aus carbonsäure/.test(c.text)
      ? [pick('ti-oipr4', 'Titan(IV)-alkoxide ermöglichen die direkte Amidbildung aus Säure und Amin bei 80–110 °C ohne Kupplungsreagenz.')]
      : null,
  (c) => (c.family === 'grignard' ? [pick('cui', 'Kupfer(I) lenkt Grignard-Reagenzien bei α,β-ungesättigten Carbonylen in die 1,4-Addition.')] : null),
  // ---------- Technische und anorganische Katalyse ----------
  (c) => (/haber|ammoniaksynthese|n2 \+ 3 h2|n₂ \+ 3 h₂/.test(c.text) ? [pick('eisen-haber', 'Eisen mit K₂O und Al₂O₃ – der Katalysator des Haber-Bosch-Verfahrens.')] : null),
  (c) => (/kontaktverfahren|schwefeltrioxid|so2 \+|so₂ \+|2 so2|2 so₂/.test(c.text) ? [pick('v2o5', 'Vanadium(V)-oxid bei 400–450 °C oxidiert SO₂ zu SO₃.'), pick('platin', 'Früher Platin – teurer und empfindlich gegen Arsen.')] : null),
  (c) => (/ostwald|ammoniakverbrennung|4 nh3 \+ 5 o2|4 nh₃ \+ 5 o₂/.test(c.text) ? [pick('platin', 'Platin-Rhodium-Netz bei 850–950 °C oxidiert Ammoniak zu Stickstoffmonoxid.')] : null),
  (c) => (/methanolsynthese|co \+ 2 h2|co \+ 2 h₂/.test(c.text) ? [pick('cu-zno', 'Kupfer auf Zinkoxid bei 250 °C und 50–100 bar.')] : null),
  (c) => (/fischer-tropsch/.test(c.text) ? [pick('eisen-haber', 'Eisen- oder Cobaltkatalysatoren wandeln Synthesegas in Kohlenwasserstoffe um.')] : null),
  (c) =>
    /wasserstoffperoxid|h2o2|h₂o₂/.test(c.text) && /zerfall|zersetz|→ 2 h2o \+ o2|o₂/.test(c.text)
      ? [pick('mno2', 'Braunstein zersetzt Wasserstoffperoxid sofort – klassischer Schulversuch mit Glimmspanprobe.'), pick('platin', 'Auch Platin katalysiert den Zerfall.')]
      : null,
  (c) =>
    /kaliumchlorat|kclo3|kclo₃/.test(c.text) && /zerfall|zersetz|erhitz|o2|o₂/.test(c.text)
      ? [pick('mno2', 'Braunstein senkt die Zerfallstemperatur von Kaliumchlorat deutlich.')]
      : null,
  (c) =>
    /knallgas|2 h2 \+ o2|2 h₂ \+ o₂|kohlenmonoxid.*oxid|co-oxidation|abgaskatalysator|verbrennung von methan/.test(c.text)
      ? [pick('platin', 'Platin und Palladium oxidieren Wasserstoff, CO und Kohlenwasserstoffe schon bei niedriger Temperatur (Abgaskatalysator).'), pick('pd-c', 'Palladium wirkt ähnlich.')]
      : null,
];

/** Katalysator-Beispiele aus den Patenten der KI den Anleitungen zuordnen */
const EXAMPLE_PATTERNS: Array<[RegExp, string]> = [
  [/tetrakis|pd\(pph3\)4|pd\(pph₃\)₄/i, 'pd-pph3-4'],
  [/pdcl2\(pph3\)2|bis\(triphenylphosphin\)palladium|dichlorobis/i, 'pdcl2-pph3-2'],
  [/palladium auf|pd\/c|palladium on|kohle/i, 'pd-c'],
  [/acetat|pd\(oac\)2|oac/i, 'pd-oac2-ligand'],
  [/raney|nickel/i, 'raney-ni'],
  [/pto2|platin\(iv\)-oxid|adams/i, 'adams'],
  [/platin|pt\b/i, 'platin'],
  [/kupfer\(i\)-iodid|cui\b|iodcu|cui/i, 'cui'],
  [/rhodium|rh\(/i, 'wilkinson'],
  [/ruthenium|grubbs/i, 'grubbs'],
];

const METAL_CATEGORIES = new Set(['pd', 'pt', 'ni', 'cu', 'edelmetall', 'technisch']);

function context(reaction: WorkbenchReaction, vessel: Substance[]): Context {
  const involved = vessel.filter((substance) => reaction.participants?.includes(substance.id));
  // Ohne Angabe der Beteiligten zählen alle Stoffe im Gefäß
  const participants = involved.length ? involved : vessel;
  const reactants = [...participants, ...(reaction.ai?.reactants ?? [])].map((substance) => substance.smiles ?? '').filter(Boolean);
  const products = reaction.products.map((product) => product.smiles ?? '').filter(Boolean);
  const names = [...participants, ...(reaction.ai?.reactants ?? []), ...(reaction.ai?.reagent ? [reaction.ai.reagent] : [])]
    .map((substance) => substance.name.toLowerCase())
    .join(' ');
  // Den Namen der KI-Familie nicht einbeziehen: «C–C-Kupplung (Heck, Sonogashira, Negishi)» nennt mehrere Reaktionen
  const text = [reaction.title, reaction.reactionType, reaction.equation, reaction.ruleId ?? '']
    .join(' ')
    .toLowerCase();
  return { text, family: reaction.ai?.familyId ?? '', reactants, products, kind: reaction.kind, names };
}

/** Was hilft stattdessen, wenn kein Metallkatalysator passt */
function alternativeHelp(reaction: WorkbenchReaction): string {
  const helper = reaction.ai?.catalysts.find((entry) => !METAL_CATEGORIES.has(entry.category) && entry.category !== 'wasserstoff' && entry.score >= 0.3);
  if (helper) return ` Was stattdessen hilft: ${helper.label}.`;
  const need = reaction.missing.find((entry) => /katalyse|säure|base|erhitz/i.test(entry));
  return need ? ` Stattdessen nötig: ${need.replace(/\.$/, '')}.` : '';
}

/**
 * Vorhersage für eine Reaktion der Werkbank. Liefert immer eine Aussage –
 * auch, dass kein Metallkatalysator nötig ist.
 */
export function predictMetalCatalyst(reaction: WorkbenchReaction, vessel: Substance[] = []): MetalPrediction {
  const ctx = context(reaction, vessel);
  // Elektrochemie: Die Elektroden übernehmen den Elektronenaustausch
  if (/elektrolyse|anodisch|kathodisch|elektrochem/.test(ctx.text)) {
    return {
      needed: false,
      picks: [],
      summary:
        'Kein Metallkatalysator nötig: Das ist eine elektrochemische Umsetzung – Strom und Elektroden (z. B. aus Platin oder Graphit) übernehmen den Elektronenaustausch.',
    };
  }
  let picks: CatalystPick[] = [];
  for (const rule of RULES) {
    const result = rule(ctx);
    if (result?.length) {
      picks = result;
      break;
    }
  }

  // Belege aus den Patenten der KI-Vorlage
  const learned = (reaction.ai?.catalysts ?? []).filter((entry) => METAL_CATEGORIES.has(entry.category));
  for (const suggestion of learned) {
    for (const example of suggestion.examples) {
      const id = EXAMPLE_PATTERNS.find(([pattern]) => pattern.test(example))?.[1];
      if (!id) continue;
      const evidence = `${suggestion.share > 0 ? `In ${Math.round(suggestion.share * 100)} % der Patente dieser Vorlage` : 'In den Patenten dieser Vorlage'} verwendet: ${example}.`;
      const existing = picks.find((entry) => entry.catalyst.id === id);
      if (existing) {
        existing.evidence ??= evidence;
      } else if (picks.length < 4) {
        picks.push({ ...pick(id, `Von der Reaktions-KI aus Patenten gelernt (${suggestion.label}).`), evidence });
      }
    }
  }
  // Die KI verlangt ein Metall, keine Regel greift: nach Metallart wählen
  if (!picks.length && learned.length) {
    const byCategory: Record<string, string> = { pd: 'pd-pph3-4', pt: 'platin', ni: 'raney-ni', cu: 'cui', edelmetall: 'wilkinson', technisch: 'silber' };
    const top = learned[0];
    picks.push(pick(byCategory[top.category], `Die Reaktions-KI erwartet hier einen ${top.label} (${top.purpose.split('.')[0]}).`));
  }

  if (picks.length) {
    const main = picks.find((entry) => entry.role === 'Katalysator') ?? picks[0];
    const co = picks.find((entry) => entry.role === 'Cokatalysator');
    return {
      needed: true,
      picks,
      summary: `${main.catalyst.name}${co ? ` mit ${co.catalyst.short} als Cokatalysator` : ''} – ${main.catalyst.loading}.`,
    };
  }

  const ionic = reaction.kind === 'anorganisch' && !/verbrennung|zerfall|synthese/.test(ctx.text);
  return {
    needed: false,
    picks: [],
    summary: ionic
      ? 'Kein Metallkatalysator nötig: Reaktionen zwischen Ionen (Neutralisation, Fällung, Gasbildung, Komplexbildung) oder von Metallen mit Säuren laufen ohne Barriere, die ein Katalysator senken könnte.'
      : `Für diese Reaktionsart ist kein Metallkatalysator üblich – ein Metall beschleunigt sie nicht.${alternativeHelp(reaction)}`,
  };
}

export { METAL_CATALYSTS };
