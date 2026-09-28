/**
 * Vergleicht Modelle der Reaktions-KI auf denselben zurückgehaltenen
 * Testreaktionen (.cache/ki/testfaelle.jsonl, geschrieben von train.ts).
 *
 * Aufruf: vite-node scripts/ki/evaluate.ts <Name>=<Ordner mit netz.bin.gz und vorlagen.json.gz> …
 * Ergebnis: .cache/ki/vergleich.json
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { gunzipSync } from 'node:zlib';
import initRDKitModule, { type MainModule } from '@rdkit/rdkit';
import { reactantBits } from '../../src/chem/ai/features';
import { decodeNetwork } from '../../src/chem/ai/network';
import { evaluateCases, formatMetrics, type Metrics, type TestCase } from './evaluation';

const ROOT = resolve(import.meta.dirname ?? __dirname, '../..');
const CACHE = resolve(ROOT, '.cache/ki');
const PER_SOURCE = Number(process.env.KI_TEST_JE_QUELLE ?? 2000);

const rdkit = (await (initRDKitModule as unknown as () => Promise<MainModule>)()) as MainModule;

const raw = readFileSync(resolve(CACHE, 'testfaelle.jsonl'), 'utf8')
  .split('\n')
  .filter(Boolean)
  .map((line) => JSON.parse(line) as Omit<TestCase, 'bits'>);
const counts = new Map<string, number>();
const cases: TestCase[] = [];
for (const entry of raw) {
  const n = counts.get(entry.source) ?? 0;
  if (n >= PER_SOURCE) continue;
  const bits = reactantBits(rdkit, entry.reactants);
  if (!bits) continue;
  counts.set(entry.source, n + 1);
  cases.push({ ...entry, bits });
}

const result: Record<string, Record<string, Metrics>> = {};
for (const argument of process.argv.slice(2)) {
  const [name, folder] = argument.split('=');
  const net = decodeNetwork(new Uint8Array(gunzipSync(readFileSync(resolve(folder, 'netz.bin.gz')))));
  const data = JSON.parse(gunzipSync(readFileSync(resolve(folder, 'vorlagen.json.gz'))).toString('utf8')) as {
    categories: string[];
    templates: Array<{ s: string }>;
  };
  const model = { net, templates: data.templates.map((entry) => entry.s), categories: data.categories };
  result[name] = {};
  for (const source of counts.keys()) {
    const subset = cases.filter((entry) => entry.source === source);
    result[name][source] = evaluateCases(rdkit, model, subset);
    console.log(`${name} · ${source}: ${formatMetrics(result[name][source])}`);
  }
}
writeFileSync(resolve(CACHE, 'vergleich.json'), JSON.stringify(result, null, 1));
