/**
 * Parser und Rechner für Summenformeln.
 *
 * Unterstützt Klammern beliebiger Tiefe, Kristallwasser (CuSO4·5H2O),
 * Ladungen (SO4^2-, Fe3+) sowie vorangestellte stöchiometrische Faktoren.
 */
import { atomicMass, ELEMENT_BY_SYMBOL } from './elements';

export interface ParsedFormula {
  /** Elementsymbol -> Anzahl Atome in der Formeleinheit */
  counts: Record<string, number>;
  /** Ladung der Formeleinheit (0 für neutrale Teilchen) */
  charge: number;
}

export interface CompositionEntry {
  symbol: string;
  count: number;
  massContribution: number;
  massPercent: number;
}

const HYDRATE_SEPARATORS = /[·*•⋅]/;

class FormulaParser {
  private pos = 0;
  private readonly text: string;
  private readonly charge: number;

  constructor(input: string) {
    // Ladungen stehen am Ende der Formel: Fe3+, SO4^2-, OH-, H3O+.
    // Ziffern unmittelbar vor dem Vorzeichen gehören zur Ladung, nicht zur Atomzahl.
    const match = /\^?(\d*)([+-]+)$/.exec(input);
    if (match) {
      const signs = match[2];
      const uniform = signs.split('').every((c) => c === signs[0]);
      if (uniform) {
        const magnitude = match[1] ? Number(match[1]) : signs.length;
        this.charge = signs[0] === '+' ? magnitude : -magnitude;
        this.text = input.slice(0, match.index);
      } else {
        this.charge = 0;
        this.text = input;
      }
    } else {
      this.charge = 0;
      this.text = input;
    }
  }

  parse(): ParsedFormula {
    const counts = this.parseSequence();
    if (this.pos < this.text.length) {
      throw new Error(`Unerwartetes Zeichen «${this.text[this.pos]}» an Position ${this.pos + 1}`);
    }
    return { counts, charge: this.charge };
  }

  private parseSequence(stopAtClose = false): Record<string, number> {
    const counts: Record<string, number> = {};
    while (this.pos < this.text.length) {
      const ch = this.text[this.pos];
      if (ch === ')' || ch === ']' || ch === '}') {
        if (stopAtClose) break;
        throw new Error(`Schließende Klammer ohne öffnende an Position ${this.pos + 1}`);
      }
      if (ch === '(' || ch === '[' || ch === '{') {
        this.pos++;
        const inner = this.parseSequence(true);
        const closing = this.text[this.pos];
        if (closing !== ')' && closing !== ']' && closing !== '}') {
          throw new Error('Nicht geschlossene Klammer in der Formel');
        }
        this.pos++;
        const factor = this.readNumber() ?? 1;
        mergeCounts(counts, inner, factor);
        continue;
      }
      if (/[A-Z]/.test(ch)) {
        const symbol = this.readElementSymbol();
        const count = this.readNumber() ?? 1;
        counts[symbol] = (counts[symbol] ?? 0) + count;
        continue;
      }
      // Ladungsteil bzw. Ende des Formelteils erreicht
      break;
    }
    return counts;
  }

  private readElementSymbol(): string {
    const start = this.pos;
    this.pos++; // Großbuchstabe
    while (this.pos < this.text.length && /[a-z]/.test(this.text[this.pos])) this.pos++;
    let symbol = this.text.slice(start, this.pos);
    if (!ELEMENT_BY_SYMBOL.has(symbol)) {
      // "CO" kann als Co missverstanden werden: kürzere Variante probieren
      const shorter = symbol.slice(0, 1);
      if (symbol.length > 1 && ELEMENT_BY_SYMBOL.has(shorter)) {
        this.pos = start + 1;
        symbol = shorter;
      } else {
        throw new Error(`Unbekanntes Elementsymbol «${symbol}»`);
      }
    }
    return symbol;
  }

  private readNumber(): number | null {
    const start = this.pos;
    while (this.pos < this.text.length && /[0-9]/.test(this.text[this.pos])) this.pos++;
    if (start === this.pos) return null;
    return Number(this.text.slice(start, this.pos));
  }

}

function mergeCounts(
  target: Record<string, number>,
  source: Record<string, number>,
  factor: number,
): void {
  for (const [symbol, count] of Object.entries(source)) {
    target[symbol] = (target[symbol] ?? 0) + count * factor;
  }
}

/** Normalisiert Unicode-Tiefstellen und Sonderzeichen in Formeln. */
export function normalizeFormula(input: string): string {
  const subscripts: Record<string, string> = {
    '₀': '0', '₁': '1', '₂': '2', '₃': '3', '₄': '4',
    '₅': '5', '₆': '6', '₇': '7', '₈': '8', '₉': '9',
  };
  const superscripts: Record<string, string> = {
    '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4',
    '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9', '⁺': '+', '⁻': '-',
  };
  return input
    .replace(/[₀-₉]/g, (c) => subscripts[c] ?? c)
    .replace(/[⁰-⁹⁺⁻]/g, (c) => superscripts[c] ?? c)
    .replace(/\s+/g, '')
    .trim();
}

/**
 * Parst eine Summenformel inklusive Hydratschreibweise.
 * Beispiel: `CuSO4·5H2O` → { Cu: 1, S: 1, O: 9, H: 10 }
 */
export function parseFormula(input: string): ParsedFormula {
  const normalized = normalizeFormula(input);
  if (!normalized) throw new Error('Leere Formel');

  const parts = normalized.split(HYDRATE_SEPARATORS);
  const total: Record<string, number> = {};
  let charge = 0;

  for (const part of parts) {
    if (!part) continue;
    const leading = /^(\d+)(?=[A-Z(\[])/.exec(part);
    const factor = leading ? Number(leading[1]) : 1;
    const body = leading ? part.slice(leading[1].length) : part;
    const parsed = new FormulaParser(body).parse();
    mergeCounts(total, parsed.counts, factor);
    charge += parsed.charge * factor;
  }

  return { counts: total, charge };
}

/** Molare Masse in g/mol. */
export function molarMass(input: string): number {
  const { counts } = parseFormula(input);
  return Object.entries(counts).reduce(
    (sum, [symbol, count]) => sum + atomicMass(symbol) * count,
    0,
  );
}

/** Molare Masse aus bereits geparsten Elementanzahlen. */
export function molarMassFromCounts(counts: Record<string, number>): number {
  return Object.entries(counts).reduce(
    (sum, [symbol, count]) => sum + atomicMass(symbol) * count,
    0,
  );
}

/** Massenanteile der Elemente (Elementaranalyse). */
export function elementalComposition(input: string): CompositionEntry[] {
  const { counts } = parseFormula(input);
  const total = molarMassFromCounts(counts);
  return Object.entries(counts)
    .map(([symbol, count]) => {
      const massContribution = atomicMass(symbol) * count;
      return {
        symbol,
        count,
        massContribution,
        massPercent: total > 0 ? (massContribution / total) * 100 : 0,
      };
    })
    .sort((a, b) => b.massPercent - a.massPercent);
}

/** Hill-Notation: C zuerst, dann H, danach alphabetisch. */
export function toHillFormula(counts: Record<string, number>): string {
  const symbols = Object.keys(counts).filter((s) => counts[s] > 0);
  const ordered: string[] = [];
  if (symbols.includes('C')) {
    ordered.push('C');
    if (symbols.includes('H')) ordered.push('H');
    ordered.push(...symbols.filter((s) => s !== 'C' && s !== 'H').sort());
  } else {
    ordered.push(...symbols.sort());
  }
  return ordered.map((s) => (counts[s] === 1 ? s : `${s}${counts[s]}`)).join('');
}

/** Prüft, ob zwei Formeln dieselbe Elementbilanz besitzen. */
export function sameComposition(a: string, b: string): boolean {
  const ca = parseFormula(a).counts;
  const cb = parseFormula(b).counts;
  const keys = new Set([...Object.keys(ca), ...Object.keys(cb)]);
  for (const key of keys) {
    if ((ca[key] ?? 0) !== (cb[key] ?? 0)) return false;
  }
  return true;
}
