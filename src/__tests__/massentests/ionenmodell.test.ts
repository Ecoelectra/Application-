/**
 * Massentest Ionenmodell: Jede Kombination aus Kation und Anion wird zur
 * Salzformel zusammengesetzt, wieder zerlegt und auf Ladungsausgleich,
 * Elementbilanz und Löslichkeitsangabe geprüft – auch als Hydrat.
 */
import { describe, expect, it } from 'vitest';
import { parseFormula } from '../../chem/formula';
import { ANIONS, CATIONS, saltFormula, solubility, solubilityOf, splitHydrate, splitSalt } from '../../chem/ions';

const kombinationen = CATIONS.flatMap((cation) => ANIONS.map((anion) => ({ cation, anion })));
const hydrate = kombinationen
  .filter((_, index) => index % 3 === 0)
  .map((entry, index) => ({ ...entry, water: (index % 12) + 1 }));

const LOESLICHKEIT = ['löslich', 'schwer löslich', 'unlöslich'];

describe('Massentest Ionenmodell', () => {
  it('hat mindestens 1000 Fälle', () => {
    expect(kombinationen.length + hydrate.length).toBeGreaterThanOrEqual(1000);
  });

  it.each(kombinationen.map((entry) => [`${entry.cation.label} + ${entry.anion.label}`, entry] as const))(
    '%s',
    (_, { cation, anion }) => {
      const formula = saltFormula(cation, anion);
      const parsed = parseFormula(formula);
      expect(parsed.charge).toBe(0);

      // Elementbilanz: Kationen × Anzahl + Anionen × Anzahl
      const lcm = (cation.charge * -anion.charge) / gcd(cation.charge, -anion.charge);
      const expected: Record<string, number> = {};
      for (const [ionFormula, count] of [
        [cation.formula, lcm / cation.charge],
        [anion.formula, lcm / -anion.charge],
      ] as const) {
        for (const [element, n] of Object.entries(parseFormula(ionFormula).counts)) {
          expected[element] = (expected[element] ?? 0) + n * count;
        }
      }
      expect(parsed.counts).toEqual(expected);

      // Klammern nur bei mehratomigen Ionen mit Index > 1
      expect(formula).not.toMatch(/\(\w\)/);

      const info = solubility(cation, anion);
      expect(LOESLICHKEIT).toContain(info.solubility);

      const split = splitSalt(formula);
      if (split) {
        // Zerlegung muss neutral sein und dieselbe Summenformel ergeben
        expect(split.cation.charge * split.cationCount + split.anion.charge * split.anionCount).toBe(0);
        expect(parseFormula(saltFormula(split.cation, split.anion)).counts).toEqual(parsed.counts);
        expect(split.hydrate).toBe(0);
        expect(LOESLICHKEIT).toContain(solubilityOf(formula)?.solubility);
      } else {
        // nur molekulare Stoffe wie H2O, HCl oder NH3 werden bewusst nicht zerlegt
        expect(['H2O', 'H2O2', 'H2S', 'NH3', 'CH4', 'HF', 'HCl', 'HBr', 'HI', 'HCN']).toContain(formula);
      }
    },
  );

  it.each(hydrate.map((entry) => [`${saltFormula(entry.cation, entry.anion)}·${entry.water}H2O`, entry] as const))(
    '%s',
    (text, { cation, anion, water }) => {
      const anhydrous = saltFormula(cation, anion);
      expect(splitHydrate(text)).toEqual({ rest: anhydrous, hydrate: water });
      const parsed = parseFormula(text).counts;
      const base = parseFormula(anhydrous).counts;
      expect(parsed.H ?? 0).toBe((base.H ?? 0) + 2 * water);
      expect(parsed.O ?? 0).toBe((base.O ?? 0) + water);
      const split = splitSalt(text);
      if (split) {
        expect(split.hydrate).toBe(water);
        expect(split.anhydrous).toBe(anhydrous);
      }
    },
  );
});

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}
