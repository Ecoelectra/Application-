/**
 * Qualitätsprüfung der Reaktionsdatenbank.
 *
 * Jede Reaktionsvorschrift wird mit RDKit geladen und auf die hinterlegten
 * Beispieledukte angewendet. So fällt eine fehlerhafte SMARTS sofort auf,
 * statt erst in der laufenden App.
 */
import { beforeAll, describe, expect, it } from 'vitest';
import type { MainModule } from '@rdkit/rdkit';
import initRDKitModule from '@rdkit/rdkit';
import { REACTIONS } from '../../data/reactions';
import { FUNCTIONAL_GROUPS } from '../../data/functionalGroups';
import { canonicalSmiles, matchSmarts, runReaction } from '../rdkit';

let rdkit: MainModule;

beforeAll(async () => {
  rdkit = await initRDKitModule();
}, 60_000);

describe('Datenbankstruktur', () => {
  it('vergibt eindeutige IDs', () => {
    const ids = REACTIONS.map((reaction) => reaction.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('verweist nur auf bekannte funktionelle Gruppen', () => {
    const known = new Set(FUNCTIONAL_GROUPS.map((group) => group.id));
    for (const reaction of REACTIONS) {
      for (const group of reaction.functionalGroups) {
        expect(known, `${reaction.id} → ${group}`).toContain(group);
      }
    }
  });

  it('enthält für jede Reaktion Anleitung, Mechanismus und Sicherheitshinweise', () => {
    for (const reaction of REACTIONS) {
      expect(reaction.procedure.length, reaction.id).toBeGreaterThan(0);
      expect(reaction.mechanism.steps.length, reaction.id).toBeGreaterThan(0);
      expect(reaction.safety.ppe.length, reaction.id).toBeGreaterThan(0);
      expect(reaction.references.length, reaction.id).toBeGreaterThan(0);
    }
  });
});

describe('SMARTS der funktionellen Gruppen', () => {
  it('sind gültig', () => {
    for (const group of FUNCTIONAL_GROUPS) {
      const query = rdkit.get_qmol(group.smarts);
      expect(query, group.id).not.toBeNull();
      query?.delete();
    }
  });
});

describe('Reaktionsvorschriften', () => {
  it('liefern für die Vorgabeedukte mindestens ein Produkt', () => {
    const failures: string[] = [];

    for (const reaction of REACTIONS) {
      if (!reaction.smirks) continue;
      const defaults = reaction.reactantDefaults ?? [];
      if (!defaults.length) {
        failures.push(`${reaction.id}: keine Vorgabeedukte hinterlegt`);
        continue;
      }
      for (const smiles of defaults) {
        if (!canonicalSmiles(rdkit, smiles)) {
          failures.push(`${reaction.id}: ungültiges Vorgabeedukt ${smiles}`);
        }
      }
      const products = runReaction(rdkit, reaction.smirks, defaults);
      if (!products.length) {
        failures.push(`${reaction.id}: keine Produkte aus ${defaults.join(' + ')}`);
        continue;
      }
      for (const set of products) {
        for (const product of set) {
          if (!canonicalSmiles(rdkit, product)) {
            failures.push(`${reaction.id}: ungültiges Produkt ${product}`);
          }
        }
      }
    }

    expect(failures.join('\n')).toBe('');
  });

  it('passen mit ihren Substratmustern auf das Beispielsubstrat', () => {
    const failures: string[] = [];

    for (const reaction of REACTIONS) {
      const example = reaction.example;
      if (!example) continue;
      if (!canonicalSmiles(rdkit, example.substrate)) {
        failures.push(`${reaction.id}: ungültiges Beispielsubstrat ${example.substrate}`);
        continue;
      }
      if (!reaction.smirks || !reaction.substrateSlots) continue;

      const matched = reaction.substrateSlots.some((slot) => {
        const reactants = [...(reaction.reactantDefaults ?? [])];
        reactants[slot] = example.substrate;
        return runReaction(rdkit, reaction.smirks as string, reactants).length > 0;
      });
      if (!matched) {
        failures.push(`${reaction.id}: Beispielsubstrat ${example.substrate} liefert kein Produkt`);
      }
    }

    expect(failures.join('\n')).toBe('');
  });

  it('nutzt gültige zusätzliche Substratmuster', () => {
    for (const reaction of REACTIONS) {
      for (const smarts of [...(reaction.substrateSmarts ?? []), ...(reaction.excludeSmarts ?? [])]) {
        const query = rdkit.get_qmol(smarts);
        expect(query, `${reaction.id}: ${smarts}`).not.toBeNull();
        query?.delete();
      }
    }
  });
});

describe('Hilfsfunktionen', () => {
  it('findet funktionelle Gruppen im Molekül', () => {
    const matches = matchSmarts(rdkit, 'CC(=O)O', '[CX3](=[OX1])[OX2H1]');
    expect(matches.length).toBe(1);
    expect(matches[0].atoms.length).toBe(3);
  });

  it('erkennt ungültige SMILES', () => {
    expect(canonicalSmiles(rdkit, 'C1CC')).toBeNull();
  });
});

describe('Feste Gleichungen der anorganischen Verfahren', () => {
  it('sind stöchiometrisch ausgeglichen', async () => {
    const { balanceSpecies } = await import('../balance');
    const failures: string[] = [];

    for (const reaction of REACTIONS) {
      const equation = reaction.fixedEquation;
      if (!equation) continue;
      const reactants = equation.reactants;
      const products = equation.products;
      // Reine Transportprozesse (gleiche Spezies auf beiden Seiten) überspringen
      if (reactants.join() === products.join()) continue;
      try {
        balanceSpecies(reactants, products);
      } catch (error) {
        failures.push(`${reaction.id}: ${(error as Error).message}`);
      }
    }

    expect(failures.join('\n')).toBe('');
  });
});

describe('Stoffdatenbank', () => {
  it('liefert für jeden Stoff eine plausible Molmasse', async () => {
    const { SUBSTANCES } = await import('../../data/substances');
    for (const substance of SUBSTANCES) {
      expect(substance.molarMass, substance.name).toBeGreaterThan(0);
    }
  });

  it('enthält gültige SMILES', async () => {
    const { SUBSTANCES } = await import('../../data/substances');
    const failures = SUBSTANCES.filter(
      (substance) => substance.smiles && !canonicalSmiles(rdkit, substance.smiles),
    ).map((substance) => `${substance.name}: ${substance.smiles}`);
    expect(failures.join('\n')).toBe('');
  });

  it('findet Stoffe über Name, Synonym und Formel', async () => {
    const { searchSubstances } = await import('../../data/substances');
    expect(searchSubstances('Aspirin')[0].name).toBe('Acetylsalicylsäure');
    expect(searchSubstances('H2SO4')[0].name).toBe('Schwefelsäure');
    expect(searchSubstances('Kochsalz')[0].name).toBe('Natriumchlorid');
  });
});
