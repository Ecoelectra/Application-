/**
 * Schritt 1 der Reaktions-KI: Vorlagen aus den Patentreaktionen herausschneiden.
 *
 * Aufruf (vom Skript scripts/ki/run.mjs, parallel in mehreren Prozessen):
 *   vite-node scripts/ki/extract.ts <Teil> <Teile>
 *
 * Jede Reaktion wird gelesen, ihre Vorlage herausgeschnitten und sofort
 * geprüft: Die Vorlage muss, angewendet auf die Edukte, genau das Produkt aus
 * dem Patent ergeben. Nur solche Reaktionen gehen ins Training.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import initRDKitModule, { type MainModule } from '@rdkit/rdkit';
import { extractTemplate } from '../../src/chem/ai/templates';
import { runReaction } from '../../src/chem/rdkit';
import { structureKey } from '../../src/chem/reactionKeys';

const ROOT = resolve(import.meta.dirname ?? __dirname, '../..');
const DATA = resolve(ROOT, '.cache/uspto/data');
const OUT = resolve(ROOT, '.cache/ki');
const FILES: Array<[string, string]> = [['train', 'train.txt'], ['valid', 'valid.txt'], ['test', 'test.txt']];

const part = Number(process.argv[2] ?? 0);
const parts = Number(process.argv[3] ?? 1);

const rdkit = (await (initRDKitModule as unknown as () => Promise<MainModule>)()) as MainModule;
mkdirSync(OUT, { recursive: true });
if (!existsSync(resolve(DATA, 'train.txt'))) throw new Error('USPTO-Daten fehlen – zuerst «npm run reaktionen» ausführen.');

const lines: string[] = [];
const reasons: Record<string, number> = {};
let total = 0;
let kept = 0;
const started = Date.now();

for (const [split, file] of FILES) {
  const text = readFileSync(resolve(DATA, file), 'utf8').split('\n');
  for (let i = 0; i < text.length; i++) {
    if (i % parts !== part || !text[i].trim()) continue;
    total++;
    if (total % 20_000 === 0) console.log(`Teil ${part}: ${total} gelesen, ${kept} behalten (${Math.round((Date.now() - started) / 1000)} s)`);
    const result = extractTemplate(text[i]);
    if (!result.ok) {
      reasons[result.reason] = (reasons[result.reason] ?? 0) + 1;
      continue;
    }
    const { template } = result;
    const reactants = template.reactants.map((smiles) => structureKey(rdkit, smiles));
    const product = structureKey(rdkit, template.product);
    if (reactants.some((key) => !key) || !product) {
      reasons.RDKit = (reasons.RDKit ?? 0) + 1;
      continue;
    }
    const sets = runReaction(rdkit, template.smarts, reactants as string[], 40);
    if (!sets.some((set) => set.some((smiles) => structureKey(rdkit, smiles) === product))) {
      reasons['nicht reproduziert'] = (reasons['nicht reproduziert'] ?? 0) + 1;
      continue;
    }
    const agents = [...new Set(template.agents.map((smiles) => structureKey(rdkit, smiles)).filter((key): key is string => Boolean(key)))];
    lines.push(JSON.stringify([split, template.smarts, reactants, agents, product, template.changes, `${split}:${i + 1}`]));
    kept++;
  }
}

writeFileSync(resolve(OUT, `vorlagen-${part}.jsonl`), lines.join('\n'));
console.log(`Teil ${part} fertig: ${total} gelesen, ${kept} behalten, verworfen:`, reasons, `${Math.round((Date.now() - started) / 1000)} s`);
