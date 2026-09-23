import { beforeAll, describe, expect, it } from 'vitest';
import type { MainModule } from '@rdkit/rdkit';
import initRDKitModule from '@rdkit/rdkit';
import { isPublishableProduct, mixtureWarning } from '../safety';
import { substanceById } from '../../data/substances';

let rdkit: MainModule;

beforeAll(async () => {
  rdkit = await initRDKitModule();
}, 60_000);

describe('Sicherheitsprüfungen', () => {
  it('verweigert Mischungen, die giftige Gase freisetzen', () => {
    expect(mixtureWarning(['natriumhypochlorit', 'salzsaeure'])).toBeDefined();
    expect(mixtureWarning(['salzsaeure', 'natriumhypochlorit'])).toBeDefined();
    expect(mixtureWarning(['natriumcyanid', 'schwefelsaeure'])).toBeDefined();
    expect(mixtureWarning(['ethanol', 'essigsaeure'])).toBeUndefined();
  });

  it('kennt alle in den Warnungen genannten Stoffe', () => {
    for (const id of [
      'natriumhypochlorit',
      'salzsaeure',
      'schwefelsaeure',
      'essigsaeure',
      'ammoniak',
      'natriumcyanid',
      'kaliumcyanid',
    ]) {
      expect(substanceById(id), id).toBeDefined();
    }
  });

  it('lässt harmlose Produkte durch', () => {
    expect(isPublishableProduct('CCOC(C)=O', rdkit)).toBe(true);
    expect(isPublishableProduct(undefined, rdkit)).toBe(true);
  });
});
