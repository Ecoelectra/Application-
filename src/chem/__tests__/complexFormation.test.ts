/** Komplexbildung in der Werkbank an Versuchen, deren Ergebnis im Lehrbuch steht. */
import { beforeAll, describe, expect, it } from 'vitest';
import type { MainModule } from '@rdkit/rdkit';
import initRDKitModule from '@rdkit/rdkit';
import { complexChemistry, ligandSourcesOf, metalSourceOf } from '../complexFormation';
import { DEFAULT_CONDITIONS, mix } from '../workbench';
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

function run(ids: string[], catalysis = 'keine') {
  return complexChemistry(rdkit, ids.map(get), { aqueous: true, catalysis });
}

function complexFormulas(ids: string[], catalysis = 'keine'): string[] {
  return run(ids, catalysis)
    .reactions.filter((reaction) => reaction.complex && !reaction.missing.length)
    .map((reaction) => reaction.complex!.formula);
}

describe('Metall- und Ligandenquellen', () => {
  it('erkennt Metall-Ionen in Salzen, Niederschlägen und Metallen', () => {
    expect(metalSourceOf(get('kupfersulfat'))).toMatchObject({ form: 'gelöst', metal: { id: 'cu2' } });
    expect(metalSourceOf(get('silberchlorid'))).toMatchObject({ form: 'Niederschlag', pKsp: 9.75 });
    expect(metalSourceOf(get('kupfer-i-chlorid'))?.form).toBe('Niederschlag');
    expect(metalSourceOf(get('gold'))).toMatchObject({ form: 'Metall', metal: { id: 'au3' } });
    expect(metalSourceOf(get('natriumchlorid'))).toBeNull();
    expect(metalSourceOf(get('ethylendiamin'))).toBeNull();
    expect(metalSourceOf(get('mangandioxid'))).toBeNull();
  });

  it('erkennt Liganden in Anionen, bekannten Stoffen und über die Struktur', () => {
    expect(ligandSourcesOf(rdkit, get('kaliumthiocyanat'))[0].ligand.id).toBe('scn');
    expect(ligandSourcesOf(rdkit, get('ammoniak'))[0]).toMatchObject({ basic: true, analog: 'nh3' });
    expect(ligandSourcesOf(rdkit, get('thioharnstoff'))[0].ligand.id).toBe('tu');
    const alanin = ligandSourcesOf(rdkit, get('alanin'))[0];
    expect(alanin).toMatchObject({ generic: true, analog: 'gly' });
    expect(alanin.ligand.charge).toBe(-1);
    expect(ligandSourcesOf(rdkit, get('methylamin'))[0]).toMatchObject({ generic: true, analog: 'nh3', basic: true });
    expect(ligandSourcesOf(rdkit, get('benzol'))).toEqual([]);
  });
});

describe('Komplexbildung in der Werkbank', () => {
  it('bildet die klassischen Nachweiskomplexe', () => {
    expect(complexFormulas(['kupfersulfat', 'ammoniak'])).toEqual(['[Cu(NH3)4(H2O)2]2+']);
    expect(complexFormulas(['eisen-iii-chlorid', 'kaliumthiocyanat'])).toEqual(['[Fe(H2O)5(NCS)]2+']);
    expect(complexFormulas(['nickel-ii-chlorid', 'dimethylglyoxim'])).toEqual(['[Ni(dmg)2]']);
    expect(complexFormulas(['eisen-ii-sulfat', '1-10-phenanthrolin'])).toEqual(['[Fe(phen)3]2+']);
    expect(complexFormulas(['cobalt-ii-chlorid', 'kaliumthiocyanat'])).toEqual(['[Co(NCS)4]2-']);
    expect(complexFormulas(['eisen-iii-chlorid', 'phenol'])).toEqual(['[Fe(C6H5O)6]3-']);
  });

  it('löst Niederschläge nur, wenn der Komplex stabil genug ist', () => {
    expect(complexFormulas(['silberchlorid', 'ammoniak'])).toEqual(['[Ag(NH3)2]+']);
    expect(complexFormulas(['silberiodid', 'ammoniak'])).toEqual([]);
    expect(run(['silberiodid', 'ammoniak']).hints.join(' ')).toContain('löst sich nicht');
    expect(complexFormulas(['silberbromid', 'natriumthiosulfat'])).toEqual(['[Ag(S2O3)2]3-']);
    expect(complexFormulas(['kupfer-ii-hydroxid', 'ammoniak'])).toEqual(['[Cu(NH3)4(H2O)2]2+']);
    expect(complexFormulas(['calciumcarbonat', 'dinatrium-edta'])).toEqual(['[Ca(edta)]2-']);
  });

  it('fällt Hydroxide, wenn Ammoniak keinen Komplex bildet', () => {
    for (const id of ['aluminiumchlorid', 'eisen-iii-chlorid', 'eisen-ii-sulfat', 'magnesiumchlorid']) {
      const result = run([id, 'ammoniak']);
      expect(result.reactions.map((reaction) => reaction.type), id).toEqual(['Fällungsreaktion']);
      expect(result.reactions[0].complex).toBeUndefined();
    }
    expect(run(['calciumchlorid', 'ammoniak']).reactions).toEqual([]);
  });

  it('kennt amphotere Hydroxide', () => {
    expect(complexFormulas(['zinkchlorid', 'natriumhydroxid'])).toEqual(['[Zn(OH)4]2-']);
    expect(complexFormulas(['aluminiumchlorid', 'natriumhydroxid'])).toEqual(['[Al(OH)4]-']);
    expect(complexFormulas(['kupfersulfat', 'natriumhydroxid'])).toEqual([]);
  });

  it('erkennt Redoxreaktionen statt eines Komplexes', () => {
    expect(complexFormulas(['kupfersulfat', 'kaliumiodid'])).toEqual([]);
    expect(run(['kupfersulfat', 'kaliumiodid']).hints.join(' ')).toContain('CuI');
    expect(run(['eisen-iii-chlorid', 'kaliumiodid']).hints.join(' ')).toContain('Iod');
    expect(run(['eisen-ii-sulfat', 'kaliumthiocyanat']).hints.join(' ')).toContain('keine Rotfärbung');
  });

  it('löst Metalle nur mit dem passenden Mittel', () => {
    expect(complexFormulas(['gold', 'salzsaeure', 'salpetersaeure'])).toEqual(['[AuCl4]-']);
    expect(complexFormulas(['gold', 'salzsaeure'])).toEqual([]);
    expect(run(['gold', 'salzsaeure']).hints.join(' ')).toContain('Königswasser');
    expect(complexFormulas(['zink', 'natriumhydroxid'])).toEqual(['[Zn(OH)4]2-']);
    expect(complexFormulas(['kupfer', 'ammoniak'])).toEqual(['[Cu(NH3)4(H2O)2]2+']);
  });

  it('verlangt hohe Konzentration für Chloridokomplexe', () => {
    expect(complexFormulas(['cobalt-ii-chlorid', 'salzsaeure'])).toEqual(['[CoCl4]2-']);
    expect(complexFormulas(['kupfersulfat', 'natriumchlorid'])).toEqual([]);
  });

  it('braucht für Glycerin eine alkalische Lösung', () => {
    const neutral = run(['kupfersulfat', 'glycerin']).reactions.find((reaction) => reaction.complex);
    expect(neutral?.missing.join(' ')).toContain('Alkalische Lösung');
    expect(complexFormulas(['kupfersulfat', 'glycerin', 'natriumhydroxid'])).toContain('[Cu(glyc)2]2-');
  });

  it('behält bei Palladium die Chloridliganden', () => {
    expect(complexFormulas(['palladium-ii-chlorid', 'triphenylphosphin'])).toEqual(['[PdCl2(PPh3)2]']);
  });

  it('unterscheidet Lehrbuchreaktion und Vorhersage', () => {
    const known = run(['kupfersulfat', 'ammoniak']).reactions[0];
    expect(known.evidence).toBe('lehrbuch');
    const predicted = run(['kupfersulfat', 'methylamin']).reactions.find((reaction) => reaction.complex);
    expect(predicted?.evidence).toBe('vorhersage');
    expect(predicted?.evidenceNote).toContain('Methylamin');
    expect(predicted?.complex?.name).toBe('Diaquatetrakis(methylamin)kupfer(II)-Ion');
  });

  it('nennt den stärkeren Liganden, wenn mehrere konkurrieren', () => {
    const result = run(['nickel-ii-sulfat', 'ethylendiamin', 'ammoniak']);
    const en = result.reactions.find((reaction) => reaction.complex?.formula === '[Ni(en)3]2+');
    expect(en?.explanation).toContain('am festesten');
  });

  it('zeigt Komplexe in der Werkbank mit Analyse und Baukasten-Link', () => {
    const result = mix(rdkit, [get('kupfersulfat'), get('ammoniak')], DEFAULT_CONDITIONS);
    const complex = result.reactions.find((reaction) => reaction.complex);
    expect(complex?.complex?.geometry).toBe('oktaedrisch');
    expect(complex?.complexLink).toContain('modus=komplexe');
    expect(complex?.evidence).toBe('lehrbuch');
  });
});
