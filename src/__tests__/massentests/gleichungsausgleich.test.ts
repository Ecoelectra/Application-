/**
 * Massentest Gleichungsausgleich: Verbrennungen aller C/H/O/N/S-Verbindungen
 * der Stoffdatenbank und sämtliche anorganischen Paarreaktionen werden neu
 * ausgeglichen und auf Atom- und Ladungserhaltung geprüft.
 */
import { describe, expect, it } from 'vitest';
import { balanceEquation, balanceSpecies, checkBalance } from '../../chem/balance';
import { parseFormula } from '../../chem/formula';
import { reactPair } from '../../chem/inorganicRules';
import { SUBSTANCES } from '../../data/substances';
import { ggT, gleichungsFehler } from './hilfen';

interface Fall {
  name: string;
  reactants: string[];
  products: string[];
  /** Gleichung, wie die App sie anzeigt – muss ebenfalls stimmen */
  angezeigt?: string;
}

function verbrennung(formula: string): Fall | null {
  let counts: Record<string, number>;
  try {
    counts = parseFormula(formula).counts;
  } catch {
    return null;
  }
  const elements = Object.keys(counts);
  if (!counts.C || !elements.every((element) => ['C', 'H', 'O', 'N', 'S'].includes(element))) return null;
  // Stoffe wie H2CO3, die keinen Sauerstoff mehr aufnehmen, verbrennen nicht
  const sauerstoffBedarf = 2 * counts.C + (counts.H ?? 0) / 2 + 2 * (counts.S ?? 0) - (counts.O ?? 0);
  if (sauerstoffBedarf <= 0) return null;
  const products = ['CO2'];
  if (counts.H) products.push('H2O');
  if (counts.N) products.push('N2');
  if (counts.S) products.push('SO2');
  return { name: `Verbrennung ${formula}`, reactants: [formula, 'O2'], products };
}

const verbrennungen = Array.from(new Set(SUBSTANCES.map((substance) => substance.formula)))
  .map(verbrennung)
  .filter((fall): fall is Fall => fall !== null);

const anorganisch = SUBSTANCES.filter((substance) => !substance.smiles);
const paarReaktionen: Fall[] = [];
const gesehen = new Set<string>();
for (let i = 0; i < anorganisch.length; i++) {
  for (let j = i + 1; j < anorganisch.length; j++) {
    for (const reaction of reactPair(anorganisch[i], anorganisch[j])) {
      if (gesehen.has(reaction.equation)) continue;
      gesehen.add(reaction.equation);
      paarReaktionen.push({
        name: reaction.equation,
        reactants: reaction.reactants,
        products: reaction.products,
        angezeigt: reaction.equation,
      });
    }
  }
}

const faelle = [...verbrennungen, ...paarReaktionen];

describe('Massentest Gleichungsausgleich', () => {
  it('hat mindestens 1000 Fälle', () => {
    expect(faelle.length).toBeGreaterThanOrEqual(1000);
  });

  it.each(faelle.map((fall) => [fall.name, fall] as const))('%s', (_, fall) => {
    const result = balanceSpecies(fall.reactants, fall.products);
    const all = [...result.reactants, ...result.products];

    // positive, ganzzahlige, teilerfremde Koeffizienten
    for (const entry of all) {
      expect(Number.isInteger(entry.coefficient)).toBe(true);
      expect(entry.coefficient).toBeGreaterThan(0);
    }
    expect(all.map((entry) => entry.coefficient).reduce(ggT)).toBe(1);

    // Atome bleiben erhalten – nach checkBalance und nach dem eigenen Zähler
    expect(checkBalance(result.reactants, result.products).differences).toEqual({});
    expect(gleichungsFehler(result.equation)).toEqual([]);

    // die formatierte Gleichung lässt sich wieder einlesen und ergibt dasselbe
    expect(balanceEquation(result.equation).equation).toBe(result.equation);

    // Reihenfolge der Edukte ändert die Koeffizienten nicht
    const reversed = balanceSpecies([...fall.reactants].reverse(), fall.products);
    const byFormula = (entries: typeof all) =>
      Object.fromEntries(entries.map((entry) => [entry.formula, entry.coefficient]));
    if (!result.warnings.length) {
      expect(byFormula([...reversed.reactants, ...reversed.products])).toEqual(byFormula(all));
    }

    if (fall.angezeigt) expect(gleichungsFehler(fall.angezeigt)).toEqual([]);
  });
});
