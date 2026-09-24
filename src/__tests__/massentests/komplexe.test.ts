/**
 * Massentest Komplex-Werkbank: jedes Zentralion mit jedem Liganden in jeder
 * Anzahl von 1 bis 6 sowie 1000 zufällige Komplexe mit zwei Ligandsorten.
 * Geprüft werden Koordinationszahl, Ladung, Geometrie, Elektronenbesetzung,
 * Magnetismus, Ligandenfeld-Stabilisierung, Farbe und Name.
 */
import { describe, expect, it } from 'vitest';
import {
  CENTRAL_IONS,
  COMPLEX_PRESETS,
  CENTRAL_ION_BY_ID,
  LIGANDS,
  LIGAND_BY_ID,
  analyseComplex,
  competition,
  stabilityTable,
  type CentralIon,
  type LigandCount,
} from '../../chem/complexes';
import { ganzzahl, wahl, zufall } from './hilfen';

const ROMAN = ['0', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];

const einfach = CENTRAL_IONS.flatMap((metal) =>
  LIGANDS.flatMap((ligand) =>
    [1, 2, 3, 4, 5, 6].map((count) => ({ metal, ligands: [{ ligand, count }] })),
  ),
);

const random = zufall(1893); // Werner, Koordinationstheorie
const gemischt = Array.from({ length: 1000 }, () => {
  const metal = wahl(random, CENTRAL_IONS);
  const first = wahl(random, LIGANDS);
  const second = wahl(random, LIGANDS.filter((ligand) => ligand.id !== first.id));
  return {
    metal,
    ligands: [
      { ligand: first, count: ganzzahl(random, 1, 4) },
      { ligand: second, count: ganzzahl(random, 1, 4) },
    ],
  };
});

function chargeSuffix(charge: number): string {
  if (charge === 0) return '';
  return `${Math.abs(charge) === 1 ? '' : Math.abs(charge)}${charge > 0 ? '+' : '-'}`;
}

function pruefe(metal: CentralIon, ligands: LigandCount[]): void {
  const result = analyseComplex(metal, ligands);
  const cn = ligands.reduce((sum, entry) => sum + entry.count * entry.ligand.denticity, 0);
  const charge = metal.charge + ligands.reduce((sum, entry) => sum + entry.count * entry.ligand.charge, 0);

  expect(result.coordinationNumber).toBe(cn);
  expect(result.charge).toBe(charge);
  expect(result.oxidationState).toBe(metal.charge);
  expect(result.dElectrons).toBe(metal.d);

  // Gültigkeit: KZ 2, 4, 5, 6 ja; 1, 3 und über 6 nein
  expect(result.valid).toBe([2, 4, 5, 6].includes(cn));
  if (!result.valid) expect(result.problems.length).toBeGreaterThan(0);

  // Formel und Name
  expect(result.formula.startsWith(`[${metal.symbol}`)).toBe(true);
  expect(result.formula.endsWith(`]${chargeSuffix(charge)}`)).toBe(true);
  expect(result.name).toContain(`(${ROMAN[metal.charge]})`);
  expect(result.name.endsWith('-Ion')).toBe(charge !== 0);
  if (charge < 0) expect(result.name).toContain(`${metal.stem.toLowerCase()}at(`);
  else expect(result.name.toLowerCase()).toContain(metal.element.toLowerCase());
  expect(result.name.charAt(0)).toBe(result.name.charAt(0).toUpperCase());

  // Geometrie aus der Koordinationszahl
  if (cn === 2) expect(result.geometry).toBe('linear');
  if (cn === 4) expect(['tetraedrisch', 'quadratisch-planar']).toContain(result.geometry);
  if (cn === 5) expect(result.geometry).toBe('trigonal-bipyramidal');
  if (cn === 6) expect(result.geometry).toBe('oktaedrisch');

  // Elektronenbesetzung: fünf d-Orbitale, höchstens zwei Elektronen je Orbital
  const occupancy = result.levels.flatMap((level) => level.occupancy);
  expect(occupancy).toHaveLength(5);
  expect(result.levels.reduce((sum, level) => sum + level.orbitals, 0)).toBe(5);
  for (const n of occupancy) expect([0, 1, 2]).toContain(n);
  expect(occupancy.reduce((a, b) => a + b, 0)).toBe(metal.d);
  // Aufbauprinzip: kein Orbital doppelt besetzt, solange ein tieferes leer ist
  const energies = result.levels.flatMap((level) => level.occupancy.map(() => level.energy));
  occupancy.forEach((n, i) => {
    if (n === 2) occupancy.forEach((m, j) => { if (energies[j] < energies[i]) expect(m).toBeGreaterThan(0); });
  });

  const unpaired = occupancy.filter((n) => n === 1).length;
  expect(result.unpaired).toBe(unpaired);
  expect(result.magneticMoment).toBeCloseTo(Math.sqrt(unpaired * (unpaired + 2)), 2);
  expect(result.magnetism).toBe(unpaired ? 'paramagnetisch' : 'diamagnetisch');

  // Spin: nur oktaedrisch d4–d7 hat die Wahl; die Zahl ungepaarter Elektronen folgt daraus
  if (result.geometry === 'oktaedrisch' && metal.d >= 4 && metal.d <= 7) {
    const high = [0, 0, 0, 0, 4, 5, 4, 3][metal.d];
    const low = [0, 0, 0, 0, 2, 1, 0, 1][metal.d];
    expect(['high-spin', 'low-spin']).toContain(result.spin);
    expect(unpaired).toBe(result.spin === 'high-spin' ? high : low);
  } else {
    expect(result.spin).toBe('keine Wahl');
  }

  // LFSE in Einheiten von Δ
  if (result.geometry === 'oktaedrisch') {
    const [t2g, eg] = result.levels.map((level) => level.occupancy.reduce((a, b) => a + b, 0));
    expect(result.lfse).toBeCloseTo(-0.4 * t2g + 0.6 * eg, 6);
    expect(result.lfse!).toBeGreaterThanOrEqual(-2.4);
    expect(result.lfse!).toBeLessThanOrEqual(0);
  }

  // Farbe: d0 und d10 sind farblos, sonst folgt die Wellenlänge aus Δ
  if (metal.d === 0 || metal.d === 10) expect(result.colorSource).toBe('d0/d10');
  if (result.delta) {
    expect(result.delta).toBeGreaterThan(0);
    expect(result.absorbedNm).toBe(Math.round(1e7 / result.delta));
  }
  expect(result.color.length).toBeGreaterThan(0);

  expect(result.chelate).toBe(ligands.some((entry) => entry.ligand.denticity > 1));
  if (result.logBeta !== undefined) expect(result.logBeta).toBeGreaterThan(0);
  for (const isomer of result.isomers) expect(isomer.count).toBeGreaterThanOrEqual(2);
}

describe('Massentest Komplex-Werkbank', () => {
  it('hat mindestens 1000 Fälle', () => {
    expect(einfach.length + gemischt.length).toBeGreaterThanOrEqual(1000);
  });

  it.each(einfach.map((entry) => [entry.metal.id, entry.ligands[0].ligand.id, entry.ligands[0].count, entry] as const))(
    '%s mit %s × %i',
    (_, __, ___, entry) => pruefe(entry.metal, entry.ligands),
  );

  it.each(
    gemischt.map((entry, index) => [
      index + 1,
      `${entry.metal.id}: ${entry.ligands.map((l) => `${l.ligand.id}×${l.count}`).join(', ')}`,
      entry,
    ] as const),
  )('gemischt #%i %s', (_, __, entry) => pruefe(entry.metal, entry.ligands));

  it.each(COMPLEX_PRESETS.map((preset) => [preset.label, preset] as const))('Vorlage %s', (_, preset) => {
    const metal = CENTRAL_ION_BY_ID.get(preset.metal)!;
    const ligands = preset.ligands.map(([id, count]) => ({ ligand: LIGAND_BY_ID.get(id)!, count }));
    const result = analyseComplex(metal, ligands);
    expect(result.valid).toBe(true);
    expect(result.colorSource === 'gemessen' || result.colorSource === 'd0/d10').toBe(true);
  });

  it.each(CENTRAL_IONS.map((metal) => [metal.id] as const))('Stabilitätstabelle %s', (id) => {
    const table = stabilityTable(id);
    for (let i = 1; i < table.length; i++) expect(table[i - 1].logBeta).toBeGreaterThanOrEqual(table[i].logBeta);
    expect(typeof competition).toBe('function');
  });
});
