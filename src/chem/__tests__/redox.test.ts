import { describe, expect, it } from 'vitest';
import { balanceHalfReaction, balanceRedox, formatOxidationState, oxidationStates } from '../redox';

describe('oxidationStates', () => {
  it('bestimmt Oxidationszahlen in Salzen und Oxosäuren', () => {
    expect(oxidationStates('KMnO4')).toEqual({ K: 1, O: -2, Mn: 7 });
    expect(oxidationStates('H2SO4')).toEqual({ H: 1, O: -2, S: 6 });
    expect(oxidationStates('K2Cr2O7')).toEqual({ K: 1, O: -2, Cr: 6 });
    expect(oxidationStates('NaCl')).toEqual({ Na: 1, Cl: -1 });
  });

  it('erkennt Elemente im Grundzustand und Ionen', () => {
    expect(oxidationStates('O2')).toEqual({ O: 0 });
    expect(oxidationStates('Fe3+')).toEqual({ Fe: 3 });
    expect(oxidationStates('SO4^2-')).toEqual({ S: 6, O: -2 });
  });

  it('behandelt Peroxide und Hydride als Sonderfälle', () => {
    expect(oxidationStates('H2O2')).toEqual({ H: 1, O: -1 });
    expect(oxidationStates('NaH')).toEqual({ Na: 1, H: -1 });
  });

  it('liefert gebrochene Werte bei gemischtvalenten Oxiden', () => {
    const states = oxidationStates('Fe3O4');
    expect(states?.Fe).toBeCloseTo(8 / 3, 6);
    expect(formatOxidationState(8 / 3)).toBe('+8/3');
  });
});

describe('balanceHalfReaction', () => {
  it('gleicht die Permanganat-Reduktion im Sauren aus', () => {
    const half = balanceHalfReaction('MnO4^-', 'Mn2+', 'sauer');
    expect(half.kind).toBe('Reduktion');
    expect(half.electrons).toBe(5);
    expect(half.equation).toBe('MnO4^- + 8 H+ + 5 e- → Mn2+ + 4 H2O');
  });

  it('gleicht die Dichromat-Reduktion aus', () => {
    const half = balanceHalfReaction('Cr2O7^2-', 'Cr3+', 'sauer');
    expect(half.electrons).toBe(6);
    expect(half.equation).toBe('Cr2O7^2- + 14 H+ + 6 e- → 2 Cr3+ + 7 H2O');
  });

  it('gleicht im basischen Milieu über Hydroxid aus', () => {
    const half = balanceHalfReaction('MnO4^-', 'MnO2', 'basisch');
    expect(half.electrons).toBe(3);
    expect(half.equation).toBe('MnO4^- + 2 H2O + 3 e- → MnO2 + 4 OH-');
  });
});

describe('balanceRedox', () => {
  it('kombiniert Oxidation und Reduktion zur Gesamtgleichung', () => {
    const result = balanceRedox(
      { from: 'Fe2+', to: 'Fe3+' },
      { from: 'MnO4^-', to: 'Mn2+' },
      'sauer',
    );
    expect(result.transferredElectrons).toBe(5);
    expect(result.equation).toBe('5 Fe2+ + MnO4^- + 8 H+ → 5 Fe3+ + Mn2+ + 4 H2O');
  });
});

describe('Oxidationszahlen in Sonderfällen', () => {
  it('gibt Wasserstoff in Hydroxiden +I, in Metallhydriden −I', () => {
    expect(oxidationStates('NaOH')).toEqual({ Na: 1, O: -2, H: 1 });
    expect(oxidationStates('Ca(OH)2')).toEqual({ Ca: 2, O: -2, H: 1 });
    expect(oxidationStates('CaH2')).toEqual({ Ca: 2, H: -1 });
    expect(oxidationStates('KH')).toEqual({ K: 1, H: -1 });
  });

  it('verteilt die Ladung bei Polyhalogeniden', () => {
    expect(oxidationStates('KI3')?.I).toBeCloseTo(-1 / 3, 9);
  });

  it('gleicht die Nitrat-Reduktion zum Ammonium-Ion aus', () => {
    const half = balanceHalfReaction('NO3^-', 'NH4+', 'sauer');
    expect(half.electrons).toBe(8);
    expect(half.equation).toBe('NO3^- + 10 H+ + 8 e- → NH4+ + 3 H2O');
  });
});
