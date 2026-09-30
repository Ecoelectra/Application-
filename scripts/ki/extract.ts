/**
 * Schritt 1 der Reaktions-KI: Vorlagen aus den Patentreaktionen herausschneiden.
 *
 * Aufruf (vom Skript scripts/ki/run.mjs, parallel in mehreren Prozessen):
 *   vite-node scripts/ki/extract.ts <Teil> <Teile>
 *
 * Liegen unter .cache/quellen zugeordnete Reaktionen aus mehreren Quellen
 * (scripts/ki/quellen/), werden diese verwendet, sonst nur USPTO-MIT.
 *
 * Jede Reaktion wird gelesen, ihre Vorlage herausgeschnitten und sofort
 * geprüft: Die Vorlage muss, angewendet auf die Edukte, genau das Produkt aus
 * dem Patent ergeben. Nur solche Reaktionen gehen ins Training.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import initRDKitModule, { type MainModule } from '@rdkit/rdkit';
import { extractTemplate } from '../../src/chem/ai/templates';
import { runReaction } from '../../src/chem/rdkit';
import { structureKey } from '../../src/chem/reactionKeys';

const ROOT = resolve(import.meta.dirname ?? __dirname, '../..');
const DATA = resolve(ROOT, '.cache/uspto/data');
const SOURCES = resolve(ROOT, '.cache/quellen');
const OUT = resolve(ROOT, '.cache/ki');
const FILES: Array<[string, string]> = [['train', 'train.txt'], ['valid', 'valid.txt'], ['test', 'test.txt']];

const part = Number(process.argv[2] ?? 0);
const parts = Number(process.argv[3] ?? 1);

const rdkit = (await (initRDKitModule as unknown as () => Promise<MainModule>)()) as MainModule;
mkdirSync(OUT, { recursive: true });

/**
 * Eingabe: Mit mehreren Quellen (scripts/ki/quellen/, «zugeordnet-*.tsv») je Zeile
 * Quelle, Kennung, zugeordnete Reaktion, Bindungsänderungen, Hilfsstoffe,
 * Aufteilung, EC-Nummer. Sonst nur USPTO-MIT wie bisher.
 */
interface Input {
  line: string;
  split: string;
  source: string;
  id: string;
  ec: string;
}

function* inputs(): Generator<Input> {
  // KI_NUR_DATEI: nur eine Datei bearbeiten (etwa die neue Quelle «Technische Katalyse»)
  const only = process.env.KI_NUR_DATEI;
  const mapped = existsSync(SOURCES)
    ? readdirSync(SOURCES).filter((name) => (only ? name === only : /^zugeordnet-\d+\.tsv$/.test(name))).sort()
    : [];
  if (mapped.length) {
    let index = 0;
    for (const file of mapped) {
      for (const row of readFileSync(resolve(SOURCES, file), 'utf8').split('\n')) {
        if (!row) continue;
        if (index++ % parts !== part) continue;
        const [source, id, reaction, edits, , split, ec] = row.split('\t');
        yield { line: `${reaction} ${edits}`, split: split ?? '', source, id, ec: ec ?? '' };
      }
    }
    return;
  }
  if (!existsSync(resolve(DATA, 'train.txt'))) throw new Error('USPTO-Daten fehlen – zuerst «npm run reaktionen» ausführen.');
  for (const [split, file] of FILES) {
    const text = readFileSync(resolve(DATA, file), 'utf8').split('\n');
    for (let i = 0; i < text.length; i++) {
      if (i % parts !== part || !text[i].trim()) continue;
      yield { line: text[i], split, source: 'uspto-mit', id: `${split}:${i + 1}`, ec: '' };
    }
  }
}

const lines: string[] = [];
const reasons: Record<string, number> = {};
const perSource: Record<string, { read: number; kept: number }> = {};
let total = 0;
let kept = 0;
const started = Date.now();

for (const input of inputs()) {
  total++;
  const stat = (perSource[input.source] ??= { read: 0, kept: 0 });
  stat.read++;
  if (total % 20_000 === 0) console.log(`Teil ${part}: ${total} gelesen, ${kept} behalten (${Math.round((Date.now() - started) / 1000)} s)`);
  const result = extractTemplate(input.line);
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
  // Enzyme als Hilfsstoff «EC:…», damit die KI auch Biokatalysatoren vorschlagen kann
  if (input.ec) agents.push(`EC:${input.ec}`);
  lines.push(JSON.stringify([input.split, template.smarts, reactants, agents, product, template.changes, `${input.source}:${input.id}`, input.source]));
  kept++;
  stat.kept++;
}

const name = process.env.KI_AUSGABE ?? String(part);
writeFileSync(resolve(OUT, `vorlagen-${name}.jsonl`), lines.join('\n'));
writeFileSync(resolve(OUT, `extraktion-${name}.json`), JSON.stringify({ total, kept, reasons, perSource }));
console.log(`Teil ${part} fertig: ${total} gelesen, ${kept} behalten, verworfen:`, reasons, `${Math.round((Date.now() - started) / 1000)} s`);
