import { describe, expect, it } from 'vitest';
import {
  electrolysisTime,
  evaluateCell,
  faradayElectrolysis,
  hydrogenElectrodePotential,
  nernstPotential,
  nernstSlope,
  specificEnergyDemand,
} from '../electro';

describe('Nernst-Gleichung', () => {
  it('liefert bei 25 °C die Steigung 0,0592 V', () => {
    expect(nernstSlope()).toBeCloseTo(0.05916, 4);
  });

  it('ergibt bei Q = 1 das Standardpotential', () => {
    expect(nernstPotential({ standardPotential: 0.34, electrons: 2, quotient: 1 })).toBeCloseTo(
      0.34,
      10,
    );
  });

  it('senkt das Potential bei verdünnter Kupferlösung', () => {
    const potential = nernstPotential({
      standardPotential: 0.342,
      electrons: 2,
      quotient: 0.001,
    });
    expect(potential).toBeCloseTo(0.342 - (0.05916 / 2) * 3, 3);
  });

  it('rechnet das Potential der Wasserstoffelektrode pH-abhängig', () => {
    expect(hydrogenElectrodePotential(7)).toBeCloseTo(-0.414, 3);
    expect(hydrogenElectrodePotential(0)).toBeCloseTo(0, 10);
  });
});

describe('Zellberechnung', () => {
  it('berechnet das Daniell-Element', () => {
    const cell = evaluateCell(0.342, -0.762, 2);
    expect(cell.cellPotential).toBeCloseTo(1.104, 3);
    expect(cell.gibbsEnergy).toBeCloseTo(-213.0, 0);
    expect(cell.spontaneous).toBe(true);
    expect(cell.equilibriumConstant).toBeGreaterThan(1e36);
  });

  it('erkennt erzwungene Reaktionen', () => {
    const cell = evaluateCell(-0.762, 0.342, 2);
    expect(cell.spontaneous).toBe(false);
    expect(cell.gibbsEnergy).toBeGreaterThan(0);
  });
});

describe('Faradaysche Gesetze', () => {
  it('berechnet die Kupferabscheidung', () => {
    const result = faradayElectrolysis({
      current: 2,
      time: 3600,
      electrons: 2,
      molarMass: 63.546,
    });
    expect(result.charge).toBe(7200);
    expect(result.amount).toBeCloseTo(0.0373, 4);
    expect(result.mass).toBeCloseTo(2.371, 3);
  });

  it('berücksichtigt die Stromausbeute', () => {
    const full = faradayElectrolysis({ current: 1, time: 1000, electrons: 2, molarMass: 100 });
    const partial = faradayElectrolysis({
      current: 1,
      time: 1000,
      electrons: 2,
      molarMass: 100,
      efficiency: 0.5,
    });
    expect(partial.mass).toBeCloseTo(full.mass / 2, 10);
  });

  it('rechnet die Elektrolysedauer zurück', () => {
    const time = electrolysisTime(2.371, 63.546, 2, 2);
    expect(time).toBeCloseTo(3600, 0);
  });

  it('schätzt den Energiebedarf der Chloralkali-Elektrolyse', () => {
    // 3,1 V Zellspannung, 2 e- je Mol Cl2 (M = 70,9 g/mol), 96 % Stromausbeute
    const demand = specificEnergyDemand(3.1, 2, 70.9, 0.96);
    expect(demand).toBeGreaterThan(2.2);
    expect(demand).toBeLessThan(2.6);
  });
});
