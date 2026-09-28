/**
 * Einlesen von SMILES mit Atomzuordnung, z. B. «[CH3:14][NH2:15]».
 *
 * RDKit liefert die Zuordnungsnummern im Browser nicht mit aus. Für das
 * Herausschneiden von Reaktionsvorlagen braucht es aber genau diese Nummern,
 * dazu Element, Aromatizität, Ladung, Wasserstoffzahl und Bindungsordnungen –
 * deshalb ein eigener, schlanker Leser für den SMILES-Teil, der in den
 * Patentdaten vorkommt.
 */

export interface GraphAtom {
  index: number;
  /** Elementsymbol in üblicher Schreibweise, z. B. «C», «Cl», «Pd» */
  element: string;
  aromatic: boolean;
  charge: number;
  /** Zahl der gebundenen Wasserstoffatome (explizit oder berechnet) */
  hydrogens: number;
  /** Zuordnungsnummer, 0 = keine */
  map: number;
  /** Nachbarn als [Atomindex, Bindungsordnung] */
  neighbors: Array<[number, BondOrder]>;
  /** Nummer des zusammenhängenden Moleküls */
  molecule: number;
}

/** 1, 2, 3 oder 1.5 für aromatisch */
export type BondOrder = 1 | 1.5 | 2 | 3;

export interface MolGraph {
  atoms: GraphAtom[];
  moleculeCount: number;
}

const ORGANIC = ['Cl', 'Br', 'B', 'C', 'N', 'O', 'P', 'S', 'F', 'I', 'b', 'c', 'n', 'o', 'p', 's'];
const DEFAULT_VALENCE: Record<string, number[]> = {
  B: [3], C: [4], N: [3, 5], O: [2], P: [3, 5], S: [2, 4, 6], F: [1], Cl: [1], Br: [1], I: [1],
};

function capitalize(symbol: string): string {
  return symbol[0].toUpperCase() + symbol.slice(1);
}

/** Liest ein SMILES (auch mehrere Moleküle, durch Punkte getrennt). Wirft bei Syntaxfehlern. */
export function parseMappedSmiles(smiles: string): MolGraph {
  const atoms: GraphAtom[] = [];
  const implicitH: boolean[] = [];
  const stack: number[] = [];
  const rings = new Map<number, { atom: number; order: BondOrder | null }>();
  let previous = -1;
  let pendingOrder: BondOrder | null = null;
  let i = 0;

  const bond = (a: number, b: number, explicit: BondOrder | null): void => {
    const order: BondOrder = explicit ?? (atoms[a].aromatic && atoms[b].aromatic ? 1.5 : 1);
    atoms[a].neighbors.push([b, order]);
    atoms[b].neighbors.push([a, order]);
  };

  const addAtom = (atom: Omit<GraphAtom, 'index' | 'neighbors' | 'molecule'>, implicit: boolean): void => {
    const index = atoms.length;
    atoms.push({ ...atom, index, neighbors: [], molecule: -1 });
    implicitH.push(implicit);
    if (previous >= 0) bond(previous, index, pendingOrder);
    pendingOrder = null;
    previous = index;
  };

  while (i < smiles.length) {
    const char = smiles[i];
    if (char === '[') {
      const end = smiles.indexOf(']', i);
      if (end < 0) throw new Error('Klammer nicht geschlossen');
      const body = smiles.slice(i + 1, end);
      const match = body.match(/^(\d+)?(se|as|te|[bcnops]|[A-Z][a-z]?)(@{1,2}(?:TH\d|AL\d|SP\d|TB\d+|OH\d+)?)?(H\d*)?((?:\+\d*|-\d*)+)?(?::(\d+))?$/);
      if (!match) throw new Error(`Unbekanntes Atom [${body}]`);
      const [, , symbol, , hydrogenText, chargeText, mapText] = match;
      let charge = 0;
      if (chargeText) {
        const sign = chargeText[0] === '+' ? 1 : -1;
        const digits = chargeText.slice(1).replace(/[+-]/g, '');
        charge = digits ? sign * Number(digits) : sign * chargeText.length;
      }
      const hydrogens = hydrogenText ? (hydrogenText.length > 1 ? Number(hydrogenText.slice(1)) : 1) : 0;
      addAtom(
        {
          element: capitalize(symbol),
          aromatic: symbol === symbol.toLowerCase(),
          charge,
          hydrogens,
          map: mapText ? Number(mapText) : 0,
        },
        false,
      );
      i = end + 1;
      continue;
    }
    const organic = ORGANIC.find((entry) => smiles.startsWith(entry, i));
    if (organic) {
      addAtom({ element: capitalize(organic), aromatic: organic === organic.toLowerCase(), charge: 0, hydrogens: 0, map: 0 }, true);
      i += organic.length;
      continue;
    }
    if (char === '(') {
      stack.push(previous);
      i++;
      continue;
    }
    if (char === ')') {
      previous = stack.pop() ?? -1;
      i++;
      continue;
    }
    if (char === '.') {
      previous = -1;
      i++;
      continue;
    }
    if ('-=#:/\\~'.includes(char)) {
      pendingOrder = char === '=' ? 2 : char === '#' ? 3 : char === ':' ? 1.5 : char === '-' || char === '/' || char === '\\' ? 1 : null;
      i++;
      continue;
    }
    if (/\d|%/.test(char)) {
      let number: number;
      if (char === '%') {
        number = Number(smiles.slice(i + 1, i + 3));
        i += 3;
      } else {
        number = Number(char);
        i++;
      }
      const open = rings.get(number);
      if (open) {
        bond(open.atom, previous, pendingOrder ?? open.order);
        rings.delete(number);
      } else {
        rings.set(number, { atom: previous, order: pendingOrder });
      }
      pendingOrder = null;
      continue;
    }
    if (char === '@' || char === '*') throw new Error(`Nicht unterstütztes Zeichen ${char}`);
    throw new Error(`Unerwartetes Zeichen «${char}»`);
  }
  if (rings.size) throw new Error('Ringschluss offen');

  // Implizite Wasserstoffatome für Atome ohne Klammer
  atoms.forEach((atom, index) => {
    if (!implicitH[index]) return;
    const valences = DEFAULT_VALENCE[atom.element] ?? [0];
    const used = atom.neighbors.reduce((sum, [, order]) => sum + order, 0);
    const bondSum = Math.ceil(used - (atom.aromatic ? 0.5 : 0));
    const valence = valences.find((entry) => entry >= bondSum) ?? bondSum;
    atom.hydrogens = Math.max(0, valence - bondSum - (atom.aromatic && atom.element === 'C' ? 0 : 0));
    if (atom.aromatic) {
      // aromatischer Kohlenstoff mit zwei Ringnachbarn trägt ein H, mit drei keins
      const heavy = atom.neighbors.length;
      if (atom.element === 'C') atom.hydrogens = Math.max(0, 3 - heavy);
      else atom.hydrogens = 0;
    }
  });

  // Moleküle nummerieren
  let moleculeCount = 0;
  for (const atom of atoms) {
    if (atom.molecule >= 0) continue;
    const queue = [atom.index];
    atom.molecule = moleculeCount;
    while (queue.length) {
      const current = atoms[queue.pop() as number];
      for (const [neighbor] of current.neighbors) {
        if (atoms[neighbor].molecule < 0) {
          atoms[neighbor].molecule = moleculeCount;
          queue.push(neighbor);
        }
      }
    }
    moleculeCount++;
  }
  return { atoms, moleculeCount };
}

/** Bindungsordnung zwischen zwei Atomen, 0 = keine Bindung. */
export function bondOrder(graph: MolGraph, a: number, b: number): BondOrder | 0 {
  return graph.atoms[a].neighbors.find(([neighbor]) => neighbor === b)?.[1] ?? 0;
}
