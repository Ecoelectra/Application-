/**
 * Massentest Formelrechner: alle Formeln der Stoffdatenbank, Vergleich der
 * molaren Masse mit RDKit und 1000 zufällig erzeugte Formeln mit Klammern,
 * Kristallwasser, Ladungen und Unicode-Ziffern.
 */
import { beforeAll, describe, expect, it } from 'vitest';
import type { MainModule } from '@rdkit/rdkit';
import initRDKitModule from '@rdkit/rdkit';
import { ELEMENTS } from '../../chem/elements';
import {
  elementalComposition,
  molarMass,
  molarMassFromCounts,
  parseFormula,
  sameComposition,
  toHillFormula,
} from '../../chem/formula';
import { SUBSTANCES } from '../../data/substances';
import { ganzzahl, relativeAbweichung, wahl, zufall } from './hilfen';

let rdkit: MainModule;

beforeAll(async () => {
  rdkit = await initRDKitModule();
}, 60_000);

const SUB = '₀₁₂₃₄₅₆₇₈₉';
const toSubscript = (text: string) => text.replace(/\d/g, (digit) => SUB[Number(digit)]);

interface ZufallsFormel {
  text: string;
  counts: Record<string, number>;
  charge: number;
}

/** Baut eine zufällige Formel und merkt sich die erwarteten Elementanzahlen. */
function zufallsFormel(random: () => number): ZufallsFormel {
  const symbols = ELEMENTS.slice(0, 86).map((element) => element.symbol);
  const counts: Record<string, number> = {};
  const add = (symbol: string, count: number) => {
    counts[symbol] = (counts[symbol] ?? 0) + count;
  };
  const part = (factor: number): string => {
    let text = '';
    const n = ganzzahl(random, 1, 3);
    for (let i = 0; i < n; i++) {
      const symbol = wahl(random, symbols);
      const count = ganzzahl(random, 1, 12);
      text += count === 1 ? symbol : `${symbol}${count}`;
      add(symbol, count * factor);
    }
    return text;
  };

  let text = part(1);
  if (random() < 0.5) {
    const factor = ganzzahl(random, 2, 4);
    const [open, close] = wahl(random, [['(', ')'], ['[', ']']] as const);
    text += `${open}${part(factor)}${close}${factor}`;
  }
  if (random() < 0.3) {
    const water = ganzzahl(random, 1, 10);
    text += `·${water === 1 ? '' : water}H2O`;
    add('H', 2 * water);
    add('O', water);
  }
  let charge = 0;
  if (random() < 0.3) {
    charge = wahl(random, [-3, -2, -1, 1, 2, 3]);
    const magnitude = Math.abs(charge);
    text += `^${magnitude === 1 ? '' : magnitude}${charge > 0 ? '+' : '-'}`;
  }
  if (random() < 0.3) text = toSubscript(text.replace(/\^.*$/, '')) + (text.match(/\^.*$/)?.[0] ?? '');
  return { text, counts, charge };
}

const random = zufall(20260924);
const zufallsFormeln = Array.from({ length: 1000 }, () => zufallsFormel(random));
const datenbank = SUBSTANCES.map((substance) => substance);

describe('Massentest Formelrechner', () => {
  it('hat mindestens 1000 Fälle', () => {
    expect(zufallsFormeln.length + datenbank.length).toBeGreaterThanOrEqual(1000);
  });

  describe('Stoffdatenbank', () => {
    it.each(datenbank.map((substance) => [substance.formula, substance] as const))('%s', (_, substance) => {
      const { counts } = parseFormula(substance.formula);
      const mass = molarMass(substance.formula);
      expect(mass).toBeGreaterThan(0);
      expect(relativeAbweichung(mass, substance.molarMass)).toBeLessThan(1e-3);
      expect(mass).toBeCloseTo(molarMassFromCounts(counts), 9);

      const composition = elementalComposition(substance.formula);
      expect(composition.reduce((sum, entry) => sum + entry.massPercent, 0)).toBeCloseTo(100, 6);
      expect(sameComposition(substance.formula, toHillFormula(counts))).toBe(true);
      expect(parseFormula(toSubscript(substance.formula)).counts).toEqual(counts);

      if (substance.smiles) {
        const mol = rdkit.get_mol(substance.smiles);
        try {
          const descriptors = JSON.parse(mol!.get_descriptors()) as { amw: number };
          // Salze stehen in der SMILES mitunter ohne Kristallwasser – nur wasserfreie vergleichen
          if (!/[·*]/.test(substance.formula)) {
            expect(relativeAbweichung(mass, descriptors.amw)).toBeLessThan(2e-3);
          }
        } finally {
          mol?.delete();
        }
      }
    });
  });

  describe('Zufallsformeln', () => {
    it.each(zufallsFormeln.map((formel, index) => [index + 1, formel.text, formel] as const))(
      '#%i %s',
      (_, __, formel) => {
        const parsed = parseFormula(formel.text);
        expect(parsed.counts).toEqual(formel.counts);
        expect(parsed.charge).toBe(formel.charge);
        expect(molarMass(formel.text)).toBeCloseTo(molarMassFromCounts(formel.counts), 9);
        const hill = toHillFormula(formel.counts);
        expect(parseFormula(hill).counts).toEqual(formel.counts);
        expect(toHillFormula(parseFormula(hill).counts)).toBe(hill);
      },
    );
  });
});
