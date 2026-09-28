/**
 * Bewertung der Reaktions-KI auf zurückgehaltenen Testreaktionen – gemeinsam
 * genutzt vom Training (scripts/ki/train.ts) und vom Vergleich zweier Modelle
 * (scripts/ki/evaluate.ts).
 *
 * Produktvorhersage wie in der App: Das Netz ordnet die Vorlagen, die 30
 * wahrscheinlichsten werden mit RDKit auf die Edukte angewendet, die Produkte
 * nach summierter Wahrscheinlichkeit sortiert. Gezählt wird, ob das Produkt
 * aus der Literatur auf Platz 1, unter den ersten 3 oder 5 liegt.
 */
import type { MainModule } from '@rdkit/rdkit';
import { AGENT_CATEGORY_BY_ID } from '../../src/chem/ai/agents';
import { forward, type Network } from '../../src/chem/ai/network';
import { runReaction } from '../../src/chem/rdkit';
import { structureKey } from '../../src/chem/reactionKeys';

export interface TestCase {
  source: string;
  reactants: string[];
  product: string;
  /** Kategorien der Hilfsstoffe in der Literatur (Kennungen) */
  categories: string[];
  bits: Uint16Array;
  /** Vorlage aus der Literaturreaktion (für die Abdeckung) */
  template: string;
}

export interface Metrics {
  cases: number;
  /** Anteil der Testreaktionen, deren Vorlage das Modell überhaupt kennt */
  templateKnown: number;
  productTop1: number;
  productTop3: number;
  productTop5: number;
  /** Anteil mit mindestens einem Produktvorschlag */
  anyProduct: number;
  catalystCases: number;
  catalystTop1: number;
}

export interface Model {
  net: Network;
  templates: string[];
  categories: string[];
}

export function evaluateCases(rdkit: MainModule, model: Model, cases: TestCase[]): Metrics {
  const known = new Set(model.templates);
  let top1 = 0;
  let top3 = 0;
  let top5 = 0;
  let any = 0;
  let templateKnown = 0;
  let catalystCases = 0;
  let catalystHits = 0;
  const catalystIndices = model.categories
    .map((id, c) => ({ id, c, role: AGENT_CATEGORY_BY_ID.get(id)?.role }))
    .filter((entry) => entry.role === 'Katalysator');

  for (const sample of cases) {
    if (known.has(sample.template)) templateKnown++;
    const out = forward(model.net, sample.bits);
    const ranked = [...out.templates.keys()].sort((a, b) => out.templates[b] - out.templates[a]).slice(0, 30);
    const scores = new Map<string, number>();
    for (const t of ranked) {
      const arity = model.templates[t].split('>>')[0].split('.').length;
      if (arity !== sample.reactants.length) continue;
      const sets = runReaction(rdkit, model.templates[t], sample.reactants, 20);
      for (const set of sets) {
        const product = set.map((smiles) => structureKey(rdkit, smiles)).sort((a, b) => (b?.length ?? 0) - (a?.length ?? 0))[0];
        if (product) scores.set(product, (scores.get(product) ?? 0) + out.templates[t]);
      }
    }
    const products = [...scores.entries()].sort((a, b) => b[1] - a[1]).map(([product]) => product);
    if (products.length) any++;
    const rank = products.indexOf(sample.product);
    if (rank === 0) top1++;
    if (rank >= 0 && rank < 3) top3++;
    if (rank >= 0 && rank < 5) top5++;

    const truth = catalystIndices.filter(({ id }) => sample.categories.includes(id));
    if (truth.length) {
      catalystCases++;
      const best = [...catalystIndices].sort((a, b) => out.categories[b.c] - out.categories[a.c])[0];
      if (truth.some((entry) => entry.c === best.c)) catalystHits++;
    }
  }
  const n = Math.max(1, cases.length);
  return {
    cases: cases.length,
    templateKnown: templateKnown / n,
    productTop1: top1 / n,
    productTop3: top3 / n,
    productTop5: top5 / n,
    anyProduct: any / n,
    catalystCases,
    catalystTop1: catalystCases ? catalystHits / catalystCases : 0,
  };
}

export function formatMetrics(metrics: Metrics): string {
  const p = (value: number) => `${(value * 100).toFixed(1)} %`;
  return `${metrics.cases} Fälle · Vorlage bekannt ${p(metrics.templateKnown)} · Produkt top-1 ${p(metrics.productTop1)}, top-3 ${p(metrics.productTop3)}, top-5 ${p(metrics.productTop5)} · Katalysator ${metrics.catalystCases ? p(metrics.catalystTop1) : '–'} (${metrics.catalystCases})`;
}
