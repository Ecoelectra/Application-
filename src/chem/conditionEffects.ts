/**
 * Was bewirken Temperatur- und Druckregler?
 *
 * - Aggregatzustände: Siedet ein Stoff bei der eingestellten Temperatur und
 *   dem eingestellten Druck, entweicht er aus dem offenen Gefäß.
 * - Reaktionsgeschwindigkeit nach der RGT-Regel (Faktor 2 je 10 K).
 * - Gleichgewichte mit Gasen nach Le Chatelier: Hoher Druck begünstigt die
 *   Seite mit weniger Gasteilchen.
 */
import type { MainModule } from '@rdkit/rdkit';
import { parseFormula } from './formula';
import { NORMAL_PRESSURE, physicalProperties, rateFactor, stateAt } from './phase';
import { SUBSTANCES } from '../data/substances';
import type { Substance } from '../data/types';

/** Stoffe, die bei Raumtemperatur Gase sind, nach Summenformel. */
const GAS_FORMULAS = new Set([
  'H2', 'O2', 'N2', 'Cl2', 'F2', 'CO2', 'CO', 'SO2', 'NH3', 'NO', 'NO2', 'N2O', 'H2S', 'HCl', 'HBr', 'HI', 'HF',
  'CH4', 'C2H6', 'C2H4', 'C2H2', 'C3H8', 'C4H10', 'He', 'Ne', 'Ar', 'O3', 'CH3Cl',
]);

function format(value: number): string {
  return `${(Math.round(value) || 0).toLocaleString('de-DE')} °C`;
}

function formatFactor(value: number): string {
  if (value >= 10000) return 'um Größenordnungen';
  if (value >= 10) return `etwa ${Math.round(value).toLocaleString('de-DE')}-mal`;
  return `etwa ${value.toLocaleString('de-DE', { maximumFractionDigits: 1 })}-mal`;
}

function isGasAt(rdkit: MainModule | null, formula: string, temperature: number, pressure: number): boolean {
  const known = SUBSTANCES.find((substance) => substance.formula === formula);
  if (known) {
    const state = stateAt(physicalProperties(rdkit, known), temperature, pressure).state;
    if (state !== 'unbekannt') return state === 'gasförmig';
  }
  return GAS_FORMULAS.has(formula);
}

/**
 * Gasbilanz einer Formelgleichung wie «N2 + 3 H2 → 2 NH3».
 * Liefert null, wenn die Gleichung nicht aus Summenformeln besteht.
 */
export function gasBalance(rdkit: MainModule | null, equation: string, temperature: number, pressure: number): number | null {
  const sides = equation.split(/\s*(?:→|⇌)\s*/);
  if (sides.length !== 2) return null;
  let delta = 0;
  for (const [index, side] of sides.entries()) {
    for (const term of side.split(/\s\+\s/)) {
      const match = term.trim().match(/^(\d+)?\s*(.+)$/);
      if (!match) return null;
      const formula = match[2].trim();
      try {
        parseFormula(formula);
      } catch {
        return null;
      }
      if (!/^[A-Z(\[]/.test(formula)) return null;
      const count = match[1] ? Number(match[1]) : 1;
      if (isGasAt(rdkit, formula, temperature, pressure)) delta += index === 0 ? -count : count;
    }
  }
  return delta;
}

/** Hinweis zum Druck für eine Reaktion mit Gasen, oder null. */
export function pressureNote(rdkit: MainModule | null, equation: string, temperature: number, pressure: number): string | null {
  const delta = gasBalance(rdkit, equation, temperature, pressure);
  if (delta === null || delta === 0) return null;
  const high = pressure > 2;
  const low = pressure < 0.5;
  if (delta < 0) {
    return `Druck: Aus mehr Gasteilchen werden weniger (Δn = ${delta}).${high ? ' Der hohe Druck verschiebt das Gleichgewicht zu den Produkten.' : low ? ' Unterdruck verschiebt das Gleichgewicht zu den Edukten.' : ' Höherer Druck würde die Produkte begünstigen.'}`;
  }
  return `Druck: Es entstehen zusätzliche Gasteilchen (Δn = +${delta}).${high ? ' Der hohe Druck drängt die Reaktion zurück; das Gas bleibt teilweise gelöst.' : low ? ' Unterdruck begünstigt die Gasbildung.' : ' Im offenen Gefäß entweicht das Gas.'}`;
}

/** Hinweise zu Aggregatzuständen, Geschwindigkeit und Druck bei eingestellten Bedingungen. */
export function conditionNotes(
  rdkit: MainModule | null,
  substances: Substance[],
  temperature: number,
  pressure: number,
  hasReaction: boolean,
): string[] {
  const notes: string[] = [];
  for (const substance of substances) {
    const properties = physicalProperties(rdkit, substance);
    const state = stateAt(properties, temperature, pressure);
    const atRoom = stateAt(properties, 20, NORMAL_PRESSURE);
    if (state.state === 'zersetzt') {
      notes.push(`${substance.name} ${state.text}.`);
    } else if (state.state === 'gasförmig' && atRoom.state !== 'gasförmig' && state.boilingPoint !== undefined) {
      notes.push(
        `${substance.name} siedet bei ${pressure.toLocaleString('de-DE', { maximumFractionDigits: 2 })} bar schon bei ${format(state.boilingPoint)} und verdampft im offenen Gefäß. Mit Rückflusskühler bleibt es im Gefäß; im geschlossenen Druckgefäß bleibt es flüssig, wenn der Druck hoch genug ist.`,
      );
    } else if (state.state === 'fest' && atRoom.state === 'flüssig') {
      notes.push(`${substance.name} ist bei dieser Temperatur erstarrt – in festem Zustand reagiert es deutlich langsamer.`);
    }
  }

  const organic = substances.some((substance) => substance.smiles && /C/.test(substance.formula) && /H/.test(substance.formula));
  if (organic && temperature > 350) {
    notes.push('Oberhalb von etwa 350 °C zersetzen sich die meisten organischen Stoffe (Pyrolyse, Verkohlung) – mit Sauerstoff verbrennen sie.');
  }

  if (hasReaction && Math.abs(temperature - 20) >= 10) {
    const factor = rateFactor(temperature);
    notes.push(
      temperature > 20
        ? `Geschwindigkeit: Bei ${format(temperature)} laufen Reaktionen nach der RGT-Regel ${formatFactor(factor)} so schnell wie bei 20 °C.`
        : `Geschwindigkeit: Bei ${format(temperature)} laufen Reaktionen nach der RGT-Regel ${formatFactor(1 / factor)} langsamer als bei 20 °C.`,
    );
  }

  if (pressure < 0.5) {
    notes.push('Unterdruck: Siedepunkte sinken, Flüssigkeiten verdampfen leichter (Prinzip der Vakuumdestillation); Gase entweichen aus Lösungen.');
  } else if (pressure > 5) {
    notes.push('Überdruck: Siedepunkte steigen, Gase lösen sich besser (Henry-Gesetz), und Gleichgewichte mit Gasen verschieben sich zur Seite mit weniger Gasteilchen. Dafür braucht es einen Autoklaven.');
  }
  return notes;
}
