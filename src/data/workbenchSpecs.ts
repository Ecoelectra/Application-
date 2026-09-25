/**
 * Was eine Reaktion in der Werkbank braucht.
 *
 * Die Reagenzangaben der Reaktionsbeschreibungen sind für Menschen geschrieben
 * («Salzsäure oder Natronlauge», «Lewis-Säure (AlCl₃, ZnCl₂)») und lassen sich
 * nicht zuverlässig maschinell auswerten. Deshalb steht hier für jede Vorlage
 * ausdrücklich, welche Stoffe verbraucht werden, welche Katalyse sie braucht und
 * unter welchen Bedingungen sie abläuft.
 */

/** Art der Katalyse, die sich in der Werkbank einstellen lässt. */
export type Catalysis = 'sauer' | 'basisch' | 'metall' | 'lewis';

export const CATALYSIS_LABELS: Record<Catalysis, string> = {
  sauer: 'Säurekatalyse (H⁺)',
  basisch: 'Basenkatalyse (OH⁻)',
  metall: 'Metallkatalysator (Pd, Pt, Ni)',
  lewis: 'Lewis-Säure (AlCl₃, FeBr₃)',
};

export interface Requirements {
  /** Erhitzen nötig */
  heat?: boolean;
  /** Kühlen nötig – beim Erhitzen läuft die Reaktion anders oder gefährlich */
  cold?: boolean;
  /** Licht (UV) nötig */
  light?: boolean;
  /** Elektrolysezelle nötig */
  electro?: boolean;
  /** nur in wässriger Lösung */
  aqueous?: boolean;
  /** absolut wasserfrei */
  dry?: boolean;
  /** als Feststoff, nicht in Lösung (etwa beim Erhitzen von Salzen) */
  solid?: boolean;
  /** Katalyse; mehrere Einträge heißen: jede davon genügt */
  catalysis?: Catalysis[];
  /** bestimmte Katalysatoren, von denen einer vorhanden sein muss */
  catalysts?: string[];
  /** Mindesttemperatur in °C (gilt, wenn die Temperatur als Zahl eingestellt ist) */
  minTemperature?: number;
  /** Höchsttemperatur in °C beim Kühlen */
  maxTemperature?: number;
  /** Mindestdruck in bar */
  minPressure?: number;
}

export interface WorkbenchSpec extends Requirements {
  /**
   * Stoffe, die verbraucht werden. Jede innere Liste ist eine Auswahl – einer
   * der genannten Stoffe muss im Gefäß sein.
   */
  needs?: string[][];
  /** Die Vorlage darf denselben Stoff für beide Edukte verwenden */
  self?: boolean;
  /** Was man im Reagenzglas sieht, wenn es charakteristisch ist */
  observation?: string;
}

/** Stoffe, die eine Katalyse bereitstellen, wenn man sie ins Gefäß gibt. */
export const CATALYST_SUBSTANCES: Record<Catalysis, string[]> = {
  sauer: [
    'schwefelsaeure', 'salzsaeure', 'phosphorsaeure', 'p-toluolsulfonsaeure',
    'methansulfonsaeure', 'trifluoressigsaeure', 'natriumhydrogensulfat',
  ],
  basisch: [
    'natriumhydroxid', 'kaliumhydroxid', 'lithiumhydroxid', 'calciumhydroxid',
    'natriumethanolat', 'natriummethanolat', 'kalium-tert-butanolat', 'natriumhydrid',
    'lda', 'piperidin', 'pyridin', 'triethylamin', 'dipea', 'dmap', 'natriumcarbonat',
    'kaliumcarbonat', 'natriumacetat', 'kaliumphosphat',
  ],
  metall: [
    'palladium-auf-aktivkohle', 'platin', 'nickel', 'tetrakis-triphenylphosphin-palladium',
    'palladium-ii-acetat', 'grubbs-katalysator', 'lindlar-katalysator',
  ],
  lewis: ['aluminiumchlorid', 'eisen-iii-chlorid', 'zinkchlorid', 'eisen'],
};

const OXIDANTS_STRONG = ['kaliumpermanganat', 'kaliumdichromat'];
const OXIDANTS_MILD = ['pcc', 'dess-martin-periodinan', 'oxalylchlorid', 'tempo'];
const HYDRIDES = ['natriumborhydrid', 'lithiumaluminiumhydrid', 'natriumcyanoborhydrid'];
const STRONG_BASES = ['natriumhydroxid', 'kaliumhydroxid', 'lithiumhydroxid'];
const ALKOXIDES = ['natriumethanolat', 'natriummethanolat', 'kalium-tert-butanolat', 'natriumhydrid'];

export const WORKBENCH_SPECS: Record<string, WorkbenchSpec> = {
  // ---------- Carbonylchemie ----------
  'fischer-veresterung': { catalysis: ['sauer'], heat: true },
  esterverseifung: { needs: [STRONG_BASES], heat: true },
  'saure-esterhydrolyse': { needs: [['wasser']], catalysis: ['sauer'], heat: true },
  'saeurechlorid-socl2': { needs: [['thionylchlorid', 'oxalylchlorid']], heat: true, dry: true },
  'schotten-baumann-amid': { catalysis: ['basisch'] },
  'amidkupplung-edc': { needs: [['dcc']], dry: true },
  'nabh4-reduktion': {
    needs: [HYDRIDES],
    observation: 'Unter leichter Gasentwicklung verschwindet die Carbonylverbindung; nach der Aufarbeitung liegt der Alkohol vor.',
  },
  'alkohol-oxidation-keton': { needs: [[...OXIDANTS_STRONG, ...OXIDANTS_MILD, 'natriumhypochlorit']] },
  'alkohol-oxidation-aldehyd': { needs: [OXIDANTS_MILD], dry: true },
  'alkohol-oxidation-saeure': {
    needs: [OXIDANTS_STRONG],
    heat: true,
    observation: 'Die violette Permanganatlösung entfärbt sich, brauner Braunstein fällt aus.',
  },
  'aldehyd-oxidation-saeure': { needs: [[...OXIDANTS_STRONG, 'wasserstoffperoxid', 'sauerstoff']] },
  'aldol-kondensation': { self: true, catalysis: ['basisch', 'sauer'] },
  'claisen-kondensation': { self: true, needs: [ALKOXIDES], dry: true, heat: true },
  'grignard-addition': { dry: true },
  'wittig-reaktion': { dry: true },
  'reduktive-aminierung': { needs: [HYDRIDES], catalysis: ['sauer'] },
  'acetal-schutzgruppe': { catalysis: ['sauer'], heat: true },
  'lialh4-esterreduktion': { needs: [['lithiumaluminiumhydrid']], dry: true },
  cannizzaro: { self: true, needs: [STRONG_BASES], heat: true },
  'knoevenagel-kondensation': { catalysis: ['basisch'], heat: true },
  'claisen-schmidt': {
    catalysis: ['basisch'],
    observation: 'Die Lösung färbt sich gelb; das Enon kristallisiert als gelber Feststoff aus.',
  },
  'mannich-reaktion': { needs: [['formaldehyd']], catalysis: ['sauer'], heat: true },
  'malonester-synthese': { needs: [ALKOXIDES], dry: true, heat: true },
  'acetylierung-anhydrid': { catalysis: ['sauer', 'basisch'], heat: true },
  'saeurechlorid-alkohol': { catalysis: ['basisch'], dry: true },
  oximbildung: {
    observation: 'Das Oxim fällt meist als farbloser, kristalliner Feststoff mit scharfem Schmelzpunkt aus.',
  },
  'beckmann-umlagerung': { catalysis: ['sauer'], heat: true },
  'wolff-kishner': { needs: [['hydrazin']], catalysis: ['basisch'], heat: true },
  'baeyer-villiger': { needs: [['mcpba', 'wasserstoffperoxid']] },
  umesterung: { catalysis: ['basisch', 'sauer'], heat: true },
  amidhydrolyse: { catalysis: ['sauer', 'basisch'], heat: true },
  'iodoform-probe': {
    needs: [['iod', 'lugolsche-loesung']],
    catalysis: ['basisch'],
    observation: 'Ein gelber Niederschlag von Iodoform fällt aus, dazu der typische «Krankenhausgeruch».',
  },

  // ---------- Substitution und Eliminierung ----------
  'sn2-cyanid': { heat: true },
  'williamson-ethersynthese': { catalysis: ['basisch'], dry: true },
  'alkohol-zu-halogenalkan': { needs: [['bromwasserstoffsaeure']], catalysis: ['sauer'], heat: true },
  'e2-dehydrohalogenierung': { catalysis: ['basisch'], heat: true },
  'alkohol-dehydratisierung': {
    catalysis: ['sauer'],
    heat: true,
    observation: 'Das Alken entweicht als Gas bzw. destilliert ab; Bromwasser wird davon entfärbt.',
  },
  'ether-kondensation': { self: true, catalysis: ['sauer'], heat: true },
  'nitril-hydrolyse': { needs: [['wasser']], catalysis: ['sauer', 'basisch'], heat: true },
  'epoxid-oeffnung': { catalysis: ['sauer', 'basisch'] },
  finkelstein: {
    needs: [['natriumiodid', 'kaliumiodid']],
    heat: true,
    observation: 'In Aceton fällt weißes Natriumchlorid bzw. -bromid aus – das Zeichen, dass der Austausch läuft.',
  },
  'appel-reaktion': { needs: [['triphenylphosphin'], ['tetrabrommethan']], dry: true },
  tosylierung: { needs: [['tosylchlorid']], catalysis: ['basisch'] },
  'snar-substitution': {
    needs: [['natriummethanolat']],
    heat: true,
    observation: 'Die Lösung färbt sich tiefrot – das ist der Meisenheimer-Komplex als Zwischenstufe.',
  },
  'gabriel-synthese': { heat: true },
  'grignard-bildung': {
    needs: [['magnesium']],
    dry: true,
    observation: 'Die Magnesiumspäne lösen sich, die Lösung trübt sich grau und beginnt von selbst zu sieden.',
  },

  // ---------- Alkene, Alkine, Aromaten ----------
  'katalytische-hydrierung': { needs: [['wasserstoff']], catalysis: ['metall'] },
  'lindlar-hydrierung': { needs: [['wasserstoff']], catalysts: ['lindlar-katalysator'] },
  'bromaddition-alken': {
    needs: [['brom']],
    observation: 'Das braune Bromwasser wird sofort entfärbt – der klassische Nachweis für C=C-Doppelbindungen.',
  },
  'hydrohalogenierung-markovnikov': { needs: [['bromwasserstoffsaeure']] },
  'alken-hydratisierung': { needs: [['wasser']], catalysis: ['sauer'], heat: true },
  'hydroborierung-oxidation': { needs: [['boran'], ['wasserstoffperoxid']], catalysis: ['basisch'], dry: true },
  'epoxidierung-mcpba': { needs: [['mcpba']] },
  dihydroxylierung: {
    needs: [['kaliumpermanganat']],
    cold: true,
    observation: 'Die violette Permanganatlösung entfärbt sich, brauner Braunstein fällt aus (Baeyer-Probe).',
  },
  ozonolyse: { needs: [['ozon']], cold: true },
  'diels-alder': { heat: true },
  'michael-addition': { catalysis: ['basisch'] },
  'olefinmetathese': { self: true, catalysts: ['grubbs-katalysator'] },
  'radikalische-chlorierung': {
    needs: [['chlor']],
    light: true,
    observation: 'Im Dunkeln passiert nichts. Unter Licht verschwindet die grünliche Chlorfarbe; an feuchter Luft bilden sich HCl-Nebel.',
  },
  'nitrierung-aromat': {
    needs: [['salpetersaeure']],
    catalysts: ['schwefelsaeure'],
    observation: 'Es bildet sich ein gelbliches, schweres Öl, das nach Bittermandeln riecht.',
  },
  'sulfonierung-aromat': { needs: [['schwefelsaeure', 'schwefeltrioxid']], heat: true },
  'aromaten-bromierung': {
    needs: [['brom']],
    catalysis: ['lewis'],
    observation: 'Die Bromfarbe verschwindet langsam; entweichender Bromwasserstoff färbt feuchtes Indikatorpapier rot.',
  },
  'friedel-crafts-acylierung': { catalysis: ['lewis'], dry: true },
  'friedel-crafts-alkylierung': { catalysis: ['lewis'], dry: true },
  'seitenkettenoxidation': {
    needs: [['kaliumpermanganat']],
    heat: true,
    observation: 'Die violette Farbe verschwindet, Braunstein fällt aus; beim Ansäuern kristallisiert die Carbonsäure.',
  },
  'nitro-reduktion': { needs: [['eisen', 'zink', 'zinn-ii-chlorid']], catalysis: ['sauer'], heat: true },
  diazotierung: { needs: [['natriumnitrit']], catalysis: ['sauer'], cold: true },
  azokupplung: {
    cold: true,
    catalysis: ['basisch'],
    observation: 'Sofort entsteht ein kräftig gefärbter Azofarbstoff – gelb, orange oder rot.',
  },
  'sandmeyer-reaktion': { needs: [['kupfer-i-bromid', 'kupfer-i-chlorid']] },
  'kolbe-schmitt': { needs: [['kohlenstoffdioxid']], catalysis: ['basisch'], heat: true },

  // ---------- Übergangsmetallkatalyse ----------
  'suzuki-kupplung': { catalysis: ['metall'], heat: true },
  'heck-reaktion': { catalysis: ['metall'], heat: true },
  'sonogashira-kupplung': { catalysis: ['metall'] },
  'buchwald-hartwig': { catalysis: ['metall'], heat: true, dry: true },

  // ---------- Elektrochemie ----------
  'kolbe-elektrolyse': { self: true, electro: true },
  'hofer-moest': { electro: true },
  'shono-oxidation': { electro: true },
  'baizer-hydrodimerisierung': { self: true, electro: true },
  'tempo-anodische-oxidation': { needs: [['tempo']], electro: true },
  'kathodische-nitroreduktion': { electro: true, catalysis: ['sauer'] },
  'elektrochemische-pinakolkupplung': { self: true, electro: true },
  'elektrocarboxylierung': { needs: [['kohlenstoffdioxid']], electro: true },

  // ---------- übrige ----------
  'nitril-reduktion': { needs: [['lithiumaluminiumhydrid']], dry: true },
};

/** Ab welcher Katalyse eine Vorlage läuft – für Hinweise bei falscher Wahl. */
export function describeCatalysis(options: Catalysis[]): string {
  return options.map((entry) => CATALYSIS_LABELS[entry]).join(' oder ');
}
