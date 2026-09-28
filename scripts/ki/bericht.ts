/**
 * Erzeugt die Zahlentabellen des Trainingsberichts aus .cache/ki/bericht.json
 * (Training) und .cache/ki/vergleich.json (alter und neuer Stand auf denselben
 * Testreaktionen). Ausgabe auf der Konsole als Markdown.
 *
 * Aufruf: vite-node scripts/ki/bericht.ts
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname ?? __dirname, '../..');
const CACHE = resolve(ROOT, '.cache/ki');

interface Metrics {
  cases: number;
  templateKnown: number;
  productTop1: number;
  productTop3: number;
  productTop5: number;
  anyProduct: number;
  catalystCases: number;
  catalystTop1: number;
}

const report = JSON.parse(readFileSync(resolve(CACHE, 'bericht.json'), 'utf8')) as {
  extraction: { total: number; kept: number; reasons: Record<string, number>; perSource: Record<string, { read: number; kept: number }> };
  sources: Record<string, { extracted: number; unique: number; duplicateOf: Record<string, number>; train: number; valid: number; test: number }>;
  samples: { train: number; valid: number; test: number };
  templates: number;
  curve: Array<{ epoch: number; loss: number; trainTop1: number; validTop1: number; validTop5: number; seconds: number }>;
  test: Record<string, Metrics>;
  seconds: number;
};
const comparison = existsSync(resolve(CACHE, 'vergleich.json'))
  ? (JSON.parse(readFileSync(resolve(CACHE, 'vergleich.json'), 'utf8')) as Record<string, Record<string, Metrics>>)
  : null;

const n = (value: number) => value.toLocaleString('de-DE');
const p = (value: number) => `${(value * 100).toFixed(1).replace('.', ',')} %`;

console.log('### Quellen\n');
console.log('| Quelle | geprüfte Vorlagen | davon neu (ohne Dubletten) | Training | Validierung | Test |');
console.log('|---|---:|---:|---:|---:|---:|');
let sums = [0, 0, 0, 0, 0];
for (const [source, stat] of Object.entries(report.sources)) {
  console.log(`| ${source} | ${n(stat.extracted)} | ${n(stat.unique)} | ${n(stat.train)} | ${n(stat.valid)} | ${n(stat.test)} |`);
  sums = [sums[0] + stat.extracted, sums[1] + stat.unique, sums[2] + stat.train, sums[3] + stat.valid, sums[4] + stat.test];
}
console.log(`| **Summe** | ${sums.map((value) => `**${n(value)}**`).join(' | ')} |\n`);

console.log('### Extraktion je Quelle\n');
console.log('| Quelle | zugeordnet gelesen | Vorlage geprüft | Anteil |');
console.log('|---|---:|---:|---:|');
for (const [source, stat] of Object.entries(report.extraction.perSource)) {
  console.log(`| ${source} | ${n(stat.read)} | ${n(stat.kept)} | ${p(stat.kept / Math.max(1, stat.read))} |`);
}
console.log(`\nVerworfen: ${Object.entries(report.extraction.reasons).map(([reason, count]) => `${reason} ${n(count)}`).join(', ')}\n`);

console.log(`Trainingsbeispiele: ${n(report.samples.train)}, Validierung: ${n(report.samples.valid)}, Test: ${n(report.samples.test)}, Vorlagen: ${n(report.templates)}, Dauer: ${Math.round(report.seconds / 60)} min\n`);

console.log('### Lernkurve\n');
console.log('| Epoche | Verlust | Treffer Training | Validierung top-1 | Validierung top-5 | Zeit |');
console.log('|---:|---:|---:|---:|---:|---:|');
for (const entry of report.curve) {
  console.log(`| ${entry.epoch} | ${entry.loss.toFixed(3).replace('.', ',')} | ${p(entry.trainTop1)} | ${p(entry.validTop1)} | ${p(entry.validTop5)} | ${Math.round(entry.seconds / 60)} min |`);
}

const table = (title: string, data: Record<string, Metrics>) => {
  console.log(`\n### ${title}\n`);
  console.log('| Testquelle | Fälle | Vorlage bekannt | Produkt Platz 1 | unter ersten 3 | unter ersten 5 | Katalysator richtig |');
  console.log('|---|---:|---:|---:|---:|---:|---:|');
  for (const [source, m] of Object.entries(data)) {
    console.log(`| ${source} | ${n(m.cases)} | ${p(m.templateKnown)} | ${p(m.productTop1)} | ${p(m.productTop3)} | ${p(m.productTop5)} | ${m.catalystCases ? `${p(m.catalystTop1)} (${n(m.catalystCases)})` : '–'} |`);
  }
};
table('Test (neues Modell, während des Trainings)', report.test);
if (comparison) for (const [name, data] of Object.entries(comparison)) table(`Vergleich: ${name}`, data);
