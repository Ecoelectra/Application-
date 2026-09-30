"""
Quelle «Technische Katalyse»: kuratierte Gas- und Industriereaktionen, die in
Patenten der organischen Synthese kaum vorkommen (CO2-Hydrierung, Reformierung,
Oxo-Synthese, Dehydrierung, Gasphasen-Oxidation, CO2-Fixierung).

Liest scripts/ki/quellen/technik.tsv und schreibt .cache/quellen/alle-technik.tsv
im Format von prepare.py. Als Produkt zählt nur das erste (Hauptprodukt).
Danach:  MAP_EINGABE=alle-technik.tsv MAP_AUSGABE=zugeordnet-technik.tsv python map.py 0 1
"""
import os

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../..'))
SOURCE = os.path.join(os.path.dirname(__file__), 'technik.tsv')
OUT = os.path.join(ROOT, '.cache/quellen/alle-technik.tsv')

rows = []
with open(SOURCE) as handle:
    header = handle.readline()
    for line in handle:
        if not line.strip():
            continue
        ident, family, reactants, agents, products, name, source = line.rstrip('\n').split('\t')
        main = products.split('.')[0]
        # Spalten wie prepare.py: Quelle, Kennung, Edukte, Hilfsstoffe, Produkte, zugeordnet, Änderungen, Aufteilung, EC
        rows.append('\t'.join(['technik', ident, reactants, agents, main, '0', '', 'train', '']))

with open(OUT, 'w') as out:
    out.write('\n'.join(rows) + '\n')
print(f'{len(rows)} Reaktionen nach {OUT}')
