/**
 * Massentest Elektrochemie: Nernst-Gleichung, Zellspannung mit ΔG und K,
 * Faradaysche Gesetze und Wasserstoffelektrode an 1000 zufälligen Fällen
 * sowie an allen Paaren der Spannungsreihe.
 */
import { describe, expect, it } from 'vitest';
import {
  FARADAY,
  GAS_CONSTANT,
  electrolysisTime,
  evaluateCell,
  faradayElectrolysis,
  hydrogenElectrodePotential,
  nernstPotential,
  nernstSlope,
  specificEnergyDemand,
} from '../../chem/electro';
import { STANDARD_POTENTIALS } from '../../data/potentials';
import { ganzzahl, relativeAbweichung, wahl, zahl, zufall } from './hilfen';

const random = zufall(96485);

const faelle = Array.from({ length: 1000 }, (_, index) => ({
  index: index + 1,
  e0: zahl(random, -3, 3),
  z: ganzzahl(random, 1, 8),
  q: 10 ** zahl(random, -8, 8),
  temperature: zahl(random, 250, 400),
  cathode: wahl(random, STANDARD_POTENTIALS),
  anode: wahl(random, STANDARD_POTENTIALS),
  current: zahl(random, 0.01, 100),
  time: zahl(random, 1, 100000),
  molarMass: zahl(random, 1, 300),
  efficiency: zahl(random, 0.3, 1),
  pH: zahl(random, 0, 14),
  voltage: zahl(random, 0.5, 6),
}));

const paare = STANDARD_POTENTIALS.flatMap((cathode) =>
  STANDARD_POTENTIALS.map((anode) => ({ cathode, anode })),
);

describe('Massentest Elektrochemie', () => {
  it('hat mindestens 1000 Fälle', () => {
    expect(faelle.length + paare.length).toBeGreaterThanOrEqual(1000);
  });

  it.each(faelle.map((fall) => [fall.index, fall] as const))('Fall #%i', (_, fall) => {
    const slope = nernstSlope(fall.temperature);
    expect(slope).toBeCloseTo((GAS_CONSTANT * fall.temperature * Math.LN10) / FARADAY, 12);

    // bei Q = 1 gilt E = E°, je Zehnerpotenz ändert sich E um slope/z
    const input = { standardPotential: fall.e0, electrons: fall.z, temperature: fall.temperature };
    expect(nernstPotential({ ...input, quotient: 1 })).toBeCloseTo(fall.e0, 12);
    const e = nernstPotential({ ...input, quotient: fall.q });
    const e10 = nernstPotential({ ...input, quotient: fall.q * 10 });
    expect(e10 - e).toBeCloseTo(slope / fall.z, 9);
    expect(e - fall.e0).toBeCloseTo((slope / fall.z) * Math.log10(fall.q), 9);

    // Wasserstoffelektrode: 0 V bei pH 0, linear fallend
    expect(hydrogenElectrodePotential(0, fall.temperature)).toBeCloseTo(0, 12);
    expect(hydrogenElectrodePotential(fall.pH, fall.temperature)).toBeCloseTo(-slope * fall.pH, 12);

    // Faraday hin und zurück
    const result = faradayElectrolysis({
      current: fall.current,
      time: fall.time,
      electrons: fall.z,
      molarMass: fall.molarMass,
      efficiency: fall.efficiency,
    });
    expect(result.charge).toBeCloseTo(fall.current * fall.time, 6);
    expect(relativeAbweichung(result.amount * fall.z * FARADAY, result.charge * fall.efficiency)).toBeLessThan(1e-12);
    expect(relativeAbweichung(result.gasVolumeSTP, result.amount * 22.414)).toBeLessThan(1e-12);
    const time = electrolysisTime(result.mass, fall.molarMass, fall.z, fall.current, fall.efficiency);
    expect(relativeAbweichung(time, fall.time)).toBeLessThan(1e-9);

    // Energiebedarf wächst mit der Spannung linear
    const energy = specificEnergyDemand(fall.voltage, fall.z, fall.molarMass, fall.efficiency);
    expect(energy).toBeGreaterThan(0);
    expect(relativeAbweichung(specificEnergyDemand(2 * fall.voltage, fall.z, fall.molarMass, fall.efficiency), 2 * energy)).toBeLessThan(1e-12);
  });

  it.each(paare.map((paar) => [`${paar.cathode.oxidized}/${paar.cathode.reduced} ‖ ${paar.anode.oxidized}/${paar.anode.reduced}`, paar] as const))(
    '%s',
    (_, { cathode, anode }) => {
      const z = cathode.electrons * anode.electrons;
      const cell = evaluateCell(cathode.potential, anode.potential, z);
      expect(cell.cellPotential).toBeCloseTo(cathode.potential - anode.potential, 12);
      expect(cell.spontaneous).toBe(cell.cellPotential > 0);
      // ΔG = −zFE: Vorzeichen stets entgegengesetzt zur Zellspannung
      expect(cell.gibbsEnergy).toBeCloseTo((-z * FARADAY * cell.cellPotential) / 1000, 9);
      if (cell.cellPotential !== 0) expect(Math.sign(cell.gibbsEnergy)).toBe(-Math.sign(cell.cellPotential));
      // K > 1 genau dann, wenn die Zelle freiwillig läuft
      if (cell.cellPotential > 0) expect(cell.equilibriumConstant).toBeGreaterThan(1);
      if (cell.cellPotential < 0) expect(cell.equilibriumConstant).toBeLessThan(1);
      // nur im normalen Zahlenbereich vergleichen – subnormale Werte verlieren Stellen
      if (Number.isFinite(cell.equilibriumConstant) && cell.equilibriumConstant > 1e-300) {
        const lnK = Math.log(cell.equilibriumConstant);
        expect(relativeAbweichung(-GAS_CONSTANT * 298.15 * lnK / 1000, cell.gibbsEnergy)).toBeLessThan(1e-6);
      }
      // Vertauschen kehrt alles um
      const reversed = evaluateCell(anode.potential, cathode.potential, z);
      expect(reversed.cellPotential).toBeCloseTo(-cell.cellPotential, 12);
    },
  );
});
