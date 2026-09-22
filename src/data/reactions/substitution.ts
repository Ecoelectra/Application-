/** Substitutionen, Eliminierungen und Reaktionen an Halogenalkanen, Alkoholen und Epoxiden. */
import type { ReactionRule } from '../types';

export const SUBSTITUTION_REACTIONS: ReactionRule[] = [
  {
    id: 'sn2-cyanid',
    name: 'Nitrilsynthese durch SN2-Substitution',
    aliases: ['Kolbe-Nitrilsynthese'],
    category: 'organisch',
    reactionType: 'Nucleophile Substitution (SN2)',
    summary:
      'Cyanid verdrängt das Halogenid aus einem primären Halogenalkan. Die Kohlenstoffkette wird dabei um ein C-Atom verlängert – das Nitril lässt sich zur Carbonsäure oder zum Amin weiterverarbeiten.',
    smirks: '[CX4;H2:1][Cl,Br,I].[C-:2]#[N:3]>>[CX4:1][C+0:2]#[N:3]',
    reactantDefaults: ['CCCBr', '[C-]#N'],
    substrateSlots: [0],
    functionalGroups: ['halogenalkan_prim'],
    generalEquation: 'R–CH₂–X + NaCN → R–CH₂–C≡N + NaX',
    example: {
      substrate: 'CCCBr',
      rxnSmiles: 'CCCBr.[C-]#N>>CCCC#N',
      caption: '1-Brompropan wird zu Butyronitril – die Kette wächst um ein Kohlenstoffatom.',
    },
    reagents: [
      { name: 'primäres Halogenalkan', role: 'Reagenz', equivalents: '1,0 Äq.' },
      { name: 'Natriumcyanid', formula: 'NaCN', role: 'Reagenz', equivalents: '1,2 Äq.' },
      { name: 'DMSO oder DMF', role: 'Lösungsmittel', note: 'polar aprotisch – lässt das Cyanid „nackt" und damit sehr nucleophil' },
    ],
    conditions: {
      temperature: '50–80 °C',
      duration: '4–12 h',
      solvent: 'DMSO, DMF oder Ethanol/Wasser',
      workup: 'Auf Wasser gießen und extrahieren',
      purification: 'Destillation',
      monitoring: 'GC oder DC',
    },
    procedure: [
      {
        title: 'Cyanidlösung vorbereiten',
        detail: 'Natriumcyanid in DMSO lösen und auf 60 °C erwärmen.',
        caution: 'Cyanidsalze sind sehr giftig. Niemals mit Säure in Kontakt bringen – es entsteht Blausäure.',
      },
      { title: 'Halogenalkan zutropfen', detail: 'Das Halogenalkan langsam zugeben und mehrere Stunden rühren.' },
      { title: 'Aufarbeiten', detail: 'Auf Eiswasser gießen, mit Ether extrahieren, organische Phase mit Wasser waschen.' },
      {
        title: 'Reinigen',
        detail: 'Trocknen und destillieren. Cyanidhaltige Rückstände mit alkalischer Hypochloritlösung entgiften.',
      },
    ],
    mechanism: {
      type: 'SN2 – bimolekulare nucleophile Substitution',
      summary:
        'Das Cyanid greift den Kohlenstoff auf der dem Halogen gegenüberliegenden Seite an. Bindungsbildung und -bruch laufen gleichzeitig ab, es gibt kein Zwischenprodukt.',
      steps: [
        {
          title: '1. Rückseitenangriff',
          rxnSmiles: 'CCCBr.[C-]#N>>CCCC#N',
          description:
            'Das Cyanid nähert sich dem elektrophilen Kohlenstoff im Winkel von 180° zur C–Br-Bindung. Im Übergangszustand ist der Kohlenstoff fünffach koordiniert und trigonal-bipyramidal.',
          electronFlow: 'Elektronenpaar des Cyanidkohlenstoffs → C-Atom; C–Br-Bindungselektronen → Brom.',
          relativeEnergy: 85,
          rateDetermining: true,
        },
        {
          title: '2. Abgang des Halogenids',
          description: 'Das Bromid verlässt das Molekül mit dem Bindungselektronenpaar; das Nitril ist fertig.',
          electronFlow: 'C–Br-Bindungselektronen vollständig am Bromid.',
          relativeEnergy: -60,
        },
      ],
      stereochemistry:
        'Am Reaktionszentrum kommt es zur Walden-Umkehr: die Konfiguration klappt um wie ein Regenschirm im Wind.',
      kinetics: 'Zweiter Ordnung: v = k·[R–X]·[CN⁻].',
      competingPathways:
        'Bei sekundären und tertiären Substraten überwiegen E2-Eliminierung bzw. SN1; dort ist die Methode unbrauchbar.',
    },
    safety: {
      ghs: ['GHS06', 'GHS08', 'GHS09'],
      hazards: [
        'Natriumcyanid ist lebensgefährlich beim Verschlucken und Hautkontakt (H300, H310, H330).',
        'Mit Säuren entsteht Blausäure (EUH032).',
      ],
      precautions: [
        'Nur im Abzug und nie allein arbeiten.',
        'Antidot-Bereitschaft und Notfallplan klären.',
        'Alle Abfälle alkalisch halten (pH > 10).',
      ],
      ppe: ['Schutzbrille', 'Nitrilhandschuhe', 'Laborkittel', 'Abzug'],
      waste: 'Cyanidhaltige Lösungen alkalisch mit Hypochlorit oxidieren, dann als Sondermüll.',
      level: 'Nur Fachlabor',
    },
    typicalYield: '70–90 %',
    scale: ['Laborsynthese', 'Industrie'],
    keywords: ['SN2', 'Nitril', 'Kettenverlängerung', 'Walden-Umkehr'],
    references: [{ title: 'Organikum, Kapitel Nucleophile Substitution', source: 'Wiley-VCH' }],
  },
  {
    id: 'williamson-ethersynthese',
    name: 'Williamson-Ethersynthese',
    category: 'organisch',
    reactionType: 'Nucleophile Substitution (SN2)',
    summary:
      'Ein Alkoholat substituiert das Halogenid und bildet einen Ether. Die wichtigste allgemeine Methode zur Herstellung unsymmetrischer Ether.',
    smirks: '[CX4;H2:1][Cl,Br,I].[OX2H1:2][#6:3]>>[CX4:1][OX2:2][#6:3]',
    reactantDefaults: ['CCBr', 'CCO'],
    substrateSlots: [0, 1],
    functionalGroups: ['halogenalkan_prim', 'alkohol_prim', 'alkohol_sek', 'phenol'],
    generalEquation: 'R–O⁻Na⁺ + R′–CH₂–X → R–O–CH₂–R′ + NaX',
    example: {
      substrate: 'CCBr',
      rxnSmiles: 'CCBr.CCO>>CCOCC',
      caption: 'Bromethan und Ethanolat ergeben Diethylether.',
    },
    reagents: [
      { name: 'Alkohol', role: 'Reagenz', equivalents: '1,0 Äq.' },
      { name: 'Natriumhydrid oder Natrium', role: 'Base', equivalents: '1,1 Äq.', note: 'erzeugt das Alkoholat' },
      { name: 'Halogenalkan', role: 'Reagenz', equivalents: '1,1 Äq.' },
      { name: 'THF oder DMF', role: 'Lösungsmittel' },
    ],
    conditions: {
      temperature: '0 °C → 60 °C',
      duration: '2–12 h',
      solvent: 'THF, DMF oder Aceton',
      atmosphere: 'Stickstoff bei Einsatz von NaH',
      workup: 'Mit Wasser quenchen, extrahieren',
      purification: 'Destillation oder Chromatographie',
    },
    procedure: [
      {
        title: 'Alkoholat erzeugen',
        detail: 'Alkohol in THF vorlegen, bei 0 °C Natriumhydrid zugeben und bis zum Ende der Wasserstoffentwicklung rühren.',
        caution: 'Wasserstoffentwicklung – keine Zündquellen.',
      },
      { title: 'Halogenalkan zugeben', detail: 'Das Halogenalkan zutropfen und auf 50–60 °C erwärmen.' },
      { title: 'Reaktion verfolgen', detail: 'Per DC kontrollieren; das Natriumhalogenid fällt sichtbar aus.' },
      { title: 'Aufarbeiten', detail: 'Vorsichtig mit Wasser quenchen, extrahieren, trocknen und destillieren.' },
    ],
    mechanism: {
      type: 'SN2',
      summary:
        'Das Alkoholat ist ein starkes Nucleophil und verdrängt das Halogenid in einem konzertierten Schritt.',
      steps: [
        {
          title: '1. Deprotonierung des Alkohols',
          rxnSmiles: 'CCO>>CC[O-]',
          description: 'Die Base entfernt das Hydroxyl-Proton; das Alkoholat ist deutlich nucleophiler als der Alkohol.',
          electronFlow: 'Elektronenpaar der Base → O–H-Proton.',
          relativeEnergy: -10,
        },
        {
          title: '2. SN2-Angriff',
          rxnSmiles: 'CC[O-].CCBr>>CCOCC',
          description: 'Das Alkoholat greift den Kohlenstoff von der Rückseite an, Bromid tritt aus.',
          electronFlow: 'Elektronenpaar des Alkoholat-Sauerstoffs → C-Atom; C–Br-Elektronen → Bromid.',
          relativeEnergy: 75,
          rateDetermining: true,
        },
      ],
      competingPathways:
        'Tertiäre Halogenalkane liefern fast ausschließlich das Eliminierungsprodukt. Deshalb immer die Kombination „sperriges Alkoholat + primäres Halogenid" wählen, nicht umgekehrt.',
      productEnergy: -85,
    },
    safety: {
      ghs: ['GHS02', 'GHS05'],
      hazards: ['Natriumhydrid entzündet sich mit Feuchtigkeit (H260).', 'Halogenalkane sind gesundheitsschädlich.'],
      precautions: ['Trocken arbeiten.', 'NaH-Reste mit Isopropanol vernichten.'],
      ppe: ['Schutzbrille', 'Handschuhe', 'Laborkittel', 'Abzug'],
      waste: 'Halogenhaltige Abfälle gesondert sammeln.',
      level: 'Laborpraktikum',
    },
    typicalYield: '60–90 %',
    scale: ['Laborsynthese', 'Industrie'],
    keywords: ['Ether', 'SN2', 'Alkoholat', 'Williamson'],
    references: [{ title: 'Williamson, J. Chem. Soc. 1852, 4, 229', source: 'Originalarbeit' }],
  },
  {
    id: 'alkohol-zu-halogenalkan',
    name: 'Alkohol zu Halogenalkan',
    aliases: ['Appel-Reaktion', 'Halogenierung mit SOCl2'],
    category: 'organisch',
    reactionType: 'Nucleophile Substitution',
    summary:
      'Die schlechte Abgangsgruppe OH wird in eine gute umgewandelt und dann durch Halogenid ersetzt. Primäre Alkohole reagieren nach SN2, tertiäre nach SN1.',
    smirks: '[CX4:1][OX2H1:2]>>[CX4:1]Br',
    reactantDefaults: ['CCCCO'],
    substrateSlots: [0],
    functionalGroups: ['alkohol_prim', 'alkohol_sek', 'alkohol_tert'],
    generalEquation: 'R–OH + HBr → R–Br + H₂O (bzw. mit PBr₃, SOCl₂, CBr₄/PPh₃)',
    example: {
      substrate: 'CCCCO',
      rxnSmiles: 'CCCCO>>CCCCBr',
      caption: '1-Butanol wird zu 1-Brombutan.',
    },
    reagents: [
      { name: 'Alkohol', role: 'Reagenz', equivalents: '1,0 Äq.' },
      { name: 'Bromwasserstoffsäure (48 %)', formula: 'HBr', role: 'Reagenz', equivalents: '2–3 Äq.' },
      { name: 'Schwefelsäure', role: 'Katalysator', note: 'setzt HBr frei und bindet Wasser' },
    ],
    conditions: {
      temperature: 'Rückfluss, 100–120 °C',
      duration: '2–4 h',
      solvent: 'ohne Lösungsmittel',
      apparatus: 'Rundkolben mit Rückflusskühler, anschließend Destillationsbrücke',
      workup: 'Phasentrennung, Waschen mit Wasser und NaHCO₃-Lösung',
      purification: 'Destillation',
    },
    procedure: [
      { title: 'Ansatz', detail: 'Alkohol, Bromwasserstoffsäure und vorsichtig Schwefelsäure im Kolben mischen.' },
      {
        title: 'Erhitzen',
        detail: 'Unter Rückfluss erhitzen; das Halogenalkan bildet eine zweite, schwerere Phase.',
        caution: 'HBr-Dämpfe sind stark ätzend – Abzug und Gaswäsche verwenden.',
      },
      { title: 'Abdestillieren', detail: 'Das Rohprodukt aus dem Ansatz herausdestillieren.' },
      {
        title: 'Waschen',
        detail:
          'Mit Wasser, kalter konzentrierter Schwefelsäure (entfernt Ether und Alken), Wasser und NaHCO₃-Lösung waschen, trocknen und fein destillieren.',
      },
    ],
    mechanism: {
      type: 'SN2 (primär) bzw. SN1 (tertiär)',
      summary:
        'Erst wird die Hydroxygruppe protoniert, dann greift das Halogenid an. Bei tertiären Substraten bildet sich zuvor ein Carbeniumion.',
      steps: [
        {
          title: '1. Protonierung der OH-Gruppe',
          rxnSmiles: 'CCCCO>>CCCC[OH2+]',
          description: 'Aus der schlechten Abgangsgruppe OH⁻ wird die gute Abgangsgruppe Wasser.',
          electronFlow: 'Elektronenpaar des Sauerstoffs → Proton.',
          relativeEnergy: -8,
        },
        {
          title: '2a. SN2 bei primären Alkoholen',
          description: 'Bromid greift rückseitig an, Wasser tritt gleichzeitig aus.',
          electronFlow: 'Elektronenpaar des Bromids → C-Atom; C–O-Elektronen → Wasser.',
          relativeEnergy: 80,
          rateDetermining: true,
        },
        {
          title: '2b. SN1 bei tertiären Alkoholen',
          description:
            'Wasser tritt zuerst aus, es entsteht ein planares Carbeniumion, das anschließend von Bromid abgefangen wird.',
          electronFlow: 'C–O-Bindungselektronen → Wasser; danach Bromid-Elektronenpaar → Carbeniumion.',
          intermediate: 'Carbeniumion',
          relativeEnergy: 95,
        },
      ],
      stereochemistry:
        'SN2 kehrt die Konfiguration um, SN1 liefert ein Racemat, weil das Carbeniumion von beiden Seiten angegriffen werden kann.',
      competingPathways: 'Bei höheren Temperaturen konkurriert die Eliminierung zum Alken.',
      productEnergy: -35,
    },
    safety: {
      ghs: ['GHS05', 'GHS07'],
      hazards: ['HBr und Schwefelsäure verursachen schwere Verätzungen (H314).', 'Halogenalkane sind umweltgefährlich.'],
      precautions: ['Im Abzug arbeiten.', 'Saure Dämpfe in Waschflasche binden.'],
      ppe: ['Schutzbrille', 'Handschuhe', 'Laborkittel', 'Abzug'],
      waste: 'Halogenhaltige Abfälle getrennt sammeln.',
      level: 'Laborpraktikum',
    },
    typicalYield: '60–85 %',
    scale: ['Schulversuch', 'Laborsynthese'],
    keywords: ['SN1', 'SN2', 'Abgangsgruppe', 'Halogenalkan'],
    references: [{ title: 'Organikum, Kapitel Halogenalkane', source: 'Wiley-VCH' }],
  },
  {
    id: 'e2-dehydrohalogenierung',
    name: 'E2-Eliminierung zum Alken',
    aliases: ['Dehydrohalogenierung'],
    category: 'organisch',
    reactionType: 'Eliminierung (E2)',
    summary:
      'Eine starke Base entfernt ein Proton am Nachbarkohlenstoff, gleichzeitig tritt das Halogenid aus. Es entsteht eine C=C-Doppelbindung.',
    smirks: '[CX4;H1,H2,H3:1][CX4:2][Cl,Br,I]>>[CX3:1]=[CX3:2]',
    reactantDefaults: ['CCC(C)Br'],
    substrateSlots: [0],
    functionalGroups: ['halogenalkan_sek', 'halogenalkan_tert', 'halogenalkan_prim'],
    generalEquation: 'R–CH₂–CHX–R′ + KOH(alkoholisch) → R–CH=CH–R′ + KX + H₂O',
    example: {
      substrate: 'CCC(C)Br',
      rxnSmiles: 'CCC(C)Br>>CCC=C',
      caption: '2-Brombutan liefert mit starker Base Buten – nach Saytzeff bevorzugt But-2-en.',
    },
    reagents: [
      { name: 'Halogenalkan', role: 'Reagenz', equivalents: '1,0 Äq.' },
      {
        name: 'Kaliumhydroxid in Ethanol',
        role: 'Base',
        equivalents: '2,0 Äq.',
        note: 'Alkoholisches Milieu begünstigt die Eliminierung, wässriges die Substitution.',
      },
    ],
    conditions: {
      temperature: '70–90 °C (Rückfluss)',
      duration: '1–3 h',
      solvent: 'Ethanol',
      apparatus: 'Rundkolben mit Rückflusskühler und Gasableitung',
      workup: 'Gasförmige Alkene direkt auffangen, flüssige destillieren',
      purification: 'Destillation',
    },
    procedure: [
      { title: 'Base ansetzen', detail: 'Kaliumhydroxid in Ethanol lösen (alkoholische Kalilauge).' },
      { title: 'Halogenalkan zugeben', detail: 'Halogenalkan zugeben und unter Rückfluss erhitzen.' },
      {
        title: 'Produkt auffangen',
        detail: 'Bei niedrigsiedenden Alkenen das Gas über eine Waschflasche auffangen und mit Bromwasser nachweisen.',
        tip: 'Die Entfärbung von Bromwasser belegt die entstandene Doppelbindung.',
      },
      { title: 'Aufarbeiten', detail: 'Rückstand mit Wasser versetzen, Phasen trennen und das Alken destillieren.' },
    ],
    mechanism: {
      type: 'E2 – konzertierte bimolekulare Eliminierung',
      summary:
        'Basenangriff am β-Wasserstoff, Bruch der C–X-Bindung und Bildung der π-Bindung laufen gleichzeitig ab. Erforderlich ist eine antiperiplanare Anordnung von H und X.',
      steps: [
        {
          title: '1. Konzertierte Eliminierung',
          rxnSmiles: 'CCC(C)Br>>CC=CC',
          description:
            'Die Base greift das β-Wasserstoffatom an; die C–H-Elektronen bilden die Doppelbindung, während das Bromid abgeht. Nur ein Übergangszustand, kein Zwischenprodukt.',
          electronFlow: 'Base → β-H; C–H-Elektronen → C–C-Bindung; C–Br-Elektronen → Bromid.',
          relativeEnergy: 90,
          rateDetermining: true,
        },
      ],
      stereochemistry:
        'Antiperiplanare Anordnung erforderlich (Diederwinkel 180°). Bei cyclischen Substraten muss das Halogen axial stehen.',
      kinetics: 'Zweiter Ordnung: v = k·[R–X]·[Base].',
      competingPathways:
        'Saytzeff-Regel: es entsteht überwiegend das höher substituierte Alken. Sperrige Basen wie Kalium-tert-butanolat liefern nach Hofmann das weniger substituierte Alken.',
      productEnergy: -45,
    },
    safety: {
      ghs: ['GHS02', 'GHS05'],
      hazards: ['Kaliumhydroxid ist stark ätzend (H314).', 'Ethanol und Alkene sind leichtentzündlich.'],
      precautions: ['Keine offene Flamme.', 'Druckaufbau vermeiden – Apparatur offen halten.'],
      ppe: ['Schutzbrille', 'Handschuhe', 'Laborkittel', 'Abzug'],
      waste: 'Neutralisierte wässrige Abfälle sammeln.',
      level: 'Schulversuch',
    },
    typicalYield: '50–85 %',
    scale: ['Schulversuch', 'Laborsynthese'],
    keywords: ['E2', 'Alken', 'Saytzeff', 'antiperiplanar'],
    references: [{ title: 'Clayden, Organic Chemistry, Kap. 19', source: 'Oxford University Press' }],
  },
  {
    id: 'alkohol-dehydratisierung',
    name: 'Säurekatalysierte Dehydratisierung von Alkoholen',
    category: 'organisch',
    reactionType: 'Eliminierung (E1)',
    summary:
      'Konzentrierte Säure spaltet aus einem Alkohol Wasser ab; es entsteht ein Alken. Tertiäre Alkohole reagieren am leichtesten, primäre brauchen deutlich höhere Temperaturen.',
    smirks: '[CX4;H1,H2,H3:1][CX4:2][OX2H1]>>[CX3:1]=[CX3:2]',
    reactantDefaults: ['CCC(C)O'],
    substrateSlots: [0],
    functionalGroups: ['alkohol_sek', 'alkohol_tert', 'alkohol_prim'],
    generalEquation: 'R–CH₂–CH(OH)–R′ →(H₂SO₄, Δ) R–CH=CH–R′ + H₂O',
    example: {
      substrate: 'CCC(C)O',
      rxnSmiles: 'CCC(C)O>>CC=CC',
      caption: 'Butan-2-ol wird zu But-2-en dehydratisiert.',
    },
    reagents: [
      { name: 'Alkohol', role: 'Reagenz', equivalents: '1,0 Äq.' },
      { name: 'Schwefelsäure (konz.) oder Phosphorsäure', role: 'Katalysator', equivalents: 'katalytisch bis 1 Äq.' },
    ],
    conditions: {
      temperature: '140–180 °C (sekundär/tertiär deutlich niedriger)',
      duration: '1–3 h',
      solvent: 'ohne Lösungsmittel',
      apparatus: 'Destillationsapparatur – das Alken wird laufend abdestilliert',
      workup: 'Alken über Wasser oder NaOH-Lösung waschen',
      purification: 'Destillation',
    },
    procedure: [
      {
        title: 'Ansatz',
        detail: 'Alkohol vorlegen und konzentrierte Schwefelsäure vorsichtig zugeben.',
        caution: 'Stark exotherm; Säure immer langsam und unter Kühlung zugeben.',
      },
      {
        title: 'Erhitzen und abdestillieren',
        detail: 'Auf Reaktionstemperatur erhitzen und das Alken laufend abdestillieren – so verschiebt sich das Gleichgewicht.',
      },
      { title: 'Reinigen', detail: 'Das Destillat mit Natronlauge waschen, trocknen und erneut destillieren.' },
      {
        title: 'Nachweis',
        detail: 'Mit Bromwasser oder Baeyer-Probe (KMnO₄) die Doppelbindung nachweisen.',
      },
    ],
    mechanism: {
      type: 'E1 über Carbeniumion',
      summary:
        'Nach Protonierung tritt Wasser aus und hinterlässt ein Carbeniumion. Die Abspaltung eines β-Protons liefert das Alken.',
      steps: [
        {
          title: '1. Protonierung',
          description: 'Die Hydroxygruppe wird protoniert und damit zur guten Abgangsgruppe.',
          electronFlow: 'Elektronenpaar des Sauerstoffs → Proton.',
          relativeEnergy: -5,
        },
        {
          title: '2. Abspaltung von Wasser',
          description: 'Wasser tritt aus; es entsteht ein planares Carbeniumion. Dieser Schritt ist geschwindigkeitsbestimmend.',
          electronFlow: 'C–O-Bindungselektronen → Wasser.',
          intermediate: 'Carbeniumion',
          relativeEnergy: 100,
          rateDetermining: true,
        },
        {
          title: '3. Deprotonierung',
          rxnSmiles: 'CCC(C)O>>CC=CC',
          description: 'Ein β-Wasserstoffatom wird abgegeben; die Elektronen bilden die Doppelbindung.',
          electronFlow: 'C–H-Bindungselektronen → C–C-Bindung.',
          relativeEnergy: -30,
        },
      ],
      competingPathways:
        'Carbeniumionen können umlagern (Hydrid- oder Methylwanderung) – dadurch entstehen manchmal unerwartete Alkene. Bei niedrigerer Temperatur entsteht stattdessen der Ether (z. B. Diethylether aus Ethanol bei 140 °C).',
    },
    safety: {
      ghs: ['GHS02', 'GHS05'],
      hazards: ['Konzentrierte Schwefelsäure verursacht schwere Verätzungen (H314).', 'Alkene sind hochentzündlich.'],
      precautions: ['Im Abzug arbeiten.', 'Siedeverzug durch Siedesteine vermeiden.'],
      ppe: ['Schutzbrille', 'Handschuhe', 'Laborkittel', 'Abzug'],
      waste: 'Säurereste vorsichtig neutralisieren.',
      level: 'Schulversuch',
    },
    typicalYield: '50–80 %',
    scale: ['Schulversuch', 'Laborsynthese', 'Industrie'],
    keywords: ['E1', 'Carbeniumion', 'Alken', 'Umlagerung'],
    references: [{ title: 'Organikum, Kapitel Eliminierungsreaktionen', source: 'Wiley-VCH' }],
  },
  {
    id: 'nitril-hydrolyse',
    name: 'Hydrolyse von Nitrilen zur Carbonsäure',
    category: 'organisch',
    reactionType: 'Addition-Eliminierung (Hydrolyse)',
    summary:
      'Nitrile werden sauer oder basisch über das Amid zur Carbonsäure hydrolysiert. Zusammen mit der SN2-Cyanidsubstitution ergibt sich eine zuverlässige Kettenverlängerung.',
    smirks: '[NX1:3]#[CX2:2][#6:1]>>[#6:1][CX3:2](=[OX1])[OX2H1]',
    reactantDefaults: ['CCCC#N'],
    substrateSlots: [0],
    functionalGroups: ['nitril'],
    generalEquation: 'R–C≡N + 2 H₂O + H⁺ → R–COOH + NH₄⁺',
    example: {
      substrate: 'CCCC#N',
      rxnSmiles: 'CCCC#N>>CCCC(=O)O',
      caption: 'Butyronitril wird zu Buttersäure hydrolysiert.',
    },
    reagents: [
      { name: 'Nitril', role: 'Reagenz', equivalents: '1,0 Äq.' },
      { name: 'Schwefelsäure (50 %) oder NaOH', role: 'Säure', equivalents: 'Überschuss' },
      { name: 'Wasser', role: 'Reagenz', equivalents: 'Überschuss' },
    ],
    conditions: {
      temperature: 'Rückfluss, 100–120 °C',
      duration: '3–8 h',
      solvent: 'Wasser',
      apparatus: 'Rundkolben mit Rückflusskühler',
      workup: 'Ansäuern und extrahieren bzw. abfiltrieren',
      purification: 'Umkristallisieren oder Destillation',
    },
    procedure: [
      { title: 'Ansatz', detail: 'Nitril mit verdünnter Schwefelsäure oder Natronlauge versetzen.' },
      {
        title: 'Erhitzen',
        detail: 'Mehrere Stunden unter Rückfluss kochen. Im Basischen entweicht Ammoniak – am Geruch erkennbar.',
        caution: 'Ammoniakdämpfe reizen die Atemwege.',
      },
      { title: 'Aufarbeiten', detail: 'Abkühlen, ansäuern (falls basisch gearbeitet wurde); die Säure fällt aus oder wird extrahiert.' },
      { title: 'Reinigen', detail: 'Umkristallisieren und Schmelzpunkt prüfen.' },
    ],
    mechanism: {
      type: 'Zweistufige Hydrolyse über das Amid',
      summary:
        'Wasser addiert an das protonierte Nitril zum Amid, das unter denselben Bedingungen weiter zur Carbonsäure hydrolysiert wird.',
      steps: [
        {
          title: '1. Protonierung und Wasseraddition',
          description: 'Das Stickstoffatom wird protoniert, Wasser greift den elektrophilen Kohlenstoff an.',
          electronFlow: 'Elektronenpaar des Wassers → Nitrilkohlenstoff; π-Elektronen → Stickstoff.',
          relativeEnergy: 45,
          rateDetermining: true,
        },
        {
          title: '2. Tautomerisierung zum Amid',
          rxnSmiles: 'CCCC#N>>CCCC(N)=O',
          description: 'Das entstandene Imidsäure-Tautomer lagert sich in das stabilere Amid um.',
          electronFlow: 'Protonenwanderung von Sauerstoff zu Stickstoff.',
          relativeEnergy: -25,
        },
        {
          title: '3. Amidhydrolyse',
          rxnSmiles: 'CCCC(N)=O>>CCCC(=O)O',
          description: 'Ein weiteres Wassermolekül addiert; Ammoniak wird abgespalten und als Ammonium abgefangen.',
          electronFlow: 'Elektronenpaar des Wassers → Carbonylkohlenstoff; C–N-Bindung bricht.',
          relativeEnergy: -55,
        },
      ],
      competingPathways:
        'Mit kontrollierter Menge Wasser und milden Bedingungen lässt sich die Reaktion auf der Amidstufe anhalten.',
    },
    safety: {
      ghs: ['GHS05', 'GHS06'],
      hazards: [
        'Nitrile sind giftig (H301+H311+H331).',
        'Beim Ansäuern cyanidhaltiger Reste kann Blausäure entstehen.',
      ],
      precautions: ['Im Abzug arbeiten.', 'Reste nie unkontrolliert ansäuern.'],
      ppe: ['Schutzbrille', 'Handschuhe', 'Laborkittel', 'Abzug'],
      waste: 'Als organischen Sondermüll sammeln.',
      level: 'Fortgeschritten',
    },
    typicalYield: '70–95 %',
    scale: ['Laborsynthese', 'Industrie'],
    keywords: ['Nitril', 'Hydrolyse', 'Carbonsäure', 'Amid'],
    references: [{ title: 'Organikum, Kapitel Nitrile', source: 'Wiley-VCH' }],
  },
  {
    id: 'epoxid-oeffnung',
    name: 'Ringöffnung von Epoxiden',
    category: 'organisch',
    reactionType: 'Nucleophile Substitution am gespannten Ring',
    summary:
      'Die Ringspannung von etwa 114 kJ/mol macht Epoxide zu reaktiven Elektrophilen. Basische und saure Bedingungen führen zu unterschiedlicher Regiochemie.',
    smirks: '[OX2r3:1]1[CX4:2][CX4:3]1.[OX2H1:4][CX4:5]>>[OX2H1:1][CX4:2][CX4:3][OX2:4][CX4:5]',
    reactantDefaults: ['C1CO1', 'CO'],
    substrateSlots: [0],
    functionalGroups: ['epoxid'],
    generalEquation: 'Epoxid + Nu⁻ → β-substituierter Alkohol',
    example: {
      substrate: 'CC1CO1',
      rxnSmiles: 'CC1CO1.CO>>COCC(C)O',
      caption: 'Propylenoxid wird von Methanol geöffnet.',
    },
    reagents: [
      { name: 'Epoxid', role: 'Reagenz', equivalents: '1,0 Äq.' },
      { name: 'Nucleophil (Alkoholat, Amin, Cyanid, Grignard)', role: 'Reagenz', equivalents: '1,1–2,0 Äq.' },
      { name: 'Natriummethanolat', role: 'Base', equivalents: 'katalytisch', note: 'bei basischer Führung' },
    ],
    conditions: {
      temperature: '0–60 °C',
      duration: '1–6 h',
      solvent: 'Methanol, THF oder Wasser',
      workup: 'Neutralisieren und extrahieren',
      purification: 'Destillation oder Chromatographie',
    },
    procedure: [
      { title: 'Nucleophil bereitstellen', detail: 'Alkoholat aus Alkohol und Natrium erzeugen oder Amin direkt einsetzen.' },
      {
        title: 'Epoxid zutropfen',
        detail: 'Das Epoxid langsam zugeben – die Ringöffnung ist exotherm.',
        caution: 'Viele Epoxide sind flüchtig, reizend und krebsverdächtig (z. B. Ethylenoxid).',
      },
      { title: 'Rühren', detail: 'Bis zum vollständigen Umsatz rühren, gegebenenfalls leicht erwärmen.' },
      { title: 'Aufarbeiten', detail: 'Neutralisieren, extrahieren, trocknen und reinigen.' },
    ],
    mechanism: {
      type: 'SN2 am gespannten Ring',
      summary:
        'Im Basischen greift das Nucleophil den sterisch besser zugänglichen Kohlenstoff an. Im Sauren wird der Sauerstoff protoniert, der Angriff erfolgt dann am höher substituierten Kohlenstoff.',
      steps: [
        {
          title: '1a. Basische Bedingungen: Angriff am weniger substituierten C',
          rxnSmiles: 'CC1CO1.[O-]C>>COCC(C)[O-]',
          description:
            'Das Nucleophil greift dort an, wo die sterische Hinderung am kleinsten ist – reine SN2-Kontrolle.',
          electronFlow: 'Elektronenpaar des Nucleophils → weniger substituierter Ringkohlenstoff; C–O-Bindung bricht.',
          relativeEnergy: 60,
          rateDetermining: true,
        },
        {
          title: '1b. Saure Bedingungen: Angriff am höher substituierten C',
          description:
            'Nach Protonierung des Epoxidsauerstoffs trägt der höher substituierte Kohlenstoff mehr positive Partialladung; dort greift das schwache Nucleophil an.',
          electronFlow: 'Nucleophil → stärker positivierter Ringkohlenstoff.',
          relativeEnergy: 55,
        },
        {
          title: '2. Protonierung des Alkoholats',
          description: 'Nach der Ringöffnung wird das Alkoholat protoniert; es liegt ein 1,2-difunktionalisiertes Produkt vor.',
          electronFlow: 'Elektronenpaar des Alkoholats → Proton.',
          relativeEnergy: -40,
        },
      ],
      stereochemistry:
        'Der Rückseitenangriff führt zu anti-Öffnung: bei cyclischen Epoxiden entstehen trans-konfigurierte Produkte.',
    },
    safety: {
      ghs: ['GHS02', 'GHS07', 'GHS08'],
      hazards: [
        'Ethylenoxid ist krebserzeugend und hochentzündlich (H340, H350, H220).',
        'Epoxide wirken hautreizend und sensibilisierend.',
      ],
      precautions: ['Nur im Abzug arbeiten.', 'Flüchtige Epoxide gekühlt handhaben.'],
      ppe: ['Schutzbrille', 'Handschuhe', 'Laborkittel', 'Abzug'],
      waste: 'Organische Abfälle sammeln; Epoxidreste vorher mit Wasser hydrolysieren.',
      level: 'Fortgeschritten',
    },
    typicalYield: '70–95 %',
    scale: ['Laborsynthese', 'Industrie'],
    keywords: ['Epoxid', 'Ringöffnung', 'Regiochemie', 'Ringspannung'],
    references: [{ title: 'Clayden, Organic Chemistry, Kap. 15', source: 'Oxford University Press' }],
  },
];
