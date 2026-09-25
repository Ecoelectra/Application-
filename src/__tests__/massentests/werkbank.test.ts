/**
 * Massentest Werkbank: 1500 zufällige Mischungen aus zwei oder drei Stoffen
 * der Datenbank unter zufälligen Bedingungen, die Hälfte davon mit
 * eingestellter Temperatur und eingestelltem Druck. Jedes Stoffpaar muss eine
 * Aussage bekommen (Reaktion, Vorhersage oder «keine Reaktion»). Die Werkbank darf nie abstürzen,
 * muss gefährliche Gemische sperren, darf nur gültige und zulässige Produkte
 * zeigen und muss ausgeglichene Gleichungen liefern.
 */
import { beforeAll, describe, expect, it } from 'vitest';
import type { MainModule } from '@rdkit/rdkit';
import initRDKitModule from '@rdkit/rdkit';
import { parseFormula } from '../../chem/formula';
import { canonicalSmiles } from '../../chem/rdkit';
import { isPublishableProduct, mixtureWarning } from '../../chem/safety';
import { mix, temperatureRange, type WorkbenchConditions } from '../../chem/workbench';
import { SUBSTANCES } from '../../data/substances';
import { ganzzahl, gleichungsFehler, wahl, zufall } from './hilfen';

let rdkit: MainModule;

beforeAll(async () => {
  rdkit = await initRDKitModule();
}, 60_000);

const random = zufall(4711);
const TEMPERATUREN: WorkbenchConditions['temperature'][] = ['kalt', 'raum', 'heiss'];
const KATALYSEN: WorkbenchConditions['catalysis'][] = ['keine', 'sauer', 'basisch', 'metall', 'lewis'];

/** Anorganische Stoffe, damit genügend Gleichungen auf Ausgleich geprüft werden. */
const ANORGANISCH = SUBSTANCES.filter((substance) => !substance.smiles && substance.category !== 'Nachweisreagenz');

const mischungen = Array.from({ length: 1500 }, (_, index) => {
  const count = random() < 0.75 ? 2 : 3;
  const ids = new Set<string>();
  const pool = index < 1000 ? SUBSTANCES : ANORGANISCH;
  while (ids.size < count) ids.add(wahl(random, pool).id);
  const conditions: WorkbenchConditions = {
    temperature: wahl(random, TEMPERATUREN),
    catalysis: wahl(random, KATALYSEN),
    aqueous: random() < 0.6,
    light: random() < 0.15,
    electrolysis: random() < 0.1,
  };
  // Die Hälfte der Mischungen mit Temperatur- und Druckregler
  if (random() < 0.5) {
    conditions.temperatureC = ganzzahl(random, -80, 1100);
    conditions.pressureBar = Number((10 ** (random() * 5.5 - 3)).toPrecision(3));
    conditions.temperature = temperatureRange(conditions.temperatureC);
  }
  return { index: index + 1, ids: [...ids], conditions, seed: ganzzahl(random, 0, 1) };
});

/** Gleichung nur prüfen, wenn alle Teilchen als Summenformel lesbar sind. */
function pruefbar(equation: string): boolean {
  const sides = equation.split(/\s*(?:→|⇌)\s*/);
  if (sides.length !== 2) return false;
  return sides.every((side) =>
    side.split(/\s\+\s/).every((term) => {
      const species = term.trim().replace(/^\d+\s+/, '');
      if (!/^[A-Z(\[]/.test(species) || /[a-z]{3,}/.test(species)) return false;
      try {
        parseFormula(species);
        return true;
      } catch {
        return false;
      }
    }),
  );
}

let geprueft = 0;

/** Gleichung ohne Rücksicht auf die Reihenfolge der Teilchen je Seite. */
function stoffumsatz(reaction: { equation: string }): string {
  return reaction.equation
    .split(/\s*(?:→|⇌)\s*/)
    .map((side) => side.split(/\s\+\s/).map((term) => term.trim()).sort().join(' + '))
    .join(' → ');
}

describe('Massentest Werkbank', () => {
  it('hat 1500 Mischungen', () => {
    expect(mischungen).toHaveLength(1500);
  });

  it.each(mischungen.map((m) => [m.index, m.ids.join(' + '), m] as const))('#%i %s', (_, __, m) => {
    const substances = m.ids.map((id) => SUBSTANCES.find((substance) => substance.id === id)!);
    const result = mix(rdkit, substances, m.conditions);

    // gefährliche Gemische werden immer gesperrt
    if (mixtureWarning(m.ids)) {
      expect(result.outcome).toBe('gesperrt');
      expect(result.reactions).toEqual([]);
      expect(result.blocked).toBeTruthy();
      return;
    }
    expect(result.outcome).not.toBe('gesperrt');
    expect(result.outcome === 'reaktion').toBe(result.reactions.length > 0);
    if (result.outcome === 'keine-reaktion') expect(result.hints.length).toBeGreaterThan(0);

    const ids = new Set<string>();
    let incompleteSeen = false;
    for (const reaction of result.reactions) {
      expect(ids.has(reaction.id), `doppelte Reaktion ${reaction.id}`).toBe(false);
      ids.add(reaction.id);
      expect(reaction.equation.length).toBeGreaterThan(0);
      expect(reaction.products.length).toBeGreaterThan(0);

      // vollständige Reaktionen stehen vor unvollständigen
      if (reaction.missing.length) incompleteSeen = true;
      else expect(incompleteSeen).toBe(false);

      for (const product of reaction.products) {
        expect(product.smiles || product.formula || product.name).toBeTruthy();
        if (product.smiles) {
          expect(canonicalSmiles(rdkit, product.smiles), product.smiles).not.toBeNull();
          expect(isPublishableProduct(product.smiles, rdkit)).toBe(true);
        }
      }

      if (reaction.kind === 'anorganisch' && pruefbar(reaction.equation)) {
        expect(gleichungsFehler(reaction.equation), reaction.equation).toEqual([]);
        geprueft++;
      }
      if (reaction.ionicEquation && pruefbar(reaction.ionicEquation)) {
        expect(gleichungsFehler(reaction.ionicEquation), reaction.ionicEquation).toEqual([]);
      }
    }

    // Für jedes Stoffpaar gibt es eine Aussage: Reaktion, Vorhersage oder «keine Reaktion»
    const partner = substances.filter((substance) => substance.category !== 'Nachweisreagenz');
    for (let i = 0; i < partner.length; i++) {
      for (let j = i + 1; j < partner.length; j++) {
        const paar = [partner[i].id, partner[j].id];
        const passt = (reaction: { participants?: string[] }) => paar.every((id) => reaction.participants?.includes(id));
        expect(
          result.reactions.some(passt) || (result.pairOutcomes ?? []).some(passt),
          `keine Aussage für ${paar.join(' + ')}`,
        ).toBe(true);
      }
    }
    for (const outcome of result.pairOutcomes ?? []) {
      expect(outcome.evidence).toBe('vorhersage');
      expect(outcome.confidence).toBeDefined();
      expect(outcome.observation.length).toBeGreaterThan(10);
    }
    for (const reaction of result.reactions) {
      if (reaction.evidence === 'vorhersage' && reaction.tags.includes('Vorhersage')) expect(reaction.confidence).toBeDefined();
    }

    // Reihenfolge der Stoffe spielt keine Rolle
    const reversed = mix(rdkit, [...substances].reverse(), m.conditions);
    expect(reversed.outcome).toBe(result.outcome);
    expect(new Set(reversed.reactions.map(stoffumsatz))).toEqual(new Set(result.reactions.map(stoffumsatz)));
  });

  it('hat viele Gleichungen auf Ausgleich geprüft', () => {
    expect(geprueft).toBeGreaterThan(50);
  });
});
