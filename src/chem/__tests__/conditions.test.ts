/** Temperatur- und Druckregler, Aggregatzustände und Vorhersagen für Stoffpaare. */
import { beforeAll, describe, expect, it } from 'vitest';
import type { MainModule } from '@rdkit/rdkit';
import initRDKitModule from '@rdkit/rdkit';
import { gasBalance, pressureNote } from '../conditionEffects';
import { boilingPointAt, physicalProperties, rateFactor, stateAt } from '../phase';
import { predictPair } from '../prediction';
import { DEFAULT_CONDITIONS, mix, temperatureRange, type WorkbenchConditions } from '../workbench';
import { substanceById } from '../../data/substances';
import type { Substance } from '../../data/types';

let rdkit: MainModule;

beforeAll(async () => {
  rdkit = await initRDKitModule();
}, 60_000);

function get(id: string): Substance {
  const substance = substanceById(id);
  if (!substance) throw new Error(`Stoff ${id} fehlt`);
  return substance;
}

function at(temperatureC: number, pressureBar = 1.013): WorkbenchConditions {
  return { ...DEFAULT_CONDITIONS, temperatureC, pressureBar, temperature: temperatureRange(temperatureC) };
}

const context = { temperature: 20, pressure: 1.013, aqueous: true, blocked: [] };

describe('Aggregatzustände', () => {
  it('liest Tabellenwerte bei Normaldruck', () => {
    const water = physicalProperties(rdkit, get('wasser'));
    expect(stateAt(water, 20, 1.013).state).toBe('flüssig');
    expect(stateAt(water, -10, 1.013).state).toBe('fest');
    expect(stateAt(water, 105, 1.013).state).toBe('gasförmig');
  });

  it('verschiebt den Siedepunkt mit dem Druck (Clausius-Clapeyron)', () => {
    // Wasser siedet bei 2 bar bei etwa 120 °C, bei 0,1 bar bei etwa 46 °C
    expect(boilingPointAt(100, 2, true)).toBeGreaterThan(115);
    expect(boilingPointAt(100, 2, true)).toBeLessThan(125);
    expect(boilingPointAt(100, 0.1, true)).toBeGreaterThan(40);
    expect(boilingPointAt(100, 0.1, true)).toBeLessThan(52);
    const water = physicalProperties(rdkit, get('wasser'));
    expect(stateAt(water, 110, 2).state).toBe('flüssig');
    expect(stateAt(water, 60, 0.1).state).toBe('gasförmig');
  });

  it('kennt Sublimation und Zersetzung', () => {
    expect(stateAt(physicalProperties(rdkit, get('kohlenstoffdioxid')), 20, 1.013).state).toBe('gasförmig');
    expect(stateAt(physicalProperties(rdkit, get('kohlenstoffdioxid')), -100, 1.013).state).toBe('fest');
    expect(stateAt(physicalProperties(rdkit, get('calciumcarbonat')), 950, 1.013).state).toBe('zersetzt');
    expect(stateAt(physicalProperties(rdkit, get('calciumcarbonat')), 500, 1.013).state).toBe('fest');
  });

  it('schätzt unbekannte organische Stoffe nach Joback', () => {
    const decanol = physicalProperties(rdkit, get('decan-1-ol'));
    expect(decanol.source).toBe('Joback-Schätzung');
    // Tabellenwert: 231 °C
    expect(decanol.bp).toBeGreaterThan(190);
    expect(decanol.bp).toBeLessThan(270);
  });

  it('rechnet die Geschwindigkeit nach der RGT-Regel', () => {
    expect(rateFactor(30)).toBeCloseTo(2, 5);
    expect(rateFactor(10)).toBeCloseTo(0.5, 5);
    expect(rateFactor(20)).toBe(1);
  });
});

describe('Regler in der Werkbank', () => {
  it('brennt Kalk erst oberhalb der Zersetzungstemperatur', () => {
    const cold = mix(rdkit, [get('calciumcarbonat')], { ...at(500), aqueous: false });
    const hot = mix(rdkit, [get('calciumcarbonat')], { ...at(950), aqueous: false });
    const burn = (result: ReturnType<typeof mix>) => result.reactions.find((reaction) => reaction.equation.includes('CaO'));
    expect(burn(cold)?.missing.length).toBeGreaterThan(0);
    expect(burn(hot)?.missing).toEqual([]);
  });

  it('verlangt für das Haber-Bosch-Verfahren hohen Druck', () => {
    const substances = [get('stickstoff'), get('wasserstoff')];
    const haber = (result: ReturnType<typeof mix>) => result.reactions.find((reaction) => reaction.equation.includes('NH₃'));
    const lowPressure = haber(mix(rdkit, substances, at(450, 1.013)));
    const highPressure = haber(mix(rdkit, substances, at(450, 200)));
    expect(lowPressure?.missing.some((entry) => entry.includes('Druck'))).toBe(true);
    expect(highPressure?.missing.some((entry) => entry.includes('Druck'))).toBe(false);
  });

  it('bilanziert Gasteilchen nach Le Chatelier', () => {
    expect(gasBalance(rdkit, 'N2 + 3 H2 → 2 NH3', 450, 200)).toBe(-2);
    expect(gasBalance(rdkit, 'CaCO3 → CaO + CO2', 950, 1)).toBe(1);
    expect(pressureNote(rdkit, 'N2 + 3 H2 → 2 NH3', 450, 200)).toContain('Produkten');
    expect(pressureNote(rdkit, 'NaCl + AgNO3 → AgCl + NaNO3', 20, 1)).toBeNull();
  });

  it('gibt Hinweise zu den eingestellten Bedingungen', () => {
    const result = mix(rdkit, [get('ethanol'), get('essigsaeure')], at(120, 0.05));
    expect(result.notes?.some((note) => note.includes('Ethanol') && note.includes('siedet'))).toBe(true);
    expect(result.notes?.some((note) => note.startsWith('Unterdruck'))).toBe(true);
  });
});

describe('Vorhersage für jedes Stoffpaar', () => {
  it('sagt Redoxreaktionen über die Spannungsreihe voraus', () => {
    const prediction = predictPair(rdkit, get('natrium'), get('kupfer-ii-hydroxid'), context);
    expect(prediction.chemical).toBe(true);
    expect(prediction.reactionType).toContain('Redox');
    expect(prediction.products.map((product) => product.formula)).toContain('Cu');
    expect(prediction.confidence).toBe('hoch');
  });

  it('sagt Protonenübertragungen über pKs-Werte voraus', () => {
    const prediction = predictPair(rdkit, get('phenol'), get('natriumhydroxid'), context);
    expect(prediction.chemical).toBe(true);
    expect(prediction.balancedFormulas).toBeDefined();
    expect(prediction.products.some((product) => product.name?.includes('Phenol'))).toBe(true);
  });

  it('beschreibt ohne Reaktion das physikalische Verhalten', () => {
    const prediction = predictPair(rdkit, get('hexan'), get('wasser'), context);
    expect(prediction.chemical).toBe(false);
    expect(prediction.kind).toBe('physikalisch');
    expect(prediction.observation).toContain('mischt sich nicht');
  });

  it('hängt nicht von der Reihenfolge ab', () => {
    const a = predictPair(rdkit, get('glycin'), get('alanin'), context);
    const b = predictPair(rdkit, get('alanin'), get('glycin'), context);
    expect(a.equation).toBe(b.equation);
  });

  it('kennzeichnet Vorhersagen in der Werkbank', () => {
    const result = mix(rdkit, [get('natrium'), get('kupfer-ii-hydroxid')], DEFAULT_CONDITIONS);
    const predicted = result.reactions.find((reaction) => reaction.tags.includes('Vorhersage'));
    expect(predicted?.evidence).toBe('vorhersage');
    expect(predicted?.confidence).toBe('hoch');
    expect(predicted?.evidenceNote).toContain('Vorhersage');
  });

  it('meldet «keine Reaktion» als eigenes Ergebnis', () => {
    const result = mix(rdkit, [get('natriumchlorid'), get('kaliumnitrat')], DEFAULT_CONDITIONS);
    expect(result.outcome).toBe('keine-reaktion');
    expect(result.pairOutcomes?.length).toBe(1);
    expect(result.pairOutcomes?.[0].participants).toEqual(expect.arrayContaining(['natriumchlorid', 'kaliumnitrat']));
  });
});
