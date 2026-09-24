/**
 * Massentest Synthesekatalog: 1500 gleichmäßig verteilte Einträge werden auf
 * gültige Edukte, Produkte, Vorschriften und ausgeglichene Gleichungen
 * geprüft. Anorganische Einträge müssen außerdem in der Werkbank wieder
 * auftauchen, wenn man ihre Edukte zusammengibt.
 */
import { beforeAll, describe, expect, it } from 'vitest';
import type { MainModule } from '@rdkit/rdkit';
import initRDKitModule from '@rdkit/rdkit';
import { parseFormula } from '../../chem/formula';
import { canonicalSmiles, molecularFormula } from '../../chem/rdkit';
import { isPublishableProduct } from '../../chem/safety';
import { mix, type WorkbenchConditions } from '../../chem/workbench';
import { loadCatalog, searchCatalog } from '../../data/catalog';
import { REACTION_BY_ID } from '../../data/reactions';
import { gleichungsFehler, stichprobe } from './hilfen';

let rdkit: MainModule;

beforeAll(async () => {
  rdkit = await initRDKitModule();
}, 60_000);

const catalog = await loadCatalog();
const auswahl = stichprobe(catalog, 1500);

/** Bedingungen, unter denen praktisch jede hinterlegte Reaktion vollständig abläuft. */
const BEDINGUNGEN: WorkbenchConditions[] = [
  { temperature: 'raum', catalysis: 'keine', aqueous: true, light: false, electrolysis: false },
  { temperature: 'heiss', catalysis: 'keine', aqueous: false, light: false, electrolysis: false },
  { temperature: 'heiss', catalysis: 'keine', aqueous: true, light: true, electrolysis: false },
];

/** Entfernt Anmerkungen wie «  (FeBr₃)» hinter der eigentlichen Gleichung. */
function ohneAnmerkung(equation: string): string {
  return equation.replace(/\s{2,}\(.*\)\s*$/, '');
}

function formelGleichung(equation: string): boolean {
  const sides = equation.split(/\s*→\s*/);
  return (
    sides.length === 2 &&
    sides.every((side) =>
      side.split(/\s\+\s/).every((term) => {
        const species = term.trim().replace(/^\d+\s+/, '');
        if (!/^[A-Z(\[]/.test(species) || /\s/.test(species)) return false;
        try {
          parseFormula(species);
          return true;
        } catch {
          return false;
        }
      }),
    )
  );
}

function stoffumsatz(equation: string): string {
  return equation
    .split(/\s*→\s*/)
    .map((side) => side.split(/\s\+\s/).map((term) => term.trim()).sort().join(' + '))
    .join(' → ');
}

let ausgeglichen = 0;
let inWerkbank = 0;

describe('Massentest Synthesekatalog', () => {
  it('prüft mindestens 1000 Einträge', () => {
    expect(catalog.length).toBeGreaterThan(6000);
    expect(auswahl.length).toBeGreaterThanOrEqual(1000);
  });

  it.each(auswahl.map((entry) => [entry.id, entry.product, entry] as const))('#%s %s', (_, __, entry) => {
    expect(entry.product.length).toBeGreaterThan(0);
    expect(entry.educts.length + entry.otherEducts.length).toBeGreaterThan(0);
    expect(entry.equation.length).toBeGreaterThan(0);
    if (entry.ruleId) expect(REACTION_BY_ID.has(entry.ruleId), entry.ruleId).toBe(true);

    if (entry.productSmiles) {
      const canonical = canonicalSmiles(rdkit, entry.productSmiles);
      expect(canonical, entry.productSmiles).not.toBeNull();
      expect(isPublishableProduct(entry.productSmiles, rdkit)).toBe(true);
      if (entry.productFormula) {
        const computed = molecularFormula(rdkit, entry.productSmiles)!;
        expect(parseFormula(computed).counts).toEqual(parseFormula(entry.productFormula).counts);
      }
    }

    // Edukte aus der Datenbank mit Struktur müssen gültig sein
    for (const educt of entry.educts) {
      if (educt.smiles) expect(canonicalSmiles(rdkit, educt.smiles), educt.name).not.toBeNull();
    }

    // Formelgleichungen sind ausgeglichen
    const gleichung = ohneAnmerkung(entry.equation);
    if (formelGleichung(gleichung)) {
      expect(gleichungsFehler(gleichung), entry.equation).toEqual([]);
      ausgeglichen++;
    }

    // die Suche nach dem Produkt findet den Eintrag
    expect(searchCatalog(catalog, entry.product, {}, catalog.length)).toContain(entry);

    // anorganische Paarreaktionen erkennt auch die Werkbank
    if (!entry.ruleId && entry.educts.length === 2 && !entry.otherEducts.length && formelGleichung(entry.equation)) {
      const wanted = stoffumsatz(entry.equation);
      const found = BEDINGUNGEN.some((conditions) =>
        mix(rdkit, entry.educts, conditions).reactions.some((reaction) => stoffumsatz(reaction.equation) === wanted),
      );
      expect(found, `Werkbank kennt ${entry.equation} nicht`).toBe(true);
      inWerkbank++;
    }
  });

  it('hat viele Gleichungen und Werkbank-Treffer geprüft', () => {
    expect(ausgeglichen).toBeGreaterThan(300);
    expect(inWerkbank).toBeGreaterThan(200);
  });
});
