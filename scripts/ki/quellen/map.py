"""
Schritt 0b: Atomzuordnung und Bindungsänderungen.

Reaktionen ohne Atomzuordnung werden mit RXNMapper (Schwaller et al., Science
Advances 2021) zugeordnet. Für alle Reaktionen werden danach die geänderten
Bindungen bestimmt – im selben Format wie USPTO-MIT («a-b;c-d»), damit die
Vorlagenextraktion (scripts/ki/extract.ts) sie gleich behandeln kann.

Aufruf: python map.py <Teil> <Teile>
Liest .cache/quellen/alle.tsv, schreibt .cache/quellen/zugeordnet-<Teil>.tsv.
Bereits geschriebene Zeilen werden beim erneuten Start übersprungen.
"""
import os
import sys
import time

from rdkit import Chem, RDLogger

RDLogger.DisableLog('rdApp.*')

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../..'))
Q = os.path.join(ROOT, '.cache/quellen')
BATCH = int(os.environ.get('MAP_BATCH', '16'))
MIN_CONFIDENCE = float(os.environ.get('MAP_MIN_CONFIDENCE', '0.2'))
MAX_LENGTH = 400  # Zeichen; längere Reaktionen überschreiten die 512 Token des Modells


# Cofaktoren (NAD(P)H, ATP/ADP/AMP, CoA, FAD, SAM …) enthalten alle Adenin
ADENINE = Chem.MolFromSmarts('n1cnc2c(N)ncnc12')
FLAVIN = Chem.MolFromSmarts('c1cc2nc3c(=O)[nH]c(=O)nc-3n(C)c2cc1')


def is_cofactor(smiles):
    mol = Chem.MolFromSmiles(smiles)
    if mol is None:
        return True
    carbons = sum(1 for atom in mol.GetAtoms() if atom.GetSymbol() == 'C')
    if carbons <= 1:
        return True  # Wasser, CO2, Phosphat, Ammoniak, H+ …
    return mol.HasSubstructMatch(ADENINE) or mol.HasSubstructMatch(FLAVIN)


def main_product(products, enzymatic):
    """Hauptprodukt: das größte Molekül – bei Enzymreaktionen ohne Cofaktoren und Kleinmoleküle."""
    parts = [p for p in products.split('.') if p]
    if enzymatic:
        parts = [p for p in parts if not is_cofactor(p)]
    if not parts:
        return None
    return max(parts, key=len)


def bond_changes(mapped):
    """Geänderte Bindungen zwischen zugeordneten Atomen, als «a-b;…» (0 = nicht zugeordnetes Atom)."""
    left, right = mapped.split('>>')
    product_text = max(right.split('.'), key=len)
    reactants = Chem.MolFromSmiles(left, sanitize=False)
    product = Chem.MolFromSmiles(product_text, sanitize=False)
    if reactants is None or product is None:
        return None
    in_product = {atom.GetAtomMapNum() for atom in product.GetAtoms() if atom.GetAtomMapNum()}
    if not in_product:
        return None
    r_index = {atom.GetAtomMapNum(): atom.GetIdx() for atom in reactants.GetAtoms() if atom.GetAtomMapNum()}
    if any(m not in r_index for m in in_product):
        return None
    p_index = {atom.GetAtomMapNum(): atom.GetIdx() for atom in product.GetAtoms() if atom.GetAtomMapNum()}

    def order(mol, a, b):
        bond = mol.GetBondBetweenAtoms(a, b)
        return bond.GetBondTypeAsDouble() if bond is not None else 0.0

    edits = set()
    for bond in product.GetBonds():
        a, b = bond.GetBeginAtom().GetAtomMapNum(), bond.GetEndAtom().GetAtomMapNum()
        if not a or not b:
            continue
        before = order(reactants, r_index[a], r_index[b])
        if before != bond.GetBondTypeAsDouble():
            edits.add((min(a, b), max(a, b)))
    for bond in reactants.GetBonds():
        a, b = bond.GetBeginAtom().GetAtomMapNum(), bond.GetEndAtom().GetAtomMapNum()
        if a not in in_product and b not in in_product:
            continue
        if a in in_product and b in in_product:
            continue  # schon oben verglichen
        # Bindung zu einer Abgangsgruppe wird gelöst
        edits.add((min(a, b), max(a, b)))
    if not edits:
        return None
    return ';'.join(f'{a}-{b}' for a, b in sorted(edits))


def main():
    part = int(sys.argv[1]) if len(sys.argv) > 1 else 0
    parts = int(sys.argv[2]) if len(sys.argv) > 2 else 1
    out_path = os.path.join(Q, f'zugeordnet-{part}.tsv')
    done = set()
    if os.path.exists(out_path):
        with open(out_path) as handle:
            for line in handle:
                fields = line.rstrip('\n').split('\t')
                done.add((fields[0], fields[1]))

    rows = []
    with open(os.path.join(Q, 'alle.tsv')) as handle:
        for i, line in enumerate(handle):
            if i % parts != part:
                continue
            fields = line.rstrip('\n').split('\t')
            if (fields[0], fields[1]) in done:
                continue
            rows.append(fields)

    mapper = None
    started = time.time()
    written = failed = 0
    with open(out_path, 'a') as out:

        def emit(fields, mapped, edits, confidence):
            nonlocal written
            source, ident, _, agents, _, _, _, split, ec = fields
            out.write('\t'.join([source, ident, mapped, edits, agents, split, ec, f'{confidence:.3f}']) + '\n')
            written += 1

        pending = []

        def flush():
            nonlocal mapper, failed
            if not pending:
                return
            if mapper is None:
                import torch
                from rxnmapper import RXNMapper

                torch.set_num_threads(int(os.environ.get('MAP_THREADS', '1')))
                mapper = RXNMapper()
            texts = [text for _, text in pending]
            try:
                results = mapper.get_attention_guided_atom_maps(texts, canonicalize_rxns=True)
            except Exception:
                results = []
                for text in texts:
                    try:
                        results.append(mapper.get_attention_guided_atom_maps([text], canonicalize_rxns=True)[0])
                    except Exception:
                        results.append(None)
            for (fields, _), result in zip(pending, results):
                if not result or result.get('confidence', 0) < MIN_CONFIDENCE:
                    failed += 1
                    continue
                edits = bond_changes(result['mapped_rxn'])
                if edits is None:
                    failed += 1
                    continue
                emit(fields, result['mapped_rxn'], edits, result['confidence'])
            pending.clear()

        for n, fields in enumerate(rows):
            source, ident, left, agents, right, mapped, edits, split, ec = fields
            enzymatic = source == 'enzymemap' or source.startswith('ecreact')
            if mapped == '1':
                if enzymatic:
                    right = main_product(right, True)
                    if right is None:
                        failed += 1
                        continue
                if not edits:
                    edits = bond_changes(f'{left}>>{right}')
                if edits:
                    emit(fields, f'{left}>>{right}', edits, 1.0)
                else:
                    failed += 1
                continue
            product = main_product(right, enzymatic)
            if product is None:
                failed += 1
                continue
            text = f'{left}.{agents}>>{product}' if agents else f'{left}>>{product}'
            if len(text) > MAX_LENGTH:
                failed += 1
                continue
            pending.append((fields, text))
            if len(pending) >= BATCH:
                flush()
            if n % 5000 == 0:
                out.flush()
                rate = written / max(1, time.time() - started)
                print(f'Teil {part}: {n}/{len(rows)}, {written} geschrieben, {failed} verworfen, {rate:.1f}/s', flush=True)
        flush()
    print(f'Teil {part} fertig: {written} geschrieben, {failed} verworfen, {time.time() - started:.0f} s', flush=True)


if __name__ == '__main__':
    main()
