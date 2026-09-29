/** KI-Synthese im Reaktor: Bewertung einer Stufe bei Temperatur, Druck und Katalysator. */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import type { MainModule } from '@rdkit/rdkit';
import initRDKitModule from '@rdkit/rdkit';
import { loadReactionModel, setModelFileLoader, type ReactionModel } from '../ai/model';
import { planSynthesis, type RetroStep } from '../ai/retrosynthesis';
import { evaluateStep, recommendedCatalyst, stepHelpers, worstVerdict } from '../ai/synthesisConditions';
import { vaporPressureAt, boilingPointAt } from '../phase';
import { substanceById } from '../../data/substances';

let rdkit: MainModule;
let model: ReactionModel;

beforeAll(async () => {
  rdkit = await initRDKitModule();
  setModelFileLoader(async (file) => new Uint8Array(readFileSync(resolve(__dirname, '../../../public/ki', file))));
  const loaded = await loadReactionModel();
  if (!loaded) throw new Error('KI-Modell fehlt');
  model = loaded;
}, 120_000);

function stepFor(targetId: string, predicate: (step: RetroStep) => boolean): RetroStep {
  const target = substanceById(targetId);
  if (!target) throw new Error(`Stoff ${targetId} fehlt`);
  const result = planSynthesis(rdkit, model, target, { temperatureC: 20, depth: 1 });
  const step = result.routes.map((route) => route.steps[0]).find(predicate);
  if (!step) throw new Error(`kein passender Weg zu ${targetId}`);
  return step;
}

describe('Dampfdruck', () => {
  it('ist die Umkehrung des Siedepunkts', () => {
    expect(vaporPressureAt(100, 100, true)).toBeCloseTo(1.01325, 3);
    const p = vaporPressureAt(78, 120, true);
    expect(boilingPointAt(78, p, true)).toBeCloseTo(120, 1);
    expect(p).toBeGreaterThan(1.5);
  });
});

describe('Stufe im Reaktor', () => {
  it('Veresterung zu Benzocain: Säure und Wärme nötig, Ethanol siedet', () => {
    const step = stepFor('benzocain', (entry) => entry.precursors.some((p) => p.substance.id === 'ethanol') && entry.proposal.family?.id === 'ester');
    expect(recommendedCatalyst(step)).toBe('saeure');
    const cold = evaluateStep(rdkit, step, { temperatureC: 20, pressureBar: 1.013, catalyst: 'saeure' });
    expect(cold.verdict).toBe('langsam');
    const warm = evaluateStep(rdkit, step, { temperatureC: 90, pressureBar: 1.013, catalyst: 'saeure' });
    expect(warm.verdict).toBe('läuft');
    expect(warm.notes.join(' ')).toMatch(/Ethanol siedet/);
    const closed = evaluateStep(rdkit, step, { temperatureC: 90, pressureBar: 5, catalyst: 'saeure' });
    expect(closed.notes.join(' ')).not.toMatch(/Ethanol siedet/);
    const without = evaluateStep(rdkit, step, { temperatureC: 90, pressureBar: 1.013, catalyst: null });
    expect(without.halfLife).toBeGreaterThan(warm.halfLife * 10);
    expect(warm.recommended.pressureBar).toBeGreaterThan(1.013);
  }, 60_000);

  it('Suzuki-Kupplung: ohne Palladium blockiert, mit Palladium bei 90 °C', () => {
    const step = stepFor('biphenyl', (entry) => entry.proposal.family?.id === 'suzuki');
    expect(evaluateStep(rdkit, step, { temperatureC: 90, pressureBar: 1.013, catalyst: null }).verdict).toBe('blockiert');
    const pd = evaluateStep(rdkit, step, { temperatureC: 90, pressureBar: 1.013, catalyst: 'pd' });
    expect(pd.verdict).toBe('läuft');
    expect(pd.catalyzed).toBe(true);
  }, 60_000);

  it('Hydrierung mit Wasserstoff: Druck beschleunigt', () => {
    const step = stepFor('anilin', (entry) => stepHelpers(entry).some((helper) => helper.category === 'wasserstoff'));
    const metal = stepHelpers(step).find((helper) => ['pd', 'pt', 'ni'].includes(helper.category))?.category ?? 'pd';
    const low = evaluateStep(rdkit, step, { temperatureC: 20, pressureBar: 1.013, catalyst: metal });
    const high = evaluateStep(rdkit, step, { temperatureC: 20, pressureBar: 10, catalyst: metal });
    expect(high.pressureFactor).toBeGreaterThan(9);
    expect(high.halfLife).toBeLessThan(low.halfLife / 9);
    expect(high.notes.join(' ')).toMatch(/Wasserstoff ist ein Gas/);
  }, 60_000);

  it('Pyrolyse bei zu hoher Temperatur', () => {
    const step = stepFor('paracetamol', () => true);
    const hot = evaluateStep(rdkit, step, { temperatureC: 500, pressureBar: 1.013, catalyst: recommendedCatalyst(step) });
    expect(['problem', 'blockiert']).toContain(hot.verdict);
  }, 60_000);

  it('schlechtestes Urteil eines Weges', () => {
    expect(worstVerdict(['läuft', 'langsam'])).toBe('langsam');
    expect(worstVerdict(['läuft', 'blockiert', 'problem'])).toBe('blockiert');
    expect(worstVerdict([])).toBe('läuft');
  });
});
