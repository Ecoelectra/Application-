"""
Schritt 0 der Reaktions-KI (erweitert): Reaktionen aus mehreren Quellen
einlesen, vereinheitlichen und Dubletten entfernen.

Quellen (unter .cache/quellen, siehe download.sh):
  uspto-mit     USPTO-MIT (Jin et al. 2017), atomzugeordnet, Aufteilung train/valid/test
  uspto-full    US-Patenterteilungen 1976-2016 (Lowe 2017, CC0), ungeordnet
  uspto-stereo  USPTO-STEREO (Schwaller et al. 2019), ungeordnet
  enzymemap     EnzymeMap v2 (Heid et al. 2023, BRENDA), atomzugeordnet
  ecreact-*     ECREACT (Probst et al. 2022): BRENDA, Rhea, PathBank, MetaNetX
  hte-suzuki    Suzuki-Kupplungen, Hochdurchsatz (Perera et al., Science 2018)
  hte-buchwald  Buchwald-Hartwig-Kupplungen, Hochdurchsatz (Ahneman et al., Science 2018)

Ergebnis: .cache/quellen/alle.tsv mit Quelle, Kennung, Reaktions-SMILES,
bereits zugeordnet (0/1), Bindungsänderungen, Hilfsstoffe, EC-Nummer.
Dubletten: gleiche Stoffe auf der Eduktseite (Edukte und Hilfsstoffe) und
gleiches Hauptprodukt (ohne Stereochemie) werden nur einmal übernommen – zuerst
aus einer bereits zugeordneten Quelle. Die endgültige Dublettenprüfung folgt
nach der Vorlagenextraktion (beitragende Edukte + Produkt).
"""
import csv
import gzip
import os
import sys
from multiprocessing import Pool

from rdkit import Chem, RDLogger

RDLogger.DisableLog('rdApp.*')
csv.field_size_limit(10**9)

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../..'))
Q = os.path.join(ROOT, '.cache/quellen')
MIT = os.path.join(ROOT, '.cache/uspto/data')


def canon(smiles):
    mol = Chem.MolFromSmiles(smiles)
    if mol is None:
        return None
    for atom in mol.GetAtoms():
        atom.SetAtomMapNum(0)
    return Chem.MolToSmiles(mol, isomericSmiles=False)


def key_of(reactants, product):
    """Vergleichsschlüssel: sortierte Edukt-Moleküle und Hauptprodukt, ohne Stereo und Zuordnung."""
    left = []
    for part in reactants.split('.'):
        c = canon(part)
        if c is None:
            return None
        left.append(c)
    p = canon(product)
    if p is None:
        return None
    return '.'.join(sorted(set(left))) + '>>' + p


def main_product(products):
    parts = [p for p in products.split('.') if p]
    if not parts:
        return None
    return max(parts, key=len)


def mit_rows():
    for split, name in (('train', 'train.txt'), ('valid', 'valid.txt'), ('test', 'test.txt')):
        with open(os.path.join(MIT, name)) as handle:
            for i, line in enumerate(handle):
                line = line.strip()
                if not line:
                    continue
                reaction, edits = line.split()
                left, right = reaction.split('>>')
                yield ('uspto-mit', f'{split}:{i + 1}', left, '', right, 1, edits, split, '')


def full_rows():
    with open(os.path.join(Q, 'uspto_full.csv')) as handle:
        reader = csv.DictReader(handle)
        for i, row in enumerate(reader):
            parts = row['reactions'].split('>')
            if len(parts) != 3:
                continue
            yield ('uspto-full', f"{row['PatentNumber']}:{row['Year']}:{i}", parts[0], parts[1], parts[2], 0, '', '', '')


def stereo_rows():
    with open(os.path.join(Q, 'uspto_stereo.csv')) as handle:
        reader = csv.DictReader(handle)
        for i, row in enumerate(reader):
            parts = row['reactions'].split('>')
            if len(parts) != 3:
                continue
            yield ('uspto-stereo', str(i), parts[0], parts[1], parts[2], 0, '', '', '')


def enzymemap_rows():
    with gzip.open(os.path.join(Q, 'enzymemap.csv.gz'), 'rt') as handle:
        reader = csv.DictReader(handle)
        for row in reader:
            # nur direkt aus BRENDA übernommene Reaktionen (auch die Rückreaktion reversibler Einträge)
            if row['source'] not in ('direct', 'direct reversed'):
                continue
            left, right = row['mapped'].split('>>')
            yield ('enzymemap', row['rxn_idx'], left, '', right, 1, '', '', row['ec_num'])


def ecreact_rows():
    path = os.path.join(Q, 'biocatalysis-model/data/ecreact-1.0.csv')
    with open(path) as handle:
        reader = csv.DictReader(handle)
        for i, row in enumerate(reader):
            left, right = row['rxn_smiles'].split('>>')
            left = left.split('|')[0]
            source = 'ecreact-' + row['source'].replace('_reaction_smiles', '')
            yield (source, str(i), left, '', right, 0, '', '', row['ec'])


def suzuki_rows():
    path = os.path.join(Q, 'rxn_yields/data/Suzuki-Miyaura/random_splits/random_split_0.tsv')
    with open(path) as handle:
        reader = csv.DictReader(handle, delimiter='\t')
        for i, row in enumerate(reader):
            left, right = row['rxn'].split('>>')
            left = left.replace('~', '.')
            yield ('hte-suzuki', str(i), left, '', right, 0, '', '', '')


def buchwald_rows():
    """Ahneman et al. 2018: Arylhalogenid + p-Toluidin, Pd-Präkatalysator, Ligand, Base, Additiv."""
    try:
        import openpyxl  # noqa: F401
        import pandas as pd
    except ImportError:
        return
    path = os.path.join(Q, 'rxn_yields/data/Buchwald-Hartwig/Dreher_and_Doyle_input_data.xlsx')
    frame = pd.read_excel(path, sheet_name='FullCV_01')
    methylaniline = 'Cc1ccc(N)cc1'
    pd_catalyst = 'O=S(=O)(O[Pd]1c2ccccc2-c2ccccc2N~1)C(F)(F)F'
    for i, row in frame.iterrows():
        halide = row['Aryl halide']
        mol = Chem.MolFromSmiles(halide)
        if mol is None:
            continue
        # Produkt: Halogen durch NH-Tolyl ersetzen
        rxn = Chem.AllChem.ReactionFromSmarts('[c:1][Cl,Br,I]>>[c:1]Nc1ccc(C)cc1')
        products = rxn.RunReactants((mol,))
        if not products:
            continue
        product = products[0][0]
        try:
            Chem.SanitizeMol(product)
        except Exception:
            continue
        agents = '.'.join(str(x) for x in (row['Ligand'], row['Additive'], row['Base'], pd_catalyst) if isinstance(x, str))
        yield ('hte-buchwald', str(i), f'{halide}.{methylaniline}', agents, Chem.MolToSmiles(product), 0, '', '', '')


def keyed(row):
    source, ident, left, agents, right, mapped, edits, split, ec = row
    product = main_product(right)
    if product is None:
        return None
    # Edukte und Hilfsstoffe zusammen: USPTO-MIT führt Hilfsstoffe links, Lowe teils in der Mitte
    key = key_of(f'{left}.{agents}' if agents else left, product)
    if key is None:
        return None
    return key, row


def main():
    from rdkit.Chem import AllChem  # noqa: F401  (für buchwald_rows)

    generators = [mit_rows, enzymemap_rows, full_rows, stereo_rows, ecreact_rows, suzuki_rows, buchwald_rows]
    seen = {}
    counts = {}
    kept = {}
    out_path = os.path.join(Q, 'alle.tsv')
    with open(out_path, 'w') as out, Pool(4) as pool:
        for generator in generators:
            for result in pool.imap(keyed, generator(), chunksize=2000):
                if result is None:
                    continue
                key, row = result
                source = row[0]
                counts[source] = counts.get(source, 0) + 1
                if key in seen:
                    continue
                seen[key] = source
                kept[source] = kept.get(source, 0) + 1
                out.write('\t'.join(str(x) for x in row) + '\n')
            print(generator.__name__, counts, kept, flush=True)
    print('gelesen', counts)
    print('neu (ohne Dubletten)', kept, 'gesamt', sum(kept.values()))


if __name__ == '__main__':
    sys.exit(main())
