/**
 * Zugriff auf die PubChem-Datenbank (PUG REST und PUG View).
 *
 * PubChem erlaubt höchstens 5 Anfragen pro Sekunde; alle Aufrufe laufen deshalb
 * über eine Warteschlange. Antworten werden zwischengespeichert, damit die App
 * auch offline mit einmal geladenen Stoffen weiterarbeiten kann.
 *
 * Schlägt eine Anfrage fehl, liefern die Funktionen `null` – die Oberfläche
 * greift dann auf die mitgelieferte lokale Stoffdatenbank zurück.
 */

const BASE_URL = 'https://pubchem.ncbi.nlm.nih.gov/rest/pug';
const VIEW_URL = 'https://pubchem.ncbi.nlm.nih.gov/rest/pug_view';
const CACHE_PREFIX = 'pubchem:';
const CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 Tage

/** Moderne Eigenschaftsnamen; CanonicalSMILES/IsomericSMILES sind abgelöst. */
const PROPERTY_FIELDS = [
  'Title',
  'MolecularFormula',
  'MolecularWeight',
  'SMILES',
  'ConnectivitySMILES',
  'InChI',
  'InChIKey',
  'IUPACName',
  'XLogP',
  'TPSA',
  'Charge',
  'HBondDonorCount',
  'HBondAcceptorCount',
  'RotatableBondCount',
  'HeavyAtomCount',
  'ExactMass',
  'MonoisotopicMass',
  'Complexity',
];

/** Ältere PubChem-Instanzen kennen die neuen Namen noch nicht. */
const LEGACY_PROPERTY_FIELDS = PROPERTY_FIELDS.map((field) =>
  field === 'SMILES' ? 'IsomericSMILES' : field === 'ConnectivitySMILES' ? 'CanonicalSMILES' : field,
);

export interface PubChemCompound {
  cid: number;
  title?: string;
  iupacName?: string;
  formula?: string;
  molecularWeight?: number;
  exactMass?: number;
  smiles?: string;
  connectivitySmiles?: string;
  inchi?: string;
  inchiKey?: string;
  xlogp?: number;
  tpsa?: number;
  charge?: number;
  hBondDonors?: number;
  hBondAcceptors?: number;
  rotatableBonds?: number;
  heavyAtoms?: number;
  complexity?: number;
}

export interface GhsInformation {
  pictograms: string[];
  signalWord?: string;
  hazardStatements: string[];
  precautionaryStatements: string[];
}

export interface AutocompleteResult {
  term: string;
}

class RequestQueue {
  private queue: Array<() => void> = [];
  private timestamps: number[] = [];
  private readonly maxPerSecond: number;

  constructor(maxPerSecond = 5) {
    this.maxPerSecond = maxPerSecond;
  }

  schedule<T>(task: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const run = (): void => {
        this.timestamps.push(Date.now());
        task().then(resolve, reject);
      };
      this.queue.push(run);
      this.drain();
    });
  }

  private drain(): void {
    const now = Date.now();
    this.timestamps = this.timestamps.filter((time) => now - time < 1000);

    while (this.queue.length && this.timestamps.length < this.maxPerSecond) {
      const next = this.queue.shift();
      next?.();
      this.timestamps.push(now);
    }

    if (this.queue.length) {
      const wait = 1000 - (now - (this.timestamps[0] ?? now)) + 20;
      setTimeout(() => this.drain(), Math.max(50, wait));
    }
  }
}

const queue = new RequestQueue(5);

function readCache<T>(key: string): T | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const entry = JSON.parse(raw) as { value: T; time: number };
    if (Date.now() - entry.time > CACHE_TTL_MS) {
      localStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }
    return entry.value;
  } catch {
    return null;
  }
}

function writeCache<T>(key: string, value: T): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ value, time: Date.now() }));
  } catch {
    // Speicher voll oder privater Modus – Cache ist optional
  }
}

async function fetchJson<T>(url: string, cacheKey: string): Promise<T | null> {
  const cached = readCache<T>(cacheKey);
  if (cached) return cached;

  try {
    const data = await queue.schedule(async () => {
      const response = await fetch(url, { headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error(`PubChem antwortete mit ${response.status}`);
      return (await response.json()) as T;
    });
    writeCache(cacheKey, data);
    return data;
  } catch {
    return null;
  }
}

interface PropertyResponse {
  PropertyTable?: { Properties?: Array<Record<string, unknown>> };
}

function mapProperties(raw: Record<string, unknown>): PubChemCompound {
  const num = (value: unknown): number | undefined => {
    const parsed = typeof value === 'string' ? Number(value) : (value as number);
    return Number.isFinite(parsed) ? parsed : undefined;
  };

  return {
    cid: Number(raw.CID),
    title: raw.Title as string | undefined,
    iupacName: raw.IUPACName as string | undefined,
    formula: raw.MolecularFormula as string | undefined,
    molecularWeight: num(raw.MolecularWeight),
    exactMass: num(raw.ExactMass),
    smiles: (raw.SMILES ?? raw.IsomericSMILES) as string | undefined,
    connectivitySmiles: (raw.ConnectivitySMILES ?? raw.CanonicalSMILES) as string | undefined,
    inchi: raw.InChI as string | undefined,
    inchiKey: raw.InChIKey as string | undefined,
    xlogp: num(raw.XLogP),
    tpsa: num(raw.TPSA),
    charge: num(raw.Charge),
    hBondDonors: num(raw.HBondDonorCount),
    hBondAcceptors: num(raw.HBondAcceptorCount),
    rotatableBonds: num(raw.RotatableBondCount),
    heavyAtoms: num(raw.HeavyAtomCount),
    complexity: num(raw.Complexity),
  };
}

/** Vorschläge für die Stoffeingabe. */
export async function autocomplete(query: string, limit = 10): Promise<string[]> {
  const term = query.trim();
  if (term.length < 2) return [];

  const data = await fetchJson<{ dictionary_terms?: { compound?: string[] } }>(
    `https://pubchem.ncbi.nlm.nih.gov/rest/autocomplete/compound/${encodeURIComponent(term)}/json?limit=${limit}`,
    `auto:${term.toLowerCase()}:${limit}`,
  );
  return data?.dictionary_terms?.compound ?? [];
}

/** Sucht CIDs zu einem Namen. */
export async function cidsByName(name: string): Promise<number[]> {
  const data = await fetchJson<{ IdentifierList?: { CID?: number[] } }>(
    `${BASE_URL}/compound/name/${encodeURIComponent(name.trim())}/cids/JSON`,
    `cid:name:${name.trim().toLowerCase()}`,
  );
  return data?.IdentifierList?.CID ?? [];
}

/** Sucht CIDs zu einer Summenformel. */
export async function cidsByFormula(formula: string, limit = 10): Promise<number[]> {
  const data = await fetchJson<{ IdentifierList?: { CID?: number[] } }>(
    `${BASE_URL}/compound/fastformula/${encodeURIComponent(formula.trim())}/cids/JSON?MaxRecords=${limit}`,
    `cid:formula:${formula.trim()}:${limit}`,
  );
  return data?.IdentifierList?.CID ?? [];
}

/** Sucht CIDs zu einer SMILES-Struktur. */
export async function cidsBySmiles(smiles: string): Promise<number[]> {
  const data = await fetchJson<{ IdentifierList?: { CID?: number[] } }>(
    `${BASE_URL}/compound/smiles/${encodeURIComponent(smiles.trim())}/cids/JSON`,
    `cid:smiles:${smiles.trim()}`,
  );
  return data?.IdentifierList?.CID ?? [];
}

/** Lädt die Stoffdaten zu einer CID. */
export async function compoundByCid(cid: number): Promise<PubChemCompound | null> {
  const modern = await fetchJson<PropertyResponse>(
    `${BASE_URL}/compound/cid/${cid}/property/${PROPERTY_FIELDS.join(',')}/JSON`,
    `prop:${cid}`,
  );
  const properties = modern?.PropertyTable?.Properties?.[0];
  if (properties) return mapProperties(properties);

  // Fallback auf die alten Eigenschaftsnamen
  const legacy = await fetchJson<PropertyResponse>(
    `${BASE_URL}/compound/cid/${cid}/property/${LEGACY_PROPERTY_FIELDS.join(',')}/JSON`,
    `prop:legacy:${cid}`,
  );
  const legacyProperties = legacy?.PropertyTable?.Properties?.[0];
  return legacyProperties ? mapProperties(legacyProperties) : null;
}

/** Sucht einen Stoff über Name, Formel oder SMILES. */
export async function findCompound(query: string): Promise<PubChemCompound | null> {
  const term = query.trim();
  if (!term) return null;

  let cids = await cidsByName(term);
  if (!cids.length && /^[A-Za-z0-9()\[\]·.]+$/.test(term)) cids = await cidsByFormula(term, 1);
  if (!cids.length) cids = await cidsBySmiles(term);
  if (!cids.length) return null;

  return compoundByCid(cids[0]);
}

/** Synonyme eines Stoffs (erste Treffer sind meist die gebräuchlichsten Namen). */
export async function synonyms(cid: number, limit = 12): Promise<string[]> {
  const data = await fetchJson<{
    InformationList?: { Information?: Array<{ Synonym?: string[] }> };
  }>(`${BASE_URL}/compound/cid/${cid}/synonyms/JSON`, `syn:${cid}`);
  return (data?.InformationList?.Information?.[0]?.Synonym ?? []).slice(0, limit);
}

interface ViewSection {
  TOCHeading?: string;
  Section?: ViewSection[];
  Information?: Array<{
    Name?: string;
    Value?: {
      StringWithMarkup?: Array<{ String?: string }>;
    };
  }>;
}

function collectSections(section: ViewSection, heading: string, found: ViewSection[] = []): ViewSection[] {
  if (section.TOCHeading === heading) found.push(section);
  for (const child of section.Section ?? []) collectSections(child, heading, found);
  return found;
}

function stringsOf(section: ViewSection | undefined, name?: string): string[] {
  if (!section) return [];
  const values: string[] = [];
  for (const info of section.Information ?? []) {
    if (name && info.Name !== name) continue;
    for (const markup of info.Value?.StringWithMarkup ?? []) {
      if (markup.String) values.push(markup.String);
    }
  }
  return values;
}

/** GHS-Einstufung aus PUG View (Gefahrenpiktogramme, H- und P-Sätze). */
export async function ghsInformation(cid: number): Promise<GhsInformation | null> {
  const data = await fetchJson<{ Record?: ViewSection }>(
    `${VIEW_URL}/data/compound/${cid}/JSON?heading=GHS%20Classification`,
    `ghs:${cid}`,
  );
  if (!data?.Record) return null;

  const sections = collectSections(data.Record, 'GHS Classification');
  if (!sections.length) return null;
  const section = sections[0];

  const pictograms = stringsOf(section, 'Pictogram(s)');
  const signalWords = stringsOf(section, 'Signal');
  const hazards = stringsOf(section, 'GHS Hazard Statements');
  const precautions = stringsOf(section, 'Precautionary Statement Codes');

  return {
    pictograms: pictograms.length ? pictograms : stringsOf(section).filter((s) => /GHS0\d/.test(s)),
    signalWord: signalWords[0],
    hazardStatements: hazards,
    precautionaryStatements: precautions,
  };
}

/** URL des 2D-Strukturbildes; funktioniert nur online. */
export function structureImageUrl(cid: number, size: 'small' | 'large' = 'large'): string {
  return `${BASE_URL}/compound/cid/${cid}/PNG?record_type=2d&image_size=${size}`;
}

/** Link auf die PubChem-Seite des Stoffs. */
export function compoundPageUrl(cid: number): string {
  return `https://pubchem.ncbi.nlm.nih.gov/compound/${cid}`;
}

/** Entfernt alle zwischengespeicherten PubChem-Antworten. */
export function clearCache(): void {
  if (typeof localStorage === 'undefined') return;
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(CACHE_PREFIX)) keys.push(key);
  }
  keys.forEach((key) => localStorage.removeItem(key));
}
