/**
 * Hilfsstoffe einer Reaktion einordnen: Katalysator, Base, Säure,
 * Kupplungsreagenz, Reduktions- oder Oxidationsmittel, Ligand, Lösungsmittel.
 *
 * Dieselbe Einteilung gilt beim Training (Hilfsstoffe der Patentreaktionen)
 * und in der App (Stoffe im Gefäß): So erkennt die KI, dass «Palladium auf
 * Aktivkohle» genau der Katalysator ist, den sie für eine Hydrierung
 * vorschlägt.
 */
import type { MainModule } from '@rdkit/rdkit';
import { canonicalSmiles, matchSmarts } from '../rdkit';

export type AgentRole =
  | 'Katalysator'
  | 'Säure'
  | 'Base'
  | 'Aktivierungsreagenz'
  | 'Reduktionsmittel'
  | 'Oxidationsmittel'
  | 'Halogenierungsmittel'
  | 'Ligand'
  | 'Lösungsmittel'
  | 'Reagenz';

export interface AgentCategory {
  id: string;
  label: string;
  role: AgentRole;
  /** Was der Stoff in der Reaktion bewirkt */
  purpose: string;
  /** Beispiel-Stoffe der Offline-Datenbank, die diese Rolle übernehmen können */
  substanceIds: string[];
}

export const AGENT_CATEGORIES: AgentCategory[] = [
  { id: 'pd', label: 'Palladiumkatalysator', role: 'Katalysator', purpose: 'Palladium schiebt sich in die Kohlenstoff-Halogen-Bindung ein (oxidative Addition), überträgt den Partner und gibt das Produkt wieder ab. Ohne Palladium ist dieser Weg praktisch versperrt.', substanceIds: ['tetrakis-triphenylphosphin-palladium', 'palladium-ii-acetat', 'palladium-auf-aktivkohle'] },
  { id: 'pt', label: 'Platinkatalysator', role: 'Katalysator', purpose: 'An der Platinoberfläche werden Wasserstoff und Doppelbindungen gebunden und aktiviert.', substanceIds: ['platin'] },
  { id: 'ni', label: 'Nickelkatalysator', role: 'Katalysator', purpose: 'Nickel (etwa Raney-Nickel) aktiviert Wasserstoff an seiner Oberfläche oder kuppelt wie Palladium.', substanceIds: ['nickel'] },
  { id: 'cu', label: 'Kupferkatalysator', role: 'Katalysator', purpose: 'Kupfer(I) vermittelt Kupplungen an Stickstoff, Sauerstoff und Alkinen (Ullmann, Sonogashira, Click-Reaktion).', substanceIds: ['kupfer-i-iodid', 'kupfer-i-chlorid', 'kupfer'] },
  { id: 'edelmetall', label: 'Rhodium-, Ruthenium- oder Iridiumkatalysator', role: 'Katalysator', purpose: 'Edelmetallkomplexe aktivieren Wasserstoff oder C–H-Bindungen.', substanceIds: ['grubbs-katalysator'] },
  { id: 'wasserstoff', label: 'Wasserstoff', role: 'Reduktionsmittel', purpose: 'Liefert die Wasserstoffatome bei Hydrierungen – nur zusammen mit einem Metallkatalysator.', substanceIds: ['wasserstoff'] },
  { id: 'metall-reduktion', label: 'Unedles Metall als Reduktionsmittel', role: 'Reduktionsmittel', purpose: 'Eisen, Zink oder Zinn geben Elektronen ab, etwa bei der Reduktion von Nitrogruppen.', substanceIds: ['eisen', 'zink', 'zinn'] },
  { id: 'saeure', label: 'Starke Säure', role: 'Säure', purpose: 'Protoniert Carbonyl- oder Schutzgruppen und macht sie reaktiver (Säurekatalyse) oder spaltet sie ab.', substanceIds: ['schwefelsaeure', 'salzsaeure', 'trifluoressigsaeure', 'p-toluolsulfonsaeure', 'methansulfonsaeure'] },
  { id: 'schwache-saeure', label: 'Schwache Säure', role: 'Säure', purpose: 'Puffert und katalysiert milde, etwa die Iminbildung bei der reduktiven Aminierung.', substanceIds: ['essigsaeure'] },
  { id: 'lewis', label: 'Lewis-Säure', role: 'Katalysator', purpose: 'Nimmt ein Elektronenpaar auf, polarisiert Carbonyl- oder Halogenverbindungen und erzeugt starke Elektrophile.', substanceIds: ['aluminiumchlorid', 'eisen-iii-chlorid', 'zinkchlorid', 'bortrifluorid'] },
  { id: 'dmap', label: 'Nucleophiler Katalysator (DMAP)', role: 'Katalysator', purpose: 'DMAP greift das Acylierungsmittel an und bildet ein viel reaktiveres Acylpyridinium-Ion.', substanceIds: ['dmap'] },
  { id: 'aminbase', label: 'Aminbase', role: 'Base', purpose: 'Fängt entstehende Säure (HCl) ab und hält Nucleophile deprotoniert.', substanceIds: ['triethylamin', 'dipea', 'pyridin'] },
  { id: 'anorganische-base', label: 'Anorganische Base', role: 'Base', purpose: 'Deprotoniert das Nucleophil oder aktiviert Boronsäuren (Suzuki).', substanceIds: ['kaliumcarbonat', 'natriumcarbonat', 'natriumhydroxid', 'kaliumhydroxid', 'lithiumhydroxid', 'kaliumphosphat', 'natriumhydrogencarbonat'] },
  { id: 'starke-base', label: 'Starke Base', role: 'Base', purpose: 'Deprotoniert auch schwache Säuren wie Alkohole, Amide oder C–H-acide Verbindungen.', substanceIds: ['natriumhydrid', 'kalium-tert-butanolat', 'lda', 'natriummethanolat', 'natriumethanolat'] },
  { id: 'kupplungsreagenz', label: 'Kupplungsreagenz', role: 'Aktivierungsreagenz', purpose: 'Wandelt die Carbonsäure in einen Aktivester um, den das Amin schon bei Raumtemperatur angreift.', substanceIds: ['dcc', 'edc', 'hatu'] },
  { id: 'hydrid', label: 'Hydrid-Reduktionsmittel', role: 'Reduktionsmittel', purpose: 'Überträgt ein Hydrid-Ion (oder Wasserstoff aus Silanen, Hydrazin, Formiat) auf Carbonylgruppen, Imine oder Nitrogruppen.', substanceIds: ['natriumborhydrid', 'lithiumaluminiumhydrid', 'natriumcyanoborhydrid', 'natriumtriacetoxyborhydrid'] },
  { id: 'mitsunobu', label: 'Mitsunobu-Reagenz (DEAD/DIAD)', role: 'Aktivierungsreagenz', purpose: 'Azodicarboxylat und Triphenylphosphan machen aus einer OH-Gruppe eine gute Abgangsgruppe – mit Umkehr der Konfiguration.', substanceIds: ['triphenylphosphin'] },
  { id: 'radikalstarter', label: 'Radikalstarter', role: 'Reagenz', purpose: 'Zerfällt beim Erwärmen in Radikale, die eine Kettenreaktion starten (etwa die Bromierung mit NBS).', substanceIds: [] },
  { id: 'oxidation', label: 'Oxidationsmittel', role: 'Oxidationsmittel', purpose: 'Entzieht Elektronen, etwa bei der Oxidation von Alkoholen oder Sulfiden.', substanceIds: ['wasserstoffperoxid', 'kaliumpermanganat', 'pcc', 'dess-martin-periodinan', 'mcpba'] },
  { id: 'halogenierung', label: 'Halogenierungs- und Aktivierungsmittel', role: 'Halogenierungsmittel', purpose: 'Macht aus OH-Gruppen gute Abgangsgruppen (Säurechloride, Alkylhalogenide) oder überträgt Halogen.', substanceIds: ['thionylchlorid', 'oxalylchlorid', 'phosphoroxychlorid', 'n-bromsuccinimid'] },
  { id: 'fluorid', label: 'Fluoridquelle', role: 'Reagenz', purpose: 'Spaltet Silylschutzgruppen.', substanceIds: [] },
  { id: 'ligand', label: 'Phosphanligand', role: 'Ligand', purpose: 'Stabilisiert das Metall und steuert seine Reaktivität.', substanceIds: ['triphenylphosphin'] },
  { id: 'phasentransfer', label: 'Phasentransferkatalysator', role: 'Katalysator', purpose: 'Schleust Anionen aus der Wasser- in die organische Phase.', substanceIds: [] },
  { id: 'loesungsmittel', label: 'Lösungsmittel', role: 'Lösungsmittel', purpose: 'Löst die Edukte und bestimmt Polarität und Temperatur.', substanceIds: [] },
  { id: 'enzym', label: 'Enzym (Biokatalysator)', role: 'Katalysator', purpose: 'Ein Enzym bindet die Edukte in seiner Tasche und senkt die Aktivierungsenergie so weit, dass die Reaktion bei Raum- oder Körpertemperatur in Wasser abläuft – oft nur für ein Enantiomer.', substanceIds: [] },
  { id: 'technisch', label: 'Technischer Metallkatalysator (Silber, Cobalt, Vanadium, Molybdän)', role: 'Katalysator', purpose: 'Feste Katalysatoren der Großindustrie: An ihrer Oberfläche werden Gase wie Sauerstoff, Wasserstoff oder Kohlenmonoxid gebunden und aktiviert – meist bei 200–500 °C und erhöhtem Druck.', substanceIds: ['silber', 'cobalt', 'vanadium-v-oxid'] },
];

/** Hauptklassen der Enzyme nach EC-Nummer */
const ENZYME_CLASSES: Record<string, string> = {
  '1': 'Oxidoreduktase',
  '2': 'Transferase',
  '3': 'Hydrolase',
  '4': 'Lyase',
  '5': 'Isomerase',
  '6': 'Ligase',
  '7': 'Translokase',
};

/** «EC:3.1.1.3» → «Hydrolase (EC 3.1.1.3)» */
export function enzymeName(token: string): string {
  const ec = token.replace(/^EC:/, '');
  return `${ENZYME_CLASSES[ec.split('.')[0]] ?? 'Enzym'} (EC ${ec})`;
}

export const AGENT_CATEGORY_BY_ID: ReadonlyMap<string, AgentCategory> = new Map(AGENT_CATEGORIES.map((entry) => [entry.id, entry]));

/** Häufige Hilfsstoffe der Patentliteratur mit Namen (SMILES → Name, Kategorie). */
const KNOWN_AGENTS: Array<[string, string, string]> = [
  // Technische Katalysatoren (Quelle «Technische Katalyse»)
  ['[Cu].O=[Zn]', 'Kupfer/Zinkoxid', 'cu'], ['[Ru]', 'Ruthenium', 'edelmetall'], ['[Rh].I', 'Rhodium mit Iodid', 'edelmetall'],
  ['[Ag]', 'Silber', 'technisch'], ['[Co]', 'Cobalt', 'technisch'], ['OP(O)(O)=O', 'Phosphorsäure', 'saeure'],
  ['[Br-].[K+]', 'Kaliumbromid (Halogenid-Katalysator)', 'phasentransfer'],
  ['[Br-]', 'Bromid (Halogenid-Katalysator)', 'phasentransfer'],
  // Palladiumkatalysatoren
  ['c1ccc([P](c2ccccc2)(c2ccccc2)[Pd]([P](c2ccccc2)(c2ccccc2)c2ccccc2)([P](c2ccccc2)(c2ccccc2)c2ccccc2)[P](c2ccccc2)(c2ccccc2)c2ccccc2)cc1', 'Pd(PPh₃)₄', 'pd'],
  ['[Pd]', 'Palladium (Pd/C)', 'pd'], ['CC(=O)O[Pd]OC(C)=O', 'Palladium(II)-acetat', 'pd'], ['CC(=O)[O-].CC(=O)[O-].[Pd+2]', 'Palladium(II)-acetat', 'pd'],
  ['Cl[Pd]Cl', 'Palladium(II)-chlorid', 'pd'], ['[Pd+2]', 'Palladium(II)', 'pd'],
  ['Cl[Pd](Cl)([P](c1ccccc1)(c1ccccc1)c1ccccc1)[P](c1ccccc1)(c1ccccc1)c1ccccc1', 'PdCl₂(PPh₃)₂', 'pd'],
  ['[Pt]', 'Platin', 'pt'], ['[Ni]', 'Nickel (Raney-Nickel)', 'ni'], ['[Cu]I', 'Kupfer(I)-iodid', 'cu'], ['I[Cu]', 'Kupfer(I)-iodid', 'cu'],
  // Lösungsmittel
  ['C1CCOC1', 'Tetrahydrofuran', 'loesungsmittel'], ['CN(C)C=O', 'DMF', 'loesungsmittel'], ['CS(C)=O', 'DMSO', 'loesungsmittel'],
  ['ClCCl', 'Dichlormethan', 'loesungsmittel'], ['ClC(Cl)Cl', 'Chloroform', 'loesungsmittel'], ['CC#N', 'Acetonitril', 'loesungsmittel'],
  ['Cc1ccccc1', 'Toluol', 'loesungsmittel'], ['c1ccccc1', 'Benzol', 'loesungsmittel'], ['CO', 'Methanol', 'loesungsmittel'],
  ['CCO', 'Ethanol', 'loesungsmittel'], ['CC(C)O', 'Isopropanol', 'loesungsmittel'], ['O', 'Wasser', 'loesungsmittel'],
  ['C1COCCO1', '1,4-Dioxan', 'loesungsmittel'], ['CCOCC', 'Diethylether', 'loesungsmittel'], ['CCOC(C)=O', 'Ethylacetat', 'loesungsmittel'],
  ['CC(C)=O', 'Aceton', 'loesungsmittel'], ['CCCCCC', 'Hexan', 'loesungsmittel'], ['CN1CCCC1=O', 'NMP', 'loesungsmittel'],
  ['CC(=O)N(C)C', 'Dimethylacetamid', 'loesungsmittel'], ['COCCOC', 'Dimethoxyethan', 'loesungsmittel'], ['COC(C)(C)C', 'MTBE', 'loesungsmittel'],
  ['ClC(Cl)(Cl)Cl', 'Tetrachlormethan', 'loesungsmittel'], ['ClCCCl', '1,2-Dichlorethan', 'loesungsmittel'], ['CCCCO', 'Butanol', 'loesungsmittel'],
  ['C1CCCCC1', 'Cyclohexan', 'loesungsmittel'], ['Clc1ccccc1', 'Chlorbenzol', 'loesungsmittel'], ['CC(C)(C)O', 'tert-Butanol', 'loesungsmittel'],
  ['OCCO', 'Ethylenglycol', 'loesungsmittel'], ['CCCCCCC', 'Heptan', 'loesungsmittel'],
  // Basen
  ['CCN(CC)CC', 'Triethylamin', 'aminbase'], ['CCN(C(C)C)C(C)C', 'DIPEA', 'aminbase'], ['c1ccncc1', 'Pyridin', 'aminbase'],
  ['C1CCC2=NCCCN2CC1', 'DBU', 'aminbase'], ['CN1CCOCC1', 'N-Methylmorpholin', 'aminbase'], ['Cc1cccc(C)n1', '2,6-Lutidin', 'aminbase'],
  ['CN(C)c1ccncc1', 'DMAP', 'dmap'],
  ['O=C([O-])[O-].[K+].[K+]', 'Kaliumcarbonat', 'anorganische-base'], ['O=C([O-])[O-].[Cs+].[Cs+]', 'Caesiumcarbonat', 'anorganische-base'],
  ['O=C([O-])[O-].[Na+].[Na+]', 'Natriumcarbonat', 'anorganische-base'], ['O=C([O-])O.[Na+]', 'Natriumhydrogencarbonat', 'anorganische-base'],
  ['O=C([O-])O.[K+]', 'Kaliumhydrogencarbonat', 'anorganische-base'], ['O=P([O-])([O-])[O-].[K+].[K+].[K+]', 'Kaliumphosphat', 'anorganische-base'],
  ['[Na+].[OH-]', 'Natriumhydroxid', 'anorganische-base'], ['[K+].[OH-]', 'Kaliumhydroxid', 'anorganische-base'], ['[Li+].[OH-]', 'Lithiumhydroxid', 'anorganische-base'],
  ['[H-].[Na+]', 'Natriumhydrid', 'starke-base'], ['CC(C)(C)[O-].[K+]', 'Kalium-tert-butanolat', 'starke-base'], ['CC(C)(C)[O-].[Na+]', 'Natrium-tert-butanolat', 'starke-base'],
  ['CC(C)[N-]C(C)C.[Li+]', 'LDA', 'starke-base'], ['[Li]CCCC', 'n-Butyllithium', 'starke-base'], ['C[O-].[Na+]', 'Natriummethanolat', 'starke-base'],
  ['CC[O-].[Na+]', 'Natriumethanolat', 'starke-base'], ['C[Si](C)(C)[N-][Si](C)(C)C.[Li+]', 'LiHMDS', 'starke-base'],
  // Säuren
  ['O=S(=O)(O)O', 'Schwefelsäure', 'saeure'], ['Cl', 'Chlorwasserstoff', 'saeure'], ['O=C(O)C(F)(F)F', 'Trifluoressigsäure', 'saeure'],
  ['Cc1ccc(S(=O)(=O)O)cc1', 'p-Toluolsulfonsäure', 'saeure'], ['CS(=O)(=O)O', 'Methansulfonsäure', 'saeure'], ['Br', 'Bromwasserstoff', 'saeure'],
  ['CC(=O)O', 'Essigsäure', 'schwache-saeure'], ['O=CO', 'Ameisensäure', 'schwache-saeure'],
  // Lewis-Säuren
  ['Cl[Al](Cl)Cl', 'Aluminiumchlorid', 'lewis'], ['FB(F)F', 'Bortrifluorid', 'lewis'], ['CCOCC.FB(F)F', 'Bortrifluorid-Etherat', 'lewis'],
  ['Cl[Ti](Cl)(Cl)Cl', 'Titan(IV)-chlorid', 'lewis'], ['Cl[Zn]Cl', 'Zinkchlorid', 'lewis'], ['BrB(Br)Br', 'Bortribromid', 'lewis'],
  ['Cl[Fe](Cl)Cl', 'Eisen(III)-chlorid', 'lewis'], ['C[Si](C)(C)OS(=O)(=O)C(F)(F)F', 'TMS-Triflat', 'lewis'],
  // Kupplungsreagenzien
  ['CN(C)C(On1nnc2cccnc21)=[N+](C)C.F[P-](F)(F)(F)(F)F', 'HATU', 'kupplungsreagenz'],
  ['CN(C)C(On1nnc2ccccc21)=[N+](C)C.F[P-](F)(F)(F)(F)F', 'HBTU', 'kupplungsreagenz'],
  ['CCN=C=NCCCN(C)C', 'EDC', 'kupplungsreagenz'], ['CCN=C=NCCCN(C)C.Cl', 'EDC-Hydrochlorid', 'kupplungsreagenz'],
  ['C(=NC1CCCCC1)=NC1CCCCC1', 'DCC', 'kupplungsreagenz'], ['On1nnc2ccccc21', 'HOBt', 'kupplungsreagenz'],
  ['O=C(n1ccnc1)n1ccnc1', 'CDI', 'kupplungsreagenz'], ['CC(C)N=C=NC(C)C', 'DIC', 'kupplungsreagenz'],
  // Reduktionsmittel
  ['[Na+].[BH4-]', 'Natriumborhydrid', 'hydrid'], ['[Li+].[AlH4-]', 'Lithiumaluminiumhydrid', 'hydrid'],
  ['CC(=O)O[BH-](OC(C)=O)OC(C)=O.[Na+]', 'Natriumtriacetoxyborhydrid', 'hydrid'], ['[BH3-]C#N.[Na+]', 'Natriumcyanoborhydrid', 'hydrid'],
  ['CC(C)C[AlH]CC(C)C', 'DIBAL-H', 'hydrid'], ['B', 'Boran', 'hydrid'], ['[Li+].[BH4-]', 'Lithiumborhydrid', 'hydrid'],
  ['[H][H]', 'Wasserstoff', 'wasserstoff'], ['[Fe]', 'Eisen', 'metall-reduktion'], ['[Zn]', 'Zink', 'metall-reduktion'],
  ['Cl[Sn]Cl', 'Zinn(II)-chlorid', 'metall-reduktion'],
  // Oxidationsmittel
  ['O=C(OO)c1cccc(Cl)c1', 'mCPBA', 'oxidation'], ['OO', 'Wasserstoffperoxid', 'oxidation'], ['O=[Mn](=O)(=O)[O-].[K+]', 'Kaliumpermanganat', 'oxidation'],
  ['CC(=O)OI1(OC(C)=O)(OC(C)=O)OC(=O)c2ccccc21', 'Dess-Martin-Periodinan', 'oxidation'], ['O=I(=O)(=O)[O-].[Na+]', 'Natriumperiodat', 'oxidation'],
  ['CC1(C)CCCC(C)(C)N1[O]', 'TEMPO', 'oxidation'], ['[O-]Cl.[Na+]', 'Natriumhypochlorit', 'oxidation'],
  // Halogenierung, Aktivierung
  ['O=S(Cl)Cl', 'Thionylchlorid', 'halogenierung'], ['O=C(Cl)C(=O)Cl', 'Oxalylchlorid', 'halogenierung'], ['O=P(Cl)(Cl)Cl', 'Phosphoroxychlorid', 'halogenierung'],
  ['O=C1CCC(=O)N1Br', 'N-Bromsuccinimid', 'halogenierung'], ['O=C1CCC(=O)N1Cl', 'N-Chlorsuccinimid', 'halogenierung'], ['BrP(Br)Br', 'Phosphortribromid', 'halogenierung'],
  ['BrBr', 'Brom', 'halogenierung'], ['II', 'Iod', 'halogenierung'], ['CS(=O)(=O)Cl', 'Mesylchlorid', 'halogenierung'],
  // Liganden
  ['c1ccc(P(c2ccccc2)c2ccccc2)cc1', 'Triphenylphosphan', 'ligand'],
  // Fluorid
  ['CCCC[N+](CCCC)(CCCC)CCCC.[F-]', 'TBAF', 'fluorid'], ['[Cs+].[F-]', 'Caesiumfluorid', 'fluorid'],
  // Phasentransfer
  ['CCCC[N+](CCCC)(CCCC)CCCC.[Br-]', 'Tetrabutylammoniumbromid', 'phasentransfer'], ['CCCC[N+](CCCC)(CCCC)CCCC.[I-]', 'Tetrabutylammoniumiodid', 'phasentransfer'],
  // In den Patentdaten sind Salze in ihre Ionen zerlegt: einzelne Ionen und Bruchstücke
  ['[OH-]', 'Hydroxid', 'anorganische-base'], ['O=C([O-])[O-]', 'Carbonat', 'anorganische-base'], ['O=C([O-])O', 'Hydrogencarbonat', 'anorganische-base'],
  ['O=P([O-])([O-])[O-]', 'Phosphat', 'anorganische-base'], ['O=P([O-])([O-])O', 'Hydrogenphosphat', 'anorganische-base'], ['CC(=O)[O-]', 'Acetat', 'anorganische-base'],
  ['CC(C)(C)[O-]', 'tert-Butanolat', 'starke-base'], ['C[O-]', 'Methanolat', 'starke-base'], ['CC[O-]', 'Ethanolat', 'starke-base'], ['[H-]', 'Hydrid (NaH)', 'starke-base'],
  ['[Li]C(C)(C)C', 'tert-Butyllithium', 'starke-base'], ['C[Si](C)(C)[N-][Si](C)(C)C', 'Hexamethyldisilazid', 'starke-base'], ['CC(C)[N-]C(C)C', 'Diisopropylamid', 'starke-base'],
  ['CN(C)C(On1nnc2cccnc21)=[N+](C)C', 'HATU', 'kupplungsreagenz'], ['CN(C)C(On1nnc2ccccc21)=[N+](C)C', 'HBTU', 'kupplungsreagenz'],
  ['F[P-](F)(F)(F)(F)F', 'Hexafluorophosphat (aus HATU/HBTU)', 'kupplungsreagenz'], ['On1nnc2cccnc21', 'HOAt', 'kupplungsreagenz'],
  ['CCCC[N+](CCCC)(CCCC)CCCC', 'Tetrabutylammonium', 'phasentransfer'], ['[F-]', 'Fluorid', 'fluorid'],
  ['[Al+3]', 'Aluminium(III)', 'lewis'], ['[Zn+2]', 'Zink(II)', 'lewis'], ['[Ti+4]', 'Titan(IV)', 'lewis'], ['[Fe+3]', 'Eisen(III)', 'lewis'], ['[Sn+4]', 'Zinn(IV)', 'lewis'],
  ['[Sn+2]', 'Zinn(II)', 'metall-reduktion'], ['[Na]', 'Natrium', 'metall-reduktion'], ['[K]', 'Kalium', 'metall-reduktion'], ['[Li]', 'Lithium', 'metall-reduktion'], ['[Mg]', 'Magnesium', 'metall-reduktion'],
  ['N', 'Ammoniak', 'aminbase'], ['CC(C)NC(C)C', 'Diisopropylamin', 'aminbase'], ['C1CCNCC1', 'Piperidin', 'aminbase'], ['c1c[nH]cn1', 'Imidazol', 'aminbase'], ['C1CCNC1', 'Pyrrolidin', 'aminbase'],
  ['c1cc[nH+]cc1', 'Pyridinium (PPTS)', 'schwache-saeure'], ['I', 'Iodwasserstoff', 'saeure'], ['O=C(O)CC(O)(CC(=O)O)C(=O)O', 'Citronensäure', 'schwache-saeure'],
  ['NN', 'Hydrazin', 'hydrid'], ['O=C[O-]', 'Formiat', 'hydrid'], ['CC[SiH](CC)CC', 'Triethylsilan', 'hydrid'], ['CC(C)C[AlH]CC(C)C', 'DIBAL-H', 'hydrid'],
  ['CC(C)[CH2][Al+][CH2]C(C)C', 'DIBAL-H', 'hydrid'], ['CN(C)[P+](On1nnc2ccccc21)(N(C)C)N(C)C', 'BOP', 'kupplungsreagenz'],
  ['O=C(N=NC(=O)N1CCCCC1)N1CCCCC1', 'ADDP', 'mitsunobu'], ['CC(C)[O-]', 'Isopropanolat', 'starke-base'], ['[O-]Cl', 'Hypochlorit', 'oxidation'],
  ['CCOC(=O)N=NC(=O)OCC', 'DEAD', 'mitsunobu'], ['CC(C)OC(=O)N=NC(=O)OC(C)C', 'DIAD', 'mitsunobu'],
  ['O=C(OOC(=O)c1ccccc1)c1ccccc1', 'Dibenzoylperoxid', 'radikalstarter'], ['CC(C)(C#N)N=NC(C)(C)C#N', 'AIBN', 'radikalstarter'],
  ['O=C(C=Cc1ccccc1)C=Cc1ccccc1', 'dba (Palladium-Ligand)', 'ligand'],
  ['Cc1ccccc1C', 'Xylol', 'loesungsmittel'], ['CCC(C)=O', 'Butanon', 'loesungsmittel'], ['CCCCC', 'Pentan', 'loesungsmittel'], ['CC(C)OC(C)C', 'Diisopropylether', 'loesungsmittel'],
  ['CN(C)P(=O)(N(C)C)N(C)C', 'HMPA', 'loesungsmittel'], ['CC(Cl)Cl', '1,1-Dichlorethan', 'loesungsmittel'], ['CSC', 'Dimethylsulfid', 'loesungsmittel'], ['CCCCCCCC', 'Octan', 'loesungsmittel'],
];

/** Gegenionen und Aufarbeitungssalze: tragen nichts zur Einordnung bei. */
const SPECTATORS = new Set(['[Na+]', '[K+]', '[Li+]', '[Cs+]', '[NH4+]', '[Cl-]', '[Br-]', '[I-]', '[Ca+2]', '[Mg+2]', 'O=S(=O)([O-])[O-]', 'O=S([O-])([O-])=S', 'O=S([O-])[O-]', '[C]', 'N#N', '[Ar]']);

/** Rangfolge, wenn ein Salz aus mehreren eingeordneten Ionen besteht. */
const PRIORITY = ['pd', 'pt', 'ni', 'edelmetall', 'cu', 'hydrid', 'kupplungsreagenz', 'lewis', 'starke-base', 'oxidation', 'metall-reduktion', 'fluorid', 'phasentransfer', 'anorganische-base', 'saeure', 'schwache-saeure'];

export interface AgentInfo {
  category: string;
  name?: string;
}

let knownByCanonical: Map<string, AgentInfo> | null = null;

function known(rdkit: MainModule): Map<string, AgentInfo> {
  if (!knownByCanonical) {
    knownByCanonical = new Map();
    for (const [smiles, name, category] of KNOWN_AGENTS) {
      const canonical = canonicalSmiles(rdkit, smiles);
      if (canonical && !knownByCanonical.has(canonical)) knownByCanonical.set(canonical, { name, category });
    }
  }
  return knownByCanonical;
}

/**
 * Ordnet einen Hilfsstoff einer Kategorie zu; null = unbekannt oder bloßes
 * Gegenion. Salze aus mehreren Ionen werden Ion für Ion eingeordnet.
 */
export function classifyAgent(rdkit: MainModule, smiles: string): AgentInfo | null {
  // Enzyme stehen in den Trainingsdaten als EC-Nummer, nicht als Struktur
  if (smiles.startsWith('EC:')) return { category: 'enzym', name: enzymeName(smiles) };
  const canonical = canonicalSmiles(rdkit, smiles) ?? smiles;
  const entry = known(rdkit).get(canonical);
  if (entry) return entry;
  if (SPECTATORS.has(canonical)) return null;
  if (canonical.includes('.')) {
    const parts = canonical
      .split('.')
      .map((part) => classifyFragment(rdkit, part))
      .filter((info): info is AgentInfo => Boolean(info));
    if (!parts.length) return null;
    parts.sort((a, b) => rank(a.category) - rank(b.category));
    return { category: parts[0].category };
  }
  return classifyFragment(rdkit, canonical);
}

function rank(category: string): number {
  const index = PRIORITY.indexOf(category);
  return index < 0 ? PRIORITY.length : index;
}

function classifyFragment(rdkit: MainModule, smiles: string): AgentInfo | null {
  const canonical = canonicalSmiles(rdkit, smiles) ?? smiles;
  const entry = known(rdkit).get(canonical);
  if (entry) return entry;
  if (SPECTATORS.has(canonical)) return null;

  if (/Pd/.test(canonical)) return { category: 'pd' };
  if (/Pt/.test(canonical)) return { category: 'pt' };
  if (/\[Ni|Ni\]|^Ni/.test(canonical)) return { category: 'ni' };
  if (/Rh|Ru|Ir/.test(canonical)) return { category: 'edelmetall' };
  if (/Cu/.test(canonical)) return { category: 'cu' };
  if (/^\[(Ag|Co|Mo|V|Cr|Bi)\]$|O=\[V\]|\[V\]=O/.test(canonical)) return { category: 'technisch' };
  if (/\[(Al|Ti|Zn|Sn|Sc|Yb|In|Bi)\]|Cl\[(Al|Ti|Zn|Sn|Fe)\]|\[Mg\+2\]|B\(F\)F/.test(canonical) && !/[CN]\[(Zn|Mg)\]/.test(canonical)) return { category: 'lewis' };
  if (/P\(c|P\(C/.test(canonical) && !/=O/.test(canonical)) return { category: 'ligand' };
  if (/\[(BH4|AlH4|BH3|BH)-?\]|\[AlH\]/.test(canonical)) return { category: 'hydrid' };
  if (/^\[(Fe|Zn|Sn)\]$/.test(canonical)) return { category: 'metall-reduktion' };
  if (/\[Li\]C|C\[Li\]|\[H-\]|\[N-\]/.test(canonical)) return { category: 'starke-base' };
  if (matchSmarts(rdkit, canonical, '[OX1-][CX4]').length && /\[(Na|K|Li)\+\]/.test(canonical)) return { category: 'starke-base' };
  if (/\[(Na|K|Cs|Li)\+\]/.test(canonical) && /OC\(=O\)\[O-\]|\[O-\]C\(=O\)|\[OH-\]|P\(=O\)\(\[O-\]\)/.test(canonical)) return { category: 'anorganische-base' };
  if (matchSmarts(rdkit, canonical, '[SX4](=O)(=O)[OX2H1]').length) return { category: 'saeure' };
  if (matchSmarts(rdkit, canonical, '[CX4]N([CX4])[CX4]').length && !/[+-]/.test(canonical) && !matchSmarts(rdkit, canonical, '[#6]=O').length) {
    return { category: 'aminbase' };
  }
  if (/\[N\+\]\(C+\)\(C+\)/.test(canonical) && /\[(Br|I|Cl)-\]/.test(canonical)) return { category: 'phasentransfer' };
  if (/\[F-\]/.test(canonical)) return { category: 'fluorid' };
  if (matchSmarts(rdkit, canonical, 'C(=O)Cl').length && !matchSmarts(rdkit, canonical, 'c').length) return { category: 'halogenierung' };
  if (matchSmarts(rdkit, canonical, '[OX2][OX2H1,OX1-]').length) return { category: 'oxidation' };
  if (/\[(Cr|Mn|Os)\]|\[O\]=\[(Cr|Mn|Os)\]|\[(Cr|Mn|Os)\+?\d?\]/.test(canonical) && /O/.test(canonical)) return { category: 'oxidation' };
  if (/\[(Sn|Zn|Ti|Al|Fe)\+\d\]/.test(canonical)) return { category: 'lewis' };
  return null;
}
