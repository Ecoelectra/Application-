/** Zahlenformatierung in deutscher Schreibweise (Komma als Dezimaltrennzeichen). */

/** Formatiert eine Zahl mit fester Nachkommastellenzahl. */
export function formatNumber(value: number, digits = 2): string {
  if (!Number.isFinite(value)) return '–';
  return value.toLocaleString('de-DE', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

/** Formatiert sehr große oder kleine Zahlen in Exponentialschreibweise. */
export function formatExponential(value: number, digits = 2): string {
  if (!Number.isFinite(value)) return '–';
  const [mantissa, exponent] = value.toExponential(digits).split('e');
  return `${mantissa.replace('.', ',')}·10^${exponent.replace('+', '')}`;
}

/** Formatiert eine Zahl mit Vorzeichen, etwa für Energiewerte. */
export function formatSigned(value: number, digits = 0): string {
  if (!Number.isFinite(value)) return '–';
  return `${value > 0 ? '+' : ''}${formatNumber(value, digits)}`;
}
