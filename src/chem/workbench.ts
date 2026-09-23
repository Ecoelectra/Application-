/**
 * Werkbank: Was passiert, wenn man diese Stoffe zusammengibt?
 *
 * Die Engine prüft der Reihe nach:
 *  1. Ist die Mischung akut gefährlich? Dann wird nichts simuliert.
 *  2. Greift eine anorganische Regel (Ionenmodell, Spannungsreihe)?
 *  3. Passt eine organische Reaktionsvorschrift auf die eingesetzten Stoffe?
 *  4. Sonst: erklären, warum nichts passiert.
 *
 * Anders als die Vorschlagsliste auf der Stoffseite arbeitet die Werkbank mit
 * den tatsächlich eingesetzten Stoffen – nicht mit Standardpartnern.
 */
import type { MainModule } from '@rdkit/rdkit';
import { canonicalSmiles, molecularFormula, runReaction } from './rdkit';
import { isPublishableProduct, mixtureWarning } from './safety';
import { reactPair, reactSingle, type InorganicReaction } from './inorganicRules';
import { REACTIONS } from '../data/reactions';
import { SUBSTANCES } from '../data/substances';
import type { ReactionRule, SafetyLevel, Substance } from '../data/types';

export interface WorkbenchConditions {
  /** Erhitzen (Brenner, Rückfluss) */
  heat: boolean;
  /** Katalysator oder Hilfsbase zugeben */
  catalyst: boolean;
  /** In Wasser gelöst arbeiten */
  aqueous: boolean;
}

export const DEFAULT_CONDITIONS: WorkbenchConditions = {
  heat: false,
  catalyst: false,
  aqueous: true,
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

/** Baut den Index, der von einer Struktur auf den Stoffnamen zurückführt. */
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

/** Ergänzt ein Produkt um Formel und – falls bekannt – den Stoffnamen. */
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

/**
 * Wählt aus mehreren möglichen Produktsätzen den aussagekräftigsten aus.
 *
 * Eine Vorschrift kann an mehreren Stellen eines Moleküls greifen. Bevorzugt
 * wird der Satz, dessen Produkte in der Stoffdatenbank bekannt sind – das ist
 * in aller Regel das Produkt, das man tatsächlich meint.
 */
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

/** Normalisiert Stoffnamen für den Vergleich mit Reagenzangaben. */
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\(.*?\)/g, '')
    .replace(/[^a-zäöüß0-9]/g, '');
}

/**
 * Stellt der Stoff das Reagenz der Reaktionsvorschrift dar?
 * Verglichen werden Name, Synonyme und Summenformel.
 */
function providesReagent(substance: Substance, rule: ReactionRule): string | null {
  const names = [substance.name, ...substance.synonyms].map(normalizeName);
  for (const reagent of rule.reagents) {
    const reagentName = normalizeName(reagent.name);
    if (reagentName.length < 4) continue;
    if (names.some((name) => name === reagentName || name.includes(reagentName) || reagentName.includes(name))) {
      return reagent.name;
    }
    if (reagent.formula && substance.formula === reagent.formula) return reagent.name;
  }
  return null;
}

/** Fasst die Bedingungen einer Vorschrift zu Anforderungen zusammen. */
function requirementsOf(rule: ReactionRule, conditions: WorkbenchConditions): string[] {
  const missing: string[] = [];
  const temperature = rule.conditions.temperature.toLowerCase();
  const needsHeat =
    temperature.includes('rückfluss') ||
    temperature.includes('sieden') ||
    /(\d{2,3})\s*°c/.test(temperature) &&
      Number(temperature.match(/(\d{2,3})\s*°c/)?.[1] ?? 0) >= 60;

  if (needsHeat && !conditions.heat) {
    missing.push(`Erhitzen nötig (${rule.conditions.temperature})`);
  }

  const catalysts = rule.reagents.filter(
    (reagent) => reagent.role === 'Katalysator' || reagent.role === 'Base' || reagent.role === 'Säure',
  );
  if (catalysts.length && !conditions.catalyst) {
    missing.push(`${catalysts.map((entry) => entry.name).join(' oder ')} als ${catalysts[0].role} nötig`);
  }

  if (rule.conditions.atmosphere && /stickstoff|argon|schutzgas/i.test(rule.conditions.atmosphere)) {
    missing.push(`Schutzgas nötig (${rule.conditions.atmosphere})`);
  }

  // Elektrosynthesen laufen nicht durch bloßes Zusammengeben der Stoffe
  if (rule.electro) {
    missing.push(
      `Elektrolysezelle nötig: ${rule.electro.anode} als Anode, ${rule.electro.cathode} als Kathode`,
    );
  }

  return missing;
}

function toWorkbenchReaction(reaction: InorganicReaction): WorkbenchReaction {
  return {
    id: reaction.id,
    kind: 'anorganisch',
    title: reaction.title,
    reactionType: reaction.type,
    equation: reaction.equation,
    ionicEquation: reaction.ionicEquation,
    products: reaction.products.map((formula) => {
      const known = SUBSTANCES.find((substance) => substance.formula === formula);
      return { formula, name: known?.name, substanceId: known?.id, smiles: known?.smiles };
    }),
    observation: reaction.observation,
    explanation: reaction.explanation,
    conditions: reaction.conditions,
    safetyLevel: reaction.safetyLevel,
    hazards: reaction.hazards,
    tags: reaction.tags,
    missing: [],
  };
}

/**
 * Sucht eine organische Reaktion, die zu den eingesetzten Stoffen passt.
 *
 * Zwei Fälle: Beide Stoffe sind Edukte der Vorschrift (etwa Säure und Alkohol
 * bei der Veresterung), oder ein Stoff ist das Substrat und der andere liefert
 * das nötige Reagenz (etwa Alkohol und Kaliumpermanganat).
 */
function organicReactions(
  rdkit: MainModule,
  substances: Substance[],
  conditions: WorkbenchConditions,
): WorkbenchReaction[] {
  const results: WorkbenchReaction[] = [];
  const withStructure = substances.filter((substance) => substance.smiles);

  for (const rule of REACTIONS) {
    if (!rule.smirks) continue;
    const defaults = rule.reactantDefaults ?? [];
    const slots = rule.substrateSlots ?? [0];

    for (const substrate of withStructure) {
      for (const slot of slots) {
        const reactants = [...defaults];
        if (slot >= reactants.length) continue;
        reactants[slot] = substrate.smiles as string;

        // Zweiter eingesetzter Stoff: entweder zweites Edukt oder Reagenz
        const partners = substances.filter((entry) => entry !== substrate);
        let partnerNote: string | null = null;
        let usedPartner: Substance | null = null;

        if (defaults.length > 1) {
          const otherSlot = slot === 0 ? 1 : 0;
          const structural = partners.find((entry) => entry.smiles);
          if (structural) {
            reactants[otherSlot] = structural.smiles as string;
            usedPartner = structural;
          }
        }

        if (!usedPartner) {
          for (const partner of partners) {
            const reagent = providesReagent(partner, rule);
            if (reagent) {
              partnerNote = reagent;
              usedPartner = partner;
              break;
            }
          }
        }

        // Ohne passenden Partner nur Regeln mit einem einzigen Edukt zulassen
        if (!usedPartner && substances.length > 1 && defaults.length > 1) continue;
        if (!usedPartner && substances.length > 1) {
          const anyReagent = partners.some((partner) => providesReagent(partner, rule));
          if (!anyReagent) continue;
        }

        const productSets = runReaction(rdkit, rule.smirks, reactants);
        if (!productSets.length) continue;

        const products = pickProductSet(rdkit, productSets);
        if (!products.length) continue;

        const missing = requirementsOf(rule, conditions);
        if (partnerNote) {
          // Das Reagenz ist vorhanden – diese Anforderung entfällt
          const normalized = normalizeName(partnerNote);
          for (let i = missing.length - 1; i >= 0; i--) {
            if (normalizeName(missing[i]).includes(normalized)) missing.splice(i, 1);
          }
        }

        results.push({
          id: `${rule.id}-${substrate.id}`,
          kind: 'organisch',
          title: `${rule.name} an ${substrate.name}`,
          ruleId: rule.id,
          reactionType: rule.reactionType,
          equation: rule.generalEquation,
          products,
          observation:
            products[0].name
              ? `Es entsteht ${products[0].name}.`
              : 'Es entsteht die unten gezeichnete Verbindung.',
          explanation: rule.summary,
          conditions: [rule.conditions.temperature, rule.conditions.solvent].filter(Boolean).join(', '),
          safetyLevel: rule.safety.level,
          hazards: rule.safety.hazards,
          tags: rule.keywords.slice(0, 4),
          missing,
        });
        break;
      }
    }
  }

  // Doppelte Treffer derselben Vorschrift entfernen
  const seen = new Set<string>();
  return results.filter((reaction) => {
    const key = `${reaction.ruleId}-${reaction.products.map((p) => p.smiles).join('.')}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** Erklärt, warum nichts passiert. */
function explainNoReaction(substances: Substance[]): string[] {
  const hints: string[] = [];

  if (substances.length === 1) {
    hints.push('Ein einzelner Stoff reagiert nur, wenn er sich zersetzt. Gib einen Reaktionspartner dazu.');
    return hints;
  }

  const categories = substances.map((substance) => substance.category);
  if (categories.every((category) => category === 'Salz')) {
    hints.push(
      'Beide Stoffe sind Salze, deren Ionen alle in Lösung bleiben. Ein Niederschlag entsteht nur, wenn eine der neuen Ionenkombinationen schwer löslich ist.',
    );
  }

  const hasAcid = substances.some((substance) => substance.category === 'Säure');
  const hasMetal = substances.some((substance) => substance.category === 'Element');
  if (hasAcid && hasMetal) {
    hints.push(
      'Das Metall steht in der Spannungsreihe über dem Wasserstoff und ist damit edler – es löst sich in dieser Säure nicht.',
    );
  }

  if (!hints.length) {
    hints.push(
      'Für diese Kombination ist keine Reaktion hinterlegt. Das heißt nicht zwingend, dass nichts passiert – die Datenbank deckt die gängigen Reaktionstypen ab, nicht jede denkbare Umsetzung.',
    );
    hints.push('Probiere andere Bedingungen: Erhitzen oder einen Katalysator zugeben.');
  }

  return hints;
}

/** Führt die Stoffe in der Werkbank zusammen. */
export function mix(
  rdkit: MainModule | null,
  substances: Substance[],
  conditions: WorkbenchConditions = DEFAULT_CONDITIONS,
): MixResult {
  if (!substances.length) {
    return { outcome: 'keine-reaktion', reactions: [], hints: ['Wähle mindestens einen Stoff aus.'] };
  }

  const warning = mixtureWarning(substances.map((substance) => substance.id));
  if (warning) {
    return { outcome: 'gesperrt', reactions: [], blocked: warning.hazard, hints: [] };
  }

  const reactions: WorkbenchReaction[] = [];

  // Anorganische Regeln über alle Stoffpaare
  for (let i = 0; i < substances.length; i++) {
    for (let j = i + 1; j < substances.length; j++) {
      reactions.push(...reactPair(substances[i], substances[j]).map(toWorkbenchReaction));
    }
  }

  // Zersetzungen einzelner Stoffe – nur beim Erhitzen
  if (conditions.heat) {
    for (const substance of substances) {
      reactions.push(...reactSingle(substance).map(toWorkbenchReaction));
    }
  }

  if (rdkit) {
    reactions.push(...organicReactions(rdkit, substances, conditions));
  }

  const unique = reactions.filter(
    (reaction, index) => reactions.findIndex((entry) => entry.equation === reaction.equation) === index,
  );

  // Reaktionen, die ohne Zusatzbedingungen laufen, zuerst
  unique.sort((a, b) => a.missing.length - b.missing.length);

  return {
    outcome: unique.length ? 'reaktion' : 'keine-reaktion',
    reactions: unique,
    hints: unique.length ? [] : explainNoReaction(substances),
  };
}
