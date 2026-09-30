/**
 * Stoffdaten aus mehreren freien Online-Datenbanken – nicht nur PubChem.
 *
 *  - PubChem (NIH): über 100 Millionen Stoffe, Namen, Formeln, GHS-Einstufung
 *  - Wikidata: freie Wissensdatenbank mit deutschen Stoffnamen, CAS-Nummern,
 *    Summenformeln und Strukturen
 *  - ChEMBL (EMBL-EBI): Arzneistoffe und biologisch aktive Moleküle
 *  - NCI CACTUS (US National Cancer Institute): wandelt Namen, CAS-Nummern
 *    und InChIKeys in Strukturen um
 *  - OPSIN (Universität Cambridge): liest systematische IUPAC-Namen
 *
 * Alle Dienste sind frei und ohne Schlüssel aus dem Browser erreichbar (CORS).
 * Die Abfragen laufen parallel mit Zeitlimit; fällt eine Quelle aus, liefern
 * die übrigen weiter. Antworten werden 30 Tage zwischengespeichert.
 */
import { autocomplete, cidsByInchiKey, compoundByCid, compoundPageUrl, findCompound, type PubChemCompound } from './pubchem';

export type SourceId = 'pubchem' | 'wikidata' | 'chembl' | 'cactus' | 'opsin';

export interface SourceInfo {
  id: SourceId;
  label: string;
  /** wer die Datenbank betreibt und was sie kann */
  description: string;
  homepage: string;
}

export const SOURCES: Record<SourceId, SourceInfo> = {
  pubchem: {
    id: 'pubchem',
    label: 'PubChem',
    description: 'US National Institutes of Health – über 100 Millionen Stoffe mit Eigenschaften und GHS-Einstufung',
    homepage: 'https://pubchem.ncbi.nlm.nih.gov',
  },
  wikidata: {
    id: 'wikidata',
    label: 'Wikidata',
    description: 'Freie Wissensdatenbank der Wikimedia – deutsche Stoffnamen, CAS-Nummern, Formeln und Strukturen',
    homepage: 'https://www.wikidata.org',
  },
  chembl: {
    id: 'chembl',
    label: 'ChEMBL',
    description: 'Europäisches Bioinformatik-Institut (EMBL-EBI) – Arzneistoffe und biologisch aktive Moleküle',
    homepage: 'https://www.ebi.ac.uk/chembl',
  },
  cactus: {
    id: 'cactus',
    label: 'NCI CACTUS',
    description: 'US National Cancer Institute – wandelt Namen, CAS-Nummern und InChIKeys in Strukturen um',
    homepage: 'https://cactus.nci.nih.gov/chemical/structure',
  },
  opsin: {
    id: 'opsin',
    label: 'OPSIN',
    description: 'Universität Cambridge – liest systematische (IUPAC-)Namen wie «2-Methylpropan-1-ol»',
    homepage: 'https://opsin.ch.cam.ac.uk',
  },
};

/** Reihenfolge, in der gleich gute Treffer bevorzugt werden */
export const SOURCE_ORDER: SourceId[] = ['pubchem', 'wikidata', 'chembl', 'cactus', 'opsin'];

/** Ein Treffer in einer Quelle */
export interface SourceHit {
  source: SourceId;
  /** Kennung in der Quelle (CID, Wikidata-Q-Nummer, ChEMBL-ID …) */
  ref: string;
  name: string;
  smiles?: string;
  formula?: string;
  cas?: string;
  inchiKey?: string;
  cid?: number;
  synonyms: string[];
  description?: string;
  url: string;
}

const CACHE_PREFIX = 'quelle:';
const CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 30;
const TIMEOUT_MS = 10_000;

function readCache<T>(key: string): T | undefined {
  if (typeof localStorage === 'undefined') return undefined;
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return undefined;
    const entry = JSON.parse(raw) as { value: T; time: number };
    if (Date.now() - entry.time > CACHE_TTL_MS) {
      localStorage.removeItem(CACHE_PREFIX + key);
      return undefined;
    }
    return entry.value;
  } catch {
    return undefined;
  }
}

function writeCache<T>(key: string, value: T): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ value, time: Date.now() }));
  } catch {
    // Speicher voll oder privater Modus – der Zwischenspeicher ist optional
  }
}

/** Entfernt alle zwischengespeicherten Antworten der weiteren Quellen */
export function clearSourceCache(): void {
  if (typeof localStorage === 'undefined') return;
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(CACHE_PREFIX)) keys.push(key);
  }
  keys.forEach((key) => localStorage.removeItem(key));
}

/**
 * Lädt eine Adresse mit Zeitlimit. «nicht gefunden» (404) ist ein Ergebnis und
 * wird gespeichert; Netzfehler nicht, damit es später erneut versucht wird.
 */
async function request(url: string, cacheKey: string, as: 'json' | 'text'): Promise<unknown | null> {
  const cached = readCache<unknown>(cacheKey);
  if (cached !== undefined) return cached;
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = controller ? setTimeout(() => controller.abort(), TIMEOUT_MS) : null;
  try {
    const response = await fetch(url, {
      headers: { Accept: as === 'json' ? 'application/json' : 'text/plain' },
      signal: controller?.signal,
    });
    if (response.status === 404) {
      writeCache(cacheKey, null);
      return null;
    }
    if (!response.ok) return null;
    const value = as === 'json' ? await response.json() : await response.text();
    writeCache(cacheKey, value);
    return value;
  } catch {
    return null;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

const SUBSCRIPTS: Record<string, string> = { '₀': '0', '₁': '1', '₂': '2', '₃': '3', '₄': '4', '₅': '5', '₆': '6', '₇': '7', '₈': '8', '₉': '9' };

/** «C₈H₁₀N₄O₂» → «C8H10N4O2»; Ladungen und Leerzeichen fallen weg */
export function plainFormula(formula: string | undefined): string | undefined {
  if (!formula) return undefined;
  const plain = formula
    .replace(/[₀-₉]/g, (digit) => SUBSCRIPTS[digit])
    .replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻]/g, '')
    .replace(/\s+/g, '');
  return plain || undefined;
}

export function looksLikeCas(text: string): boolean {
  return /^\d{2,7}-\d{2}-\d$/.test(text.trim());
}

export function looksLikeInchiKey(text: string): boolean {
  return /^[A-Z]{14}-[A-Z]{10}-[A-Z]$/.test(text.trim());
}

// ---------------------------------------------------------------------
// PubChem
// ---------------------------------------------------------------------

function fromPubChem(compound: PubChemCompound, label?: string): SourceHit {
  return {
    source: 'pubchem',
    ref: String(compound.cid),
    name: label || compound.title || compound.iupacName || `CID ${compound.cid}`,
    smiles: compound.smiles ?? compound.connectivitySmiles,
    formula: compound.formula,
    inchiKey: compound.inchiKey,
    cid: compound.cid,
    synonyms: [compound.title ?? '', compound.iupacName ?? ''].filter(Boolean),
    description: `PubChem CID ${compound.cid}`,
    url: compoundPageUrl(compound.cid),
  };
}

export async function pubchemLookup(term: string): Promise<SourceHit | null> {
  const compound = await findCompound(term);
  return compound ? fromPubChem(compound, term) : null;
}

export async function pubchemByInchiKey(inchiKey: string): Promise<SourceHit | null> {
  const [cid] = await cidsByInchiKey(inchiKey);
  const compound = cid ? await compoundByCid(cid) : null;
  return compound ? fromPubChem(compound) : null;
}

// ---------------------------------------------------------------------
// Wikidata
// ---------------------------------------------------------------------

const WIKIDATA_API = 'https://www.wikidata.org/w/api.php';

interface WikidataClaim {
  rank?: string;
  mainsnak?: { datavalue?: { value?: unknown } };
}

interface WikidataEntity {
  id: string;
  missing?: string;
  labels?: Record<string, { value: string }>;
  aliases?: Record<string, Array<{ value: string }>>;
  descriptions?: Record<string, { value: string }>;
  claims?: Record<string, WikidataClaim[]>;
}

/** Wert einer Aussage: bevorzugte zuerst, veraltete nie */
function claimValue(entity: WikidataEntity, property: string): string | undefined {
  const claims = (entity.claims?.[property] ?? []).filter((claim) => claim.rank !== 'deprecated');
  const best = claims.find((claim) => claim.rank === 'preferred') ?? claims[0];
  const value = best?.mainsnak?.datavalue?.value;
  return typeof value === 'string' ? value : undefined;
}

/** Wikidata-Eintrag als Treffer – nur, wenn er ein Stoff ist (Struktur oder Summenformel) */
export function fromWikidata(entity: WikidataEntity): SourceHit | null {
  if (entity.missing !== undefined) return null;
  // P2017 isomeres SMILES, P233 (kanonisches) SMILES, P274 Summenformel, P231 CAS, P235 InChIKey, P662 PubChem-CID
  const smiles = claimValue(entity, 'P2017') ?? claimValue(entity, 'P233');
  const formula = plainFormula(claimValue(entity, 'P274'));
  if (!smiles && !formula) return null;
  const label = entity.labels?.de?.value ?? entity.labels?.en?.value ?? entity.id;
  const cid = Number(claimValue(entity, 'P662'));
  const aliases = [...(entity.aliases?.de ?? []), ...(entity.aliases?.en ?? [])].map((alias) => alias.value);
  return {
    source: 'wikidata',
    ref: entity.id,
    name: label,
    smiles,
    formula,
    cas: claimValue(entity, 'P231'),
    inchiKey: claimValue(entity, 'P235'),
    cid: Number.isFinite(cid) && cid > 0 ? cid : undefined,
    synonyms: [...new Set([entity.labels?.en?.value ?? '', ...aliases].filter((name) => name && name !== label))].slice(0, 12),
    description: entity.descriptions?.de?.value ?? entity.descriptions?.en?.value,
    url: `https://www.wikidata.org/wiki/${entity.id}`,
  };
}

async function wikidataEntities(ids: string[]): Promise<SourceHit[]> {
  if (!ids.length) return [];
  const params = new URLSearchParams({
    action: 'wbgetentities',
    ids: ids.join('|'),
    props: 'labels|aliases|descriptions|claims',
    languages: 'de|en',
    format: 'json',
    origin: '*',
  });
  const data = (await request(`${WIKIDATA_API}?${params.toString()}`, `wd:ent:${ids.join('|')}`, 'json')) as {
    entities?: Record<string, WikidataEntity>;
  } | null;
  return ids
    .map((id) => data?.entities?.[id])
    .map((entity) => (entity ? fromWikidata(entity) : null))
    .filter((hit): hit is SourceHit => Boolean(hit));
}

/** Suche in Wikidata mit deutschen Namen; nur Einträge, die Stoffe sind */
export async function wikidataSearch(term: string, limit = 5): Promise<SourceHit[]> {
  const text = term.trim();
  if (text.length < 2) return [];
  // CAS-Nummer oder InChIKey: gezielt über die Aussage suchen
  if (looksLikeCas(text) || looksLikeInchiKey(text)) {
    const property = looksLikeCas(text) ? 'P231' : 'P235';
    const params = new URLSearchParams({
      action: 'query',
      list: 'search',
      srsearch: `haswbstatement:${property}=${text}`,
      srlimit: '3',
      format: 'json',
      origin: '*',
    });
    const data = (await request(`${WIKIDATA_API}?${params.toString()}`, `wd:stmt:${property}:${text}`, 'json')) as {
      query?: { search?: Array<{ title: string }> };
    } | null;
    return wikidataEntities((data?.query?.search ?? []).map((entry) => entry.title).filter((id) => /^Q\d+$/.test(id)));
  }
  const params = new URLSearchParams({
    action: 'wbsearchentities',
    search: text,
    language: 'de',
    uselang: 'de',
    type: 'item',
    limit: String(Math.min(20, limit * 2)),
    format: 'json',
    origin: '*',
  });
  const data = (await request(`${WIKIDATA_API}?${params.toString()}`, `wd:search:${text.toLowerCase()}:${limit}`, 'json')) as {
    search?: Array<{ id: string }>;
  } | null;
  const hits = await wikidataEntities((data?.search ?? []).map((entry) => entry.id).filter((id) => /^Q\d+$/.test(id)));
  return hits.slice(0, limit);
}

export async function wikidataById(id: string): Promise<SourceHit | null> {
  return /^Q\d+$/.test(id) ? ((await wikidataEntities([id]))[0] ?? null) : null;
}

// ---------------------------------------------------------------------
// ChEMBL
// ---------------------------------------------------------------------

const CHEMBL_API = 'https://www.ebi.ac.uk/chembl/api/data';

interface ChemblMolecule {
  molecule_chembl_id?: string;
  pref_name?: string | null;
  molecule_structures?: { canonical_smiles?: string; standard_inchi_key?: string } | null;
  molecule_properties?: { full_molformula?: string } | null;
  molecule_synonyms?: Array<{ molecule_synonym?: string }> | null;
}

function titleCase(name: string): string {
  // ChEMBL schreibt Namen in Großbuchstaben: «CAFFEINE» → «Caffeine»
  return name === name.toUpperCase() ? name.charAt(0) + name.slice(1).toLowerCase() : name;
}

export function fromChembl(molecule: ChemblMolecule, label?: string): SourceHit | null {
  const id = molecule.molecule_chembl_id;
  const smiles = molecule.molecule_structures?.canonical_smiles;
  if (!id || !smiles) return null;
  const name = label || (molecule.pref_name ? titleCase(molecule.pref_name) : id);
  return {
    source: 'chembl',
    ref: id,
    name,
    smiles,
    formula: plainFormula(molecule.molecule_properties?.full_molformula),
    inchiKey: molecule.molecule_structures?.standard_inchi_key,
    synonyms: [...new Set((molecule.molecule_synonyms ?? []).map((entry) => entry.molecule_synonym ?? '').filter(Boolean))].slice(0, 10),
    description: `ChEMBL ${id}`,
    url: `https://www.ebi.ac.uk/chembl/compound_report_card/${id}/`,
  };
}

export async function chemblSearch(term: string, limit = 3): Promise<SourceHit[]> {
  const text = term.trim();
  if (text.length < 3) return [];
  const url = looksLikeInchiKey(text)
    ? `${CHEMBL_API}/molecule.json?molecule_structures__standard_inchi_key=${encodeURIComponent(text)}&limit=${limit}`
    : `${CHEMBL_API}/molecule/search.json?q=${encodeURIComponent(text)}&limit=${limit}`;
  const data = (await request(url, `chembl:${text.toLowerCase()}:${limit}`, 'json')) as { molecules?: ChemblMolecule[] } | null;
  return (data?.molecules ?? []).map((molecule) => fromChembl(molecule)).filter((hit): hit is SourceHit => Boolean(hit));
}

export async function chemblById(id: string): Promise<SourceHit | null> {
  if (!/^CHEMBL\d+$/.test(id)) return null;
  const data = (await request(`${CHEMBL_API}/molecule/${id}.json`, `chembl:id:${id}`, 'json')) as ChemblMolecule | null;
  return data ? fromChembl(data) : null;
}

// ---------------------------------------------------------------------
// NCI CACTUS (Chemical Identifier Resolver)
// ---------------------------------------------------------------------

export async function cactusResolve(term: string): Promise<SourceHit | null> {
  const text = term.trim();
  if (text.length < 2) return null;
  const encoded = encodeURIComponent(text);
  const smilesText = (await request(`https://cactus.nci.nih.gov/chemical/structure/${encoded}/smiles`, `cactus:${text.toLowerCase()}`, 'text')) as string | null;
  const smiles = smilesText?.split('\n')[0]?.trim();
  // Eine HTML-Fehlerseite ist kein SMILES
  if (!smiles || /[<>\s]/.test(smiles)) return null;
  return {
    source: 'cactus',
    ref: text,
    name: looksLikeInchiKey(text) ? 'Eintrag zum InChIKey' : text,
    smiles,
    synonyms: [],
    description: 'NCI Chemical Identifier Resolver',
    url: `https://cactus.nci.nih.gov/chemical/structure/${encoded}/names`,
  };
}

// ---------------------------------------------------------------------
// OPSIN (IUPAC-Namen)
// ---------------------------------------------------------------------

export async function opsinParse(term: string): Promise<SourceHit | null> {
  const text = term.trim();
  // OPSIN liest nur Namen – keine CAS-Nummern, Formeln oder Kürzel
  if (text.length < 3 || looksLikeCas(text) || looksLikeInchiKey(text) || /^[A-Z0-9()]+$/.test(text)) return null;
  const encoded = encodeURIComponent(text);
  const data = (await request(`https://opsin.ch.cam.ac.uk/opsin/${encoded}.json`, `opsin:${text.toLowerCase()}`, 'json')) as {
    status?: string;
    smiles?: string;
    stdinchikey?: string;
  } | null;
  if (data?.status !== 'SUCCESS' || !data.smiles) return null;
  return {
    source: 'opsin',
    ref: text,
    name: text,
    smiles: data.smiles,
    inchiKey: data.stdinchikey,
    synonyms: [],
    description: 'Aus dem systematischen Namen abgeleitet (OPSIN)',
    url: `https://opsin.ch.cam.ac.uk/#${encoded}`,
  };
}

// ---------------------------------------------------------------------
// Alle Quellen zusammen
// ---------------------------------------------------------------------

export interface LookupResult {
  hits: SourceHit[];
  /** Quellen, die geantwortet, aber nichts gefunden haben */
  empty: SourceId[];
}

/**
 * Fragt alle Quellen gleichzeitig nach einem Namen, einer CAS-Nummer, einem
 * InChIKey oder einer Formel. Je Quelle zählt der beste Treffer.
 */
export async function lookupEverywhere(term: string, sources: SourceId[] = SOURCE_ORDER): Promise<LookupResult> {
  const text = term.trim();
  if (!text) return { hits: [], empty: [] };
  const tasks: Record<SourceId, () => Promise<SourceHit | null>> = {
    pubchem: () => pubchemLookup(text),
    wikidata: async () => (await wikidataSearch(text, 3))[0] ?? null,
    chembl: async () => (await chemblSearch(text, 1))[0] ?? null,
    cactus: () => cactusResolve(text),
    opsin: () => opsinParse(text),
  };
  const results = await Promise.all(sources.map((source) => tasks[source]().catch(() => null)));
  const hits = results.filter((hit): hit is SourceHit => Boolean(hit));
  return { hits, empty: sources.filter((_, index) => !results[index]) };
}

/** Für die Stoffseite: denselben Stoff (InChIKey) in allen Quellen nachschlagen */
export async function crossReference(inchiKey: string): Promise<LookupResult> {
  const key = inchiKey.trim();
  if (!looksLikeInchiKey(key)) return { hits: [], empty: [] };
  const sources: SourceId[] = ['pubchem', 'wikidata', 'chembl', 'cactus'];
  const tasks: Record<string, () => Promise<SourceHit | null>> = {
    pubchem: () => pubchemByInchiKey(key),
    wikidata: async () => (await wikidataSearch(key, 1))[0] ?? null,
    chembl: async () => (await chemblSearch(key, 1))[0] ?? null,
    cactus: () => cactusResolve(key),
  };
  const results = await Promise.all(sources.map((source) => tasks[source]().catch(() => null)));
  return { hits: results.filter((hit): hit is SourceHit => Boolean(hit)), empty: sources.filter((_, index) => !results[index]) };
}

export interface NameSuggestion {
  label: string;
  source: SourceId;
  detail?: string;
  /** vollständiger Treffer, falls die Quelle ihn schon mitliefert */
  hit?: SourceHit;
}

/**
 * Namensvorschläge beim Tippen: PubChem (englische und Handelsnamen) und
 * Wikidata (deutsche Namen, nur Einträge, die Stoffe sind).
 */
export async function suggestNames(term: string, limit = 10): Promise<NameSuggestion[]> {
  const text = term.trim();
  if (text.length < 2) return [];
  const [pubchem, wikidata] = await Promise.all([autocomplete(text, limit).catch(() => []), wikidataSearch(text, 5).catch(() => [])]);
  const seen = new Set<string>();
  const suggestions: NameSuggestion[] = [];
  const push = (entry: NameSuggestion): void => {
    const key = entry.label.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    suggestions.push(entry);
  };
  // Deutsche Namen aus Wikidata zuerst, dann PubChem
  for (const hit of wikidata) push({ label: hit.name, source: 'wikidata', detail: hit.formula ?? hit.description, hit });
  for (const name of pubchem) push({ label: name, source: 'pubchem' });
  return suggestions.slice(0, limit);
}
