/**
 * Hilfsfunktionen für die Massentests.
 *
 * Die Massentests prüfen jedes Werkzeug an mindestens 1000 Fällen. Die Fälle
 * werden entweder systematisch aus den Datentabellen gebildet oder mit einem
 * festen Startwert zufällig erzeugt – so ist jeder Lauf reproduzierbar.
 */
import { parseFormula } from '../../chem/formula';

/** Kleiner, deterministischer Zufallsgenerator (mulberry32). */
export function zufall(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Ganze Zahl aus [min, max]. */
export function ganzzahl(random: () => number, min: number, max: number): number {
  return min + Math.floor(random() * (max - min + 1));
}

/** Zahl aus [min, max). */
export function zahl(random: () => number, min: number, max: number): number {
  return min + random() * (max - min);
}

/** Ein Element der Liste. */
export function wahl<T>(random: () => number, list: readonly T[]): T {
  return list[Math.floor(random() * list.length)];
}

/** Gleichmäßige Stichprobe ohne Zufall: jedes k-te Element, genau n Stück. */
export function stichprobe<T>(list: readonly T[], n: number): T[] {
  if (list.length <= n) return [...list];
  const step = list.length / n;
  return Array.from({ length: n }, (_, index) => list[Math.floor(index * step)]);
}

/** Relative Abweichung, robust gegen Werte nahe null. */
export function relativeAbweichung(a: number, b: number): number {
  const scale = Math.max(Math.abs(a), Math.abs(b), 1e-12);
  return Math.abs(a - b) / scale;
}

export interface Bilanz {
  atome: Record<string, number>;
  ladung: number;
}

/**
 * Zählt Atome und Ladung einer Gleichungsseite wie «2 H2 + O2» oder
 * «MnO4^- + 8 H+ + 5 e-». Elektronen zählen als Ladung −1.
 */
export function seitenBilanz(side: string): Bilanz {
  const atome: Record<string, number> = {};
  let ladung = 0;
  const trimmed = side.trim();
  if (trimmed === '0' || trimmed === '') return { atome, ladung };
  for (const raw of trimmed.split(/\s\+\s/)) {
    const term = raw.trim();
    const match = term.match(/^(\d+)\s+(.+)$/);
    const coefficient = match ? Number(match[1]) : 1;
    const species = match ? match[2] : term;
    if (species === 'e-' || species === 'e⁻') {
      ladung -= coefficient;
      continue;
    }
    const parsed = parseFormula(species);
    for (const [element, count] of Object.entries(parsed.counts)) {
      atome[element] = (atome[element] ?? 0) + count * coefficient;
    }
    ladung += parsed.charge * coefficient;
  }
  return { atome, ladung };
}

/** Unterschiede zwischen linker und rechter Seite einer Gleichung (leer = ausgeglichen). */
export function gleichungsFehler(equation: string): string[] {
  const parts = equation.split(/\s*(?:→|⇌|->)\s*/);
  if (parts.length !== 2) return [`kein eindeutiger Pfeil in «${equation}»`];
  const left = seitenBilanz(parts[0]);
  const right = seitenBilanz(parts[1]);
  const errors: string[] = [];
  const elements = new Set([...Object.keys(left.atome), ...Object.keys(right.atome)]);
  for (const element of elements) {
    const l = left.atome[element] ?? 0;
    const r = right.atome[element] ?? 0;
    if (l !== r) errors.push(`${element}: ${l} ≠ ${r}`);
  }
  if (left.ladung !== right.ladung) errors.push(`Ladung: ${left.ladung} ≠ ${right.ladung}`);
  return errors;
}

export function ggT(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y) [x, y] = [y, x % y];
  return x;
}
