/** Prüft die Werkbank an Kombinationen, deren Ergebnis feststeht. */
import { beforeAll, describe, expect, it } from 'vitest';
import type { MainModule } from '@rdkit/rdkit';
import initRDKitModule from '@rdkit/rdkit';
import { DEFAULT_CONDITIONS, mix } from '../workbench';
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

function mixIds(ids: string[], options = DEFAULT_CONDITIONS) {
  return mix(rdkit, ids.map(get), options);
}

describe('Werkbank', () => {
  it('verweigert gefährliche Mischungen ohne Ergebnis', () => {
    const result = mixIds(['natriumhypochlorit', 'salzsaeure']);
    expect(result.outcome).toBe('gesperrt');
    expect(result.reactions).toEqual([]);
    expect(result.blocked).toContain('Chlor');
  });

  it('erkennt die Neutralisation', () => {
    const result = mixIds(['salzsaeure', 'natriumhydroxid']);
    expect(result.outcome).toBe('reaktion');
    expect(result.reactions[0].equation).toBe('HCl + NaOH → NaCl + H2O');
    expect(result.reactions[0].products.map((p) => p.name)).toContain('Natriumchlorid');
  });

  it('löst Zink in Salzsäure', () => {
    const result = mixIds(['zink', 'salzsaeure']);
    expect(result.reactions.some((r) => r.equation === 'Zn + 2 HCl → ZnCl2 + H2')).toBe(true);
    expect(result.reactions[0].tags).toContain('Wasserstoff');
  });

  it('fällt Silberchlorid', () => {
    const result = mixIds(['silbernitrat', 'natriumchlorid']);
    expect(result.reactions[0].equation).toBe('AgNO3 + NaCl → AgCl + NaNO3');
    expect(result.reactions[0].observation).toContain('weiß');
  });

  it('verestert Essigsäure mit Ethanol', () => {
    const result = mixIds(['essigsaeure', 'ethanol'], { ...DEFAULT_CONDITIONS, heat: true, catalyst: true });
    const ester = result.reactions.find((r) => r.ruleId === 'fischer-veresterung');
    expect(ester).toBeDefined();
    expect(ester?.products[0].name).toBe('Essigsäureethylester');
  });

  it('nennt fehlende Bedingungen', () => {
    const kalt = mixIds(['essigsaeure', 'ethanol']);
    const ester = kalt.reactions.find((r) => r.ruleId === 'fischer-veresterung');
    expect(ester?.missing.length).toBeGreaterThan(0);
    expect(ester?.missing.join(' ')).toMatch(/Erhitzen|Schwefelsäure/);
  });

  it('acetyliert Salicylsäure zu Aspirin', () => {
    const result = mixIds(['salicylsaeure', 'acetanhydrid'], { ...DEFAULT_CONDITIONS, heat: true, catalyst: true });
    const aspirin = result.reactions.find((r) => r.products.some((p) => p.name === 'Acetylsalicylsäure'));
    expect(aspirin).toBeDefined();
  });

  it('erkennt den Stoffnamen des Produkts wieder', () => {
    const result = mixIds(['propan-2-ol'], { ...DEFAULT_CONDITIONS, heat: true, catalyst: true });
    const aceton = result.reactions.find((r) => r.products.some((p) => p.name === 'Aceton'));
    expect(aceton).toBeDefined();
    expect(aceton?.products[0].substanceId).toBe('aceton');
  });

  it('erklärt, warum nichts passiert', () => {
    const result = mixIds(['natriumchlorid', 'kaliumnitrat']);
    expect(result.outcome).toBe('keine-reaktion');
    expect(result.hints.join(' ')).toContain('Niederschlag');
  });

  it('erklärt, warum Kupfer sich nicht in Salzsäure löst', () => {
    const result = mixIds(['kupfer', 'salzsaeure']);
    expect(result.outcome).toBe('keine-reaktion');
    expect(result.hints.join(' ')).toContain('edler');
  });

  it('braucht für einen einzelnen Stoff einen Partner', () => {
    const result = mixIds(['natriumchlorid']);
    expect(result.outcome).toBe('keine-reaktion');
    expect(result.hints[0]).toContain('Reaktionspartner');
  });

  it('zersetzt Kalk nur beim Erhitzen', () => {
    expect(mixIds(['calciumcarbonat']).outcome).toBe('keine-reaktion');
    const heiss = mixIds(['calciumcarbonat'], { ...DEFAULT_CONDITIONS, heat: true });
    expect(heiss.reactions[0].equation).toBe('CaCO3 → CaO + CO2');
  });

  it('verdrängt Kupfer aus seinem Salz', () => {
    const result = mixIds(['zink', 'kupfersulfat']);
    expect(result.reactions[0].equation).toBe('Zn + CuSO4 → ZnSO4 + Cu');
    expect(result.reactions[0].observation).toContain('Kupfer');
  });
});
