/**
 * Regressionstest der berechneten Produkte.
 *
 * Für jede Reaktionsvorschrift ist festgehalten, welches Produkt sie aus den
 * hinterlegten Vorgabeedukten liefert. Ändert sich eine Vorschrift, fällt hier
 * sofort auf, ob das Ergebnis noch stimmt.
 */
import { beforeAll, describe, expect, it } from 'vitest';
import type { MainModule } from '@rdkit/rdkit';
import initRDKitModule from '@rdkit/rdkit';
import { reactionById } from '../../data/reactions';
import { runReaction } from '../rdkit';

let rdkit: MainModule;

beforeAll(async () => {
  rdkit = await initRDKitModule();
}, 60_000);

/** Reaktions-ID und das erwartete Produkt aus den Vorgabeedukten. */
const ERWARTETE_PRODUKTE: Array<[string, string]> = [
  ['fischer-veresterung', 'CCOC(C)=O'],
  ['esterverseifung', 'CC(=O)O + CCO'],
  ['saeurechlorid-socl2', 'CC(=O)Cl'],
  ['schotten-baumann-amid', 'CC(=O)NCc1ccccc1'],
  ['amidkupplung-edc', 'CC(=O)NCc1ccccc1'],
  ['nabh4-reduktion', 'CC(O)c1ccccc1'],
  ['alkohol-oxidation-keton', 'CC(=O)c1ccccc1'],
  ['alkohol-oxidation-aldehyd', 'O=Cc1ccccc1'],
  ['aldehyd-oxidation-saeure', 'O=C(O)c1ccccc1'],
  ['aldol-kondensation', 'CC=CC=O'],
  ['claisen-kondensation', 'CCOC(=O)CC(C)=O'],
  ['grignard-addition', 'CC(C)(C)O'],
  ['wittig-reaktion', 'CC=Cc1ccccc1'],
  ['reduktive-aminierung', 'CC(C)NCc1ccccc1'],
  ['acetal-schutzgruppe', 'CC1(c2ccccc2)OCCO1'],
  ['lialh4-esterreduktion', 'OCc1ccccc1 + CCO'],
  ['sn2-cyanid', 'CCCC#N'],
  ['williamson-ethersynthese', 'CCOCC'],
  ['alkohol-zu-halogenalkan', 'CCCCBr'],
  ['e2-dehydrohalogenierung', 'CC=CC'],
  ['alkohol-dehydratisierung', 'CC=CC'],
  ['nitril-hydrolyse', 'CCCC(=O)O'],
  ['epoxid-oeffnung', 'COCCO'],
  ['katalytische-hydrierung', 'CCCC'],
  ['bromaddition-alken', 'CC(Br)C(C)Br'],
  ['hydrohalogenierung-markovnikov', 'CC(C)(C)Br'],
  ['hydroborierung-oxidation', 'CC(C)CO'],
  ['epoxidierung-mcpba', 'C1CCC2OC2C1'],
  ['dihydroxylierung', 'OC1CCCCC1O'],
  ['ozonolyse', 'CC=O + CC=O'],
  ['diels-alder', 'O=CC1CC=CCC1'],
  ['michael-addition', 'CCOC(=O)C(CCC(C)=O)C(=O)OCC'],
  ['nitrierung-aromat', 'O=[N+]([O-])c1ccccc1'],
  ['sulfonierung-aromat', 'O=S(=O)(O)c1ccccc1'],
  ['friedel-crafts-acylierung', 'CC(=O)c1ccccc1'],
  ['friedel-crafts-alkylierung', 'CC(C)c1ccccc1'],
  ['nitro-reduktion', 'Nc1ccccc1'],
  ['diazotierung', 'N#[N+]c1ccccc1'],
  ['azokupplung', 'Oc1ccc(N=Nc2ccccc2)cc1'],
  ['sandmeyer-reaktion', 'Brc1ccccc1'],
  ['suzuki-kupplung', 'c1ccc(-c2ccccc2)cc1'],
  ['heck-reaktion', 'COC(=O)C=Cc1ccccc1'],
  ['kolbe-elektrolyse', 'CCCCCCCC'],
  ['hofer-moest', 'CC(C)(C)CO'],
  ['shono-oxidation', 'COC(=O)N1CCCC1OC'],
  ['baizer-hydrodimerisierung', 'N#CCCCCC#N'],
  ['tempo-anodische-oxidation', 'O=Cc1ccccc1'],
  ['kathodische-nitroreduktion', 'Nc1ccccc1'],
  ['elektrochemische-pinakolkupplung', 'CC(C)(O)C(C)(C)O'],
  ['elektrocarboxylierung', 'O=C(O)c1ccccc1'],
  ['cannizzaro', 'OCc1ccccc1 + O=C(O)c1ccccc1'],
  ['knoevenagel-kondensation', 'CCOC(=O)C(=Cc1ccccc1)C(=O)OCC'],
  ['claisen-schmidt', 'O=C(C=Cc1ccccc1)c1ccccc1'],
  ['mannich-reaktion', 'CC(=O)CCN(C)C'],
  ['malonester-synthese', 'CCCC(C(=O)OCC)C(=O)OCC'],
  ['finkelstein', 'CCCCI'],
  ['appel-reaktion', 'CCCCBr'],
  ['tosylierung', 'CCCCOS(=O)(=O)c1ccc(C)cc1'],
  ['acetylierung-anhydrid', 'CC(=O)Oc1ccccc1C(=O)O'],
  ['snar-substitution', 'COc1ccc([N+](=O)[O-])cc1'],
  ['sonogashira-kupplung', 'C(#Cc1ccccc1)c1ccccc1'],
  ['buchwald-hartwig', 'c1ccc(CNc2ccccc2)cc1'],
  ['olefinmetathese', 'CCCCC=CCCCC'],
  ['lindlar-hydrierung', 'CC=CC'],
  ['baeyer-villiger', 'COC(=O)c1ccccc1'],
  ['beckmann-umlagerung', 'CNC=O'],
  ['gabriel-synthese', 'CCCN1C(=O)c2ccccc2C1=O'],
  ['wolff-kishner', 'CCc1ccccc1'],
  ['oximbildung', 'CC(C)=NO'],
  ['amidhydrolyse', 'CC(=O)O + Nc1ccccc1'],
  ['umesterung', 'COC(C)=O'],
  ['nitril-reduktion', 'CCCCN'],
  ['kolbe-schmitt', 'O=C(O)c1ccccc1O'],
  ['iodoform-probe', 'O=C(O)c1ccccc1'],
];

describe('Berechnete Produkte', () => {
  it.each(ERWARTETE_PRODUKTE)('%s liefert %s', (id, expected) => {
    const rule = reactionById(id);
    expect(rule, `Reaktion ${id} fehlt`).toBeDefined();
    const sets = runReaction(rdkit, rule!.smirks as string, rule!.reactantDefaults ?? []);
    expect(sets.length, `${id}: kein Produkt berechnet`).toBeGreaterThan(0);
    expect(sets[0].join(' + ')).toBe(expected);
  });
});
