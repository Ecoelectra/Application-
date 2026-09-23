/** Prüft den erzeugten Synthesekatalog. */
import { beforeAll, describe, expect, it } from 'vitest';
import {
  catalogStats,
  loadCatalog,
  reactionsFrom,
  routesTo,
  searchCatalog,
  type Synthesis,
} from '../catalog';

let catalog: Synthesis[];

beforeAll(async () => {
  catalog = await loadCatalog();
}, 60_000);

describe('Synthesekatalog', () => {
  it('enthält mehr als tausend Synthesen', () => {
    expect(catalog.length).toBeGreaterThan(1000);
  });

  it('liefert sinnvolle Kennzahlen', () => {
    const stats = catalogStats(catalog);
    expect(stats.organic).toBeGreaterThan(500);
    expect(stats.inorganic).toBeGreaterThan(500);
    expect(stats.namedProducts).toBeGreaterThan(500);
    expect(stats.distinctProducts).toBeGreaterThan(300);
  });

  it('hat für jeden Eintrag Produkt, Edukte und Gleichung', () => {
    const broken = catalog.filter(
      (synthesis) =>
        !synthesis.product ||
        (!synthesis.educts.length && !synthesis.otherEducts.length) ||
        !synthesis.equation ||
        !synthesis.ruleName,
    );
    expect(broken.slice(0, 3)).toEqual([]);
  });

  it('kennt Wege zu bekannten Stoffen', () => {
    const ester = routesTo(catalog, 'essigsaeureethylester');
    expect(ester.length).toBeGreaterThan(0);
    expect(ester[0].educts.map((educt) => educt.id).sort()).toEqual(['essigsaeure', 'ethanol']);

    expect(routesTo(catalog, 'acetylsalicylsaeure').length).toBeGreaterThan(0);
    expect(routesTo(catalog, 'silberchlorid').length).toBeGreaterThan(0);
    expect(routesTo(catalog, 'aceton').length).toBeGreaterThan(0);
  });

  it('findet Reaktionen eines Stoffes als Edukt', () => {
    expect(reactionsFrom(catalog, 'ethanol').length).toBeGreaterThan(3);
    expect(reactionsFrom(catalog, 'zink').length).toBeGreaterThan(3);
  });

  it('durchsucht Produkte und Edukte', () => {
    expect(searchCatalog(catalog, 'Aspirin')[0].product).toBe('Acetylsalicylsäure');
    expect(searchCatalog(catalog, 'Bananenöl')[0].product).toBe('Isoamylacetat');
    expect(searchCatalog(catalog, 'Silberchlorid')[0].product).toBe('Silberchlorid');
    expect(searchCatalog(catalog, 'Veresterung').length).toBeGreaterThan(5);
  });

  it('filtert nach Kategorie', () => {
    const anorganisch = searchCatalog(catalog, '', { category: 'anorganisch' }, 5000);
    expect(anorganisch.length).toBeGreaterThan(500);
    expect(anorganisch.every((synthesis) => synthesis.category === 'anorganisch')).toBe(true);
  });

  it('gleicht anorganische Gleichungen aus', () => {
    const faellung = catalog.find(
      (synthesis) => synthesis.product === 'Silberchlorid' && synthesis.category === 'anorganisch',
    );
    expect(faellung?.equation).toContain('→');
    expect(faellung?.equation).toContain('AgCl');
  });
});
