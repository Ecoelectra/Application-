/**
 * Schritt 2 der Reaktions-KI: Vorlagen auswählen, Hilfsstoffe einordnen,
 * neuronales Netz trainieren, auf den Testdaten bewerten und für die App
 * schreiben.
 *
 * Aufruf: vite-node scripts/ki/train.ts   (nach scripts/ki/extract.ts)
 *
 * Ergebnis unter public/ki/:
 *   netz.bin.gz      Gewichte des Netzes (8 Bit)
 *   vorlagen.json.gz Reaktionsvorlagen mit Familie, Hilfsstoff-Statistik und Beispiel
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { cpus } from 'node:os';
import { resolve } from 'node:path';
import { Worker } from 'node:worker_threads';
import { gzipSync } from 'node:zlib';
import initRDKitModule, { type MainModule } from '@rdkit/rdkit';
import { AGENT_CATEGORIES, classifyAgent } from '../../src/chem/ai/agents';
import { FINGERPRINT_BITS, reactantBits } from '../../src/chem/ai/features';
import { classifyFamily } from '../../src/chem/ai/families';
import { decodeNetwork, encodeNetwork, forward, type Network } from '../../src/chem/ai/network';
import type { BondChange } from '../../src/chem/ai/templates';
import { runReaction } from '../../src/chem/rdkit';
import { structureKey } from '../../src/chem/reactionKeys';
import { assessSubstance } from '../../src/chem/safety';
import { evaluateCases, formatMetrics, type Metrics, type TestCase } from './evaluation';

const ROOT = resolve(import.meta.dirname ?? __dirname, '../..');
const CACHE = resolve(ROOT, '.cache/ki');
const OUT = resolve(ROOT, 'public/ki');

const MIN_COUNT = Number(process.env.KI_MIN ?? 25);
/** Kleinere Schwelle für Vorlagen aus Nicht-Patent-Quellen, damit kleine Quellen nicht untergehen */
const MIN_COUNT_SMALL = Number(process.env.KI_MIN_KLEIN ?? 8);
const HIDDEN = Number(process.env.KI_HIDDEN ?? 256);
const EPOCHS = Number(process.env.KI_EPOCHS ?? 6);
const BATCH = 512;
const CATEGORY_WEIGHT = 0.3;
const THREADS = Math.max(1, Math.min(4, cpus().length));
/**
 * Quelle «Technische Katalyse» (scripts/ki/quellen/technik.tsv): wenige, dafür
 * kuratierte Gas- und Industriereaktionen. Ihre Vorlagen werden immer
 * übernommen, ihre Reaktionsfamilie steht in der Tabelle, und ihre Beispiele
 * zählen im Training so oft, dass das Netz sie neben einer Million
 * Patentreaktionen lernt.
 */
const TECHNIK = 'technik';
const TECHNIK_WEIGHT = Number(process.env.KI_TECHNIK_GEWICHT ?? 200);
const technikFamily = new Map<string, string>();
{
  const table = resolve(ROOT, 'scripts/ki/quellen/technik.tsv');
  if (existsSync(table)) {
    for (const line of readFileSync(table, 'utf8').split('\n').slice(1)) {
      const [id, family] = line.split('\t');
      if (id && family) technikFamily.set(`${TECHNIK}:${id}`, family);
    }
  }
}

type Row = [split: string, smarts: string, reactants: string[], agents: string[], product: string, changes: BondChange[], id: string, source?: string];

const rdkit = (await (initRDKitModule as unknown as () => Promise<MainModule>)()) as MainModule;
const started = Date.now();
const log = (...args: unknown[]) => console.log(`[${Math.round((Date.now() - started) / 1000)} s]`, ...args);

// ---------------------------------------------------------------------
// 1. Einlesen
// ---------------------------------------------------------------------

const records: Row[] = [];
for (const file of readdirSync(CACHE).filter((name) => /^vorlagen-(\d+|technik)\.jsonl$/.test(name))) {
  for (const line of readFileSync(resolve(CACHE, file), 'utf8').split('\n')) {
    if (line) records.push(JSON.parse(line) as Row);
  }
}
if (!records.length) throw new Error('Keine Vorlagen gefunden – zuerst scripts/ki/extract.ts ausführen.');
log(`${records.length} geprüfte Reaktionen eingelesen`);

// ---------------------------------------------------------------------
// 1b. Quellen: Dubletten entfernen, Trainings- und Testdaten trennen
// ---------------------------------------------------------------------

const sourceOf = (record: Row) => record[7] ?? 'uspto-mit';
const PATENTS = new Set(['uspto-mit', 'uspto-full', 'uspto-stereo']);
const PRIORITY = [TECHNIK, 'uspto-mit', 'enzymemap', 'uspto-full', 'uspto-stereo', 'ecreact-brenda', 'ecreact-rhea', 'ecreact-pathbank', 'ecreact-metanetx', 'hte-suzuki', 'hte-buchwald'];
const priority = (source: string) => (PRIORITY.indexOf(source) + PRIORITY.length + 1) % (PRIORITY.length + 1);
records.sort((a, b) => priority(sourceOf(a)) - priority(sourceOf(b)) || (a[0] === 'train' ? 0 : 1) - (b[0] === 'train' ? 0 : 1));

/** Einfacher, stabiler Hash (FNV-1a) für die Aufteilung */
function hash(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0) / 0xffffffff;
}

const reactionKey = (record: Row) => `${[...record[2]].sort().join('.')}>>${record[4]}`;
const seenKeys = new Map<string, string>();
const sourceStats: Record<string, { extracted: number; unique: number; duplicateOf: Record<string, number>; train: number; valid: number; test: number }> = {};
const unique: Row[] = [];
for (const record of records) {
  const source = sourceOf(record);
  const stat = (sourceStats[source] ??= { extracted: 0, unique: 0, duplicateOf: {}, train: 0, valid: 0, test: 0 });
  stat.extracted++;
  const key = reactionKey(record);
  const first = seenKeys.get(key);
  if (first) {
    stat.duplicateOf[first] = (stat.duplicateOf[first] ?? 0) + 1;
    continue;
  }
  seenKeys.set(key, source);
  stat.unique++;
  if (source === TECHNIK) {
    // Kuratierte Reaktionen: alle ins Training (geprüft wird das Wiedererkennen, siehe unten)
    record[0] = 'train';
  } else if (source !== 'uspto-mit') {
    // Patente: 1 % Validierung, 1 % Test; kleinere Quellen: 5 % und 10 %
    const x = hash(key);
    const [valid, test] = PATENTS.has(source) ? [0.01, 0.01] : [0.05, 0.1];
    record[0] = x < test ? 'test' : x < test + valid ? 'valid' : 'train';
  }
  stat[record[0] as 'train' | 'valid' | 'test']++;
  unique.push(record);
}
records.length = 0;
for (const record of unique) records.push(record);
seenKeys.clear();
log(`${records.length} verschiedene Reaktionen nach Dublettenprüfung`);
for (const [source, stat] of Object.entries(sourceStats)) {
  log(`  ${source}: ${stat.extracted} geprüft, ${stat.unique} neu (Training ${stat.train}, Validierung ${stat.valid}, Test ${stat.test})`);
}

// ---------------------------------------------------------------------
// 2. Vorlagen auswählen
// ---------------------------------------------------------------------

const trainCounts = new Map<string, number>();
for (const record of records) if (record[0] === 'train') trainCounts.set(record[1], (trainCounts.get(record[1]) ?? 0) + 1);
const trainTotal = records.filter((record) => record[0] === 'train').length;
for (const threshold of [3, 5, 10, 25, 50, 100]) {
  const kept = [...trainCounts.values()].filter((count) => count >= threshold);
  const covered = kept.reduce((sum, count) => sum + count, 0);
  log(`Vorlagen mit ≥ ${threshold} Fundstellen: ${kept.length}, decken ${((covered / trainTotal) * 100).toFixed(1)} % ab`);
}

// Gesperrte Produkte (Sprengstoffe, Kampfstoffe …) filtert die App bei jeder
// Vorhersage; hier werden nur die Beispielreaktionen geprüft (siehe unten).
const smallSource = new Set<string>();
const curated = new Set<string>();
for (const record of records) {
  if (record[0] === 'train' && !PATENTS.has(sourceOf(record))) smallSource.add(record[1]);
  if (sourceOf(record) === TECHNIK) curated.add(record[1]);
}
const templates = [...trainCounts.entries()]
  .filter(([smarts, count]) => count >= MIN_COUNT || (count >= MIN_COUNT_SMALL && smallSource.has(smarts)) || curated.has(smarts))
  .sort((a, b) => b[1] - a[1])
  .map(([smarts]) => smarts);
const templateIndex = new Map(templates.map((smarts, index) => [smarts, index]));
log(`${templates.length} Vorlagen ausgewählt (≥ ${MIN_COUNT} Fundstellen, aus kleinen Quellen ≥ ${MIN_COUNT_SMALL}, dazu ${curated.size} aus «Technische Katalyse»)`);

// ---------------------------------------------------------------------
// 3. Hilfsstoffe einordnen
// ---------------------------------------------------------------------

const categories = AGENT_CATEGORIES.map((category) => category.id);
const categoryIndex = new Map(categories.map((id, index) => [id, index]));
const agentInfo = new Map<string, { category: string | null; name?: string }>();
for (const record of records) {
  for (const agent of record[3]) {
    if (agentInfo.has(agent)) continue;
    const info = classifyAgent(rdkit, agent);
    agentInfo.set(agent, { category: info?.category ?? null, name: info?.name });
  }
}
const classified = [...agentInfo.values()].filter((info) => info.category).length;
log(`${agentInfo.size} verschiedene Hilfsstoffe, ${classified} eingeordnet`);

function categoryMask(agents: string[]): number {
  let mask = 0;
  for (const agent of agents) {
    const category = agentInfo.get(agent)?.category;
    if (category) mask |= 1 << (categoryIndex.get(category) as number);
  }
  return mask >>> 0;
}

// ---------------------------------------------------------------------
// 4. Statistik je Vorlage
// ---------------------------------------------------------------------

const safetyCache = new Map<string, boolean>();
const restricted = (smiles: string): boolean => {
  let value = safetyCache.get(smiles);
  if (value === undefined) {
    value = assessSubstance(undefined, smiles, rdkit).restricted;
    safetyCache.set(smiles, value);
  }
  return value;
};

interface TemplateStats {
  count: number;
  categoryCounts: number[];
  agents: Map<string, number>;
  example: string;
  source: string;
  changes: BondChange[];
  /** Familien laut Tabelle «Technische Katalyse» */
  curatedFamilies: Map<string, number>;
}
const stats: TemplateStats[] = templates.map(() => ({ count: 0, categoryCounts: categories.map(() => 0), agents: new Map(), example: '', source: '', changes: [], curatedFamilies: new Map() }));
for (const record of records) {
  if (record[0] !== 'train') continue;
  const index = templateIndex.get(record[1]);
  if (index === undefined) continue;
  const entry = stats[index];
  entry.count++;
  const mask = categoryMask(record[3]);
  categories.forEach((_, c) => {
    if ((mask >>> c) & 1) entry.categoryCounts[c]++;
  });
  for (const agent of record[3]) entry.agents.set(agent, (entry.agents.get(agent) ?? 0) + 1);
  const curatedFamily = technikFamily.get(record[6]);
  if (curatedFamily) entry.curatedFamilies.set(curatedFamily, (entry.curatedFamilies.get(curatedFamily) ?? 0) + 1);
  if ((!entry.example || record[2].join('.').length < entry.example.length / 1.5) && !restricted(record[4])) {
    entry.example = `${record[2].join('.')}>>${record[4]}`;
    entry.source = record[6];
    entry.changes = record[5];
  }
}

// ---------------------------------------------------------------------
// 5. Fingerabdrücke
// ---------------------------------------------------------------------

interface Sample {
  bits: Uint16Array;
  label: number;
  mask: number;
  record: Row;
}
const samples: { train: Sample[]; valid: Sample[]; test: Sample[] } = { train: [], valid: [], test: [] };
let skippedBits = 0;
for (const [index, record] of records.entries()) {
  if (index % 50_000 === 0) log(`Fingerabdrücke: ${index}/${records.length}`);
  const label = templateIndex.get(record[1]);
  if (label === undefined && record[0] === 'train') continue;
  const bits = reactantBits(rdkit, record[2]);
  if (!bits) {
    skippedBits++;
    continue;
  }
  samples[record[0] as 'train' | 'valid' | 'test'].push({ bits, label: label ?? -1, mask: categoryMask(record[3]), record });
}
log(`Trainingsbeispiele: ${samples.train.length}, Validierung: ${samples.valid.length}, Test: ${samples.test.length} (${skippedBits} ohne Fingerabdruck)`);
// «Technische Katalyse» stärker gewichten: jedes Beispiel zählt mehrfach
const technikSamples = samples.train.filter((sample) => sourceOf(sample.record) === TECHNIK);
for (let copy = 1; copy < TECHNIK_WEIGHT; copy++) samples.train.push(...technikSamples);
log(`«Technische Katalyse»: ${technikSamples.length} Reaktionen, je ${TECHNIK_WEIGHT}-fach gewichtet`);

// ---------------------------------------------------------------------
// 6. Training (Adam, mehrere Threads)
// ---------------------------------------------------------------------

const T = templates.length;
const C = categories.length;
const I = FINGERPRINT_BITS;
const H = HIDDEN;

const sharedFloat = (length: number) => new Float32Array(new SharedArrayBuffer(length * 4));
const weights = {
  w1: sharedFloat(I * H), b1: sharedFloat(H), w2: sharedFloat(T * H), b2: sharedFloat(T), w3: sharedFloat(C * H), b3: sharedFloat(C),
};
// He-Initialisierung mit festem Startwert
let seed = 12345;
const random = () => {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff;
  return seed / 0x7fffffff;
};
const gaussian = () => Math.sqrt(-2 * Math.log(random() + 1e-12)) * Math.cos(2 * Math.PI * random());
for (let i = 0; i < weights.w1.length; i++) weights.w1[i] = gaussian() * Math.sqrt(2 / 60);
for (let i = 0; i < weights.w2.length; i++) weights.w2[i] = gaussian() * Math.sqrt(1 / H);
for (let i = 0; i < weights.w3.length; i++) weights.w3[i] = gaussian() * Math.sqrt(1 / H);

const train = samples.train;
const totalBits = train.reduce((sum, sample) => sum + sample.bits.length, 0);
const bitsBuffer = new Uint16Array(new SharedArrayBuffer(totalBits * 2));
const offsets = new Int32Array(new SharedArrayBuffer((train.length + 1) * 4));
const labels = new Int32Array(new SharedArrayBuffer(train.length * 4));
const masks = new Uint32Array(new SharedArrayBuffer(train.length * 4));
const order = new Int32Array(new SharedArrayBuffer(train.length * 4));
let cursor = 0;
train.forEach((sample, index) => {
  offsets[index] = cursor;
  bitsBuffer.set(sample.bits, cursor);
  cursor += sample.bits.length;
  labels[index] = sample.label;
  masks[index] = sample.mask;
  order[index] = index;
});
offsets[train.length] = cursor;

const workers = Array.from({ length: THREADS }, () => {
  const grads = { g1: sharedFloat(I * H), gb1: sharedFloat(H), g2: sharedFloat(T * H), gb2: sharedFloat(T), g3: sharedFloat(C * H), gb3: sharedFloat(C), touched: new Uint8Array(new SharedArrayBuffer(I)) };
  const worker = new Worker(resolve(ROOT, 'scripts/ki/train-worker.mjs'), {
    workerData: {
      dims: { inputs: I, hidden: H, templates: T, categories: C, categoryWeight: CATEGORY_WEIGHT },
      shared: {
        w1: weights.w1.buffer, b1: weights.b1.buffer, w2: weights.w2.buffer, b2: weights.b2.buffer, w3: weights.w3.buffer, b3: weights.b3.buffer,
        g1: grads.g1.buffer, gb1: grads.gb1.buffer, g2: grads.g2.buffer, gb2: grads.gb2.buffer, g3: grads.g3.buffer, gb3: grads.gb3.buffer,
        touched: grads.touched.buffer, bits: bitsBuffer.buffer, offsets: offsets.buffer, labels: labels.buffer, masks: masks.buffer, order: order.buffer,
      },
    },
  });
  return { worker, grads };
});

const run = (index: number, start: number, end: number) =>
  new Promise<{ loss: number; correct: number }>((resolveRun) => {
    workers[index].worker.once('message', resolveRun);
    workers[index].worker.postMessage({ start, end });
  });

// Adam-Zustände
const adam = Object.fromEntries(
  Object.entries(weights).map(([key, value]) => [key, { m: new Float32Array(value.length), v: new Float32Array(value.length) }]),
) as { [K in keyof typeof weights]: { m: Float32Array; v: Float32Array } };
let step = 0;
const BETA1 = 0.9;
const BETA2 = 0.999;

function adamUpdate(key: keyof typeof weights, grad: Float32Array, from: number, to: number, lr: number, scale: number): void {
  const w = weights[key];
  const { m, v } = adam[key];
  const c1 = 1 - BETA1 ** step;
  const c2 = 1 - BETA2 ** step;
  for (let i = from; i < to; i++) {
    const g = grad[i] * scale;
    m[i] = BETA1 * m[i] + (1 - BETA1) * g;
    v[i] = BETA2 * v[i] + (1 - BETA2) * g * g;
    w[i] -= (lr * (m[i] / c1)) / (Math.sqrt(v[i] / c2) + 1e-8);
  }
}

const sumGrad = new Float32Array(Math.max(T * H, C * H, I * H));
function accumulate(name: 'g2' | 'gb2' | 'g3' | 'gb3' | 'gb1', length: number): Float32Array {
  const target = sumGrad.subarray(0, length);
  target.set(workers[0].grads[name].subarray(0, length));
  for (let w = 1; w < workers.length; w++) {
    const source = workers[w].grads[name];
    for (let i = 0; i < length; i++) target[i] += source[i];
  }
  return target;
}

function evaluate(list: Sample[], net: Network, limit = 5000): { top1: number; top5: number; top10: number; covered: number } {
  let top1 = 0;
  let top5 = 0;
  let top10 = 0;
  let covered = 0;
  const subset = list.slice(0, limit);
  for (const sample of subset) {
    if (sample.label < 0) continue;
    covered++;
    const out = forward(net, sample.bits).templates;
    const target = out[sample.label];
    let rank = 0;
    for (let t = 0; t < out.length; t++) if (out[t] > target) rank++;
    if (rank < 1) top1++;
    if (rank < 5) top5++;
    if (rank < 10) top10++;
  }
  return { top1: top1 / subset.length, top5: top5 / subset.length, top10: top10 / subset.length, covered: covered / subset.length };
}

const netView = (): Network => ({ inputs: I, hidden: H, templates: T, categories: C, ...weights });

const curve: Array<{ epoch: number; loss: number; trainTop1: number; validTop1: number; validTop5: number; seconds: number }> = [];
for (let epoch = 1; epoch <= EPOCHS; epoch++) {
  // Mischen
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    const temp = order[i];
    order[i] = order[j];
    order[j] = temp;
  }
  const lr = 0.001 * (epoch > EPOCHS - 2 ? 0.3 : 1);
  let loss = 0;
  let correct = 0;
  for (let start = 0; start < order.length; start += BATCH) {
    const end = Math.min(order.length, start + BATCH);
    const slice = Math.ceil((end - start) / workers.length);
    const results = await Promise.all(workers.map((_, w) => run(w, Math.min(end, start + w * slice), Math.min(end, start + (w + 1) * slice))));
    for (const result of results) {
      loss += result.loss;
      correct += result.correct;
    }
    step++;
    const scale = 1 / (end - start);
    adamUpdate('w2', accumulate('g2', T * H), 0, T * H, lr, scale);
    adamUpdate('b2', accumulate('gb2', T), 0, T, lr, scale);
    adamUpdate('w3', accumulate('g3', C * H), 0, C * H, lr, scale);
    adamUpdate('b3', accumulate('gb3', C), 0, C, lr, scale);
    adamUpdate('b1', accumulate('gb1', H), 0, H, lr, scale);
    // Erste Schicht: nur Zeilen der Bits, die in diesem Batch vorkamen
    for (let i = 0; i < I; i++) {
      if (!workers.some(({ grads }) => grads.touched[i])) continue;
      const row = sumGrad.subarray(0, H);
      row.fill(0);
      for (const { grads } of workers) {
        if (!grads.touched[i]) continue;
        for (let j = 0; j < H; j++) row[j] += grads.g1[i * H + j];
      }
      const w = weights.w1;
      const { m, v } = adam.w1;
      const c1 = 1 - BETA1 ** step;
      const c2 = 1 - BETA2 ** step;
      for (let j = 0; j < H; j++) {
        const k = i * H + j;
        const g = row[j] * scale;
        m[k] = BETA1 * m[k] + (1 - BETA1) * g;
        v[k] = BETA2 * v[k] + (1 - BETA2) * g * g;
        w[k] -= (lr * (m[k] / c1)) / (Math.sqrt(v[k] / c2) + 1e-8);
      }
    }
  }
  const valid = evaluate(samples.valid, netView(), 3000);
  curve.push({ epoch, loss: loss / order.length, trainTop1: correct / order.length, validTop1: valid.top1, validTop5: valid.top5, seconds: Math.round((Date.now() - started) / 1000) });
  log(
    `Epoche ${epoch}: Verlust ${(loss / order.length).toFixed(3)}, Trainingstreffer ${((correct / order.length) * 100).toFixed(1)} %,`,
    `Validierung top-1 ${(valid.top1 * 100).toFixed(1)} %, top-5 ${(valid.top5 * 100).toFixed(1)} %, top-10 ${(valid.top10 * 100).toFixed(1)} %`,
  );
}
for (const { worker } of workers) await worker.terminate();

// ---------------------------------------------------------------------
// 7. Bewertung auf den Testdaten
// ---------------------------------------------------------------------

// Das gespeicherte Netz hat 8-Bit-Gewichte – bewertet wird genau diese Fassung.
// Sofort sichern, damit ein Fehler in der Bewertung das Training nicht kostet.
const encoded = encodeNetwork(netView());
mkdirSync(OUT, { recursive: true });
writeFileSync(resolve(OUT, 'netz.bin.gz'), gzipSync(encoded, { level: 9 }));
const net = decodeNetwork(encoded);
const templateTest = evaluate(samples.test.filter((sample) => sourceOf(sample.record) === 'uspto-mit'), net, samples.test.length);
log(`Test USPTO-MIT (Vorlage): top-1 ${(templateTest.top1 * 100).toFixed(1)} %, top-5 ${(templateTest.top5 * 100).toFixed(1)} %, top-10 ${(templateTest.top10 * 100).toFixed(1)} %`);

// Produktvorhersage und Katalysator je Quelle, auf zurückgehaltenen Reaktionen
const PER_SOURCE = Number(process.env.KI_TEST_JE_QUELLE ?? 2000);
const categoryIdsOf = (mask: number) => categories.filter((_, c) => (mask >>> c) & 1);
const testCases: TestCase[] = [];
const bySource = new Map<string, TestCase[]>();
for (const sample of samples.test) {
  const source = sourceOf(sample.record);
  const list = bySource.get(source) ?? [];
  if (list.length >= PER_SOURCE) continue;
  const entry: TestCase = { source, reactants: sample.record[2], product: sample.record[4], categories: categoryIdsOf(sample.mask), bits: sample.bits, template: sample.record[1] };
  list.push(entry);
  bySource.set(source, list);
  testCases.push(entry);
}
const model = { net, templates, categories };
const perSource: Record<string, Metrics> = {};
for (const [source, cases] of bySource) {
  perSource[source] = evaluateCases(rdkit, model, cases);
  log(`Test ${source}: ${formatMetrics(perSource[source])}`);
}
const mit = perSource['uspto-mit'];
// «Technische Katalyse»: Erkennt das Netz die kuratierten Reaktionen wieder?
const technikCases: TestCase[] = technikSamples.map((sample) => ({
  source: TECHNIK,
  reactants: sample.record[2],
  product: sample.record[4],
  categories: categoryIdsOf(sample.mask),
  bits: sample.bits,
  template: sample.record[1],
}));
const technikMetrics = technikCases.length ? evaluateCases(rdkit, model, technikCases) : null;
if (technikMetrics) {
  log(`«Technische Katalyse» (Wiedererkennen): ${formatMetrics(technikMetrics)}`);
  writeFileSync(resolve(CACHE, 'technik-metriken.json'), JSON.stringify(technikMetrics, null, 1));
}
const metrics = {
  trainingReactions: samples.train.length - technikSamples.length * (TECHNIK_WEIGHT - 1),
  templates: T,
  testReactions: samples.test.length,
  templateTop1: templateTest.top1,
  templateTop5: templateTest.top5,
  templateTop10: templateTest.top10,
  productSample: mit?.cases ?? 0,
  productTop1: mit?.productTop1 ?? 0,
  productTop3: mit?.productTop3 ?? 0,
  productTop5: mit?.productTop5 ?? 0,
  catalystCases: mit?.catalystCases ?? 0,
  catalystTop1: mit?.catalystTop1 ?? 0,
};
log('Testergebnis:', metrics);

// Testfälle und Bericht für den Vergleich mit anderen Modellen (scripts/ki/evaluate.ts)
writeFileSync(
  resolve(CACHE, 'testfaelle.jsonl'),
  testCases.map((entry) => JSON.stringify({ source: entry.source, reactants: entry.reactants, product: entry.product, categories: entry.categories, template: entry.template })).join('\n'),
);
const extraction = readdirSync(CACHE)
  .filter((name) => /^extraktion-(\d+|technik)\.json$/.test(name))
  .map((name) => JSON.parse(readFileSync(resolve(CACHE, name), 'utf8')) as { total: number; kept: number; reasons: Record<string, number>; perSource: Record<string, { read: number; kept: number }> });
const extractionSummary = { total: 0, kept: 0, reasons: {} as Record<string, number>, perSource: {} as Record<string, { read: number; kept: number }> };
for (const entry of extraction) {
  extractionSummary.total += entry.total;
  extractionSummary.kept += entry.kept;
  for (const [reason, count] of Object.entries(entry.reasons)) extractionSummary.reasons[reason] = (extractionSummary.reasons[reason] ?? 0) + count;
  for (const [source, stat] of Object.entries(entry.perSource ?? {})) {
    const target = (extractionSummary.perSource[source] ??= { read: 0, kept: 0 });
    target.read += stat.read;
    target.kept += stat.kept;
  }
}
writeFileSync(
  resolve(CACHE, 'bericht.json'),
  JSON.stringify(
    {
      created: new Date().toISOString(),
      settings: { minCount: MIN_COUNT, minCountSmall: MIN_COUNT_SMALL, hidden: H, epochs: EPOCHS, batch: BATCH },
      extraction: extractionSummary,
      sources: sourceStats,
      samples: { train: samples.train.length, valid: samples.valid.length, test: samples.test.length },
      templates: T,
      trainedTemplateCoverage: samples.train.length / Math.max(1, records.filter((record) => record[0] === 'train').length),
      curve,
      test: perSource,
      metrics,
      seconds: Math.round((Date.now() - started) / 1000),
    },
    null,
    1,
  ),
);

// ---------------------------------------------------------------------
// 8. Schreiben
// ---------------------------------------------------------------------

mkdirSync(OUT, { recursive: true });
writeFileSync(resolve(OUT, 'netz.bin.gz'), gzipSync(encoded, { level: 9 }));

const templateData = templates.map((smarts, index) => {
  const entry = stats[index];
  const share = Object.fromEntries(
    categories.map((id, c) => [id, entry.count ? entry.categoryCounts[c] / entry.count : 0]).filter(([, value]) => (value as number) >= 0.02),
  ) as { [id: string]: number };
  // Vorlagen aus «Technische Katalyse»: Familie laut Tabelle
  const curatedFamily = [...entry.curatedFamilies.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  const family = curatedFamily ?? classifyFamily(entry.changes, share);
  const topAgents = [...entry.agents.entries()]
    .filter(([agent]) => agentInfo.get(agent)?.category && agentInfo.get(agent)?.category !== 'loesungsmittel')
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([agent, count]) => [agent, count, agentInfo.get(agent)?.name ?? '', agentInfo.get(agent)?.category ?? '']);
  return {
    s: smarts,
    n: entry.count,
    f: family,
    a: smarts.split('>>')[0].split('.').length,
    c: Object.fromEntries(Object.entries(share).map(([id, value]) => [id, Math.round(value * 1000) / 1000])),
    t: topAgents,
    e: entry.example,
    q: entry.source,
  };
});
const familyCounts: { [id: string]: number } = {};
for (const entry of templateData) familyCounts[entry.f] = (familyCounts[entry.f] ?? 0) + entry.n;
log('Reaktionsfamilien (Fundstellen):', familyCounts);

writeFileSync(
  resolve(OUT, 'vorlagen.json.gz'),
  gzipSync(
    JSON.stringify({
      version: 1,
      source: Object.keys(sourceStats).length > 1
        ? `${Object.keys(sourceStats).length} Quellen: US-Patente 1976–2016 (Lowe 2017; USPTO-MIT, Jin et al. 2017; USPTO-STEREO, Schwaller et al. 2019), Enzymreaktionen (EnzymeMap/BRENDA; ECREACT: BRENDA, Rhea, PathBank, MetaNetX), Hochdurchsatz-Experimente (Perera et al. 2018; Ahneman et al. 2018)`
        : 'USPTO-MIT (Lowe 2012; Jin et al. 2017), Reaktionen aus US-Patenten 1976–2016',
      sources: Object.fromEntries(Object.entries(sourceStats).map(([source, stat]) => [source, stat.unique])),
      created: new Date().toISOString().slice(0, 10),
      categories,
      metrics,
      templates: templateData,
    }),
    { level: 9 },
  ),
);
if (!existsSync(OUT)) throw new Error('Ausgabe fehlt');
log(`Fertig: ${T} Vorlagen, Netz ${(encoded.length / 1024).toFixed(0)} KB (ungepackt)`);
