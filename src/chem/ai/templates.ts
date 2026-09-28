/**
 * Reaktionsvorlagen aus atomzugeordneten Reaktionen herausschneiden.
 *
 * Vorgehen wie bei rdchiral (Coley et al., 2019): Das Reaktionszentrum sind
 * die Atome, deren Bindungen sich ändern. Dazu kommen ihre direkten Nachbarn.
 * Zentrumsatome werden genau beschrieben (Element, Aromatizität,
 * Wasserstoffzahl, Zahl der Nachbarn, Ladung), Nachbarn nur mit Element und
 * Aromatizität. Atome, die nicht im Produkt landen (Abgangsgruppen), tragen
 * keine Zuordnungsnummer – RDKit entfernt sie beim Anwenden.
 *
 * Die Vorlage wird kanonisch geschrieben, damit gleiche Reaktionstypen aus
 * verschiedenen Patenten dieselbe Zeichenkette ergeben und gezählt werden
 * können.
 */
import { parseMappedSmiles, type BondOrder, type GraphAtom, type MolGraph } from './mappedSmiles';

export interface ExtractedTemplate {
  /** Vorlage als Reaktions-SMARTS, vorwärts: Edukte>>Produkt */
  smarts: string;
  /** Edukte ohne Zuordnungsnummern, in der Reihenfolge der Vorlage */
  reactants: string[];
  /** Hilfsstoffe (tragen keine Atome zum Produkt bei) */
  agents: string[];
  /** Hauptprodukt ohne Zuordnungsnummern */
  product: string;
  /** Gebildete und gelöste Bindungen, für die Einteilung in Reaktionsfamilien */
  changes: BondChange[];
}

export interface BondChange {
  /** Atombeschreibung wie «c», «C», «N», «Br» */
  a: string;
  b: string;
  /** Ordnung vorher und nachher (0 = keine Bindung) */
  before: number;
  after: number;
  /** Atom b verlässt das Produkt (Abgangsgruppe) */
  leaving: boolean;
}

export type ExtractionResult = { ok: true; template: ExtractedTemplate } | { ok: false; reason: string };

const AROMATIC_SYMBOLS = new Set(['B', 'C', 'N', 'O', 'P', 'S', 'Se', 'As', 'Te']);
const MAX_TEMPLATE_ATOMS = 40;

function unmap(smiles: string): string {
  return smiles.replace(/:\d+\]/g, ']');
}

function symbolOf(atom: GraphAtom): string | null {
  if (!atom.aromatic) return atom.element;
  if (!AROMATIC_SYMBOLS.has(atom.element)) return null;
  return atom.element.toLowerCase();
}

function chargeText(charge: number): string {
  if (charge === 0) return '+0';
  const sign = charge > 0 ? '+' : '-';
  return Math.abs(charge) === 1 ? sign : `${sign}${Math.abs(charge)}`;
}

function bondSymbol(order: BondOrder): string {
  return order === 1.5 ? ':' : order === 2 ? '=' : order === 3 ? '#' : '-';
}

/**
 * Kurzbeschreibung eines Atoms im Edukt für die Familieneinteilung:
 * «C=O» Carbonyl-C, «C#» Dreifachbindung, «C=C» Doppelbindung an C, «C» sonst;
 * «N+O» Nitro-N, «OS» Sauerstoff an Schwefel (Sulfonat), «OC=O» Ester- oder
 * Säure-Sauerstoff; aromatische Atome klein geschrieben.
 */
export function describeAtom(graph: MolGraph, atom: GraphAtom): string {
  if (atom.aromatic) return atom.element.toLowerCase();
  const neighbors = atom.neighbors.map(([index, order]) => ({ atom: graph.atoms[index], order }));
  if (atom.element === 'C') {
    if (neighbors.some(({ atom: other, order }) => order === 2 && (other.element === 'O' || other.element === 'S'))) return 'C=O';
    if (neighbors.some(({ order }) => order === 3)) return 'C#';
    if (neighbors.some(({ order }) => order === 2)) return 'C=C';
    return 'C';
  }
  if (atom.element === 'N' && atom.charge > 0 && neighbors.some(({ atom: other }) => other.element === 'O')) return 'N+O';
  if (atom.element === 'O') {
    if (neighbors.some(({ atom: other }) => other.element === 'S')) return 'OS';
    const acyl = neighbors.some(
      ({ atom: other }) =>
        other.element === 'C' && other.neighbors.some(([index, order]) => order === 2 && index !== atom.index && graph.atoms[index].element === 'O'),
    );
    if (acyl) return 'OC=O';
  }
  return atom.element;
}

/** Kürzeste Wege innerhalb eines Moleküls, um getrennte Teile der Vorlage zu verbinden. */
function connect(graph: MolGraph, selected: Set<number>, within: (index: number) => boolean): boolean {
  for (let guard = 0; guard < 20; guard++) {
    const members = [...selected].filter(within);
    if (members.length <= 1) return true;
    // Zusammenhangskomponenten der Auswahl
    const component = new Map<number, number>();
    let count = 0;
    for (const start of members) {
      if (component.has(start)) continue;
      const queue = [start];
      component.set(start, count);
      while (queue.length) {
        const current = queue.pop() as number;
        for (const [neighbor] of graph.atoms[current].neighbors) {
          if (selected.has(neighbor) && within(neighbor) && !component.has(neighbor)) {
            component.set(neighbor, count);
            queue.push(neighbor);
          }
        }
      }
      count++;
    }
    if (count === 1) return true;
    // Breitensuche von Komponente 0 zur nächsten anderen Komponente
    const previous = new Map<number, number>();
    const queue = members.filter((index) => component.get(index) === 0);
    queue.forEach((index) => previous.set(index, -1));
    let target = -1;
    while (queue.length && target < 0) {
      const current = queue.shift() as number;
      for (const [neighbor] of graph.atoms[current].neighbors) {
        if (!within(neighbor) || previous.has(neighbor)) continue;
        previous.set(neighbor, current);
        if (selected.has(neighbor) && component.get(neighbor) !== 0) {
          target = neighbor;
          break;
        }
        queue.push(neighbor);
      }
    }
    if (target < 0) return false;
    for (let step = previous.get(target) as number; step >= 0 && !selected.has(step); step = previous.get(step) as number) {
      selected.add(step);
    }
    if (selected.size > MAX_TEMPLATE_ATOMS) return false;
  }
  return false;
}

/**
 * Schreibt ein zusammenhängendes Teilgerüst als SMARTS.
 * `rank` legt die Reihenfolge fest; `label` liefert die Atombeschreibung.
 */
function writeFragment(
  graph: MolGraph,
  members: number[],
  rank: Map<number, number>,
  label: (index: number) => string,
): { text: string; order: number[] } {
  const inFragment = new Set(members);
  const start = [...members].sort((a, b) => (rank.get(a) as number) - (rank.get(b) as number))[0];
  const visited = new Set<number>();
  const order: number[] = [];
  const children = new Map<number, number[]>();
  const closures: Array<[number, number, BondOrder]> = [];
  const neighborsOf = (index: number): Array<[number, BondOrder]> =>
    graph.atoms[index].neighbors
      .filter(([neighbor]) => inFragment.has(neighbor))
      .sort((x, y) => (rank.get(x[0]) as number) - (rank.get(y[0]) as number));

  const dfs = (index: number, parent: number): void => {
    visited.add(index);
    order.push(index);
    children.set(index, []);
    for (const [neighbor, bondOrderValue] of neighborsOf(index)) {
      if (neighbor === parent) continue;
      if (visited.has(neighbor)) {
        if (!closures.some(([a, b]) => (a === neighbor && b === index) || (a === index && b === neighbor))) {
          closures.push([neighbor, index, bondOrderValue]);
        }
        continue;
      }
      (children.get(index) as number[]).push(neighbor);
      dfs(neighbor, index);
    }
  };
  dfs(start, -1);

  const position = new Map(order.map((index, i) => [index, i]));
  const digits = new Map<string, number>();
  const free: number[] = [];
  let nextDigit = 1;
  const key = (a: number, b: number) => `${Math.min(a, b)}-${Math.max(a, b)}`;

  const write = (index: number, parentOrder: BondOrder | null): string => {
    let text = `${parentOrder !== null ? bondSymbol(parentOrder) : ''}${label(index)}`;
    for (const [a, b, bondOrderValue] of closures) {
      if (a !== index && b !== index) continue;
      const other = a === index ? b : a;
      const k = key(a, b);
      if ((position.get(index) as number) < (position.get(other) as number)) {
        const digit = free.length ? (free.shift() as number) : nextDigit++;
        digits.set(k, digit);
        text += digit < 10 ? `${digit}` : `%${digit}`;
      } else {
        const digit = digits.get(k) as number;
        free.push(digit);
        free.sort((x, y) => x - y);
        text += `${bondSymbol(bondOrderValue)}${digit < 10 ? digit : `%${digit}`}`;
      }
    }
    const kids = children.get(index) as number[];
    kids.forEach((child, i) => {
      const bond = graph.atoms[index].neighbors.find(([neighbor]) => neighbor === child)?.[1] as BondOrder;
      const branch = write(child, bond);
      text += i < kids.length - 1 ? `(${branch})` : branch;
    });
    return text;
  };
  return { text: write(start, null), order };
}

/** Morgan-artige Ränge für eine kanonische Schreibweise. */
function canonicalRanks(graph: MolGraph, members: number[], base: (index: number) => string): Map<number, number> {
  const inFragment = new Set(members);
  let labels = new Map(members.map((index) => [index, base(index)]));
  for (let round = 0; round < 4; round++) {
    const next = new Map<number, string>();
    for (const index of members) {
      const around = graph.atoms[index].neighbors
        .filter(([neighbor]) => inFragment.has(neighbor))
        .map(([neighbor, order]) => `${order}${labels.get(neighbor)}`)
        .sort()
        .join(',');
      next.set(index, `${labels.get(index)}(${around})`);
    }
    // Zeichenketten klein halten: durch ihren Rang ersetzen
    const sorted = [...new Set(next.values())].sort();
    labels = new Map(members.map((index) => [index, String(sorted.indexOf(next.get(index) as string)).padStart(3, '0')]));
  }
  const order = [...members].sort((a, b) => (labels.get(a) as string).localeCompare(labels.get(b) as string) || a - b);
  return new Map(order.map((index, i) => [index, i]));
}

/**
 * Schneidet die Vorlage aus einer Zeile des USPTO-Datensatzes.
 * Format: «Edukte>>Produkt Bindungsänderungen», z. B. «… 12-13;12-15».
 */
export function extractTemplate(line: string): ExtractionResult {
  const [reaction, editText] = line.trim().split(/\s+/);
  const [left, right] = (reaction ?? '').split('>>');
  if (!left || !right || !editText) return { ok: false, reason: 'Format' };

  const productText = right.split('.').sort((a, b) => b.length - a.length)[0];
  let reactantGraph: MolGraph;
  let productGraph: MolGraph;
  try {
    reactantGraph = parseMappedSmiles(left);
    productGraph = parseMappedSmiles(productText);
  } catch {
    return { ok: false, reason: 'SMILES' };
  }
  const leftPieces = left.split('.');
  if (leftPieces.length !== reactantGraph.moleculeCount) return { ok: false, reason: 'Moleküle' };

  const byMapR = new Map<number, number>();
  reactantGraph.atoms.forEach((atom) => atom.map && byMapR.set(atom.map, atom.index));
  const byMapP = new Map<number, number>();
  productGraph.atoms.forEach((atom) => atom.map && byMapP.set(atom.map, atom.index));
  if ([...byMapP.keys()].some((map) => !byMapR.has(map))) return { ok: false, reason: 'Zuordnung' };

  // Reaktionszentrum: Atome aus den Bindungsänderungen, dazu Atome mit geänderter Ladung, H-Zahl oder Aromatizität
  const centerMaps = new Set<number>();
  for (const edit of editText.split(';')) {
    const [a, b] = edit.split('-').map(Number);
    if (byMapR.has(a)) centerMaps.add(a);
    if (byMapR.has(b)) centerMaps.add(b);
  }
  for (const [map, pIndex] of byMapP) {
    const r = reactantGraph.atoms[byMapR.get(map) as number];
    const p = productGraph.atoms[pIndex];
    if (r.charge !== p.charge || r.hydrogens !== p.hydrogens || r.aromatic !== p.aromatic) centerMaps.add(map);
  }
  if (!centerMaps.size) return { ok: false, reason: 'kein Zentrum' };

  // Beitragende Edukte: Moleküle mit Atomen im Produkt
  const contributing = new Set<number>();
  for (const map of byMapP.keys()) contributing.add(reactantGraph.atoms[byMapR.get(map) as number].molecule);

  const selected = new Set<number>();
  for (const map of centerMaps) {
    const index = byMapR.get(map) as number;
    if (!contributing.has(reactantGraph.atoms[index].molecule)) continue;
    selected.add(index);
    for (const [neighbor] of reactantGraph.atoms[index].neighbors) selected.add(neighbor);
  }

  // Vorlage auf beiden Seiten zusammenhängend machen
  for (let round = 0; round < 5; round++) {
    const before = selected.size;
    for (const molecule of contributing) {
      if (!connect(reactantGraph, selected, (index) => reactantGraph.atoms[index].molecule === molecule)) {
        return { ok: false, reason: 'unzusammenhängend' };
      }
    }
    const productSelected = new Set(
      [...selected].map((index) => reactantGraph.atoms[index].map).filter((map) => byMapP.has(map)).map((map) => byMapP.get(map) as number),
    );
    if (!connect(productGraph, productSelected, () => true)) return { ok: false, reason: 'unzusammenhängend' };
    for (const pIndex of productSelected) selected.add(byMapR.get(productGraph.atoms[pIndex].map) as number);
    if (selected.size > MAX_TEMPLATE_ATOMS) return { ok: false, reason: 'zu groß' };
    if (selected.size === before) break;
  }

  const molecules = [...new Set([...selected].map((index) => reactantGraph.atoms[index].molecule))];
  if (molecules.some((molecule) => !contributing.has(molecule))) return { ok: false, reason: 'Hilfsstoff im Zentrum' };
  if ([...contributing].some((molecule) => !molecules.includes(molecule))) return { ok: false, reason: 'Edukt ohne Zentrum' };
  if (molecules.length > 3) return { ok: false, reason: 'zu viele Edukte' };

  const inProduct = (index: number) => byMapP.has(reactantGraph.atoms[index].map);
  const isCenter = (index: number) => centerMaps.has(reactantGraph.atoms[index].map);

  // Atombeschreibungen ohne Nummer
  const reactantLabel = (index: number): string | null => {
    const atom = reactantGraph.atoms[index];
    const symbol = symbolOf(atom);
    if (!symbol) return null;
    if (!isCenter(index)) return symbol;
    return `${symbol};H${atom.hydrogens};D${atom.neighbors.length};${chargeText(atom.charge)}`;
  };
  const productLabel = (pIndex: number): string | null => {
    const atom = productGraph.atoms[pIndex];
    const symbol = symbolOf(atom);
    if (!symbol) return null;
    if (!centerMaps.has(atom.map)) return symbol;
    return `${symbol};H${atom.hydrogens};D${atom.neighbors.length};${chargeText(atom.charge)}`;
  };
  for (const index of selected) {
    if (!reactantLabel(index)) return { ok: false, reason: 'Element' };
    if (inProduct(index) && !productLabel(byMapP.get(reactantGraph.atoms[index].map) as number)) return { ok: false, reason: 'Element' };
  }

  // Kanonische Reihenfolge und neue Zuordnungsnummern
  const fragments = molecules.map((molecule) => {
    const members = [...selected].filter((index) => reactantGraph.atoms[index].molecule === molecule);
    const base = (index: number) => {
      const pLabel = inProduct(index) ? productLabel(byMapP.get(reactantGraph.atoms[index].map) as number) : 'weg';
      return `${reactantLabel(index)}>${pLabel}`;
    };
    const rank = canonicalRanks(reactantGraph, members, base);
    const preview = writeFragment(reactantGraph, members, rank, (index) => `[${reactantLabel(index)}${inProduct(index) ? ':*' : ''}]`);
    return { molecule, members, rank, preview };
  });
  fragments.sort((a, b) => a.preview.text.localeCompare(b.preview.text));

  const newMap = new Map<number, number>();
  for (const fragment of fragments) {
    for (const index of fragment.preview.order) {
      if (inProduct(index)) newMap.set(index, newMap.size + 1);
    }
  }

  const reactantParts = fragments.map(
    (fragment) =>
      writeFragment(reactantGraph, fragment.members, fragment.rank, (index) => {
        const map = newMap.get(index);
        return `[${reactantLabel(index)}${map ? `:${map}` : ''}]`;
      }).text,
  );

  const productMembers = [...selected].filter(inProduct).map((index) => byMapP.get(reactantGraph.atoms[index].map) as number);
  const productRank = new Map(
    productMembers.map((pIndex) => [pIndex, newMap.get(byMapR.get(productGraph.atoms[pIndex].map) as number) as number]),
  );
  const productPart = writeFragment(productGraph, productMembers, productRank, (pIndex) => {
    const map = newMap.get(byMapR.get(productGraph.atoms[pIndex].map) as number);
    return `[${productLabel(pIndex)}:${map}]`;
  }).text;

  // Bindungsänderungen für die Einteilung in Reaktionsfamilien
  const describe = (atom: GraphAtom) => describeAtom(reactantGraph, atom);
  const changes: BondChange[] = [];
  const seen = new Set<string>();
  for (const index of selected) {
    const atom = reactantGraph.atoms[index];
    if (!isCenter(index)) continue;
    for (const [neighbor, order] of atom.neighbors) {
      const k = `${Math.min(index, neighbor)}-${Math.max(index, neighbor)}`;
      if (seen.has(k)) continue;
      seen.add(k);
      const other = reactantGraph.atoms[neighbor];
      const pa = byMapP.get(atom.map);
      const pb = byMapP.get(other.map);
      const after = pa !== undefined && pb !== undefined ? (productGraph.atoms[pa].neighbors.find(([n]) => n === pb)?.[1] ?? 0) : 0;
      if (after !== order) {
        changes.push({ a: describe(atom), b: describe(other), before: order, after, leaving: pb === undefined });
      }
    }
  }
  for (const pIndex of productMembers) {
    const atom = productGraph.atoms[pIndex];
    if (!centerMaps.has(atom.map)) continue;
    for (const [neighbor, order] of atom.neighbors) {
      const other = productGraph.atoms[neighbor];
      const ra = byMapR.get(atom.map) as number;
      const rb = byMapR.get(other.map) as number;
      const k = `${Math.min(ra, rb)}-${Math.max(ra, rb)}`;
      if (seen.has(k)) continue;
      seen.add(k);
      const before = reactantGraph.atoms[ra].neighbors.find(([n]) => n === rb)?.[1] ?? 0;
      if (before !== order) changes.push({ a: describe(reactantGraph.atoms[ra]), b: describe(reactantGraph.atoms[rb]), before, after: order, leaving: false });
    }
  }

  const agents = leftPieces.filter((_, molecule) => !contributing.has(molecule)).map(unmap);
  return {
    ok: true,
    template: {
      smarts: `${reactantParts.join('.')}>>${productPart}`,
      reactants: fragments.map((fragment) => unmap(leftPieces[fragment.molecule])),
      agents,
      product: unmap(productText),
      changes,
    },
  };
}
