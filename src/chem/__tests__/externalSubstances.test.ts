/** Stoffe aus PubChem und als SMILES eingegebene Strukturen. */
import { beforeAll, describe, expect, it } from 'vitest';
import type { MainModule } from '@rdkit/rdkit';
import initRDKitModule from '@rdkit/rdkit';
import {
  inorganicFormula,
  looksLikeSmiles,
  normalizeFormula,
  substanceFromCompound,
  substanceFromSmiles,
} from '../externalSubstances';
import { mix, DEFAULT_CONDITIONS } from '../workbench';
import { substanceById } from '../../data/substances';
import type { PubChemCompound } from '../../services/pubchem';

let rdkit: MainModule;

beforeAll(async () => {
  rdkit = await initRDKitModule();
}, 60_000);

function compound(cid: number, smiles: string, title: string): PubChemCompound {
  return { cid, smiles, title };
}

describe('Schreibweise der App', () => {
  it('ordnet anorganische Formeln nach IUPAC', () => {
    expect(inorganicFormula({ Cl: 5, P: 1 })).toBe('PCl5');
    expect(inorganicFormula({ F: 6, S: 1 })).toBe('SF6');
  });

  it('bringt Salze über das Ionenmodell in die übliche Form', () => {
    expect(normalizeFormula({ Cu: 1, O: 4, S: 1 })).toMatchObject({ formula: 'CuSO4', category: 'Salz', ionic: true });
    expect(normalizeFormula({ Cl: 1, H: 1, O: 4 })).toMatchObject({ formula: 'HClO4', category: 'Säure' });
    expect(normalizeFormula({ Na: 1, O: 1, H: 1 })).toMatchObject({ formula: 'NaOH', category: 'Base' });
    expect(normalizeFormula({ Cu: 1, O: 4, S: 1 }, 5).formula).toBe('CuSO4·5H2O');
  });
});

describe('Stoffe aus PubChem', () => {
  it('nimmt bekannte Stoffe aus der Offline-Datenbank', () => {
    const salt = substanceFromCompound(rdkit, compound(999001, '[Na+].[Cl-]', 'sodium chloride'));
    expect(salt.ok && salt.substance.id).toBe('natriumchlorid');
    const caffeine = substanceFromCompound(rdkit, compound(999002, 'CN1C=NC2=C1C(=O)N(C(=O)N2C)C', 'caffeine'));
    expect(caffeine.ok && caffeine.local).toBe(true);
  });

  it('übernimmt unbekannte Salze mit Ionen außerhalb des Ionenmodells', () => {
    const result = substanceFromCompound(
      rdkit,
      compound(999003, '[O-]S(=O)(=O)[O-].[O-]S(=O)(=O)[O-].[O-]S(=O)(=O)[O-].[Nd+3].[Nd+3]', 'neodymium(III) sulfate'),
      'neodymium(III) sulfate',
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.substance.formula).toBe('Nd2(SO4)3');
    expect(result.substance.smiles).toBeUndefined();
    expect(result.substance.origin).toBe('pubchem');
    expect(result.substance.name).toBe('Neodymium(III) sulfate');
  });

  it('behält bei organischen Stoffen die Struktur', () => {
    const result = substanceFromCompound(rdkit, compound(999004, 'C1=CC=C2C(=C1)C=CC=N2', 'quinoline-like'));
    expect(result.ok).toBe(true);
    const lignoceric = substanceFromCompound(rdkit, compound(999005, 'CCCCCCCCCCCCCCCCCCCCCCCC(=O)O', 'lignoceric acid'));
    expect(lignoceric.ok && lignoceric.substance.smiles).toBeTruthy();
    expect(lignoceric.ok && lignoceric.substance.formula).toBe('C24H48O2');
  });

  it('lehnt gesperrte Stoffe ab', () => {
    const result = substanceFromCompound(rdkit, compound(999006, 'CCOP(=O)(C#N)N(C)C', 'tabun'));
    expect(result.ok).toBe(false);
  });
});

describe('Eingabe als SMILES', () => {
  it('erkennt SMILES, aber keine Namen', () => {
    expect(looksLikeSmiles(rdkit, 'CCO')).toBe(true);
    expect(looksLikeSmiles(rdkit, 'c1ccccc1O')).toBe(true);
    expect(looksLikeSmiles(rdkit, 'Brom')).toBe(false);
    expect(looksLikeSmiles(rdkit, 'Ethanol')).toBe(false);
    expect(looksLikeSmiles(rdkit, 'NaCl')).toBe(false);
  });

  it('findet eingegebene Strukturen in der Datenbank', () => {
    const result = substanceFromSmiles(rdkit, 'OCC');
    expect(result.ok && result.substance.id).toBe('ethanol');
  });

  it('macht aus neuen Strukturen einen Stoff für die Werkbank', () => {
    const result = substanceFromSmiles(rdkit, 'CC(C)(C)CC(=O)OCC(C)C');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.substance.id).toMatch(/^smiles-/);
    expect(result.substance.origin).toBe('eingabe');
    const mixed = mix(rdkit, [result.substance, substanceById('natriumhydroxid')!], DEFAULT_CONDITIONS);
    expect(mixed.reactions.length + (mixed.pairOutcomes?.length ?? 0)).toBeGreaterThan(0);
  });
});
