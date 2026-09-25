/// <reference types="node" />
/**
 * Prüft die Datenbank belegter Reaktionen und ihren Abgleich in der Werkbank.
 */
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import type { MainModule } from '@rdkit/rdkit';
import initRDKitModule from '@rdkit/rdkit';
import { canonicalSmiles } from '../../chem/rdkit';
import { structureKey } from '../../chem/reactionKeys';
import { isPublishableProduct } from '../../chem/safety';
import { DEFAULT_CONDITIONS, documentedSuggestions, mix, vesselKeys } from '../../chem/workbench';
import {
  loadReactionIndex,
  reactionsInvolving,
  reactionsToProduct,
  reactionsWithReactant,
  setReactionFileLoader,
  type DocumentedReaction,
} from '../documentedReactions';
import { substanceById } from '../substances';
import type { Substance } from '../types';

const DIR = resolve(process.cwd(), 'public/reaktionen');
let rdkit: MainModule;

beforeAll(async () => {
  setReactionFileLoader(async (file) => {
    try {
      return new Uint8Array(await readFile(resolve(DIR, file)));
    } catch {
      return null;
    }
  });
  rdkit = await initRDKitModule();
}, 60_000);

function get(id: string): Substance {
  const substance = substanceById(id);
  if (!substance) throw new Error(`Stoff ${id} fehlt`);
  return substance;
}

async function mixWithDatabase(ids: string[], conditions = DEFAULT_CONDITIONS) {
  const substances = ids.map(get);
  const documented = await reactionsInvolving(vesselKeys(rdkit, substances));
  return { result: mix(rdkit, substances, conditions, documented), documented, substances };
}

describe('Datenbank belegter Reaktionen', () => {
  it('enthält 100 000 Reaktionen', async () => {
    const index = await loadReactionIndex();
    expect(index?.total).toBe(100_000);
    expect(index?.directlyReproducible).toBeGreaterThan(1000);
    expect(index?.source).toContain('Lowe');
  });

  it('findet Reaktionen über Edukt und Produkt', async () => {
    const anilin = structureKey(rdkit, get('anilin').smiles!)!;
    const withAnilin = await reactionsWithReactant(anilin);
    expect(withAnilin.length).toBeGreaterThan(100);
    expect(withAnilin.every((reaction) => reaction.reactants.includes(anilin))).toBe(true);

    const aspirin = structureKey(rdkit, get('acetylsalicylsaeure').smiles!)!;
    const routes = await reactionsToProduct(aspirin);
    expect(routes.length).toBeGreaterThan(0);
    expect(routes.every((reaction) => reaction.product === aspirin)).toBe(true);
  });

  it('enthält nur gültige, zulässige Strukturen', async () => {
    // Stichprobe aus 16 Teildateien
    const reactions: DocumentedReaction[] = [];
    for (const key of ['CO', 'CCO', 'Nc1ccccc1', 'O=C(Cl)Cl', 'CC(=O)OC(C)=O', 'CI', 'O=S(Cl)Cl', 'N']) {
      reactions.push(...(await reactionsWithReactant(structureKey(rdkit, key) ?? key)));
    }
    expect(reactions.length).toBeGreaterThan(1000);
    for (const reaction of reactions.slice(0, 1500)) {
      for (const smiles of [...reaction.reactants, reaction.product]) {
        expect(canonicalSmiles(rdkit, smiles), smiles).not.toBeNull();
      }
      expect(isPublishableProduct(reaction.product, rdkit), reaction.product).toBe(true);
      expect(reaction.reactants).not.toContain(reaction.product);
      expect(reaction.count).toBeGreaterThan(0);
    }
  });
});

describe('Plausibilitätsfilter', () => {
  it('verwirft Zuordnungsfehler, bei denen ein Edukt nur ein einzelnes Atom beisteuert', async () => {
    const anilin = structureKey(rdkit, get('anilin').smiles!)!;
    const benzamid = structureKey(rdkit, 'NC(=O)c1ccccc1')!;
    const withAnilin = await reactionsWithReactant(anilin);
    expect(withAnilin.filter((reaction) => reaction.product === benzamid)).toEqual([]);
  });

  it('behält Reagenzien, die nur ein Halogenatom übertragen', async () => {
    const { result } = await mixWithDatabase(['benzoesaeure', 'thionylchlorid']);
    expect(result.reactions.some((reaction) => reaction.evidence === 'belegt')).toBe(true);
  });
});

describe('Werkbank mit belegten Reaktionen', () => {
  it('belegt die Acetylierung von Anilin', async () => {
    const { result } = await mixWithDatabase(['anilin', 'acetanhydrid']);
    const proof = result.reactions.find((reaction) => reaction.evidence === 'belegt');
    expect(proof, 'keine belegte Reaktion').toBeDefined();
    expect(proof?.products.some((product) => product.name === 'Acetanilid')).toBe(true);
    expect(proof?.evidenceNote).toContain('Patent');
  });

  it('belegt die Synthese von Acetylsalicylsäure', async () => {
    const { result } = await mixWithDatabase(['salicylsaeure', 'acetanhydrid'], {
      ...DEFAULT_CONDITIONS,
      catalysis: 'sauer',
      temperature: 'heiss',
    });
    const aspirin = result.reactions.find((reaction) =>
      reaction.products.some((product) => product.substanceId === 'acetylsalicylsaeure'),
    );
    expect(aspirin?.evidence).toBe('belegt');
  });

  it('kennzeichnet reine Regelergebnisse als Vorhersage', async () => {
    const { result } = await mixWithDatabase(['salzsaeure', 'natriumhydroxid']);
    expect(result.reactions[0].evidence).toBe('vorhersage');
    expect(result.reactions[0].evidenceNote).toContain('nicht einzeln belegt');
  });

  it('kennzeichnet Nachweise mit Schulbuchbeispielen als Lehrbuchreaktion', () => {
    const result = mix(rdkit, [get('glucose'), get('fehling-reagenz')], { ...DEFAULT_CONDITIONS, temperature: 'heiss' });
    expect(result.reactions[0].evidence).toBe('lehrbuch');
  });

  it('gibt jeder Reaktion eine Herkunft', async () => {
    for (const ids of [['ethanol', 'essigsaeure'], ['zink', 'salzsaeure'], ['benzaldehyd', 'natriumborhydrid'], ['methanol', 'thionylchlorid']]) {
      const { result } = await mixWithDatabase(ids, { ...DEFAULT_CONDITIONS, catalysis: 'sauer', temperature: 'heiss' });
      for (const reaction of result.reactions) {
        expect(['belegt', 'lehrbuch', 'vorhersage']).toContain(reaction.evidence);
        expect(reaction.evidenceNote.length).toBeGreaterThan(20);
        if (reaction.evidence === 'belegt') expect(reaction.documented?.count).toBeGreaterThan(0);
      }
    }
  });

  it('erfindet keine belegten Reaktionen für einen Stoff allein', async () => {
    const { result } = await mixWithDatabase(['anilin']);
    expect(result.reactions.filter((reaction) => reaction.evidence === 'belegt' && !reaction.missing.length)).toEqual([]);
  });

  it('schlägt belegte Partner vor', async () => {
    const { documented, substances } = await mixWithDatabase(['anilin']);
    const suggestions = documentedSuggestions(rdkit, substances, DEFAULT_CONDITIONS, documented);
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions[0].from).toBe('Anilin');
    // Vorschläge mit Partnern aus der Stoffdatenbank stehen oben
    expect(suggestions[0].partners.every((partner) => !partner.id.startsWith('produkt-'))).toBe(true);

    // Partner dazugeben: jetzt ist die Reaktion belegt und vollständig
    const partner = suggestions.find((entry) => entry.partners.length === 1)!;
    const next = [...substances, ...partner.partners];
    const more = await reactionsInvolving(vesselKeys(rdkit, next));
    const result = mix(rdkit, next, { ...DEFAULT_CONDITIONS, aqueous: false }, more);
    expect(result.reactions.some((reaction) => reaction.evidence === 'belegt' && !reaction.missing.length)).toBe(true);
  });
});
