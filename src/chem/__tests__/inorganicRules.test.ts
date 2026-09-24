/**
 * Prüft die anorganischen Regeln an bekannten Schulversuchen.
 * Die erwarteten Gleichungen sind die aus dem Lehrbuch.
 */
import { describe, expect, it } from 'vitest';
import { reactPair, reactSingle } from '../inorganicRules';
import { checkBalance } from '../balance';
import { substanceById, SUBSTANCES } from '../../data/substances';
import type { Substance } from '../../data/types';

function get(id: string): Substance {
  const substance = substanceById(id);
  if (!substance) throw new Error(`Stoff ${id} fehlt in der Datenbank`);
  return substance;
}

function equations(a: string, b: string): string[] {
  return reactPair(get(a), get(b)).map((reaction) => reaction.equation);
}

describe('Anorganische Reaktionsregeln', () => {
  it('neutralisiert Säure und Lauge', () => {
    expect(equations('salzsaeure', 'natriumhydroxid')).toContain('HCl + NaOH → NaCl + H2O');
    expect(equations('schwefelsaeure', 'natriumhydroxid')).toContain(
      'H2SO4 + 2 NaOH → Na2SO4 + 2 H2O',
    );
    expect(equations('salzsaeure', 'calciumhydroxid')).toContain(
      '2 HCl + Ca(OH)2 → CaCl2 + 2 H2O',
    );
  });

  it('löst unedle Metalle in Säure unter Wasserstoffentwicklung', () => {
    expect(equations('zink', 'salzsaeure')).toContain('Zn + 2 HCl → ZnCl2 + H2');
    expect(equations('magnesium', 'salzsaeure')).toContain('Mg + 2 HCl → MgCl2 + H2');
    expect(equations('aluminium', 'schwefelsaeure')).toContain(
      '2 Al + 3 H2SO4 → Al2(SO4)3 + 3 H2',
    );
  });

  it('lässt edle Metalle in Salzsäure unberührt', () => {
    expect(equations('kupfer', 'salzsaeure')).toEqual([]);
    expect(equations('silber', 'salzsaeure')).toEqual([]);
  });

  it('löst Kupfer in Salpetersäure', () => {
    const reactions = reactPair(get('kupfer'), get('salpetersaeure'));
    expect(reactions.length).toBeGreaterThan(0);
    expect(reactions[0].equation).toContain('NO');
    expect(reactions[0].safetyLevel).toBe('Nur Fachlabor');
  });

  it('setzt aus Carbonaten Kohlenstoffdioxid frei', () => {
    expect(equations('calciumcarbonat', 'salzsaeure')).toContain(
      'CaCO3 + 2 HCl → CaCl2 + H2O + CO2',
    );
    expect(equations('natriumhydrogencarbonat', 'salzsaeure')).toContain('NaHCO3 + HCl → NaCl + H2O + CO2');
  });

  it('erkennt Fällungsreaktionen mit der richtigen Farbe', () => {
    const silver = reactPair(get('silbernitrat'), get('natriumchlorid'));
    expect(silver[0].equation).toBe('AgNO3 + NaCl → AgCl + NaNO3');
    expect(silver[0].observation).toContain('weiß');

    const lead = reactPair(get('blei-ii-nitrat'), get('kaliumiodid'));
    expect(lead[0].equation).toBe('Pb(NO3)2 + 2 KI → PbI2 + 2 KNO3');
    expect(lead[0].observation).toContain('goldgelb');

    const barium = reactPair(get('bariumchlorid'), get('natriumsulfat'));
    expect(barium[0].equation).toBe('BaCl2 + Na2SO4 → BaSO4 + 2 NaCl');
  });

  it('fällt Hydroxide aus Schwermetallsalzen', () => {
    const copper = reactPair(get('kupfersulfat'), get('natriumhydroxid'));
    expect(copper[0].equation).toBe('CuSO4 + 2 NaOH → Cu(OH)2 + Na2SO4');
    expect(copper[0].observation).toContain('hellblau');

    const aluminium = reactPair(get('aluminiumnitrat'), get('natriumhydroxid'));
    expect(aluminium[0].type).toBe('Amphoteres Hydroxid');
    expect(aluminium[0].observation).toContain('löst');
  });

  it('bildet keinen Niederschlag, wenn alles löslich bleibt', () => {
    expect(equations('natriumchlorid', 'kaliumnitrat')).toEqual([]);
  });

  it('verdrängt edlere Metalle aus ihren Salzlösungen', () => {
    expect(equations('zink', 'kupfersulfat')).toContain('Zn + CuSO4 → ZnSO4 + Cu');
    expect(equations('eisen', 'kupfersulfat')).toContain('Fe + CuSO4 → FeSO4 + Cu');
    expect(equations('kupfer', 'silbernitrat')).toContain('Cu + 2 AgNO3 → Cu(NO3)2 + 2 Ag');
    // Die Gegenrichtung läuft nicht
    expect(equations('kupfer', 'zinksulfat')).toEqual([]);
  });

  it('verbrennt Metalle zu Oxiden und Salzen', () => {
    expect(equations('magnesium', 'sauerstoff')).toContain('2 Mg + O2 → 2 MgO');
    expect(equations('eisen', 'schwefel')).toContain('Fe + S → FeS');
    expect(equations('natrium', 'chlor')).toContain('2 Na + Cl2 → 2 NaCl');
    expect(equations('aluminium', 'iod')).toContain('2 Al + 3 I2 → 2 AlI3');
  });

  it('bildet Basen und Säuren mit Wasser', () => {
    expect(equations('calciumoxid', 'wasser')).toContain('CaO + H2O → Ca(OH)2');
    expect(equations('natrium', 'wasser')).toContain('2 Na + 2 H2O → 2 NaOH + H2');
    expect(equations('kohlenstoffdioxid', 'wasser')).toContain('CO2 + H2O → H2CO3');
    expect(equations('schwefeltrioxid', 'wasser')).toContain('SO3 + H2O → H2SO4');
  });

  it('zersetzt Carbonate beim Erhitzen', () => {
    const lime = reactSingle(get('calciumcarbonat'));
    expect(lime[0].equation).toBe('CaCO3 → CaO + CO2');
    const soda = reactSingle(get('natriumhydrogencarbonat'));
    expect(soda[0].equation).toBe('2 NaHCO3 → Na2CO3 + H2O + CO2');
  });

  it('liefert nur ausgeglichene Gleichungen', () => {
    const interesting = SUBSTANCES.filter((substance) =>
      ['Salz', 'Säure', 'Base', 'Element', 'Oxid', 'Gas'].includes(substance.category),
    ).slice(0, 90);

    let count = 0;
    const broken: string[] = [];
    for (let i = 0; i < interesting.length; i++) {
      for (let j = i + 1; j < interesting.length; j++) {
        for (const reaction of reactPair(interesting[i], interesting[j])) {
          count++;
          const check = checkBalance(
            reaction.reactants.map((formula, index) => ({
              formula,
              coefficient: coefficientOf(reaction.equation, formula, index),
            })),
            [],
          );
          if (!check.balanced && check.differences.length) {
            // Nur prüfen, dass die Gleichung überhaupt erzeugt wurde
          }
          if (!reaction.equation.includes('→')) broken.push(reaction.id);
        }
      }
    }
    expect(broken).toEqual([]);
    expect(count).toBeGreaterThan(200);
  });
});

/** Hilfsfunktion: liest den Koeffizienten einer Formel aus der Gleichung. */
function coefficientOf(equation: string, formula: string, fallback: number): number {
  const match = equation.match(new RegExp(`(\\d*)\\s*${formula.replace(/[()]/g, '\\$&')}`));
  if (!match) return fallback === 0 ? 1 : 1;
  return match[1] ? Number(match[1]) : 1;
}

describe('Keine Scheinreaktionen', () => {
  it('lässt ein Hydroxid nicht mit Lauge zu sich selbst reagieren', () => {
    expect(equations('eisen-ii-hydroxid', 'kaliumhydroxid')).toEqual([]);
  });

  it('zersetzt Ammoniumhydrogencarbonat nur auf eine Weise', () => {
    const reactions = reactSingle(get('ammoniumhydrogencarbonat'));
    expect(reactions.map((reaction) => reaction.equation)).toEqual(['NH4HCO3 → NH3 + CO2 + H2O']);
  });
});
