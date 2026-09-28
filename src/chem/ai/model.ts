/**
 * Laden des trainierten Modells (public/ki/netz.bin.gz und vorlagen.json.gz).
 *
 * Beide Dateien werden beim ersten Gebrauch geladen und entpackt; der Service
 * Worker hält sie danach offline bereit.
 */
import { decodeNetwork, type Network } from './network';

export interface TemplateInfo {
  /** Reaktions-SMARTS */
  s: string;
  /** Fundstellen im Trainingsdatensatz */
  n: number;
  /** Reaktionsfamilie */
  f: string;
  /** Zahl der Edukte */
  a: number;
  /** Anteil der Patente mit Hilfsstoff der Kategorie */
  c: { [category: string]: number };
  /** häufigste Hilfsstoffe: [SMILES, Anzahl, Name, Kategorie] */
  t: Array<[string, number, string, string]>;
  /** Beispielreaktion «Edukte>>Produkt» */
  e: string;
  /** Fundstelle im Datensatz */
  q: string;
}

export interface ModelMetrics {
  trainingReactions: number;
  templates: number;
  testReactions: number;
  templateTop1: number;
  templateTop5: number;
  templateTop10: number;
  productSample: number;
  productTop1: number;
  productTop3: number;
  productTop5: number;
  catalystCases: number;
  catalystTop1: number;
}

export interface ReactionModel {
  network: Network;
  templates: TemplateInfo[];
  categories: string[];
  metrics: ModelMetrics;
  source: string;
  /** verschiedene Reaktionen je Quelle (ab dem Training mit mehreren Quellen) */
  sources?: Record<string, number>;
  created: string;
}

/** Lesbare Namen der Trainingsquellen */
export const SOURCE_LABELS: Record<string, string> = {
  'uspto-mit': 'US-Patente (USPTO-MIT)',
  'uspto-full': 'US-Patente 1976–2016 (Lowe)',
  'uspto-stereo': 'US-Patente (USPTO-STEREO)',
  enzymemap: 'Enzymreaktionen aus BRENDA (EnzymeMap)',
  'ecreact-brenda': 'Enzymreaktionen aus BRENDA (ECREACT)',
  'ecreact-rhea': 'Biochemische Reaktionen aus Rhea',
  'ecreact-pathbank': 'Stoffwechselwege aus PathBank',
  'ecreact-metanetx': 'Stoffwechselnetze aus MetaNetX',
  'hte-suzuki': 'Suzuki-Hochdurchsatzversuche (Pfizer)',
  'hte-buchwald': 'Buchwald-Hartwig-Hochdurchsatzversuche (Merck)',
};

export type ModelFileLoader = (file: string) => Promise<Uint8Array | null>;

function baseUrl(): string {
  const base = (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL) || './';
  return base.endsWith('/') ? base : `${base}/`;
}

let loader: ModelFileLoader = async (file) => {
  const response = await fetch(`${baseUrl()}ki/${file}`);
  if (!response.ok) return null;
  return new Uint8Array(await response.arrayBuffer());
};

/** Für Tests und Skripte: Dateien vom Datenträger lesen. */
export function setModelFileLoader(next: ModelFileLoader): void {
  loader = next;
  modelPromise = null;
}

async function gunzip(bytes: Uint8Array): Promise<Uint8Array> {
  if (bytes[0] !== 0x1f || bytes[1] !== 0x8b) return bytes;
  if (typeof DecompressionStream === 'undefined') throw new Error('Dieser Browser kann das KI-Modell nicht entpacken.');
  const stream = new Blob([bytes as BlobPart]).stream().pipeThrough(new DecompressionStream('gzip'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

let modelPromise: Promise<ReactionModel | null> | null = null;

/** Lädt das Modell einmalig; null, wenn die Dateien fehlen. */
export function loadReactionModel(): Promise<ReactionModel | null> {
  if (!modelPromise) {
    modelPromise = (async () => {
      try {
        const [netBytes, templateBytes] = await Promise.all([loader('netz.bin.gz'), loader('vorlagen.json.gz')]);
        if (!netBytes || !templateBytes) return null;
        const network = decodeNetwork(await gunzip(netBytes));
        const data = JSON.parse(new TextDecoder().decode(await gunzip(templateBytes))) as {
          templates: TemplateInfo[];
          categories: string[];
          metrics: ModelMetrics;
          source: string;
          sources?: Record<string, number>;
          created: string;
        };
        if (data.templates.length !== network.templates) throw new Error('Netz und Vorlagen passen nicht zusammen');
        return { network, ...data };
      } catch (error) {
        console.warn('Reaktions-KI nicht verfügbar:', error);
        return null;
      }
    })();
  }
  return modelPromise;
}
