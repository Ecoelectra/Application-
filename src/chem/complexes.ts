/**
 * Komplexchemie: Aus Zentralion und Liganden wird ein Koordinationskomplex.
 *
 * Abgeleitet werden Formel, Name nach IUPAC (deutsche Schreibweise), Ladung,
 * Koordinationszahl, Geometrie, d-Elektronenkonfiguration, Spinzustand,
 * magnetisches Moment, Ligandenfeld-Stabilisierungsenergie, eine Abschätzung
 * der Farbe, mögliche Isomere und – soweit bekannt – die Stabilitätskonstante.
 *
 * Grundlagen: Kristallfeld- bzw. Ligandenfeldtheorie, spektrochemische Reihe,
 * Jørgensen-Regel (Δo ≈ f · g). Messwerte für bekannte Komplexe haben Vorrang
 * vor den Abschätzungen.
 */

export type Geometry = 'linear' | 'tetraedrisch' | 'quadratisch-planar' | 'trigonal-bipyramidal' | 'oktaedrisch';

export interface CentralIon {
  id: string;
  symbol: string;
  charge: number;
  /** deutscher Elementname für kationische und neutrale Komplexe */
  element: string;
  /** Stamm für anionische Komplexe (Cupr → Cuprat) */
  stem: string;
  /** Zahl der d-Elektronen */
  d: number;
  /** Übergangsreihe: 3 = 3d, 4 = 4d, 5 = 5d, 0 = Hauptgruppe */
  series: 0 | 3 | 4 | 5;
  /** übliche Koordinationszahlen */
  preferredCN: number[];
  /** Jørgensen-Faktor g in 1000 cm⁻¹, soweit tabelliert */
  g?: number;
}

export interface Ligand {
  id: string;
  /** Anzeigeform, z. B. «NH₃» */
  label: string;
  /** Formel für die Summenformel des Komplexes */
  formula: string;
  charge: number;
  /** Ligandenname nach IUPAC (deutsch) */
  name: string;
  /** Zähnigkeit */
  denticity: number;
  /** Stellung in der spektrochemischen Reihe (größer = stärkeres Feld) */
  rank: number;
  /** Jørgensen-Faktor f, soweit tabelliert */
  f?: number;
  /** Abkürzung, die in der Formel steht (en, ox, EDTA) */
  abbreviation?: string;
  /** Donoratom(e) */
  donor: string;
  /** Name im Komplexnamen in Klammern setzen (organische Liganden: tetrakis(methylamin)) */
  enclose?: boolean;
}

const ion = (
  id: string, symbol: string, charge: number, element: string, stem: string,
  d: number, series: 0 | 3 | 4 | 5, preferredCN: number[], g?: number,
): CentralIon => ({ id, symbol, charge, element, stem, d, series, preferredCN, g });

/** Zentralionen der Komplex-Werkbank. g-Werte nach Jørgensen (in 10³ cm⁻¹). */
export const CENTRAL_IONS: CentralIon[] = [
  ion('cu2', 'Cu', 2, 'Kupfer', 'Cupr', 9, 3, [4, 6], 12.6),
  ion('cu1', 'Cu', 1, 'Kupfer', 'Cupr', 10, 3, [2, 4]),
  ion('ag1', 'Ag', 1, 'Silber', 'Argent', 10, 4, [2]),
  ion('au3', 'Au', 3, 'Gold', 'Aur', 8, 5, [4]),
  ion('fe2', 'Fe', 2, 'Eisen', 'Ferr', 6, 3, [6], 10.4),
  ion('fe3', 'Fe', 3, 'Eisen', 'Ferr', 5, 3, [6, 4], 14.0),
  ion('co2', 'Co', 2, 'Cobalt', 'Cobalt', 7, 3, [6, 4], 9.3),
  ion('co3', 'Co', 3, 'Cobalt', 'Cobalt', 6, 3, [6], 18.2),
  ion('ni2', 'Ni', 2, 'Nickel', 'Nickel', 8, 3, [6, 4], 8.7),
  ion('mn2', 'Mn', 2, 'Mangan', 'Mangan', 5, 3, [6], 8.0),
  ion('cr3', 'Cr', 3, 'Chrom', 'Chrom', 3, 3, [6], 17.4),
  ion('ti3', 'Ti', 3, 'Titan', 'Titan', 1, 3, [6], 20.3),
  ion('zn2', 'Zn', 2, 'Zink', 'Zink', 10, 3, [4, 6]),
  ion('hg2', 'Hg', 2, 'Quecksilber', 'Mercur', 10, 5, [4, 2]),
  ion('pd2', 'Pd', 2, 'Palladium', 'Pallad', 8, 4, [4]),
  ion('pt2', 'Pt', 2, 'Platin', 'Platin', 8, 5, [4]),
  ion('pt4', 'Pt', 4, 'Platin', 'Platin', 6, 5, [6], 36.0),
  ion('al3', 'Al', 3, 'Aluminium', 'Alumin', 0, 0, [6, 4]),
  ion('ca2', 'Ca', 2, 'Calcium', 'Calci', 0, 0, [6]),
  ion('mg2', 'Mg', 2, 'Magnesium', 'Magnesi', 0, 0, [6]),
  ion('cd2', 'Cd', 2, 'Cadmium', 'Cadm', 10, 4, [4, 6]),
  ion('pb2', 'Pb', 2, 'Blei', 'Plumb', 10, 0, [4, 6]),
  ion('sn2', 'Sn', 2, 'Zinn', 'Stann', 10, 0, [4]),
  ion('ba2', 'Ba', 2, 'Barium', 'Bari', 0, 0, [6]),
];

const lig = (
  id: string, label: string, formula: string, charge: number, name: string,
  denticity: number, rank: number, donor: string, f?: number, abbreviation?: string,
): Ligand => ({ id, label, formula, charge, name, denticity, rank, donor, f, abbreviation });

/**
 * Liganden, geordnet nach der spektrochemischen Reihe:
 * I⁻ < Br⁻ < Cl⁻ < F⁻ < OH⁻ < C₂O₄²⁻ < H₂O < NCS⁻ < py < NH₃ < en < bipy < phen < NO₂⁻ < CN⁻ < CO
 * f-Werte nach Jørgensen.
 */
export const LIGANDS: Ligand[] = [
  lig('i', 'I⁻', 'I', -1, 'iodido', 1, 1, 'I'),
  lig('br', 'Br⁻', 'Br', -1, 'bromido', 1, 2, 'Br', 0.72),
  lig('s2o3', 'S₂O₃²⁻', 'S2O3', -2, 'thiosulfato', 1, 3, 'S'),
  lig('cl', 'Cl⁻', 'Cl', -1, 'chlorido', 1, 4, 'Cl', 0.78),
  lig('f', 'F⁻', 'F', -1, 'fluorido', 1, 5, 'F', 0.9),
  lig('oh', 'OH⁻', 'OH', -1, 'hydroxido', 1, 6, 'O'),
  lig('ox', 'C₂O₄²⁻', 'C2O4', -2, 'oxalato', 2, 7, 'O', 0.99, 'ox'),
  lig('h2o', 'H₂O', 'H2O', 0, 'aqua', 1, 8, 'O', 1.0),
  lig('edta', 'EDTA⁴⁻', 'C10H12N2O8', -4, 'ethylendiamintetraacetato', 6, 8.5, 'N, O', undefined, 'edta'),
  lig('scn', 'SCN⁻', 'NCS', -1, 'thiocyanato-κN', 1, 9, 'N', 1.02),
  lig('gly', 'gly⁻', 'C2H4NO2', -1, 'glycinato', 2, 9.5, 'N, O', undefined, 'gly'),
  { ...lig('py', 'py', 'C5H5N', 0, 'pyridin', 1, 10, 'N', 1.23, 'py'), enclose: true },
  lig('nh3', 'NH₃', 'NH3', 0, 'ammin', 1, 11, 'N', 1.25),
  lig('en', 'en', 'C2H8N2', 0, 'ethylendiamin', 2, 12, 'N', 1.28, 'en'),
  lig('bipy', 'bipy', 'C10H8N2', 0, '2,2′-bipyridin', 2, 13, 'N', 1.33, 'bipy'),
  lig('phen', 'phen', 'C12H8N2', 0, '1,10-phenanthrolin', 2, 14, 'N', undefined, 'phen'),
  lig('no2', 'NO₂⁻', 'NO2', -1, 'nitrito-κN', 1, 15, 'N'),
  lig('cn', 'CN⁻', 'CN', -1, 'cyanido', 1, 16, 'C', 1.7),
  lig('co', 'CO', 'CO', 0, 'carbonyl', 1, 17, 'C'),
  // Organische Liganden, die in der Werkbank aus Stoffen der Datenbank entstehen
  { ...lig('tu', 'tu', 'CH4N2S', 0, 'thioharnstoff', 1, 3.5, 'S', undefined, 'tu'), enclose: true },
  lig('phenolato', 'PhO⁻', 'C6H5O', -1, 'phenolato', 1, 5.5, 'O'),
  lig('oac', 'OAc⁻', 'CH3COO', -1, 'acetato', 1, 6.5, 'O', undefined, 'OAc'),
  lig('sal', 'sal²⁻', 'C7H4O3', -2, 'salicylato', 2, 6.8, 'O, O', undefined, 'sal'),
  lig('tart', 'tart²⁻', 'C4H4O6', -2, 'tartrato', 2, 7.1, 'O, O', undefined, 'tart'),
  lig('glyc', 'glyc²⁻', 'C3H6O3', -2, 'glycerolato', 2, 7.2, 'O, O', undefined, 'glyc'),
  lig('acac', 'acac⁻', 'C5H7O2', -1, 'acetylacetonato', 2, 7.5, 'O, O', undefined, 'acac'),
  lig('cit', 'cit³⁻', 'C6H5O7', -3, 'citrato', 3, 7.8, 'O, O, O', undefined, 'cit'),
  lig('oxin', 'ox⁻', 'C9H6NO', -1, 'chinolin-8-olato', 2, 9.8, 'N, O', undefined, 'oxin'),
  { ...lig('im', 'im', 'C3H4N2', 0, 'imidazol', 1, 10.5, 'N', undefined, 'im'), enclose: true },
  lig('dmg', 'dmg⁻', 'C4H7N2O2', -1, 'dimethylglyoximato', 2, 12.5, 'N, N', undefined, 'dmg'),
  { ...lig('pph3', 'PPh₃', 'C18H15P', 0, 'triphenylphosphan', 1, 15.5, 'P', undefined, 'PPh3'), enclose: true },
];

export const CENTRAL_ION_BY_ID = new Map(CENTRAL_IONS.map((entry) => [entry.id, entry]));
export const LIGAND_BY_ID = new Map(LIGANDS.map((entry) => [entry.id, entry]));

export interface LigandCount {
  ligand: Ligand;
  count: number;
}

/** Liganden, die bei 3d-Metallen ein so starkes Feld erzeugen, dass sich Elektronen paaren. */
function strongFieldFor(metal: CentralIon, ligand: Ligand): boolean {
  if (metal.series >= 4) return true;
  if (['cn', 'co', 'no2'].includes(ligand.id)) return true;
  if (metal.id === 'co3') return ligand.id !== 'f';
  if (metal.id === 'fe2') return ['bipy', 'phen'].includes(ligand.id);
  return false;
}

/** Bekannte Komplexe mit Messwerten und Beobachtungen. */
export interface KnownComplex {
  color: string;
  /** Farbton für die Anzeige */
  swatch: string;
  trivialName?: string;
  /** gemessene Ligandenfeldaufspaltung in cm⁻¹ */
  deltaMeasured?: number;
  note?: string;
}

/** Schlüssel: Zentralion|ligand:anzahl,… (Liganden alphabetisch). */
const KNOWN: Record<string, KnownComplex> = {
  'cu2|h2o:6': { color: 'hellblau', swatch: '#7cc4e8', deltaMeasured: 12600, note: 'Farbe jeder verdünnten Kupfer(II)-salzlösung. Der Oktaeder ist durch den Jahn-Teller-Effekt gestreckt.' },
  'cu2|h2o:2,nh3:4': { color: 'tiefblau', swatch: '#1e3fae', deltaMeasured: 15100, note: 'Mit wenig Ammoniak fällt zuerst hellblaues Kupferhydroxid aus, das sich im Überschuss tiefblau löst – ein klassischer Kupfernachweis.' },
  'cu2|nh3:4': { color: 'tiefblau', swatch: '#1e3fae', note: 'Die vier Ammoniakliganden bilden ein Quadrat; die beiden Wasserliganden darüber und darunter sind nur schwach gebunden.' },
  'cu2|cl:4': { color: 'gelbgrün', swatch: '#b5c93b', note: 'Entsteht in konzentrierter Salzsäure; beim Verdünnen kehrt die blaue Farbe des Aquakomplexes zurück.' },
  'cu2|en:2': { color: 'blauviolett', swatch: '#4b3fbf', note: 'Stabiler als der Amminkomplex – der Chelateffekt.' },
  'cu2|edta:1': { color: 'hellblau', swatch: '#5fb4df' },
  'cu2|gly:2': { color: 'tiefblau', swatch: '#2c56c8', note: 'Kupferglycinat bildet schöne blaue Nadeln – ein beliebter Praktikumsversuch.' },
  'cu1|cl:2': { color: 'farblos', swatch: 'transparent', note: 'd¹⁰ – keine d-d-Übergänge möglich.' },
  'ag1|nh3:2': { color: 'farblos', swatch: 'transparent', trivialName: 'Tollens-Reagenz (Kation)', note: 'Silberchlorid löst sich in Ammoniak unter Bildung dieses Komplexes – so trennt man AgCl von AgI.' },
  'ag1|cn:2': { color: 'farblos', swatch: 'transparent', note: 'Grundlage der Cyanidlaugerei und der galvanischen Versilberung.' },
  'ag1|s2o3:2': { color: 'farblos', swatch: 'transparent', note: 'Fixiersalz löst unbelichtetes Silberbromid aus dem Film – das Prinzip der Schwarz-Weiß-Fotografie.' },
  'au3|cl:4': { color: 'gelb', swatch: '#e8b923', trivialName: 'Tetrachloridoaurat (Goldchlorwasserstoffsäure)', note: 'Entsteht beim Lösen von Gold in Königswasser.' },
  'fe2|h2o:6': { color: 'blassgrün', swatch: '#b9e3b0', deltaMeasured: 10400 },
  'fe3|h2o:6': { color: 'blassviolett (Lösungen meist gelbbraun durch Hydrolyse)', swatch: '#e2b86a', deltaMeasured: 13700 },
  'fe3|h2o:5,scn:1': { color: 'blutrot', swatch: '#9b111e', note: 'Empfindlicher Nachweis für Eisen(III)-Ionen. Mit Fluorid verschwindet die Farbe, weil der farblose Fluoridokomplex stabiler ist.' },
  'fe3|f:6': { color: 'farblos', swatch: 'transparent', note: 'High-Spin-d⁵: Alle d-d-Übergänge sind spinverboten – daher farblos.' },
  'fe3|ox:3': { color: 'grün', swatch: '#3f9b3a', note: 'Lichtempfindlich – Grundlage der Blaupause (Cyanotypie).' },
  'fe2|cn:6': { color: 'gelb', swatch: '#f0d23c', deltaMeasured: 33800, trivialName: 'Anion des Gelben Blutlaugensalzes', note: 'Low-Spin-d⁶ und diamagnetisch. Trotz der Cyanidliganden kaum giftig, weil der Komplex sehr stabil ist.' },
  'fe3|cn:6': { color: 'rotorange', swatch: '#d9622b', deltaMeasured: 35000, trivialName: 'Anion des Roten Blutlaugensalzes' },
  'fe2|phen:3': { color: 'rot', swatch: '#c1272d', trivialName: 'Ferroin', note: 'Redoxindikator: Ferroin (rot) wird zu Ferriin (blassblau) oxidiert.' },
  'fe2|bipy:3': { color: 'rot', swatch: '#c1272d' },
  'co2|h2o:6': { color: 'rosa', swatch: '#ef9ab8', deltaMeasured: 9300 },
  'co2|cl:4': { color: 'blau', swatch: '#1f4fd1', note: 'Cobaltchlorid-Papier: trocken blau, feucht rosa – ein Feuchtigkeitsindikator. Das Gleichgewicht zwischen Aqua- und Chloridokomplex verschiebt sich auch mit der Temperatur.' },
  'co3|nh3:6': { color: 'gelborange', swatch: '#e59a2b', deltaMeasured: 22900, note: 'Werner nutzte die Cobalt-Amminkomplexe, um die Koordinationstheorie zu beweisen (Nobelpreis 1913).' },
  'co3|cl:1,nh3:5': { color: 'purpur', swatch: '#8a2d7a', trivialName: 'Purpureokomplex' },
  'co3|en:3': { color: 'gelb', swatch: '#e5b72b', note: 'Chiral: Δ- und Λ-Form lassen sich trennen – Werner bewies damit die oktaedrische Anordnung.' },
  'ni2|h2o:6': { color: 'grün', swatch: '#3fa34d', deltaMeasured: 8500 },
  'ni2|nh3:6': { color: 'blauviolett', swatch: '#5b4fc9', deltaMeasured: 10750 },
  'ni2|en:3': { color: 'violett', swatch: '#7b3fbf', deltaMeasured: 11500 },
  'ni2|cn:4': { color: 'gelb', swatch: '#e8c43a', note: 'd⁸ mit starkem Feld: quadratisch-planar und diamagnetisch.' },
  'ni2|cl:4': { color: 'blau', swatch: '#3561c9', note: 'd⁸ mit schwachem Feld: tetraedrisch und paramagnetisch.' },
  'mn2|h2o:6': { color: 'blassrosa', swatch: '#f6d3df', deltaMeasured: 7800, note: 'High-Spin-d⁵: Alle Übergänge sind spinverboten – die Farbe ist deshalb sehr blass.' },
  'cr3|h2o:6': { color: 'violett', swatch: '#7a3d9d', deltaMeasured: 17400 },
  'cr3|nh3:6': { color: 'gelb', swatch: '#e5c23a', deltaMeasured: 21500 },
  'ti3|h2o:6': { color: 'violett', swatch: '#8b4bb0', deltaMeasured: 20300, note: 'd¹ – das Lehrbuchbeispiel für einen einzigen d-d-Übergang (Absorption bei 493 nm).' },
  'zn2|nh3:4': { color: 'farblos', swatch: 'transparent', note: 'd¹⁰ – keine d-d-Übergänge. Zinkhydroxid löst sich deshalb farblos in Ammoniak.' },
  'zn2|oh:4': { color: 'farblos', swatch: 'transparent', trivialName: 'Tetrahydroxidozinkat', note: 'Entsteht, wenn sich Zinkhydroxid im Laugenüberschuss wieder löst (Amphoterie).' },
  'al3|oh:4': { color: 'farblos', swatch: 'transparent', trivialName: 'Tetrahydroxidoaluminat', note: 'Entsteht beim Lösen von Aluminium oder Aluminiumhydroxid in Natronlauge.' },
  'al3|f:6': { color: 'farblos', swatch: 'transparent', trivialName: 'Anion des Kryoliths', note: 'Kryolith senkt in der Schmelzflusselektrolyse den Schmelzpunkt des Aluminiumoxids.' },
  'al3|h2o:6': { color: 'farblos', swatch: 'transparent', note: 'Reagiert deutlich sauer – das kleine, hoch geladene Ion polarisiert die Wasserliganden.' },
  'hg2|i:4': { color: 'blassgelb', swatch: '#f1e08a', trivialName: 'Anion von Nesslers Reagenz', note: 'Nesslers Reagenz weist Ammoniak durch eine gelbbraune Färbung nach.' },
  'pt2|cl:2,nh3:2': { color: 'gelb', swatch: '#e8c94a', trivialName: 'Cisplatin (cis-Isomer)', note: 'Nur das cis-Isomer wirkt als Krebsmedikament; das trans-Isomer ist unwirksam.' },
  'pt2|cl:4': { color: 'rot', swatch: '#b8323e', trivialName: 'Tetrachloridoplatinat' },
  'ca2|edta:1': { color: 'farblos', swatch: 'transparent', note: 'Grundlage der Wasserhärtebestimmung durch komplexometrische Titration.' },
  'cu1|nh3:2': { color: 'farblos', swatch: 'transparent', note: 'An der Luft wird die farblose Lösung rasch blau: Sauerstoff oxidiert Kupfer(I) zum Tetraamminkupfer(II)-Ion.' },
  'cu1|cn:4': { color: 'farblos', swatch: 'transparent' },
  'cu2|acac:2': { color: 'blau', swatch: '#2f5fb3', note: 'Neutraler Chelatkomplex, löslich in organischen Lösungsmitteln.' },
  'cu2|tart:2': { color: 'tiefblau', swatch: '#1f3fa8', trivialName: 'Fehlingsche Lösung', note: 'Das Tartrat hält Kupfer(II) auch in stark alkalischer Lösung gelöst – deshalb fällt bei der Fehling-Probe kein Kupferhydroxid aus.' },
  'cu2|glyc:2': { color: 'tiefblau', swatch: '#243fb0', note: 'Frisch gefälltes Kupferhydroxid löst sich in alkalischer Glycerinlösung tiefblau – ein Nachweis für mehrwertige Alkohole.' },
  'cu2|cit:2': { color: 'blau', swatch: '#3a6fcf', note: 'Grundlage der Benedict-Lösung, einer Variante der Fehling-Probe.' },
  'fe3|acac:3': { color: 'rot', swatch: '#b3261e', note: 'Tiefrote Kristalle; Eisen(III) wird von Enolen generell intensiv gefärbt.' },
  'fe3|h2o:4,sal:1': { color: 'violett', swatch: '#6a2c91', note: 'Die violette Färbung mit Eisen(III)-chlorid ist ein Nachweis für Salicylsäure und andere Phenole.' },
  'fe3|phenolato:6': { color: 'violett', swatch: '#5e2a84', note: 'Eisen(III)-chlorid-Probe: Phenole färben die Lösung violett.' },
  'ni2|dmg:2': { color: 'himbeerrot', swatch: '#c2185b', note: 'Tschugaeff-Reaktion: Der rote Niederschlag weist Nickel noch in sehr kleinen Mengen nach. Zwei Wasserstoffbrücken halten die beiden Liganden in einer Ebene.' },
  'al3|oxin:3': { color: 'gelb', swatch: '#e6c229', note: 'Fluoresziert grün im UV-Licht – ein empfindlicher Aluminiumnachweis.' },
  'co2|scn:4': { color: 'blau', swatch: '#1f4fd1', note: 'Vogel-Reaktion: Mit Thiocyanat in Aceton oder Amylalkohol wird die Lösung tiefblau – ein Nachweis für Cobalt(II).' },
  'cd2|nh3:4': { color: 'farblos', swatch: 'transparent' },
  'cu2|py:4': { color: 'tiefblau', swatch: '#2a4fb8' },
  'co2|nh3:6': { color: 'gelbbraun', swatch: '#c9a15a', note: 'Luftsauerstoff oxidiert den Komplex rasch zum rotbraunen Cobalt(III)-Komplex.' },
  'cd2|i:4': { color: 'farblos', swatch: 'transparent' },
  'pb2|oh:4': { color: 'farblos', swatch: 'transparent', note: 'Bleihydroxid ist amphoter und löst sich im Laugenüberschuss.' },
  'sn2|oh:4': { color: 'farblos', swatch: 'transparent', note: 'Zinn(II)-hydroxid ist amphoter und löst sich im Laugenüberschuss.' },
  'cr3|oh:6': { color: 'grün', swatch: '#3c8d4f', note: 'Chrom(III)-hydroxid ist amphoter: Im Laugenüberschuss entsteht das grüne Hexahydroxidochromat(III).' },
  'fe3|cl:4': { color: 'gelb', swatch: '#e2b227', note: 'Entsteht in konzentrierter Salzsäure; färbt die Lösung gelb.' },
  'pd2|cl:2,pph3:2': { color: 'gelb', swatch: '#e8c43a', note: 'Bekannte Katalysatorvorstufe für Kreuzkupplungen.' },
  'pt4|cl:6': { color: 'orangegelb', swatch: '#e59a2b', trivialName: 'Anion der Hexachloridoplatinsäure', note: 'Entsteht beim Lösen von Platin in Königswasser.' },
  'mg2|edta:1': { color: 'farblos', swatch: 'transparent' },
};

/** Hinterlegte Stabilitätskonstante lg β eines Komplexes (Wasserliganden zählen nicht mit). */
export function stabilityConstant(metal: CentralIon, ligands: LigandCount[]): number | undefined {
  const key = `${metal.id}|${ligands
    .filter((entry) => entry.count > 0 && entry.ligand.id !== 'h2o')
    .map((entry) => `${entry.ligand.id}:${entry.count}`)
    .sort()
    .join(',')}`;
  return STABILITY[key];
}

/**
 * Bruttostabilitätskonstanten lg β für die Bildung aus dem Aquakomplex.
 * Literaturwerte bei 25 °C, gerundet (Martell/Smith, Critical Stability Constants).
 */
const STABILITY: Record<string, number> = {
  'cu2|nh3:4': 13.1,
  'cu2|en:2': 19.6,
  'cu2|edta:1': 18.8,
  'cu2|gly:2': 15.1,
  'ni2|nh3:6': 8.6,
  'ni2|en:3': 18.3,
  'ni2|cn:4': 30.2,
  'ni2|edta:1': 18.6,
  'co2|nh3:6': 5.1,
  'co2|en:3': 13.9,
  'co2|edta:1': 16.3,
  'co3|nh3:6': 35.2,
  'fe3|scn:1': 2.1,
  'fe3|cn:6': 43.6,
  'fe3|edta:1': 25.1,
  'fe2|cn:6': 35.4,
  'fe2|phen:3': 21.3,
  'fe2|edta:1': 14.3,
  'ag1|nh3:2': 7.2,
  'ag1|cn:2': 20.5,
  'ag1|s2o3:2': 13.3,
  'ag1|edta:1': 7.3,
  'zn2|nh3:4': 9.5,
  'zn2|cn:4': 16.7,
  'zn2|edta:1': 16.5,
  'mn2|edta:1': 13.9,
  'cr3|edta:1': 23.4,
  'al3|edta:1': 16.1,
  'ca2|edta:1': 10.7,
  'mg2|edta:1': 8.7,
  'hg2|edta:1': 21.7,
  'hg2|cl:4': 15.1,
  'hg2|i:4': 29.8,
  'hg2|cn:4': 41.4,
  'hg2|nh3:4': 19.3,
  'cd2|nh3:4': 7.1,
  'cd2|cn:4': 17.9,
  'cd2|i:4': 5.4,
  'cd2|en:3': 12.1,
  'cd2|edta:1': 16.5,
  'cu1|nh3:2': 10.9,
  'cu1|cl:2': 5.5,
  'cu1|cn:4': 30.3,
  'cu2|ox:2': 10.3,
  'cu2|acac:2': 14.9,
  'zn2|oh:4': 15.5,
  'zn2|en:3': 12.1,
  'al3|oh:4': 33.0,
  'al3|f:6': 19.8,
  'al3|ox:3': 16.3,
  'fe3|ox:3': 20.2,
  'fe3|acac:3': 26.3,
  'fe3|sal:1': 16.4,
  'fe2|bipy:3': 17.4,
  'ni2|bipy:3': 20.2,
  'ni2|phen:3': 24.3,
  'ni2|dmg:2': 17.2,
  'co3|en:3': 48.7,
  'ag1|py:2': 4.1,
  'pb2|edta:1': 18.0,
  'ba2|edta:1': 7.9,
  'fe2|nh3:6': 3.7,
};

export interface OrbitalLevel {
  label: string;
  /** Zahl entarteter Orbitale in diesem Niveau */
  orbitals: number;
  /** Elektronen je Orbital (0, 1 oder 2) */
  occupancy: number[];
  /** relative Energie für die Zeichnung (0 = unten) */
  energy: number;
}

export interface Isomerism {
  kind: string;
  count: number;
  description: string;
}

export interface ComplexAnalysis {
  valid: boolean;
  problems: string[];
  metal: CentralIon;
  ligands: LigandCount[];
  coordinationNumber: number;
  charge: number;
  /** Formel mit Klammern und Ladung, z. B. «[Cu(NH3)4(H2O)2]2+» */
  formula: string;
  /** Formel mit tief- und hochgestellten Zeichen */
  formulaPretty: string;
  name: string;
  geometry: Geometry;
  oxidationState: number;
  dElectrons: number;
  spin: 'high-spin' | 'low-spin' | 'keine Wahl';
  levels: OrbitalLevel[];
  unpaired: number;
  /** Spin-only-Moment in Bohrschen Magnetonen */
  magneticMoment: number;
  magnetism: 'diamagnetisch' | 'paramagnetisch';
  /** Ligandenfeld-Stabilisierungsenergie in Einheiten von Δ */
  lfse?: number;
  /** Ligandenfeldaufspaltung in cm⁻¹ (gemessen oder abgeschätzt) */
  delta?: number;
  deltaSource?: 'gemessen' | 'Jørgensen-Abschätzung';
  /** absorbierte Wellenlänge in nm */
  absorbedNm?: number;
  color: string;
  swatch: string;
  colorSource: 'gemessen' | 'abgeschätzt' | 'd0/d10';
  trivialName?: string;
  note?: string;
  isomers: Isomerism[];
  chelate: boolean;
  logBeta?: number;
  /** Bildungsgleichung aus dem Aquakomplex */
  formation?: string;
  key: string;
}

const ROMAN = ['0', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];
const GREEK = ['', 'mono', 'di', 'tri', 'tetra', 'penta', 'hexa'];
const GREEK_COMPLEX = ['', '', 'bis', 'tris', 'tetrakis', 'pentakis', 'hexakis'];

const SUBSCRIPT: Record<string, string> = { '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉' };
const SUPERSCRIPT: Record<string, string> = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '+': '⁺', '-': '⁻' };

export function complexKey(metal: CentralIon, ligands: LigandCount[]): string {
  const parts = ligands
    .filter((entry) => entry.count > 0)
    .map((entry) => `${entry.ligand.id}:${entry.count}`)
    .sort();
  return `${metal.id}|${parts.join(',')}`;
}

export function chargeSuffix(charge: number): string {
  if (charge === 0) return '';
  const magnitude = Math.abs(charge);
  return `${magnitude === 1 ? '' : magnitude}${charge > 0 ? '+' : '-'}`;
}

/** Liganden in der Reihenfolge ihrer Namen (IUPAC-Nomenklatur). */
function sortedByName(ligands: LigandCount[]): LigandCount[] {
  return [...ligands]
    .filter((entry) => entry.count > 0)
    .sort((a, b) => a.ligand.name.replace(/^[\d,′-]+/, '').localeCompare(b.ligand.name.replace(/^[\d,′-]+/, '')));
}

function ligandFormulaPart(entry: LigandCount): string {
  const text = entry.ligand.abbreviation ?? entry.ligand.formula;
  const needsBrackets = entry.ligand.abbreviation !== undefined || /[A-Z].*[A-Z]|\d/.test(text) || text.length > 2;
  const body = needsBrackets ? `(${text})` : text;
  return entry.count > 1 ? `${body}${entry.count}` : body;
}

function prettify(formula: string): string {
  // Ziffern nach Buchstaben oder Klammern tiefstellen, Ladung am Ende hochstellen
  const match = formula.match(/^(.*\])(\d*[+-])?$/);
  const body = match ? match[1] : formula;
  const charge = match?.[2] ?? '';
  const sub = body.replace(/([A-Za-z)\]])(\d+)/g, (_, before: string, digits: string) =>
    before + digits.split('').map((digit) => SUBSCRIPT[digit]).join(''),
  );
  return sub + charge.split('').map((character) => SUPERSCRIPT[character] ?? character).join('');
}

function complexName(metal: CentralIon, ligands: LigandCount[], charge: number): string {
  const parts = sortedByName(ligands).map((entry) => {
    const special = /[\d′κ-]/.test(entry.ligand.name) || Boolean(entry.ligand.enclose);
    const complicated = entry.ligand.denticity > 1 || special;
    if (entry.count === 1) return special ? `(${entry.ligand.name})` : entry.ligand.name;
    return complicated ? `${GREEK_COMPLEX[entry.count]}(${entry.ligand.name})` : `${GREEK[entry.count]}${entry.ligand.name}`;
  });
  const center = charge < 0 ? `${metal.stem.toLowerCase()}at` : metal.element.toLowerCase();
  const text = `${parts.join('')}${center}(${ROMAN[metal.charge]})`;
  const capitalized = text.charAt(0).toUpperCase() + text.slice(1);
  return charge === 0 ? capitalized : `${capitalized}-Ion`;
}

/** Füllt Elektronen in Energieniveaus: High-Spin nach Hund über alle Niveaus, Low-Spin Niveau für Niveau. */
function fillLevels(
  template: Array<{ label: string; orbitals: number; energy: number }>,
  electrons: number,
  highSpin: boolean,
): OrbitalLevel[] {
  const levels = template.map((level) => ({ ...level, occupancy: Array(level.orbitals).fill(0) as number[] }));
  let remaining = electrons;

  if (highSpin) {
    // Erst jedes Orbital einfach besetzen, dann paaren – jeweils von unten
    for (const pass of [1, 2]) {
      for (const level of levels) {
        for (let index = 0; index < level.orbitals && remaining > 0; index++) {
          if (level.occupancy[index] < pass) {
            level.occupancy[index]++;
            remaining--;
          }
        }
      }
    }
  } else {
    for (const level of levels) {
      for (const pass of [1, 2]) {
        for (let index = 0; index < level.orbitals && remaining > 0; index++) {
          if (level.occupancy[index] < pass) {
            level.occupancy[index]++;
            remaining--;
          }
        }
      }
    }
  }
  return levels;
}

const LEVEL_TEMPLATES: Record<Geometry, Array<{ label: string; orbitals: number; energy: number }>> = {
  oktaedrisch: [
    { label: 't₂g', orbitals: 3, energy: 0 },
    { label: 'e_g', orbitals: 2, energy: 1 },
  ],
  tetraedrisch: [
    { label: 'e', orbitals: 2, energy: 0 },
    { label: 't₂', orbitals: 3, energy: 1 },
  ],
  'quadratisch-planar': [
    { label: 'd_xz, d_yz', orbitals: 2, energy: 0 },
    { label: 'd_z²', orbitals: 1, energy: 0.35 },
    { label: 'd_xy', orbitals: 1, energy: 0.55 },
    { label: 'd_x²−y²', orbitals: 1, energy: 1 },
  ],
  linear: [
    { label: 'd_xz, d_yz', orbitals: 2, energy: 0 },
    { label: 'd_xy, d_x²−y²', orbitals: 2, energy: 0.3 },
    { label: 'd_z²', orbitals: 1, energy: 1 },
  ],
  'trigonal-bipyramidal': [
    { label: 'd_xz, d_yz', orbitals: 2, energy: 0 },
    { label: 'd_xy, d_x²−y²', orbitals: 2, energy: 0.45 },
    { label: 'd_z²', orbitals: 1, energy: 1 },
  ],
};

/** Farbe aus der absorbierten Wellenlänge (Komplementärfarbe). */
export function complementaryColor(absorbedNm: number): { color: string; swatch: string } {
  if (absorbedNm < 400) return { color: 'farblos bis blassgelb (Absorption im UV)', swatch: '#f7f3d9' };
  if (absorbedNm < 435) return { color: 'gelbgrün', swatch: '#b5c93b' };
  if (absorbedNm < 480) return { color: 'gelb', swatch: '#e8c43a' };
  if (absorbedNm < 490) return { color: 'orange', swatch: '#e08a2b' };
  if (absorbedNm < 500) return { color: 'rot', swatch: '#c1272d' };
  if (absorbedNm < 560) return { color: 'purpur bis violett', swatch: '#8a2d7a' };
  if (absorbedNm < 580) return { color: 'violett', swatch: '#6d3fbf' };
  if (absorbedNm < 595) return { color: 'blau', swatch: '#2c56c8' };
  if (absorbedNm < 605) return { color: 'grünblau', swatch: '#2a8f9e' };
  if (absorbedNm < 750) return { color: 'blaugrün bis hellblau', swatch: '#5fb4c9' };
  return { color: 'blassblau (Absorption im nahen Infrarot)', swatch: '#b9dcef' };
}

/** Stereoisomere oktaedrischer Komplexe mit einzähnigen Liganden, nach Anzahlmuster. */
const OCTAHEDRAL_STEREOISOMERS: Record<string, number> = {
  '3,2,1': 3,
  '3,1,1,1': 5,
  '2,2,2': 6,
  '2,2,1,1': 8,
  '2,1,1,1,1': 15,
  '1,1,1,1,1,1': 30,
};

function analyseIsomers(geometry: Geometry, ligands: LigandCount[]): Isomerism[] {
  const present = ligands.filter((entry) => entry.count > 0);
  const mono = present.filter((entry) => entry.ligand.denticity === 1);
  const bi = present.filter((entry) => entry.ligand.denticity === 2);
  const counts = mono.map((entry) => entry.count).sort((a, b) => b - a);
  const result: Isomerism[] = [];

  if (geometry === 'oktaedrisch') {
    const biCount = bi.reduce((sum, entry) => sum + entry.count, 0);
    if (biCount === 3) {
      result.push({ kind: 'Spiegelbildisomerie', count: 2, description: 'Δ- und Λ-Form verhalten sich wie linke und rechte Hand (Propeller mit Links- oder Rechtsdrall).' });
    } else if (biCount === 2 && mono.length) {
      result.push({ kind: 'cis/trans-Isomerie', count: 3, description: 'Die beiden einzähnigen Liganden stehen nebeneinander (cis, chiral – zwei Spiegelbilder) oder gegenüber (trans).' });
    } else if (!bi.length && mono.length >= 2) {
      if (counts[0] === 4 && counts[1] === 2) {
        result.push({ kind: 'cis/trans-Isomerie', count: 2, description: 'Die beiden gleichen Liganden stehen benachbart (cis, 90°) oder gegenüber (trans, 180°).' });
      } else if (counts[0] === 3 && counts[1] === 3) {
        result.push({ kind: 'fac/mer-Isomerie', count: 2, description: 'Drei gleiche Liganden besetzen eine Oktaederfläche (fac) oder liegen auf einem Meridian (mer).' });
      } else if (counts[0] === 4 && counts[1] === 1 && counts[2] === 1) {
        result.push({ kind: 'cis/trans-Isomerie', count: 2, description: 'Die beiden verschiedenen Liganden stehen benachbart oder gegenüber.' });
      } else {
        // Zahl der Stereoisomere (einschließlich Spiegelbilder) für MA₃B₂C, MA₂B₂C₂ usw.
        const total = OCTAHEDRAL_STEREOISOMERS[counts.join(',')];
        if (total && total > 1) {
          result.push({
            kind: 'mehrere Stereoisomere',
            count: total,
            description: `Die ${mono.length} verschiedenen Liganden lassen sich auf ${total} räumlich verschiedene Arten um das Zentralion anordnen (Spiegelbilder mitgezählt).`,
          });
        }
      }
    }
  }

  if (geometry === 'quadratisch-planar' && !bi.length && mono.length >= 2) {
    if ((counts[0] === 2 && counts[1] === 2) || (counts[0] === 2 && counts[1] === 1 && counts[2] === 1)) {
      result.push({ kind: 'cis/trans-Isomerie', count: 2, description: 'Die gleichen Liganden stehen benachbart (cis) oder über Kreuz (trans) – wie bei Cisplatin, von dem nur das cis-Isomer als Medikament wirkt.' });
    } else if (mono.length === 4) {
      result.push({ kind: 'Stellungsisomerie', count: 3, description: 'Bei vier verschiedenen Liganden entscheidet, welcher Ligand welchem gegenübersteht – das ergibt drei Isomere.' });
    }
  }

  if (geometry === 'tetraedrisch' && mono.length === 4) {
    result.push({ kind: 'Spiegelbildisomerie', count: 2, description: 'Vier verschiedene Liganden am Tetraeder ergeben zwei Spiegelbilder.' });
  }

  return result;
}

/** Analysiert einen Komplex aus Zentralion und Liganden. */
export function analyseComplex(metal: CentralIon, rawLigands: LigandCount[]): ComplexAnalysis {
  const ligands = rawLigands.filter((entry) => entry.count > 0);
  const problems: string[] = [];

  const coordinationNumber = ligands.reduce((sum, entry) => sum + entry.count * entry.ligand.denticity, 0);
  const charge = metal.charge + ligands.reduce((sum, entry) => sum + entry.count * entry.ligand.charge, 0);

  if (!ligands.length) problems.push('Wähle mindestens einen Liganden.');
  if (coordinationNumber > 6) {
    problems.push(`Koordinationszahl ${coordinationNumber}: So viele Bindungsstellen passen bei ${metal.element} nicht um das Zentralion.`);
  } else if (coordinationNumber === 1 || coordinationNumber === 3) {
    problems.push(`Koordinationszahl ${coordinationNumber} kommt bei einfachen Komplexen praktisch nicht vor – ergänze Liganden bis 2, 4 oder 6.`);
  } else if (coordinationNumber > 0 && !metal.preferredCN.includes(coordinationNumber)) {
    problems.push(
      `Für ${metal.element}(${ROMAN[metal.charge]}) sind Koordinationszahlen von ${metal.preferredCN.join(' oder ')} typisch. Der Komplex ist denkbar, aber ungewöhnlich.`,
    );
  }

  // Geometrie
  let geometry: Geometry = 'oktaedrisch';
  const strongPositions = ligands.reduce(
    (sum, entry) => sum + (strongFieldFor(metal, entry.ligand) ? entry.count * entry.ligand.denticity : 0),
    0,
  );
  if (coordinationNumber === 2) geometry = 'linear';
  else if (coordinationNumber === 5) geometry = 'trigonal-bipyramidal';
  else if (coordinationNumber === 4) {
    const planarD8 = metal.d === 8 && (metal.series >= 4 || strongPositions >= 2);
    const planarCu = metal.id === 'cu2' && ligands.some((entry) => ['nh3', 'en', 'gly', 'bipy', 'phen', 'py'].includes(entry.ligand.id));
    geometry = planarD8 || planarCu ? 'quadratisch-planar' : 'tetraedrisch';
  }

  // Spinzustand
  const d = metal.d;
  let spin: ComplexAnalysis['spin'] = 'keine Wahl';
  let highSpin = true;
  if (geometry === 'oktaedrisch' && d >= 4 && d <= 7) {
    highSpin = strongPositions * 2 < coordinationNumber;
    spin = highSpin ? 'high-spin' : 'low-spin';
  } else if (geometry === 'quadratisch-planar' || geometry === 'linear') {
    highSpin = false;
  }

  const levels = fillLevels(LEVEL_TEMPLATES[geometry], d, highSpin);
  const unpaired = levels.reduce((sum, level) => sum + level.occupancy.filter((count) => count === 1).length, 0);
  const magneticMoment = Math.sqrt(unpaired * (unpaired + 2));

  // Ligandenfeld-Stabilisierungsenergie
  let lfse: number | undefined;
  if (geometry === 'oktaedrisch') {
    const t2g = levels[0].occupancy.reduce((a, b) => a + b, 0);
    const eg = levels[1].occupancy.reduce((a, b) => a + b, 0);
    lfse = Math.round((-0.4 * t2g + 0.6 * eg) * 100) / 100;
  } else if (geometry === 'tetraedrisch') {
    const e = levels[0].occupancy.reduce((a, b) => a + b, 0);
    const t2 = levels[1].occupancy.reduce((a, b) => a + b, 0);
    lfse = Math.round((-0.6 * e + 0.4 * t2) * 100) / 100;
  }

  // Formel und Name
  const ordered = sortedByName(ligands);
  const formula = `[${metal.symbol}${ordered.map(ligandFormulaPart).join('')}]${chargeSuffix(charge)}`;
  const key = complexKey(metal, ligands);
  const known = KNOWN[key];

  // Aufspaltung und Farbe
  let delta = known?.deltaMeasured;
  let deltaSource: ComplexAnalysis['deltaSource'] = delta ? 'gemessen' : undefined;
  if (!delta && metal.g && ligands.every((entry) => entry.ligand.f !== undefined) && geometry === 'oktaedrisch') {
    const positions = ligands.reduce((sum, entry) => sum + entry.count * entry.ligand.denticity, 0);
    const f = ligands.reduce((sum, entry) => sum + (entry.ligand.f as number) * entry.count * entry.ligand.denticity, 0) / positions;
    delta = Math.round(f * metal.g * 1000);
    deltaSource = 'Jørgensen-Abschätzung';
  }
  if (!delta && metal.g && geometry === 'tetraedrisch' && ligands.every((entry) => entry.ligand.f !== undefined)) {
    const positions = ligands.reduce((sum, entry) => sum + entry.count * entry.ligand.denticity, 0);
    const f = ligands.reduce((sum, entry) => sum + (entry.ligand.f as number) * entry.count, 0) / positions;
    delta = Math.round((4 / 9) * f * metal.g * 1000);
    deltaSource = 'Jørgensen-Abschätzung';
  }
  const absorbedNm = delta ? Math.round(1e7 / delta) : undefined;

  let color: string;
  let swatch: string;
  let colorSource: ComplexAnalysis['colorSource'];
  if (d === 0 || d === 10) {
    color = 'farblos';
    swatch = 'transparent';
    colorSource = 'd0/d10';
  } else if (known) {
    color = known.color;
    swatch = known.swatch;
    colorSource = 'gemessen';
  } else if (absorbedNm) {
    ({ color, swatch } = complementaryColor(absorbedNm));
    if (d === 5 && spin === 'high-spin') color = `sehr blass ${color} (spinverbotene Übergänge)`;
    colorSource = 'abgeschätzt';
  } else {
    color = 'nicht abschätzbar';
    swatch = 'transparent';
    colorSource = 'abgeschätzt';
  }
  if (known && (d === 0 || d === 10)) {
    color = known.color;
  }

  // Bildungsgleichung aus dem Aquakomplex
  let formation: string | undefined;
  const nonWater = ligands.filter((entry) => entry.ligand.id !== 'h2o');
  const waterInProduct = ligands.find((entry) => entry.ligand.id === 'h2o')?.count ?? 0;
  if (nonWater.length && metal.preferredCN.includes(6) && !['pd2', 'pt2', 'au3', 'pt4'].includes(metal.id)) {
    const aqua = `[${metal.symbol}(H2O)6]${chargeSuffix(metal.charge)}`;
    const released = 6 - waterInProduct;
    const ligandTerms = nonWater.map((entry) => {
      const text = entry.ligand.abbreviation ?? entry.ligand.formula;
      const charged = entry.ligand.charge ? `${text}${chargeSuffix(entry.ligand.charge)}` : text;
      return `${entry.count > 1 ? `${entry.count} ` : ''}${charged}`;
    });
    if (released >= 0) {
      formation = `${prettify(aqua)} + ${ligandTerms.map(prettifyTerm).join(' + ')} ⇌ ${prettify(formula)}${released > 0 ? ` + ${released > 1 ? `${released} ` : ''}H₂O` : ''}`;
    }
  } else if (nonWater.length) {
    const ligandTerms = nonWater.map((entry) => {
      const text = entry.ligand.abbreviation ?? entry.ligand.formula;
      const charged = entry.ligand.charge ? `${text}${chargeSuffix(entry.ligand.charge)}` : text;
      return `${entry.count > 1 ? `${entry.count} ` : ''}${charged}`;
    });
    formation = `${metal.symbol}${prettifyCharge(metal.charge)} + ${ligandTerms.map(prettifyTerm).join(' + ')} ⇌ ${prettify(formula)}`;
  }

  const stabilityKey = `${metal.id}|${nonWater.map((entry) => `${entry.ligand.id}:${entry.count}`).sort().join(',')}`;

  return {
    valid: !problems.some((problem) => !problem.includes('ungewöhnlich')),
    problems,
    metal,
    ligands,
    coordinationNumber,
    charge,
    formula,
    formulaPretty: prettify(formula),
    name: complexName(metal, ligands, charge),
    geometry,
    oxidationState: metal.charge,
    dElectrons: d,
    spin,
    levels,
    unpaired,
    magneticMoment: Math.round(magneticMoment * 100) / 100,
    magnetism: unpaired ? 'paramagnetisch' : 'diamagnetisch',
    lfse,
    delta,
    deltaSource,
    absorbedNm,
    color,
    swatch,
    colorSource,
    trivialName: known?.trivialName,
    note: known?.note,
    // Isomere nur für Komplexe, die es geben kann
    isomers: [2, 4, 5, 6].includes(coordinationNumber) ? analyseIsomers(geometry, ligands) : [],
    chelate: ligands.some((entry) => entry.ligand.denticity > 1),
    logBeta: STABILITY[stabilityKey],
    formation,
    key,
  };
}

function prettifyCharge(charge: number): string {
  return chargeSuffix(charge).split('').map((character) => SUPERSCRIPT[character] ?? character).join('');
}

function subscriptDigits(text: string): string {
  return text.replace(/([A-Za-z)\]])(\d+)/g, (_, before: string, digits: string) =>
    before + digits.split('').map((digit) => SUBSCRIPT[digit]).join(''),
  );
}

function superscriptCharge(text: string): string {
  return text.split('').map((character) => SUPERSCRIPT[character] ?? character).join('');
}

/**
 * Schreibt eine Teilchenformel mit tief- und hochgestellten Zeichen.
 * Mit «^» ist die Ladung eindeutig: «SO4^2-» → «SO₄²⁻»; ohne gelten die
 * Regeln des Formelparsers: «Fe3+» → «Fe³⁺», «NH4+» → «NH₄⁺», «[Cu(NH3)4]2+» → «[Cu(NH₃)₄]²⁺».
 */
export function prettySpecies(term: string): string {
  const caret = term.indexOf('^');
  if (caret >= 0) return subscriptDigits(term.slice(0, caret)) + superscriptCharge(term.slice(caret + 1));
  const bracket = term.match(/^(.*\])(\d*[+-])$/);
  if (bracket) return subscriptDigits(bracket[1]) + superscriptCharge(bracket[2]);
  const monatomic = term.match(/^([A-Z][a-z]?)(\d*[+-])$/);
  if (monatomic) return monatomic[1] + superscriptCharge(monatomic[2]);
  const polyatomic = term.match(/^(.*?)([+-]+)$/);
  if (polyatomic) return subscriptDigits(polyatomic[1]) + superscriptCharge(polyatomic[2]);
  return subscriptDigits(term);
}

function prettifyTerm(term: string): string {
  const match = term.match(/^(\d+ )?(.*?)(\d*[+-])?$/);
  if (!match) return term;
  const [, count = '', body, charge = ''] = match;
  const sub = body.replace(/([A-Za-z)])(\d+)/g, (_, before: string, digits: string) =>
    before + digits.split('').map((digit) => SUBSCRIPT[digit]).join(''),
  );
  return `${count}${sub}${charge.split('').map((character) => SUPERSCRIPT[character] ?? character).join('')}`;
}

/**
 * Ligandenaustausch: Welcher Komplex bildet sich, wenn zwei Liganden um
 * dasselbe Zentralion konkurrieren? Entscheidend ist die Stabilitätskonstante.
 */
export function competition(
  metal: CentralIon,
  first: LigandCount[],
  second: LigandCount[],
): { winner: 'erster' | 'zweiter' | 'unbekannt'; explanation: string; logBetas: [number?, number?] } {
  const a = analyseComplex(metal, first);
  const b = analyseComplex(metal, second);
  if (a.logBeta === undefined || b.logBeta === undefined) {
    return {
      winner: 'unbekannt',
      explanation: 'Für mindestens einen der beiden Komplexe ist keine Stabilitätskonstante hinterlegt.',
      logBetas: [a.logBeta, b.logBeta],
    };
  }
  const winner = a.logBeta >= b.logBeta ? 'erster' : 'zweiter';
  const [strong, weak] = winner === 'erster' ? [a, b] : [b, a];
  const difference = Math.abs(a.logBeta - b.logBeta);
  return {
    winner,
    explanation: `${strong.formulaPretty} (lg β = ${strong.logBeta}) ist um ${difference.toFixed(1).replace('.', ',')} Größenordnungen stabiler als ${weak.formulaPretty} (lg β = ${weak.logBeta}). Gibt man den stärkeren Liganden zu, verdrängt er den schwächeren.${strong.chelate && !weak.chelate ? ' Hier wirkt der Chelateffekt: Mehrzähnige Liganden binden fester, weil bei ihrer Anlagerung mehr Teilchen frei werden – die Entropie nimmt zu.' : ''}`,
    logBetas: [a.logBeta, b.logBeta],
  };
}

/** Vorlagen bekannter Komplexe für den Schnelleinstieg. */
export const COMPLEX_PRESETS: Array<{ label: string; metal: string; ligands: Array<[string, number]> }> = [
  { label: 'Tetraamminkupfer(II)', metal: 'cu2', ligands: [['nh3', 4], ['h2o', 2]] },
  { label: 'Hexaaquakupfer(II)', metal: 'cu2', ligands: [['h2o', 6]] },
  { label: 'Tetrachloridocuprat(II)', metal: 'cu2', ligands: [['cl', 4]] },
  { label: 'Thiocyanatoeisen(III) – blutrot', metal: 'fe3', ligands: [['scn', 1], ['h2o', 5]] },
  { label: 'Hexacyanidoferrat(II)', metal: 'fe2', ligands: [['cn', 6]] },
  { label: 'Hexacyanidoferrat(III)', metal: 'fe3', ligands: [['cn', 6]] },
  { label: 'Ferroin', metal: 'fe2', ligands: [['phen', 3]] },
  { label: 'Tetrachloridocobaltat(II)', metal: 'co2', ligands: [['cl', 4]] },
  { label: 'Hexaammincobalt(III)', metal: 'co3', ligands: [['nh3', 6]] },
  { label: 'Tris(ethylendiamin)cobalt(III)', metal: 'co3', ligands: [['en', 3]] },
  { label: 'Tetracyanidonickelat(II)', metal: 'ni2', ligands: [['cn', 4]] },
  { label: 'Diamminsilber(I)', metal: 'ag1', ligands: [['nh3', 2]] },
  { label: 'Bis(thiosulfato)argentat(I)', metal: 'ag1', ligands: [['s2o3', 2]] },
  { label: 'Cisplatin', metal: 'pt2', ligands: [['nh3', 2], ['cl', 2]] },
  { label: 'Tetrahydroxidoaluminat', metal: 'al3', ligands: [['oh', 4]] },
  { label: 'Calcium-EDTA', metal: 'ca2', ligands: [['edta', 1]] },
];

/** Alle hinterlegten Stabilitätskonstanten eines Zentralions, stärkster Komplex zuerst. */
export function stabilityTable(metalId: string): Array<{ label: string; logBeta: number; ligands: Array<[string, number]> }> {
  const metal = CENTRAL_ION_BY_ID.get(metalId);
  if (!metal) return [];
  return Object.entries(STABILITY)
    .filter(([key]) => key.startsWith(`${metalId}|`))
    .map(([key, logBeta]) => {
      const ligands = key
        .split('|')[1]
        .split(',')
        .map((part) => part.split(':'))
        .map(([id, count]) => [id, Number(count)] as [string, number]);
      const analysis = analyseComplex(
        metal,
        ligands.map(([id, count]) => ({ ligand: LIGAND_BY_ID.get(id) as Ligand, count })),
      );
      return { label: analysis.formulaPretty, logBeta, ligands };
    })
    .sort((a, b) => b.logBeta - a.logBeta);
}
