/** Metallkatalysator-Vorhersage und Herstellungsanleitungen. */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import type { MainModule } from '@rdkit/rdkit';
import initRDKitModule from '@rdkit/rdkit';
import { loadReactionModel, setModelFileLoader, type ReactionModel } from '../ai/model';
import { DEFAULT_CONDITIONS, mix, type WorkbenchReaction } from '../workbench';
import { predictMetalCatalyst } from '../metalCatalystPrediction';
import { METAL_CATALYSTS } from '../../data/metalCatalysts';
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

/** Mischen mit eingestellter Metallkatalyse; die erste Reaktion, deren Titel passt */
function reactionFor(ids: string[], title: RegExp, temperatureC = 90): { reaction: WorkbenchReaction; vessel: Substance[] } {
  const vessel = ids.map(get);
  const result = mix(rdkit, vessel, { ...DEFAULT_CONDITIONS, temperatureC, catalysis: 'metall' }, [], model);
  const reaction = [...result.reactions, ...(result.pairOutcomes ?? [])].find((entry) => title.test(entry.title));
  if (!reaction) throw new Error(`keine Reaktion ${title} in ${result.reactions.map((entry) => entry.title).join(' | ')}`);
  return { reaction, vessel };
}

const best = (ids: string[], title: RegExp) => {
  const { reaction, vessel } = reactionFor(ids, title);
  return predictMetalCatalyst(reaction, vessel);
};

describe('Anleitungen', () => {
  it('jeder Katalysator hat eine vollständige Anleitung', () => {
    expect(METAL_CATALYSTS.length).toBeGreaterThanOrEqual(20);
    expect(new Set(METAL_CATALYSTS.map((entry) => entry.id)).size).toBe(METAL_CATALYSTS.length);
    for (const catalyst of METAL_CATALYSTS) {
      const { guide } = catalyst;
      expect(guide.overview.length, catalyst.id).toBeGreaterThan(60);
      expect(guide.ingredients.length, catalyst.id).toBeGreaterThan(0);
      expect(guide.equipment.length, catalyst.id).toBeGreaterThan(0);
      expect(guide.steps.length, catalyst.id).toBeGreaterThanOrEqual(4);
      expect(guide.hazards.length, catalyst.id).toBeGreaterThan(0);
      expect(guide.source.length, catalyst.id).toBeGreaterThan(10);
      expect(guide.storage.length, catalyst.id).toBeGreaterThan(10);
      expect(catalyst.uses.length, catalyst.id).toBeGreaterThan(0);
      if (guide.purchaseOnly) expect(guide.buyAdvice, catalyst.id).toBeTruthy();
      // Verweise auf die Stoffdatenbank stimmen
      for (const id of catalyst.substanceIds) expect(substanceById(id), `${catalyst.id}: ${id}`).toBeDefined();
      for (const ingredient of guide.ingredients) {
        if (ingredient.substanceId) expect(substanceById(ingredient.substanceId), `${catalyst.id}: ${ingredient.substanceId}`).toBeDefined();
      }
    }
  });

  it('gefährliche Herstellungen sind als Fachlabor eingestuft', () => {
    const level = (id: string) => METAL_CATALYSTS.find((entry) => entry.id === id)?.level;
    expect(level('raney-ni')).toBe('Nur Fachlabor');
    expect(level('adams')).toBe('Nur Fachlabor');
    expect(level('v2o5')).toBe('Nur Fachlabor');
    expect(METAL_CATALYSTS.find((entry) => entry.id === 'grubbs')?.guide.purchaseOnly).toBe(true);
  });
});

describe('Vorhersage des Metallkatalysators', () => {
  it('Suzuki-Kupplung → Pd(PPh₃)₄', () => {
    const prediction = best(['brombenzol', 'phenylboronsaeure'], /Suzuki/);
    expect(prediction.needed).toBe(true);
    expect(prediction.picks[0].catalyst.id).toBe('pd-pph3-4');
  }, 60_000);

  it('Sonogashira-Kupplung → PdCl₂(PPh₃)₂ mit Kupfer(I)-iodid als Cokatalysator', () => {
    const prediction = best(['iodbenzol', 'phenylacetylen'], /Sonogashira/);
    expect(prediction.picks[0].catalyst.id).toBe('pdcl2-pph3-2');
    expect(prediction.picks.find((entry) => entry.role === 'Cokatalysator')?.catalyst.id).toBe('cui');
    expect(prediction.summary).toMatch(/Cokatalysator/);
  }, 60_000);

  it('Heck-Reaktion → Pd(OAc)₂ mit Phosphin; Metathese → Grubbs', () => {
    expect(best(['brombenzol', 'styrol'], /Heck/).picks[0].catalyst.id).toBe('pd-oac2-ligand');
    expect(best(['brombenzol', 'styrol'], /metathese/i).picks[0].catalyst.id).toBe('grubbs');
  }, 60_000);

  it('Hydrierungen: Alkin zum Alken → Lindlar, Alken → Pd/C, Nitril → Raney-Nickel', () => {
    expect(best(['phenylacetylen', 'wasserstoff'], /Lindlar/).picks[0].catalyst.id).toBe('lindlar');
    expect(best(['cyclohexen', 'wasserstoff'], /Hydrierung/).picks[0].catalyst.id).toBe('pd-c');
    const nitro = best(['nitrobenzol', 'wasserstoff'], /Nitrogruppe/);
    expect(nitro.picks[0].catalyst.id).toBe('pd-c');
    expect(best(['benzonitril', 'wasserstoff'], /Reduktion einer Carbonyl- oder Nitrilgruppe/).picks[0].catalyst.id).toBe('raney-ni');
  }, 60_000);

  it('technische Verfahren und Schulversuche', () => {
    expect(best(['stickstoff', 'wasserstoff'], /Haber/).picks[0].catalyst.id).toBe('eisen-haber');
    expect(best(['wasserstoffperoxid', 'mangandioxid'], /Wasserstoffperoxid/).picks[0].catalyst.id).toBe('mno2');
  }, 60_000);

  it('die KI belegt den Katalysator mit Patentdaten', () => {
    const prediction = best(['brombenzol', 'phenylboronsaeure'], /Suzuki/);
    expect(prediction.picks.some((entry) => entry.evidence && /Patente/.test(entry.evidence))).toBe(true);
  }, 60_000);

  it('Ionenreaktionen und Elektrolysen: keiner nötig – mit Begründung', () => {
    const neutral = best(['natriumhydroxid', 'salzsaeure'], /Salzsäure|Natriumhydroxid/);
    expect(neutral.needed).toBe(false);
    expect(neutral.summary).toMatch(/Kein Metallkatalysator nötig/);
    const kolbe = best(['benzoesaeure', 'ethanol'], /Kolbe/);
    expect(kolbe.needed).toBe(false);
    expect(kolbe.summary).toMatch(/elektrochemische/);
  }, 60_000);

  it('für jede chemische Reaktion gibt es eine Aussage', () => {
    for (const ids of [['anilin', 'acetylchlorid'], ['ethanol'], ['toluol', 'brom'], ['kupfersulfat', 'ammoniak']]) {
      const vessel = ids.map(get);
      const result = mix(rdkit, vessel, { ...DEFAULT_CONDITIONS, temperatureC: 90, catalysis: 'metall' }, [], model);
      for (const reaction of result.reactions.filter((entry) => entry.kind !== 'physikalisch')) {
        const prediction = predictMetalCatalyst(reaction, vessel);
        expect(prediction.summary.length, reaction.title).toBeGreaterThan(20);
        expect(prediction.needed).toBe(prediction.picks.length > 0);
      }
    }
  }, 60_000);
});
