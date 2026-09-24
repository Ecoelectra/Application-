/**
 * Massentest Stöchiometrie: 1000 zufällige Ansätze mit Stoffen aus der
 * Datenbank. Geprüft werden Umkehrbarkeit der Umrechnungen, das
 * Unterschussreagenz, Ausbeute, Atomökonomie und Verdünnungen.
 */
import { describe, expect, it } from 'vitest';
import { molarMass } from '../../chem/formula';
import {
  atomEconomy,
  dilutionVolume,
  limitingReagent,
  massForSolution,
  massFromAmount,
  percentYield,
  planReagents,
  toAmount,
} from '../../chem/stoichiometry';
import { SUBSTANCES } from '../../data/substances';
import { ganzzahl, relativeAbweichung, wahl, zahl, zufall } from './hilfen';

const random = zufall(1000);
const stoffe = SUBSTANCES.filter((substance) => substance.molarMass > 0);

const ansaetze = Array.from({ length: 1000 }, (_, index) => {
  const educts = Array.from({ length: ganzzahl(random, 1, 4) }, (__, i) => ({
    name: `E${i + 1}`,
    substance: wahl(random, stoffe),
    amount: zahl(random, 0.001, 5),
    coefficient: ganzzahl(random, 1, 6),
    equivalents: zahl(random, 0.1, 5),
    density: zahl(random, 0.6, 2.5),
    concentration: zahl(random, 0.05, 18),
  }));
  return {
    index: index + 1,
    educts,
    productCoefficient: ganzzahl(random, 1, 4),
    mass: zahl(random, 0.01, 500),
    purity: zahl(random, 0.5, 1),
    volume: zahl(random, 1, 2000),
    stock: zahl(random, 0.1, 18),
    fraction: random(),
    yieldFraction: zahl(random, 0, 1),
  };
});

describe('Massentest Stöchiometrie', () => {
  it('hat 1000 Ansätze', () => {
    expect(ansaetze).toHaveLength(1000);
  });

  it.each(ansaetze.map((ansatz) => [ansatz.index, ansatz] as const))('Ansatz #%i', (_, ansatz) => {
    const [first] = ansatz.educts;
    const M = molarMass(first.substance.formula);

    // Masse ↔ Stoffmenge, auch mit Reinheit
    const n = toAmount({ mass: ansatz.mass, purity: ansatz.purity }, M);
    expect(massFromAmount(n, M) / ansatz.purity).toBeCloseTo(ansatz.mass, 6);
    expect(toAmount({ amount: n }, M)).toBe(n);

    // Volumen mit Dichte bzw. Konzentration
    const byDensity = toAmount({ volume: ansatz.volume, density: first.density }, M);
    expect(relativeAbweichung(byDensity * M, ansatz.volume * first.density)).toBeLessThan(1e-12);
    const bySolution = toAmount({ volume: ansatz.volume, concentration: first.concentration }, M);
    expect(relativeAbweichung(bySolution, (ansatz.volume / 1000) * first.concentration)).toBeLessThan(1e-12);
    const einwaage = massForSolution(first.concentration, ansatz.volume, M, ansatz.purity);
    expect(relativeAbweichung(toAmount({ mass: einwaage, purity: ansatz.purity }, M), bySolution)).toBeLessThan(1e-9);

    // Unterschussreagenz: kleinstes n/ν, Ausnutzung zwischen 0 und 1
    const result = limitingReagent(
      ansatz.educts.map((educt) => ({ name: educt.name, amount: educt.amount, coefficient: educt.coefficient })),
      ansatz.productCoefficient,
    );
    const ratios = ansatz.educts.map((educt) => educt.amount / educt.coefficient);
    const smallest = Math.min(...ratios);
    expect(relativeAbweichung(result.maxProductAmount, smallest * ansatz.productCoefficient)).toBeLessThan(1e-12);
    expect(result.utilisation[result.limiting]).toBeCloseTo(1, 12);
    for (const educt of ansatz.educts) {
      expect(result.utilisation[educt.name]).toBeGreaterThan(0);
      expect(result.utilisation[educt.name]).toBeLessThanOrEqual(1 + 1e-12);
      // verbrauchte Menge übersteigt nie die vorhandene
      expect(smallest * educt.coefficient).toBeLessThanOrEqual(educt.amount * (1 + 1e-12));
    }

    // Ausbeute
    const theoretical = result.maxProductAmount * M;
    const actual = theoretical * ansatz.yieldFraction;
    expect(percentYield(actual, theoretical)).toBeCloseTo(ansatz.yieldFraction * 100, 8);

    // Atomökonomie: 100 %, wenn das Produkt alle Edukte enthält
    const masses = ansatz.educts.map((educt) => molarMass(educt.substance.formula));
    const total = masses.reduce((sum, value) => sum + value, 0);
    expect(atomEconomy(total, masses)).toBeCloseTo(100, 8);
    expect(atomEconomy(total * ansatz.fraction, masses)).toBeCloseTo(ansatz.fraction * 100, 8);

    // Verdünnung c1·V1 = c2·V2 und keine Aufkonzentration
    const target = ansatz.stock * ansatz.fraction;
    const v1 = dilutionVolume(ansatz.stock, target, ansatz.volume);
    expect(relativeAbweichung(ansatz.stock * v1, target * ansatz.volume)).toBeLessThan(1e-12);
    expect(v1).toBeLessThanOrEqual(ansatz.volume);
    expect(() => dilutionVolume(ansatz.stock, ansatz.stock * 1.5, ansatz.volume)).toThrow();

    // Ansatzplanung: Stoffmenge = Substrat · Äquivalente, Masse = n · M
    const plan = planReagents(
      n,
      ansatz.educts.map((educt) => ({
        name: educt.name,
        formula: educt.substance.formula,
        equivalents: educt.equivalents,
        density: educt.density,
      })),
    );
    plan.forEach((entry, i) => {
      const educt = ansatz.educts[i];
      expect(relativeAbweichung(entry.amount, n * educt.equivalents)).toBeLessThan(1e-12);
      expect(relativeAbweichung(entry.mass, entry.amount * molarMass(educt.substance.formula))).toBeLessThan(1e-12);
      expect(relativeAbweichung(entry.volume ?? 0, entry.mass / educt.density)).toBeLessThan(1e-12);
    });
  });
});
