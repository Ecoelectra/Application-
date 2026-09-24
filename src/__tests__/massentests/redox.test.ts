/**
 * Massentest Redox: Oxidationszahlen aller Stoffe und Ionen, Halbreaktionen
 * in saurer und basischer Lösung sowie alle Kombinationen aus Oxidation und
 * Reduktion werden auf Ladungs- und Atomerhaltung geprüft.
 */
import { describe, expect, it } from 'vitest';
import { parseFormula } from '../../chem/formula';
import { ANIONS, CATIONS } from '../../chem/ions';
import { balanceHalfReaction, combineHalfReactions, oxidationStates, type Medium } from '../../chem/redox';
import { SUBSTANCES } from '../../data/substances';
import { gleichungsFehler, seitenBilanz } from './hilfen';

function ionFormula(formula: string, charge: number): string {
  const magnitude = Math.abs(charge);
  return `${formula}^${magnitude === 1 ? '' : magnitude}${charge > 0 ? '+' : '-'}`;
}

const formeln = Array.from(
  new Set([
    ...SUBSTANCES.map((substance) => substance.formula),
    ...CATIONS.map((entry) => ionFormula(entry.formula, entry.charge)),
    ...ANIONS.map((entry) => ionFormula(entry.formula, entry.charge)),
  ]),
).filter((formula) => {
  try {
    parseFormula(formula);
    return true;
  } catch {
    return false;
  }
});

/** Paare [oxidierte Form, reduzierte Form, Elektronen je Formelumsatz] */
const PAARE: Array<[string, string, number]> = [
  ['MnO4^-', 'Mn2+', 5],
  ['MnO4^-', 'MnO2', 3],
  ['MnO4^-', 'MnO4^2-', 1],
  ['MnO2', 'Mn2+', 2],
  ['Cr2O7^2-', 'Cr3+', 6],
  ['CrO4^2-', 'Cr3+', 3],
  ['NO3^-', 'NO', 3],
  ['NO3^-', 'NO2', 1],
  ['NO3^-', 'NH4+', 8],
  ['NO2^-', 'NO', 1],
  ['Cl2', 'Cl-', 2],
  ['Br2', 'Br-', 2],
  ['I2', 'I-', 2],
  ['O2', 'H2O', 4],
  ['O2', 'H2O2', 2],
  ['H2O2', 'H2O', 2],
  ['O3', 'O2', 2],
  ['Fe3+', 'Fe2+', 1],
  ['Cu2+', 'Cu', 2],
  ['Cu2+', 'Cu+', 1],
  ['Ag+', 'Ag', 1],
  ['Au3+', 'Au', 3],
  ['Hg2+', 'Hg', 2],
  ['Sn4+', 'Sn2+', 2],
  ['ClO3^-', 'Cl-', 6],
  ['ClO^-', 'Cl-', 2],
  ['ClO4^-', 'Cl-', 8],
  ['BrO3^-', 'Br-', 6],
  ['IO3^-', 'I2', 10],
  ['SO4^2-', 'SO2', 2],
  ['SO4^2-', 'H2S', 8],
  ['S', 'H2S', 2],
  ['S2O8^2-', 'SO4^2-', 2],
  ['S4O6^2-', 'S2O3^2-', 2],
  ['PbO2', 'Pb2+', 2],
  ['Ce4+', 'Ce3+', 1],
  ['Co3+', 'Co2+', 1],
  ['CO2', 'C2O4^2-', 2],
  ['H+', 'H2', 2],
  ['Zn2+', 'Zn', 2],
  ['Mg2+', 'Mg', 2],
  ['Al3+', 'Al', 3],
  ['Fe2+', 'Fe', 2],
  ['Ni2+', 'Ni', 2],
  ['Pb2+', 'Pb', 2],
  ['N2', 'NH3', 6],
  ['SO3^2-', 'S', 4],
  ['HCOOH', 'CH3OH', 4],
];

const MEDIEN: Medium[] = ['sauer', 'basisch'];

const halb = PAARE.flatMap(([ox, red, electrons]) =>
  MEDIEN.map((medium) => ({ ox, red, electrons, medium })),
);

/** Oxidationen aus der ersten Hälfte, Reduktionen aus allen Paaren: jede Kombination. */
const kombinationen = PAARE.flatMap(([reducedFrom, reducedTo]) =>
  PAARE.filter(([oxidizedTo]) => oxidizedTo !== reducedFrom).map(([oxidizedTo, oxidizedFrom]) => ({
    oxidation: { from: oxidizedFrom, to: oxidizedTo },
    reduction: { from: reducedFrom, to: reducedTo },
  })),
);

describe('Massentest Redox', () => {
  it('hat mindestens 1000 Fälle', () => {
    expect(formeln.length + halb.length * 2 + kombinationen.length).toBeGreaterThanOrEqual(1000);
  });

  describe('Oxidationszahlen', () => {
    it.each(formeln)('%s', (formula) => {
      const states = oxidationStates(formula);
      if (!states) return; // mehrdeutig, etwa bei organischen Stoffen
      const { counts, charge } = parseFormula(formula);
      expect(Object.keys(states).sort()).toEqual(Object.keys(counts).sort());
      const sum = Object.entries(states).reduce((total, [element, state]) => total + state * counts[element], 0);
      expect(sum).toBeCloseTo(charge, 9);
      for (const [element, state] of Object.entries(states)) {
        expect(Number.isFinite(state)).toBe(true);
        expect(Math.abs(state), element).toBeLessThanOrEqual(8);
      }
    });
  });

  describe('Halbreaktionen', () => {
    it.each(halb.map((entry) => [`${entry.ox} → ${entry.red} (${entry.medium})`, entry] as const))(
      '%s',
      (_, { ox, red, electrons, medium }) => {
        const reduction = balanceHalfReaction(ox, red, medium);
        expect(reduction.kind).toBe('Reduktion');
        expect(reduction.electrons).toBe(electrons);
        expect(gleichungsFehler(reduction.equation)).toEqual([]);
        if (medium === 'basisch') expect(reduction.equation).not.toMatch(/H\+/);

        const oxidation = balanceHalfReaction(red, ox, medium);
        expect(oxidation.kind).toBe('Oxidation');
        expect(oxidation.electrons).toBe(electrons);
        expect(gleichungsFehler(oxidation.equation)).toEqual([]);
      },
    );
  });

  describe('Gesamtgleichungen', () => {
    it.each(
      kombinationen.map((entry) => [`${entry.oxidation.from} + ${entry.reduction.from}`, entry] as const),
    )('%s', (_, { oxidation, reduction }) => {
      for (const medium of MEDIEN) {
        const ox = balanceHalfReaction(oxidation.from, oxidation.to, medium);
        const red = balanceHalfReaction(reduction.from, reduction.to, medium);
        const result = combineHalfReactions(ox, red);
        // keine Elektronen mehr, Atome und Ladung erhalten
        expect(result.equation).not.toMatch(/e-/);
        expect(gleichungsFehler(result.equation)).toEqual([]);
        expect(result.transferredElectrons % ox.electrons).toBe(0);
        expect(result.transferredElectrons % red.electrons).toBe(0);
        // kein Stoff steht auf beiden Seiten
        const [left, right] = result.equation.split(' → ');
        const species = (side: string) =>
          side.split(/\s\+\s/).map((term) => term.replace(/^\d+\s+/, '').trim());
        const shared = species(left).filter((entry) => species(right).includes(entry));
        expect(shared).toEqual([]);
        expect(seitenBilanz(left).ladung).toBe(seitenBilanz(right).ladung);
      }
    });
  });
});
