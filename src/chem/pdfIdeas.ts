/**
 * Ideen aus einer Stoffliste: Welche spannenden Reaktionen und Synthesen gehen
 * mit den Stoffen, die in einem Dokument (etwa einer Chemikalienliste) stehen?
 *
 *  - Reaktionen: Jedes Stoffpaar kommt wie in der Werkbank ins Gefäß (Regeln,
 *    Belege, Reaktions-KI). Vollständige Reaktionen zählen am meisten; solche,
 *    denen nur Wärme oder ein Katalysator fehlt, kommen mit diesem Hinweis.
 *    «Spannend» heißt: sichtbare Beobachtung (Farbe, Gas, Niederschlag, Licht),
 *    gut belegt, als Schulversuch machbar.
 *  - Synthesen: Einträge des Synthesekatalogs, deren Edukte alle (oder bis auf
 *    einen) in der Liste stehen.
 *
 * Gefährliche Mischungen simuliert die Werkbank nicht; sie tauchen hier nie auf.
 */
import type { MainModule } from '@rdkit/rdkit';
import type { ReactionModel } from './ai/model';
import { DEFAULT_CONDITIONS, mix, type WorkbenchConditions, type WorkbenchReaction } from './workbench';
import type { Synthesis } from '../data/catalog';
import type { Substance } from '../data/types';

export interface ReactionIdea {
  key: string;
  substances: Substance[];
  reaction: WorkbenchReaction;
  score: number;
  /** was man zusätzlich braucht (Wärme, Katalysator …); leer, wenn es sofort läuft */
  needs: string[];
  /** warum die Reaktion spannend ist */
  highlights: string[];
}

export interface SynthesisIdea {
  synthesis: Synthesis;
  /** Edukte, die nicht in der Liste stehen */
  missing: string[];
  score: number;
}

/** Höchstens so viele Stoffe werden paarweise gemischt (die häufigsten) */
export const MAX_IDEA_SUBSTANCES = 24;

const HIGHLIGHTS: Array<[RegExp, string]> = [
  [/niederschlag|fällt .*aus|trübung|trübt/i, 'Niederschlag'],
  [/farb|färbt|blau|rot|grün|gelb|violett|orange|braun|schwarz|entfärb/i, 'Farbe'],
  [/gas|bläschen|schäum|sprudel|zisch/i, 'Gas'],
  [/leucht|flamme|glüh|funken|blitz|licht/i, 'Licht und Feuer'],
  [/kristall/i, 'Kristalle'],
  [/riecht|duft|geruch/i, 'Geruch'],
  [/erwärmt sich|wird warm|wird heiß|exotherm/i, 'Wärme'],
  [/kühlt ab|wird kalt|endotherm/i, 'Kälte'],
];

const EVIDENCE_SCORE: Record<WorkbenchReaction['evidence'], number> = { belegt: 3, lehrbuch: 4, ki: 2, vorhersage: 0 };
const LEVEL_SCORE: Record<string, number> = { Schulversuch: 3, Laborpraktikum: 1.5, Fortgeschritten: 0, 'Nur Fachlabor': -3 };

/** Fehlt nur Wärme oder ein Katalysator? Dann lässt sich die Reaktion in der Werkbank einstellen */
function adjustable(missing: string[]): boolean {
  return missing.every((entry) => /erhitz|°C|temperatur|katalys|zu langsam|säure|base|licht|uv|strom|elektrolyse/i.test(entry));
}

export function highlightsOf(reaction: WorkbenchReaction): string[] {
  const text = `${reaction.observation} ${reaction.title}`;
  return HIGHLIGHTS.filter(([pattern]) => pattern.test(text)).map(([, label]) => label);
}

/** Wie spannend ist diese Reaktion? */
export function ideaScore(reaction: WorkbenchReaction): number {
  if (reaction.kind === 'physikalisch') return -Infinity;
  let score = reaction.missing.length ? (adjustable(reaction.missing) ? 4 : 1) : 10;
  score += EVIDENCE_SCORE[reaction.evidence];
  if (reaction.evidence === 'ki' && reaction.ai) score += reaction.ai.confidence * 3;
  score += LEVEL_SCORE[reaction.safetyLevel] ?? 0;
  score += Math.min(3, highlightsOf(reaction).length) * 1.5;
  if (reaction.complex) score += 1.5;
  if (reaction.ai && reaction.evidence !== 'ki') score += 1;
  return score;
}

function pairs<T>(list: T[]): Array<[T, T]> {
  const result: Array<[T, T]> = [];
  for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) result.push([list[i], list[j]]);
  return result;
}

const pause = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

/**
 * Mischt alle Stoffpaare und sammelt die spannendsten Reaktionen.
 * Läuft in kleinen Portionen, damit die Oberfläche bedienbar bleibt.
 */
export async function findReactionIdeas(
  rdkit: MainModule | null,
  model: ReactionModel | null,
  substances: Substance[],
  options: {
    conditions?: WorkbenchConditions;
    limit?: number;
    onProgress?: (done: number, total: number) => void;
    cancelled?: () => boolean;
  } = {},
): Promise<ReactionIdea[]> {
  const conditions = options.conditions ?? { ...DEFAULT_CONDITIONS, temperatureC: 20, pressureBar: 1.013 };
  const list = substances.slice(0, MAX_IDEA_SUBSTANCES);
  const combinations = pairs(list);
  const ideas: ReactionIdea[] = [];
  const seen = new Set<string>();
  let lastPause = Date.now();
  for (const [index, pair] of combinations.entries()) {
    if (options.cancelled?.()) return [];
    const result = mix(rdkit, pair, conditions, [], model);
    if (result.outcome === 'reaktion') {
      const ranked = result.reactions
        .map((reaction) => ({ reaction, score: ideaScore(reaction) }))
        .filter((entry) => Number.isFinite(entry.score))
        .sort((a, b) => b.score - a.score)
        .slice(0, 2);
      for (const { reaction, score } of ranked) {
        const key = identity(pair, reaction);
        if (seen.has(key)) continue;
        seen.add(key);
        ideas.push({
          key: `${pair.map((entry) => entry.id).join('+')}:${reaction.id}`,
          substances: pair,
          reaction,
          score,
          needs: reaction.missing,
          highlights: highlightsOf(reaction),
        });
      }
    }
    if (Date.now() - lastPause > 40) {
      options.onProgress?.(index + 1, combinations.length);
      await pause();
      lastPause = Date.now();
    }
  }
  options.onProgress?.(combinations.length, combinations.length);
  return diversify(ideas).slice(0, options.limit ?? 30);
}

/** Gleiche Umsetzung, egal in welcher Reihenfolge die Stoffe stehen */
function identity(pair: Substance[], reaction: WorkbenchReaction): string {
  const educts = pair.map((entry) => entry.id).sort().join('+');
  const products = reaction.products
    .map((product) => product.smiles ?? product.formula ?? product.name ?? '')
    .filter(Boolean)
    .sort()
    .join('+');
  return `${educts}>${products || reaction.reactionType}`;
}

/** Abwechslung: Jede weitere Reaktion derselben Art rückt etwas nach hinten */
function diversify(ideas: ReactionIdea[]): ReactionIdea[] {
  const sorted = [...ideas].sort((a, b) => b.score - a.score);
  const seenTypes = new Map<string, number>();
  for (const idea of sorted) {
    // «Komplexbildung: Tetraammin…» und «Komplexbildung: Diamminsilber…» sind dieselbe Art
    const type = idea.reaction.complex || /^komplexbildung/i.test(idea.reaction.title) ? 'Komplexbildung' : idea.reaction.reactionType;
    const before = seenTypes.get(type) ?? 0;
    idea.score -= before * 3;
    seenTypes.set(type, before + 1);
  }
  return sorted.sort((a, b) => b.score - a.score);
}

/** Synthesen aus dem Katalog, für die (fast) alle Edukte in der Liste stehen */
export function findSynthesisIdeas(catalog: Synthesis[], substances: Substance[], limit = 30): SynthesisIdea[] {
  const ids = new Set(substances.map((entry) => entry.id));
  const ideas: SynthesisIdea[] = [];
  const seen = new Set<string>();
  for (const synthesis of catalog) {
    if (!synthesis.educts.length) continue;
    const absent = synthesis.educts.filter((educt) => !ids.has(educt.id));
    const missing = [...absent.map((educt) => educt.name), ...synthesis.otherEducts];
    const present = synthesis.educts.length - absent.length;
    // Mindestens ein Edukt aus der Liste, höchstens eines fehlt
    if (missing.length > 1 || present < 1) continue;
    if (synthesis.productId && ids.has(synthesis.productId)) continue;
    const key = `${synthesis.product}|${synthesis.ruleName}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const score =
      (missing.length ? 2 : 10) +
      present * 1.5 +
      (synthesis.productId ? 2 : 0) +
      (LEVEL_SCORE[synthesis.safetyLevel] ?? 0) +
      (synthesis.category === 'organisch' ? 0.5 : 0);
    ideas.push({ synthesis, missing, score });
  }
  // Vollständige zuerst, dann die, denen ein Edukt fehlt
  return ideas
    .sort((a, b) => a.missing.length - b.missing.length || b.score - a.score || a.synthesis.product.localeCompare(b.synthesis.product))
    .slice(0, limit);
}
