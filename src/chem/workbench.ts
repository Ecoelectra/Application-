/**
 * Werkbank: Was passiert, wenn man diese Stoffe zusammengibt?
 *
 * Die Engine prüft der Reihe nach:
 *  1. Ist die Mischung akut gefährlich? Dann wird nichts simuliert.
 *  2. Anorganische Regeln (Ionenmodell, Spannungsreihe, Verbrennung …).
 *  3. Säure-Base-Reaktionen organischer Stoffe.
 *  4. Nachweis- und Sonderreaktionen, technische Verfahren.
 *  5. Organische Reaktionsvorschriften – ausschließlich mit den Stoffen, die
 *     tatsächlich im Gefäß sind. Fehlt ein Edukt, wird nichts erfunden.
 *
 *  6. Belegte Reaktionen aus der Patentliteratur, deren Edukte vollständig im
 *     Gefäß sind.
 *
 * Jede Reaktion kennt ihre Bedingungen. Sind sie nicht erfüllt, erscheint sie
 * trotzdem – mit der Angabe, was fehlt. So sieht man, dass eine Reaktion
 * grundsätzlich möglich ist und woran es noch hängt.
 *
 * Außerdem sagt jede Reaktion, woher das Ergebnis stammt: belegt (in der
 * Literatur beschrieben), Lehrbuchreaktion (fest hinterlegt) oder Vorhersage
 * (aus einer allgemeinen Regel oder Reaktionsvorlage berechnet).
 */
import type { MainModule } from '@rdkit/rdkit';
import { canonicalSmiles, matchSmarts, molecularFormula, runReaction } from './rdkit';
import { molarMass } from './formula';
import { isPublishableProduct, mixtureWarning } from './safety';
import { reactPair, reactSingle, type InorganicReaction } from './inorganicRules';
import { organicAcidBase } from './organicAcidBase';
import { specialReactions } from './specialReactions';
import { complexChemistry } from './complexFormation';
import type { ComplexAnalysis } from './complexes';
import { structureKey, substanceKeys } from './reactionKeys';
import { ionStructures, saltFormula, structuresOf } from './substanceStructures';
import type { Ion } from './ions';
import { completeReactions, type DocumentedReaction } from '../data/documentedReactions';
import { REACTIONS } from '../data/reactions';
import { SUBSTANCES, formulaKey } from '../data/substances';
import {
  CATALYSIS_LABELS,
  CATALYST_SUBSTANCES,
  WORKBENCH_SPECS,
  describeCatalysis,
  type Catalysis,
  type Requirements,
} from '../data/workbenchSpecs';
import type { ReactionRule, SafetyLevel, Substance } from '../data/types';

export type Temperature = 'kalt' | 'raum' | 'heiss';

export interface WorkbenchConditions {
  temperature: Temperature;
  /** gewählte Katalyse; «keine» heißt: nichts zugesetzt */
  catalysis: Catalysis | 'keine';
  /** In Wasser gelöst arbeiten */
  aqueous: boolean;
  /** Mit Licht (UV) bestrahlen */
  light: boolean;
  /** Elektrolysezelle mit Stromquelle */
  electrolysis: boolean;
}

export const DEFAULT_CONDITIONS: WorkbenchConditions = {
  temperature: 'raum',
  catalysis: 'keine',
  aqueous: true,
  light: false,
  electrolysis: false,
};

export interface WorkbenchProduct {
  smiles?: string;
  formula?: string;
  /** Name aus der Stoffdatenbank, falls das Produkt dort bekannt ist */
  name?: string;
  /** Kennung des Stoffes in der Datenbank, für die Verlinkung */
  substanceId?: string;
}

export interface WorkbenchReaction {
  id: string;
  kind: 'anorganisch' | 'organisch';
  title: string;
  /** Verweis auf die ausführliche Reaktionsbeschreibung, falls vorhanden */
  ruleId?: string;
  reactionType: string;
  equation: string;
  ionicEquation?: string;
  products: WorkbenchProduct[];
  observation: string;
  explanation: string;
  conditions: string;
  safetyLevel: SafetyLevel;
  hazards: string[];
  tags: string[];
  /** Was zusätzlich nötig wäre, damit die Reaktion tatsächlich abläuft */
  missing: string[];
  /** Die gewählte Katalyse ist genau die, die diese Reaktion braucht */
  catalysisMatched: boolean;
  /** Adresse in der Komplex-Werkbank, falls ein Komplex entsteht */
  complexLink?: string;
  /** Herkunft des Ergebnisses */
  evidence: Evidence;
  /** Erklärung zur Herkunft, für die Anzeige */
  evidenceNote: string;
  /** Beleg aus der Reaktionsdatenbank */
  documented?: { id: number; count: number; source: string };
  /** Entstehender Komplex mit Ligandenfeldanalyse */
  complex?: ComplexAnalysis;
}

/**
 * Woher weiß die Werkbank, dass es so abläuft?
 *  - belegt: genau diese Umsetzung ist in der Patentliteratur beschrieben
 *  - lehrbuch: fest hinterlegte Standardreaktion (Nachweise, Verfahren)
 *  - vorhersage: aus einer allgemeinen Regel oder Vorlage berechnet
 */
export type Evidence = 'belegt' | 'lehrbuch' | 'vorhersage';

export const EVIDENCE_LABELS: Record<Evidence, string> = {
  belegt: 'Belegt',
  lehrbuch: 'Lehrbuchreaktion',
  vorhersage: 'Vorhersage',
};

const RULE_NOTE =
  'Vorhersage nach allgemeinen Lehrbuchregeln (Säure-Base, Löslichkeit, Spannungsreihe). Für typische Schulreaktionen zuverlässig – für genau diese Stoffkombination aber nicht einzeln belegt.';
const TEXTBOOK_NOTE =
  'Lehrbuchreaktion: fest hinterlegte, gut untersuchte Standardreaktion. Kein Einzelbeleg aus der Literatur, aber gesichertes Grundwissen.';

function templateNote(ruleName: string): string {
  return `Vorhersage: Die Reaktionsvorlage «${ruleName}» wurde auf die Struktur angewendet. Sterik, Konkurrenzreaktionen und Ausbeute sind nicht berücksichtigt – dass die Reaktion mit genau diesen Stoffen so abläuft, ist nicht belegt.`;
}

function documentedNote(reaction: DocumentedReaction): string {
  const times = reaction.count === 1 ? 'einer Patentschrift' : `${reaction.count} Patentschriften`;
  return `Belegt: Genau diese Umsetzung ist in ${times} beschrieben (US-Patente 1976–2016, Datensatz USPTO, Eintrag ${reaction.source}). Der Datensatz wurde automatisch aus den Patenttexten gewonnen; einzelne Einträge können Fehler enthalten.`;
}

export type MixOutcome = 'reaktion' | 'keine-reaktion' | 'gesperrt';

export interface MixResult {
  outcome: MixOutcome;
  reactions: WorkbenchReaction[];
  /** Grund der Sperre bei gefährlichen Mischungen */
  blocked?: string;
  /** Erklärungen, wenn nichts passiert */
  hints: string[];
}

// ---------------------------------------------------------------------
// Hilfsfunktionen
// ---------------------------------------------------------------------

let structureIndex: Map<string, Substance> | null = null;

function buildStructureIndex(rdkit: MainModule): Map<string, Substance> {
  if (structureIndex) return structureIndex;
  const index = new Map<string, Substance>();
  for (const substance of SUBSTANCES) {
    if (!substance.smiles) continue;
    const canonical = canonicalSmiles(rdkit, substance.smiles);
    if (canonical && !index.has(canonical)) index.set(canonical, substance);
  }
  structureIndex = index;
  return index;
}

function describeProduct(rdkit: MainModule, smiles: string): WorkbenchProduct {
  const canonical = canonicalSmiles(rdkit, smiles) ?? smiles;
  const known = buildStructureIndex(rdkit).get(canonical);
  return {
    smiles: canonical,
    formula: molecularFormula(rdkit, canonical) ?? undefined,
    name: known?.name,
    substanceId: known?.id,
  };
}

function productFromFormula(formula: string): WorkbenchProduct {
  const key = formulaKey(formula);
  const known = SUBSTANCES.find(
    (substance) => substance.formula === formula || (key && formulaKey(substance.formula) === key && !substance.smiles),
  ) ?? SUBSTANCES.find((substance) => substance.formula === formula);
  return { formula, name: known?.name, substanceId: known?.id, smiles: known?.smiles };
}

/**
 * Macht aus einem Produkt einen Stoff, mit dem man weiterarbeiten kann –
 * auch wenn es nicht in der Datenbank steht.
 */
export function productAsSubstance(product: WorkbenchProduct): Substance | null {
  if (product.substanceId) return SUBSTANCES.find((entry) => entry.id === product.substanceId) ?? null;
  const formula = product.formula?.replace(/\^\d*[+-]$/, '');
  if (!formula) return null;
  let mass = 0;
  try {
    mass = molarMass(formula);
  } catch {
    mass = 0;
  }
  const key = (product.smiles ?? formula).replace(/[^A-Za-z0-9]/g, '').slice(0, 40).toLowerCase();
  return {
    id: `produkt-${key}`,
    name: product.name ?? formula,
    synonyms: [],
    formula,
    smiles: product.smiles,
    molarMass: mass,
    category: 'Produkt',
    description: 'In der Werkbank hergestellt',
  };
}

/** Welche Katalyse liefern die Stoffe im Gefäß selbst? */
function catalysisFromSubstances(substances: Substance[]): Set<Catalysis> {
  const present = new Set<Catalysis>();
  for (const [kind, ids] of Object.entries(CATALYST_SUBSTANCES) as Array<[Catalysis, string[]]>) {
    if (substances.some((substance) => ids.includes(substance.id))) present.add(kind);
  }
  return present;
}

const SPECIFIC_CATALYSTS = new Set(['lindlar-katalysator', 'grubbs-katalysator']);

/** Vergleicht die Anforderungen einer Reaktion mit den eingestellten Bedingungen. */
export function missingRequirements(
  requires: Requirements,
  conditions: WorkbenchConditions,
  substances: Substance[],
  electroDetails?: string,
): { missing: string[]; catalysisMatched: boolean } {
  const missing: string[] = [];
  let catalysisMatched = false;

  if (requires.heat && conditions.temperature !== 'heiss') missing.push('Erhitzen nötig');
  if (requires.cold && conditions.temperature !== 'kalt') {
    missing.push('Kühlen nötig (Eisbad) – bei höherer Temperatur läuft die Reaktion anders oder unkontrolliert');
  }
  if (requires.light && !conditions.light) missing.push('Licht (UV) nötig – im Dunkeln startet die Reaktion nicht');
  if (requires.electro && !conditions.electrolysis) {
    missing.push(`Elektrolysezelle mit Stromquelle nötig${electroDetails ? `: ${electroDetails}` : ''}`);
  }
  if (requires.aqueous && !conditions.aqueous) missing.push('In Wasser lösen – als Feststoffe reagieren die Ionen nicht miteinander');
  if (requires.dry && conditions.aqueous) {
    missing.push('Wasserfrei arbeiten – Wasser zerstört die Reagenzien');
  }
  if (requires.solid && conditions.aqueous) {
    missing.push('Als trockenen Feststoff erhitzen – in Lösung zersetzt sich der Stoff nicht');
  }

  const present = catalysisFromSubstances(substances);
  if (requires.catalysis?.length) {
    const chosen = conditions.catalysis;
    const satisfied =
      (chosen !== 'keine' && requires.catalysis.includes(chosen)) ||
      requires.catalysis.some((kind) => present.has(kind));
    if (satisfied) {
      catalysisMatched = true;
    } else if (chosen !== 'keine') {
      missing.push(
        `Braucht ${describeCatalysis(requires.catalysis)} – mit ${CATALYSIS_LABELS[chosen]} läuft sie so nicht`,
      );
    } else {
      missing.push(`${describeCatalysis(requires.catalysis)} nötig`);
    }
  }

  if (requires.catalysts?.length) {
    const ids = substances.map((substance) => substance.id);
    const byToggle =
      conditions.catalysis !== 'keine' &&
      requires.catalysts.some(
        (id) => !SPECIFIC_CATALYSTS.has(id) && CATALYST_SUBSTANCES[conditions.catalysis as Catalysis].includes(id),
      );
    const bySubstance = requires.catalysts.some((id) => ids.includes(id));
    if (bySubstance || byToggle) {
      catalysisMatched = true;
    } else {
      const names = requires.catalysts
        .map((id) => SUBSTANCES.find((substance) => substance.id === id)?.name ?? id)
        .join(' oder ');
      missing.push(`${names} als Katalysator nötig`);
    }
  }

  return { missing, catalysisMatched };
}

function fromInorganic(
  reaction: InorganicReaction,
  conditions: WorkbenchConditions,
  substances: Substance[],
  extra: {
    productSmiles?: string[];
    productIds?: string[];
    ruleId?: string;
    rdkit?: MainModule | null;
    complexLink?: string;
    evidence?: Evidence;
    evidenceNote?: string;
    complex?: ComplexAnalysis;
  } = {},
): WorkbenchReaction {
  const evidence = extra.evidence ?? (TEXTBOOK_TYPES.has(reaction.type) ? 'lehrbuch' : 'vorhersage');
  const { missing, catalysisMatched } = missingRequirements(reaction.requires ?? {}, conditions, substances);

  let products: WorkbenchProduct[];
  if (extra.productSmiles?.length && extra.rdkit) {
    products = [
      ...extra.productSmiles.map((smiles) => describeProduct(extra.rdkit as MainModule, smiles)),
      ...reaction.products.slice(1).map(productFromFormula),
    ];
  } else if (extra.productIds?.length) {
    products = extra.productIds.map((id) => {
      const known = SUBSTANCES.find((substance) => substance.id === id);
      return { formula: known?.formula, name: known?.name, substanceId: known?.id, smiles: known?.smiles };
    });
  } else {
    products = reaction.products.map(productFromFormula);
  }

  return {
    id: reaction.id,
    kind: 'anorganisch',
    title: reaction.title,
    ruleId: extra.ruleId,
    reactionType: reaction.type,
    equation: reaction.equation,
    ionicEquation: reaction.ionicEquation,
    products,
    observation: reaction.observation,
    explanation: reaction.explanation,
    conditions: reaction.conditions,
    safetyLevel: reaction.safetyLevel,
    hazards: reaction.hazards,
    tags: reaction.tags,
    missing,
    catalysisMatched,
    complexLink: extra.complexLink,
    evidence,
    evidenceNote: extra.evidenceNote ?? (evidence === 'lehrbuch' ? TEXTBOOK_NOTE : RULE_NOTE),
    complex: extra.complex,
  };
}

/** Anorganische Reaktionstypen, die als einzelne Lehrbuchreaktionen hinterlegt sind. */
const TEXTBOOK_TYPES = new Set<string>([
  'Thermische Zersetzung',
  'Nichtmetall-Synthese',
  'Hydratbildung',
  'Katalytische Zersetzung',
  'Nachweisreaktion',
]);

/** Klassische Beispiele der Nachweisreaktionen – Fehling mit Glucose steht in jedem Schulbuch. */
const CLASSIC_PROBES = new Set([
  'glucose', 'fructose', 'galactose', 'maltose', 'lactose', 'saccharose', 'staerke',
  'formaldehyd', 'acetaldehyd', 'benzaldehyd', 'aceton', 'glycin', 'alanin',
]);

function specialEvidence(id: string): Evidence {
  const probe = id.match(/^(fehling|tollens|ninhydrin)-(.+)$/);
  if (probe) return CLASSIC_PROBES.has(probe[2]) ? 'lehrbuch' : 'vorhersage';
  return 'lehrbuch';
}

// ---------------------------------------------------------------------
// Organische Vorlagen
// ---------------------------------------------------------------------

const templateCache = new Map<string, string[]>();

/** Die Edukt-Templates einer Reaktionsvorschrift. */
function reactantTemplates(rule: ReactionRule): string[] {
  const cached = templateCache.get(rule.id);
  if (cached) return cached;
  const templates = (rule.smirks ?? '').split('>>')[0].split('.').filter(Boolean);
  templateCache.set(rule.id, templates);
  return templates;
}

const matchCache = new Map<string, boolean>();

function matchesTemplate(rdkit: MainModule, smiles: string, template: string): boolean {
  const key = `${template}|${smiles}`;
  const cached = matchCache.get(key);
  if (cached !== undefined) return cached;
  const result = matchSmarts(rdkit, smiles, template).length > 0;
  matchCache.set(key, result);
  return result;
}

/** Sind alle verbrauchten Reagenzien im Gefäß? */
function needsSatisfied(
  needs: string[][] | undefined,
  available: Substance[],
  conditions: WorkbenchConditions,
): boolean {
  if (!needs?.length) return true;
  const ids = new Set(available.map((substance) => substance.id));
  return needs.every((group) =>
    group.some((id) => ids.has(id) || (id === 'wasser' && conditions.aqueous)),
  );
}

function pickProductSet(rdkit: MainModule, productSets: string[][]): WorkbenchProduct[] {
  let best: WorkbenchProduct[] = [];
  let bestScore = -1;
  for (const set of productSets.slice(0, 6)) {
    if (!set.every((smiles) => isPublishableProduct(smiles, rdkit))) continue;
    const described = set.map((smiles) => describeProduct(rdkit, smiles));
    const score = described.filter((product) => product.name).length;
    if (score > bestScore) {
      bestScore = score;
      best = described;
    }
    if (score === described.length) break;
  }
  return best;
}

function organicReactions(
  rdkit: MainModule,
  substances: Substance[],
  conditions: WorkbenchConditions,
): WorkbenchReaction[] {
  const results: WorkbenchReaction[] = [];
  const structural = substances.filter((substance) => substance.smiles);

  for (const rule of REACTIONS) {
    if (!rule.smirks) continue;
    const spec = WORKBENCH_SPECS[rule.id] ?? {};
    const templates = reactantTemplates(rule);
    const slotCount = Math.max(1, templates.length);

    // Für jedes Template die passenden Stoffe im Gefäß bestimmen
    const candidates = templates.map((template) =>
      structural.filter((substance) => matchesTemplate(rdkit, substance.smiles as string, template)),
    );
    if (candidates.some((list) => !list.length)) continue;

    // Alle Zuordnungen der Stoffe zu den Templates
    const tuples: Substance[][] = [];
    if (slotCount === 1) {
      for (const substance of candidates[0]) tuples.push([substance]);
    } else {
      for (const first of candidates[0]) {
        for (const second of candidates[1]) {
          if (first === second && !spec.self) continue;
          tuples.push([first, second]);
        }
      }
    }

    for (const tuple of tuples) {
      const used = new Set(tuple);
      const rest = substances.filter((substance) => !used.has(substance));
      // Bei der Selbstreaktion darf der Stoff zugleich Edukt und «Rest» sein
      if (!needsSatisfied(spec.needs, rest, conditions)) continue;

      const productSets = runReaction(rdkit, rule.smirks, tuple.map((substance) => substance.smiles as string));
      if (!productSets.length) continue;
      const products = pickProductSet(rdkit, productSets);
      if (!products.length) continue;
      if (products.length === 1 && tuple.some((substance) => products[0].substanceId === substance.id)) continue;

      const electroDetails = rule.electro ? `${rule.electro.anode} als Anode, ${rule.electro.cathode} als Kathode` : undefined;
      const requires: Requirements = { ...spec, electro: spec.electro ?? Boolean(rule.electro) };
      const { missing, catalysisMatched } = missingRequirements(requires, conditions, substances, electroDetails);

      const substrateNames = Array.from(new Set(tuple.map((substance) => substance.name))).join(' und ');
      const mainProduct = products.find((product) => product.name) ?? products[0];

      results.push({
        id: `${rule.id}-${tuple.map((substance) => substance.id).join('-')}`,
        kind: 'organisch',
        title: `${rule.name}: ${substrateNames}`,
        ruleId: rule.id,
        reactionType: rule.reactionType,
        equation: rule.generalEquation,
        products,
        observation:
          spec.observation ??
          (mainProduct.name ? `Es entsteht ${mainProduct.name}.` : 'Es entsteht die unten gezeichnete Verbindung.'),
        explanation: rule.summary,
        conditions: [rule.conditions.temperature, rule.conditions.solvent].filter(Boolean).join(', '),
        safetyLevel: rule.safety.level,
        hazards: rule.safety.hazards,
        tags: rule.keywords.slice(0, 4),
        missing,
        catalysisMatched,
        evidence: 'vorhersage',
        evidenceNote: templateNote(rule.name),
      });
      break;
    }
  }

  return results;
}

// ---------------------------------------------------------------------
// Erklärungen, wenn nichts passiert
// ---------------------------------------------------------------------

function explainNoReaction(substances: Substance[], conditions: WorkbenchConditions): string[] {
  const hints: string[] = [];

  if (substances.length === 1) {
    hints.push(
      conditions.temperature === 'heiss'
        ? 'Dieser Stoff zersetzt sich beim Erhitzen nicht in einer hier hinterlegten Weise. Gib einen Reaktionspartner dazu.'
        : 'Ein einzelner Stoff reagiert nur, wenn er sich zersetzt oder mit sich selbst reagiert. Gib einen Reaktionspartner dazu, erhitze oder wähle eine Katalyse.',
    );
    return hints;
  }

  const categories = substances.map((substance) => substance.category);
  if (categories.every((category) => category === 'Salz')) {
    hints.push(
      'Alle Stoffe sind Salze, deren Ionen in Lösung bleiben. Ein Niederschlag entsteht nur, wenn eine neue Ionenkombination schwer löslich ist.',
    );
  }

  const hasAcid = substances.some((substance) => substance.category === 'Säure');
  const noble = substances.find((substance) => ['Cu', 'Ag', 'Au', 'Pt', 'Hg'].includes(substance.formula));
  if (hasAcid && noble) {
    hints.push(
      `${noble.name} ist edler als Wasserstoff (es steht in der Spannungsreihe darüber) – es löst sich in nichtoxidierenden Säuren nicht.`,
    );
  }

  const noble2 = substances.find((substance) => ['He', 'Ar'].includes(substance.formula));
  if (noble2) hints.push(`${noble2.name} ist ein Edelgas mit voll besetzter Elektronenschale und reagiert praktisch nicht.`);

  if (!hints.length) {
    hints.push(
      'Für diese Kombination ist keine Reaktion hinterlegt. Das heißt nicht zwingend, dass nichts passiert – die Datenbank deckt die gängigen Reaktionstypen ab, nicht jede denkbare Umsetzung.',
    );
    if (conditions.catalysis === 'keine' || conditions.temperature !== 'heiss') {
      hints.push('Probiere andere Bedingungen: erhitzen, Säure- oder Basenkatalyse, Licht oder Strom.');
    }
  }

  return hints;
}

// ---------------------------------------------------------------------
// Hauptfunktion
// ---------------------------------------------------------------------

/** Nur so viele Reaktionen mit fehlenden Bedingungen zeigen, dass es übersichtlich bleibt. */
const MAX_INCOMPLETE = 6;

export function mix(
  rdkit: MainModule | null,
  substances: Substance[],
  conditions: WorkbenchConditions = DEFAULT_CONDITIONS,
  documented: DocumentedReaction[] = [],
): MixResult {
  if (!substances.length) {
    return { outcome: 'keine-reaktion', reactions: [], hints: ['Wähle mindestens einen Stoff aus.'] };
  }

  const warning = mixtureWarning(substances.map((substance) => substance.id));
  if (warning) {
    return { outcome: 'gesperrt', reactions: [], blocked: warning.hazard, hints: [] };
  }

  const reactions: WorkbenchReaction[] = [];
  const reagentLike = substances.filter((substance) => substance.category !== 'Nachweisreagenz');

  // 1. Anorganische Regeln über alle Stoffpaare
  for (let i = 0; i < reagentLike.length; i++) {
    for (let j = i + 1; j < reagentLike.length; j++) {
      for (const reaction of reactPair(reagentLike[i], reagentLike[j])) {
        reactions.push(fromInorganic(reaction, conditions, substances));
      }
    }
  }

  // Zersetzungen einzelner Stoffe – nur beim Erhitzen, sonst stünde bei
  // jedem Salz «zersetzt sich, wenn man es erhitzt»
  if (conditions.temperature === 'heiss') {
    for (const substance of reagentLike) {
      for (const reaction of reactSingle(substance)) {
        reactions.push(fromInorganic(reaction, conditions, substances));
      }
    }
  }

  if (rdkit) {
    // 2. Säure-Base-Reaktionen organischer Stoffe
    for (const organic of reagentLike.filter((substance) => substance.smiles)) {
      for (const partner of reagentLike) {
        if (partner === organic) continue;
        for (const reaction of organicAcidBase(rdkit, organic, partner)) {
          reactions.push(
            fromInorganic(reaction, conditions, substances, {
              productSmiles: reaction.productSmiles,
              rdkit,
              evidence: 'vorhersage',
            }),
          );
        }
      }
    }
  }

  // 3. Nachweise, Sonderreaktionen, technische Verfahren
  for (const reaction of specialReactions(rdkit, substances)) {
    reactions.push(
      fromInorganic(reaction, conditions, substances, {
        productIds: reaction.productIds,
        ruleId: reaction.ruleId,
        complexLink: reaction.complexLink,
        evidence: specialEvidence(reaction.id),
      }),
    );
  }

  // Komplexbildung: jede Metallquelle mit jeder Ligandenquelle
  const complexes = complexChemistry(rdkit, reagentLike, conditions);
  for (const reaction of complexes.reactions) {
    const entry = fromInorganic({ ...reaction, id: reaction.id }, conditions, substances, {
      evidence: reaction.evidence,
      evidenceNote: reaction.evidenceNote,
      complex: reaction.complex,
      complexLink: reaction.builderLink,
    });
    entry.missing.push(...reaction.missing);
    reactions.push(entry);
  }

  // 4. Organische Vorlagen
  if (rdkit) reactions.push(...organicReactions(rdkit, reagentLike, conditions));

  // 5. Belegte Reaktionen: Vorhersagen bestätigen, fehlende ergänzen
  if (rdkit && documented.length) {
    reactions.push(...applyDocumented(rdkit, reactions, substances, conditions, documented));
  }

  // Doppelte entfernen (gleiche Gleichung oder gleicher Stoffumsatz)
  const seen = new Set<string>();
  const unique = reactions.filter((reaction) => {
    const key = reaction.kind === 'organisch' ? reaction.id : reaction.equation.replace(/\s+/g, '');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Vollständige Reaktionen zuerst, darunter die zur gewählten Katalyse passenden
  unique.sort(
    (a, b) =>
      a.missing.length - b.missing.length ||
      EVIDENCE_RANK[a.evidence] - EVIDENCE_RANK[b.evidence] ||
      Number(b.catalysisMatched) - Number(a.catalysisMatched),
  );

  // Negative Nachweise (Fehling, Tollens) sind keine Reaktion, aber eine Auskunft
  const negative = unique.filter((reaction) => reaction.tags.includes('negativ'));
  const positive = unique.filter((reaction) => !reaction.tags.includes('negativ'));
  const negativeHints = negative.map((reaction) =>
    reaction.missing.length
      ? `${reaction.title}: ${reaction.missing.join(' ')}`
      : `${reaction.title}: ${reaction.observation} ${reaction.explanation}`,
  );

  const complete = positive.filter((reaction) => !reaction.missing.length);
  const incomplete = positive.filter((reaction) => reaction.missing.length).slice(0, MAX_INCOMPLETE);
  const shown = [...complete, ...incomplete];

  const extraHints = [...negativeHints, ...complexes.hints];
  return {
    outcome: shown.length ? 'reaktion' : 'keine-reaktion',
    reactions: shown,
    hints: shown.length
      ? extraHints
      : extraHints.length
        ? [
            ...extraHints,
            ...explainNoReaction(substances, conditions).filter(
              (hint) => !hint.startsWith('Für diese Kombination') && !hint.startsWith('Probiere'),
            ),
          ]
        : explainNoReaction(substances, conditions),
  };
}

// ---------------------------------------------------------------------
// Belegte Reaktionen aus der Patentliteratur
// ---------------------------------------------------------------------

const EVIDENCE_RANK: Record<Evidence, number> = { belegt: 0, lehrbuch: 1, vorhersage: 2 };

/** Höchstens so viele belegte Reaktionen je Mischung – die häufigsten zuerst. */
const MAX_DOCUMENTED = 5;

/** Lösungsmittel zählen nicht als Reagenz, das eine Reaktion erst möglich macht. */
const SOLVENT_SMILES = [
  'O', 'CO', 'CCO', 'CC(C)O', 'CC(C)(C)O', 'CCCCO', 'C1CCOC1', 'CC1CCCO1', 'CCOCC', 'COC(C)(C)C', 'ClCCl',
  'ClC(Cl)Cl', 'ClC(Cl)(Cl)Cl', 'ClCCCl', 'CN(C)C=O', 'CC(=O)N(C)C', 'CS(C)=O', 'CC#N', 'Cc1ccccc1',
  'c1ccccc1', 'Cc1ccccc1C', 'CCOC(C)=O', 'CC(C)=O', 'CCC(C)=O', 'C1COCCO1', 'CCCCCC', 'CCCCCCC',
  'CCCCC', 'C1CCCCC1', 'COCCOC', 'CN1CCCC1=O', 'Clc1ccccc1', 'CCCCCCCC',
];

let solventKeys: Set<string> | null = null;
let keyIndex: Map<string, Substance> | null = null;

function solvents(rdkit: MainModule): Set<string> {
  if (!solventKeys) {
    solventKeys = new Set(
      SOLVENT_SMILES.map((smiles) => structureKey(rdkit, smiles)).filter((key): key is string => Boolean(key)),
    );
  }
  return solventKeys;
}

/** Strukturschlüssel → Stoff der Datenbank (nur ganze Stoffe, keine Ionen). */
function substanceByKey(rdkit: MainModule): Map<string, Substance> {
  if (!keyIndex) {
    keyIndex = new Map();
    for (const substance of SUBSTANCES) {
      for (const structure of structuresOf(substance)) {
        const key = structureKey(rdkit, structure);
        if (key && !keyIndex.has(key)) keyIndex.set(key, substance);
      }
    }
  }
  return keyIndex;
}

/** Stoff der Datenbank zu einer Struktur, falls vorhanden. */
export function knownSubstance(rdkit: MainModule, key: string): Substance | undefined {
  return substanceByKey(rdkit).get(key);
}

let ionIndex: Map<string, Ion> | null = null;

function ionByKey(rdkit: MainModule, key: string): Ion | undefined {
  if (!ionIndex) {
    ionIndex = new Map();
    for (const { ion, smiles } of ionStructures()) {
      const ionKey = structureKey(rdkit, smiles);
      if (ionKey && !ionIndex.has(ionKey)) ionIndex.set(ionKey, ion);
    }
  }
  return ionIndex.get(key);
}

/** Anzeigename einer Struktur: Name aus der Datenbank, Ionenname, sonst Summenformel. */
export function structureName(rdkit: MainModule, key: string): string {
  return knownSubstance(rdkit, key)?.name ?? ionByKey(rdkit, key)?.name ?? molecularFormula(rdkit, key) ?? key;
}

/**
 * Hilfsstoffe lesbar machen: Ionen werden wieder zu Salzen zusammengesetzt
 * (K⁺ und CO₃²⁻ → Kaliumcarbonat), unbekannte Stoffe nur gezählt.
 */
export function describeAgents(rdkit: MainModule, keys: string[], skipSolvents = false): string[] {
  const names: string[] = [];
  const cations: Ion[] = [];
  const anions: Ion[] = [];
  let unnamed = 0;
  for (const key of keys) {
    if (skipSolvents && solvents(rdkit).has(key)) continue;
    const ion = ionByKey(rdkit, key);
    if (ion && !knownSubstance(rdkit, key)) {
      (ion.charge > 0 ? cations : anions).push(ion);
      continue;
    }
    const known = knownSubstance(rdkit, key);
    if (known) names.push(known.name);
    else unnamed++;
  }
  const usedCations = new Set<Ion>();
  for (const anion of anions) {
    const salt = cations
      .map((cation) => ({ cation, substance: SUBSTANCES.find((entry) => entry.formula === saltFormula(cation, anion)) }))
      .find((entry) => entry.substance);
    if (salt?.substance) {
      names.push(salt.substance.name);
      usedCations.add(salt.cation);
    } else {
      names.push(anion.name);
    }
  }
  for (const cation of cations) if (!usedCations.has(cation) && !anions.length) names.push(cation.name);
  const unique = [...new Set(names)];
  if (unnamed) unique.push(unnamed === 1 ? 'ein weiterer Stoff' : `${unnamed} weitere Stoffe`);
  return unique;
}

/** Strukturschlüssel aller Stoffe im Gefäß (ohne das Wasser der Lösung). */
export function vesselKeys(rdkit: MainModule, substances: Substance[]): string[] {
  const keys = new Set<string>();
  for (const substance of substances) {
    for (const structure of structuresOf(substance)) {
      for (const key of substanceKeys(rdkit, structure)) keys.add(key);
    }
  }
  return [...keys];
}

function presentKeys(rdkit: MainModule, substances: Substance[], conditions: WorkbenchConditions): Set<string> {
  const keys = new Set(vesselKeys(rdkit, substances));
  if (conditions.aqueous) {
    const water = structureKey(rdkit, 'O');
    if (water) keys.add(water);
  }
  return keys;
}

/**
 * Reicht das Gefäß für die belegte Reaktion?
 * Alle Edukte müssen da sein. Hat die Reaktion nur ein Edukt, braucht es
 * außerdem eines der Reagenzien aus der Vorschrift – sonst wäre jede
 * Umsetzung eines Stoffes «vollständig», sobald er allein im Gefäß steht.
 */
function reproducible(rdkit: MainModule, reaction: DocumentedReaction, present: Set<string>, own: Set<string>): boolean {
  if (!reaction.reactants.every((reactant) => present.has(reactant))) return false;
  if (!reaction.reactants.some((reactant) => own.has(reactant))) return false;
  if (reaction.reactants.length > 1) return true;
  const reagents = reaction.agents.filter((agent) => !solvents(rdkit).has(agent));
  return reagents.some((agent) => present.has(agent));
}

function fromDocumented(rdkit: MainModule, reaction: DocumentedReaction): WorkbenchReaction {
  const product = describeProduct(rdkit, reaction.product);
  const productName = product.name ?? product.formula ?? reaction.product;
  const reactantNames = reaction.reactants.map((key) => structureName(rdkit, key));
  const agentNames = describeAgents(rdkit, reaction.agents);

  return {
    id: `beleg-${reaction.id}`,
    kind: 'organisch',
    title: `${reactantNames.join(' und ')} → ${productName}`,
    reactionType: 'Belegte Reaktion aus der Patentliteratur',
    equation: `${reactantNames.join(' + ')} → ${productName}`,
    products: [product],
    observation:
      'Der Datensatz enthält Edukte, Hilfsstoffe und Produkt. Beobachtungen, Temperatur und Reaktionszeit stehen in der Patentschrift selbst.',
    explanation: documentedNote(reaction),
    conditions: agentNames.length
      ? `Laut Vorschrift eingesetzt: ${agentNames.join(', ')}`
      : 'Im Datensatz sind keine Lösungsmittel oder Hilfsstoffe angegeben.',
    safetyLevel: 'Fortgeschritten',
    hazards: [
      'Patentvorschriften setzen ein ausgestattetes Labor voraus. Die Gefahren jedes beteiligten Stoffes im Sicherheitsdatenblatt nachlesen.',
    ],
    tags: ['belegt'],
    missing: [],
    catalysisMatched: false,
    evidence: 'belegt',
    evidenceNote: documentedNote(reaction),
    documented: { id: reaction.id, count: reaction.count, source: reaction.source },
  };
}

/**
 * Gleicht die Werkbank-Ergebnisse mit den belegten Reaktionen ab.
 * Bestätigt ein Beleg eine Vorhersage, wird diese als belegt markiert;
 * übrige vollständig vorhandene Belege kommen als eigene Reaktionen hinzu.
 */
function applyDocumented(
  rdkit: MainModule,
  predicted: WorkbenchReaction[],
  substances: Substance[],
  conditions: WorkbenchConditions,
  documented: DocumentedReaction[],
): WorkbenchReaction[] {
  const present = presentKeys(rdkit, substances, conditions);
  const own = new Set(vesselKeys(rdkit, substances));
  const matches = completeReactions(documented, present).filter(
    (reaction) => reproducible(rdkit, reaction, present, own) && isPublishableProduct(reaction.product, rdkit),
  );
  if (!matches.length) return [];

  const used = new Set<number>();
  for (const reaction of predicted) {
    if (reaction.kind !== 'organisch') continue;
    const productKeys = reaction.products
      .map((product) => (product.smiles ? structureKey(rdkit, product.smiles) : null))
      .filter(Boolean);
    const proof = matches.find((match) => !used.has(match.id) && productKeys.includes(match.product));
    if (!proof) continue;
    used.add(proof.id);
    reaction.evidence = 'belegt';
    reaction.evidenceNote = `${documentedNote(proof)} Mechanismus und Bedingungen stammen aus der Reaktionsvorlage.`;
    reaction.documented = { id: proof.id, count: proof.count, source: proof.source };
  }

  return matches
    .filter((match) => !used.has(match.id))
    .slice(0, MAX_DOCUMENTED)
    .map((match) => fromDocumented(rdkit, match));
}

export interface DocumentedSuggestion {
  reaction: DocumentedReaction;
  /** Stoff im Gefäß, von dem die Reaktion ausgeht */
  from: string;
  productName: string;
  /** fehlende Edukte, als Stoffe zum Hinzufügen */
  partners: Substance[];
  /** Reagenzien laut Vorschrift (ohne Lösungsmittel) */
  reagents: string[];
}

/**
 * Belegte Reaktionen der Stoffe im Gefäß, für die noch ein Partner fehlt.
 * Bevorzugt werden solche, deren Partner in der Stoffdatenbank stehen.
 */
export function documentedSuggestions(
  rdkit: MainModule,
  substances: Substance[],
  conditions: WorkbenchConditions,
  documented: DocumentedReaction[],
  limit = 8,
): DocumentedSuggestion[] {
  const present = presentKeys(rdkit, substances, conditions);
  const own = new Set(vesselKeys(rdkit, substances));
  const byKey = new Map<string, Substance>();
  for (const substance of substances) {
    for (const key of vesselKeys(rdkit, [substance])) byKey.set(key, substance);
  }

  return documented
    .filter((reaction) => !reproducible(rdkit, reaction, present, own))
    .map((reaction) => {
      const missing = reaction.reactants.filter((reactant) => !present.has(reactant));
      const partners = missing
        .map(
          (key) =>
            knownSubstance(rdkit, key) ??
            productAsSubstance({ smiles: key, formula: molecularFormula(rdkit, key) ?? undefined }),
        )
        .filter((entry): entry is Substance => Boolean(entry));
      const from = reaction.reactants.find((reactant) => byKey.has(reactant));
      const reagents = describeAgents(rdkit, reaction.agents, true);
      const known = missing.filter((key) => knownSubstance(rdkit, key)).length;
      return {
        reaction,
        from: from ? (byKey.get(from) as Substance).name : '',
        productName: structureName(rdkit, reaction.product),
        partners,
        reagents,
        score: (missing.length && known === missing.length ? 1000 : 0) + Math.min(reaction.count, 50) * 10 - missing.length,
      };
    })
    .filter(
      (entry) =>
        entry.from &&
        entry.partners.length === entry.reaction.reactants.filter((reactant) => !present.has(reactant)).length &&
        (entry.partners.length > 0 || entry.reagents.length > 0),
    )
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ score: _score, ...entry }) => entry);
}
