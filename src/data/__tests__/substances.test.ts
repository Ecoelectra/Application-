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
import { formulaKey, searchSubstances, substanceById, SUBSTANCES } from '../substances';

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
