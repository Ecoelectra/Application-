/** Stöchiometrische Rechnungen für die Ansatzplanung. */
import { molarMass } from './formula';

export interface AmountInput {
  /** Masse in g */
  mass?: number;
  /** Stoffmenge in mol */
  amount?: number;
  /** Volumen in mL (für Flüssigkeiten) */
  volume?: number;
  /** Dichte in g/mL */
  density?: number;
  /** Konzentration in mol/L (für Lösungen) */
  concentration?: number;
  /** Reinheit als Anteil (0…1) */
  purity?: number;
}

export interface ReagentPlan {
  name: string;
  formula?: string;
  molarMass: number;
  equivalents: number;
  amount: number;
  mass: number;
  /** Volumen in mL, sofern Dichte oder Konzentration bekannt sind */
  volume?: number;
}

/** Rechnet eine beliebige Mengenangabe in eine Stoffmenge um. */
export function toAmount(input: AmountInput, molarMassValue: number): number {
  const purity = input.purity ?? 1;

  if (input.amount !== undefined) return input.amount;
  if (input.mass !== undefined) return (input.mass * purity) / molarMassValue;
  if (input.volume !== undefined && input.concentration !== undefined) {
    return (input.volume / 1000) * input.concentration;
  }
  if (input.volume !== undefined && input.density !== undefined) {
    return (input.volume * input.density * purity) / molarMassValue;
  }
  throw new Error('Zu wenig Angaben: Masse, Stoffmenge oder Volumen mit Dichte bzw. Konzentration.');
}

/** Masse aus Stoffmenge. */
export function massFromAmount(amount: number, molarMassValue: number): number {
  return amount * molarMassValue;
}

/**
 * Plant die Einwaagen für einen Ansatz.
 * Bezugsgröße ist die Stoffmenge des Substrats.
 */
export function planReagents(
  substrateAmount: number,
  reagents: Array<{ name: string; formula?: string; equivalents: number; density?: number; concentration?: number }>,
): ReagentPlan[] {
  return reagents.map((reagent) => {
    let mass = 0;
    let molar = 0;
    if (reagent.formula) {
      try {
        molar = molarMass(reagent.formula);
      } catch {
        molar = 0;
      }
    }
    const amount = substrateAmount * reagent.equivalents;
    mass = molar > 0 ? amount * molar : 0;

    let volume: number | undefined;
    if (reagent.concentration) volume = (amount / reagent.concentration) * 1000;
    else if (reagent.density && mass > 0) volume = mass / reagent.density;

    return {
      name: reagent.name,
      formula: reagent.formula,
      molarMass: molar,
      equivalents: reagent.equivalents,
      amount,
      mass,
      volume,
    };
  });
}

export interface LimitingReagentResult {
  limiting: string;
  /** maximale Produktstoffmenge in mol */
  maxProductAmount: number;
  /** Ausnutzung je Edukt (1 = vollständig verbraucht) */
  utilisation: Record<string, number>;
}

/**
 * Bestimmt das Unterschussreagenz.
 * `stoichiometry` gibt die Koeffizienten der ausgeglichenen Gleichung an.
 */
export function limitingReagent(
  reactants: Array<{ name: string; amount: number; coefficient: number }>,
  productCoefficient = 1,
): LimitingReagentResult {
  if (!reactants.length) throw new Error('Es wurde kein Edukt angegeben.');

  const ratios = reactants.map((reactant) => ({
    name: reactant.name,
    ratio: reactant.amount / reactant.coefficient,
  }));
  const smallest = ratios.reduce((min, entry) => (entry.ratio < min.ratio ? entry : min));

  const utilisation: Record<string, number> = {};
  for (const entry of ratios) {
    utilisation[entry.name] = entry.ratio > 0 ? smallest.ratio / entry.ratio : 0;
  }

  return {
    limiting: smallest.name,
    maxProductAmount: smallest.ratio * productCoefficient,
    utilisation,
  };
}

/** Ausbeute in Prozent. */
export function percentYield(actualMass: number, theoreticalMass: number): number {
  if (theoreticalMass <= 0) throw new Error('Die theoretische Ausbeute muss größer als null sein.');
  return (actualMass / theoreticalMass) * 100;
}

/** Atomökonomie nach Trost: Anteil der Eduktmasse, der im Produkt landet. */
export function atomEconomy(productMolarMass: number, reactantMolarMasses: number[]): number {
  const total = reactantMolarMasses.reduce((sum, value) => sum + value, 0);
  if (total <= 0) throw new Error('Die Summe der Eduktmassen muss größer als null sein.');
  return (productMolarMass / total) * 100;
}

/** Verdünnungsrechnung c₁·V₁ = c₂·V₂; liefert das benötigte Ausgangsvolumen in mL. */
export function dilutionVolume(
  stockConcentration: number,
  targetConcentration: number,
  targetVolume: number,
): number {
  if (stockConcentration <= 0) throw new Error('Die Stammkonzentration muss größer als null sein.');
  if (targetConcentration > stockConcentration) {
    throw new Error('Durch Verdünnen lässt sich die Konzentration nicht erhöhen.');
  }
  return (targetConcentration * targetVolume) / stockConcentration;
}

/** Einwaage für eine Lösung gegebener Konzentration (Volumen in mL). */
export function massForSolution(
  concentration: number,
  volume: number,
  molarMassValue: number,
  purity = 1,
): number {
  return (concentration * (volume / 1000) * molarMassValue) / purity;
}
