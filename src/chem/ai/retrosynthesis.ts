/**
 * KI-Synthese: Wie stelle ich einen Zielstoff her?
 *
 * Die Reaktions-KI kennt 5.971 Reaktionsvorlagen, die sie aus rund einer
 * Million Literaturreaktionen gelernt hat. Rückwärts angewendet – vom Produkt
 * zu den Edukten – liefern sie mögliche Ausgangsstoffe (Retrosynthese nach
 * Corey, hier mit gelernten statt von Hand geschriebenen Vorlagen).
 *
 * Jeder Vorschlag wird dreifach geprüft:
 *  1. Die Ausgangsstoffe müssen chemisch sinnvoll sein (keine «nackten»
 *     Abgangsgruppen wie BH2 oder SiH3, keine gesperrten Stoffe).
 *  2. Das Vorwärtsnetz bewertet, wie wahrscheinlich die Vorlage auf genau
 *     diese Ausgangsstoffe passt.
 *  3. Die vollständige Vorwärtsvorhersage der KI muss aus den Ausgangsstoffen
 *     wieder den Zielstoff ergeben («Rundlauf»). Daraus stammen auch
 *     Katalysator, Aktivierungsenergie und Reaktionsenthalpie.
 *
 * Fehlen Ausgangsstoffe in der Stoffdatenbank, plant die KI für sie eine
 * weitere Stufe (höchstens zwei Stufen).
 */
import type { MainModule } from '@rdkit/rdkit';
import type { ReactionModel } from './model';
import { forward } from './network';
import { reactantBits } from './features';
import { applyTemplate, describeProduct, knownProduct, predictWithModel, type AiProduct, type AiProposal } from './reactionAI';
import { substanceFromSmiles } from '../externalSubstances';
import { matchSmarts, molecularFormula } from '../rdkit';
import { structureKey } from '../reactionKeys';
import { assessSubstance, isPublishableProduct } from '../safety';
import { substancesByFormula } from '../../data/substances';
import type { Substance } from '../../data/types';

export interface RetroPrecursor {
  smiles: string;
  name: string;
  formula?: string;
  substance: Substance;
  /** steht in der Stoffdatenbank (Chemikalienschrank) */
  available: boolean;
}

export interface RetroStep {
  product: AiProduct;
  precursors: RetroPrecursor[];
  /** Vorwärtsvorhersage der KI für genau diese Stufe (Katalysator, Energie, Enthalpie) */
  proposal: AiProposal;
  confidence: number;
}

export interface RetroRoute {
  id: string;
  /** Stufen in der Reihenfolge, in der man sie ausführt */
  steps: RetroStep[];
  /** Produkt der Sicherheiten aller Stufen */
  confidence: number;
  /** alle Ausgangsstoffe der ersten Stufe(n) stehen in der Stoffdatenbank */
  allAvailable: boolean;
}

export interface RetroResult {
  routes: RetroRoute[];
  /** Grund, falls für diesen Stoff keine Synthese gezeigt wird */
  blocked?: string;
  /** wie viele Vorschläge die Vorlagen rückwärts geliefert haben */
  candidates: number;
  /** Strukturschlüssel des Zielstoffs */
  targetKey?: string;
  /** zweite Stufe steht noch aus (siehe extendRoutes) */
  pending?: boolean;
}

export interface RetroOptions {
  temperatureC: number;
  /** höchstens so viele Wege */
  limit?: number;
  /** höchstens so viele Stufen (1 oder 2) */
  depth?: number;
}

// ---------------------------------------------------------------------
// Vorlagen rückwärts
// ---------------------------------------------------------------------

type JSReaction = NonNullable<ReturnType<MainModule['get_rxn']>>;
const retroCache = new WeakMap<ReactionModel, Array<JSReaction | null>>();

function retroReactions(rdkit: MainModule, model: ReactionModel): Array<JSReaction | null> {
  let list = retroCache.get(model);
  if (!list) {
    list = model.templates.map((template) => {
      if (template.a > 2) return null;
      const [left, right] = template.s.split('>>');
      try {
        return rdkit.get_rxn(`${right}>>${left}`);
      } catch {
        return null;
      }
    });
    retroCache.set(model, list);
  }
  return list;
}

/** Abgangsgruppen, die eine Vorlage nur als Rumpf kennt (B, Si, Sn, Mg, Zn mit Wasserstoff) */
const BARE_LEAVING_GROUP = '[#5,#14,#50,#12,#30,#13;!H0]';

const plausibleCache = new Map<string, boolean>();
/** Ionen sind keine Stoffe, die man ins Gefäß gibt (Acetat, Hydroxid, Carbanionen …) */
function charged(key: string): boolean {
  let charge = 0;
  for (const match of key.matchAll(/\[[^\]]*?([+-])(\d*)\]/g)) charge += (match[1] === '+' ? 1 : -1) * Number(match[2] || 1);
  return charge !== 0;
}

function plausible(rdkit: MainModule, key: string): boolean {
  let value = plausibleCache.get(key);
  if (value === undefined) {
    value =
      Boolean(knownSubstance(rdkit, key)) ||
      (!charged(key) && matchSmarts(rdkit, key, BARE_LEAVING_GROUP).length === 0 && isPublishableProduct(key, rdkit));
    if (plausibleCache.size > 20_000) plausibleCache.clear();
    plausibleCache.set(key, value);
  }
  return value;
}

interface Disconnection {
  keys: string[];
  templates: number[];
  /** Wahrscheinlichkeit der Vorlagen laut Vorwärtsnetz, auf diese Ausgangsstoffe angewendet */
  score: number;
}

/** Alle Zerlegungen eines Zielstoffs, nach Bewertung des Vorwärtsnetzes geordnet. */
export function disconnect(rdkit: MainModule, model: ReactionModel, targetKey: string): Disconnection[] {
  const target = rdkit.get_mol(targetKey);
  if (!target || !target.is_valid()) {
    target?.delete();
    return [];
  }
  const found = new Map<string, Disconnection>();
  const reactions = retroReactions(rdkit, model);
  try {
    reactions.forEach((rxn, index) => {
      if (!rxn) return;
      const arity = model.templates[index].a;
      const list = new rdkit.MolList();
      list.append(target);
      let sets: ReturnType<JSReaction['run_reactants']> | null = null;
      try {
        sets = rxn.run_reactants(list, 8);
        for (let s = 0; s < sets.size(); s++) {
          const set = sets.get(s);
          if (!set) continue;
          const parts: string[] = [];
          for (let j = 0; j < set.size(); j++) {
            const mol = set.at(j);
            if (!mol) continue;
            try {
              const key = structureKey(rdkit, mol.get_smiles());
              if (key) parts.push(key);
            } catch {
              // ungültiger Ausgangsstoff
            } finally {
              mol.delete();
            }
          }
          set.delete();
          if (parts.length !== arity || parts.includes(targetKey)) continue;
          if (!parts.every((key) => plausible(rdkit, key))) continue;
          const id = [...parts].sort().join('.');
          const entry = found.get(id) ?? { keys: [...parts].sort(), templates: [], score: 0 };
          if (!entry.templates.includes(index)) entry.templates.push(index);
          found.set(id, entry);
        }
      } catch {
        // Vorlage passt nicht
      } finally {
        sets?.delete();
        list.delete();
      }
    });
  } finally {
    target.delete();
  }

  // Bewertung mit dem Vorwärtsnetz
  const scored: Disconnection[] = [];
  for (const entry of found.values()) {
    const bits = reactantBits(rdkit, entry.keys);
    if (!bits) continue;
    const out = forward(model.network, bits);
    entry.score = entry.templates.reduce((sum, index) => sum + out.templates[index], 0);
    scored.push(entry);
  }
  return scored.sort((a, b) => b.score - a.score || a.keys.join('.').localeCompare(b.keys.join('.')));
}

// ---------------------------------------------------------------------
// Stufen und Wege
// ---------------------------------------------------------------------

/** Stoff der Datenbank – über die Struktur oder, bei Stoffen ohne SMILES (Metalle, Salze), über die Summenformel. */
function knownSubstance(rdkit: MainModule, key: string): Substance | undefined {
  const byStructure = knownProduct(rdkit, key);
  if (byStructure) return byStructure;
  // Organische Stoffe stehen mit Struktur in der Datenbank; ohne Struktur nur Metalle und Salze
  const formula = molecularFormula(rdkit, key);
  if (!formula || /^C(?![a-z])/.test(formula)) return undefined;
  return substancesByFormula(formula).find((entry) => !entry.smiles);
}

function precursorOf(rdkit: MainModule, key: string): RetroPrecursor | null {
  const known = knownSubstance(rdkit, key);
  if (known) return { smiles: key, name: known.name, formula: known.formula, substance: known, available: true };
  const built = substanceFromSmiles(rdkit, key);
  if (!built.ok) return null;
  const product = describeProduct(rdkit, key);
  const substance = { ...built.substance, name: product.formula ?? key };
  return { smiles: key, name: substance.name, formula: product.formula, substance, available: false };
}

/** Beste bestätigte Stufen zu einem Zielstoff. */
function steps(
  rdkit: MainModule,
  model: ReactionModel,
  targetKey: string,
  temperatureC: number,
  want: number,
  disconnections = disconnect(rdkit, model, targetKey),
  forbidden: ReadonlySet<string> = new Set(),
): RetroStep[] {
  const result: RetroStep[] = [];
  const product = describeProduct(rdkit, targetKey);
  for (const candidate of disconnections.slice(0, 40)) {
    if (result.length >= want) break;
    // keine Kreisläufe: ein späteres Produkt darf nicht Ausgangsstoff sein
    if (candidate.keys.some((key) => forbidden.has(key))) continue;
    // Vorwärts bestätigen: Liefert eine der Vorlagen den Zielstoff?
    const orders = candidate.keys.length === 2 ? [candidate.keys, [...candidate.keys].reverse()] : [candidate.keys];
    const confirmed = candidate.templates.some((index) => orders.some((order) => applyTemplate(rdkit, model.templates[index].s, order).includes(targetKey)));
    if (!confirmed) continue;
    const precursors = candidate.keys.map((key) => precursorOf(rdkit, key));
    if (precursors.some((entry) => !entry)) continue;
    // Rundlauf: Die vollständige Vorwärtsvorhersage muss den Zielstoff nennen
    const proposals = predictWithModel(
      rdkit,
      model,
      (precursors as RetroPrecursor[]).map((entry) => entry.substance),
      { temperatureC, limit: 8 },
    );
    const proposal = proposals.find((entry) => entry.products[0]?.smiles === targetKey);
    if (!proposal) continue;
    result.push({ product, precursors: precursors as RetroPrecursor[], proposal, confidence: proposal.confidence });
  }
  return result;
}

/**
 * Plant Synthesewege zu einem Zielstoff. Synchron und je nach Molekül
 * 0,5–3 Sekunden – in der Oberfläche deshalb erst nach dem Anzeigen der
 * Wartemeldung aufrufen.
 */
export function planSynthesis(rdkit: MainModule, model: ReactionModel, target: Substance, options: RetroOptions): RetroResult {
  const limit = options.limit ?? 4;
  const depth = options.depth ?? 2;
  if (!target.smiles) return { routes: [], candidates: 0, blocked: 'Für diesen Stoff ist keine Struktur bekannt – die KI plant nur Synthesen organischer Moleküle.' };
  const assessment = assessSubstance(target.name, target.smiles, rdkit);
  if (assessment.restricted) {
    return { routes: [], candidates: 0, blocked: `Für diesen Stoff zeigt die App bewusst keine Synthese. ${assessment.explanation ?? ''}`.trim() };
  }
  const targetKey = structureKey(rdkit, target.smiles);
  if (!targetKey) return { routes: [], candidates: 0, blocked: 'Die Struktur des Zielstoffs lässt sich nicht lesen.' };

  const disconnections = disconnect(rdkit, model, targetKey);
  const candidates = disconnections.length;
  const first = steps(rdkit, model, targetKey, options.temperatureC, limit + 2, disconnections);
  const routes: RetroRoute[] = first.map((step, index) => ({
    id: `weg-${index}`,
    steps: [step],
    confidence: step.confidence,
    allAvailable: step.precursors.every((entry) => entry.available),
  }));
  const result: RetroResult = { routes: sortRoutes(routes).slice(0, limit), candidates, targetKey, pending: depth >= 2 && routes.some((route) => !route.allAvailable) };
  return depth >= 2 ? extendRoutes(rdkit, model, result, options) : result;
}

/** Vorrätige Ausgangsstoffe und kurze Wege bevorzugen, dann nach Sicherheit */
function sortRoutes(routes: RetroRoute[]): RetroRoute[] {
  const rank = (route: RetroRoute) => route.confidence * (route.allAvailable ? 1 : 0.5) * 0.8 ** (route.steps.length - 1);
  return [...routes].sort((a, b) => rank(b) - rank(a) || a.steps.length - b.steps.length);
}

/**
 * Zweite Stufe für Ausgangsstoffe, die nicht im Chemikalienschrank stehen.
 * Getrennt aufrufbar, damit die Oberfläche die einstufigen Wege schon zeigen kann.
 */
export function extendRoutes(rdkit: MainModule, model: ReactionModel, result: RetroResult, options: RetroOptions): RetroResult {
  const limit = options.limit ?? 4;
  if (!result.targetKey) return { ...result, pending: false };
  const targetKey = result.targetKey;
  const routes = result.routes.map((route) => ({ ...route, steps: [...route.steps] }));
  for (const route of routes) {
    if (route.allAvailable || route.steps.length > 1) continue;
    const [last] = route.steps;
    const before: RetroStep[] = [];
    let ok = true;
    for (const precursor of last.precursors.filter((entry) => !entry.available).slice(0, 2)) {
      const options2 = steps(rdkit, model, precursor.smiles, options.temperatureC, 2, undefined, new Set([targetKey, precursor.smiles]));
      const best = options2.find((entry) => entry.precursors.every((p) => p.available)) ?? options2[0];
      if (!best) {
        ok = false;
        break;
      }
      before.push(best);
    }
    if (!ok || !before.length) continue;
    route.steps = [...before, last];
    route.confidence = route.steps.reduce((product, step) => product * step.confidence, 1);
    route.allAvailable =
      before.every((step) => step.precursors.every((entry) => entry.available)) &&
      last.precursors.every((entry) => entry.available || before.some((step) => step.product.smiles === entry.smiles));
  }
  return { ...result, routes: sortRoutes(routes).slice(0, limit), pending: false };
}
