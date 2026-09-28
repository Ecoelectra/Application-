/**
 * Ordnet die Vorlagen der fertigen KI neu den Reaktionsfamilien zu und
 * benennt ihre Hilfsstoffe neu, ohne das Netz neu zu trainieren (nach
 * Änderungen an src/chem/ai/families.ts oder src/chem/ai/agents.ts).
 *
 * Aufruf: vite-node scripts/ki/families.ts [--zeigen]
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { gunzipSync, gzipSync } from 'node:zlib';
import initRDKitModule, { type MainModule } from '@rdkit/rdkit';
import { classifyAgent } from '../../src/chem/ai/agents';
import { classifyFamily } from '../../src/chem/ai/families';
import type { TemplateInfo } from '../../src/chem/ai/model';
import type { BondChange } from '../../src/chem/ai/templates';

const ROOT = resolve(import.meta.dirname ?? __dirname, '../..');
const CACHE = resolve(ROOT, '.cache/ki');
const FILE = resolve(ROOT, 'public/ki/vorlagen.json.gz');

const data = JSON.parse(gunzipSync(readFileSync(FILE)).toString('utf8')) as { templates: TemplateInfo[] };
const wanted = new Set(data.templates.map((template) => template.s));
const changes = new Map<string, BondChange[]>();
for (const file of readdirSync(CACHE).filter((name) => /^vorlagen-\d+\.jsonl$/.test(name))) {
  for (const line of readFileSync(resolve(CACHE, file), 'utf8').split('\n')) {
    if (!line) continue;
    const row = JSON.parse(line) as [string, string, string[], string[], string, BondChange[], string];
    if (row[0] === 'train' && wanted.has(row[1]) && !changes.has(row[1])) changes.set(row[1], row[5]);
  }
}

const counts: Record<string, number> = {};
const examples: Record<string, string[]> = {};
let changed = 0;
const rdkit = (await (initRDKitModule as unknown as () => Promise<MainModule>)()) as MainModule;
for (const template of data.templates) {
  for (const entry of template.t) {
    const info = classifyAgent(rdkit, entry[0]);
    if (info?.name) entry[2] = info.name;
    if (info?.category) entry[3] = info.category;
  }
  const family = classifyFamily(changes.get(template.s) ?? [], template.c);
  if (family !== template.f) changed++;
  template.f = family;
  counts[family] = (counts[family] ?? 0) + template.n;
  (examples[family] ??= []).push(`${template.n}× ${template.e}`);
}
writeFileSync(FILE, gzipSync(JSON.stringify(data), { level: 9 }));
console.log(`${changed} Vorlagen neu zugeordnet`, counts);
if (process.argv.includes('--zeigen')) {
  for (const [family, list] of Object.entries(examples)) console.log(`\n== ${family}\n${list.slice(0, 4).join('\n')}`);
}
