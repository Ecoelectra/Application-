#!/usr/bin/env bash
# Lädt die Reaktionsquellen für die Reaktions-KI nach .cache/quellen und
# richtet die Python-Umgebung mit RDKit und RXNMapper ein.
#
# Danach:
#   .cache/mapper-env/bin/python scripts/ki/quellen/prepare.py
#   for i in 0 1 2 3; do .cache/mapper-env/bin/python scripts/ki/quellen/map.py $i 4 & done; wait
#   npm run ki
set -euo pipefail
cd "$(dirname "$0")/../../.."
mkdir -p .cache/quellen
cd .cache/quellen

# US-Patenterteilungen 1976–2016 (D. M. Lowe, CC0), Spiegel von DeepChem
[ -f uspto_full.csv ] || curl -fL -o uspto_full.csv https://deepchemdata.s3-us-west-1.amazonaws.com/datasets/USPTO_FULL.csv
# USPTO-STEREO (Schwaller et al., ACS Cent. Sci. 2019)
[ -f uspto_stereo.csv ] || curl -fL -o uspto_stereo.csv https://deepchemdata.s3-us-west-1.amazonaws.com/datasets/USPTO_STEREO.csv
# EnzymeMap v2 (Heid et al., Chem. Sci. 2023; Reaktionen aus BRENDA, atomzugeordnet)
[ -f enzymemap.csv.gz ] || curl -fL -o enzymemap.csv.gz https://raw.githubusercontent.com/hesther/enzymemap/main/data/processed_reactions.csv.gz
# ECREACT (Probst et al., Nat. Commun. 2022): BRENDA, Rhea, PathBank, MetaNetX
[ -d biocatalysis-model ] || git clone -q --depth 1 https://github.com/rxn4chemistry/biocatalysis-model
# Hochdurchsatz-Experimente: Suzuki (Perera et al., Science 2018), Buchwald-Hartwig (Ahneman et al., Science 2018)
if [ ! -d rxn_yields ]; then
  git clone -q --depth 1 --filter=blob:none --sparse https://github.com/rxn4chemistry/rxn_yields
  (cd rxn_yields && git sparse-checkout set data)
fi

cd ..
if [ ! -d mapper-env ]; then
  python3 -m venv mapper-env
  mapper-env/bin/pip install -q rxnmapper rdkit openpyxl
fi
echo "Quellen bereit unter .cache/quellen"
