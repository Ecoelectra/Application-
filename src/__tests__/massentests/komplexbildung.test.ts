/**
 * Massentest Komplexbildung: jede Metallquelle der Stoffdatenbank mit jeder
 * Ligandenquelle – rund 18 000 Kombinationen. Geprüft wird, dass nichts
 * abstürzt, jeder Komplex gültig und zum Metall passend ist, Gleichungen
 * ausgeglichen sind, ausgeschlossene Paare (Redox, Fällung) keinen Komplex
 * ergeben und jede Reaktion ihre Herkunft nennt.
 */
import { describe, expect, it } from 'vitest';
import initRDKitModule from '@rdkit/rdkit';
import { complexChemistry, ligandSourcesOf, metalSourceOf } from '../../chem/complexFormation';
import { SUBSTANCES } from '../../data/substances';
import { gleichungsFehler } from './hilfen';

const rdkit = await initRDKitModule();

const metalSubstances = SUBSTANCES.filter((substance) => metalSourceOf(substance));
const ligandSubstances = SUBSTANCES.filter((substance) => ligandSourcesOf(rdkit, substance).length > 0);
const pairs = metalSubstances.flatMap((metal) =>
  ligandSubstances.filter((ligand) => ligand !== metal).map((ligand) => [metal, ligand] as const),
);

/** Paare, bei denen statt eines Komplexes Redox oder Fällung abläuft. */
const NEVER_COMPLEX = new Set(['cu2|i', 'fe3|i', 'cu2|cn', 'cu2|s2o3', 'fe3|s2o3', 'fe2|scn', 'hg2|nh3', 'ag1|cl', 'ag1|br', 'ag1|i']);

let complexes = 0;
let balanced = 0;

describe('Massentest Komplexbildung', () => {
  it('prüft mindestens 1000 Kombinationen', () => {
    expect(metalSubstances.length).toBeGreaterThan(80);
    expect(ligandSubstances.length).toBeGreaterThan(100);
    expect(pairs.length).toBeGreaterThanOrEqual(1000);
  });

  it.each(pairs.map(([metal, ligand]) => [metal.id, ligand.id, metal, ligand] as const))('%s + %s', (_, __, metal, ligand) => {
    // Beide Stoffe können Metallquelle sein (Calciumhydroxid liefert auch Hydroxid-Liganden)
    const sources = [metal, ligand].map((entry) => metalSourceOf(entry)).filter(Boolean);
    const result = complexChemistry(rdkit, [metal, ligand], { aqueous: true, catalysis: 'keine' });

    for (const hint of result.hints) expect(hint.length).toBeGreaterThan(20);

    for (const reaction of result.reactions) {
      expect(reaction.equation.length).toBeGreaterThan(0);
      expect(reaction.observation.length).toBeGreaterThan(10);
      expect(['lehrbuch', 'vorhersage']).toContain(reaction.evidence);
      expect(reaction.evidenceNote.length).toBeGreaterThan(20);
      if (reaction.balancedFormulas) {
        expect(gleichungsFehler(reaction.balancedFormulas), reaction.balancedFormulas).toEqual([]);
        balanced++;
      }
      if (!reaction.complex) {
        expect(reaction.type).toBe('Fällungsreaktion');
        continue;
      }
      complexes++;
      const complex = reaction.complex;
      expect(complex.valid, complex.formula).toBe(true);
      // Liefern beide Stoffe dasselbe Metall (FeI2 und Fe(SCN)2), nennt participants den Metallstoff
      const metalId = reaction.participants?.[0];
      const source = sources.find((entry) => entry!.metal.id === complex.metal.id && (!metalId || entry!.substance.id === metalId));
      expect(source, complex.formula).toBeDefined();
      const partner = source!.substance === metal ? ligand : metal;
      const ligandSource = ligandSourcesOf(rdkit, partner)[0];
      expect(complex.charge).toBe(
        complex.metal.charge + complex.ligands.reduce((sum, entry) => sum + entry.count * entry.ligand.charge, 0),
      );
      expect(complex.name.length).toBeGreaterThan(5);
      expect(NEVER_COMPLEX.has(`${complex.metal.id}|${ligandSource.analog}`)).toBe(false);
      if (source!.inert) expect.unreachable('geglühte Oxide bilden keinen Komplex');
      // Stoffklassen werden nie als Lehrbuchreaktion ausgegeben
      if (ligandSource.generic) expect(reaction.evidence).toBe('vorhersage');
    }
  });

  it('hat viele Komplexe gebildet und Gleichungen geprüft', () => {
    expect(complexes).toBeGreaterThan(500);
    expect(balanced).toBeGreaterThan(500);
  });
});
