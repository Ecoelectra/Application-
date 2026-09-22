/**
 * Ausgleichen von Reaktionsgleichungen über den Nullraum der Elementmatrix.
 *
 * Für jede Spezies wird eine Spalte, für jedes Element (plus eine Zeile für die
 * Ladung) eine Zeile aufgestellt. Produkte gehen mit negativem Vorzeichen ein,
 * sodass eine ausgeglichene Gleichung genau eine Lösung von A·x = 0 mit x > 0 ist.
 */
import { Fraction, toSmallestIntegers } from './fraction';
import { parseFormula } from './formula';

export interface EquationSide {
  formula: string;
  coefficient: number;
}

export interface ParsedEquation {
  reactants: string[];
  products: string[];
}

export interface BalanceResult {
  reactants: EquationSide[];
  products: EquationSide[];
  /** Fertig formatierte Gleichung, z. B. "2 H2 + O2 → 2 H2O" */
  equation: string;
  /** Hinweise, etwa wenn mehrere unabhängige Lösungen existieren. */
  warnings: string[];
}

const ARROW = /(<=>|<->|-->|->|=>|→|⇌|⟶|=)/;

/** Zerlegt "Fe + O2 -> Fe2O3" in Edukte und Produkte. */
export function parseEquation(input: string): ParsedEquation {
  const parts = input.split(ARROW).filter((p) => !ARROW.test(p));
  if (parts.length !== 2) {
    throw new Error('Die Gleichung braucht genau einen Reaktionspfeil (z. B. "->" oder "=").');
  }
  const side = (text: string): string[] => {
    const trimmed = text.trim();
    // Bei Ionengleichungen ist "+" sowohl Trennzeichen als auch Ladung ("Fe2+ + H+").
    // Enthält die Seite ein umschlossenes Pluszeichen, gilt nur dieses als Trenner.
    const terms = /\s\+\s/.test(trimmed) ? trimmed.split(/\s\+\s/) : trimmed.split('+');
    return terms
      .map((s) => s.trim())
      .filter(Boolean)
      // führende stöchiometrische Zahlen entfernen, sie werden neu berechnet
      .map((s) => s.replace(/^\d+\s*(?=[A-Z(\[])/, ''));
  };

  const reactants = side(parts[0]);
  const products = side(parts[1]);
  if (!reactants.length || !products.length) {
    throw new Error('Auf beiden Seiten der Gleichung muss mindestens ein Stoff stehen.');
  }
  return { reactants, products };
}

/** Reduzierte Stufenform; verändert die Matrix in-place und liefert die Pivotspalten. */
function rref(matrix: Fraction[][]): number[] {
  const rows = matrix.length;
  const cols = rows > 0 ? matrix[0].length : 0;
  const pivots: number[] = [];
  let row = 0;

  for (let col = 0; col < cols && row < rows; col++) {
    let pivotRow = -1;
    for (let r = row; r < rows; r++) {
      if (!matrix[r][col].isZero()) {
        pivotRow = r;
        break;
      }
    }
    if (pivotRow === -1) continue;

    [matrix[row], matrix[pivotRow]] = [matrix[pivotRow], matrix[row]];

    const pivot = matrix[row][col];
    matrix[row] = matrix[row].map((v) => v.div(pivot));

    for (let r = 0; r < rows; r++) {
      if (r === row || matrix[r][col].isZero()) continue;
      const factor = matrix[r][col];
      matrix[r] = matrix[r].map((v, c) => v.sub(factor.mul(matrix[row][c])));
    }
    pivots.push(col);
    row++;
  }
  return pivots;
}

/** Basis des Nullraums der Matrix. */
function nullSpace(matrix: Fraction[][], cols: number): Fraction[][] {
  const work = matrix.map((r) => [...r]);
  const pivots = rref(work);
  const freeCols = Array.from({ length: cols }, (_, i) => i).filter((c) => !pivots.includes(c));

  return freeCols.map((free) => {
    const vector = Array.from({ length: cols }, () => Fraction.ZERO);
    vector[free] = Fraction.ONE;
    pivots.forEach((pivotCol, pivotRow) => {
      vector[pivotCol] = work[pivotRow][free].neg();
    });
    return vector;
  });
}

/** Sucht eine Linearkombination der Basisvektoren mit ausschließlich positiven Einträgen. */
function findPositiveSolution(basis: Fraction[][]): Fraction[] | null {
  const allPositive = (v: Fraction[]): boolean => v.every((x) => !x.isZero() && !x.isNegative());

  for (const vector of basis) {
    if (allPositive(vector)) return vector;
    const negated = vector.map((x) => x.neg());
    if (allPositive(negated)) return negated;
  }

  if (basis.length > 1) {
    const range = [-4, -3, -2, -1, 1, 2, 3, 4];
    const combine = (coeffs: number[]): Fraction[] =>
      basis[0].map((_, i) =>
        coeffs.reduce(
          (sum, c, k) => sum.add(basis[k][i].mul(new Fraction(BigInt(c)))),
          Fraction.ZERO,
        ),
      );
    if (basis.length === 2) {
      for (const a of range) {
        for (const b of range) {
          const candidate = combine([a, b]);
          if (allPositive(candidate)) return candidate;
        }
      }
    } else {
      for (const a of range) {
        for (const b of range) {
          for (const c of range) {
            const candidate = combine([a, b, c, ...Array(basis.length - 3).fill(0)]);
            if (allPositive(candidate)) return candidate;
          }
        }
      }
    }
  }
  return null;
}

export function formatEquation(reactants: EquationSide[], products: EquationSide[]): string {
  const side = (items: EquationSide[]): string =>
    items
      .map((item) => (item.coefficient === 1 ? item.formula : `${item.coefficient} ${item.formula}`))
      .join(' + ');
  return `${side(reactants)} → ${side(products)}`;
}

/** Gleicht eine Reaktionsgleichung aus. */
export function balanceEquation(input: string): BalanceResult {
  const { reactants, products } = parseEquation(input);
  return balanceSpecies(reactants, products);
}

export function balanceSpecies(reactants: string[], products: string[]): BalanceResult {
  const species = [...reactants, ...products];
  const parsed = species.map((formula) => {
    try {
      return parseFormula(formula);
    } catch (error) {
      throw new Error(`«${formula}» konnte nicht gelesen werden: ${(error as Error).message}`);
    }
  });

  const elements = Array.from(
    new Set(parsed.flatMap((p) => Object.keys(p.counts))),
  ).sort();
  const hasCharge = parsed.some((p) => p.charge !== 0);

  const matrix: Fraction[][] = elements.map((element) =>
    parsed.map((p, index) => {
      const count = p.counts[element] ?? 0;
      const signed = index < reactants.length ? count : -count;
      return new Fraction(BigInt(signed));
    }),
  );

  if (hasCharge) {
    matrix.push(
      parsed.map((p, index) =>
        new Fraction(BigInt(index < reactants.length ? p.charge : -p.charge)),
      ),
    );
  }

  const basis = nullSpace(matrix, species.length);
  const warnings: string[] = [];

  if (basis.length === 0) {
    throw new Error(
      'Diese Gleichung lässt sich nicht ausgleichen – bitte Formeln und Stoffe prüfen.',
    );
  }
  if (basis.length > 1) {
    warnings.push(
      `Das Gleichungssystem hat ${basis.length} unabhängige Lösungen (z. B. weil eine Teilreaktion ` +
        'mehrfach enthalten ist). Angezeigt wird eine chemisch sinnvolle Lösung.',
    );
  }

  const solution = findPositiveSolution(basis);
  if (!solution) {
    throw new Error(
      'Es gibt keine Lösung mit ausschließlich positiven Koeffizienten. Stehen alle Stoffe auf der richtigen Seite?',
    );
  }

  const integers = toSmallestIntegers(solution);
  const coefficients = integers.map((v) => Number(v));

  const resultReactants = reactants.map((formula, i) => ({
    formula,
    coefficient: coefficients[i],
  }));
  const resultProducts = products.map((formula, i) => ({
    formula,
    coefficient: coefficients[reactants.length + i],
  }));

  return {
    reactants: resultReactants,
    products: resultProducts,
    equation: formatEquation(resultReactants, resultProducts),
    warnings,
  };
}

/** Prüft, ob eine Gleichung mit gegebenen Koeffizienten stimmig ist. */
export function checkBalance(
  reactants: EquationSide[],
  products: EquationSide[],
): { balanced: boolean; differences: Record<string, number> } {
  const tally: Record<string, number> = {};
  const add = (items: EquationSide[], sign: number): void => {
    for (const item of items) {
      const { counts } = parseFormula(item.formula);
      for (const [element, count] of Object.entries(counts)) {
        tally[element] = (tally[element] ?? 0) + sign * count * item.coefficient;
      }
    }
  };
  add(reactants, 1);
  add(products, -1);
  const differences = Object.fromEntries(Object.entries(tally).filter(([, v]) => v !== 0));
  return { balanced: Object.keys(differences).length === 0, differences };
}
