/**
 * Strukturen (SMILES) auch für Stoffe, die in der Datenbank nur eine
 * Summenformel haben.
 *
 * Für die belegten Reaktionen aus der Patentliteratur muss die Werkbank
 * erkennen, dass «Natronlauge» dasselbe ist wie [Na+].[OH-] und «Salzsäure»
 * dasselbe wie Cl. Salze werden über das Ionenmodell zusammengesetzt,
 * molekulare Stoffe und Elemente stehen in einer kleinen Tabelle.
 */
import type { Substance } from '../data/types';
import { ANIONS, CATIONS, saltFormula, splitSalt, type Ion } from './ions';

const CATION_SMILES: Record<string, string> = {
  'Li+1': '[Li+]', 'Na+1': '[Na+]', 'K+1': '[K+]', 'NH4+1': '[NH4+]', 'Ag+1': '[Ag+]', 'Cu+1': '[Cu+]',
  'Mg+2': '[Mg+2]', 'Ca+2': '[Ca+2]', 'Ba+2': '[Ba+2]', 'Sr+2': '[Sr+2]', 'Zn+2': '[Zn+2]', 'Fe+2': '[Fe+2]',
  'Cu+2': '[Cu+2]', 'Ni+2': '[Ni+2]', 'Co+2': '[Co+2]', 'Mn+2': '[Mn+2]', 'Pb+2': '[Pb+2]', 'Sn+2': '[Sn+2]',
  'Hg+2': '[Hg+2]', 'Cd+2': '[Cd+2]', 'Fe+3': '[Fe+3]', 'Al+3': '[Al+3]', 'Cr+3': '[Cr+3]',
};

const ANION_SMILES: Record<string, string> = {
  F: '[F-]', Cl: '[Cl-]', Br: '[Br-]', I: '[I-]', OH: '[OH-]',
  NO3: 'O=[N+]([O-])[O-]', NO2: 'O=N[O-]', HCO3: 'O=C([O-])O', HSO4: 'O=S(=O)([O-])O',
  H2PO4: 'O=P([O-])(O)O', ClO: '[O-]Cl', ClO3: 'O=Cl(=O)[O-]', ClO4: 'O=Cl(=O)(=O)[O-]',
  MnO4: 'O=[Mn](=O)(=O)[O-]', SCN: '[S-]C#N', CN: '[C-]#N', CH3COO: 'CC(=O)[O-]', IO3: 'O=I(=O)[O-]',
  O: '[O-2]', S: '[S-2]', SO4: 'O=S(=O)([O-])[O-]', SO3: 'O=S([O-])[O-]', S2O3: 'O=S(=O)([O-])[S-]',
  CO3: 'O=C([O-])[O-]', HPO4: 'O=P([O-])([O-])O', CrO4: 'O=[Cr](=O)([O-])[O-]',
  Cr2O7: 'O=[Cr](=O)([O-])O[Cr](=O)(=O)[O-]', C2O4: 'O=C([O-])C(=O)[O-]', SiO3: 'O=[Si]([O-])[O-]',
  O2: '[O-][O-]', H: '[H-]', NH2: '[NH2-]', C2: '[C-]#[C-]', PO4: 'O=P([O-])([O-])[O-]', N: '[N-3]',
};

/** Stoffe, die kein Salz sind oder anders geschrieben werden als im Ionenmodell. */
const MOLECULAR: Record<string, string> = {
  HCl: 'Cl', HBr: 'Br', HI: 'I', HF: 'F', H2SO4: 'O=S(=O)(O)O', HNO3: 'O=[N+]([O-])O', H3PO4: 'O=P(O)(O)O',
  NaBH4: '[Na+].[BH4-]', LiAlH4: '[Li+].[AlH4-]',
  MnO2: 'O=[Mn]=O', SiO2: 'O=[Si]=O', TiO2: 'O=[Ti]=O', P4O10: 'O=P12OP3(=O)OP(=O)(O1)OP(=O)(O2)O3',
  Li: '[Li]', Na: '[Na]', K: '[K]', Mg: '[Mg]', Ca: '[Ca]', Al: '[Al]', Zn: '[Zn]', Fe: '[Fe]', Ni: '[Ni]',
  Sn: '[Sn]', Pb: '[Pb]', Cu: '[Cu]', Ag: '[Ag]', Au: '[Au]', Pt: '[Pt]', Pd: '[Pd]', Hg: '[Hg]',
  C: '[C]', S: '[S]', P: '[P]', Si: '[Si]', He: '[He]', Ar: '[Ar]',
};

/** Weitere Schreibweisen, wie sie in Patenten vorkommen. */
const ALTERNATIVES: Record<string, string[]> = {
  methylmagnesiumbromid: ['[CH3][Mg+].[Br-]'],
  ethylmagnesiumbromid: ['C[CH2][Mg+].[Br-]'],
  phenylmagnesiumbromid: ['[c-]1ccccc1.[Mg+2].[Br-]', 'c1cc[c]([Mg+])cc1.[Br-]'],
  'n-butyllithium': ['[Li][CH2]CCC', '[Li+].[CH2-]CCC'],
  natriumhydrid: ['[NaH]'],
  kaliumhydroxid: ['[K+].[OH-]'],
  natriumhydroxid: ['[Na+].[OH-]'],
};

function saltSmiles(formula: string): string | undefined {
  const salt = splitSalt(formula);
  if (!salt) return undefined;
  const cation = CATION_SMILES[`${salt.cation.formula}+${salt.cation.charge}`];
  const anion = ANION_SMILES[salt.anion.formula];
  if (!cation || !anion) return undefined;
  return [
    ...Array<string>(salt.cationCount).fill(cation),
    ...Array<string>(salt.anionCount).fill(anion),
  ].join('.');
}

/** Struktur eines Stoffes – aus der Datenbank oder aus Formel und Ionenmodell. */
export function structureOf(substance: Substance): string | undefined {
  if (substance.smiles) return substance.smiles;
  const formula = substance.formula.replace(/·.*$/, '');
  return MOLECULAR[formula] ?? saltSmiles(formula);
}

/** Alle Schreibweisen eines Stoffes, die in Reaktionsdaten auftauchen können. */
export function structuresOf(substance: Substance): string[] {
  const main = structureOf(substance);
  return [...(main ? [main] : []), ...(ALTERNATIVES[substance.id] ?? [])];
}

/** Ionen mit ihrer Struktur, für die Anzeige von Hilfsstoffen aus Reaktionsdaten. */
export function ionStructures(): Array<{ ion: Ion; smiles: string }> {
  const list: Array<{ ion: Ion; smiles: string }> = [];
  for (const ion of CATIONS) {
    const smiles = CATION_SMILES[`${ion.formula}+${ion.charge}`];
    if (smiles) list.push({ ion, smiles });
  }
  for (const ion of ANIONS) {
    const smiles = ANION_SMILES[ion.formula];
    if (smiles) list.push({ ion, smiles });
  }
  return list;
}

export { saltFormula };
