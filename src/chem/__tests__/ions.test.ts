import { describe, expect, it } from 'vitest';
import {
  displaces,
  dissolvesInAcid,
  isSoluble,
  saltFormula,
  solubilityOf,
  splitHydrate,
  splitSalt,
  CATIONS,
  ANIONS,
} from '../ions';
import { sameComposition } from '../formula';
import { SUBSTANCES } from '../../data/substances';

const cation = (formula: string, charge: number) =>
  CATIONS.find((entry) => entry.formula === formula && entry.charge === charge)!;
const anion = (formula: string) => ANIONS.find((entry) => entry.formula === formula)!;

describe('Ionenmodell', () => {
  it('zerlegt einfache Salze', () => {
    expect(splitSalt('NaCl')).toMatchObject({ cationCount: 1, anionCount: 1 });
    expect(splitSalt('NaCl')?.cation.formula).toBe('Na');
    expect(splitSalt('NaCl')?.anion.formula).toBe('Cl');
  });

  it('erkennt die Wertigkeit aus der Formel', () => {
    expect(splitSalt('FeCl2')?.cation.charge).toBe(2);
    expect(splitSalt('FeCl3')?.cation.charge).toBe(3);
    expect(splitSalt('CuCl')?.cation.charge).toBe(1);
    expect(splitSalt('CuCl2')?.cation.charge).toBe(2);
  });

  it('zerlegt Salze mit mehratomigen Ionen', () => {
    expect(splitSalt('CuSO4')?.anion.formula).toBe('SO4');
    expect(splitSalt('Ca(NO3)2')).toMatchObject({ cationCount: 1, anionCount: 2 });
    expect(splitSalt('Al2(SO4)3')).toMatchObject({ cationCount: 2, anionCount: 3 });
    expect(splitSalt('(NH4)2SO4')?.cation.formula).toBe('NH4');
    expect(splitSalt('NaHCO3')?.anion.formula).toBe('HCO3');
    expect(splitSalt('Na2CO3')?.anion.formula).toBe('CO3');
  });

  it('trennt Kristallwasser ab', () => {
    expect(splitHydrate('CuSO4·5H2O')).toEqual({ rest: 'CuSO4', hydrate: 5 });
    expect(splitHydrate('MgSO4')).toEqual({ rest: 'MgSO4', hydrate: 0 });
    expect(splitSalt('CuSO4·5H2O')?.anion.formula).toBe('SO4');
  });

  it('baut Salzformeln korrekt auf', () => {
    expect(saltFormula(cation('Na', 1), anion('Cl'))).toBe('NaCl');
    expect(sameComposition(saltFormula(cation('Ca', 2), anion('NO3')), 'Ca(NO3)2')).toBe(true);
    expect(sameComposition(saltFormula(cation('Al', 3), anion('SO4')), 'Al2(SO4)3')).toBe(true);
    expect(sameComposition(saltFormula(cation('Fe', 3), anion('OH')), 'Fe(OH)3')).toBe(true);
    expect(sameComposition(saltFormula(cation('Na', 1), anion('CO3')), 'Na2CO3')).toBe(true);
  });

  it('kennt die Löslichkeitsregeln', () => {
    expect(isSoluble('NaCl')).toBe(true);
    expect(isSoluble('KNO3')).toBe(true);
    expect(isSoluble('AgCl')).toBe(false);
    expect(isSoluble('BaSO4')).toBe(false);
    expect(isSoluble('CaCO3')).toBe(false);
    expect(isSoluble('Na2CO3')).toBe(true);
    expect(isSoluble('Cu(OH)2')).toBe(false);
    expect(isSoluble('NaOH')).toBe(true);
  });

  it('nennt Farben charakteristischer Niederschläge', () => {
    expect(solubilityOf('PbI2')?.color).toBe('goldgelb');
    expect(solubilityOf('Cu(OH)2')?.color).toBe('hellblau');
    expect(solubilityOf('Fe(OH)3')?.color).toBe('rotbraun');
    expect(solubilityOf('CuS')?.color).toBe('schwarz');
  });

  it('kennt die Spannungsreihe', () => {
    expect(dissolvesInAcid('Zn')).toBe(true);
    expect(dissolvesInAcid('Mg')).toBe(true);
    expect(dissolvesInAcid('Cu')).toBe(false);
    expect(dissolvesInAcid('Ag')).toBe(false);
    expect(displaces('Zn', 'Cu')).toBe(true);
    expect(displaces('Cu', 'Zn')).toBe(false);
    expect(displaces('Fe', 'Cu')).toBe(true);
    expect(displaces('Cu', 'Ag')).toBe(true);
  });

  it('liest Wasser nicht als Salz', () => {
    expect(splitSalt('H2O')).toBeNull();
    expect(splitSalt('H2O2')).toBeNull();
  });

  it('zerlegt die Salze aus der Stoffdatenbank', () => {
    const salts = SUBSTANCES.filter(
      (substance) => ['Salz', 'Oxid', 'Base'].includes(substance.category) && !substance.smiles,
    );
    const failures = salts
      .filter((substance) => !splitSalt(substance.formula))
      .map((substance) => substance.formula)
      .sort();

    // Diese Stoffe liegen bewusst außerhalb des einfachen Ionenmodells:
    // Netzwerkoxide und molekulare Oxide sind nicht ionisch aufgebaut,
    // Fe3O4 enthält zwei Oxidationsstufen, die übrigen sind Doppel-,
    // Basisch- oder Komplexsalze.
    expect(failures).toEqual(
      [
        'TiO2',
        'SiO2',
        'Fe3O4',
        'P4O10',
        'KAl(SO4)2·12H2O',
        'Cu2(OH)2CO3',
        'K4[Fe(CN)6]',
        'K3[Fe(CN)6]',
      ].sort(),
    );
  });
});

describe('Salzformeln mit zweiatomigen Ionen', () => {
  it('setzt Peroxid und Carbid bei mehrfacher Anzahl in Klammern', () => {
    const find = (list: typeof CATIONS, formula: string, charge: number) =>
      list.find((entry) => entry.formula === formula && entry.charge === charge)!;
    expect(saltFormula(find(CATIONS, 'Fe', 3), find(ANIONS, 'O2', -2))).toBe('Fe2(O2)3');
    expect(saltFormula(find(CATIONS, 'Al', 3), find(ANIONS, 'C2', -2))).toBe('Al2(C2)3');
    expect(saltFormula(find(CATIONS, 'Na', 1), find(ANIONS, 'O2', -2))).toBe('Na2O2');
  });
});
