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
    const result = mixIds(['essigsaeure', 'ethanol'], { ...DEFAULT_CONDITIONS, temperature: 'heiss', catalysis: 'sauer' });
    const ester = result.reactions.find((r) => r.ruleId === 'fischer-veresterung');
    expect(ester).toBeDefined();
    expect(ester?.products[0].name).toBe('Essigsäureethylester');
  });

  it('nennt fehlende Bedingungen', () => {
    const kalt = mixIds(['essigsaeure', 'ethanol']);
    const ester = kalt.reactions.find((r) => r.ruleId === 'fischer-veresterung');
    expect(ester?.missing.length).toBeGreaterThan(0);
    expect(ester?.missing.join(' ')).toMatch(/Erhitzen|Säurekatalyse/);
  });

  it('acetyliert Salicylsäure zu Aspirin', () => {
    const result = mixIds(['salicylsaeure', 'acetanhydrid'], { ...DEFAULT_CONDITIONS, temperature: 'heiss', catalysis: 'sauer' });
    const aspirin = result.reactions.find((r) => r.products.some((p) => p.name === 'Acetylsalicylsäure'));
    expect(aspirin).toBeDefined();
  });

  it('erkennt den Stoffnamen des Produkts wieder', () => {
    const result = mixIds(['propan-2-ol', 'kaliumpermanganat']);
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
    const result = mixIds(['kaliumnitrat']);
    expect(result.outcome).toBe('keine-reaktion');
    expect(result.hints[0]).toContain('Reaktionspartner');
  });

  it('schlägt für Kochsalz allein die Schmelzflusselektrolyse vor – mit Strom als fehlender Bedingung', () => {
    const result = mixIds(['natriumchlorid']);
    const downs = result.reactions.find((reaction) => reaction.ruleId === 'downs-zelle');
    expect(downs?.missing.join(' ')).toContain('Elektrolyse');
  });

  it('zersetzt Kalk nur beim Erhitzen', () => {
    expect(mixIds(['calciumcarbonat']).outcome).toBe('keine-reaktion');
    const heiss = mixIds(['calciumcarbonat'], { ...DEFAULT_CONDITIONS, temperature: 'heiss' });
    expect(heiss.reactions[0].equation).toBe('CaCO3 → CaO + CO2');
  });

  it('verdrängt Kupfer aus seinem Salz', () => {
    const result = mixIds(['zink', 'kupfersulfat']);
    expect(result.reactions[0].equation).toBe('Zn + CuSO4 → ZnSO4 + Cu');
    expect(result.reactions[0].observation).toContain('Kupfer');
  });

  describe('Säure- und Basenkatalyse', () => {
    it('spaltet Ester sauer katalysiert mit Wasser, basisch mit Lauge', () => {
      const sauer = mixIds(['essigsaeureethylester', 'wasser'], { ...DEFAULT_CONDITIONS, temperature: 'heiss', catalysis: 'sauer' });
      expect(sauer.reactions[0].ruleId).toBe('saure-esterhydrolyse');
      expect(sauer.reactions[0].missing).toEqual([]);
      expect(sauer.reactions[0].catalysisMatched).toBe(true);

      const basisch = mixIds(['essigsaeureethylester', 'natriumhydroxid'], { ...DEFAULT_CONDITIONS, temperature: 'heiss' });
      expect(basisch.reactions[0].ruleId).toBe('esterverseifung');
    });

    it('erklärt, wenn die gewählte Katalyse nicht passt', () => {
      const result = mixIds(['essigsaeure', 'ethanol'], { ...DEFAULT_CONDITIONS, temperature: 'heiss', catalysis: 'basisch' });
      const ester = result.reactions.find((reaction) => reaction.ruleId === 'fischer-veresterung');
      expect(ester?.missing.join(' ')).toContain('Braucht Säurekatalyse');
    });

    it('zählt eine zugegebene Säure als Säurekatalyse', () => {
      const result = mixIds(['essigsaeure', 'ethanol', 'schwefelsaeure'], { ...DEFAULT_CONDITIONS, temperature: 'heiss' });
      const ester = result.reactions.find((reaction) => reaction.ruleId === 'fischer-veresterung');
      expect(ester?.missing).toEqual([]);
    });

    it('dehydratisiert Ethanol nur säurekatalysiert und heiß', () => {
      const kalt = mixIds(['ethanol']);
      expect(kalt.reactions.filter((reaction) => !reaction.missing.length)).toEqual([]);
      const heiss = mixIds(['ethanol'], { ...DEFAULT_CONDITIONS, temperature: 'heiss', catalysis: 'sauer' });
      const ids = heiss.reactions.filter((reaction) => !reaction.missing.length).map((reaction) => reaction.ruleId);
      expect(ids).toContain('alkohol-dehydratisierung');
      expect(ids).toContain('ether-kondensation');
    });

    it('kondensiert Acetaldehyd basenkatalysiert (Aldol)', () => {
      const result = mixIds(['acetaldehyd'], { ...DEFAULT_CONDITIONS, catalysis: 'basisch' });
      expect(result.reactions[0].ruleId).toBe('aldol-kondensation');
    });

    it('bromiert Benzol nur mit Lewis-Säure', () => {
      const ohne = mixIds(['benzol', 'brom']);
      expect(ohne.reactions.filter((reaction) => !reaction.missing.length)).toEqual([]);
      const mit = mixIds(['benzol', 'brom'], { ...DEFAULT_CONDITIONS, catalysis: 'lewis' });
      expect(mit.reactions[0].products[0].name).toBe('Brombenzol');
    });
  });

  describe('keine erfundenen Partner', () => {
    it('verestert Ethanol nicht mit einer Säure, die gar nicht im Gefäß ist', () => {
      const result = mixIds(['ethanol'], { ...DEFAULT_CONDITIONS, temperature: 'heiss', catalysis: 'sauer' });
      expect(result.reactions.some((reaction) => reaction.ruleId === 'fischer-veresterung')).toBe(false);
    });

    it('reduziert Aceton nicht ohne Reduktionsmittel', () => {
      const result = mixIds(['aceton']);
      expect(result.reactions.some((reaction) => reaction.ruleId === 'nabh4-reduktion')).toBe(false);
    });

    it('verwechselt Wasser nicht mit Wasserstoff', () => {
      const result = mixIds(['cyclohexen', 'wasser'], { ...DEFAULT_CONDITIONS, catalysis: 'metall' });
      expect(result.reactions.some((reaction) => reaction.ruleId === 'katalytische-hydrierung')).toBe(false);
    });
  });

  describe('neue Reaktionstypen', () => {
    it('verbrennt organische Stoffe', () => {
      const result = mixIds(['ethanol', 'sauerstoff'], { ...DEFAULT_CONDITIONS, temperature: 'heiss' });
      expect(result.reactions[0].equation).toBe('C2H6O + 3 O2 → 2 CO2 + 3 H2O');
    });

    it('trübt Kalkwasser', () => {
      const result = mixIds(['kohlenstoffdioxid', 'calciumhydroxid']);
      expect(result.reactions[0].equation).toBe('CO2 + Ca(OH)2 → CaCO3 + H2O');
      expect(result.reactions[0].observation).toContain('trübt');
    });

    it('fällt Bariumsulfat auch mit Schwefelsäure', () => {
      const result = mixIds(['bariumchlorid', 'schwefelsaeure']);
      expect(result.reactions[0].equation).toBe('BaCl2 + H2SO4 → BaSO4 + 2 HCl');
    });

    it('unterscheidet Carbonsäuren und Phenole mit Natron', () => {
      expect(mixIds(['benzoesaeure', 'natriumhydrogencarbonat']).outcome).toBe('reaktion');
      expect(mixIds(['phenol', 'natriumhydrogencarbonat']).outcome).toBe('keine-reaktion');
    });

    it('weist reduzierende Zucker mit Fehling nach, Saccharose aber nicht', () => {
      const glucose = mixIds(['glucose', 'fehling-reagenz'], { ...DEFAULT_CONDITIONS, temperature: 'heiss' });
      expect(glucose.reactions[0].observation).toContain('ziegelrot');
      const saccharose = mixIds(['saccharose', 'fehling-reagenz'], { ...DEFAULT_CONDITIONS, temperature: 'heiss' });
      expect(saccharose.reactions[0].observation).toContain('negativ');
    });

    it('chloriert Methan nur unter Licht', () => {
      const dunkel = mixIds(['methan', 'chlor']);
      expect(dunkel.reactions.filter((reaction) => !reaction.missing.length)).toEqual([]);
      const hell = mixIds(['methan', 'chlor'], { ...DEFAULT_CONDITIONS, light: true });
      expect(hell.reactions[0].products[0].name).toBe('Chlormethan');
    });

    it('verbrennt Eisen in Chlor zu Eisen(III)-chlorid', () => {
      const result = mixIds(['eisen', 'chlor'], { ...DEFAULT_CONDITIONS, temperature: 'heiss' });
      expect(result.reactions[0].equation).toBe('2 Fe + 3 Cl2 → 2 FeCl3');
    });

    it('lässt Produkte weiterverwenden, auch wenn sie nicht in der Datenbank stehen', async () => {
      const { productAsSubstance } = await import('../workbench');
      const substance = productAsSubstance({ smiles: 'CCCCC#N', formula: 'C5H9N' });
      expect(substance?.smiles).toBe('CCCCC#N');
      expect(substance?.molarMass).toBeGreaterThan(80);
    });
  });
});
