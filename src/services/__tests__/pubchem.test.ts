import { afterEach, describe, expect, it, vi } from 'vitest';
import { compoundByCid, findCompound, structureImageUrl } from '../pubchem';

const propertyResponse = {
  PropertyTable: {
    Properties: [
      {
        CID: 2244,
        Title: 'Aspirin',
        MolecularFormula: 'C9H8O4',
        MolecularWeight: '180.16',
        SMILES: 'CC(=O)OC1=CC=CC=C1C(=O)O',
        InChIKey: 'BSYNRYMUTXBXSQ-UHFFFAOYSA-N',
        XLogP: 1.2,
      },
    ],
  },
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('PubChem-Client', () => {
  it('liest Stoffdaten zu einer CID', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify(propertyResponse), { status: 200 })),
    );
    const compound = await compoundByCid(2244);
    expect(compound?.title).toBe('Aspirin');
    expect(compound?.formula).toBe('C9H8O4');
    expect(compound?.molecularWeight).toBeCloseTo(180.16, 2);
    expect(compound?.smiles).toBe('CC(=O)OC1=CC=CC=C1C(=O)O');
  });

  it('liefert null, wenn PubChem nicht erreichbar ist', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => {
      throw new Error('offline');
    }));
    expect(await compoundByCid(99999999)).toBeNull();
    expect(await findCompound('Ethanol')).toBeNull();
  });

  it('verarbeitet Fehlerantworten ohne Ausnahme', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('Not Found', { status: 404 })));
    expect(await findCompound('gibtesnicht')).toBeNull();
  });

  it('baut die Bild-URL korrekt auf', () => {
    expect(structureImageUrl(2244)).toContain('/compound/cid/2244/PNG');
  });
});
