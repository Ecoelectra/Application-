import { describe, expect, it } from 'vitest';
import {
  atomEconomy,
  dilutionVolume,
  limitingReagent,
  massForSolution,
  percentYield,
  planReagents,
  toAmount,
} from '../stoichiometry';

describe('Mengenumrechnung', () => {
  it('rechnet Masse in Stoffmenge um', () => {
    expect(toAmount({ mass: 18.015 }, 18.015)).toBeCloseTo(1, 6);
  });

  it('berücksichtigt die Reinheit', () => {
    expect(toAmount({ mass: 10, purity: 0.9 }, 100)).toBeCloseTo(0.09, 6);
  });

  it('rechnet über Volumen und Dichte', () => {
    // 10 mL Ethanol, Dichte 0,789 g/mL, M = 46,07 g/mol
    expect(toAmount({ volume: 10, density: 0.789 }, 46.07)).toBeCloseTo(0.1713, 3);
  });

  it('rechnet über Volumen und Konzentration', () => {
    expect(toAmount({ volume: 250, concentration: 0.2 }, 100)).toBeCloseTo(0.05, 6);
  });

  it('meldet fehlende Angaben', () => {
    expect(() => toAmount({}, 100)).toThrow(/Zu wenig Angaben/);
  });
});

describe('Ansatzplanung', () => {
  it('berechnet Einwaagen aus Äquivalenten', () => {
    const plan = planReagents(0.1, [
      { name: 'Essigsäure', formula: 'C2H4O2', equivalents: 1 },
      { name: 'Ethanol', formula: 'C2H6O', equivalents: 5, density: 0.789 },
    ]);
    expect(plan[0].mass).toBeCloseTo(6.005, 2);
    expect(plan[1].amount).toBeCloseTo(0.5, 6);
    expect(plan[1].volume).toBeCloseTo(29.2, 0);
  });
});

describe('Unterschussreagenz', () => {
  it('erkennt das begrenzende Edukt', () => {
    const result = limitingReagent([
      { name: 'H2', amount: 3, coefficient: 2 },
      { name: 'O2', amount: 1, coefficient: 1 },
    ], 2);
    expect(result.limiting).toBe('O2');
    expect(result.maxProductAmount).toBeCloseTo(2, 6);
    expect(result.utilisation.H2).toBeCloseTo(2 / 3, 6);
  });
});

describe('Kennzahlen', () => {
  it('berechnet die Ausbeute', () => {
    expect(percentYield(8.5, 10)).toBeCloseTo(85, 6);
  });

  it('berechnet die Atomökonomie der Veresterung', () => {
    // Essigsäure (60,05) + Ethanol (46,07) → Ethylacetat (88,11) + Wasser
    expect(atomEconomy(88.11, [60.05, 46.07])).toBeCloseTo(83, 0);
  });

  it('rechnet Verdünnungen', () => {
    expect(dilutionVolume(2, 0.1, 500)).toBeCloseTo(25, 6);
    expect(() => dilutionVolume(0.1, 1, 100)).toThrow(/nicht erhöhen/);
  });

  it('berechnet die Einwaage für eine Maßlösung', () => {
    // 1 L Natronlauge c = 0,1 mol/L, M(NaOH) = 40 g/mol
    expect(massForSolution(0.1, 1000, 40)).toBeCloseTo(4, 6);
  });
});
