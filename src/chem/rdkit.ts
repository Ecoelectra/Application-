/**
 * Anbindung der RDKit-MinimalLib (WebAssembly).
 *
 * Die Bibliothek wird einmalig nachgeladen und über schlanke Hilfsfunktionen
 * gekapselt, die sich um das Freigeben der C++-Objekte kümmern. Ohne diese
 * `delete()`-Aufrufe läuft der WASM-Heap voll.
 */
import type { JSMolListList, MainModule, Mol, MolList, Reaction } from '@rdkit/rdkit';
import { ELEMENTS } from './elements';
import { toHillFormula } from './formula';

export type RDKitModule = MainModule;

declare global {
  interface Window {
    initRDKitModule?: (options?: Record<string, unknown>) => Promise<MainModule>;
    RDKit?: MainModule;
  }
}

let loadPromise: Promise<MainModule> | null = null;

function assetUrl(file: string): string {
  const base = import.meta.env.BASE_URL || '/';
  return `${base.endsWith('/') ? base : `${base}/`}rdkit/${file}`;
}

/** Lädt RDKit genau einmal; weitere Aufrufe erhalten dieselbe Instanz. */
export function loadRDKit(): Promise<MainModule> {
  if (loadPromise) return loadPromise;

  loadPromise = new Promise<MainModule>((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('RDKit benötigt eine Browserumgebung.'));
      return;
    }
    if (window.RDKit) {
      resolve(window.RDKit);
      return;
    }

    const start = (): void => {
      const factory = window.initRDKitModule;
      if (!factory) {
        reject(new Error('RDKit konnte nicht geladen werden.'));
        return;
      }
      factory({ locateFile: (file: string) => assetUrl(file) })
        .then((instance) => {
          window.RDKit = instance;
          resolve(instance);
        })
        .catch(reject);
    };

    if (window.initRDKitModule) {
      start();
      return;
    }

    const script = document.createElement('script');
    script.src = assetUrl('RDKit_minimal.js');
    script.async = true;
    script.onload = start;
    script.onerror = () => reject(new Error('RDKit-Skript nicht erreichbar.'));
    document.head.appendChild(script);
  });

  return loadPromise;
}

/** Bereits geladene Instanz, falls vorhanden (für synchrone Aufrufe). */
export function rdkitOrNull(): MainModule | null {
  return typeof window !== 'undefined' ? window.RDKit ?? null : null;
}

/** Führt eine Aktion mit einem Molekül aus und gibt den Speicher zuverlässig frei. */
export function withMol<T>(
  rdkit: MainModule,
  smiles: string,
  action: (mol: Mol) => T,
): T | null {
  let mol: Mol | null = null;
  try {
    mol = rdkit.get_mol(smiles);
    if (!mol || !mol.is_valid()) return null;
    return action(mol);
  } catch {
    return null;
  } finally {
    mol?.delete();
  }
}

export interface MoleculeInfo {
  smiles: string;
  canonicalSmiles: string;
  formula: string;
  molecularWeight: number;
  exactMass: number;
  logP: number;
  tpsa: number;
  numHBD: number;
  numHBA: number;
  numRings: number;
  numRotatableBonds: number;
  numHeavyAtoms: number;
  fractionCSP3: number;
}

/** Berechnet Kenngrößen direkt im Browser – funktioniert auch ohne Netz. */
export function describeMolecule(rdkit: MainModule, smiles: string): MoleculeInfo | null {
  return withMol(rdkit, smiles, (mol) => {
    const descriptors = JSON.parse(mol.get_descriptors()) as Record<string, number>;
    return {
      smiles,
      canonicalSmiles: mol.get_smiles(),
      formula: molecularFormula(rdkit, smiles) ?? '',
      molecularWeight: descriptors.amw ?? 0,
      exactMass: descriptors.exactmw ?? 0,
      logP: descriptors.CrippenClogP ?? 0,
      tpsa: descriptors.tpsa ?? 0,
      numHBD: descriptors.NumHBD ?? 0,
      numHBA: descriptors.NumHBA ?? 0,
      numRings: descriptors.NumRings ?? 0,
      numRotatableBonds: descriptors.NumRotatableBonds ?? 0,
      numHeavyAtoms: descriptors.NumHeavyAtoms ?? 0,
      fractionCSP3: descriptors.FractionCSP3 ?? 0,
    };
  });
}

export interface DrawOptions {
  width?: number;
  height?: number;
  highlightAtoms?: number[];
  highlightBonds?: number[];
  legend?: string;
  highlightColour?: [number, number, number];
}

/** Erzeugt ein SVG der Struktur, optional mit hervorgehobenen Atomen. */
export function moleculeSvg(
  rdkit: MainModule,
  smiles: string,
  options: DrawOptions = {},
): string | null {
  const {
    width = 320,
    height = 240,
    highlightAtoms,
    highlightBonds,
    legend,
    highlightColour = [1, 0.55, 0.1],
  } = options;

  return withMol(rdkit, smiles, (mol) => {
    const details: Record<string, unknown> = {
      width,
      height,
      backgroundColour: [0, 0, 0, 0],
      addStereoAnnotation: true,
      explicitMethyl: false,
      // Aromatische Ringe als Kekulé-Struktur zeichnen – sonst erscheinen die
      // Bindungen gestrichelt statt als abwechselnde Doppelbindungen.
      kekulize: true,
      prepareMolsBeforeDrawing: true,
    };
    if (legend) details.legend = legend;
    if (highlightAtoms?.length) {
      details.atoms = highlightAtoms;
      details.highlightColour = highlightColour;
    }
    if (highlightBonds?.length) details.bonds = highlightBonds;

    const svg =
      highlightAtoms?.length || highlightBonds?.length || legend
        ? mol.get_svg_with_highlights(JSON.stringify(details))
        : mol.get_svg_with_highlights(JSON.stringify(details));
    return svg;
  });
}

/** SVG einer Reaktionsgleichung aus Reaktions-SMILES oder Reaktions-SMARTS. */
export function reactionSvg(
  rdkit: MainModule,
  reactionSmarts: string,
  options: { width?: number; height?: number } = {},
): string | null {
  const { width = 720, height = 220 } = options;
  let rxn: Reaction | null = null;
  try {
    rxn = rdkit.get_rxn(reactionSmarts);
    if (!rxn) return null;
    return rxn.get_svg_with_highlights(
      JSON.stringify({
        width,
        height,
        backgroundColour: [0, 0, 0, 0],
        kekulize: true,
        prepareMolsBeforeDrawing: true,
      }),
    );
  } catch {
    return null;
  } finally {
    rxn?.delete();
  }
}

export interface SubstructureMatch {
  atoms: number[];
  bonds: number[];
}

/** Sucht alle Treffer eines SMARTS-Musters. */
export function matchSmarts(
  rdkit: MainModule,
  smiles: string,
  smarts: string,
): SubstructureMatch[] {
  let query: Mol | null = null;
  try {
    query = rdkit.get_qmol(smarts);
    if (!query) return [];
    const result = withMol(rdkit, smiles, (mol) => {
      const raw = mol.get_substruct_matches(query as Mol);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as SubstructureMatch[];
      return Array.isArray(parsed) ? parsed : [];
    });
    return result ?? [];
  } catch {
    return [];
  } finally {
    query?.delete();
  }
}

export function hasSubstructure(rdkit: MainModule, smiles: string, smarts: string): boolean {
  return matchSmarts(rdkit, smiles, smarts).length > 0;
}

/** Kanonische SMILES; liefert null bei ungültiger Eingabe. */
export function canonicalSmiles(rdkit: MainModule, smiles: string): string | null {
  return withMol(rdkit, smiles, (mol) => mol.get_smiles());
}

export function isValidSmiles(rdkit: MainModule, smiles: string): boolean {
  return canonicalSmiles(rdkit, smiles) !== null;
}

interface CommonChemAtom {
  z?: number;
  impHs?: number;
  chg?: number;
}

/**
 * Summenformel in Hill-Notation. RDKit liefert sie nicht als Deskriptor, sie
 * wird daher aus der CommonChem-Darstellung des Moleküls aufgebaut.
 */
export function molecularFormula(rdkit: MainModule, smiles: string): string | null {
  return withMol(rdkit, smiles, (mol) => {
    const json = JSON.parse(mol.get_json()) as {
      defaults?: { atom?: CommonChemAtom };
      molecules?: { atoms?: CommonChemAtom[] }[];
    };
    const defaults = json.defaults?.atom ?? {};
    const counts: Record<string, number> = {};
    let charge = 0;

    for (const molecule of json.molecules ?? []) {
      for (const atom of molecule.atoms ?? []) {
        const z = atom.z ?? defaults.z ?? 6;
        const implicitHydrogens = atom.impHs ?? defaults.impHs ?? 0;
        charge += atom.chg ?? defaults.chg ?? 0;
        const element = ELEMENTS[z - 1]?.symbol;
        if (!element) continue;
        counts[element] = (counts[element] ?? 0) + 1;
        if (implicitHydrogens > 0) counts.H = (counts.H ?? 0) + implicitHydrogens;
      }
    }

    const formula = toHillFormula(counts);
    if (charge === 0) return formula;
    const magnitude = Math.abs(charge) === 1 ? '' : String(Math.abs(charge));
    return `${formula}^${magnitude}${charge > 0 ? '+' : '-'}`;
  });
}

/**
 * Wendet eine Reaktionsvorschrift (Reaktions-SMARTS/SMIRKS) auf Edukte an und
 * liefert die Produktsätze als kanonische SMILES.
 */
export function runReaction(
  rdkit: MainModule,
  reactionSmarts: string,
  reactantSmiles: string[],
  maxProducts = 16,
): string[][] {
  const reactants = reactantSmiles.map((smiles) => rdkit.get_mol(smiles));
  if (reactants.some((mol) => !mol || !mol.is_valid())) {
    reactants.forEach((mol) => mol?.delete());
    return [];
  }

  let rxn: Reaction | null = null;
  let molList: MolList | null = null;
  let productSets: JSMolListList | null = null;
  const results: string[][] = [];

  try {
    rxn = rdkit.get_rxn(reactionSmarts);
    if (!rxn) return [];

    molList = new rdkit.MolList();
    reactants.forEach((mol) => molList?.append(mol as Mol));

    productSets = rxn.run_reactants(molList, maxProducts);
    const setCount = productSets.size();

    for (let i = 0; i < setCount; i++) {
      const set = productSets.get(i);
      if (!set) continue;
      const products: string[] = [];
      let chemicallyValid = true;
      for (let j = 0; j < set.size(); j++) {
        const product = set.at(j);
        if (!product) continue;
        try {
          // Produkte aus run_reactants sind nicht sanitisiert: über SMILES
          // neu einlesen, damit Aromatizität und Valenzen stimmen. Scheitert
          // das (etwa fünfbindiger Kohlenstoff, weil dem Substrat das nötige
          // H-Atom fehlt), ist der ganze Produktsatz unbrauchbar.
          const clean = canonicalSmiles(rdkit, product.get_smiles());
          if (clean) products.push(clean);
          else chemicallyValid = false;
        } catch {
          chemicallyValid = false;
        } finally {
          product.delete();
        }
      }
      set.delete();
      if (products.length && chemicallyValid) results.push(products);
    }
  } catch {
    return dedupeProductSets(results);
  } finally {
    productSets?.delete();
    molList?.delete();
    rxn?.delete();
    reactants.forEach((mol) => mol?.delete());
  }

  return dedupeProductSets(results);
}

function dedupeProductSets(sets: string[][]): string[][] {
  const seen = new Set<string>();
  const unique: string[][] = [];
  for (const set of sets) {
    const key = [...set].sort().join('.');
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(set);
  }
  return unique;
}
