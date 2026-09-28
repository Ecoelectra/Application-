/** Reaktionsenthalpie nach Hess: Tabellenwerte, Ionen in Lösung, Joback-Schätzung. */
import { beforeAll, describe, expect, it } from 'vitest';
import type { MainModule } from '@rdkit/rdkit';
import initRDKitModule from '@rdkit/rdkit';
import {
  asciiSpecies,
  describeEnthalpy,
  dissolutionEnthalpy,
  enthalpyFromStructures,
  enthalpyOfEquation,
  formationEnthalpy,
  jobackFormation,
  parseEnthalpyEquation,
} from '../thermo';
import { ORGANIC_ENTHALPIES } from '../../data/thermoData';
import { REACTIONS } from '../../data/reactions';
import { substanceById } from '../../data/substances';
import type { Substance } from '../../data/types';
import { DEFAULT_CONDITIONS, mix } from '../workbench';

let rdkit: MainModule;

beforeAll(async () => {
  rdkit = await initRDKitModule();
}, 60_000);

function deltaH(equation: string, aqueous = false): number {
  const result = enthalpyOfEquation(rdkit, equation, { aqueous });
  if (!result || !result.ok) throw new Error(`keine Enthalpie für ${equation}: ${JSON.stringify(result)}`);
  return result.enthalpy.deltaH;
}

describe('Schreibweisen', () => {
  it('wandelt Hoch- und Tiefstellungen um', () => {
    expect(asciiSpecies('SO₄²⁻')).toBe('SO4^2-');
    expect(asciiSpecies('Cu²⁺')).toBe('Cu^2+');
    expect(asciiSpecies('Cu2+')).toBe('Cu^2+');
    expect(asciiSpecies('NO3-')).toBe('NO3^-');
    expect(asciiSpecies('H₂O')).toBe('H2O');
  });

  it('liest Koeffizienten und Zustände', () => {
    const parsed = parseEnthalpyEquation('2 H₂(g) + O₂(g) → 2 H₂O(l)');
    expect(parsed?.left).toEqual([
      { coefficient: 2, formula: 'H2', phase: 'g' },
      { coefficient: 1, formula: 'O2', phase: 'g' },
    ]);
    expect(parsed?.right[0]).toEqual({ coefficient: 2, formula: 'H2O', phase: 'l' });
  });

  it('lehnt allgemeine Gleichungen ab', () => {
    expect(parseEnthalpyEquation('R–COOH + R′–OH → R–COO–R′ + H₂O')).toBeNull();
  });
});

describe('Reaktionsenthalpie aus Gleichungen', () => {
  it('Verbrennung von Methan: −890 kJ/mol', () => {
    expect(deltaH('CH4 + 2 O2 → CO2 + 2 H2O')).toBeCloseTo(-890.3, 0);
  });

  it('Knallgas: 2 × −285,8 kJ', () => {
    expect(deltaH('2 H2 + O2 → 2 H2O')).toBeCloseTo(-571.6, 1);
    expect(deltaH('2 H2(g) + O2(g) → 2 H2O(g)')).toBeCloseTo(-483.6, 1);
  });

  it('Haber-Bosch: −91,8 kJ', () => {
    expect(deltaH('N₂ + 3 H₂ ⇌ 2 NH₃')).toBeCloseTo(-91.8, 1);
  });

  it('Kalkbrennen: +179,2 kJ (endotherm)', () => {
    const result = enthalpyOfEquation(rdkit, 'CaCO₃ → CaO + CO₂');
    expect(result?.ok && result.enthalpy.deltaH).toBeCloseTo(179.2, 1);
    if (result?.ok) expect(describeEnthalpy(result.enthalpy)).toContain('endotherm');
  });

  it('gleicht unausgeglichene Gleichungen selbst aus', () => {
    expect(deltaH('H2 + O2 → H2O')).toBeCloseTo(-571.6, 1);
  });

  it('Umkehrung hat das umgekehrte Vorzeichen', () => {
    expect(deltaH('2 NH3 → N2 + 3 H2')).toBeCloseTo(91.8, 1);
  });

  it('Thermit: stark exotherm', () => {
    expect(deltaH('Fe2O3 + 2 Al → Al2O3 + 2 Fe')).toBeCloseTo(-851.5, 1);
  });

  it('Verbrennung von Ethanol: −1366,8 kJ/mol', () => {
    expect(deltaH('C2H6O + 3 O2 → 2 CO2 + 3 H2O')).toBeCloseTo(-1366.8, 0);
  });
});

describe('Ionen in Lösung', () => {
  it('Neutralisation: immer −55,8 kJ/mol', () => {
    expect(deltaH('HCl + NaOH → NaCl + H2O', true)).toBeCloseTo(-55.8, 1);
    expect(deltaH('HNO3 + KOH → KNO3 + H2O', true)).toBeCloseTo(-55.8, 1);
    expect(deltaH('H⁺ + OH⁻ → H₂O')).toBeCloseTo(-55.8, 1);
  });

  it('Fällung von Silberchlorid: −65,5 kJ/mol', () => {
    expect(deltaH('Ag⁺ + Cl⁻ → AgCl↓')).toBeCloseTo(-65.4, 0);
    expect(deltaH('AgNO3 + NaCl → AgCl + NaNO3', true)).toBeCloseTo(-65.4, 0);
  });

  it('Metall verdrängt Kupfer: Zn + Cu²⁺ → Zn²⁺ + Cu', () => {
    expect(deltaH('Zn + Cu²⁺ → Zn²⁺ + Cu')).toBeCloseTo(-218.7, 1);
  });

  it('Lösungsenthalpien', () => {
    expect(dissolutionEnthalpy('NaOH')?.deltaH).toBeCloseTo(-44.5, 1);
    expect(dissolutionEnthalpy('NH4NO3')?.deltaH).toBeCloseTo(28.1, 1);
    expect(dissolutionEnthalpy('NaCl')?.deltaH).toBeCloseTo(3.9, 1);
    const nitrate = dissolutionEnthalpy('NH4NO3');
    expect(nitrate && describeEnthalpy(nitrate)).toContain('kühlt ab');
  });
});

describe('Organische Reaktionen', () => {
  it('Veresterung: nahezu thermoneutral', () => {
    const result = enthalpyFromStructures(rdkit, [{ formula: '', smiles: 'CC(=O)O' }, { formula: '', smiles: 'CCO' }], [{ formula: '', smiles: 'CCOC(C)=O' }]);
    expect(result?.ok).toBe(true);
    if (result?.ok) {
      expect(result.enthalpy.deltaH).toBeCloseTo(-3.2, 1);
      expect(result.enthalpy.terms.some((term) => term.formula === 'H2O' && term.side === 'produkt')).toBe(true);
    }
  });

  it('Hydrierung von Cyclohexen: −118 kJ/mol', () => {
    const result = enthalpyFromStructures(rdkit, [{ formula: '', smiles: 'C1=CCCCC1' }, { formula: 'H2' }], [{ formula: '', smiles: 'C1CCCCC1' }]);
    expect(result?.ok && result.enthalpy.deltaH).toBeCloseTo(-117.9, 1);
  });

  it('ergänzt formal Wasserstoff für Reduktionen', () => {
    const result = enthalpyFromStructures(rdkit, [{ formula: '', smiles: 'CC(C)=O' }], [{ formula: '', smiles: 'CC(C)O' }]);
    expect(result?.ok).toBe(true);
    if (result?.ok) {
      expect(result.enthalpy.note).toContain('Wasserstoff');
      expect(result.enthalpy.deltaH).toBeCloseTo(-69.7, 1);
    }
  });

  it('schätzt unbekannte Stoffe nach Joback', () => {
    const result = enthalpyFromStructures(rdkit, [{ formula: '', smiles: 'CCCCCCCCO' }, { formula: '', smiles: 'CC(=O)O' }], [{ formula: '', smiles: 'CCCCCCCCOC(C)=O' }]);
    expect(result?.ok).toBe(true);
    if (result?.ok) {
      expect(result.enthalpy.estimated).toBe(true);
      expect(Math.abs(result.enthalpy.deltaH)).toBeLessThan(60);
    }
  });

  it('Joback trifft Tabellenwerte im Mittel auf etwa 25 kJ/mol', () => {
    const errors: number[] = [];
    for (const entry of ORGANIC_ENTHALPIES) {
      if (entry.phase === 'aq') continue;
      const estimate = jobackFormation(rdkit, entry.key);
      if (!estimate || estimate.phase !== entry.phase) continue;
      errors.push(Math.abs(estimate.value - entry.value));
    }
    expect(errors.length).toBeGreaterThan(40);
    const mean = errors.reduce((sum, value) => sum + value, 0) / errors.length;
    expect(mean).toBeLessThan(25);
  });

  it('erkennt Stoffe über Hinweise aus dem Gefäß', () => {
    const resolved = formationEnthalpy(rdkit, { formula: 'C2H6O' }, { hints: [{ formula: 'C2H6O', smiles: 'COC' }] });
    expect(resolved?.value).toBeCloseTo(-184.1, 1);
    expect(formationEnthalpy(rdkit, { formula: 'C2H6O' })?.value).toBeCloseTo(-277.6, 1);
  });
});

describe('Formale Oxidations- und Reduktionsmittel', () => {
  it('Oxidation eines Alkohols wird formal mit O2 gerechnet, nicht als Dehydrierung', () => {
    const result = enthalpyFromStructures(rdkit, [{ formula: '', smiles: 'CC(O)c1ccccc1' }], [{ formula: '', smiles: 'CC(=O)c1ccccc1' }]);
    expect(result?.ok).toBe(true);
    if (result?.ok) {
      expect(result.enthalpy.equation).toContain('O2');
      expect(result.enthalpy.note).toContain('Sauerstoff');
      expect(result.enthalpy.deltaH).toBeLessThan(-150);
    }
  });

  it('Aldol-Kondensation: zwei gleiche Edukte, Wasser als Nebenprodukt', () => {
    const result = enthalpyFromStructures(rdkit, [{ formula: '', smiles: 'CC=O' }, { formula: '', smiles: 'CC=O' }], [{ formula: '', smiles: 'CC=CC=O' }]);
    expect(result?.ok && result.enthalpy.equation).toMatch(/^2 C2H4O\(l\) → C4H6O\(l\) \+ H2O\(l\)$/);
  });

  it('Metathese: Ethen als Nebenprodukt nur bei endständigen Alkenen', () => {
    const result = enthalpyFromStructures(rdkit, [{ formula: '', smiles: 'C=CCCCC' }], [{ formula: '', smiles: 'CCCCC=CCCCC' }]);
    expect(result?.ok && result.enthalpy.equation).toContain('C2H4');
  });

  it('Säure als Katalysator wird weggelassen, wenn die Gleichung sonst nicht aufgeht', () => {
    const result = enthalpyFromStructures(rdkit, [{ formula: '', smiles: 'CC(=O)Nc1ccccc1' }, { formula: 'HCl' }], [{ formula: '', smiles: 'CC(=O)O' }, { formula: '', smiles: 'Nc1ccccc1' }]);
    expect(result?.ok && result.enthalpy.equation).toBe('C8H9NO(s) + H2O(l) → C2H4O2(l) + C6H7N(l)');
  });
});

describe('Ionen und Komplexe', () => {
  it('organische Ionen werden aus dem neutralen Stoff geschätzt', () => {
    // Benzoesäure + Ammoniak (gelöst): Carboxylat ≈ Säure, Ammonium −52,2
    const result = enthalpyOfEquation(rdkit, 'C7H6O2 + NH3 → C7H5O2⁻ + NH4⁺', { aqueous: true, hints: [{ formula: 'C7H6O2', smiles: 'OC(=O)c1ccccc1' }] });
    expect(result?.ok && result.enthalpy.deltaH).toBeCloseTo(-52.2, 0);
  });

  it('Aqua-Komplexe: hydratisiertes Ion plus Wasser', () => {
    const resolved = formationEnthalpy(rdkit, { formula: '[Cu(H2O)6]^2+' });
    expect(resolved?.value).toBeCloseTo(64.8 + 6 * -285.8, 1);
  });

  it('Tetraamminkupfer(II): Komplexbildung ist exotherm', () => {
    expect(deltaH('[Cu(H2O)6]²⁺ + 4 NH3 → [Cu(NH3)4]²⁺ + 6 H2O', true)).toBeLessThan(0);
  });

  it('OAc wird als Acetat gelesen, nicht als Actinium', () => {
    expect(parseEnthalpyEquation('Pb(OAc)2 → Pb²⁺ + 2 OAc⁻')?.right[1].formula).toBe('CH3COO^-');
  });
});

describe('Reaktionsenthalpie in der App', () => {
  function get(id: string): Substance {
    const substance = substanceById(id);
    if (!substance) throw new Error(`Stoff ${id} fehlt`);
    return substance;
  }

  it('Werkbank: Neutralisation in Wasser mit −55,8 kJ/mol', () => {
    const result = mix(rdkit, [get('salzsaeure'), get('natriumhydroxid')], DEFAULT_CONDITIONS);
    const reaction = result.reactions.find((entry) => entry.enthalpy);
    expect(reaction?.enthalpy?.deltaH).toBeCloseTo(-55.8, 1);
  });

  it('Werkbank: Lösungsenthalpie beim Lösen von Ammoniumnitrat', () => {
    const result = mix(rdkit, [get('ammoniumnitrat'), get('wasser')], DEFAULT_CONDITIONS);
    const entry = [...result.reactions, ...(result.pairOutcomes ?? [])].find((reaction) => reaction.enthalpy?.kind === 'Lösungsenthalpie');
    expect(entry?.enthalpy?.deltaH).toBeCloseTo(28.1, 1);
  });

  it('Werkbank: Veresterung bekommt eine Enthalpie', () => {
    const result = mix(rdkit, [get('essigsaeure'), get('ethanol')], { ...DEFAULT_CONDITIONS, catalysis: 'sauer', temperature: 'heiss', aqueous: false });
    const ester = result.reactions.find((reaction) => reaction.products.some((product) => product.smiles === 'CCOC(C)=O'));
    expect(ester?.enthalpy).toBeTruthy();
    expect(Math.abs(ester?.enthalpy?.deltaH ?? 99)).toBeLessThan(20);
  });

  it('Reaktionsdatenbank: mindestens 70 von 96 Reaktionen haben ΔrH°', () => {
    let count = 0;
    for (const rule of REACTIONS) {
      let ok = false;
      if (rule.fixedEquation) ok = Boolean(enthalpyOfEquation(rdkit, rule.fixedEquation.balanced)?.ok);
      if (!ok && rule.example?.rxnSmiles) {
        const [left, , right] = rule.example.rxnSmiles.split('>');
        const species = (part: string) => part.split('.').filter(Boolean).map((smiles) => ({ formula: '', smiles }));
        ok = Boolean(enthalpyFromStructures(rdkit, species(left), species(right))?.ok);
      }
      if (ok) count++;
    }
    expect(count).toBeGreaterThanOrEqual(70);
  });
});
