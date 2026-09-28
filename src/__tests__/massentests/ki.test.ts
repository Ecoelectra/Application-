/**
 * Massentest Reaktions-KI: 1000 zufällige Stoffpaare der Datenbank bei
 * zufälligen Temperaturen. Die KI darf nie abstürzen, darf nur gültige und
 * zulässige Produkte vorschlagen, und jede Energieangabe muss stimmig sein:
 * mit Katalysator nie höher als ohne, Halbwertszeiten endlich und positiv.
 * Dazu Stichproben, deren Ergebnis feststeht.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import type { MainModule } from '@rdkit/rdkit';
import initRDKitModule from '@rdkit/rdkit';
import { loadReactionModel, setModelFileLoader, type ReactionModel } from '../../chem/ai/model';
import { predictFromKnowledge, predictWithModel, type AiProposal } from '../../chem/ai/reactionAI';
import { canonicalSmiles } from '../../chem/rdkit';
import { structureKey } from '../../chem/reactionKeys';
import { isPublishableProduct } from '../../chem/safety';
import { SUBSTANCES, substanceById } from '../../data/substances';
import type { Substance } from '../../data/types';
import { ganzzahl, wahl, zufall } from './hilfen';

let rdkit: MainModule;
let model: ReactionModel;

beforeAll(async () => {
  rdkit = await initRDKitModule();
  setModelFileLoader(async (file) => new Uint8Array(readFileSync(resolve(__dirname, '../../../public/ki', file))));
  const loaded = await loadReactionModel();
  if (!loaded) throw new Error('KI-Modell fehlt – zuerst scripts/ki/train.ts ausführen');
  model = loaded;
}, 120_000);

const random = zufall(2718);
const organisch = SUBSTANCES.filter((substance) => substance.smiles && substance.category !== 'Nachweisreagenz');
const paare = Array.from({ length: 1000 }, (_, index) => {
  // drei Viertel organische Paare, der Rest aus der ganzen Datenbank
  const pool = index % 4 === 3 ? SUBSTANCES : organisch;
  const a = wahl(random, pool);
  let b = wahl(random, pool);
  while (b.id === a.id) b = wahl(random, pool);
  return { index: index + 1, a, b, temperature: ganzzahl(random, -20, 400) };
});

function get(id: string): Substance {
  const substance = substanceById(id);
  if (!substance) throw new Error(`Stoff ${id} fehlt`);
  return substance;
}

function checkProposal(proposal: AiProposal): void {
  expect(proposal.confidence).toBeGreaterThanOrEqual(0);
  expect(proposal.confidence).toBeLessThanOrEqual(1);
  expect(proposal.title.length).toBeGreaterThan(3);
  expect(proposal.explanation.length).toBeGreaterThan(20);
  for (const product of proposal.products) {
    if (!product.smiles) continue;
    expect(canonicalSmiles(rdkit, product.smiles), product.smiles).not.toBeNull();
    expect(isPublishableProduct(product.smiles, rdkit), product.smiles).toBe(true);
  }
  const energy = proposal.energy;
  if (energy) {
    expect(Number.isFinite(energy.eaUncatalyzed)).toBe(true);
    expect(energy.uncatalyzed.halfLife).toBeGreaterThan(0);
    if (energy.eaCatalyzed !== null) {
      expect(energy.eaCatalyzed).toBeLessThanOrEqual(energy.eaUncatalyzed);
      expect(energy.catalyzed?.halfLife).toBeLessThanOrEqual(energy.uncatalyzed.halfLife);
    }
    if (energy.catalystNeeded) expect(energy.catalystName ?? proposal.catalysts[0]?.label).toBeTruthy();
  }
  for (const catalyst of proposal.catalysts) {
    expect(catalyst.score).toBeGreaterThan(0);
    expect(catalyst.purpose.length).toBeGreaterThan(10);
    for (const id of catalyst.substanceIds) expect(substanceById(id), id).toBeDefined();
  }
}

describe('Massentest Reaktions-KI', () => {
  it('hat ein geprüftes Modell', () => {
    expect(model.templates.length).toBeGreaterThan(1000);
    expect(model.metrics.productTop3).toBeGreaterThan(0.5);
    expect(model.metrics.testReactions).toBeGreaterThan(10_000);
  });

  it.each(paare.map((paar) => [paar.index, `${paar.a.id} + ${paar.b.id}`, paar] as const))('#%i %s', (_, __, paar) => {
    const options = { temperatureC: paar.temperature, limit: 3 };
    const proposals = [...predictFromKnowledge([paar.a, paar.b], options), ...predictWithModel(rdkit, model, [paar.a, paar.b], options)];
    proposals.forEach(checkProposal);
    // Reihenfolge der Stoffe spielt keine Rolle
    const reversed = predictWithModel(rdkit, model, [paar.b, paar.a], options).map((proposal) => proposal.products[0]?.smiles).sort();
    expect(reversed).toEqual(predictWithModel(rdkit, model, [paar.a, paar.b], options).map((proposal) => proposal.products[0]?.smiles).sort());
  });
});

describe('Reaktions-KI an bekannten Beispielen', () => {
  const top = (a: string, b: string, temperatureC = 20) => predictWithModel(rdkit, model, [get(a), get(b)], { temperatureC, limit: 5 });

  it('Benzoesäure und Benzylamin → N-Benzylbenzamid mit Kupplungsreagenz', () => {
    const [best] = top('benzoesaeure', 'benzylamin');
    expect(best.products[0].smiles).toBe(structureKey(rdkit, 'O=C(NCc1ccccc1)c1ccccc1'));
    expect(best.familyId).toBe('amid-saeure');
    expect(best.catalysts.map((entry) => entry.category)).toContain('kupplungsreagenz');
  });

  it('Brombenzol und Phenylboronsäure → Biphenyl, nur mit Palladium', () => {
    const [best] = top('brombenzol', 'phenylboronsaeure', 80);
    expect(best.products[0].smiles).toBe(structureKey(rdkit, 'c1ccc(-c2ccccc2)cc1'));
    expect(best.familyId).toBe('suzuki');
    expect(best.energy?.requiresCatalyst).toBe(true);
    expect(best.catalysts[0].category).toBe('pd');
  });

  it('Nitrobenzol und Wasserstoff → Anilin mit Metallkatalysator', () => {
    const proposals = top('nitrobenzol', 'wasserstoff');
    const aniline = proposals.find((proposal) => proposal.products[0].smiles === structureKey(rdkit, 'Nc1ccccc1'));
    expect(aniline).toBeDefined();
    expect(aniline?.catalysts.some((entry) => ['pd', 'pt', 'ni'].includes(entry.category))).toBe(true);
  });

  it('erkennt einen Katalysator im Gefäß', () => {
    const [without] = predictWithModel(rdkit, model, [get('brombenzol'), get('phenylboronsaeure')], { temperatureC: 80 });
    expect(without.energy?.catalystPresent).toBe(false);
    const [withPd] = predictWithModel(rdkit, model, [get('brombenzol'), get('phenylboronsaeure')], {
      temperatureC: 80,
      others: [get('tetrakis-triphenylphosphin-palladium')],
    });
    expect(withPd.energy?.catalystPresent).toBe(true);
  });
});
