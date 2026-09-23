/**
 * Zugriff auf den Synthesekatalog.
 *
 * Der Katalog wird von scripts/build-catalog.ts erzeugt und beim ersten Zugriff
 * nachgeladen – so belastet er den Programmstart nicht. Die Einträge sind
 * platzsparend abgelegt; hier werden sie wieder in lesbare Objekte übersetzt.
 */
import { substanceById } from './substances';
import type { Substance } from './types';

interface RawKind {
  ruleId?: string;
  name: string;
  type: string;
  category: string;
  equation: string;
  conditions: string;
  level: string;
  keywords: string;
}

interface RawEntry {
  k: number;
  p: string;
  pi?: string;
  ps?: string;
  pf?: string;
  ed: string[];
  en?: string[];
  eq?: string;
}

interface RawCatalog {
  version: number;
  kinds: RawKind[];
  entries: RawEntry[];
}

export interface Synthesis {
  /** Kennung für die Adresszeile */
  id: string;
  /** Anzeigename des Produkts */
  product: string;
  productId?: string;
  productSmiles?: string;
  productFormula?: string;
  /** Edukte, soweit sie in der Stoffdatenbank stehen */
  educts: Substance[];
  /** Namen der übrigen Edukte */
  otherEducts: string[];
  ruleId?: string;
  ruleName: string;
  reactionType: string;
  category: string;
  equation: string;
  conditions: string;
  safetyLevel: string;
}

let catalogPromise: Promise<Synthesis[]> | null = null;

function expand(raw: RawCatalog): Synthesis[] {
  return raw.entries.map((entry, index) => {
    const kind = raw.kinds[entry.k];
    const educts = entry.ed
      .map((id) => substanceById(id))
      .filter((substance): substance is Substance => Boolean(substance));

    return {
      id: String(index),
      product: entry.p,
      productId: entry.pi,
      productSmiles: entry.ps,
      productFormula: entry.pf,
      educts,
      otherEducts: entry.en ?? [],
      ruleId: kind.ruleId,
      ruleName: kind.name,
      reactionType: kind.type,
      category: kind.category,
      equation: entry.eq ?? kind.equation,
      conditions: kind.conditions,
      safetyLevel: kind.level,
    };
  });
}

/** Lädt den Katalog; folgende Aufrufe nutzen das Ergebnis erneut. */
export function loadCatalog(): Promise<Synthesis[]> {
  if (!catalogPromise) {
    catalogPromise = import('./generated/catalog.json')
      .then((module) => expand((module.default ?? module) as unknown as RawCatalog))
      .catch(() => []);
  }
  return catalogPromise;
}

/**
 * Suchtext eines Eintrags.
 * Enthält auch die Synonyme des Produkts – sonst fände «Aspirin» die
 * Acetylsalicylsäure nicht.
 */
const haystackCache = new WeakMap<Synthesis, string>();

function haystack(synthesis: Synthesis): string {
  const cached = haystackCache.get(synthesis);
  if (cached !== undefined) return cached;

  const product = synthesis.productId ? substanceById(synthesis.productId) : undefined;
  const text = [
    synthesis.product,
    synthesis.productFormula ?? '',
    ...(product?.synonyms ?? []),
    synthesis.ruleName,
    synthesis.reactionType,
    ...synthesis.educts.flatMap((educt) => [educt.name, ...educt.synonyms]),
    ...synthesis.otherEducts,
  ]
    .join(' ')
    .toLowerCase();

  haystackCache.set(synthesis, text);
  return text;
}

export interface CatalogFilters {
  category?: string;
  /** nur Synthesen, deren Produkt in der Stoffdatenbank steht */
  namedOnly?: boolean;
  level?: string;
}

/** Durchsucht den Katalog nach Produkt, Edukt oder Reaktionsname. */
export function searchCatalog(
  catalog: Synthesis[],
  query: string,
  filters: CatalogFilters = {},
  limit = 60,
): Synthesis[] {
  const needle = query.trim().toLowerCase();

  const matchesFilters = (synthesis: Synthesis): boolean => {
    if (filters.category && synthesis.category !== filters.category) return false;
    if (filters.namedOnly && !synthesis.productId) return false;
    if (filters.level && synthesis.safetyLevel !== filters.level) return false;
    return true;
  };

  const candidates = catalog.filter(matchesFilters);
  if (!needle) return candidates.slice(0, limit);

  const scored: Array<{ synthesis: Synthesis; score: number }> = [];
  for (const synthesis of candidates) {
    const product = synthesis.product.toLowerCase();
    let score = 0;

    const synonyms = synthesis.productId
      ? (substanceById(synthesis.productId)?.synonyms ?? []).map((entry) => entry.toLowerCase())
      : [];

    if (product === needle || synonyms.includes(needle)) score = 100;
    else if (product.startsWith(needle) || synonyms.some((entry) => entry.startsWith(needle))) score = 80;
    else if (product.includes(needle)) score = 60;
    else if (synthesis.educts.some((educt) => educt.name.toLowerCase() === needle)) score = 50;
    else if (haystack(synthesis).includes(needle)) score = 30;

    if (score > 0) {
      // Synthesen mit benanntem Produkt sind aussagekräftiger
      if (synthesis.productId) score += 10;
      scored.push({ synthesis, score });
    }
  }

  return scored
    .sort((a, b) => b.score - a.score || a.synthesis.product.localeCompare(b.synthesis.product))
    .slice(0, limit)
    .map((entry) => entry.synthesis);
}

/** Alle Wege, die zu einem bestimmten Stoff führen. */
export function routesTo(catalog: Synthesis[], substanceId: string): Synthesis[] {
  return catalog.filter((synthesis) => synthesis.productId === substanceId);
}

/** Alle Reaktionen, in denen ein Stoff als Edukt eingesetzt wird. */
export function reactionsFrom(catalog: Synthesis[], substanceId: string): Synthesis[] {
  return catalog.filter((synthesis) => synthesis.educts.some((educt) => educt.id === substanceId));
}

export interface CatalogStats {
  total: number;
  organic: number;
  inorganic: number;
  namedProducts: number;
  distinctProducts: number;
}

export function catalogStats(catalog: Synthesis[]): CatalogStats {
  const products = new Set(catalog.map((synthesis) => synthesis.productId ?? synthesis.product));
  return {
    total: catalog.length,
    organic: catalog.filter((synthesis) => synthesis.category !== 'anorganisch').length,
    inorganic: catalog.filter((synthesis) => synthesis.category === 'anorganisch').length,
    namedProducts: catalog.filter((synthesis) => synthesis.productId).length,
    distinctProducts: products.size,
  };
}
