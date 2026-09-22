/**
 * Elektrochemische Berechnungen: Nernst-Gleichung, Zellspannung, freie
 * Reaktionsenthalpie, Gleichgewichtskonstante und Faradaysche Gesetze.
 */

/** Faraday-Konstante in C/mol */
export const FARADAY = 96485.33212;
/** universelle Gaskonstante in J/(mol·K) */
export const GAS_CONSTANT = 8.314462618;
/** Standardtemperatur in K */
export const STANDARD_TEMPERATURE = 298.15;

export interface NernstInput {
  /** Standardpotential E° in V */
  standardPotential: number;
  /** Zahl der übertragenen Elektronen */
  electrons: number;
  /** Reaktionsquotient Q = [oxidierte Form]/[reduzierte Form] */
  quotient: number;
  /** Temperatur in K */
  temperature?: number;
}

/**
 * Nernst-Gleichung: E = E° − (R·T)/(z·F) · ln Q
 *
 * Q wird als [Ox]/[Red] der Reduktionsgleichung angesetzt, sodass ein größeres Q
 * (mehr oxidierte Form) das Potential erhöht.
 */
export function nernstPotential({
  standardPotential,
  electrons,
  quotient,
  temperature = STANDARD_TEMPERATURE,
}: NernstInput): number {
  if (electrons <= 0) throw new Error('Die Elektronenzahl muss größer als null sein.');
  if (quotient <= 0) throw new Error('Der Reaktionsquotient muss positiv sein.');
  return (
    standardPotential +
    ((GAS_CONSTANT * temperature) / (electrons * FARADAY)) * Math.log(quotient)
  );
}

/** Nernst-Faktor (RT/F)·ln10 – bei 25 °C die bekannten 0,0592 V. */
export function nernstSlope(temperature = STANDARD_TEMPERATURE): number {
  return ((GAS_CONSTANT * temperature) / FARADAY) * Math.LN10;
}

/** Potential der Wasserstoffelektrode in Abhängigkeit vom pH-Wert. */
export function hydrogenElectrodePotential(
  pH: number,
  temperature = STANDARD_TEMPERATURE,
): number {
  return -nernstSlope(temperature) * pH;
}

export interface CellResult {
  /** Zellspannung in V (Kathode minus Anode) */
  cellPotential: number;
  /** freie Reaktionsenthalpie in kJ/mol */
  gibbsEnergy: number;
  /** Gleichgewichtskonstante */
  equilibriumConstant: number;
  /** freiwillig (galvanisch) oder erzwungen (elektrolytisch) */
  spontaneous: boolean;
}

/**
 * Zellspannung und Thermodynamik aus zwei Halbzellenpotentialen.
 * Die Kathode ist die Elektrode mit der Reduktion, die Anode die mit der Oxidation.
 */
export function evaluateCell(
  cathodePotential: number,
  anodePotential: number,
  electrons: number,
  temperature = STANDARD_TEMPERATURE,
): CellResult {
  if (electrons <= 0) throw new Error('Die Elektronenzahl muss größer als null sein.');
  const cellPotential = cathodePotential - anodePotential;
  const gibbsEnergy = (-electrons * FARADAY * cellPotential) / 1000;
  const exponent = (electrons * FARADAY * cellPotential) / (GAS_CONSTANT * temperature);
  return {
    cellPotential,
    gibbsEnergy,
    // sehr große Exponenten würden Infinity liefern – für die Anzeige begrenzen
    equilibriumConstant: exponent > 700 ? Number.POSITIVE_INFINITY : Math.exp(exponent),
    spontaneous: cellPotential > 0,
  };
}

export interface FaradayInput {
  /** Stromstärke in A */
  current: number;
  /** Zeit in s */
  time: number;
  /** Zahl der pro Formelumsatz übertragenen Elektronen */
  electrons: number;
  /** molare Masse in g/mol */
  molarMass: number;
  /** Stromausbeute (0…1) */
  efficiency?: number;
}

export interface FaradayResult {
  /** Ladungsmenge in C */
  charge: number;
  /** Stoffmenge in mol */
  amount: number;
  /** abgeschiedene bzw. umgesetzte Masse in g */
  mass: number;
  /** Gasvolumen bei Normbedingungen in L (nur für gasförmige Produkte sinnvoll) */
  gasVolumeSTP: number;
}

/**
 * Faradaysche Gesetze: n = (I·t·η)/(z·F), m = n·M
 * Das Normvolumen bezieht sich auf 0 °C und 1013 hPa (22,414 L/mol).
 */
export function faradayElectrolysis({
  current,
  time,
  electrons,
  molarMass,
  efficiency = 1,
}: FaradayInput): FaradayResult {
  if (electrons <= 0) throw new Error('Die Elektronenzahl muss größer als null sein.');
  const charge = current * time;
  const amount = (charge * efficiency) / (electrons * FARADAY);
  return {
    charge,
    amount,
    mass: amount * molarMass,
    gasVolumeSTP: amount * 22.414,
  };
}

/** Benötigte Elektrolysezeit für eine Zielmasse. */
export function electrolysisTime(
  targetMass: number,
  molarMass: number,
  electrons: number,
  current: number,
  efficiency = 1,
): number {
  if (current <= 0) throw new Error('Die Stromstärke muss größer als null sein.');
  const amount = targetMass / molarMass;
  return (amount * electrons * FARADAY) / (current * efficiency);
}

/** Ladungsbedarf je Mol Substrat in F/mol – die übliche Größe in der Elektrosynthese. */
export function chargePerMole(electrons: number, efficiency = 1): number {
  return electrons / efficiency;
}

/** Elektrische Arbeit in kWh aus Zellspannung und Ladungsmenge. */
export function electrolysisEnergy(cellVoltage: number, charge: number): number {
  return (cellVoltage * charge) / 3_600_000;
}

/** Spezifischer Energiebedarf in kWh je kg Produkt. */
export function specificEnergyDemand(
  cellVoltage: number,
  electrons: number,
  molarMass: number,
  efficiency = 1,
): number {
  const chargePerKg = (electrons * FARADAY * 1000) / (molarMass * efficiency);
  return electrolysisEnergy(cellVoltage, chargePerKg);
}

/** Stromdichte in mA/cm² aus Strom und Elektrodenfläche. */
export function currentDensity(current: number, areaCm2: number): number {
  if (areaCm2 <= 0) throw new Error('Die Elektrodenfläche muss größer als null sein.');
  return (current * 1000) / areaCm2;
}

/**
 * Praktische Zellspannung einer Elektrolyse:
 * U = ΔE_thermodynamisch + Überspannungen + IR-Abfall
 */
export function operatingVoltage(
  thermodynamicVoltage: number,
  anodeOverpotential: number,
  cathodeOverpotential: number,
  current: number,
  cellResistance: number,
): number {
  return (
    Math.abs(thermodynamicVoltage) +
    Math.abs(anodeOverpotential) +
    Math.abs(cathodeOverpotential) +
    current * cellResistance
  );
}
