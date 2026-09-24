/**
 * Massentest Stoffanalyse und Reaktionssuche: Alle Stoffe mit Struktur aus
 * der Datenbank und Produkte aus dem Synthesekatalog – zusammen mindestens
 * 1000 Moleküle – werden analysiert. Dazu wird jede Reaktionsvorschrift über
 * ihren Namen gesucht.
 */
import { beforeAll, describe, expect, it } from 'vitest';
import type { MainModule } from '@rdkit/rdkit';
import initRDKitModule from '@rdkit/rdkit';
import { canonicalSmiles } from '../../chem/rdkit';
import { analyzeSubstance, searchReactions } from '../../chem/reactionEngine';
import { isPublishableProduct } from '../../chem/safety';
import { loadCatalog } from '../../data/catalog';
import { REACTIONS } from '../../data/reactions';
import { SUBSTANCES } from '../../data/substances';
import { stichprobe } from './hilfen';

let rdkit: MainModule;

beforeAll(async () => {
  rdkit = await initRDKitModule();
}, 60_000);

const catalog = await loadCatalog();
const bekannt = new Set<string>();
const molekuele: Array<{ name: string; smiles: string; formula?: string }> = [];
for (const substance of SUBSTANCES) {
  if (!substance.smiles || bekannt.has(substance.smiles)) continue;
  bekannt.add(substance.smiles);
  molekuele.push({ name: substance.name, smiles: substance.smiles, formula: substance.formula });
}
const katalogProdukte = catalog.filter(
  (entry) => entry.productSmiles && !entry.productId && !bekannt.has(entry.productSmiles),
);
for (const entry of stichprobe(katalogProdukte, Math.max(0, 1000 - molekuele.length))) {
  bekannt.add(entry.productSmiles!);
  molekuele.push({ name: entry.product, smiles: entry.productSmiles!, formula: entry.productFormula });
}

describe('Massentest Stoffanalyse', () => {
  it('analysiert mindestens 1000 Moleküle', () => {
    expect(molekuele.length).toBeGreaterThanOrEqual(1000);
  });

  it.each(molekuele.map((molecule) => [molecule.name, molecule] as const))('%s', (_, molecule) => {
    const result = analyzeSubstance(rdkit, molecule, { limit: 25 });

    if (result.safety.restricted) {
      expect(result.suggestions).toEqual([]);
      return;
    }

    const mol = rdkit.get_mol(molecule.smiles)!;
    const atoms = mol.get_num_atoms();
    mol.delete();
    for (const group of result.groups) {
      expect(group.matches.length).toBeGreaterThan(0);
      for (const index of group.atomIndices) expect(index).toBeLessThan(atoms);
    }

    expect(result.suggestions.length).toBeLessThanOrEqual(25);
    for (let i = 1; i < result.suggestions.length; i++) {
      expect(result.suggestions[i - 1].score).toBeGreaterThanOrEqual(result.suggestions[i].score);
    }
    const ids = result.suggestions.map((suggestion) => suggestion.rule.id);
    expect(new Set(ids).size).toBe(ids.length);

    for (const suggestion of result.suggestions) {
      // Vorschriften mit Reaktions-SMARTS werden nur vorgeschlagen, wenn sie greifen
      if (suggestion.rule.smirks) expect(suggestion.productSets.length).toBeGreaterThan(0);
      for (const set of suggestion.productSets) {
        for (const smiles of set) {
          expect(canonicalSmiles(rdkit, smiles), `${suggestion.rule.id}: ${smiles}`).not.toBeNull();
          expect(isPublishableProduct(smiles, rdkit), `${suggestion.rule.id}: ${smiles}`).toBe(true);
        }
      }
    }
  });
});

describe('Massentest Reaktionssuche', () => {
  it.each(REACTIONS.map((rule) => [rule.name, rule] as const))('%s', (name, rule) => {
    expect(searchReactions(name).map((entry) => entry.id)).toContain(rule.id);
    expect(searchReactions(name.toUpperCase()).map((entry) => entry.id)).toContain(rule.id);
    expect(searchReactions('', { categories: [rule.category] }).map((entry) => entry.id)).toContain(rule.id);
  });
});
