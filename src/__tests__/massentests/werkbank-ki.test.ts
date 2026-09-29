/**
 * Massentest Werkbank mit Reaktions-KI: 1000 zufällige Mischungen aus zwei
 * oder drei Stoffen bei zufälliger Temperatur, Druck und Katalyse. Das
 * neuronale Netz rechnet jede Mischung mit. Die Werkbank darf nie abstürzen,
 * jede KI-Reaktion braucht ein zulässiges Produkt, Beteiligte aus dem Gefäß
 * und eine stimmige Bewertung im Reaktor: Was nicht läuft, sagt, was fehlt –
 * und mehr Wärme macht eine Reaktion nie langsamer.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import type { MainModule } from '@rdkit/rdkit';
import initRDKitModule from '@rdkit/rdkit';
import { loadReactionModel, setModelFileLoader, type ReactionModel } from '../../chem/ai/model';
import { isPublishableProduct } from '../../chem/safety';
import { DEFAULT_CONDITIONS, mix, type WorkbenchConditions } from '../../chem/workbench';
import { SUBSTANCES } from '../../data/substances';
import { ganzzahl, wahl, zahl, zufall } from './hilfen';

let rdkit: MainModule;
let model: ReactionModel;

beforeAll(async () => {
  rdkit = await initRDKitModule();
  setModelFileLoader(async (file) => new Uint8Array(readFileSync(resolve(__dirname, '../../../public/ki', file))));
  const loaded = await loadReactionModel();
  if (!loaded) throw new Error('KI-Modell fehlt');
  model = loaded;
}, 120_000);

const random = zufall(1618);
const organisch = SUBSTANCES.filter((substance) => substance.smiles && /C(?![a-z])/.test(substance.formula));
const KATALYSEN: WorkbenchConditions['catalysis'][] = ['keine', 'keine', 'sauer', 'basisch', 'metall', 'lewis'];

const mischungen = Array.from({ length: 1000 }, (_, index) => {
  const count = index % 3 === 2 ? 3 : 2;
  const substances = [wahl(random, organisch)];
  while (substances.length < count) {
    // meist organische Partner, jeder vierte aus der ganzen Datenbank
    const candidate = wahl(random, random() < 0.75 ? organisch : SUBSTANCES);
    if (!substances.some((entry) => entry.id === candidate.id)) substances.push(candidate);
  }
  const conditions: WorkbenchConditions = {
    ...DEFAULT_CONDITIONS,
    temperatureC: ganzzahl(random, -20, 300),
    pressureBar: Number(zahl(random, 0.5, 50).toFixed(2)),
    catalysis: wahl(random, KATALYSEN),
    aqueous: random() < 0.5,
  };
  return { name: `${index + 1}: ${substances.map((entry) => entry.name).join(' + ')}`, substances, conditions };
});

let mitKi = 0;

describe('Massentest Werkbank mit Reaktions-KI', () => {
  it.each(mischungen.map((entry) => [entry.name, entry] as const))('%s', (_, { substances, conditions }) => {
    const result = mix(rdkit, substances, conditions, [], model);
    if (result.outcome === 'gesperrt') {
      expect(result.reactions).toEqual([]);
      return;
    }
    const ids = new Set(substances.map((entry) => entry.id));
    const reactionIds = result.reactions.map((reaction) => reaction.id);
    expect(new Set(reactionIds).size).toBe(reactionIds.length);

    // Vollständige Reaktionen stehen vor denen, denen noch etwas fehlt
    const firstIncomplete = result.reactions.findIndex((reaction) => reaction.missing.length > 0);
    if (firstIncomplete >= 0) expect(result.reactions.slice(firstIncomplete).every((reaction) => reaction.missing.length > 0)).toBe(true);

    const learned = result.reactions.filter((reaction) => reaction.evidence === 'ki');
    if (learned.length) mitKi++;
    for (const reaction of learned) {
      expect(reaction.ai).toBeDefined();
      expect(reaction.reactor).toBeDefined();
      const reactor = reaction.reactor!;
      for (const product of reaction.products) {
        expect(product.smiles).toBeTruthy();
        expect(isPublishableProduct(product.smiles as string, rdkit), product.smiles).toBe(true);
      }
      for (const participant of reaction.participants ?? []) expect(ids.has(participant), participant).toBe(true);
      expect(reactor.halfLife).toBeGreaterThan(0);
      expect(Number.isNaN(reactor.halfLife)).toBe(false);
      // Was nicht läuft, sagt, was fehlt
      if (reactor.verdict !== 'läuft') expect(reaction.missing.length, reaction.title).toBeGreaterThan(0);
      if (!reaction.missing.length) expect(reactor.verdict).toBe('läuft');
      expect(reaction.evidenceNote).toMatch(/neuronales Netz/);
      expect(['hoch', 'mittel', 'gering']).toContain(reaction.confidence);
    }

    // Mehr Wärme macht keine KI-Reaktion langsamer (unterhalb der Pyrolyse)
    const temperature = conditions.temperatureC as number;
    if (learned.length && temperature <= 250) {
      const hotter = mix(rdkit, substances, { ...conditions, temperatureC: temperature + 40 }, [], model);
      for (const reaction of learned) {
        const warm = hotter.reactions.find((entry) => entry.id === reaction.id);
        if (warm?.reactor) expect(warm.reactor.halfLife).toBeLessThanOrEqual(reaction.reactor!.halfLife * 1.000001);
      }
    }
  }, 60_000);

  it('die KI rechnet bei vielen Mischungen mit', () => {
    expect(mitKi / mischungen.length).toBeGreaterThan(0.2);
  });
});
