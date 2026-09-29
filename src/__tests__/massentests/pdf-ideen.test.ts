/**
 * Massentest PDF-Ideen: 1000 Stoffe der Datenbank, jeweils mit Namen, gebeugt
 * oder als CAS-Nummer in einem Satz versteckt – die Erkennung muss den Stoff
 * (oder einen gleichnamigen) finden. Dazu 60 zufällige Stofflisten durch die
 * Ideensuche: keine gesperrten Mischungen, nur Reaktionen der Liste, sortiert.
 */
import { beforeAll, describe, expect, it } from 'vitest';
import type { MainModule } from '@rdkit/rdkit';
import initRDKitModule from '@rdkit/rdkit';
import { recognizeSubstances } from '../../chem/textSubstances';
import { findReactionIdeas } from '../../chem/pdfIdeas';
import { mixtureWarning } from '../../chem/safety';
import { SUBSTANCES } from '../../data/substances';
import { stichprobe, wahl, zufall } from './hilfen';

let rdkit: MainModule;

beforeAll(async () => {
  rdkit = await initRDKitModule();
}, 60_000);

/** Stoffe mit eindeutigem, erkennbarem Namen (mindestens 4 Zeichen, kein Kürzel) */
const kandidaten = SUBSTANCES.filter((substance) => substance.name.length >= 4 && !/^[A-Z0-9]{2,6}$/.test(substance.name));
const proben = stichprobe(kandidaten, 1000);
const SAETZE = [
  (name: string) => `Im Schrank steht ${name}.`,
  (name: string) => `Man gibt vorsichtig ${name} (etwa 2 g) in das Becherglas.`,
  (name: string) => `„${name}“, Reinheit 99 %, Lagerklasse 6.1`,
  (name: string) => `Tabelle 3: ${name}; Menge: 100 mL`,
];

function sameName(a: string, b: string): boolean {
  return a.toLowerCase() === b.toLowerCase();
}

describe('Massentest Stofferkennung', () => {
  it.each(proben.map((substance, index) => [substance.name, substance, index] as const))('%s', (_, substance, index) => {
    const satz = SAETZE[index % SAETZE.length](substance.name);
    const found = recognizeSubstances(satz);
    // Allgemeine Wörter (Base, Glas …) werden absichtlich nicht als Stoff gelesen
    if (!found.length) {
      expect(['base', 'säure', 'salz', 'glas', 'metall', 'kohle', 'kalk', 'soda', 'gips', 'rost', 'essig', 'zucker', 'blei', 'zinn', 'probe', 'erde', 'luft']).toContain(substance.name.toLowerCase());
      return;
    }
    expect(found.some((entry) => entry.substance.id === substance.id || sameName(entry.substance.name, substance.name) || entry.substance.synonyms.some((synonym) => sameName(synonym, substance.name))), `${satz} → ${found.map((entry) => entry.substance.name).join(', ')}`).toBe(true);
    if (substance.cas) {
      const byCas = recognizeSubstances(`CAS-Nr. ${substance.cas}`);
      expect(byCas.length).toBeLessThanOrEqual(1);
    }
  });
});

const random = zufall(4242);
const listen = Array.from({ length: 60 }, (_, index) => {
  const size = 3 + (index % 4);
  const list = new Map<string, (typeof SUBSTANCES)[number]>();
  while (list.size < size) {
    const substance = wahl(random, SUBSTANCES);
    list.set(substance.id, substance);
  }
  return { name: `${index + 1}: ${[...list.values()].map((entry) => entry.name).join(', ')}`, substances: [...list.values()] };
});

describe('Massentest Ideensuche', () => {
  it.each(listen.map((entry) => [entry.name, entry.substances] as const))('%s', async (_, substances) => {
    const ideas = await findReactionIdeas(rdkit, null, substances);
    const ids = new Set(substances.map((entry) => entry.id));
    for (let i = 0; i < ideas.length; i++) {
      const idea = ideas[i];
      if (i > 0) expect(ideas[i - 1].score).toBeGreaterThanOrEqual(idea.score);
      expect(idea.substances).toHaveLength(2);
      for (const substance of idea.substances) expect(ids.has(substance.id)).toBe(true);
      expect(mixtureWarning(idea.substances.map((entry) => entry.id))).toBeUndefined();
      expect(idea.reaction.kind).not.toBe('physikalisch');
      expect(Number.isFinite(idea.score)).toBe(true);
    }
  }, 120_000);
});
