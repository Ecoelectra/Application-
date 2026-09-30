/**
 * Reaktionsfamilien mit Richtwerten für die Aktivierungsenergie.
 *
 * Die KI lernt aus den Patentdaten, WELCHE Reaktion abläuft und WELCHE
 * Hilfsstoffe dafür benutzt wurden. Wie hoch die Energiebarriere ist, steht
 * nicht in den Patenten. Dafür gibt es hier Richtwerte je Reaktionsfamilie:
 * effektive Aktivierungsenergien ohne und mit dem üblichen Katalysator oder
 * Aktivierungsreagenz. Sie sind so gewählt, dass die Arrhenius-Abschätzung in
 * activation.ts die üblichen Laborbedingungen wiedergibt (Suzuki-Kupplung
 * einige Stunden bei 80 °C, Boc-Abspaltung mit TFA bei Raumtemperatur,
 * Fischer-Veresterung unter Rückfluss). Sie geben die Größenordnung an – im
 * Einzelfall kann die Barriere um 10 bis 20 kJ/mol abweichen.
 */
import type { BondChange } from './templates';

export interface ReactionFamily {
  id: string;
  name: string;
  /** Was bei der Reaktion passiert, in einem Satz */
  description: string;
  /** Richtwert der Aktivierungsenergie ohne Katalysator in kJ/mol */
  eaUncatalyzed: number;
  /** Richtwert mit dem üblichen Katalysator oder Aktivator in kJ/mol */
  eaCatalyzed: number;
  /** Ohne Katalysator gibt es praktisch keinen Reaktionsweg */
  requiresCatalyst: boolean;
  /** Hilfsstoff-Kategorien (siehe agents.ts), die die Barriere senken */
  catalysts: string[];
  /** Wie der Katalysator die Barriere senkt */
  effect: string;
  /** Molekularität des geschwindigkeitsbestimmenden Schritts, für den Stoßfaktor */
  bimolecular: boolean;
}

export const FAMILIES: ReactionFamily[] = [
  {
    id: 'suzuki', name: 'Suzuki-Kupplung', description: 'Arylhalogenid und Boronsäure verknüpfen sich zu einer neuen C–C-Bindung.',
    eaUncatalyzed: 190, eaCatalyzed: 95, requiresCatalyst: true, catalysts: ['pd', 'anorganische-base'],
    effect: 'Palladium(0) schiebt sich in die C–Halogen-Bindung ein, übernimmt den Arylrest vom Bor (Transmetallierung; die Base aktiviert dabei die Boronsäure) und knüpft beide Reste in der reduktiven Eliminierung zusammen.',
    bimolecular: true,
  },
  {
    id: 'stille', name: 'Stille-Kupplung', description: 'Arylhalogenid und Organozinnverbindung verknüpfen sich.',
    eaUncatalyzed: 190, eaCatalyzed: 100, requiresCatalyst: true, catalysts: ['pd'],
    effect: 'Palladium durchläuft oxidative Addition, Transmetallierung vom Zinn und reduktive Eliminierung.', bimolecular: true,
  },
  {
    id: 'kreuzkupplung', name: 'Palladium-katalysierte C–C-Kupplung (Heck, Sonogashira, Negishi)', description: 'Ein Arylhalogenid wird mit einem Alken, Alkin oder einer metallorganischen Verbindung verknüpft.',
    eaUncatalyzed: 190, eaCatalyzed: 95, requiresCatalyst: true, catalysts: ['pd', 'cu', 'aminbase'],
    effect: 'Palladium aktiviert die C–Halogen-Bindung; bei der Sonogashira-Kupplung überträgt Kupfer(I) das Alkin.', bimolecular: true,
  },
  {
    id: 'grignard', name: 'Addition einer metallorganischen Verbindung', description: 'Grignard- oder Organolithiumverbindung greift eine Carbonyl- oder Nitrilgruppe an.',
    eaUncatalyzed: 55, eaCatalyzed: 55, requiresCatalyst: false, catalysts: [],
    effect: 'Die C–Metall-Bindung ist stark polar; die Reaktion läuft auch ohne Katalysator schon bei tiefer Temperatur.', bimolecular: true,
  },
  {
    id: 'buchwald', name: 'Buchwald-Hartwig-Aminierung', description: 'Arylhalogenid und Amin verknüpfen sich zur Aryl-Stickstoff-Bindung.',
    eaUncatalyzed: 160, eaCatalyzed: 102, requiresCatalyst: true, catalysts: ['pd', 'ligand', 'starke-base'],
    effect: 'Ohne aktivierende Gruppen am Ring ist der Angriff des Amins am Aromaten versperrt; Palladium umgeht das über oxidative Addition und reduktive Eliminierung.',
    bimolecular: true,
  },
  {
    id: 'snar', name: 'Nucleophile aromatische Substitution (SNAr)', description: 'Ein Nucleophil ersetzt das Halogen an einem elektronenarmen Aromaten oder Heteroaromaten.',
    eaUncatalyzed: 108, eaCatalyzed: 100, requiresCatalyst: false, catalysts: ['aminbase', 'anorganische-base'],
    effect: 'Elektronenziehende Gruppen oder Ring-Stickstoff stabilisieren den Meisenheimer-Komplex; eine Base fängt die freiwerdende Säure ab. Meist genügt Erhitzen.',
    bimolecular: true,
  },
  {
    id: 'amid-saeure', name: 'Amidbildung aus Carbonsäure und Amin', description: 'Carbonsäure und Amin verbinden sich unter Wasserabspaltung zum Amid.',
    eaUncatalyzed: 125, eaCatalyzed: 80, requiresCatalyst: false, catalysts: ['kupplungsreagenz', 'aminbase'],
    effect: 'Ohne Hilfe bilden Säure und Amin nur ein Ammoniumsalz; erst über 160 °C spaltet sich Wasser ab. Ein Kupplungsreagenz (HATU, EDC, DCC) wandelt die OH-Gruppe in eine gute Abgangsgruppe um – dann reagiert das Amin schon bei Raumtemperatur. Das Reagenz wird dabei verbraucht; es ist ein Aktivator, kein Katalysator im strengen Sinn.',
    bimolecular: true,
  },
  {
    id: 'amid-acylhalogenid', name: 'Acylierung mit Säurechlorid', description: 'Säurechlorid und Amin oder Alkohol reagieren unter HCl-Abspaltung.',
    eaUncatalyzed: 55, eaCatalyzed: 45, requiresCatalyst: false, catalysts: ['aminbase', 'dmap'],
    effect: 'Säurechloride sind sehr reaktiv; eine Base fängt das HCl ab, DMAP beschleunigt über ein Acylpyridinium-Ion zusätzlich.', bimolecular: true,
  },
  {
    id: 'amid-ester', name: 'Aminolyse eines Esters', description: 'Ein Amin verdrängt den Alkohol aus einem Ester.',
    eaUncatalyzed: 110, eaCatalyzed: 100, requiresCatalyst: false, catalysts: ['starke-base', 'lewis'],
    effect: 'Alkoholat-Basen oder Lewis-Säuren machen den Ester elektrophiler oder das Amin nucleophiler.', bimolecular: true,
  },
  {
    id: 'harnstoff', name: 'Addition an Isocyanat', description: 'Amin oder Alkohol addiert an ein Isocyanat zu Harnstoff oder Carbamat.',
    eaUncatalyzed: 60, eaCatalyzed: 50, requiresCatalyst: false, catalysts: ['aminbase'],
    effect: 'Isocyanate sind so elektrophil, dass meist kein Katalysator nötig ist; bei Alkoholen beschleunigen Amine oder Zinnverbindungen.', bimolecular: true,
  },
  {
    id: 'ester', name: 'Veresterung', description: 'Carbonsäure oder Säurederivat und Alkohol bilden einen Ester.',
    eaUncatalyzed: 115, eaCatalyzed: 100, requiresCatalyst: false, catalysts: ['saeure', 'kupplungsreagenz', 'dmap'],
    effect: 'Das Proton der Säure (Schwefelsäure, p-Toluolsulfonsäure) lagert sich an den Carbonyl-Sauerstoff an und macht das Carbonyl-C so elektrophil, dass der Alkohol angreifen kann (Fischer-Veresterung).',
    bimolecular: true,
  },
  {
    id: 'sulfonamid', name: 'Sulfonylierung', description: 'Sulfonylchlorid reagiert mit Amin oder Alkohol zu Sulfonamid oder Sulfonat.',
    eaUncatalyzed: 80, eaCatalyzed: 70, requiresCatalyst: false, catalysts: ['aminbase', 'dmap'],
    effect: 'Eine Base fängt das HCl ab; DMAP beschleunigt die Übertragung.', bimolecular: true,
  },
  {
    id: 'n-alkylierung', name: 'N-Alkylierung (SN2)', description: 'Ein Amin ersetzt Halogen oder Sulfonat an einem sp³-Kohlenstoff.',
    eaUncatalyzed: 105, eaCatalyzed: 95, requiresCatalyst: false, catalysts: ['anorganische-base', 'aminbase'],
    effect: 'Die Base hält das Amin unprotoniert und damit nucleophil; Iodid-Zusatz (Finkelstein) beschleunigt bei Chloriden.', bimolecular: true,
  },
  {
    id: 'o-alkylierung', name: 'Williamson-Ethersynthese', description: 'Ein Alkoholat oder Phenolat ersetzt ein Halogen am sp³-Kohlenstoff.',
    eaUncatalyzed: 120, eaCatalyzed: 95, requiresCatalyst: false, catalysts: ['anorganische-base', 'starke-base', 'phasentransfer'],
    effect: 'Der neutrale Alkohol ist ein schwaches Nucleophil; erst die Base macht daraus das stark nucleophile Alkoholat.', bimolecular: true,
  },
  {
    id: 's-alkylierung', name: 'S-Alkylierung', description: 'Ein Thiol ersetzt ein Halogen am sp³-Kohlenstoff.',
    eaUncatalyzed: 95, eaCatalyzed: 80, requiresCatalyst: false, catalysts: ['anorganische-base', 'aminbase'],
    effect: 'Thiolat-Ionen sind sehr gute Nucleophile; die Base erzeugt sie.', bimolecular: true,
  },
  {
    id: 'reduktive-aminierung', name: 'Reduktive Aminierung', description: 'Aldehyd oder Keton und Amin bilden ein Imin, das sofort zum Amin reduziert wird.',
    eaUncatalyzed: 150, eaCatalyzed: 80, requiresCatalyst: true, catalysts: ['hydrid', 'schwache-saeure'],
    effect: 'Säure beschleunigt die Iminbildung; ein Hydrid-Reduktionsmittel (NaBH(OAc)3) liefert die Wasserstoffatome. Ohne Reduktionsmittel bleibt es beim Imin.',
    bimolecular: true,
  },
  {
    id: 'kondensation', name: 'Kondensation zu Imin oder Heterocyclus', description: 'Eine Carbonylverbindung reagiert unter Wasserabspaltung mit einem Stickstoff-Nucleophil.',
    eaUncatalyzed: 95, eaCatalyzed: 85, requiresCatalyst: false, catalysts: ['saeure', 'schwache-saeure'],
    effect: 'Säure protoniert die Carbonylgruppe und später die OH-Gruppe, die dann als Wasser abgeht.', bimolecular: true,
  },
  {
    id: 'cc-verknuepfung', name: 'C–C-Verknüpfung (Aldol, Michael, Alkylierung)', description: 'Ein Carbanion oder Enolat greift ein Elektrophil an.',
    eaUncatalyzed: 110, eaCatalyzed: 75, requiresCatalyst: false, catalysts: ['starke-base', 'anorganische-base', 'saeure'],
    effect: 'Die Base erzeugt aus der C–H-aciden Verbindung das nucleophile Enolat; Säure aktiviert alternativ das Elektrophil.', bimolecular: true,
  },
  {
    id: 'schutzgruppe-n', name: 'Abspaltung einer N-Schutzgruppe', description: 'Eine Carbamat-Schutzgruppe (Boc, Cbz) oder ein Amid wird vom Stickstoff abgespalten.',
    eaUncatalyzed: 125, eaCatalyzed: 80, requiresCatalyst: false, catalysts: ['saeure', 'pd', 'wasserstoff'],
    effect: 'Boc-Gruppen zerfallen erst über 150 °C von selbst; Säure (TFA, HCl) protoniert das Carbamat, das dann schon bei Raumtemperatur in CO2 und Isobuten zerfällt. Cbz-Gruppen spaltet man mit Wasserstoff an Palladium.',
    bimolecular: false,
  },
  {
    id: 'esterspaltung', name: 'Esterspaltung (Verseifung)', description: 'Ein Ester wird zur Carbonsäure gespalten.',
    eaUncatalyzed: 110, eaCatalyzed: 85, requiresCatalyst: false, catalysts: ['anorganische-base', 'saeure'],
    effect: 'Hydroxid-Ionen greifen das Carbonyl-C direkt an (Verseifung); Säure aktiviert den Ester durch Protonierung.', bimolecular: true,
  },
  {
    id: 'etherspaltung', name: 'Etherspaltung', description: 'Ein Methyl- oder Benzylether wird zum Alkohol oder Phenol gespalten.',
    eaUncatalyzed: 160, eaCatalyzed: 80, requiresCatalyst: true, catalysts: ['lewis', 'saeure', 'pd', 'wasserstoff'],
    effect: 'Ethersauerstoff ist schwach basisch; erst eine starke Lewis-Säure (BBr3) oder Bromwasserstoff macht die Alkylgruppe angreifbar. Benzylether spaltet man hydrierend an Palladium.',
    bimolecular: false,
  },
  {
    id: 'nitro-reduktion', name: 'Reduktion einer Nitrogruppe', description: 'Eine Nitrogruppe wird zur Aminogruppe reduziert.',
    eaUncatalyzed: 170, eaCatalyzed: 70, requiresCatalyst: true, catalysts: ['wasserstoff', 'pd', 'ni', 'metall-reduktion'],
    effect: 'Wasserstoff reagiert erst an einer Palladium- oder Nickeloberfläche; alternativ liefern Eisen oder Zinn in Säure die Elektronen.', bimolecular: true,
  },
  {
    id: 'hydrierung', name: 'Katalytische Hydrierung', description: 'Wasserstoff addiert an eine C=C- oder C≡C-Bindung.',
    eaUncatalyzed: 180, eaCatalyzed: 60, requiresCatalyst: true, catalysts: ['wasserstoff', 'pd', 'pt', 'ni'],
    effect: 'Die direkte Addition von H2 an eine Doppelbindung ist symmetrieverboten. An der Metalloberfläche zerfällt H2 in Atome, die schrittweise auf das adsorbierte Alken übergehen.',
    bimolecular: true,
  },
  {
    id: 'reduktion', name: 'Reduktion einer Carbonyl- oder Nitrilgruppe', description: 'Aldehyd, Keton, Ester, Amid oder Nitril wird zu Alkohol oder Amin reduziert.',
    eaUncatalyzed: 160, eaCatalyzed: 65, requiresCatalyst: true, catalysts: ['hydrid', 'wasserstoff', 'pd', 'ni'],
    effect: 'Ein Hydrid-Reagenz (NaBH4, LiAlH4) überträgt H⁻ direkt auf das Carbonyl-C; mit H2 braucht es einen Metallkatalysator.', bimolecular: true,
  },
  {
    id: 'oxidation', name: 'Oxidation', description: 'Ein Alkohol, Sulfid oder Amin wird oxidiert.',
    eaUncatalyzed: 130, eaCatalyzed: 75, requiresCatalyst: true, catalysts: ['oxidation'],
    effect: 'Luftsauerstoff reagiert zu langsam; ein Oxidationsmittel (Dess-Martin, mCPBA, TEMPO/Bleichlauge) übernimmt die Elektronen über einen energiearmen Weg.',
    bimolecular: true,
  },
  {
    id: 'halogenierung', name: 'Halogenierung und Aktivierung', description: 'Eine OH-Gruppe wird durch Halogen ersetzt oder ein Halogen eingeführt.',
    eaUncatalyzed: 115, eaCatalyzed: 95, requiresCatalyst: false, catalysts: ['halogenierung', 'lewis'],
    effect: 'Thionyl- oder Oxalylchlorid machen aus der OH-Gruppe eine gute Abgangsgruppe; eine Spur DMF wirkt dabei als Katalysator (Vilsmeier-Zwischenstufe).', bimolecular: true,
  },
  {
    id: 'silyl', name: 'Silyl-Schutzgruppe', description: 'Eine Silylgruppe wird eingeführt oder abgespalten.',
    eaUncatalyzed: 85, eaCatalyzed: 70, requiresCatalyst: false, catalysts: ['aminbase', 'fluorid'],
    effect: 'Imidazol oder Amine aktivieren das Silylchlorid; Fluorid spaltet die Si–O-Bindung wegen der sehr starken Si–F-Bindung.', bimolecular: true,
  },
  {
    id: 'aromaten-substitution', name: 'Elektrophile aromatische Substitution', description: 'Ein Elektrophil (Nitronium-Ion, Br⁺, Acylium-Ion) ersetzt ein H-Atom am Aromaten.',
    eaUncatalyzed: 130, eaCatalyzed: 88, requiresCatalyst: false, catalysts: ['saeure', 'lewis'],
    effect: 'Konzentrierte Schwefelsäure erzeugt aus Salpetersäure das Nitronium-Ion NO₂⁺; Lewis-Säuren wie FeBr3 oder AlCl3 machen aus Br2 oder Acylchloriden starke Elektrophile, die den stabilen aromatischen Ring angreifen können.',
    bimolecular: true,
  },
  {
    id: 'biokatalyse', name: 'Enzymatische Umsetzung', description: 'Ein Enzym setzt den Stoff in Wasser bei milden Bedingungen um – so wie im Stoffwechsel.',
    eaUncatalyzed: 125, eaCatalyzed: 55, requiresCatalyst: false, catalysts: ['enzym'],
    effect: 'Das Enzym bindet das Substrat in seiner aktiven Tasche, richtet es passend aus und stabilisiert den Übergangszustand – die Barriere sinkt um 50 bis 80 kJ/mol.', bimolecular: true,
  },
  // ---------- Technische Katalyse (Quelle «Technische Katalyse») ----------
  // Richtwerte so gewählt, dass die Arrhenius-Abschätzung die technische
  // Arbeitstemperatur bei 1 bar trifft; Druck beschleunigt gasförmige Partner.
  {
    id: 'gaskatalyse-hydrierung', name: 'Hydrierung von CO₂ und CO (Methanisierung, Methanolsynthese)', description: 'Kohlenstoffdioxid oder Kohlenmonoxid reagiert an einer Metalloberfläche mit Wasserstoff zu Methan oder Methanol.',
    eaUncatalyzed: 300, eaCatalyzed: 145, requiresCatalyst: true, catalysts: ['ni', 'cu', 'edelmetall', 'technisch'],
    effect: 'Nickel oder Ruthenium spalten Wasserstoff und CO₂ an ihrer Oberfläche und bauen Methan auf (Sabatier-Reaktion); Kupfer auf Zinkoxid lenkt zu Methanol. Ohne Katalysator reagieren die Gase praktisch nicht. Hoher Druck begünstigt das Gleichgewicht, weil aus vielen Gasteilchen wenige werden; zu hohe Temperatur schiebt es zurück.',
    bimolecular: true,
  },
  {
    id: 'reformierung', name: 'Reformierung und Wassergas-Shift', description: 'Methan, Kohlenmonoxid, Kohlenstoffdioxid, Wasser und Wasserstoff werden an Nickel oder Kupfer ineinander umgewandelt.',
    eaUncatalyzed: 320, eaCatalyzed: 170, requiresCatalyst: true, catalysts: ['ni', 'cu', 'technisch'],
    effect: 'Nickel spaltet C–H- und O–H-Bindungen an seiner Oberfläche; die Gleichgewichte hängen stark von Temperatur und Druck ab (Reformierung endotherm, Shift-Reaktion leicht exotherm).',
    bimolecular: true,
  },
  {
    id: 'hydroformylierung', name: 'Hydroformylierung und Carbonylierung (Oxo-Synthese)', description: 'Kohlenmonoxid wird mit Wasserstoff an ein Alken oder an Methanol angelagert – es entsteht ein Aldehyd bzw. Essigsäure.',
    eaUncatalyzed: 250, eaCatalyzed: 105, requiresCatalyst: true, catalysts: ['edelmetall', 'technisch'],
    effect: 'Ein Rhodium- oder Cobaltkomplex bindet Alken, CO und Wasserstoff nacheinander und fügt sie zusammen; 20–300 bar Synthesegas halten den Katalysator aktiv.',
    bimolecular: true,
  },
  {
    id: 'gaskatalyse-oxidation', name: 'Katalytische Oxidation in der Gasphase', description: 'Ein Kohlenwasserstoff oder Alkohol wird an einer Metalloberfläche mit Sauerstoff gezielt oxidiert (Ethylenoxid, Formaldehyd).',
    eaUncatalyzed: 250, eaCatalyzed: 140, requiresCatalyst: true, catalysts: ['technisch', 'pt', 'cu', 'edelmetall'],
    effect: 'Silber bindet Sauerstoff so, dass er ein Sauerstoffatom auf die Doppelbindung überträgt, statt sie ganz zu verbrennen.',
    bimolecular: true,
  },
  {
    id: 'dehydrierung', name: 'Katalytische Dehydrierung', description: 'Einem Alkohol oder Cycloalkan wird Wasserstoff entzogen – es entsteht ein Aldehyd, Keton oder Aromat.',
    eaUncatalyzed: 300, eaCatalyzed: 150, requiresCatalyst: true, catalysts: ['cu', 'pt', 'ni', 'technisch'],
    effect: 'Kupfer oder Platin lösen Wasserstoff an ihrer Oberfläche ab; niedriger Druck und hohe Temperatur begünstigen das Gleichgewicht, weil Wasserstoffgas entsteht.',
    bimolecular: false,
  },
  {
    id: 'gaskatalyse-hydratisierung', name: 'Hydratisierung von Alkenen (Gasphase)', description: 'Wasserdampf lagert sich an ein Alken an – es entsteht ein Alkohol.',
    eaUncatalyzed: 250, eaCatalyzed: 150, requiresCatalyst: true, catalysts: ['saeure'],
    effect: 'Phosphorsäure auf Kieselgel protoniert die Doppelbindung; technisch bei 250–300 °C und etwa 70 bar.',
    bimolecular: true,
  },
  {
    id: 'co2-fixierung', name: 'CO₂-Einbau in Epoxide (cyclische Carbonate)', description: 'Kohlenstoffdioxid wird in den Ring eines Epoxids eingebaut.',
    eaUncatalyzed: 180, eaCatalyzed: 115, requiresCatalyst: true, catalysts: ['phasentransfer', 'lewis', 'technisch'],
    effect: 'Ein Halogenid-Ion öffnet den Epoxidring, CO₂ lagert sich an, und der Ring schließt sich zum Carbonat; Lewis-Säuren (Zink, Aluminium) beschleunigen das.',
    bimolecular: true,
  },
  {
    id: 'sonstige', name: 'Sonstige Umsetzung', description: 'Eine seltenere Reaktionsart ohne eigene Familie.',
    eaUncatalyzed: 110, eaCatalyzed: 90, requiresCatalyst: false, catalysts: [],
    effect: 'Welche Hilfsstoffe die Barriere senken, zeigen die Patentdaten dieser Vorlage.', bimolecular: true,
  },
];

export const FAMILY_BY_ID: ReadonlyMap<string, ReactionFamily> = new Map(FAMILIES.map((entry) => [entry.id, entry]));

const HALOGEN = new Set(['Cl', 'Br', 'I', 'F']);
const isCarbon = (label: string) => label === 'c' || label.startsWith('C');
const pair = (change: BondChange, x: (label: string) => boolean, y: (label: string) => boolean) =>
  (x(change.a) && y(change.b)) || (x(change.b) && y(change.a));
const is = (...labels: string[]) => (label: string) => labels.includes(label);

/**
 * Ordnet eine Vorlage anhand ihrer Bindungsänderungen einer Familie zu.
 * `agentShare` sind die Anteile der Hilfsstoff-Kategorien in den Patenten
 * dieser Vorlage (unterscheidet etwa SNAr und Buchwald-Hartwig).
 */
export function classifyFamily(changes: BondChange[], agentShare: Record<string, number> = {}): string {
  const formed = changes.filter((change) => change.before === 0 && change.after > 0);
  const broken = changes.filter((change) => change.before > 0 && change.after === 0);
  const lowered = changes.filter((change) => change.after > 0 && change.after < change.before);
  const raised = changes.filter((change) => change.before > 0 && change.after > change.before);
  const any = (list: BondChange[], x: (label: string) => boolean, y: (label: string) => boolean) => list.some((change) => pair(change, x, y));

  const leavingHalogenOrSulfonate = (x: (label: string) => boolean) => any(broken, x, (label) => HALOGEN.has(label) || label === 'OS');

  // Reaktionen aus Enzymdatenbanken: Katalysator ist das Enzym
  if ((agentShare.enzym ?? 0) >= 0.5) return 'biokatalyse';

  // Nitrogruppe als Abgangsgruppe am Aromaten (SNAr)
  if (any(formed, is('c'), is('N', 'n', 'O', 'S')) && any(broken, is('c'), is('N+O'))) return 'snar';
  // Elektrophile Substitution am Aromaten (Nitrierung, Halogenierung mit Lewis-Säure)
  if (any(formed, is('c'), is('N+O'))) return 'aromaten-substitution';

  // Kupplungen am Aromaten
  if (any(formed, isCarbon, isCarbon) && any(broken, isCarbon, is('B'))) return 'suzuki';
  if (any(formed, isCarbon, isCarbon) && any(broken, isCarbon, is('Sn'))) return 'stille';
  if (any(formed, isCarbon, isCarbon) && any(broken, isCarbon, is('Mg', 'Li', 'Zn'))) {
    return any(lowered, is('C=O', 'C#'), is('O', 'N')) || any(broken, is('C=O'), (label) => label !== 'C' && label !== 'c') ? 'grignard' : 'kreuzkupplung';
  }
  // Halogen-Metall-Austausch und Addition an C=O (ArBr + BuLi, dann Keton)
  if (any(formed, is('c'), isCarbon) && leavingHalogenOrSulfonate(is('c')) && any(lowered, is('C=O'), is('O'))) return 'grignard';
  if (any(formed, is('c'), (label) => isCarbon(label)) && leavingHalogenOrSulfonate(is('c'))) return 'kreuzkupplung';
  if (any(formed, is('c'), is('N', 'n', 'O', 'S')) && leavingHalogenOrSulfonate(is('c'))) {
    return (agentShare.pd ?? 0) + (agentShare.cu ?? 0) >= 0.3 ? 'buchwald' : 'snar';
  }

  // Acylierungen
  // Verliert das Carbonyl-C seinen Sauerstoff, ist es keine Acylierung, sondern
  // eine Kondensation (C=N) oder eine reduktive Aminierung (C–N)
  // (Bei Acylierungen vertauscht die Atomzuordnung oft die beiden Sauerstoffatome
  // der Säure: Dann bricht C=O, aber ein C–O wird zur Doppelbindung.)
  const carbonylLost =
    changes.some((change) => pair(change, is('C=O'), is('O')) && change.before === 2 && change.after === 0) &&
    !raised.some((change) => pair(change, is('C=O'), is('O', 'OC=O')));
  if (carbonylLost && any(formed, is('C=O'), is('N', 'n', 'O', 'S'))) {
    return formed.some((change) => pair(change, is('C=O'), is('N', 'n')) && change.after >= 2) ? 'kondensation' : 'reduktive-aminierung';
  }
  if (carbonylLost && any(formed, is('C=O'), isCarbon)) return 'cc-verknuepfung';

  // «OC=O» steht für den Säure-OH-Sauerstoff wie für Anhydrid-Sauerstoff (Boc2O).
  // Ohne Kupplungsreagenz, aber mit Base spricht das für ein Anhydrid.
  const anhydride = (agentShare.kupplungsreagenz ?? 0) < 0.1 && (agentShare.aminbase ?? 0) + (agentShare.dmap ?? 0) + (agentShare['anorganische-base'] ?? 0) >= 0.3;
  if (any(formed, is('C=O'), is('N', 'n'))) {
    if (any(lowered, is('C=O'), is('N'))) return 'harnstoff';
    if (any(broken, is('C=O'), (label) => HALOGEN.has(label))) return 'amid-acylhalogenid';
    if (any(broken, is('C=O'), is('OC=O'))) return anhydride ? 'amid-acylhalogenid' : 'amid-saeure';
    if (any(broken, is('C=O'), is('O'))) {
      // Ester-Sauerstoff trägt einen Rest, Säure-Sauerstoff nur H – beides steht hier als «O»
      return 'amid-saeure';
    }
    if (any(lowered, is('C=O'), is('O'))) return 'kondensation';
    return 'amid-saeure';
  }
  if (any(formed, is('C=O'), is('O', 'OC=O'))) {
    if (any(broken, is('C=O'), (label) => HALOGEN.has(label))) return 'amid-acylhalogenid';
    if (any(broken, is('C=O'), is('OC=O')) && anhydride) return 'amid-acylhalogenid';
    return 'ester';
  }
  if (any(formed, is('S'), is('N', 'O', 'n')) && any(broken, is('S'), (label) => HALOGEN.has(label))) return 'sulfonamid';

  // Schutzgruppen und Spaltungen
  if (any(formed, is('Si'), is('O', 'N')) || any(broken, is('Si'), is('O', 'N', 'C'))) return 'silyl';
  if (!formed.length && any(broken, is('N', 'n'), is('C=O'))) return 'schutzgruppe-n';
  if (!formed.length && any(broken, is('OC=O'), is('C'))) return 'esterspaltung';
  if (!formed.length && any(broken, is('C=O'), is('O', 'OC=O')) && !lowered.length) return 'esterspaltung';
  if (!formed.length && any(broken, is('O'), is('C')) && !any(broken, is('O'), (label) => HALOGEN.has(label))) return 'etherspaltung';
  if (!formed.length && any(broken, is('N', 'n'), is('C')) && !lowered.length) return 'schutzgruppe-n';

  // Reduktionen und Oxidationen
  if (any(broken, is('N+O'), is('O')) || any(lowered, is('N+O'), is('O'))) return 'nitro-reduktion';
  if (!formed.length && any(lowered, is('C=C', 'C#', 'c'), is('C=C', 'C#', 'c'))) return 'hydrierung';
  if (any(lowered, is('C=O', 'C#'), is('O', 'N')) && !any(formed, isCarbon, isCarbon)) {
    return any(formed, is('C=O'), is('N')) || any(formed, is('C'), is('N')) ? 'reduktive-aminierung' : 'reduktion';
  }
  if (any(broken, is('C=O'), is('O', 'OC=O')) && !formed.length) return 'reduktion';
  if (any(formed, isCarbon, is('N')) && any(broken, is('C=O'), is('O'))) return 'reduktive-aminierung';
  if (raised.some((change) => pair(change, isCarbon, is('O'))) || any(formed, is('S', 'N', 'n'), is('O'))) return 'oxidation';

  // Alkohol als Elektrophil (Mitsunobu, Fischer-Veresterung mit vertauschter Zuordnung)
  if (any(formed, is('C'), is('OC=O')) && any(broken, is('C'), is('O'))) return 'ester';
  if (any(formed, is('C'), is('O', 'N', 'n')) && any(broken, is('C'), is('O'))) return 'o-alkylierung';
  // Azid-Reduktion
  if (!formed.length && any(broken, is('N'), is('N'))) return 'reduktion';

  // Substitutionen am sp³-Kohlenstoff
  if (any(formed, is('C'), is('N', 'n')) && leavingHalogenOrSulfonate(is('C'))) return 'n-alkylierung';
  if (any(formed, is('C'), is('O', 'OC=O')) && leavingHalogenOrSulfonate(is('C'))) return 'o-alkylierung';
  if (any(formed, is('C'), is('S')) && leavingHalogenOrSulfonate(is('C'))) return 's-alkylierung';
  if (any(formed, isCarbon, (label) => HALOGEN.has(label))) return 'halogenierung';
  if (any(formed, is('C'), is('N', 'n', 'O'))) return 'n-alkylierung';

  if (any(formed, isCarbon, is('N', 'n')) && any(broken, is('C=O'), is('O'))) return 'kondensation';
  if (any(formed, isCarbon, isCarbon)) return 'cc-verknuepfung';
  return 'sonstige';
}
