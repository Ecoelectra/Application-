import { beforeAll, describe, expect, it } from 'vitest';
import type { MainModule } from '@rdkit/rdkit';
import initRDKitModule from '@rdkit/rdkit';
import {
  analyzeSubstance,
  applyRule,
  detectFunctionalGroups,
  searchReactions,
  suggestReactions,
} from '../reactionEngine';
import { reactionById } from '../../data/reactions';

let rdkit: MainModule;

beforeAll(async () => {
  rdkit = await initRDKitModule();
}, 60_000);

describe('Erkennung funktioneller Gruppen', () => {
  it('erkennt die Carboxygruppe in Essigsäure', () => {
    const groups = detectFunctionalGroups(rdkit, 'CC(=O)O').map((entry) => entry.group.id);
    expect(groups).toContain('carbonsaeure');
    expect(groups).not.toContain('ester');
  });

  it('unterscheidet primäre, sekundäre und tertiäre Alkohole', () => {
    expect(detectFunctionalGroups(rdkit, 'CCO').map((g) => g.group.id)).toContain('alkohol_prim');
    expect(detectFunctionalGroups(rdkit, 'CC(C)O').map((g) => g.group.id)).toContain('alkohol_sek');
    expect(detectFunctionalGroups(rdkit, 'CC(C)(C)O').map((g) => g.group.id)).toContain(
      'alkohol_tert',
    );
  });

  it('erkennt mehrere Gruppen in einem Wirkstoffmolekül', () => {
    // Acetylsalicylsäure: Ester, Carbonsäure und Aromat
    const groups = detectFunctionalGroups(rdkit, 'CC(=O)Oc1ccccc1C(=O)O').map((g) => g.group.id);
    expect(groups).toContain('ester');
    expect(groups).toContain('carbonsaeure');
    expect(groups).toContain('aromat');
  });

  it('liefert Atomindizes für die Hervorhebung', () => {
    const detected = detectFunctionalGroups(rdkit, 'CC(=O)O');
    const acid = detected.find((entry) => entry.group.id === 'carbonsaeure');
    expect(acid?.atomIndices.length).toBe(3);
  });
});

describe('Anwenden einer Reaktionsvorschrift', () => {
  it('berechnet den Ester aus Essigsäure und Ethanol', () => {
    const rule = reactionById('fischer-veresterung');
    expect(rule).toBeDefined();
    const { productSets } = applyRule(rdkit, rule!, 'CC(=O)O', 0);
    const products = productSets.flat();
    expect(products).toContain('CCOC(C)=O');
  });

  it('reduziert Acetophenon zum sekundären Alkohol', () => {
    const rule = reactionById('nabh4-reduktion');
    const { productSets } = applyRule(rdkit, rule!, 'CC(=O)c1ccccc1', 0);
    expect(productSets.flat()).toContain('CC(O)c1ccccc1');
  });

  it('kuppelt zwei Carbonsäuren nach Kolbe zum Alkan', () => {
    const rule = reactionById('kolbe-elektrolyse');
    const { productSets } = applyRule(rdkit, rule!, 'CCCCC(=O)O', 0);
    expect(productSets.flat()).toContain('CCCCCCCC');
  });
});

describe('Reaktionsvorschläge', () => {
  it('schlägt für Ethanol Veresterung und Oxidation vor', () => {
    const ids = suggestReactions(rdkit, { smiles: 'CCO', name: 'Ethanol' }).map((s) => s.rule.id);
    expect(ids).toContain('fischer-veresterung');
    expect(ids).toContain('alkohol-oxidation-aldehyd');
  });

  it('schlägt für ein Keton keine Estersynthese vor', () => {
    const ids = suggestReactions(rdkit, { smiles: 'CC(C)=O', name: 'Aceton' }).map((s) => s.rule.id);
    expect(ids).toContain('nabh4-reduktion');
    expect(ids).not.toContain('esterverseifung');
  });

  it('findet anorganische Verfahren über die Summenformel', () => {
    const ids = suggestReactions(rdkit, { formula: 'NaCl', name: 'Natriumchlorid' }).map(
      (s) => s.rule.id,
    );
    expect(ids).toContain('chloralkali-elektrolyse');
    expect(ids).toContain('downs-zelle');
  });

  it('sortiert konkret berechnete Reaktionen nach vorn', () => {
    const suggestions = suggestReactions(rdkit, { smiles: 'CC(=O)O', name: 'Essigsäure' });
    expect(suggestions.length).toBeGreaterThan(2);
    expect(suggestions[0].score).toBeGreaterThanOrEqual(suggestions[1].score);
    expect(suggestions[0].productSets.length).toBeGreaterThan(0);
  });
});

describe('Sicherheitsprüfung', () => {
  it('gibt für gewöhnliche Stoffe Vorschläge frei', () => {
    const result = analyzeSubstance(rdkit, { smiles: 'CCO', name: 'Ethanol' });
    expect(result.safety.restricted).toBe(false);
    expect(result.suggestions.length).toBeGreaterThan(0);
  });

  it('sperrt Synthesevorschriften für Mehrfachnitroaromaten', () => {
    const tnt = 'Cc1c([N+](=O)[O-])cc([N+](=O)[O-])cc1[N+](=O)[O-]';
    const result = analyzeSubstance(rdkit, { smiles: tnt, name: 'Trinitrotoluol' });
    expect(result.safety.restricted).toBe(true);
    expect(result.safety.category).toBe('Explosivstoff');
    expect(result.suggestions).toHaveLength(0);
  });

  it('warnt bei Peroxiden, ohne zu sperren', () => {
    const result = analyzeSubstance(rdkit, { smiles: 'OO', name: 'Wasserstoffperoxid' });
    expect(result.safety.restricted).toBe(false);
    expect(result.safety.notes.join(' ')).toMatch(/Peroxid/);
  });
});

describe('Reaktionssuche', () => {
  it('findet Reaktionen über den Namen', () => {
    expect(searchReactions('Kolbe')[0].id).toBe('kolbe-elektrolyse');
  });

  it('findet Reaktionen über Stichwörter', () => {
    const ids = searchReactions('Radikal').map((rule) => rule.id);
    expect(ids).toContain('kolbe-elektrolyse');
  });

  it('filtert nach Kategorie', () => {
    const results = searchReactions('', { categories: ['elektrochemie'] });
    expect(results.length).toBeGreaterThan(5);
    expect(results.every((rule) => rule.category === 'elektrochemie')).toBe(true);
  });

  it('filtert nach funktioneller Gruppe', () => {
    const results = searchReactions('', { groups: ['aldehyd'] });
    expect(results.every((rule) => rule.functionalGroups.includes('aldehyd'))).toBe(true);
  });
});
