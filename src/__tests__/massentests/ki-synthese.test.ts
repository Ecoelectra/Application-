/**
 * Massentest KI-Synthese: Rückwärtsplanung für 1000 Zielstoffe – alle
 * organischen Stoffe der Datenbank (928), ergänzt um Produkte aus dem
 * Synthesekatalog, die nicht in der Datenbank stehen (einstufig, wie der erste
 * Schritt in der Werkbank). Die Planung
 * darf nie abstürzen und jeder gezeigte Weg muss stimmen: Die Vorwärts-
 * vorhersage liefert den Zielstoff, Ausgangsstoffe sind neutral, zulässig und
 * vom Zielstoff verschieden.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import type { MainModule } from '@rdkit/rdkit';
import initRDKitModule from '@rdkit/rdkit';
import { loadReactionModel, setModelFileLoader, type ReactionModel } from '../../chem/ai/model';
import { planSynthesis } from '../../chem/ai/retrosynthesis';
import { structureKey } from '../../chem/reactionKeys';
import { assessSubstance, isPublishableProduct } from '../../chem/safety';
import { SUBSTANCES } from '../../data/substances';
import type { Substance } from '../../data/types';
import { stichprobe } from './hilfen';

let rdkit: MainModule;
let model: ReactionModel;

beforeAll(async () => {
  rdkit = await initRDKitModule();
  setModelFileLoader(async (file) => new Uint8Array(readFileSync(resolve(__dirname, '../../../public/ki', file))));
  const loaded = await loadReactionModel();
  if (!loaded) throw new Error('KI-Modell fehlt');
  model = loaded;
}, 120_000);

const ANZAHL = Number(process.env.KI_SYNTHESE_ANZAHL ?? 1000);
const ORGANISCH = SUBSTANCES.filter((substance) => substance.smiles && /C/.test(substance.formula));

/** Produkte aus dem Synthesekatalog, die nicht in der Stoffdatenbank stehen */
function katalogProdukte(anzahl: number): Substance[] {
  const catalog = JSON.parse(readFileSync(resolve(__dirname, '../../data/generated/catalog.json'), 'utf8')) as {
    entries: Array<{ p: string; pi?: string; ps?: string; pf?: string }>;
  };
  const seen = new Set<string>();
  const list: Substance[] = [];
  for (const entry of catalog.entries) {
    if (list.length >= anzahl) break;
    if (entry.pi || !entry.ps || !entry.pf || !/C/.test(entry.pf) || seen.has(entry.ps)) continue;
    seen.add(entry.ps);
    list.push({ id: `katalog-${list.length}`, name: entry.p, synonyms: [], formula: entry.pf, smiles: entry.ps, molarMass: 0, category: 'Katalogprodukt' });
  }
  return list;
}

const ziele = ORGANISCH.length >= ANZAHL ? stichprobe(ORGANISCH, ANZAHL) : [...ORGANISCH, ...katalogProdukte(ANZAHL - ORGANISCH.length)];

let mitWeg = 0;
let geplant = 0;

function netCharge(smiles: string): number {
  let charge = 0;
  for (const match of smiles.matchAll(/\[[^\]]*?([+-])(\d*)\]/g)) charge += (match[1] === '+' ? 1 : -1) * Number(match[2] || 1);
  return charge;
}

describe('Massentest KI-Synthese', () => {
  it.each(ziele.map((substance) => [substance.name, substance] as const))('%s', (_, target) => {
    const result = planSynthesis(rdkit, model, target, { temperatureC: 20, depth: 1, limit: 3 });
    geplant++;
    if (assessSubstance(target.name, target.smiles, rdkit).restricted) {
      expect(result.routes).toEqual([]);
      expect(result.blocked).toBeTruthy();
      return;
    }
    const targetKey = structureKey(rdkit, target.smiles as string);
    if (result.routes.length) mitWeg++;
    for (const route of result.routes) {
      expect(route.confidence).toBeGreaterThan(0);
      expect(route.confidence).toBeLessThanOrEqual(1);
      const [step] = route.steps;
      expect(step.product.smiles).toBe(targetKey);
      expect(step.proposal.products[0].smiles).toBe(targetKey);
      for (const precursor of step.precursors) {
        expect(precursor.smiles).not.toBe(targetKey);
        expect(isPublishableProduct(precursor.smiles, rdkit)).toBe(true);
        if (!precursor.available) expect(netCharge(precursor.smiles), precursor.smiles).toBe(0);
      }
    }
  }, 60_000);

  it('findet für die meisten Stoffe mindestens einen Weg', () => {
    expect(ziele).toHaveLength(ANZAHL);
    expect(geplant).toBe(ziele.length);
    expect(mitWeg / geplant).toBeGreaterThan(0.5);
  });
});
