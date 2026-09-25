/**
 * Stoffe außerhalb der Offline-Datenbank.
 *
 * Die Werkbank kann jeden Stoff aufnehmen, den PubChem kennt oder den man als
 * SMILES eingibt. Damit die Regeln der Werkbank greifen, wird der Stoff in die
 * Schreibweise der App übersetzt:
 *
 * - Ist er schon in der Offline-Datenbank (gleiche CID, gleiche Struktur oder
 *   bei anorganischen Stoffen gleiche Summenformel), wird dieser Eintrag
 *   verwendet – mit deutschem Namen und allen hinterlegten Daten.
 * - Salze werden über das Ionenmodell in die übliche Formel gebracht
 *   (PubChem schreibt Kupfer(II)-sulfat als «CuO4S», die App als «CuSO4»)
 *   und wie die Salze der Datenbank ohne SMILES geführt.
 * - Organische Stoffe behalten ihre Struktur, damit die Reaktionsvorlagen
 *   greifen.
 */
import type { MainModule } from '@rdkit/rdkit';
import { elementBySymbol, isMetal } from './elements';
import { molarMass, parseFormula, toHillFormula } from './formula';
import { ANIONS, CATIONS, saltFormula, splitSalt } from './ions';
import { canonicalSmiles, molecularFormula } from './rdkit';
import { structureKey } from './reactionKeys';
import { assessSubstance, RESTRICTION_NOTICE } from './safety';
import { SUBSTANCES, formulaKey, substanceByCid } from '../data/substances';
import type { Substance } from '../data/types';
import type { PubChemCompound } from '../services/pubchem';

/** Reihenfolge der Nichtmetalle in anorganischen Formeln nach IUPAC (Metalle stehen vorn). */
const NONMETAL_ORDER = ['B', 'Si', 'C', 'Sb', 'As', 'P', 'N', 'H', 'Te', 'Se', 'S', 'I', 'Br', 'Cl', 'O', 'F'];

/** Anorganische Summenformel in üblicher Schreibweise: «Cl5P» → «PCl5». */
export function inorganicFormula(counts: Record<string, number>): string {
  const rank = (symbol: string): number => {
    const index = NONMETAL_ORDER.indexOf(symbol);
    return index < 0 ? -1 : index;
  };
  return Object.keys(counts)
    .sort((a, b) => rank(a) - rank(b) || a.localeCompare(b))
    .map((symbol) => `${symbol}${counts[symbol] > 1 ? counts[symbol] : ''}`)
    .join('');
}

function isOrganicCounts(counts: Record<string, number>): boolean {
  return Boolean(counts.C && counts.H);
}

interface Fragment {
  counts: Record<string, number>;
  charge: number;
  amount: number;
}

/** Zerlegt ein SMILES in Teilchen und zählt abgetrenntes Kristallwasser. */
function fragments(rdkit: MainModule, smiles: string): { counts: Record<string, number>; water: number; ions: Fragment[] } | null {
  const counts: Record<string, number> = {};
  const ions = new Map<string, Fragment>();
  let water = 0;
  const parts = smiles.split('.');
  for (const part of parts) {
    const formula = molecularFormula(rdkit, part);
    if (!formula) return null;
    if (formula === 'H2O' && parts.length > 1) {
      water++;
      continue;
    }
    // molecularFormula schreibt Ladungen mit Dach: «O4S^2-»
    const [neutral, chargeText = ''] = formula.split('^');
    const fragmentCounts = parseFormula(neutral).counts;
    const charge = chargeText ? (chargeText.endsWith('-') ? -1 : 1) * Number(chargeText.slice(0, -1) || 1) : 0;
    for (const [element, count] of Object.entries(fragmentCounts)) {
      counts[element] = (counts[element] ?? 0) + count;
    }
    const existing = ions.get(formula);
    if (existing) existing.amount++;
    else ions.set(formula, { counts: fragmentCounts, charge, amount: 1 });
  }
  return { counts, water, ions: [...ions.values()] };
}

/** Formel eines Salzes aus seinen Ionen, auch für Ionen außerhalb des Ionenmodells: Ce(SO4)2. */
function formulaFromIons(ions: Fragment[]): string | null {
  if (ions.length < 2 || ions.some((entry) => entry.charge === 0)) return null;
  const total = ions.reduce((sum, entry) => sum + entry.charge * entry.amount, 0);
  if (total !== 0) return null;
  const sorted = [...ions].sort((a, b) => b.charge - a.charge);
  return sorted
    .map((entry) => {
      const hill = toHillFormula(entry.counts);
      const known = [...CATIONS, ...ANIONS].find((ion) => ion.charge === entry.charge && formulaKey(ion.formula) === hill);
      const text = known?.formula ?? inorganicFormula(entry.counts);
      if (entry.amount === 1) return text;
      return Object.keys(entry.counts).length > 1 || Object.values(entry.counts).some((count) => count > 1)
        ? `(${text})${entry.amount}`
        : `${text}${entry.amount}`;
    })
    .join('');
}

export interface NormalizedFormula {
  formula: string;
  /** Die App rechnet mit dem Stoff über das Ionenmodell (ohne SMILES). */
  ionic: boolean;
  category: string;
}

/** Bringt Summenformel und Stoffklasse in die Schreibweise der App. */
export function normalizeFormula(counts: Record<string, number>, water = 0, ions: Fragment[] = []): NormalizedFormula {
  const hydrate = water ? `·${water > 1 ? water : ''}H2O` : '';
  const elements = Object.keys(counts);
  if (elements.length === 1) {
    return { formula: `${elements[0]}${counts[elements[0]] > 1 ? counts[elements[0]] : ''}`, ionic: false, category: 'Element' };
  }
  const hill = toHillFormula(counts);
  const salt = splitSalt(hill);
  if (salt && !(isOrganicCounts(counts) && salt.anion.formula !== 'CH3COO')) {
    const formula = `${saltFormula(salt.cation, salt.anion)}${hydrate}`;
    if (salt.cation.formula === 'H') return { formula, ionic: true, category: 'Säure' };
    if (salt.anion.formula === 'OH') return { formula, ionic: true, category: 'Base' };
    if (salt.anion.formula === 'O') return { formula, ionic: true, category: 'Oxid' };
    return { formula, ionic: true, category: 'Salz' };
  }
  if (isOrganicCounts(counts)) return { formula: `${hill}${hydrate}`, ionic: false, category: 'Organischer Stoff' };
  const fromIons = formulaFromIons(ions);
  if (fromIons) return { formula: `${fromIons}${hydrate}`, ionic: true, category: 'Salz' };
  const metal = elements.some((symbol) => isMetal(symbol));
  return { formula: `${inorganicFormula(counts)}${hydrate}`, ionic: false, category: metal ? 'Anorganischer Stoff' : 'Molekül' };
}

let structureIndex: Map<string, Substance> | null = null;

/** Offline-Stoffe nach kanonischer Struktur (einmalig aufgebaut). */
function localByStructure(rdkit: MainModule, smiles: string): Substance | undefined {
  if (!structureIndex) {
    structureIndex = new Map();
    for (const substance of SUBSTANCES) {
      if (!substance.smiles) continue;
      const key = structureKey(rdkit, substance.smiles);
      if (key && !structureIndex.has(key)) structureIndex.set(key, substance);
    }
  }
  const key = structureKey(rdkit, smiles);
  return key ? structureIndex.get(key) : undefined;
}

/** Offline-Stoff mit derselben anorganischen Formel. */
function localByFormula(formula: string): Substance | undefined {
  const key = formulaKey(formula);
  if (!key) return undefined;
  return SUBSTANCES.find((substance) => {
    if (formulaKey(substance.formula) !== key) return false;
    try {
      return !isOrganicCounts(parseFormula(substance.formula).counts);
    } catch {
      return false;
    }
  });
}

/** Findet den passenden Eintrag der Offline-Datenbank. */
export function localMatch(
  rdkit: MainModule | null,
  entry: { cid?: number; smiles?: string; formula?: string },
): Substance | undefined {
  if (entry.cid) {
    const byCid = substanceByCid(entry.cid);
    if (byCid) return byCid;
  }
  if (rdkit && entry.smiles) {
    const byStructure = localByStructure(rdkit, entry.smiles);
    if (byStructure) return byStructure;
  }
  if (entry.formula) {
    try {
      if (!isOrganicCounts(parseFormula(entry.formula).counts)) return localByFormula(entry.formula);
    } catch {
      return undefined;
    }
  }
  return undefined;
}

export type ExternalResult =
  | { ok: true; substance: Substance; local: boolean }
  | { ok: false; reason: string };

function capitalize(text: string): string {
  return text ? text[0].toUpperCase() + text.slice(1) : text;
}

function build(
  rdkit: MainModule,
  smiles: string,
  details: { id: string; name: string; synonyms: string[]; cid?: number; description: string },
): ExternalResult {
  const canonical = canonicalSmiles(rdkit, smiles);
  if (!canonical) return { ok: false, reason: 'Die Struktur ist ungültig.' };

  const safety = assessSubstance(details.name, canonical, rdkit);
  if (safety.restricted) return { ok: false, reason: `${safety.explanation} ${RESTRICTION_NOTICE}` };

  const parts = fragments(rdkit, canonical);
  if (!parts || !Object.keys(parts.counts).length) return { ok: false, reason: 'Die Summenformel ließ sich nicht bestimmen.' };
  const normalized = normalizeFormula(parts.counts, parts.water, parts.ions);

  const local = localMatch(rdkit, { cid: details.cid, smiles: canonical, formula: normalized.formula });
  if (local) return { ok: true, substance: local, local: true };

  let mass = 0;
  try {
    mass = molarMass(normalized.formula);
  } catch {
    mass = 0;
  }
  const symbol = normalized.category === 'Element' ? Object.keys(parts.counts)[0] : undefined;
  const keepSmiles = !normalized.ionic || isOrganicCounts(parts.counts);
  return {
    ok: true,
    local: false,
    substance: {
      id: details.id,
      name: symbol ? (elementBySymbol(symbol)?.name ?? details.name) : details.name,
      synonyms: details.synonyms.filter((synonym) => synonym && synonym !== details.name),
      formula: normalized.formula,
      smiles: symbol && !parts.counts.H ? undefined : keepSmiles ? canonical : undefined,
      molarMass: Math.round(mass * 100) / 100,
      pubchemCid: details.cid,
      category: normalized.category,
      description: details.description,
      origin: details.cid ? 'pubchem' : 'eingabe',
    },
  };
}

/** Stoff aus einem PubChem-Datensatz. */
export function substanceFromCompound(rdkit: MainModule, compound: PubChemCompound, label?: string): ExternalResult {
  const smiles = compound.smiles ?? compound.connectivitySmiles;
  if (!smiles) return { ok: false, reason: 'PubChem liefert für diesen Eintrag keine Struktur.' };
  const name = capitalize(label?.trim() || compound.title || compound.iupacName || `CID ${compound.cid}`);
  return build(rdkit, smiles, {
    id: `pubchem-${compound.cid}`,
    name,
    synonyms: [compound.title ?? '', compound.iupacName ?? ''],
    cid: compound.cid,
    description: `Aus PubChem geladen (CID ${compound.cid})`,
  });
}

/** Einfacher, stabiler Kurzschlüssel für eingegebene Strukturen. */
function hash(text: string): string {
  let value = 5381;
  for (let index = 0; index < text.length; index++) value = ((value << 5) + value + text.charCodeAt(index)) >>> 0;
  return value.toString(36);
}

/** Stoff aus einer eingegebenen SMILES-Zeichenkette. */
export function substanceFromSmiles(rdkit: MainModule, smiles: string, name?: string): ExternalResult {
  const canonical = canonicalSmiles(rdkit, smiles.trim());
  if (!canonical) return { ok: false, reason: 'Das ist kein gültiges SMILES.' };
  return build(rdkit, canonical, {
    id: `smiles-${hash(canonical)}`,
    name: name?.trim() || canonical,
    synonyms: [canonical],
    description: 'Als Struktur (SMILES) eingegeben',
  });
}

/** Sieht die Eingabe wie ein SMILES aus (und nicht wie ein Name)? */
export function looksLikeSmiles(rdkit: MainModule | null, text: string): boolean {
  const term = text.trim();
  if (!rdkit || !term || /\s/.test(term) || term.length > 400) return false;
  // Reine Wörter wie «Brom» oder Formeln wie «NaCl» sind keine Strukturen
  if (/^[A-Z][a-z]+$/.test(term) && !['Br', 'Cl'].includes(term)) return false;
  return canonicalSmiles(rdkit, term) !== null;
}
