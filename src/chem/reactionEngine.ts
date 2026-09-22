/**
 * Reaktions-Engine.
 *
 * Analysiert einen eingegebenen Stoff, erkennt seine funktionellen Gruppen und
 * schlägt daraus passende Reaktionen vor. Wo eine Reaktionsvorschrift als
 * Reaktions-SMARTS hinterlegt ist, werden die Produkte mit RDKit tatsächlich
 * berechnet – nicht nur beschrieben.
 */
import type { MainModule } from '@rdkit/rdkit';
import { matchSmarts, runReaction, type SubstructureMatch } from './rdkit';
import { parseFormula, toHillFormula } from './formula';
import { assessSubstance, type SafetyAssessment } from './safety';
import { FUNCTIONAL_GROUPS } from '../data/functionalGroups';
import { REACTIONS } from '../data/reactions';
import type { FunctionalGroup, ReactionRule } from '../data/types';

export interface DetectedGroup {
  group: FunctionalGroup;
  matches: SubstructureMatch[];
  /** alle getroffenen Atomindizes, für die Hervorhebung in der Struktur */
  atomIndices: number[];
}

export interface ReactionSuggestion {
  rule: ReactionRule;
  /** Rangwert, höher bedeutet besser passend */
  score: number;
  /** IDs der funktionellen Gruppen, über die die Reaktion greift */
  matchedGroups: string[];
  /** berechnete Produktsätze als SMILES */
  productSets: string[][];
  /** Position, die der eingegebene Stoff in der Reaktionsgleichung einnimmt */
  slot: number;
  /** die übrigen Edukte, mit denen gerechnet wurde */
  coReactants: string[];
  reason: string;
}

export interface SubstanceInput {
  name?: string;
  smiles?: string;
  formula?: string;
}

export interface AnalysisResult {
  groups: DetectedGroup[];
  suggestions: ReactionSuggestion[];
  safety: SafetyAssessment;
}

/** Findet alle funktionellen Gruppen im Molekül. */
export function detectFunctionalGroups(rdkit: MainModule, smiles: string): DetectedGroup[] {
  const detected: DetectedGroup[] = [];

  for (const group of FUNCTIONAL_GROUPS) {
    const matches = matchSmarts(rdkit, smiles, group.smarts);
    if (!matches.length) continue;
    const atomIndices = Array.from(new Set(matches.flatMap((match) => match.atoms)));
    detected.push({ group, matches, atomIndices });
  }

  return detected;
}

/** Wendet eine Reaktionsvorschrift auf ein Substrat an und liefert die Produkte. */
export function applyRule(
  rdkit: MainModule,
  rule: ReactionRule,
  substrateSmiles: string,
  slot = 0,
): { productSets: string[][]; coReactants: string[] } {
  if (!rule.smirks) return { productSets: [], coReactants: [] };

  const reactants = [...(rule.reactantDefaults ?? [substrateSmiles])];
  if (slot < reactants.length) reactants[slot] = substrateSmiles;
  else reactants.push(substrateSmiles);

  const coReactants = reactants.filter((_, index) => index !== slot);
  return { productSets: runReaction(rdkit, rule.smirks, reactants), coReactants };
}

/** Normalisiert eine Summenformel für den Vergleich (Hill-Notation). */
function normalizedFormula(formula: string): string | null {
  try {
    return toHillFormula(parseFormula(formula).counts);
  } catch {
    return null;
  }
}

function scoreSuggestion(
  rule: ReactionRule,
  matchedGroups: string[],
  hasProducts: boolean,
): { score: number; reason: string } {
  let score = 40;
  const reasons: string[] = [];

  if (matchedGroups.length) {
    // Spezifische Regeln (wenige, klar umrissene Gruppen) ranken höher als
    // solche, die auf sehr allgemeine Muster wie "Aromat" ansprechen.
    const specificity = 1 / Math.max(1, rule.functionalGroups.length);
    score += 25 * matchedGroups.length * (0.5 + specificity);
    reasons.push(
      matchedGroups.length === 1
        ? 'passende funktionelle Gruppe erkannt'
        : `${matchedGroups.length} passende funktionelle Gruppen erkannt`,
    );
  }

  if (hasProducts) {
    score += 30;
    reasons.push('Produkt wurde aus der Struktur berechnet');
  }

  if (rule.functionalGroups.includes('aromat') && matchedGroups.length === 1 && matchedGroups[0] === 'aromat') {
    score -= 15;
    reasons.push('greift nur über den Aromaten allgemein');
  }

  if (rule.scale.includes('Schulversuch')) {
    score += 5;
    reasons.push('als Schulversuch geeignet');
  }

  return { score: Math.round(score), reason: reasons.join(', ') };
}

/**
 * Schlägt Reaktionen für einen Stoff vor.
 * Für Moleküle mit SMILES wird strukturbasiert gesucht, für anorganische Stoffe
 * über die Summenformel.
 */
export function suggestReactions(
  rdkit: MainModule | null,
  input: SubstanceInput,
  options: { limit?: number; computeProducts?: boolean } = {},
): ReactionSuggestion[] {
  const { limit = 40, computeProducts = true } = options;
  const suggestions: ReactionSuggestion[] = [];

  const detected = rdkit && input.smiles ? detectFunctionalGroups(rdkit, input.smiles) : [];
  const detectedIds = new Set(detected.map((entry) => entry.group.id));
  const inputFormula = input.formula ? normalizedFormula(input.formula) : null;

  for (const rule of REACTIONS) {
    const matchedGroups = rule.functionalGroups.filter((id) => detectedIds.has(id));

    // 1. Strukturbasierte Zuordnung über Reaktions-SMARTS
    let productSets: string[][] = [];
    let coReactants: string[] = [];
    let slot = 0;
    let structureMatch = false;

    if (rdkit && input.smiles && rule.smirks) {
      const slots = rule.substrateSlots ?? [0];
      for (const candidate of slots) {
        const result = applyRule(rdkit, rule, input.smiles, candidate);
        if (result.productSets.length) {
          structureMatch = true;
          slot = candidate;
          coReactants = result.coReactants;
          productSets = computeProducts ? result.productSets.slice(0, 4) : [];
          break;
        }
      }
    }

    // 2. Zusätzliche Substratmuster (für Regeln ohne Reaktions-SMARTS)
    if (!structureMatch && rdkit && input.smiles && rule.substrateSmarts?.length) {
      structureMatch = rule.substrateSmarts.some(
        (smarts) => matchSmarts(rdkit, input.smiles as string, smarts).length > 0,
      );
    }

    // 3. Anorganische Verfahren über die Summenformel
    let formulaMatch = false;
    if (rule.fixedEquation && inputFormula) {
      formulaMatch = rule.fixedEquation.reactants.some(
        (reactant) => normalizedFormula(reactant) === inputFormula,
      );
    }

    if (!structureMatch && !formulaMatch && !matchedGroups.length) continue;
    // Regeln mit Reaktions-SMARTS, die strukturell nicht greifen, werden nicht
    // vorgeschlagen – sonst entstünden chemisch falsche Empfehlungen.
    if (rule.smirks && !structureMatch) continue;

    const { score, reason } = scoreSuggestion(rule, matchedGroups, productSets.length > 0);
    const finalScore = formulaMatch ? score + 40 : score;

    suggestions.push({
      rule,
      score: finalScore,
      matchedGroups,
      productSets,
      slot,
      coReactants,
      reason: formulaMatch ? `${reason || 'Stoff ist Edukt des Verfahrens'}`.trim() : reason,
    });
  }

  return suggestions.sort((a, b) => b.score - a.score).slice(0, limit);
}

/** Komplettanalyse: funktionelle Gruppen, Vorschläge und Sicherheitsbewertung. */
export function analyzeSubstance(
  rdkit: MainModule | null,
  input: SubstanceInput,
  options: { limit?: number } = {},
): AnalysisResult {
  const safety = assessSubstance(input.name, input.smiles, rdkit);
  const groups = rdkit && input.smiles ? detectFunctionalGroups(rdkit, input.smiles) : [];

  if (safety.restricted) {
    return { groups, suggestions: [], safety };
  }

  return {
    groups,
    suggestions: suggestReactions(rdkit, input, options),
    safety,
  };
}

/** Volltextsuche über die Reaktionsdatenbank. */
export function searchReactions(
  query: string,
  filters: {
    categories?: string[];
    groups?: string[];
    scales?: string[];
  } = {},
): ReactionRule[] {
  const needle = query.trim().toLowerCase();
  const { categories, groups, scales } = filters;

  const matchesFilters = (rule: ReactionRule): boolean => {
    if (categories?.length && !categories.includes(rule.category)) return false;
    if (groups?.length && !rule.functionalGroups.some((id) => groups.includes(id))) return false;
    if (scales?.length && !rule.scale.some((entry) => scales.includes(entry))) return false;
    return true;
  };

  const scored = REACTIONS.filter(matchesFilters)
    .map((rule) => {
      if (!needle) return { rule, score: 1 };

      const haystacks: Array<[string, number]> = [
        [rule.name.toLowerCase(), 100],
        [(rule.aliases ?? []).join(' ').toLowerCase(), 80],
        [rule.reactionType.toLowerCase(), 60],
        [rule.keywords.join(' ').toLowerCase(), 55],
        [rule.summary.toLowerCase(), 40],
        [rule.generalEquation.toLowerCase(), 35],
        [rule.reagents.map((reagent) => reagent.name).join(' ').toLowerCase(), 30],
        [rule.mechanism.type.toLowerCase(), 25],
        [rule.mechanism.summary.toLowerCase(), 15],
      ];

      let score = 0;
      for (const [text, weight] of haystacks) {
        if (!text) continue;
        if (text === needle) score = Math.max(score, weight + 20);
        else if (text.startsWith(needle)) score = Math.max(score, weight + 10);
        else if (text.includes(needle)) score = Math.max(score, weight);
      }
      return { rule, score };
    })
    .filter((entry) => entry.score > 0);

  return scored
    .sort((a, b) => b.score - a.score || a.rule.name.localeCompare(b.rule.name))
    .map((entry) => entry.rule);
}
