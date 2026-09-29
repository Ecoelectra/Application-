/** Werkbank mit Reaktions-KI: Das neuronale Netz rechnet jede Mischung mit. */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import type { MainModule } from '@rdkit/rdkit';
import initRDKitModule from '@rdkit/rdkit';
import { loadReactionModel, setModelFileLoader, type ReactionModel } from '../ai/model';
import { DEFAULT_CONDITIONS, mix, type WorkbenchConditions, type WorkbenchReaction } from '../workbench';
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

function run(ids: string[], conditions: Partial<WorkbenchConditions> = {}, withModel = true) {
  return mix(rdkit, ids.map(get), { ...DEFAULT_CONDITIONS, temperatureC: 20, pressureBar: 1.013, ...conditions }, [], withModel ? model : null);
}

function learned(reactions: WorkbenchReaction[], productName?: string): WorkbenchReaction[] {
  return reactions.filter(
    (reaction) => reaction.evidence === 'ki' && (!productName || reaction.products.some((product) => product.name === productName)),
  );
}

describe('Werkbank mit Reaktions-KI', () => {
  it('Anilin und Acetylchlorid: die KI liefert Acetanilid als laufende Reaktion', () => {
    const result = run(['anilin', 'acetylchlorid']);
    const [reaction] = learned(result.reactions, 'Acetanilid');
    expect(reaction).toBeDefined();
    expect(reaction.missing).toEqual([]);
    expect(reaction.reactor?.verdict).toBe('läuft');
    expect(reaction.ai?.confidence).toBeGreaterThan(0.5);
    expect(reaction.confidence).toBe('hoch');
    expect(reaction.participants).toEqual(expect.arrayContaining(['anilin', 'acetylchlorid']));
    expect(reaction.evidenceNote).toMatch(/neuronales Netz/);
    // Acetylierung ist exotherm (Tabellenwert für Acetanilid)
    expect(reaction.enthalpy?.deltaH).toBeLessThan(0);
  }, 60_000);

  it('Phenol und Brom: die KI weiß, dass Phenol ohne Lewis-Säure bromiert wird', () => {
    const result = run(['phenol', 'brom']);
    const bromophenols = learned(result.reactions).filter((reaction) => /Bromphenol/.test(reaction.products[0]?.name ?? ''));
    expect(bromophenols.length).toBeGreaterThan(0);
    expect(bromophenols.every((reaction) => !reaction.missing.length)).toBe(true);
    // Die KI-Reaktion steht vor der Regel, der noch der Katalysator fehlt
    expect(result.reactions.findIndex((reaction) => reaction.evidence === 'ki')).toBeLessThan(
      result.reactions.findIndex((reaction) => reaction.missing.length > 0),
    );
  }, 60_000);

  it('bestätigt die Suzuki-Kupplung der Regeln statt sie doppelt zu zeigen', () => {
    const result = run(['brombenzol', 'phenylboronsaeure'], { temperatureC: 90, catalysis: 'metall' });
    const rule = result.reactions.find((reaction) => /Suzuki/.test(reaction.title) && reaction.evidence !== 'ki');
    expect(rule?.ai).toBeDefined();
    expect(rule?.ai?.confidence).toBeGreaterThan(0.5);
    expect(learned(result.reactions, 'Biphenyl')).toEqual([]);
    // Mit Base statt Palladium läuft die Kupplung auch nach der KI nicht
    const base = run(['brombenzol', 'phenylboronsaeure'], { temperatureC: 90, catalysis: 'basisch' });
    expect(base.reactions.filter((reaction) => /Suzuki/.test(reaction.title)).every((reaction) => reaction.missing.length > 0)).toBe(true);
  }, 60_000);

  it('Temperatur: Benzylbromid und Morpholin brauchen nach der KI Wärme', () => {
    const cold = learned(run(['benzylbromid', 'morpholin']).reactions)[0];
    expect(cold.reactor?.verdict).toBe('langsam');
    expect(cold.missing.join(' ')).toMatch(/Zu langsam/);
    const hot = learned(run(['benzylbromid', 'morpholin'], { temperatureC: 130 }).reactions)[0];
    expect(hot.missing).toEqual([]);
    expect(hot.reactor?.halfLife).toBeLessThan(cold.reactor?.halfLife as number);
  }, 60_000);

  it('Katalysator und Druck: Hydrierung von Nitrobenzol erst mit Metallkatalysator, Druck beschleunigt', () => {
    const without = learned(run(['nitrobenzol', 'wasserstoff']).reactions, 'Anilin');
    expect(without.every((reaction) => reaction.missing.length > 0)).toBe(true);
    const low = learned(run(['nitrobenzol', 'wasserstoff'], { catalysis: 'metall' }).reactions, 'Anilin')[0];
    expect(low.missing).toEqual([]);
    expect(low.catalysisMatched).toBe(true);
    const high = learned(run(['nitrobenzol', 'wasserstoff'], { catalysis: 'metall', pressureBar: 10 }).reactions, 'Anilin')[0];
    expect(high.reactor?.pressureFactor).toBeGreaterThan(5);
    expect(high.reactor?.halfLife).toBeLessThan(low.reactor?.halfLife as number);
  }, 60_000);

  it('ein einzelner Stoff braucht einen Reaktionspartner', () => {
    const reactions = learned(run(['ethanol']).reactions);
    expect(reactions.length).toBeGreaterThan(0);
    for (const reaction of reactions) expect(reaction.missing.length).toBeGreaterThan(0);
  }, 60_000);

  it('rein anorganische Mischungen und Werkbank ohne Modell bleiben unverändert', () => {
    expect(learned(run(['natriumhydroxid', 'salzsaeure']).reactions)).toEqual([]);
    const plain = run(['anilin', 'acetylchlorid'], {}, false);
    expect(plain.reactions.some((reaction) => reaction.evidence === 'ki' || reaction.ai)).toBe(false);
  }, 60_000);
});
