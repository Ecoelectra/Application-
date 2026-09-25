/**
 * Datenbank belegter Reaktionen.
 *
 * 100 000 Reaktionen aus US-Patenten (1976–2016), die tatsächlich im Labor
 * durchgeführt und beschrieben wurden. Anders als die Werkbank-Regeln und die
 * Reaktionsvorlagen sagen sie nichts voraus – sie belegen.
 *
 * Die Daten liegen in 256 Teildateien je Edukt («e-xx») und je Produkt
 * («p-xx») unter public/reaktionen. Geladen wird nur, was gebraucht wird; der
 * Service Worker hält einmal geladene Teile offline bereit.
 * Erzeugt von scripts/build-reactions.ts.
 */
import { shardOf } from '../chem/reactionKeys';

export interface DocumentedReaction {
  /** laufende Nummer in der Datenbank */
  id: number;
  /** Edukte (liefern Atome ins Produkt), als Strukturschlüssel */
  reactants: string[];
  /** Hilfsstoffe laut Vorschrift: Lösungsmittel, Katalysatoren, Basen */
  agents: string[];
  /** Hauptprodukt */
  product: string;
  /** Zahl der Fundstellen im Datensatz */
  count: number;
  /** erste Fundstelle im Quelldatensatz, z. B. «train:12345» */
  source: string;
}

export interface ReactionDatabaseIndex {
  version: number;
  total: number;
  /** Reaktionen, deren Edukte alle in der Stoffdatenbank stehen */
  directlyReproducible: number;
  shardCount: number;
  source: string;
  /** Stoff-ID → Zahl der Reaktionen, in denen der Stoff Edukt ist */
  perSubstance: Record<string, number>;
  /** Stoff-ID → Zahl der belegten Wege zu diesem Stoff */
  productsPerSubstance: Record<string, number>;
}

type RawReaction = [string[], string[], string, number, string, number];

/** Liefert den Inhalt einer Datei aus public/reaktionen oder null. */
export type ReactionFileLoader = (file: string) => Promise<Uint8Array | null>;

function baseUrl(): string {
  const base = (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL) || './';
  return base.endsWith('/') ? base : `${base}/`;
}

const browserLoader: ReactionFileLoader = async (file) => {
  const response = await fetch(`${baseUrl()}reaktionen/${file}`);
  if (!response.ok) return null;
  return new Uint8Array(await response.arrayBuffer());
};

let loader: ReactionFileLoader = browserLoader;

/** Für Tests und Skripte: Dateien vom Datenträger statt über das Netz lesen. */
export function setReactionFileLoader(next: ReactionFileLoader): void {
  loader = next;
  shardCache.clear();
  indexPromise = null;
}

/** Entpackt gzip, falls nötig (manche Server liefern schon entpackt aus). */
async function decodeText(bytes: Uint8Array): Promise<string> {
  const gzipped = bytes[0] === 0x1f && bytes[1] === 0x8b;
  if (!gzipped) return new TextDecoder().decode(bytes);
  if (typeof DecompressionStream === 'undefined') {
    throw new Error('Dieser Browser kann die Reaktionsdatenbank nicht entpacken.');
  }
  const stream = new Blob([bytes as BlobPart]).stream().pipeThrough(new DecompressionStream('gzip'));
  return new Response(stream).text();
}

let indexPromise: Promise<ReactionDatabaseIndex | null> | null = null;

/** Kennzahlen der Datenbank; null, wenn sie nicht erreichbar ist. */
export function loadReactionIndex(): Promise<ReactionDatabaseIndex | null> {
  if (!indexPromise) {
    indexPromise = loader('index.json')
      .then(async (bytes) => (bytes ? (JSON.parse(await decodeText(bytes)) as ReactionDatabaseIndex) : null))
      .catch(() => null);
  }
  return indexPromise;
}

const shardCache = new Map<string, Promise<DocumentedReaction[]>>();

function loadShard(prefix: 'e' | 'p', shard: number): Promise<DocumentedReaction[]> {
  const file = `${prefix}-${shard.toString(16).padStart(2, '0')}.json.gz`;
  let promise = shardCache.get(file);
  if (!promise) {
    promise = loader(file)
      .then(async (bytes) => {
        if (!bytes) return [];
        const raw = JSON.parse(await decodeText(bytes)) as RawReaction[];
        return raw.map(([reactants, agents, product, count, source, id]) => ({
          id, reactants, agents, product, count, source,
        }));
      })
      .catch(() => {
        shardCache.delete(file);
        return [];
      });
    shardCache.set(file, promise);
  }
  return promise;
}

/** Alle belegten Reaktionen, in denen der Stoff Edukt ist. */
export async function reactionsWithReactant(key: string): Promise<DocumentedReaction[]> {
  const shard = await loadShard('e', shardOf(key));
  return shard.filter((reaction) => reaction.reactants.includes(key));
}

/** Alle belegten Wege zu einem Produkt. */
export async function reactionsToProduct(key: string): Promise<DocumentedReaction[]> {
  const shard = await loadShard('p', shardOf(key));
  return shard.filter((reaction) => reaction.product === key).sort((a, b) => b.count - a.count);
}

/** Alle belegten Reaktionen, an denen mindestens einer der Stoffe als Edukt beteiligt ist. */
export async function reactionsInvolving(keys: string[]): Promise<DocumentedReaction[]> {
  const lists = await Promise.all([...new Set(keys)].map(reactionsWithReactant));
  const byId = new Map<number, DocumentedReaction>();
  for (const list of lists) for (const reaction of list) byId.set(reaction.id, reaction);
  return [...byId.values()];
}

/** Reaktionen, deren Edukte vollständig vorhanden sind. */
export function completeReactions(candidates: DocumentedReaction[], available: Set<string>): DocumentedReaction[] {
  return candidates
    .filter((reaction) => reaction.reactants.every((reactant) => available.has(reactant)))
    .sort((a, b) => b.count - a.count);
}
