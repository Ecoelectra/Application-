/**
 * Stoffe in einem Text erkennen – etwa im Text eines hochgeladenen PDFs
 * (Chemikalienliste, Versuchsanleitung, Skript).
 *
 * Erkannt werden:
 *  - Namen und Synonyme der Stoffdatenbank, auch über mehrere Wörter, mit
 *    Silbentrennung am Zeilenende und gebeugt («des Ethanols», «Säuren»)
 *  - CAS-Nummern (mit Prüfziffer)
 *  - Summenformeln wie H2SO4 oder CuSO₄, wenn genau ein Stoff dazu passt
 *
 * Alles läuft im Gerät; der Text verlässt die App nicht.
 */
import { SUBSTANCES, formulaKey } from '../data/substances';
import type { Substance } from '../data/types';

export interface RecognizedSubstance {
  substance: Substance;
  /** wie oft der Stoff im Text vorkommt */
  count: number;
  /** so stand er im Text (höchstens drei Schreibweisen) */
  spellings: string[];
}

/** Wörter, die zwar Stoffnamen oder Synonyme sind, im Fließtext aber meist etwas anderes meinen */
const AMBIGUOUS = new Set([
  'base', 'basen', 'säure', 'säuren', 'salz', 'salze', 'lauge', 'laugen', 'metall', 'metalle', 'gas', 'gase', 'luft', 'glas',
  'kalk', 'soda', 'gips', 'rost', 'essig', 'zucker', 'alkohol', 'benzin', 'öl', 'fett', 'wachs', 'harz', 'ton', 'sand',
  'kohle', 'kreide', 'asche', 'erde', 'stein', 'eis', 'dampf', 'blei', 'zinn', 'probe', 'lösung', 'wasserstoffbrücken',
]);

/** Kürzel in Großbuchstaben (DMF, THF) nur mit genau dieser Schreibweise */
const ABBREVIATION = /^[A-Z0-9]{2,6}$/;

const SUBSCRIPTS: Record<string, string> = { '₀': '0', '₁': '1', '₂': '2', '₃': '3', '₄': '4', '₅': '5', '₆': '6', '₇': '7', '₈': '8', '₉': '9' };

function normalizeName(text: string): string {
  return text
    .normalize('NFC')
    .toLowerCase()
    .replace(/[‐‑‒–—]/g, '-')
    .replace(/[’`´]/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

interface NameIndex {
  byName: Map<string, Substance>;
  byAbbreviation: Map<string, Substance>;
  byCas: Map<string, Substance>;
  byFormula: Map<string, Substance[]>;
  /** längster Name in Wörtern */
  maxWords: number;
}

let index: NameIndex | null = null;

function buildIndex(): NameIndex {
  if (index) return index;
  const byName = new Map<string, Substance>();
  const byAbbreviation = new Map<string, Substance>();
  const byCas = new Map<string, Substance>();
  const byFormula = new Map<string, Substance[]>();
  let maxWords = 1;
  for (const substance of SUBSTANCES) {
    for (const name of [substance.name, ...substance.synonyms]) {
      if (!name) continue;
      if (ABBREVIATION.test(name)) {
        if (name.length >= 3 && !byAbbreviation.has(name)) byAbbreviation.set(name, substance);
        continue;
      }
      const key = normalizeName(name);
      if (key.length < 4 || AMBIGUOUS.has(key)) continue;
      // Der Hauptname gewinnt gegen ein gleichlautendes Synonym eines anderen Stoffes
      if (!byName.has(key) || name === substance.name) byName.set(key, substance);
      maxWords = Math.max(maxWords, key.split(' ').length);
    }
    if (substance.cas && !byCas.has(substance.cas)) byCas.set(substance.cas, substance);
    const formula = formulaKey(substance.formula);
    if (formula) byFormula.set(formula, [...(byFormula.get(formula) ?? []), substance]);
  }
  index = { byName, byAbbreviation, byCas, byFormula, maxWords: Math.min(maxWords, 5) };
  return index;
}

/** Prüfziffer einer CAS-Nummer */
export function validCas(cas: string): boolean {
  const match = /^(\d{2,7})-(\d{2})-(\d)$/.exec(cas);
  if (!match) return false;
  const digits = (match[1] + match[2]).split('').reverse();
  const sum = digits.reduce((total, digit, position) => total + Number(digit) * (position + 1), 0);
  return sum % 10 === Number(match[3]);
}

/** Text aufbereiten: Trennstriche am Zeilenende zusammenziehen, weiche Trennungen entfernen */
export function cleanText(text: string): string {
  return text
    .normalize('NFC')
    .replace(/­/g, '')
    .replace(/([a-zäöüß])-\s*\n\s*([a-zäöüß])/g, '$1$2')
    .replace(/[\r\t\f\v]+/g, ' ');
}

const EDGE = /^[\s"'„“”‚‘»«.,;:!?*•·–—-]+|[\s"'„“”‚‘»«.,;:!?*•·–—-]+$/g;

/** Klammern, die nicht zum Wort gehören («(Ethanol)», «Ethanol)») abschneiden */
function trimBrackets(word: string): string {
  let result = word;
  for (let i = 0; i < 3; i++) {
    const opened = (result.match(/[([]/g) ?? []).length;
    const closed = (result.match(/[)\]]/g) ?? []).length;
    if (result.startsWith('(') && result.endsWith(')') && opened === closed) result = result.slice(1, -1);
    else if (closed > opened && /[)\]]$/.test(result)) result = result.slice(0, -1);
    else if (opened > closed && /^[([]/.test(result)) result = result.slice(1);
    else break;
    result = result.replace(EDGE, '');
  }
  return result;
}

/** Darreichungsformen am Wortende: «Magnesiumband», «Eisenpulver», «Kupferblech» */
const FORMS = [
  'lösung', 'band', 'pulver', 'späne', 'spänen', 'granalien', 'granulat', 'blech', 'draht', 'wolle', 'stücke', 'stab',
  'stäbe', 'kristalle', 'plättchen', 'folie', 'gas', 'dampf',
];

/** Gebeugte Formen: «Ethanols», «Säuren», «Aldehyde», dazu Stoffe mit Darreichungsform */
function inflections(key: string): string[] {
  const forms = [key];
  for (const form of FORMS) {
    if (key.length > form.length + 3 && key.endsWith(form)) forms.push(key.slice(0, -form.length));
  }
  if (key.length < 6) return forms;
  for (const ending of ['es', 's', 'en', 'n', 'e']) {
    if (key.endsWith(ending)) forms.push(key.slice(0, -ending.length));
  }
  return forms;
}

function formulaFromToken(token: string): string | null {
  const plain = token.replace(/[₀-₉]/g, (digit) => SUBSCRIPTS[digit]);
  // Mindestens zwei Elemente oder eine Ziffer, nur Elementsymbole, Ziffern und Klammern
  if (!/^(?:[A-Z][a-z]?\d*|\((?:[A-Z][a-z]?\d*)+\)\d*)+$/.test(plain)) return null;
  const symbols = plain.match(/[A-Z][a-z]?/g) ?? [];
  if (symbols.length < 2 && !/\d/.test(plain)) return null;
  // Großgeschriebene Abkürzungen ohne Ziffern (CO, NO, HI) sind oft keine Formeln
  if (!/\d/.test(plain) && plain.length <= 3) return null;
  return plain;
}

/**
 * Erkennt die Stoffe der Datenbank in einem Text.
 * Sortiert nach Häufigkeit, dann nach erster Erwähnung.
 */
export function recognizeSubstances(text: string): RecognizedSubstance[] {
  const { byName, byAbbreviation, byCas, byFormula, maxWords } = buildIndex();
  const found = new Map<string, RecognizedSubstance & { first: number }>();
  let position = 0;
  const add = (substance: Substance, spelling: string): void => {
    const entry = found.get(substance.id);
    if (entry) {
      entry.count++;
      if (entry.spellings.length < 3 && !entry.spellings.includes(spelling)) entry.spellings.push(spelling);
    } else {
      found.set(substance.id, { substance, count: 1, spellings: [spelling], first: position });
    }
    position++;
  };

  const cleaned = cleanText(text);
  for (const match of cleaned.matchAll(/\b\d{2,7}-\d{2}-\d\b/g)) {
    const substance = validCas(match[0]) ? byCas.get(match[0]) : undefined;
    if (substance) add(substance, match[0]);
  }

  const words = cleaned.split(/\s+/).filter(Boolean);
  for (let i = 0; i < words.length; ) {
    let consumed = 0;
    // Längster Treffer zuerst (mehrteilige Namen wie «Essigsäure-ethylester» oder «Natriumhydrogencarbonat-Lösung»)
    for (let length = Math.min(maxWords, words.length - i); length >= 1 && !consumed; length--) {
      const raw = trimBrackets(words.slice(i, i + length).join(' ').replace(EDGE, ''));
      if (!raw || raw.length < 2) continue;
      if (length === 1 && byAbbreviation.has(raw)) {
        add(byAbbreviation.get(raw) as Substance, raw);
        consumed = 1;
        break;
      }
      const key = normalizeName(raw);
      // «Kupfersulfat-Lösung», «Ethanol-Wasser-Gemisch»: den Stoffnamen vor dem Bindestrich prüfen
      const candidates = [key, ...(key.includes('-') ? [key.split(/-(?=[a-zäöü]{4,}$)/)[0]] : [])];
      for (const candidate of candidates) {
        const substance = inflections(candidate)
          .map((form) => byName.get(form))
          .find(Boolean);
        if (substance) {
          add(substance, raw);
          consumed = length;
          break;
        }
      }
      if (consumed || length !== 1) continue;
      const formula = formulaFromToken(raw);
      const matches = formula ? byFormula.get(formulaKey(formula) ?? '') : undefined;
      if (matches?.length === 1) {
        add(matches[0], raw);
        consumed = 1;
      }
    }
    i += consumed || 1;
  }

  return [...found.values()]
    .sort((a, b) => b.count - a.count || a.first - b.first)
    .map(({ first: _first, ...entry }) => entry);
}
