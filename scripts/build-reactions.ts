/**
 * Erzeugt die Datenbank belegter Reaktionen für die Werkbank.
 *
 * Quelle sind Reaktionen, die D. M. Lowe aus US-Patenten der Jahre 1976–2016
 * extrahiert hat (gemeinfrei, CC0), in der bereinigten und atomzugeordneten
 * Fassung von Jin, Coley, Barzilay und Jaakkola (NIPS 2017, «USPTO-MIT»).
 * Jede Reaktion wurde also tatsächlich im Labor durchgeführt und beschrieben –
 * im Gegensatz zu den Vorhersagen aus Reaktionsvorlagen.
 *
 * Ablauf:
 *  1. Datensatz laden (einmalig von GitHub, danach aus .cache/uspto)
 *  2. Atomnummern entfernen, Strukturen mit RDKit kanonisieren
 *  3. Edukte (liefern Atome ins Produkt) von Hilfsstoffen (Lösungsmittel,
 *     Katalysatoren, Basen) trennen – das geht über die Atomzuordnung
 *  4. Unplausible Atomzuordnungen verwerfen, Doppelte zusammenfassen,
 *     Reaktionen mit gesperrten Stoffen verwerfen
 *  5. 100 000 Reaktionen auswählen – bevorzugt solche mit Stoffen aus der
 *     Stoffdatenbank, damit sie in der Werkbank tatsächlich auftauchen
 *  6. In 256 Teildateien je Edukt und je Produkt schreiben (gzip)
 *
 * Aufruf: npx vite-node scripts/build-reactions.ts
 * Ergebnis: public/reaktionen/
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { gzipSync } from 'node:zlib';
import initRDKitModule from '@rdkit/rdkit';
import { SHARD_COUNT, shardOf, structureKey } from '../src/chem/reactionKeys';
import { assessSubstance } from '../src/chem/safety';
import { structuresOf } from '../src/chem/substanceStructures';
import { SUBSTANCES } from '../src/data/substances';
import type { DocumentedReaction, ReactionDatabaseIndex } from '../src/data/documentedReactions';

const TARGET = 100_000;
const SOURCE_URL = 'https://raw.githubusercontent.com/wengong-jin/nips17-rexgen/master/USPTO/data.zip';
const ROOT = resolve(import.meta.dirname ?? __dirname, '..');
const CACHE = resolve(ROOT, '.cache/uspto');
const OUT = resolve(ROOT, 'public/reaktionen');
const FILES = ['train.txt', 'valid.txt', 'test.txt'];

// ---------------------------------------------------------------------
// 1. Datensatz besorgen
// ---------------------------------------------------------------------

async function ensureDataset(): Promise<void> {
  if (FILES.every((file) => existsSync(resolve(CACHE, 'data', file)))) return;
  mkdirSync(CACHE, { recursive: true });
  console.log(`Lade ${SOURCE_URL} …`);
  const response = await fetch(SOURCE_URL);
  if (!response.ok) throw new Error(`Download fehlgeschlagen: ${response.status}`);
  const zip = resolve(CACHE, 'data.zip');
  writeFileSync(zip, Buffer.from(await response.arrayBuffer()));
  execFileSync('unzip', ['-o', '-q', zip, '-d', CACHE]);
}

// ---------------------------------------------------------------------
// 2.–4. Einlesen, kanonisieren, zusammenfassen
// ---------------------------------------------------------------------

interface Candidate {
  reactants: string[];
  agents: string[];
  product: string;
  /** Zahl der Fundstellen im Datensatz */
  count: number;
  /** erste Fundstelle, z. B. «train:12345» */
  source: string;
}

const MAP = /:(\d+)\]/g;
/** Atom mit Zuordnungsnummer, z. B. [CH3:14] oder [nH:3] */
const ATOM = /\[(Cl|Br|[A-Z][a-z]?|[cnosp])[^:\]]*:(\d+)\]/g;

function unmapped(smiles: string): string {
  return smiles.replace(/:\d+\]/g, ']');
}

/** Grobe Zahl der Schweratome, ohne RDKit – reicht für die Rangfolge. */
function heavyAtoms(smiles: string): number {
  return (smiles.match(/Cl|Br|[BCNOSPFI]|[cnosp]|\[[^\]]+\]/g) ?? []).length;
}

async function main(): Promise<void> {
  await ensureDataset();
  const rdkit = await initRDKitModule();
  const started = Date.now();

  const key = (smiles: string) => structureKey(rdkit, smiles);

  // Schlüssel der Stoffdatenbank (ganze Stoffe und ihre Ionen)
  const databaseKeys = new Map<string, string>();
  // Salze erst nach den Reinstoffen: [OH-] soll nicht «Natronlauge» heißen, wenn
  // es als eigenständiges Ion vorkommt – die Zuordnung dient nur der Statistik.
  for (const substance of SUBSTANCES) {
    for (const structure of structuresOf(substance)) {
      for (const part of [structure, ...structure.split('.')]) {
        const k = key(part);
        if (k && !databaseKeys.has(k)) databaseKeys.set(k, substance.id);
      }
    }
  }

  const unique = new Map<string, Candidate>();
  let lines = 0;
  let skipped = 0;

  for (const file of FILES) {
    const text = readFileSync(resolve(CACHE, 'data', file), 'utf8');
    const label = file.replace('.txt', '');
    let lineNumber = 0;
    for (const line of text.split('\n')) {
      lineNumber++;
      if (!line.trim()) continue;
      lines++;
      if (lines % 50_000 === 0) console.log(`  ${lines} Reaktionen gelesen …`);

      const [reaction] = line.split(' ');
      const [left, right] = reaction.split('>>');
      if (!left || !right) {
        skipped++;
        continue;
      }
      // Hauptprodukt: das größte Molekül rechts. Nur dessen Atome zählen –
      // sonst wäre bei «Amin + HCl → Hydrochlorid» die Salzsäure ein Edukt.
      const mainProduct = right.split('.').sort((a, b) => heavyAtoms(b) - heavyAtoms(a))[0];
      const productMaps = new Set([...mainProduct.matchAll(MAP)].map((match) => match[1]));
      const product = key(unmapped(mainProduct));
      if (!product || product.length > 150) {
        skipped++;
        continue;
      }

      const reactants: string[] = [];
      const agents: string[] = [];
      let implausible = false;
      for (const molecule of left.split('.')) {
        const k = key(unmapped(molecule));
        if (!k) continue;
        const atoms = [...molecule.matchAll(ATOM)].map((match) => ({
          element: match[1].charAt(0).toUpperCase() + match[1].slice(1),
          map: match[2],
        }));
        const transferred = atoms.filter((atom) => productMaps.has(atom.map));
        if (transferred.length > 0) {
          // Plausibilität: Ein größeres Edukt, von dem nur ein Bruchteil im Produkt
          // landet (Anilin → nur das N-Atom im Benzamid), ist fast immer ein
          // Zuordnungsfehler der automatischen Textauswertung. Ausnahme sind
          // Reagenzien, die Halogen-, Sauerstoff- oder Schwefelatome übertragen
          // (Thionylchlorid, NBS, Persäuren).
          const small = atoms.length > 3 && transferred.length / atoms.length < 0.35;
          const heteroOnly = transferred.every((atom) => ['F', 'Cl', 'Br', 'I', 'O', 'S'].includes(atom.element));
          if (small && !heteroOnly) implausible = true;
          reactants.push(k);
        } else {
          agents.push(k);
        }
      }
      if (implausible) {
        skipped++;
        continue;
      }
      const uniqueReactants = [...new Set(reactants)].sort();
      if (!uniqueReactants.length || uniqueReactants.includes(product)) {
        skipped++;
        continue;
      }

      const id = `${uniqueReactants.join('.')}>>${product}`;
      const existing = unique.get(id);
      if (existing) {
        existing.count++;
        for (const agent of agents) if (!existing.agents.includes(agent) && existing.agents.length < 6) existing.agents.push(agent);
      } else {
        unique.set(id, {
          reactants: uniqueReactants,
          agents: [...new Set(agents)].filter((agent) => !uniqueReactants.includes(agent)).slice(0, 6),
          product,
          count: 1,
          source: `${label}:${lineNumber}`,
        });
      }
    }
  }
  console.log(`${lines} Reaktionen gelesen, ${unique.size} verschieden, ${skipped} übersprungen (${Math.round((Date.now() - started) / 1000)} s)`);

  // ---------------------------------------------------------------------
  // 5. Auswahl
  // ---------------------------------------------------------------------

  const scored = [...unique.values()]
    .map((candidate) => {
      const known = candidate.reactants.filter((reactant) => databaseKeys.has(reactant)).length;
      const productKnown = databaseKeys.has(candidate.product);
      let score = 0;
      if (known === candidate.reactants.length) score += 10_000; // in der Werkbank direkt nachstellbar
      score += known * 1000;
      if (productKnown) score += 500;
      score += Math.min(candidate.count, 20) * 10;
      score -= heavyAtoms(candidate.product);
      // Reaktionen ohne Bezug zur Stoffdatenbank kommen nur zum Auffüllen dazu
      if (known === 0 && !productKnown) score -= 100_000;
      return { candidate, score };
    })
    .sort((a, b) => b.score - a.score);
  console.log(`${scored.filter((entry) => entry.score > -50_000).length} Reaktionen berühren die Stoffdatenbank`);

  const restrictedCache = new Map<string, boolean>();
  const restricted = (smiles: string): boolean => {
    let value = restrictedCache.get(smiles);
    if (value === undefined) {
      value = assessSubstance(undefined, smiles, rdkit).restricted;
      restrictedCache.set(smiles, value);
    }
    return value;
  };

  const selected: DocumentedReaction[] = [];
  let blocked = 0;
  for (const { candidate } of scored) {
    if (selected.length >= TARGET) break;
    const molecules = [...candidate.reactants, ...candidate.agents, candidate.product];
    if (molecules.some(restricted)) {
      blocked++;
      continue;
    }
    selected.push({
      id: selected.length,
      reactants: candidate.reactants,
      agents: candidate.agents,
      product: candidate.product,
      count: candidate.count,
      source: candidate.source,
    });
  }
  console.log(`${selected.length} ausgewählt, ${blocked} wegen gesperrter Stoffe verworfen`);

  // ---------------------------------------------------------------------
  // 6. Schreiben
  // ---------------------------------------------------------------------

  rmSync(OUT, { recursive: true, force: true });
  mkdirSync(OUT, { recursive: true });

  const byReactant: DocumentedReaction[][] = Array.from({ length: SHARD_COUNT }, () => []);
  const byProduct: DocumentedReaction[][] = Array.from({ length: SHARD_COUNT }, () => []);
  const perSubstance: Record<string, number> = {};
  const productsPerSubstance: Record<string, number> = {};

  for (const reaction of selected) {
    const shards = new Set(reaction.reactants.map((reactant) => shardOf(reactant)));
    for (const shard of shards) byReactant[shard].push(reaction);
    byProduct[shardOf(reaction.product)].push(reaction);
    for (const reactant of reaction.reactants) {
      const id = databaseKeys.get(reactant);
      if (id) perSubstance[id] = (perSubstance[id] ?? 0) + 1;
    }
    const productId = databaseKeys.get(reaction.product);
    if (productId) productsPerSubstance[productId] = (productsPerSubstance[productId] ?? 0) + 1;
  }

  // kompaktes Format: [Edukte, Hilfsstoffe, Produkt, Anzahl, Fundstelle, Nummer]
  const encode = (list: DocumentedReaction[]) =>
    gzipSync(
      JSON.stringify(list.map((r) => [r.reactants, r.agents, r.product, r.count, r.source, r.id])),
      { level: 9 },
    );

  let bytes = 0;
  for (let shard = 0; shard < SHARD_COUNT; shard++) {
    const name = shard.toString(16).padStart(2, '0');
    const r = encode(byReactant[shard]);
    const p = encode(byProduct[shard]);
    writeFileSync(resolve(OUT, `e-${name}.json.gz`), r);
    writeFileSync(resolve(OUT, `p-${name}.json.gz`), p);
    bytes += r.length + p.length;
  }

  const index: ReactionDatabaseIndex = {
    version: 1,
    total: selected.length,
    directlyReproducible: selected.filter((reaction) => reaction.reactants.every((reactant) => databaseKeys.has(reactant))).length,
    shardCount: SHARD_COUNT,
    source:
      'Reaktionen aus US-Patenten 1976–2016, extrahiert von D. M. Lowe (CC0), bereinigt und atomzugeordnet von W. Jin, C. W. Coley, R. Barzilay, T. Jaakkola (USPTO-MIT, NIPS 2017)',
    perSubstance,
    productsPerSubstance,
  };
  writeFileSync(resolve(OUT, 'index.json'), JSON.stringify(index));

  console.log(`\nDatenbank geschrieben: ${selected.length} Reaktionen, ${(bytes / 1024 / 1024).toFixed(1)} MB (gzip)`);
  console.log(`  direkt in der Werkbank nachstellbar: ${index.directlyReproducible}`);
  console.log(`  Stoffe der Datenbank mit belegten Reaktionen: ${Object.keys(perSubstance).length}`);
  console.log(`  Dauer: ${Math.round((Date.now() - started) / 1000)} s`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
