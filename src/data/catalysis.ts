/**
 * Katalysierte Reaktionen der anorganischen und technischen Chemie.
 *
 * Die Reaktions-KI lernt aus Patenten der organischen Chemie. Für die großen
 * Katalyseprozesse und die klassischen Schulversuche gibt es hier eine
 * Wissensbasis: welche Stoffe reagieren, welcher Katalysator die Barriere
 * senkt und um wie viel.
 *
 * Aktivierungsenergien in kJ/mol. «Tabellenwert» heißt: so in Lehrbüchern
 * angegeben (u. a. Atkins, Physikalische Chemie; Wolfenden 2003 für
 * unkatalysierte Hydrolysen). «Größenordnung» heißt: grober Richtwert. Wo es
 * keinen sinnvollen Einzelwert gibt, steht stattdessen die Temperatur, ab der
 * die Reaktion technisch oder im Versuch läuft.
 */
import type { Catalysis } from './workbenchSpecs';

export type Reliability = 'Tabellenwert' | 'Größenordnung';

export interface CatalystOption {
  name: string;
  /** Stoffe der Datenbank, die diesen Katalysator stellen */
  substanceIds: string[];
  /** Einstellung «Katalyse» in der Werkbank, falls passend */
  catalysis?: Catalysis;
  /** Aktivierungsenergie mit diesem Katalysator */
  ea?: number;
  /** Temperatur in °C, ab der die Reaktion mit diesem Katalysator läuft */
  startC?: number;
  reliability: Reliability;
  note?: string;
}

export interface CatalyzedProcess {
  id: string;
  name: string;
  /** Edukte: je Position eine Liste gleichwertiger Stoff-IDs */
  reactants: string[][];
  equation: string;
  /** Aktivierungsenergie ohne Katalysator */
  eaUncatalyzed?: number;
  /** Temperatur, ab der die Reaktion ohne Katalysator läuft; null = praktisch nie */
  startUncatalyzed?: number | null;
  reliability: Reliability;
  catalysts: CatalystOption[];
  explanation: string;
  conditions: string;
  /** geschwindigkeitsbestimmender Schritt bimolekular? */
  bimolecular: boolean;
  /**
   * Stoßfaktor A (1/s bzw. L/(mol·s)), falls der allgemeine Wert der
   * Arrhenius-Abschätzung nicht passt; abgeglichen an der bekannten
   * Haltbarkeit ohne Katalysator.
   */
  preExponential?: number;
  hazards?: string[];
}

export const CATALYZED_PROCESSES: CatalyzedProcess[] = [
  {
    id: 'wasserstoffperoxid-zerfall',
    name: 'Zerfall von Wasserstoffperoxid',
    reactants: [['wasserstoffperoxid']],
    equation: '2 H2O2 → 2 H2O + O2',
    eaUncatalyzed: 75,
    reliability: 'Tabellenwert',
    catalysts: [
      { name: 'Iodid-Ionen (Kaliumiodid)', substanceIds: ['kaliumiodid'], ea: 56, reliability: 'Tabellenwert' },
      { name: 'Platin', substanceIds: ['platin'], catalysis: 'metall', ea: 49, reliability: 'Tabellenwert' },
      { name: 'Braunstein (Mangandioxid)', substanceIds: ['mangandioxid'], ea: 45, reliability: 'Größenordnung' },
      { name: 'Katalase (Enzym, z. B. aus Kartoffel oder Leber)', substanceIds: [], ea: 23, reliability: 'Tabellenwert', note: 'Ein Katalase-Molekül zerlegt Millionen H2O2-Moleküle pro Sekunde.' },
    ],
    explanation: 'Wasserstoffperoxid ist thermodynamisch instabil, zerfällt bei Raumtemperatur aber nur langsam. Der Katalysator öffnet einen Weg mit niedrigerer Barriere; die Glimmspanprobe zeigt den entstehenden Sauerstoff.',
    conditions: 'Raumtemperatur, wässrige Lösung',
    bimolecular: false,
    // 3-prozentige Lösung hält sich ohne Katalysator etwa ein Jahr
    preExponential: 5e5,
  },
  {
    id: 'haber-bosch',
    name: 'Ammoniaksynthese (Haber-Bosch)',
    reactants: [['stickstoff'], ['wasserstoff']],
    equation: 'N2 + 3 H2 ⇌ 2 NH3',
    eaUncatalyzed: 400,
    reliability: 'Größenordnung',
    catalysts: [
      { name: 'Eisen-Katalysator (Fe mit K2O/Al2O3, Mittasch)', substanceIds: ['eisen'], catalysis: 'metall', ea: 75, reliability: 'Größenordnung' },
      { name: 'Ruthenium auf Kohlenstoff', substanceIds: ['ruthenium'], catalysis: 'metall', ea: 70, reliability: 'Größenordnung' },
    ],
    explanation: 'Die N≡N-Dreifachbindung (945 kJ/mol) ist eine der stärksten Bindungen überhaupt. An der Eisenoberfläche zerfällt N2 in adsorbierte N-Atome, die schrittweise hydriert werden (Ertl, Nobelpreis 2007). Der Druck (150–300 bar) verschiebt das Gleichgewicht zum Ammoniak.',
    conditions: '400–500 °C, 150–300 bar',
    bimolecular: true,
  },
  {
    id: 'kontaktverfahren',
    name: 'Oxidation von Schwefeldioxid (Kontaktverfahren)',
    reactants: [['schwefeldioxid'], ['sauerstoff']],
    equation: '2 SO2 + O2 ⇌ 2 SO3',
    eaUncatalyzed: 300,
    reliability: 'Größenordnung',
    catalysts: [
      { name: 'Vanadium(V)-oxid', substanceIds: ['vanadium-v-oxid'], ea: 95, reliability: 'Größenordnung' },
      { name: 'Platin (historisch)', substanceIds: ['platin'], catalysis: 'metall', ea: 80, reliability: 'Größenordnung', note: 'Wurde durch Arsenverbindungen vergiftet und deshalb durch V2O5 ersetzt.' },
    ],
    explanation: 'V2O5 gibt Sauerstoff an SO2 ab und wird dabei zu V2O4 reduziert, das anschließend von O2 wieder oxidiert wird. So umgeht der Katalysator die langsame direkte Reaktion.',
    conditions: '420–600 °C, Normaldruck',
    bimolecular: true,
  },
  {
    id: 'ostwald',
    name: 'Ammoniakoxidation (Ostwald-Verfahren)',
    reactants: [['ammoniak'], ['sauerstoff']],
    equation: '4 NH3 + 5 O2 → 4 NO + 6 H2O',
    startUncatalyzed: 650,
    reliability: 'Größenordnung',
    catalysts: [{ name: 'Platin-Rhodium-Netz', substanceIds: ['platin', 'rhodium'], catalysis: 'metall', startC: 300, reliability: 'Größenordnung' }],
    explanation: 'Hier entscheidet der Katalysator, welches Produkt entsteht: Ohne Katalysator verbrennt Ammoniak zu Stickstoff (4 NH3 + 3 O2 → 2 N2 + 6 H2O). Am Platin-Rhodium-Netz entsteht in Millisekunden fast nur Stickstoffmonoxid – der Rohstoff für Salpetersäure.',
    conditions: 'etwa 900 °C, kurze Kontaktzeit',
    bimolecular: true,
  },
  {
    id: 'knallgas',
    name: 'Wasserstoff und Sauerstoff (Knallgas)',
    reactants: [['wasserstoff'], ['sauerstoff']],
    equation: '2 H2 + O2 → 2 H2O',
    startUncatalyzed: 560,
    reliability: 'Größenordnung',
    catalysts: [{ name: 'Platin oder Palladium', substanceIds: ['platin', 'palladium-auf-aktivkohle'], catalysis: 'metall', startC: 20, reliability: 'Größenordnung', note: 'Döbereiners Feuerzeug (1823): Platinschwamm entzündet Wasserstoff an der Luft.' }],
    explanation: 'Das Gemisch ist bei Raumtemperatur jahrelang haltbar, weil die Radikalkette erst bei etwa 560 °C oder durch einen Funken startet. An Platin zerfallen H2 und O2 in Atome – die Reaktion setzt schon bei Raumtemperatur ein.',
    conditions: 'Zündquelle oder Platin',
    bimolecular: true,
    hazards: ['Knallgas explodiert heftig – nur in kleinsten Mengen (Seifenblasen) und mit Schutzscheibe.'],
  },
  {
    id: 'co-oxidation',
    name: 'Kohlenstoffmonoxid-Oxidation (Abgaskatalysator)',
    reactants: [['kohlenstoffmonoxid'], ['sauerstoff']],
    equation: '2 CO + O2 → 2 CO2',
    startUncatalyzed: 610,
    reliability: 'Größenordnung',
    catalysts: [{ name: 'Platin oder Palladium', substanceIds: ['platin', 'palladium-auf-aktivkohle'], catalysis: 'metall', startC: 200, reliability: 'Größenordnung', note: 'Ab etwa 200 °C «springt» der Autokatalysator an.' }],
    explanation: 'CO und O2 werden an der Edelmetalloberfläche adsorbiert und reagieren dort (Langmuir-Hinshelwood-Mechanismus).',
    conditions: 'Abgas, 200–600 °C',
    bimolecular: true,
  },
  {
    id: 'no-reduktion',
    name: 'Stickstoffmonoxid und Kohlenstoffmonoxid (Drei-Wege-Katalysator)',
    reactants: [['stickstoffmonoxid'], ['kohlenstoffmonoxid']],
    equation: '2 NO + 2 CO → N2 + 2 CO2',
    startUncatalyzed: null,
    reliability: 'Größenordnung',
    catalysts: [{ name: 'Rhodium', substanceIds: ['rhodium'], catalysis: 'metall', startC: 250, reliability: 'Größenordnung' }],
    explanation: 'Rhodium spaltet NO an seiner Oberfläche; die N-Atome verbinden sich zu N2, der Sauerstoff oxidiert CO.',
    conditions: 'Abgas, 250–600 °C',
    bimolecular: true,
  },
  {
    id: 'methan-verbrennung',
    name: 'Verbrennung von Methan',
    reactants: [['methan'], ['sauerstoff']],
    equation: 'CH4 + 2 O2 → CO2 + 2 H2O',
    startUncatalyzed: 595,
    reliability: 'Größenordnung',
    catalysts: [{ name: 'Palladium oder Platin (katalytische Verbrennung)', substanceIds: ['palladium-auf-aktivkohle', 'platin'], catalysis: 'metall', startC: 350, reliability: 'Größenordnung' }],
    explanation: 'Erdgas braucht eine Zündquelle. Am Palladiumkatalysator verbrennt es flammenlos bei viel tieferer Temperatur – so arbeiten Gaswarngeräte und Heizstrahler ohne Flamme.',
    conditions: 'Luft, Zündquelle oder Katalysator',
    bimolecular: true,
  },
  {
    id: 'dampfreformierung',
    name: 'Dampfreformierung von Methan',
    reactants: [['methan'], ['wasser']],
    equation: 'CH4 + H2O ⇌ CO + 3 H2',
    startUncatalyzed: null,
    reliability: 'Größenordnung',
    catalysts: [{ name: 'Nickel auf Aluminiumoxid', substanceIds: ['nickel'], catalysis: 'metall', startC: 700, reliability: 'Größenordnung' }],
    explanation: 'Die Reaktion ist stark endotherm (+206 kJ/mol) und braucht deshalb hohe Temperatur – aber ohne Nickel läuft sie selbst dann kaum. Sie liefert den größten Teil des Wasserstoffs für die Ammoniaksynthese.',
    conditions: '700–900 °C, 20–40 bar',
    bimolecular: true,
  },
  {
    id: 'wassergas-shift',
    name: 'Wassergas-Shift-Reaktion',
    reactants: [['kohlenstoffmonoxid'], ['wasser']],
    equation: 'CO + H2O ⇌ CO2 + H2',
    startUncatalyzed: null,
    reliability: 'Größenordnung',
    catalysts: [
      { name: 'Eisenoxid-Chromoxid (Hochtemperatur)', substanceIds: ['eisen-iii-oxid'], startC: 350, reliability: 'Größenordnung' },
      { name: 'Kupfer-Zinkoxid (Tieftemperatur)', substanceIds: ['kupfer', 'zinkoxid'], catalysis: 'metall', startC: 200, reliability: 'Größenordnung' },
    ],
    explanation: 'Der Katalysator überträgt abwechselnd Sauerstoff vom Wasser auf das CO (Redox-Mechanismus an der Oxidoberfläche).',
    conditions: '200–450 °C',
    bimolecular: true,
  },
  {
    id: 'methanol-synthese',
    name: 'Methanolsynthese',
    reactants: [['kohlenstoffmonoxid'], ['wasserstoff']],
    equation: 'CO + 2 H2 ⇌ CH3OH',
    startUncatalyzed: null,
    reliability: 'Größenordnung',
    catalysts: [{ name: 'Kupfer-Zinkoxid-Aluminiumoxid', substanceIds: ['kupfer', 'zinkoxid'], catalysis: 'metall', startC: 230, reliability: 'Größenordnung' }],
    explanation: 'Aus denselben Edukten entstehen je nach Katalysator verschiedene Produkte: Kupfer/Zinkoxid liefert Methanol, Cobalt oder Eisen liefern Kohlenwasserstoffe (Fischer-Tropsch).',
    conditions: '230–280 °C, 50–100 bar',
    bimolecular: true,
  },
  {
    id: 'fischer-tropsch',
    name: 'Fischer-Tropsch-Synthese',
    reactants: [['kohlenstoffmonoxid'], ['wasserstoff']],
    equation: 'n CO + (2n+1) H2 → CnH2n+2 + n H2O',
    startUncatalyzed: null,
    reliability: 'Größenordnung',
    catalysts: [{ name: 'Cobalt oder Eisen', substanceIds: ['cobalt', 'eisen'], catalysis: 'metall', startC: 200, reliability: 'Größenordnung' }],
    explanation: 'An Cobalt oder Eisen wachsen aus CO und H2 Kohlenwasserstoffketten – synthetischer Treibstoff aus Kohle, Erdgas oder Biomasse.',
    conditions: '200–350 °C, 20–40 bar',
    bimolecular: true,
  },
  {
    id: 'ethen-hydrierung',
    name: 'Hydrierung von Ethen',
    reactants: [['ethen'], ['wasserstoff']],
    equation: 'C2H4 + H2 → C2H6',
    eaUncatalyzed: 180,
    reliability: 'Größenordnung',
    catalysts: [
      { name: 'Nickel', substanceIds: ['nickel'], catalysis: 'metall', ea: 45, reliability: 'Größenordnung' },
      { name: 'Platin oder Palladium', substanceIds: ['platin', 'palladium-auf-aktivkohle'], catalysis: 'metall', ea: 40, reliability: 'Größenordnung' },
    ],
    explanation: 'Die direkte Addition von H2 an die Doppelbindung ist symmetrieverboten. An der Metalloberfläche liegen H-Atome vor, die nacheinander übertragen werden.',
    conditions: 'Raumtemperatur bis 150 °C',
    bimolecular: true,
  },
  {
    id: 'ethen-hydratisierung',
    name: 'Hydratisierung von Ethen',
    reactants: [['ethen'], ['wasser']],
    equation: 'C2H4 + H2O ⇌ C2H5OH',
    startUncatalyzed: null,
    reliability: 'Größenordnung',
    catalysts: [{ name: 'Phosphorsäure auf Kieselgel', substanceIds: ['phosphorsaeure'], catalysis: 'sauer', startC: 250, reliability: 'Größenordnung' }],
    explanation: 'Das Proton der Säure addiert an die Doppelbindung; an das entstehende Carbokation lagert sich Wasser an.',
    conditions: '250–300 °C, 60–70 bar',
    bimolecular: true,
  },
  {
    id: 'ethanol-dehydratisierung',
    name: 'Dehydratisierung von Ethanol',
    reactants: [['ethanol']],
    equation: 'C2H5OH → C2H4 + H2O',
    startUncatalyzed: null,
    reliability: 'Größenordnung',
    catalysts: [
      { name: 'Konzentrierte Schwefelsäure', substanceIds: ['schwefelsaeure'], catalysis: 'sauer', startC: 170, reliability: 'Größenordnung', note: 'Bei 140 °C entsteht dagegen vor allem Diethylether.' },
      { name: 'Aluminiumoxid', substanceIds: ['aluminiumoxid'], startC: 350, reliability: 'Größenordnung' },
    ],
    explanation: 'Die Säure protoniert die OH-Gruppe, die dann als Wasser abgeht.',
    conditions: '170 °C (H2SO4) oder 350 °C (Al2O3)',
    bimolecular: false,
  },
  {
    id: 'alkohol-oxidation-kupfer',
    name: 'Katalytische Oxidation von Ethanol an Kupfer',
    reactants: [['ethanol', 'methanol'], ['sauerstoff']],
    equation: '2 C2H5OH + O2 → 2 CH3CHO + 2 H2O',
    startUncatalyzed: null,
    reliability: 'Größenordnung',
    catalysts: [
      { name: 'Kupfer (glühendes Kupferdrahtnetz)', substanceIds: ['kupfer'], catalysis: 'metall', startC: 300, reliability: 'Größenordnung', note: 'Das Netz glüht weiter, weil die Reaktion Wärme liefert.' },
      { name: 'Silber', substanceIds: ['silber'], catalysis: 'metall', startC: 500, reliability: 'Größenordnung' },
    ],
    explanation: 'Ohne Katalysator verbrennt der Alkohol vollständig zu CO2 und Wasser; an Kupfer entsteht selektiv der Aldehyd.',
    conditions: 'Alkoholdampf mit Luft',
    bimolecular: true,
  },
  {
    id: 'saccharose-hydrolyse',
    name: 'Spaltung von Saccharose (Inversion)',
    reactants: [['saccharose'], ['wasser']],
    equation: 'C12H22O11 + H2O → C6H12O6 (Glucose) + C6H12O6 (Fructose)',
    eaUncatalyzed: 140,
    reliability: 'Größenordnung',
    catalysts: [
      { name: 'Säure (H⁺)', substanceIds: ['salzsaeure', 'schwefelsaeure', 'citronensaeure'], catalysis: 'sauer', ea: 107, reliability: 'Tabellenwert' },
      { name: 'Invertase (Enzym aus Hefe)', substanceIds: [], ea: 46, reliability: 'Größenordnung' },
    ],
    explanation: 'In neutralem Wasser ist die glykosidische Bindung extrem stabil. Säure protoniert den Brücken-Sauerstoff; das Enzym Invertase senkt die Barriere noch viel stärker. Danach zeigt die Fehling-Probe den reduzierenden Zucker.',
    conditions: 'wässrige Lösung, 60–80 °C (Säure) oder 37 °C (Enzym)',
    bimolecular: false,
  },
  {
    id: 'staerke-hydrolyse',
    name: 'Abbau von Stärke',
    reactants: [['staerke'], ['wasser']],
    equation: '(C6H10O5)n + n H2O → n C6H12O6',
    eaUncatalyzed: 140,
    reliability: 'Größenordnung',
    catalysts: [
      { name: 'Säure (H⁺)', substanceIds: ['salzsaeure', 'schwefelsaeure'], catalysis: 'sauer', ea: 110, reliability: 'Größenordnung' },
      { name: 'Amylase (Enzym im Speichel)', substanceIds: [], ea: 45, reliability: 'Größenordnung', note: 'Brot schmeckt nach längerem Kauen süß.' },
    ],
    explanation: 'Wie bei der Saccharose spaltet Säure oder ein Enzym die glykosidischen Bindungen; die Iodprobe wird dabei negativ.',
    conditions: 'wässrige Lösung',
    bimolecular: false,
  },
  {
    id: 'harnstoff-hydrolyse',
    name: 'Zersetzung von Harnstoff',
    reactants: [['harnstoff'], ['wasser']],
    equation: 'CO(NH2)2 + H2O → 2 NH3 + CO2',
    eaUncatalyzed: 137,
    reliability: 'Tabellenwert',
    catalysts: [{ name: 'Urease (Enzym, z. B. aus Sojabohnen)', substanceIds: [], ea: 45, reliability: 'Größenordnung', note: 'Beschleunigt die Reaktion etwa um den Faktor 10¹⁴.' }],
    explanation: 'Harnstoff ist in Wasser jahrelang haltbar. Urease enthält zwei Nickel-Ionen, die Harnstoff binden und Wasser aktivieren – eines der wirksamsten bekannten Enzyme.',
    conditions: 'wässrige Lösung, 20–40 °C',
    bimolecular: false,
  },
  {
    id: 'lachgas-zerfall',
    name: 'Zerfall von Distickstoffmonoxid',
    reactants: [['distickstoffmonoxid']],
    equation: '2 N2O → 2 N2 + O2',
    eaUncatalyzed: 245,
    reliability: 'Tabellenwert',
    catalysts: [
      { name: 'Gold', substanceIds: ['gold'], ea: 121, reliability: 'Tabellenwert' },
      { name: 'Platin', substanceIds: ['platin'], catalysis: 'metall', ea: 134, reliability: 'Tabellenwert' },
    ],
    explanation: 'Das Lachgas-Molekül zerfällt an der Metalloberfläche, weil der Sauerstoff dort gebunden wird.',
    conditions: 'Gasphase, erhitzt',
    bimolecular: false,
  },
  {
    id: 'iodwasserstoff-zerfall',
    name: 'Zerfall von Iodwasserstoff',
    reactants: [['iodwasserstoffsaeure']],
    equation: '2 HI → H2 + I2',
    eaUncatalyzed: 184,
    reliability: 'Tabellenwert',
    catalysts: [
      { name: 'Gold', substanceIds: ['gold'], ea: 105, reliability: 'Tabellenwert' },
      { name: 'Platin', substanceIds: ['platin'], catalysis: 'metall', ea: 59, reliability: 'Tabellenwert' },
    ],
    explanation: 'Klassisches Lehrbuchbeispiel der heterogenen Katalyse (Gasphase).',
    conditions: 'Gasphase, erhitzt',
    bimolecular: true,
  },
  {
    id: 'ammoniak-zerfall',
    name: 'Zerfall von Ammoniak',
    reactants: [['ammoniak']],
    equation: '2 NH3 → N2 + 3 H2',
    eaUncatalyzed: 350,
    reliability: 'Tabellenwert',
    catalysts: [
      { name: 'Wolfram', substanceIds: ['wolfram'], ea: 162, reliability: 'Tabellenwert' },
      { name: 'Eisen', substanceIds: ['eisen'], catalysis: 'metall', ea: 180, reliability: 'Größenordnung' },
    ],
    explanation: 'Die Rückreaktion der Ammoniaksynthese; auch sie braucht eine Metalloberfläche.',
    conditions: 'Gasphase, über 500 °C',
    bimolecular: false,
  },
  {
    id: 'kaliumchlorat-zerfall',
    name: 'Zerfall von Kaliumchlorat',
    reactants: [['kaliumchlorat']],
    equation: '2 KClO3 → 2 KCl + 3 O2',
    startUncatalyzed: 400,
    reliability: 'Größenordnung',
    catalysts: [{ name: 'Braunstein (Mangandioxid)', substanceIds: ['mangandioxid'], startC: 200, reliability: 'Größenordnung' }],
    explanation: 'Mit einer Spatelspitze Braunstein gibt Kaliumchlorat seinen Sauerstoff schon bei viel tieferer Temperatur ab.',
    conditions: 'trockenes Erhitzen im Reagenzglas',
    bimolecular: false,
    hazards: ['Kaliumchlorat bildet mit brennbaren Stoffen (Schwefel, Zucker, Staub) explosive Gemische – nur im Abzug und in kleinen Mengen.'],
  },
  {
    id: 'zink-saeure-kupfer',
    name: 'Zink in Säure mit Kupfersalz',
    reactants: [['zink'], ['schwefelsaeure', 'salzsaeure']],
    equation: 'Zn + 2 H⁺ → Zn²⁺ + H2',
    reliability: 'Größenordnung',
    catalysts: [{ name: 'Einige Tropfen Kupfersulfat-Lösung', substanceIds: ['kupfersulfat', 'kupfer'], reliability: 'Größenordnung', note: 'Es scheidet sich Kupfer auf dem Zink ab: Es entsteht ein Lokalelement.' }],
    explanation: 'Reines Zink reagiert mit verdünnter Säure träge, weil Wasserstoff am Zink eine hohe Überspannung hat. Auf abgeschiedenem Kupfer entsteht der Wasserstoff viel leichter – das Zink löst sich deutlich schneller.',
    conditions: 'Raumtemperatur',
    bimolecular: true,
  },
  {
    id: 'permanganat-oxalsaeure',
    name: 'Permanganat und Oxalsäure (Autokatalyse)',
    reactants: [['kaliumpermanganat'], ['oxalsaeure']],
    equation: '2 MnO4⁻ + 5 C2O4H2 + 6 H⁺ → 2 Mn²⁺ + 10 CO2 + 8 H2O',
    reliability: 'Größenordnung',
    catalysts: [{ name: 'Mangan(II)-Ionen', substanceIds: ['mangan-ii-chlorid'], reliability: 'Größenordnung', note: 'Das Produkt Mn²⁺ ist selbst der Katalysator.' }],
    explanation: 'Anfangs entfärbt sich die Lösung nur zögernd, dann immer schneller: Die gebildeten Mn²⁺-Ionen katalysieren die Reaktion (Autokatalyse). Mit einer Prise Mangan(II)-Salz startet sie sofort.',
    conditions: 'saure Lösung, 60 °C',
    bimolecular: true,
  },
  {
    id: 'aluminium-iod',
    name: 'Aluminium und Iod',
    reactants: [['aluminium'], ['iod']],
    equation: '2 Al + 3 I2 → 2 AlI3',
    reliability: 'Größenordnung',
    catalysts: [{ name: 'Ein Tropfen Wasser', substanceIds: ['wasser'], reliability: 'Größenordnung', note: 'Wasser löst die Oxidschicht an und ermöglicht den Kontakt.' }],
    explanation: 'Das trockene Gemisch bleibt ruhig. Ein Tropfen Wasser startet eine heftige Reaktion mit violetten Iod-Dämpfen.',
    conditions: 'Abzug',
    bimolecular: true,
    hazards: ['Iod-Dämpfe sind reizend – nur im Abzug.'],
  },
  {
    id: 'benzol-brom',
    name: 'Bromierung von Benzol',
    reactants: [['benzol'], ['brom']],
    equation: 'C6H6 + Br2 → C6H5Br + HBr',
    startUncatalyzed: null,
    reliability: 'Größenordnung',
    catalysts: [{ name: 'Eisen(III)-bromid oder Eisenspäne', substanceIds: ['eisen', 'eisen-iii-chlorid'], catalysis: 'lewis', startC: 20, reliability: 'Größenordnung' }],
    explanation: 'Brom allein greift den stabilen aromatischen Ring nicht an. Die Lewis-Säure polarisiert Br2 zum Br⁺-artigen Elektrophil, das den Ring substituiert.',
    conditions: 'Raumtemperatur, Abzug',
    bimolecular: true,
    hazards: ['Benzol ist krebserzeugend, Brom sehr giftig – nur im Abzug.'],
  },
];

/** Prozesse, deren Edukte alle im Gefäß sind. */
export function processesFor(substanceIds: string[]): CatalyzedProcess[] {
  const present = new Set(substanceIds);
  return CATALYZED_PROCESSES.filter((process) => {
    const used = new Set<string>();
    return process.reactants.every((slot) => {
      const match = slot.find((id) => present.has(id) && !used.has(id));
      if (!match) return false;
      used.add(match);
      return true;
    });
  });
}
