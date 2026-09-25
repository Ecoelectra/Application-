/**
 * Prüft die Stoffdatenbank auf innere Widersprüche.
 *
 * Wichtigster Test: Die aus der SMILES berechnete Summenformel muss mit der
 * angegebenen Formel übereinstimmen. So fallen vertippte Strukturen auf, die
 * RDKit zwar lesen kann, die aber einen anderen Stoff beschreiben.
 */
import { beforeAll, describe, expect, it } from 'vitest';
import type { MainModule } from '@rdkit/rdkit';
import initRDKitModule from '@rdkit/rdkit';
import { canonicalSmiles, molecularFormula } from '../../chem/rdkit';
import { ELEMENTS } from '../../chem/elements';
import { splitSalt } from '../../chem/ions';
import { CURATED_SUBSTANCES, formulaKey, searchSubstances, substanceById, SUBSTANCES } from '../substances';

let rdkit: MainModule;

beforeAll(async () => {
  rdkit = await initRDKitModule();
}, 60_000);

/** Hill-Formel ohne Ladungsangabe, für den Vergleich mit Salzen in SMILES-Form. */
function stripCharge(formula: string): string {
  return formula.replace(/\^\d*[+-]$/, '');
}

describe('Stoffdatenbank', () => {
  it('enthält mindestens 450 Stoffe', () => {
    expect(SUBSTANCES.length).toBeGreaterThanOrEqual(450);
  });

  it('hat eindeutige Kennungen und Namen', () => {
    const ids = new Set<string>();
    const duplicates: string[] = [];
    for (const substance of SUBSTANCES) {
      if (ids.has(substance.id)) duplicates.push(substance.id);
      ids.add(substance.id);
      expect(substance.id, substance.name).toMatch(/^[a-z0-9-]+$/);
    }
    expect(duplicates).toEqual([]);
  });

  it('liefert für jede Formel eine molare Masse', () => {
    const failures = SUBSTANCES.filter((substance) => !(substance.molarMass > 0)).map(
      (substance) => `${substance.name}: ${substance.formula}`,
    );
    expect(failures).toEqual([]);
  });

  it('lässt jede SMILES von RDKit einlesen', () => {
    const failures = SUBSTANCES.filter(
      (substance) => substance.smiles && !canonicalSmiles(rdkit, substance.smiles),
    ).map((substance) => `${substance.name}: ${substance.smiles}`);
    expect(failures).toEqual([]);
  });

  it('stimmt in Formel und Struktur überein', () => {
    const failures: string[] = [];
    for (const substance of SUBSTANCES) {
      if (!substance.smiles) continue;
      const computed = molecularFormula(rdkit, substance.smiles);
      if (!computed) continue;
      const stated = formulaKey(substance.formula);
      if (stripCharge(computed) !== stated) {
        failures.push(`${substance.name}: angegeben ${stated}, aus SMILES ${computed}`);
      }
    }
    expect(failures).toEqual([]);
  });

  it('enthält keine Struktur doppelt', () => {
    const seen = new Map<string, string>();
    const duplicates: string[] = [];
    for (const substance of SUBSTANCES) {
      if (!substance.smiles) continue;
      const canonical = canonicalSmiles(rdkit, substance.smiles);
      if (!canonical) continue;
      const previous = seen.get(canonical);
      if (previous) duplicates.push(`${previous} = ${substance.name}`);
      else seen.set(canonical, substance.name);
    }
    expect(duplicates).toEqual([]);
  });

  it('findet Stoffe über Name, Synonym und Formel', () => {
    expect(searchSubstances('Bananenöl')[0].name).toBe('Isoamylacetat');
    expect(searchSubstances('AgNO3')[0].name).toBe('Silbernitrat');
    expect(searchSubstances('Propan-1,2,3-triol')[0].name).toBe('Glycerin');
    expect(substanceById('eisen-iii-chlorid')?.formula).toBe('FeCl3');
  });
});

describe('Erzeugte Stoffe', () => {
  const generated = SUBSTANCES.filter((substance) => substance.origin === 'generiert');

  it('erweitert die Datenbank auf über 1500 Stoffe', () => {
    expect(generated.length).toBeGreaterThan(700);
    expect(SUBSTANCES.length).toBeGreaterThan(1500);
  });

  it('enthält alle natürlich vorkommenden Elemente', () => {
    const missing = ELEMENTS.filter((element) => element.z <= 92 && !['At', 'Fr'].includes(element.symbol))
      .map((element) => (['H', 'N', 'O', 'F', 'Cl', 'Br', 'I'].includes(element.symbol) ? `${element.symbol}2` : element.symbol))
      .filter((formula) => !SUBSTANCES.some((substance) => formulaKey(substance.formula) === formulaKey(formula)));
    expect(missing).toEqual([]);
  });

  it('zerlegt jedes erzeugte Salz in die genannten Ionen', () => {
    const failures: string[] = [];
    for (const substance of generated.filter((entry) => entry.description?.startsWith('Aus '))) {
      const salt = splitSalt(substance.formula);
      if (!salt) {
        failures.push(`${substance.name}: ${substance.formula}`);
        continue;
      }
      const cationName = salt.cation.name.replace(/-Ion.*$/, '');
      if (!substance.name.startsWith(cationName)) failures.push(`${substance.name}: Kation ${salt.cation.name}`);
    }
    expect(failures).toEqual([]);
  });

  it('erzeugt keine Cyanide und keine explosiven Salze', () => {
    const forbidden = generated.filter(
      (substance) =>
        (/(^|[^S])CN(\)|$)/.test(substance.formula) && !substance.formula.includes('[Fe(CN)6]')) ||
        /^NH4(ClO3|ClO4|MnO4)|^\(NH4\)2Cr2O7/.test(substance.formula) ||
        /^(Ag|Cu|Hg)2?C2$/.test(substance.formula),
    );
    expect(forbidden.map((substance) => substance.name)).toEqual([]);
  });

  it('doppelt keine Stoffe der Grundtabellen', () => {
    const curatedIds = new Set(CURATED_SUBSTANCES.map((substance) => substance.id));
    expect(generated.filter((substance) => curatedIds.has(substance.id))).toEqual([]);
  });

  it('findet erzeugte Stoffe in der Suche', () => {
    expect(searchSubstances('Titan')[0].formula).toBe('Ti');
    expect(searchSubstances('Önanthsäure')[0].name).toBe('Heptansäure');
    expect(searchSubstances('4-Chlorbenzoesäure')[0].smiles).toBeTruthy();
    expect(substanceById('blei-ii-iodid')?.formula).toBe('PbI2');
  });
});
