/**
 * Aktivierungsenergie und Temperatur: Läuft die Reaktion bei der eingestellten
 * Temperatur in vernünftiger Zeit ab?
 *
 * Arrhenius: k = A · e^(−Ea/RT). Für den Stoßfaktor A gelten typische Werte
 * in Lösung (10¹¹ L/(mol·s) für bimolekulare, 10¹³ s⁻¹ für monomolekulare
 * Schritte). Die Halbwertszeit bei 1 mol/L zeigt, ob man auf die Reaktion
 * Sekunden, Stunden oder Jahrtausende warten müsste.
 */

export const R = 8.314;
const BIMOLECULAR_A = 1e11;
const UNIMOLECULAR_A = 1e13;
/** Bis zu dieser Halbwertszeit gilt eine Reaktion als praktisch durchführbar (eine Stunde). */
export const PRACTICAL_HALF_LIFE = 3600;

export type Speed = 'schnell' | 'praktikabel' | 'langsam' | 'blockiert';

export interface Kinetics {
  /** Aktivierungsenergie in kJ/mol */
  ea: number;
  /** Halbwertszeit in Sekunden bei 1 mol/L */
  halfLife: number;
  speed: Speed;
}

function preExponential(bimolecular: boolean, pre?: number): number {
  return pre ?? (bimolecular ? BIMOLECULAR_A : UNIMOLECULAR_A);
}

/** Halbwertszeit in Sekunden bei gegebener Aktivierungsenergie und Temperatur. */
export function halfLife(eaKJ: number, temperatureC: number, bimolecular = true, pre?: number): number {
  const T = temperatureC + 273.15;
  const k = preExponential(bimolecular, pre) * Math.exp((-eaKJ * 1000) / (R * T));
  // zweite Ordnung bei gleichen Anfangskonzentrationen von 1 mol/L: t½ = 1/(k·c0); erste Ordnung: ln 2/k
  return bimolecular ? 1 / k : Math.LN2 / k;
}

export function kinetics(eaKJ: number, temperatureC: number, bimolecular = true, pre?: number): Kinetics {
  const t = halfLife(eaKJ, temperatureC, bimolecular, pre);
  const speed: Speed = t < 60 ? 'schnell' : t <= PRACTICAL_HALF_LIFE ? 'praktikabel' : t <= 86_400 * 7 ? 'langsam' : 'blockiert';
  return { ea: eaKJ, halfLife: t, speed };
}

/** Größte Aktivierungsenergie, die bei dieser Temperatur noch innerhalb einer Stunde umsetzt. */
export function maximumBarrier(temperatureC: number, bimolecular = true, pre?: number): number {
  const T = temperatureC + 273.15;
  const factor = bimolecular ? preExponential(true, pre) * PRACTICAL_HALF_LIFE : (preExponential(false, pre) * PRACTICAL_HALF_LIFE) / Math.LN2;
  return (R * T * Math.log(factor)) / 1000;
}

/** Temperatur in °C, ab der eine Barriere innerhalb einer Stunde überwunden wird. */
export function requiredTemperature(eaKJ: number, bimolecular = true, pre?: number): number {
  const factor = bimolecular ? preExponential(true, pre) * PRACTICAL_HALF_LIFE : (preExponential(false, pre) * PRACTICAL_HALF_LIFE) / Math.LN2;
  return (eaKJ * 1000) / (R * Math.log(factor)) - 273.15;
}

/** Beschleunigung durch eine gesenkte Barriere bei gegebener Temperatur. */
export function speedUp(eaBefore: number, eaAfter: number, temperatureC: number): number {
  return Math.exp(((eaBefore - eaAfter) * 1000) / (R * (temperatureC + 273.15)));
}

/** Zeitspanne in Worten: «3 Sekunden», «2 Stunden», «40 000 Jahre». */
export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds > 3.15e7 * 1e9) return 'länger als das Alter des Universums';
  const units: Array<[number, string, string]> = [
    [3.15e7, 'Jahr', 'Jahre'],
    [86_400, 'Tag', 'Tage'],
    [3600, 'Stunde', 'Stunden'],
    [60, 'Minute', 'Minuten'],
    [1, 'Sekunde', 'Sekunden'],
  ];
  if (seconds < 1) return 'weniger als eine Sekunde';
  for (const [size, singular, plural] of units) {
    if (seconds >= size) {
      const value = seconds / size;
      const rounded = value >= 100 ? Number(value.toPrecision(2)) : Math.round(value);
      return `${rounded.toLocaleString('de-DE')} ${rounded === 1 ? singular : plural}`;
    }
  }
  return `${Math.round(seconds)} Sekunden`;
}

/** Faktor in Worten: «etwa 3 Millionen-mal». */
export function formatFactor(factor: number): string {
  if (factor < 10) return `etwa ${factor.toLocaleString('de-DE', { maximumFractionDigits: 1 })}-mal`;
  if (factor < 1e6) return `etwa ${Number(factor.toPrecision(2)).toLocaleString('de-DE')}-mal`;
  const exponent = Math.floor(Math.log10(factor));
  const names: Array<[number, string]> = [[18, 'Trillionen'], [15, 'Billiarden'], [12, 'Billionen'], [9, 'Milliarden'], [6, 'Millionen']];
  for (const [power, name] of names) {
    if (exponent >= power) {
      const value = factor / 10 ** power;
      if (value < 1000) return `etwa ${Math.round(value).toLocaleString('de-DE')} ${name}-mal`;
    }
  }
  return `etwa 10^${exponent}-mal`;
}
