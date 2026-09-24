import { describe, expect, it } from 'vitest';
import { elementalComposition, molarMass, parseFormula, toHillFormula } from '../formula';

describe('parseFormula', () => {
  it('liest einfache Formeln', () => {
    expect(parseFormula('H2O').counts).toEqual({ H: 2, O: 1 });
  });

  it('löst geschachtelte Klammern auf', () => {
    expect(parseFormula('Ca(NO3)2').counts).toEqual({ Ca: 1, N: 2, O: 6 });
    expect(parseFormula('K4[Fe(CN)6]').counts).toEqual({ K: 4, Fe: 1, C: 6, N: 6 });
  });

  it('berücksichtigt Kristallwasser', () => {
    expect(parseFormula('CuSO4·5H2O').counts).toEqual({ Cu: 1, S: 1, O: 9, H: 10 });
  });

  it('liest Ladungen', () => {
    expect(parseFormula('SO4^2-').charge).toBe(-2);
    expect(parseFormula('Fe3+').charge).toBe(3);
    expect(parseFormula('OH-').charge).toBe(-1);
  });

  it('versteht tiefgestellte Unicode-Ziffern', () => {
    expect(parseFormula('C₆H₁₂O₆').counts).toEqual({ C: 6, H: 12, O: 6 });
  });

  it('meldet unbekannte Elemente', () => {
    expect(() => parseFormula('XyZ2')).toThrow(/Unbekanntes Elementsymbol/);
  });
});

describe('molarMass', () => {
  it('rechnet Molmassen korrekt', () => {
    expect(molarMass('H2O')).toBeCloseTo(18.015, 2);
    expect(molarMass('C6H12O6')).toBeCloseTo(180.156, 2);
    expect(molarMass('CuSO4·5H2O')).toBeCloseTo(249.68, 1);
    expect(molarMass('KMnO4')).toBeCloseTo(158.03, 1);
  });
});

describe('elementalComposition', () => {
  it('liefert Massenanteile, die sich zu 100 % addieren', () => {
    const composition = elementalComposition('C2H5OH');
    const sum = composition.reduce((acc, entry) => acc + entry.massPercent, 0);
    expect(sum).toBeCloseTo(100, 6);
    expect(composition[0].symbol).toBe('C');
  });
});

describe('toHillFormula', () => {
  it('ordnet nach Hill-Konvention', () => {
    expect(toHillFormula({ O: 1, H: 4, C: 2 })).toBe('C2H4O');
    expect(toHillFormula({ O: 4, S: 1, H: 2 })).toBe('H2O4S');
  });
});

describe('Ladungen mehratomiger Ionen', () => {
  it('liest NH4+ und H3O+ als einfach geladene Ionen', () => {
    expect(parseFormula('NH4+')).toEqual({ counts: { N: 1, H: 4 }, charge: 1 });
    expect(parseFormula('H3O+')).toEqual({ counts: { H: 3, O: 1 }, charge: 1 });
    expect(parseFormula('MnO4-')).toEqual({ counts: { Mn: 1, O: 4 }, charge: -1 });
  });

  it('behält Ziffern als Ladung bei einatomigen Ionen und Komplexen', () => {
    expect(parseFormula('Fe3+').charge).toBe(3);
    expect(parseFormula('S2-').charge).toBe(-2);
    expect(parseFormula('[Cu(NH3)4]2+')).toEqual({ counts: { Cu: 1, N: 4, H: 12 }, charge: 2 });
  });

  it('vervielfacht die Ladung nicht mit dem Kristallwasser', () => {
    expect(parseFormula('[Co(H2O)6]Cl2·2H2O').charge).toBe(0);
    expect(parseFormula('Fe·3H2O^2+').charge).toBe(2);
  });
});
