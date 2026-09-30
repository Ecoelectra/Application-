/**
 * Nachtraining «Technische Katalyse»: CO₂ und Wasserstoff reagieren an einem
 * Metallkatalysator bei hoher Temperatur und hohem Druck – ohne Katalysator
 * oder kalt nicht.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import type { MainModule } from '@rdkit/rdkit';
import initRDKitModule from '@rdkit/rdkit';
import { loadReactionModel, setModelFileLoader, type ReactionModel } from '../ai/model';
import { predictWithModel } from '../ai/reactionAI';
import { DEFAULT_CONDITIONS, mix, type WorkbenchConditions, type WorkbenchReaction } from '../workbench';
import { predictMetalCatalyst } from '../metalCatalystPrediction';
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

function learned(ids: string[], conditions: Partial<WorkbenchConditions>): WorkbenchReaction[] {
  const result = mix(rdkit, ids.map(get), { ...DEFAULT_CONDITIONS, aqueous: false, ...conditions }, [], model);
  return result.reactions.filter((reaction) => reaction.evidence === 'ki' || reaction.ai);
}

const productNames = (reactions: WorkbenchReaction[]) => reactions.flatMap((reaction) => reaction.products.map((product) => product.name ?? product.formula));

describe('Technische Katalyse im neuronalen Netz', () => {
  it('das Modell kennt die neue Quelle', () => {
    expect(model.sources?.technik).toBeGreaterThan(20);
    expect(model.templates.some((template) => template.f === 'gaskatalyse-hydrierung')).toBe(true);
    expect(model.categories).toContain('technisch');
  });

  it('CO₂ + H₂: die KI schlägt Methan, Methanol oder Kohlenmonoxid vor', () => {
    const proposals = predictWithModel(rdkit, model, [get('kohlenstoffdioxid'), get('wasserstoff')], { temperatureC: 300, catalysis: 'metall', limit: 5 });
    const products = proposals.map((proposal) => proposal.products[0]?.smiles);
    expect(products.some((smiles) => smiles === 'C' || smiles === 'CO' || smiles === '[C-]#[O+]')).toBe(true);
    const methane = proposals.find((proposal) => proposal.products[0]?.smiles === 'C');
    expect(methane?.family?.id).toBe('gaskatalyse-hydrierung');
  }, 60_000);

  it('mit Metallkatalysator, 300 °C und 30 bar läuft die Hydrierung von CO₂', () => {
    const reactions = learned(['kohlenstoffdioxid', 'wasserstoff'], { temperatureC: 300, pressureBar: 30, catalysis: 'metall' });
    const running = reactions.filter((reaction) => !reaction.missing.length);
    expect(running.length).toBeGreaterThan(0);
    expect(productNames(running).some((name) => /Methan|Methanol|Kohlenstoffmonoxid/.test(name ?? ''))).toBe(true);
  }, 60_000);

  it('ohne Katalysator oder bei Raumtemperatur läuft sie nicht', () => {
    const without = learned(['kohlenstoffdioxid', 'wasserstoff'], { temperatureC: 300, pressureBar: 30, catalysis: 'keine' });
    expect(without.filter((reaction) => reaction.evidence === 'ki').every((reaction) => reaction.missing.length > 0)).toBe(true);
    const cold = learned(['kohlenstoffdioxid', 'wasserstoff'], { temperatureC: 20, pressureBar: 30, catalysis: 'metall' });
    expect(cold.filter((reaction) => reaction.evidence === 'ki').every((reaction) => reaction.missing.length > 0)).toBe(true);
  }, 60_000);

  it('Druck beschleunigt: Gase lösen sich besser', () => {
    const low = learned(['kohlenstoffdioxid', 'wasserstoff'], { temperatureC: 250, pressureBar: 1.013, catalysis: 'metall' }).find((reaction) => reaction.evidence === 'ki');
    const high = learned(['kohlenstoffdioxid', 'wasserstoff'], { temperatureC: 250, pressureBar: 50, catalysis: 'metall' }).find((reaction) => reaction.id === low?.id);
    expect(low?.reactor?.halfLife).toBeGreaterThan((high?.reactor?.halfLife as number) * 10);
  }, 60_000);

  it('Metallkatalysator: Nickel für Methan, Kupfer/Zinkoxid für Methanol', () => {
    const reactions = learned(['kohlenstoffdioxid', 'wasserstoff'], { temperatureC: 300, pressureBar: 30, catalysis: 'metall' });
    const vessel = ['kohlenstoffdioxid', 'wasserstoff'].map(get);
    const methane = reactions.find((reaction) => reaction.products.some((product) => product.smiles === 'C'));
    if (methane) expect(predictMetalCatalyst(methane, vessel).picks[0].catalyst.id).toBe('ni-al2o3');
    const methanol = reactions.find((reaction) => reaction.products.some((product) => product.smiles === 'CO'));
    if (methanol) expect(predictMetalCatalyst(methanol, vessel).picks[0].catalyst.id).toBe('cu-zno');
    expect(methane ?? methanol).toBeDefined();
  }, 60_000);

  it('Hydroformylierung: Propen + Kohlenmonoxid → Butanal', () => {
    const proposals = predictWithModel(rdkit, model, [get('propen'), get('kohlenstoffmonoxid')], { temperatureC: 100, catalysis: 'metall', limit: 5 });
    expect(proposals.some((proposal) => proposal.products[0]?.smiles === 'CCCC=O')).toBe(true);
  }, 60_000);
});
