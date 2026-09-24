/** Prüft das Komplexmodul an Komplexen, deren Eigenschaften im Lehrbuch stehen. */
import { describe, expect, it } from 'vitest';
import {
  analyseComplex,
  competition,
  CENTRAL_ION_BY_ID,
  COMPLEX_PRESETS,
  LIGAND_BY_ID,
  type LigandCount,
} from '../complexes';

function build(metal: string, ligands: Array<[string, number]>) {
  const center = CENTRAL_ION_BY_ID.get(metal);
  if (!center) throw new Error(`Zentralion ${metal} fehlt`);
  const list: LigandCount[] = ligands.map(([id, count]) => {
    const ligand = LIGAND_BY_ID.get(id);
    if (!ligand) throw new Error(`Ligand ${id} fehlt`);
    return { ligand, count };
  });
  return analyseComplex(center, list);
}

describe('Komplexchemie', () => {
  it('beschreibt den Tetraamminkupfer-Komplex', () => {
    const complex = build('cu2', [['nh3', 4], ['h2o', 2]]);
    expect(complex.formula).toBe('[Cu(NH3)4(H2O)2]2+');
    expect(complex.name).toBe('Tetraammindiaquakupfer(II)-Ion');
    expect(complex.coordinationNumber).toBe(6);
    expect(complex.geometry).toBe('oktaedrisch');
    expect(complex.unpaired).toBe(1);
    expect(complex.magneticMoment).toBe(1.73);
    expect(complex.color).toBe('tiefblau');
    expect(complex.logBeta).toBe(13.1);
    expect(complex.formation).toBe('[Cu(H₂O)₆]²⁺ + 4 NH₃ ⇌ [Cu(NH₃)₄(H₂O)₂]²⁺ + 4 H₂O');
  });

  it('unterscheidet High- und Low-Spin bei Eisen(II)', () => {
    const aqua = build('fe2', [['h2o', 6]]);
    expect(aqua.spin).toBe('high-spin');
    expect(aqua.unpaired).toBe(4);
    expect(aqua.magneticMoment).toBe(4.9);

    const cyanido = build('fe2', [['cn', 6]]);
    expect(cyanido.name).toBe('Hexacyanidoferrat(II)-Ion');
    expect(cyanido.charge).toBe(-4);
    expect(cyanido.spin).toBe('low-spin');
    expect(cyanido.unpaired).toBe(0);
    expect(cyanido.magnetism).toBe('diamagnetisch');
    expect(cyanido.lfse).toBe(-2.4);
  });

  it('hat beim Low-Spin-Eisen(III) ein ungepaartes Elektron', () => {
    const complex = build('fe3', [['cn', 6]]);
    expect(complex.unpaired).toBe(1);
    expect(complex.charge).toBe(-3);
  });

  it('erkennt Cobalt(III) als fast immer Low-Spin – außer mit Fluorid', () => {
    expect(build('co3', [['nh3', 6]]).unpaired).toBe(0);
    expect(build('co3', [['f', 6]]).unpaired).toBe(4);
  });

  it('bestimmt die Geometrie der Vierer-Komplexe', () => {
    const chlorido = build('co2', [['cl', 4]]);
    expect(chlorido.geometry).toBe('tetraedrisch');
    expect(chlorido.unpaired).toBe(3);
    expect(chlorido.name).toBe('Tetrachloridocobaltat(II)-Ion');
    expect(chlorido.color).toBe('blau');

    const nickelCyanido = build('ni2', [['cn', 4]]);
    expect(nickelCyanido.geometry).toBe('quadratisch-planar');
    expect(nickelCyanido.unpaired).toBe(0);

    const nickelChlorido = build('ni2', [['cl', 4]]);
    expect(nickelChlorido.geometry).toBe('tetraedrisch');
    expect(nickelChlorido.unpaired).toBe(2);

    expect(build('zn2', [['nh3', 4]]).geometry).toBe('tetraedrisch');
  });

  it('beschreibt Cisplatin mit cis/trans-Isomerie', () => {
    const complex = build('pt2', [['nh3', 2], ['cl', 2]]);
    expect(complex.name).toBe('Diammindichloridoplatin(II)');
    expect(complex.charge).toBe(0);
    expect(complex.geometry).toBe('quadratisch-planar');
    expect(complex.isomers[0].kind).toBe('cis/trans-Isomerie');
  });

  it('erkennt Spiegelbildisomerie bei drei Chelatliganden', () => {
    const complex = build('co3', [['en', 3]]);
    expect(complex.name).toBe('Tris(ethylendiamin)cobalt(III)-Ion');
    expect(complex.formula).toBe('[Co(en)3]3+');
    expect(complex.isomers[0].kind).toBe('Spiegelbildisomerie');
    expect(complex.chelate).toBe(true);
  });

  it('erkennt fac/mer und cis/trans am Oktaeder', () => {
    expect(build('co3', [['nh3', 3], ['cl', 3]]).isomers[0].kind).toBe('fac/mer-Isomerie');
    expect(build('co3', [['nh3', 4], ['cl', 2]]).isomers[0].kind).toBe('cis/trans-Isomerie');
    expect(build('co3', [['nh3', 6]]).isomers).toEqual([]);
  });

  it('beschreibt den linearen Diamminsilber-Komplex', () => {
    const complex = build('ag1', [['nh3', 2]]);
    expect(complex.name).toBe('Diamminsilber(I)-Ion');
    expect(complex.geometry).toBe('linear');
    expect(complex.color).toBe('farblos');
  });

  it('berechnet die Absorption aus der gemessenen Aufspaltung', () => {
    const titan = build('ti3', [['h2o', 6]]);
    expect(titan.absorbedNm).toBe(493);
    expect(titan.lfse).toBe(-0.4);
  });

  it('schätzt unbekannte Aufspaltungen nach Jørgensen ab', () => {
    const complex = build('cr3', [['en', 3]]);
    expect(complex.deltaSource).toBe('Jørgensen-Abschätzung');
    expect(complex.delta).toBe(Math.round(1.28 * 17.4 * 1000));
  });

  it('klammert Liganden mit Lokanten im Namen', () => {
    const complex = build('fe3', [['scn', 1], ['h2o', 5]]);
    expect(complex.name).toBe('Pentaaqua(thiocyanato-κN)eisen(III)-Ion');
    expect(complex.color).toBe('blutrot');
  });

  it('meldet unmögliche Koordinationszahlen', () => {
    expect(build('cu2', [['nh3', 8]]).valid).toBe(false);
    expect(build('cu2', [['nh3', 3]]).valid).toBe(false);
    expect(build('cu2', [['en', 4]]).valid).toBe(false);
  });

  it('zeigt den Chelateffekt beim Ligandenaustausch', () => {
    const cu = CENTRAL_ION_BY_ID.get('cu2')!;
    const result = competition(
      cu,
      [{ ligand: LIGAND_BY_ID.get('nh3')!, count: 4 }],
      [{ ligand: LIGAND_BY_ID.get('en')!, count: 2 }],
    );
    expect(result.winner).toBe('zweiter');
    expect(result.explanation).toContain('Chelateffekt');
  });

  it('lässt EDTA gegen Ammoniak gewinnen', () => {
    const ni = CENTRAL_ION_BY_ID.get('ni2')!;
    const result = competition(
      ni,
      [{ ligand: LIGAND_BY_ID.get('nh3')!, count: 6 }],
      [{ ligand: LIGAND_BY_ID.get('edta')!, count: 1 }],
    );
    expect(result.winner).toBe('zweiter');
  });

  it('analysiert alle Vorlagen ohne Fehler', () => {
    for (const preset of COMPLEX_PRESETS) {
      const complex = build(preset.metal, preset.ligands);
      expect(complex.valid, preset.label).toBe(true);
      expect(complex.name.length, preset.label).toBeGreaterThan(5);
    }
  });

  it('zählt Stereoisomere bei gemischten Liganden', () => {
    const [isomer] = build('co3', [['nh3', 3], ['cl', 1], ['br', 1], ['i', 1]]).isomers;
    expect(isomer.count).toBe(5);
    expect(build('co3', [['nh3', 2], ['cl', 2], ['br', 2]]).isomers[0].count).toBe(6);
    expect(build('pt2', [['nh3', 1], ['cl', 1], ['br', 1], ['py', 1]]).isomers[0].count).toBe(3);
  });

  it('nennt keine Isomere für unmögliche Komplexe', () => {
    const complex = build('cu2', [['nh3', 4], ['cl', 4]]);
    expect(complex.valid).toBe(false);
    expect(complex.isomers).toEqual([]);
  });
});
