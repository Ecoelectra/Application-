import { describe, expect, it } from 'vitest';
import { balanceEquation, checkBalance } from '../balance';

describe('balanceEquation', () => {
  it('gleicht die Knallgasreaktion aus', () => {
    expect(balanceEquation('H2 + O2 -> H2O').equation).toBe('2 H2 + O2 → 2 H2O');
  });

  it('gleicht eine Verbrennung aus', () => {
    expect(balanceEquation('C3H8 + O2 -> CO2 + H2O').equation).toBe(
      'C3H8 + 5 O2 → 3 CO2 + 4 H2O',
    );
  });

  it('gleicht die Thermitreaktion aus', () => {
    expect(balanceEquation('Al + Fe2O3 -> Al2O3 + Fe').equation).toBe(
      '2 Al + Fe2O3 → Al2O3 + 2 Fe',
    );
  });

  it('gleicht eine Redoxgleichung mit Ionen und Ladungen aus', () => {
    const result = balanceEquation('MnO4^- + Fe2+ + H+ -> Mn2+ + Fe3+ + H2O');
    const { balanced } = checkBalance(result.reactants, result.products);
    expect(balanced).toBe(true);
    expect(result.equation).toBe(
      'MnO4^- + 5 Fe2+ + 8 H+ → Mn2+ + 5 Fe3+ + 4 H2O',
    );
  });

  it('gleicht die Photosynthese aus', () => {
    expect(balanceEquation('CO2 + H2O -> C6H12O6 + O2').equation).toBe(
      '6 CO2 + 6 H2O → C6H12O6 + 6 O2',
    );
  });

  it('gleicht die Ammoniakverbrennung nach Ostwald aus', () => {
    expect(balanceEquation('NH3 + O2 -> NO + H2O').equation).toBe(
      '4 NH3 + 5 O2 → 4 NO + 6 H2O',
    );
  });

  it('erkennt unmögliche Gleichungen', () => {
    expect(() => balanceEquation('H2 + O2 -> NaCl')).toThrow();
  });

  it('braucht einen Reaktionspfeil', () => {
    expect(() => balanceEquation('H2 + O2')).toThrow(/Reaktionspfeil/);
  });
});
