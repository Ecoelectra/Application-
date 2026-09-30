/**
 * Weitere Stoffquellen neben PubChem: Wikidata, ChEMBL, NCI CACTUS, OPSIN.
 * Die Antworten der Dienste werden nachgebildet (Aufbau wie in deren
 * Dokumentation); geprüft werden Auswertung, Ausfallsicherheit und der
 * Abgleich mehrerer Quellen.
 */
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import type { MainModule } from '@rdkit/rdkit';
import initRDKitModule from '@rdkit/rdkit';
import {
  cactusResolve,
  chemblSearch,
  fromWikidata,
  lookupEverywhere,
  opsinParse,
  plainFormula,
  suggestNames,
  wikidataSearch,
  type SourceHit,
} from '../substanceSources';
import { consensus, inchiKeyOf } from '../../chem/externalSubstances';

let rdkit: MainModule;

beforeAll(async () => {
  rdkit = await initRDKitModule();
}, 60_000);

afterEach(() => {
  vi.unstubAllGlobals();
});

type Route = [RegExp, number, unknown];

/** fetch nachbilden: je Adresse Status und Antwort; nicht aufgeführte Adressen scheitern wie offline */
function stubFetch(routes: Route[]): string[] {
  const calls: string[] = [];
  vi.stubGlobal('fetch', async (input: string) => {
    const url = String(input);
    calls.push(url);
    const route = routes.find(([pattern]) => pattern.test(url));
    if (!route) throw new TypeError('Failed to fetch');
    const [, status, body] = route;
    return {
      ok: status >= 200 && status < 300,
      status,
      json: async () => body,
      text: async () => (typeof body === 'string' ? body : JSON.stringify(body)),
    } as Response;
  });
  return calls;
}

const CAFFEINE = 'CN1C=NC2=C1C(=O)N(C(=O)N2C)C';

const caffeineEntity = {
  id: 'Q60235',
  labels: { de: { value: 'Coffein' }, en: { value: 'caffeine' } },
  aliases: { de: [{ value: 'Koffein' }, { value: 'Tein' }] },
  descriptions: { de: { value: 'chemische Verbindung' } },
  claims: {
    P233: [{ rank: 'deprecated', mainsnak: { datavalue: { value: 'C' } } }, { rank: 'normal', mainsnak: { datavalue: { value: CAFFEINE } } }],
    P274: [{ rank: 'normal', mainsnak: { datavalue: { value: 'C₈H₁₀N₄O₂' } } }],
    P231: [{ rank: 'preferred', mainsnak: { datavalue: { value: '58-08-2' } } }],
    P662: [{ rank: 'normal', mainsnak: { datavalue: { value: '2519' } } }],
  },
};

const cityEntity = { id: 'Q64', labels: { de: { value: 'Berlin' } }, claims: { P17: [] } };

describe('Wikidata', () => {
  it('liest Struktur, Formel, CAS und PubChem-CID; veraltete Aussagen zählen nicht', () => {
    const hit = fromWikidata(caffeineEntity) as SourceHit;
    expect(hit.name).toBe('Coffein');
    expect(hit.smiles).toBe(CAFFEINE);
    expect(hit.formula).toBe('C8H10N4O2');
    expect(hit.cas).toBe('58-08-2');
    expect(hit.cid).toBe(2519);
    expect(hit.synonyms).toEqual(expect.arrayContaining(['caffeine', 'Koffein']));
    expect(hit.url).toBe('https://www.wikidata.org/wiki/Q60235');
  });

  it('Einträge ohne Struktur und Formel sind keine Stoffe', () => {
    expect(fromWikidata(cityEntity)).toBeNull();
  });

  it('sucht mit deutschem Namen und behält nur Stoffe', async () => {
    const calls = stubFetch([
      [/wbsearchentities/, 200, { search: [{ id: 'Q64' }, { id: 'Q60235' }] }],
      [/wbgetentities/, 200, { entities: { Q64: cityEntity, Q60235: caffeineEntity } }],
    ]);
    const hits = await wikidataSearch('Koffein');
    expect(hits.map((hit) => hit.ref)).toEqual(['Q60235']);
    expect(calls[0]).toContain('language=de');
    expect(calls[0]).toContain('origin=*');
  });

  it('CAS-Nummer über die Aussage P231', async () => {
    const calls = stubFetch([
      [/list=search/, 200, { query: { search: [{ title: 'Q60235' }] } }],
      [/wbgetentities/, 200, { entities: { Q60235: caffeineEntity } }],
    ]);
    const hits = await wikidataSearch('58-08-2');
    expect(hits[0]?.name).toBe('Coffein');
    expect(decodeURIComponent(calls[0])).toContain('haswbstatement:P231=58-08-2');
  });
});

describe('ChEMBL, NCI CACTUS, OPSIN', () => {
  it('ChEMBL: Name in Großbuchstaben wird lesbar, Formel ohne Salzanteil', async () => {
    stubFetch([
      [
        /chembl\/api\/data\/molecule\/search/,
        200,
        {
          molecules: [
            {
              molecule_chembl_id: 'CHEMBL113',
              pref_name: 'CAFFEINE',
              molecule_structures: { canonical_smiles: CAFFEINE, standard_inchi_key: 'RYYVLZVUVIJVGH-UHFFFAOYSA-N' },
              molecule_properties: { full_molformula: 'C8H10N4O2' },
              molecule_synonyms: [{ molecule_synonym: 'Caffeine' }, { molecule_synonym: 'Guaranine' }],
            },
            { molecule_chembl_id: 'CHEMBL999', pref_name: 'OHNE STRUKTUR', molecule_structures: null },
          ],
        },
      ],
    ]);
    const hits = await chemblSearch('caffeine');
    expect(hits).toHaveLength(1);
    expect(hits[0].name).toBe('Caffeine');
    expect(hits[0].inchiKey).toBe('RYYVLZVUVIJVGH-UHFFFAOYSA-N');
    expect(hits[0].url).toContain('CHEMBL113');
  });

  it('NCI CACTUS: SMILES als Text, Fehlerseite und 404 sind kein Treffer', async () => {
    stubFetch([[/cactus.*caffeine/, 200, `${CAFFEINE}\n`]]);
    expect((await cactusResolve('caffeine'))?.smiles).toBe(CAFFEINE);
    stubFetch([[/cactus/, 200, '<html><body>Page not found</body></html>']]);
    expect(await cactusResolve('quatsch')).toBeNull();
    stubFetch([[/cactus/, 404, 'not found']]);
    expect(await cactusResolve('gibtsnicht')).toBeNull();
  });

  it('OPSIN: systematische Namen, keine CAS-Nummern', async () => {
    stubFetch([
      [/opsin.*2-methylpropan-1-ol/, 200, { status: 'SUCCESS', smiles: 'CC(C)CO', stdinchikey: 'ZXEKIIBDNHEJCQ-UHFFFAOYSA-N' }],
      [/opsin/, 404, { status: 'FAILURE', message: 'unparsable' }],
    ]);
    expect((await opsinParse('2-methylpropan-1-ol'))?.smiles).toBe('CC(C)CO');
    expect(await opsinParse('Haushaltszucker')).toBeNull();
    const calls = stubFetch([]);
    expect(await opsinParse('58-08-2')).toBeNull();
    expect(calls).toEqual([]);
  });

  it('Formeln mit tiefgestellten Ziffern und Ladungen', () => {
    expect(plainFormula('C₈H₁₀N₄O₂')).toBe('C8H10N4O2');
    expect(plainFormula('SO₄²⁻')).toBe('SO4');
    expect(plainFormula(undefined)).toBeUndefined();
  });
});

describe('Alle Quellen zusammen', () => {
  it('fällt eine Quelle aus, liefern die übrigen weiter', async () => {
    stubFetch([
      // PubChem und OPSIN sind «offline» (keine Route), Wikidata und NCI antworten
      [/wbsearchentities/, 200, { search: [{ id: 'Q60235' }] }],
      [/wbgetentities/, 200, { entities: { Q60235: caffeineEntity } }],
      [/chembl/, 500, {}],
      [/cactus/, 200, CAFFEINE],
    ]);
    const result = await lookupEverywhere('Koffein');
    expect(result.hits.map((hit) => hit.source).sort()).toEqual(['cactus', 'wikidata']);
    expect(result.empty.sort()).toEqual(['chembl', 'opsin', 'pubchem']);
  });

  it('Vorschläge: deutsche Namen aus Wikidata zuerst, dann PubChem', async () => {
    stubFetch([
      [/autocomplete/, 200, { dictionary_terms: { compound: ['caffeine', 'Coffein', 'caffeine citrate'] } }],
      [/wbsearchentities/, 200, { search: [{ id: 'Q60235' }] }],
      [/wbgetentities/, 200, { entities: { Q60235: caffeineEntity } }],
    ]);
    const suggestions = await suggestNames('Koff');
    expect(suggestions[0]).toMatchObject({ label: 'Coffein', source: 'wikidata' });
    expect(suggestions[0].hit?.smiles).toBe(CAFFEINE);
    // «Coffein» aus PubChem nicht doppelt
    expect(suggestions.filter((entry) => entry.label.toLowerCase() === 'coffein')).toHaveLength(1);
    expect(suggestions.map((entry) => entry.label)).toContain('caffeine citrate');
  });
});

describe('Abgleich der Quellen', () => {
  const hit = (source: SourceHit['source'], smiles: string, extra: Partial<SourceHit> = {}): SourceHit => ({
    source,
    ref: `${source}-ref`,
    name: `${source}-name`,
    smiles,
    synonyms: [],
    url: 'https://example.org',
    ...extra,
  });
  // Ein Stoff, der nicht in der Offline-Datenbank steht: 4-(Thiophen-2-yl)butansäure
  const THIENYL = 'OC(=O)CCCc1cccs1';

  it('die Struktur, die die meisten Quellen liefern, gewinnt – Schreibweise egal', () => {
    const outcome = consensus(
      rdkit,
      [
        hit('pubchem', THIENYL, { ref: '12345', cid: 12345 }),
        hit('wikidata', 'c1csc(c1)CCCC(=O)O', { name: '4-(2-Thienyl)buttersäure', cas: '4653-11-6' }),
        hit('cactus', 'CCO'),
      ],
      undefined,
    );
    expect(outcome).not.toBeNull();
    expect(outcome?.agree.map((entry) => entry.source)).toEqual(['pubchem', 'wikidata']);
    expect(outcome?.disagree.map((entry) => entry.source)).toEqual(['cactus']);
    expect(outcome?.result.ok).toBe(true);
    if (!outcome?.result.ok) return;
    const substance = outcome.result.substance;
    // Deutscher Name aus Wikidata, Kennung von PubChem
    expect(substance.name).toBe('4-(2-Thienyl)buttersäure');
    expect(substance.id).toBe('pubchem-12345');
    expect(substance.pubchemCid).toBe(12345);
    expect(substance.cas).toBe('4653-11-6');
    expect(substance.confirmedBy).toEqual(['PubChem', 'Wikidata']);
    expect(substance.origin).toBe('pubchem');
    expect(substance.formula).toBe('C8H10O2S');
  });

  it('bei Gleichstand gewinnt die zuverlässigere Quelle; der eingegebene Name bleibt', () => {
    const outcome = consensus(rdkit, [hit('opsin', 'CCCCCCCCCCCCCCCCCCCCO'), hit('chembl', THIENYL, { ref: 'CHEMBL42' })], 'Mein Stoff');
    expect(outcome?.best.source).toBe('chembl');
    expect(outcome?.result.ok && outcome.result.substance.name).toBe('Mein Stoff');
    expect(outcome?.result.ok && outcome.result.substance.id).toBe('chembl-CHEMBL42');
  });

  it('gesperrte Stoffe werden auch aus Online-Quellen nie übernommen', () => {
    const tnt = 'Cc1c(cc(cc1[N+](=O)[O-])[N+](=O)[O-])[N+](=O)[O-]';
    const outcome = consensus(rdkit, [hit('wikidata', tnt), hit('pubchem', tnt)], 'TNT');
    expect(outcome?.result.ok).toBe(false);
  });

  it('Treffer ohne Struktur ergeben keinen Stoff', () => {
    expect(consensus(rdkit, [{ ...hit('wikidata', ''), smiles: undefined, formula: 'NaCl' }])).toBeNull();
  });

  it('InChIKey mit RDKit', () => {
    expect(inchiKeyOf(rdkit, 'CCO')).toBe('LFQSCWFLJHTTHZ-UHFFFAOYSA-N');
    expect(inchiKeyOf(rdkit, CAFFEINE)).toBe('RYYVLZVUVIJVGH-UHFFFAOYSA-N');
    expect(inchiKeyOf(rdkit, 'kein smiles')).toBeNull();
  });
});
