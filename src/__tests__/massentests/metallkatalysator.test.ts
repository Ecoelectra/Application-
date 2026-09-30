/**
 * Massentest Metallkatalysator-Vorhersage: 1000 Zufallsmischungen mit
 * eingestellter Metallkatalyse (mit Reaktions-KI). Jede chemische Reaktion
 * bekommt eine Aussage; vorhergesagte Katalysatoren gibt es im Katalog, keiner
 * doppelt, der erste ist der Hauptkatalysator. Reaktionen, die ausdrücklich
 * ein Metall verlangen (Kreuzkupplung, Hydrierung), bekommen immer einen.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import type { MainModule } from '@rdkit/rdkit';
import initRDKitModule from '@rdkit/rdkit';
import { loadReactionModel, setModelFileLoader, type ReactionModel } from '../../chem/ai/model';
import { predictMetalCatalyst } from '../../chem/metalCatalystPrediction';
import { DEFAULT_CONDITIONS, mix } from '../../chem/workbench';
import { METAL_CATALYSTS } from '../../data/metalCatalysts';
import { SUBSTANCES } from '../../data/substances';
import { ganzzahl, wahl, zufall } from './hilfen';

let rdkit: MainModule;
let model: ReactionModel;

beforeAll(async () => {
  rdkit = await initRDKitModule();
  setModelFileLoader(async (file) => new Uint8Array(readFileSync(resolve(__dirname, '../../../public/ki', file))));
  const loaded = await loadReactionModel();
  if (!loaded) throw new Error('KI-Modell fehlt');
  model = loaded;
}, 120_000);

const random = zufall(7331);
const organisch = SUBSTANCES.filter((substance) => substance.smiles && /C(?![a-z])/.test(substance.formula));
const METALLE = ['wasserstoff', 'brombenzol', 'iodbenzol', 'phenylboronsaeure', 'phenylacetylen', 'styrol', 'nitrobenzol'];
const mischungen = Array.from({ length: 1000 }, (_, index) => {
  // Jede dritte Mischung enthält einen typischen Partner für Metallkatalyse
  const first = index % 3 === 0 ? (SUBSTANCES.find((entry) => entry.id === wahl(random, METALLE)) ?? wahl(random, organisch)) : wahl(random, organisch);
  let second = wahl(random, random() < 0.8 ? organisch : SUBSTANCES);
  while (second.id === first.id) second = wahl(random, SUBSTANCES);
  return { name: `${index + 1}: ${first.name} + ${second.name}`, substances: [first, second], temperatureC: ganzzahl(random, 20, 150) };
});

const ids = new Set(METAL_CATALYSTS.map((entry) => entry.id));
let reaktionen = 0;
let mitKatalysator = 0;

describe('Massentest Metallkatalysator', () => {
  it.each(mischungen.map((entry) => [entry.name, entry] as const))('%s', (_, { substances, temperatureC }) => {
    const result = mix(rdkit, substances, { ...DEFAULT_CONDITIONS, temperatureC, catalysis: 'metall' }, [], model);
    for (const reaction of [...result.reactions, ...(result.pairOutcomes ?? [])]) {
      if (reaction.kind === 'physikalisch') continue;
      reaktionen++;
      const prediction = predictMetalCatalyst(reaction, substances);
      expect(prediction.summary.length, reaction.title).toBeGreaterThan(20);
      expect(prediction.needed).toBe(prediction.picks.length > 0);
      if (!prediction.needed) continue;
      mitKatalysator++;
      const picked = prediction.picks.map((entry) => entry.catalyst.id);
      for (const id of picked) expect(ids.has(id)).toBe(true);
      expect(new Set(picked).size).toBe(picked.length);
      expect(prediction.picks[0].role).toBe('Katalysator');
      for (const entry of prediction.picks) expect(entry.reason.length).toBeGreaterThan(10);
      // Verlangt die Reaktion ausdrücklich Palladium, ist der Hauptkatalysator ein Palladiumkatalysator
      if (/suzuki|heck|sonogashira|buchwald|stille/i.test(reaction.title)) expect(prediction.picks[0].catalyst.metal).toBe('Palladium');
    }
    // Reaktionen mit Kupplung oder Hydrierung bekommen immer einen Katalysator
    for (const reaction of result.reactions) {
      if (/kupplung|hydrierung|heck-|sonogashira/i.test(reaction.title) && !/elektro|kathod|anod/i.test(`${reaction.title} ${reaction.reactionType}`)) {
        expect(predictMetalCatalyst(reaction, substances).needed, reaction.title).toBe(true);
      }
    }
  }, 60_000);

  it('viele Reaktionen bekommen einen Metallkatalysator', () => {
    expect(reaktionen).toBeGreaterThan(500);
    expect(mitKatalysator / reaktionen).toBeGreaterThan(0.2);
  });
});
