/** KI-Synthese: Rückwärtsplanung mit den gelernten Vorlagen. */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import type { MainModule } from '@rdkit/rdkit';
import initRDKitModule from '@rdkit/rdkit';
import { loadReactionModel, setModelFileLoader, type ReactionModel } from '../ai/model';
import { disconnect, planSynthesis, type RetroRoute } from '../ai/retrosynthesis';
import { substanceFromSmiles } from '../externalSubstances';
import { structureKey } from '../reactionKeys';
import { substanceById } from '../../data/substances';
import type { Substance } from '../../data/types';

let rdkit: MainModule;
let model: ReactionModel;

beforeAll(async () => {
  rdkit = await initRDKitModule();
  setModelFileLoader(async (file) => new Uint8Array(readFileSync(resolve(__dirname, '../../../public/ki', file))));
  const loaded = await loadReactionModel();
  if (!loaded) throw new Error('KI-Modell fehlt');
  model = loaded;
}, 120_000);

function get(id: string): Substance {
  const substance = substanceById(id);
  if (!substance) throw new Error(`Stoff ${id} fehlt`);
  return substance;
}

function netCharge(smiles: string): number {
  let charge = 0;
  for (const match of smiles.matchAll(/\[[^\]]*?([+-])(\d*)\]/g)) charge += (match[1] === '+' ? 1 : -1) * Number(match[2] || 1);
  return charge;
}

const precursorIds = (route: RetroRoute) => route.steps[0].precursors.map((entry) => entry.substance.id).sort();

describe('KI-Synthese', () => {
  it('Paracetamol: aus 4-Aminophenol und einem Acetylierungsmittel', () => {
    const result = planSynthesis(rdkit, model, get('paracetamol'), { temperatureC: 20, depth: 1 });
    expect(result.blocked).toBeUndefined();
    const [best] = result.routes;
    expect(best.allAvailable).toBe(true);
    expect(precursorIds(best)).toContain('4-aminophenol');
    expect(best.steps[0].proposal.products[0].smiles).toBe(structureKey(rdkit, 'CC(=O)Nc1ccc(O)cc1'));
  }, 60_000);

  it('Biphenyl: Suzuki-Kupplung mit Palladiumkatalysator', () => {
    const result = planSynthesis(rdkit, model, get('biphenyl'), { temperatureC: 20, depth: 1 });
    const suzuki = result.routes.find((route) => precursorIds(route).includes('phenylboronsaeure'));
    expect(suzuki).toBeDefined();
    expect(suzuki?.steps[0].proposal.catalysts.some((entry) => entry.category === 'pd')).toBe(true);
  }, 60_000);

  it('Ethylacetat: Veresterung oder Acylierung von Ethanol', () => {
    const result = planSynthesis(rdkit, model, get('essigsaeureethylester'), { temperatureC: 20, depth: 1 });
    expect(result.routes.some((route) => precursorIds(route).includes('ethanol'))).toBe(true);
  }, 60_000);

  it('jede Stufe ist vorwärts bestätigt, ohne Ionen und ohne Kreislauf', () => {
    for (const id of ['acetylsalicylsaeure', 'benzocain', 'zimtsaeure', 'anilin']) {
      const target = get(id);
      const targetKey = structureKey(rdkit, target.smiles as string);
      const result = planSynthesis(rdkit, model, target, { temperatureC: 20 });
      expect(result.routes.length, id).toBeGreaterThan(0);
      for (const route of result.routes) {
        expect(route.steps.at(-1)?.product.smiles, id).toBe(targetKey);
        for (const step of route.steps) {
          expect(step.proposal.products[0].smiles).toBe(step.product.smiles);
          for (const precursor of step.precursors) {
            expect(precursor.smiles).not.toBe(targetKey);
            if (!precursor.available) expect(netCharge(precursor.smiles), precursor.smiles).toBe(0);
          }
        }
        // mehrstufig: die Vorstufe liefert, was die letzte Stufe braucht
        if (route.steps.length > 1) {
          const made = new Set(route.steps.slice(0, -1).map((step) => step.product.smiles));
          const needed = route.steps.at(-1)?.precursors.filter((entry) => !entry.available) ?? [];
          for (const entry of needed) expect(made.has(entry.smiles)).toBe(true);
        }
      }
    }
  }, 180_000);

  it('Zerlegungen ohne nackte Abgangsgruppen (BH2, SiH3 …)', () => {
    const list = disconnect(rdkit, model, structureKey(rdkit, 'c1ccc(-c2ccccc2)cc1') as string);
    expect(list.length).toBeGreaterThan(10);
    expect(list.some((entry) => entry.keys.includes('Bc1ccccc1'))).toBe(false);
    expect(list.some((entry) => entry.keys.includes(structureKey(rdkit, 'OB(O)c1ccccc1') as string))).toBe(true);
  }, 60_000);

  it('für gesperrte Stoffe gibt es keine Synthese', () => {
    // Schon die Eingabe als SMILES wird abgelehnt …
    expect(substanceFromSmiles(rdkit, 'Cc1c([N+](=O)[O-])cc([N+](=O)[O-])cc1[N+](=O)[O-]').ok).toBe(false);
    // … und auch ein von Hand gebauter Stoff bekommt keine Synthese
    const tnt: Substance = {
      id: 'test-tnt',
      name: 'Testsprengstoff',
      synonyms: [],
      formula: 'C7H5N3O6',
      smiles: 'Cc1c([N+](=O)[O-])cc([N+](=O)[O-])cc1[N+](=O)[O-]',
      molarMass: 227.13,
      category: 'Test',
    };
    const result = planSynthesis(rdkit, model, tnt, { temperatureC: 20 });
    expect(result.routes).toEqual([]);
    expect(result.blocked).toMatch(/keine Synthese/);
  }, 60_000);

  it('Stoffe ohne Struktur werden nicht geplant', () => {
    const result = planSynthesis(rdkit, model, get('natriumchlorid'), { temperatureC: 20 });
    expect(result.routes).toEqual([]);
    expect(result.blocked).toBeTruthy();
  });
});
