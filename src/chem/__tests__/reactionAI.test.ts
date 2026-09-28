/** Reaktions-KI: Vorlagen, Hilfsstoffe, Netz, Aktivierungsenergie und Wissensbasis. */
import { beforeAll, describe, expect, it } from 'vitest';
import type { MainModule } from '@rdkit/rdkit';
import initRDKitModule from '@rdkit/rdkit';
import { formatDuration, halfLife, kinetics, maximumBarrier, requiredTemperature, speedUp } from '../ai/activation';
import { classifyAgent } from '../ai/agents';
import { classifyFamily, FAMILIES } from '../ai/families';
import { reactantBits } from '../ai/features';
import { parseMappedSmiles } from '../ai/mappedSmiles';
import { createNetwork, decodeNetwork, encodeNetwork, forward } from '../ai/network';
import { predictFromKnowledge } from '../ai/reactionAI';
import { extractTemplate } from '../ai/templates';
import { runReaction } from '../rdkit';
import { structureKey } from '../reactionKeys';
import { CATALYZED_PROCESSES, processesFor } from '../../data/catalysis';
import { substanceById } from '../../data/substances';
import type { Substance } from '../../data/types';

let rdkit: MainModule;

beforeAll(async () => {
  rdkit = await initRDKitModule();
}, 60_000);

function get(id: string): Substance {
  const substance = substanceById(id);
  if (!substance) throw new Error(`Stoff ${id} fehlt`);
  return substance;
}

describe('SMILES mit Atomzuordnung', () => {
  it('liest Atome, Ladungen, Wasserstoffe und Zuordnungsnummern', () => {
    const graph = parseMappedSmiles('[N+:1](=[O:2])([O-:3])[c:4]1[cH:5][cH:6][cH:7][cH:8][cH:9]1.[CH3:10][OH:11]');
    expect(graph.moleculeCount).toBe(2);
    const nitrogen = graph.atoms[0];
    expect(nitrogen).toMatchObject({ element: 'N', charge: 1, map: 1 });
    expect(graph.atoms[4]).toMatchObject({ element: 'C', aromatic: true, hydrogens: 1, map: 5 });
    expect(graph.atoms.find((atom) => atom.map === 10)?.hydrogens).toBe(3);
    expect(graph.atoms[3].neighbors.map(([, order]) => order).sort()).toEqual([1, 1.5, 1.5]);
  });

  it('berechnet implizite Wasserstoffe ohne Klammern', () => {
    const graph = parseMappedSmiles('CC(=O)O');
    expect(graph.atoms.map((atom) => atom.hydrogens)).toEqual([3, 0, 0, 1]);
  });
});

describe('Reaktionsvorlagen', () => {
  // Amidkupplung aus dem USPTO-Datensatz (gekürzt)
  const line =
    '[CH3:1][C:2](=[O:3])[OH:4].[NH2:5][CH2:6][c:7]1[cH:8][cH:9][cH:10][cH:11][cH:12]1.[CH2:13]([Cl:14])[Cl:15]>>[CH3:1][C:2](=[O:3])[NH:5][CH2:6][c:7]1[cH:8][cH:9][cH:10][cH:11][cH:12]1 2-4;2-5';

  it('schneidet das Reaktionszentrum heraus und trennt Hilfsstoffe ab', () => {
    const result = extractTemplate(line);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.template.reactants).toHaveLength(2);
    expect(result.template.agents).toEqual(['[CH2]([Cl])[Cl]']);
    expect(result.template.smarts).toContain('>>');
    expect(result.template.changes.some((change) => change.before === 0 && change.after === 1)).toBe(true);
  });

  it('reproduziert mit der Vorlage das Produkt', () => {
    const result = extractTemplate(line);
    if (!result.ok) throw new Error(result.reason);
    const reactants = result.template.reactants.map((smiles) => structureKey(rdkit, smiles) as string);
    const product = structureKey(rdkit, result.template.product);
    const sets = runReaction(rdkit, result.template.smarts, reactants);
    expect(sets.some((set) => set.some((smiles) => structureKey(rdkit, smiles) === product))).toBe(true);
  });

  it('wendet die Vorlage auch auf andere Säuren und Amine an', () => {
    const result = extractTemplate(line);
    if (!result.ok) throw new Error(result.reason);
    const sets = runReaction(rdkit, result.template.smarts, ['CCC(=O)O', 'NCCO']);
    expect(sets.flat().map((smiles) => structureKey(rdkit, smiles))).toContain(structureKey(rdkit, 'CCC(=O)NCCO'));
  });

  it('ordnet die Vorlage der Amidbildung zu', () => {
    const result = extractTemplate(line);
    if (!result.ok) throw new Error(result.reason);
    expect(classifyFamily(result.template.changes)).toBe('amid-saeure');
  });

  it('erkennt Suzuki-Kupplung und Hydrierung an den Bindungsänderungen', () => {
    expect(
      classifyFamily([
        { a: 'c', b: 'c', before: 0, after: 1, leaving: false },
        { a: 'c', b: 'B', before: 1, after: 0, leaving: true },
        { a: 'c', b: 'Br', before: 1, after: 0, leaving: true },
      ]),
    ).toBe('suzuki');
    expect(classifyFamily([{ a: 'C=C', b: 'C=C', before: 2, after: 1, leaving: false }])).toBe('hydrierung');
    expect(classifyFamily([{ a: 'N+O', b: 'O', before: 2, after: 0, leaving: true }])).toBe('nitro-reduktion');
  });

  it('hat für jede Familie plausible Aktivierungsenergien', () => {
    for (const family of FAMILIES) {
      expect(family.eaCatalyzed).toBeLessThanOrEqual(family.eaUncatalyzed);
      expect(family.eaCatalyzed).toBeGreaterThan(10);
      expect(family.eaUncatalyzed).toBeLessThan(500);
      if (family.requiresCatalyst) expect(family.catalysts.length).toBeGreaterThan(0);
    }
  });
});

describe('Hilfsstoffe', () => {
  it('ordnet Katalysatoren, Basen und Reagenzien ein', () => {
    expect(classifyAgent(rdkit, 'c1ccc([P](c2ccccc2)(c2ccccc2)[Pd]([P](c2ccccc2)(c2ccccc2)c2ccccc2)([P](c2ccccc2)(c2ccccc2)c2ccccc2)[P](c2ccccc2)(c2ccccc2)c2ccccc2)cc1')?.category).toBe('pd');
    expect(classifyAgent(rdkit, 'CCN(CC)CC')?.category).toBe('aminbase');
    expect(classifyAgent(rdkit, '[OH-]')?.category).toBe('anorganische-base');
    expect(classifyAgent(rdkit, '[K+].[K+].O=C([O-])[O-]')?.category).toBe('anorganische-base');
    expect(classifyAgent(rdkit, 'O=S(=O)(O)O')?.category).toBe('saeure');
    expect(classifyAgent(rdkit, '[Na+].[BH4-]')?.category).toBe('hydrid');
    expect(classifyAgent(rdkit, 'CN(C)C(On1nnc2cccnc21)=[N+](C)C')?.category).toBe('kupplungsreagenz');
    expect(classifyAgent(rdkit, 'C1CCOC1')?.category).toBe('loesungsmittel');
    expect(classifyAgent(rdkit, '[Na+]')).toBeNull();
  });
});

describe('Neuronales Netz', () => {
  it('liefert Wahrscheinlichkeiten und übersteht Speichern und Laden', () => {
    const net = createNetwork(2048, 8, 5, 3);
    for (const matrix of [net.w1, net.w2, net.w3]) for (let i = 0; i < matrix.length; i++) matrix[i] = Math.sin(i * 1.7) * 0.3;
    const bits = reactantBits(rdkit, ['CC(=O)O', 'NCc1ccccc1']);
    expect(bits && bits.length).toBeGreaterThan(10);
    const out = forward(net, bits as Uint16Array);
    expect(out.templates.reduce((sum, value) => sum + value, 0)).toBeCloseTo(1, 5);
    const copy = decodeNetwork(encodeNetwork(net));
    const again = forward(copy, bits as Uint16Array);
    for (let t = 0; t < 5; t++) expect(again.templates[t]).toBeCloseTo(out.templates[t], 1);
  });

  it('nutzt für gleiche Stoffe denselben Fingerabdruck', () => {
    expect(Array.from(reactantBits(rdkit, ['OCC']) as Uint16Array)).toEqual(Array.from(reactantBits(rdkit, ['CCO']) as Uint16Array));
  });
});

describe('Aktivierungsenergie', () => {
  it('rechnet nach Arrhenius', () => {
    // Bei 20 °C wird in einer Stunde etwa 80 kJ/mol überwunden, bei 100 °C gut 100 kJ/mol
    expect(maximumBarrier(20)).toBeGreaterThan(75);
    expect(maximumBarrier(20)).toBeLessThan(88);
    expect(maximumBarrier(100)).toBeGreaterThan(maximumBarrier(20));
    expect(requiredTemperature(maximumBarrier(150))).toBeCloseTo(150, 5);
    expect(halfLife(60, 20)).toBeLessThan(halfLife(100, 20));
    expect(kinetics(40, 20).speed).toBe('schnell');
    expect(kinetics(180, 20).speed).toBe('blockiert');
    // 10 kJ/mol weniger machen bei Raumtemperatur etwa 60-mal schneller
    expect(speedUp(80, 70, 25)).toBeGreaterThan(50);
    expect(speedUp(80, 70, 25)).toBeLessThan(70);
    expect(formatDuration(7200)).toBe('2 Stunden');
  });
});

describe('Katalyse-Wissensbasis', () => {
  it('verweist nur auf vorhandene Stoffe', () => {
    for (const process of CATALYZED_PROCESSES) {
      for (const slot of process.reactants) for (const id of slot) expect(substanceById(id), `${process.id}: ${id}`).toBeDefined();
      for (const option of process.catalysts) {
        for (const id of option.substanceIds) expect(substanceById(id), `${process.id}: ${id}`).toBeDefined();
        if (option.ea !== undefined && process.eaUncatalyzed !== undefined) expect(option.ea).toBeLessThan(process.eaUncatalyzed);
      }
    }
  });

  it('findet katalysierte Prozesse zu den Stoffen', () => {
    expect(processesFor(['stickstoff', 'wasserstoff']).map((process) => process.id)).toContain('haber-bosch');
    expect(processesFor(['kohlenstoffmonoxid', 'wasserstoff']).map((process) => process.id)).toEqual(['methanol-synthese', 'fischer-tropsch']);
    expect(processesFor(['stickstoff'])).toEqual([]);
  });

  it('erkennt den Katalysator im Gefäß und senkt die Barriere', () => {
    const [without] = predictFromKnowledge([get('wasserstoffperoxid')], { temperatureC: 20 });
    expect(without.energy?.catalystPresent).toBe(false);
    const [withMnO2] = predictFromKnowledge([get('wasserstoffperoxid'), get('mangandioxid')], { temperatureC: 20 });
    expect(withMnO2.energy?.catalystPresent).toBe(true);
    expect(withMnO2.energy?.eaCatalyzed).toBeLessThan(withMnO2.energy?.eaUncatalyzed as number);
    expect(withMnO2.catalysts.find((entry) => entry.present)?.label).toContain('Braunstein');
  });

  it('empfiehlt für Haber-Bosch den Eisenkatalysator', () => {
    const [haber] = predictFromKnowledge([get('stickstoff'), get('wasserstoff')], { temperatureC: 450 });
    expect(haber.energy?.catalystNeeded).toBe(true);
    expect(haber.catalysts[0].substanceIds).toContain('eisen');
    const [withIron] = predictFromKnowledge([get('stickstoff'), get('wasserstoff')], { temperatureC: 450, others: [get('eisen')] });
    expect(withIron.energy?.catalystPresent).toBe(true);
  });
});
