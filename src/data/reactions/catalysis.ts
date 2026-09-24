/** Säure-, basen- und lichtgesteuerte Reaktionen für die Werkbank. */
import type { ReactionRule } from '../types';

export const CATALYSIS_REACTIONS: ReactionRule[] = [
  {
    id: 'alkohol-oxidation-saeure',
    name: 'Oxidation primärer Alkohole zur Carbonsäure',
    aliases: ['Jones-Oxidation', 'Permanganat-Oxidation'],
    category: 'organisch',
    reactionType: 'Oxidation',
    summary:
      'Starke Oxidationsmittel in wässriger Lösung oxidieren primäre Alkohole über den Aldehyd hinaus bis zur Carbonsäure. Der Aldehyd bildet in Wasser ein Hydrat, das sofort weiter oxidiert wird – deshalb bleibt die Reaktion nicht auf halbem Weg stehen.',
    smirks: '[CX4H2:1]([#6:2])[OX2H1:3]>>[CX3:1]([#6:2])(=O)[OX2H1:3]',
    reactantDefaults: ['CCO'],
    substrateSlots: [0],
    functionalGroups: ['alkohol_prim'],
    generalEquation: 'R–CH₂OH + 2 [O] → R–COOH + H₂O',
    example: {
      substrate: 'CCO',
      rxnSmiles: 'CCO>>CC(=O)O',
      caption: 'Ethanol wird zu Essigsäure oxidiert – so wird auch Wein an der Luft zu Essig.',
    },
    reagents: [
      { name: 'Primärer Alkohol', role: 'Reagenz', equivalents: '1,0 Äq.' },
      { name: 'Kaliumpermanganat', role: 'Oxidationsmittel', equivalents: '1,5 Äq.', note: 'alternativ Kaliumdichromat in Schwefelsäure (Jones)' },
    ],
    conditions: {
      temperature: 'Rückfluss, 60–100 °C',
      duration: '1–3 h',
      solvent: 'Wasser, schwach alkalisch oder schwefelsauer',
      workup: 'Braunstein abfiltrieren, Filtrat ansäuern',
      purification: 'Umkristallisieren oder Destillation',
      monitoring: 'Die violette Permanganatfarbe verschwindet, brauner Braunstein fällt aus',
    },
    procedure: [
      {
        title: 'Lösen',
        detail:
          'Den Alkohol in Wasser vorlegen.',
      },
      {
        title: 'Oxidieren',
        detail:
          'Kaliumpermanganat-Lösung portionsweise zugeben und erwärmen. Die violette Farbe verschwindet, brauner Braunstein fällt aus.',
        caution: 'Permanganat ist ein starkes Oxidationsmittel – nicht mit brennbaren Stoffen zusammen lagern.',
        tip: 'Der Farbumschlag zeigt den Fortschritt direkt an.',
      },
      {
        title: 'Freisetzen',
        detail:
          'Braunstein abfiltrieren, das Filtrat mit Salzsäure ansäuern und die Carbonsäure isolieren.',
      },
    ],
    mechanism: {
      type: 'Oxidation über Aldehyd und Aldehydhydrat',
      summary:
        'Der Alkohol wird zum Aldehyd oxidiert; dessen Hydrat trägt wieder eine C–H-Bindung neben zwei OH-Gruppen und wird weiter zur Säure oxidiert.',
      steps: [
        {
          title: '1. Oxidation zum Aldehyd',
          description:
            'Das Metalloxid bildet mit dem Alkohol einen Ester, der unter Abspaltung des α-Wasserstoffs zerfällt.',
          electronFlow: 'C–H-Bindungselektronen → C=O; Metall wird reduziert.',
          relativeEnergy: 60,
          rateDetermining: true,
        },
        {
          title: '2. Hydratbildung',
          description:
            'In Wasser addiert der Aldehyd ein Wassermolekül zum geminalen Diol.',
          electronFlow: 'Elektronenpaar des Wassers → Carbonylkohlenstoff.',
          relativeEnergy: 20,
        },
        {
          title: '3. Oxidation zur Säure',
          description:
            'Das Hydrat wird wie ein Alkohol oxidiert; es entsteht die Carbonsäure.',
          electronFlow: 'C–H-Bindungselektronen → C=O.',
          relativeEnergy: 45,
        },
      ],
      competingPathways:
        'Ohne Wasser und mit milden Reagenzien (PCC, Dess-Martin, Swern) bleibt die Oxidation beim Aldehyd stehen.',
      productEnergy: -330,
    },
    safety: {
      ghs: ['GHS03', 'GHS07', 'GHS09'],
      hazards: [
        'Kaliumpermanganat wirkt brandfördernd und gesundheitsschädlich (H272, H302).',
        'Dichromate sind krebserzeugend – Permanganat ist die bessere Wahl.',
      ],
      precautions: [
        'Nicht mit organischen Lösungsmitteln oder Glycerin in Kontakt bringen.',
        'Portionsweise zugeben.',
      ],
      ppe: ['Schutzbrille', 'Nitrilhandschuhe'],
      waste: 'Braunstein und Manganreste als Schwermetallabfall sammeln.',
      level: 'Laborpraktikum',
    },
    typicalYield: '60–85 %',
    scale: ['Schulversuch', 'Laborsynthese'],
    keywords: ['Oxidation', 'Permanganat', 'Carbonsäure', 'Essig', 'Jones'],
    references: [
      { title: 'Organikum, Oxidationen', source: 'Lehrbuch' },
    ],
  },
  {
    id: 'saure-esterhydrolyse',
    name: 'Säurekatalysierte Esterhydrolyse',
    aliases: ['Saure Esterspaltung'],
    category: 'organisch',
    reactionType: 'Nucleophile Acyl-Substitution (Hydrolyse)',
    summary:
      'Die Umkehrung der Fischer-Veresterung: Mit viel Wasser und Säure als Katalysator wird ein Ester in Carbonsäure und Alkohol gespalten. Anders als die Verseifung bleibt die Reaktion ein Gleichgewicht – deshalb braucht es einen großen Wasserüberschuss.',
    smirks: '[CX3:1](=[OX1:2])[OX2:3][CX4,c:4]>>[CX3:1](=[OX1:2])[OX2H1].[OX2H1:3][*:4]',
    reactantDefaults: ['CCOC(C)=O'],
    substrateSlots: [0],
    functionalGroups: ['ester'],
    generalEquation: 'R–COOR′ + H₂O ⇌ R–COOH + R′–OH  (H⁺)',
    example: {
      substrate: 'CCOC(C)=O',
      rxnSmiles: 'CCOC(C)=O>>CC(=O)O.CCO',
      caption: 'Essigsäureethylester wird zu Essigsäure und Ethanol gespalten.',
    },
    reagents: [
      { name: 'Ester', role: 'Reagenz', equivalents: '1,0 Äq.' },
      { name: 'Wasser', role: 'Reagenz', equivalents: 'großer Überschuss' },
      { name: 'Schwefelsäure (verdünnt)', role: 'Katalysator', equivalents: '0,1 Äq.' },
    ],
    conditions: {
      temperature: 'Rückfluss, 100 °C',
      duration: '2–6 h',
      solvent: 'Wasser',
      workup: 'Abkühlen, Produkte trennen',
      monitoring: 'Der Estergeruch verschwindet, die Lösung wird sauer',
    },
    procedure: [
      {
        title: 'Ansatz',
        detail:
          'Ester mit viel verdünnter Schwefelsäure versetzen.',
      },
      {
        title: 'Kochen',
        detail:
          'Unter Rückfluss mehrere Stunden kochen.',
        tip: 'Je größer der Wasserüberschuss, desto vollständiger die Spaltung – Prinzip von Le Chatelier.',
      },
      {
        title: 'Nachweisen',
        detail:
          'Mit Universalindikator die entstandene Säure nachweisen.',
      },
    ],
    mechanism: {
      type: 'AAC2 in Rückrichtung',
      summary:
        'Alle Schritte der Fischer-Veresterung laufen rückwärts: Protonierung, Angriff des Wassers, Abspaltung des Alkohols.',
      steps: [
        {
          title: '1. Protonierung',
          description:
            'Die Säure protoniert den Carbonylsauerstoff des Esters.',
          electronFlow: 'Elektronenpaar des Carbonylsauerstoffs → Proton.',
          relativeEnergy: -5,
        },
        {
          title: '2. Angriff des Wassers',
          description:
            'Wasser greift den aktivierten Carbonylkohlenstoff an; es entsteht ein tetraedrisches Zwischenprodukt.',
          electronFlow: 'Elektronenpaar des Wassers → Carbonylkohlenstoff.',
          relativeEnergy: 55,
          rateDetermining: true,
        },
        {
          title: '3. Abspaltung des Alkohols',
          description:
            'Nach Protonenwanderung tritt der Alkohol aus; die Carbonsäure bleibt zurück.',
          electronFlow: 'C–O-Bindung zum Alkoholrest bricht, C=O bildet sich zurück.',
          relativeEnergy: 30,
        },
      ],
      competingPathways:
        'Im Basischen läuft stattdessen die Verseifung – sie ist irreversibel, weil das Carboxylat nicht mehr angegriffen wird.',
      productEnergy: 5,
    },
    safety: {
      ghs: ['GHS05'],
      hazards: [
        'Schwefelsäure wirkt ätzend.',
      ],
      precautions: [
        'Unter Rückfluss arbeiten.',
      ],
      ppe: ['Schutzbrille', 'Nitrilhandschuhe'],
      waste: 'Neutralisieren, dann entsorgen.',
      level: 'Laborpraktikum',
    },
    typicalYield: 'Gleichgewicht, mit Überschuss 70–90 %',
    scale: ['Schulversuch', 'Laborsynthese'],
    keywords: ['Hydrolyse', 'Ester', 'Gleichgewicht', 'Säurekatalyse', 'Le Chatelier'],
    references: [
      { title: 'Organikum, Carbonsäurederivate', source: 'Lehrbuch' },
    ],
  },
  {
    id: 'alken-hydratisierung',
    name: 'Säurekatalysierte Hydratisierung von Alkenen',
    aliases: ['Wasseranlagerung'],
    category: 'organisch',
    reactionType: 'Elektrophile Addition (Markovnikov)',
    summary:
      'Wasser addiert unter Säurekatalyse an die Doppelbindung. Die OH-Gruppe landet am höher substituierten Kohlenstoff, weil dort das stabilere Carbeniumion entsteht. Technisch wird so Ethanol aus Ethen gewonnen.',
    smirks: '[CX3;!$(C=[!#6]);!$(C-[!#6;!#1]):1]=[CX3;!$(C=[!#6]);!$(C-[!#6;!#1]);!H2,$([CH2]=[CH2]):2]>>[C:1][C:2][OX2H1]',
    reactantDefaults: ['CC=C'],
    substrateSlots: [0],
    functionalGroups: ['alken'],
    generalEquation: 'R₂C=CH₂ + H₂O → R₂C(OH)–CH₃  (H⁺)',
    example: {
      substrate: 'CC=C',
      rxnSmiles: 'CC=C>>CC(C)O',
      caption: 'Propen wird zu Propan-2-ol – nicht zu Propan-1-ol.',
    },
    reagents: [
      { name: 'Alken', role: 'Reagenz', equivalents: '1,0 Äq.' },
      { name: 'Wasser', role: 'Reagenz', equivalents: 'Überschuss' },
      { name: 'Schwefelsäure oder Phosphorsäure', role: 'Katalysator', equivalents: 'katalytisch', note: 'technisch Phosphorsäure auf Kieselgur' },
    ],
    conditions: {
      temperature: 'technisch 300 °C und 70 bar; im Labor 25–60 °C mit 50 % H₂SO₄',
      duration: '1–4 h',
      solvent: 'wässrige Schwefelsäure',
      workup: 'Verdünnen, neutralisieren, Alkohol abdestillieren',
    },
    procedure: [
      {
        title: 'Einleiten',
        detail:
          'Das Alken in 50-prozentige Schwefelsäure einleiten bzw. einrühren.',
        caution: 'Konzentrierte Schwefelsäure verursacht schwere Verätzungen.',
      },
      {
        title: 'Verdünnen',
        detail:
          'Mit Wasser verdünnen und leicht erwärmen – das Zwischenprodukt Alkylhydrogensulfat wird hydrolysiert.',
      },
      {
        title: 'Isolieren',
        detail:
          'Neutralisieren und den Alkohol abdestillieren.',
      },
    ],
    mechanism: {
      type: 'Elektrophile Addition über ein Carbeniumion',
      summary:
        'Das Proton addiert so, dass das stabilere Carbeniumion entsteht; Wasser fängt es ab.',
      steps: [
        {
          title: '1. Protonierung der Doppelbindung',
          description:
            'Die π-Elektronen greifen ein Proton an. Es bildet sich das stabilere, höher substituierte Carbeniumion.',
          electronFlow: 'π-Elektronen → Proton.',
          relativeEnergy: 70,
          rateDetermining: true,
        },
        {
          title: '2. Angriff des Wassers',
          description:
            'Wasser greift das Carbeniumion an.',
          electronFlow: 'Elektronenpaar des Wassers → Carbeniumkohlenstoff.',
          relativeEnergy: 20,
        },
        {
          title: '3. Deprotonierung',
          description:
            'Das Oxoniumion gibt ein Proton ab; der Katalysator ist zurückgebildet.',
          electronFlow: 'O–H-Bindungselektronen → Sauerstoff.',
          relativeEnergy: -10,
        },
      ],
      stereochemistry: 'Es entsteht ein Racemat, weil das planare Carbeniumion von beiden Seiten angegriffen wird.',
      competingPathways:
        'Umlagerungen des Carbeniumions (Hydrid- oder Methylverschiebung) sind möglich. Die Rückreaktion ist die Dehydratisierung – hohe Temperatur und wenig Wasser begünstigen das Alken.',
      productEnergy: -45,
    },
    safety: {
      ghs: ['GHS02', 'GHS05'],
      hazards: [
        'Alkene sind hochentzündlich.',
        'Schwefelsäure wirkt ätzend.',
      ],
      precautions: [
        'Zündquellen fernhalten.',
        'Säure langsam verdünnen – nie Wasser in Säure.',
      ],
      ppe: ['Schutzbrille', 'Säurefeste Handschuhe', 'Abzug'],
      waste: 'Neutralisieren, organische Reste getrennt sammeln.',
      level: 'Laborpraktikum',
    },
    typicalYield: '50–90 %',
    scale: ['Laborsynthese', 'Industrie'],
    keywords: ['Markovnikov', 'Hydratisierung', 'Carbeniumion', 'Ethanolsynthese', 'Säurekatalyse'],
    references: [
      { title: 'Hollemann-Wiberg / Ullmann: Ethanol', source: 'Technische Chemie' },
    ],
  },
  {
    id: 'ether-kondensation',
    name: 'Säurekatalysierte Ethersynthese',
    aliases: ['Diethylethersynthese', 'Birnbaum-Verfahren'],
    category: 'organisch',
    reactionType: 'Nucleophile Substitution (SN2 am protonierten Alkohol)',
    summary:
      'Zwei Moleküle eines primären Alkohols kondensieren unter Säurekatalyse zu einem Ether. Die Temperatur entscheidet: bei 140 °C entsteht der Ether, bei 170 °C das Alken.',
    smirks: '[CH2X4:1][OX2H1].[OX2H1:2][CH2X4:3]>>[CH2X4:1][O:2][CH2X4:3]',
    reactantDefaults: ['CCO', 'CCO'],
    substrateSlots: [0],
    functionalGroups: ['alkohol_prim'],
    generalEquation: '2 R–CH₂OH → R–CH₂–O–CH₂–R + H₂O  (H₂SO₄, 140 °C)',
    example: {
      substrate: 'CCO',
      rxnSmiles: 'CCO.CCO>>CCOCC.O',
      caption: 'Ethanol ergibt Diethylether.',
    },
    reagents: [
      { name: 'Primärer Alkohol', role: 'Reagenz', equivalents: '2,0 Äq.' },
      { name: 'Schwefelsäure (konz.)', role: 'Katalysator', equivalents: '0,5 Äq.' },
    ],
    conditions: {
      temperature: '130–140 °C (darüber Eliminierung zum Alken)',
      duration: 'kontinuierlich, Ether wird abdestilliert',
      solvent: 'ohne',
      apparatus: 'Destillationsapparatur mit Tropftrichter',
      workup: 'Destillat mit Natronlauge waschen, trocknen',
    },
    procedure: [
      {
        title: 'Vorlegen',
        detail:
          'Konzentrierte Schwefelsäure und etwas Alkohol auf 140 °C erhitzen.',
        caution: 'Heiße konzentrierte Schwefelsäure – Schutzscheibe verwenden.',
      },
      {
        title: 'Zutropfen',
        detail:
          'Alkohol in dem Maß zutropfen, wie Ether abdestilliert.',
        caution: 'Diethylether ist extrem leichtentzündlich und bildet Peroxide – keine offene Flamme im Raum!',
        tip: 'Die Temperatur genau halten: über 150 °C entsteht zunehmend Ethen.',
      },
      {
        title: 'Reinigen',
        detail:
          'Destillat mit verdünnter Natronlauge waschen, über Calciumchlorid trocknen und erneut destillieren.',
      },
    ],
    mechanism: {
      type: 'SN2 am protonierten Alkohol',
      summary:
        'Ein Alkohol wird protoniert und damit zur guten Abgangsgruppe; ein zweites Alkoholmolekül greift als Nucleophil an.',
      steps: [
        {
          title: '1. Protonierung',
          description:
            'Die Säure protoniert die OH-Gruppe eines Alkohols; Wasser wird zur Abgangsgruppe.',
          electronFlow: 'Elektronenpaar des Sauerstoffs → Proton.',
          relativeEnergy: 10,
        },
        {
          title: '2. Rückseitenangriff',
          description:
            'Ein zweites Alkoholmolekül greift den Kohlenstoff von der Rückseite an; Wasser tritt aus.',
          electronFlow: 'Elektronenpaar des Alkohols → Kohlenstoff; C–OH₂-Bindung bricht.',
          relativeEnergy: 75,
          rateDetermining: true,
        },
        {
          title: '3. Deprotonierung',
          description:
            'Das Oxoniumion gibt ein Proton ab.',
          electronFlow: 'O–H-Elektronen → Sauerstoff.',
          relativeEnergy: -10,
        },
      ],
      competingPathways:
        'Bei höherer Temperatur gewinnt die Eliminierung (E1/E2) – Entropie begünstigt zwei Teilchen statt eines.',
      productEnergy: -25,
    },
    safety: {
      ghs: ['GHS02', 'GHS05', 'GHS07'],
      hazards: [
        'Diethylether ist extrem entzündlich (H224) und bildet explosive Peroxide.',
        'Heiße konzentrierte Schwefelsäure verätzt schwer.',
      ],
      precautions: [
        'Keine offene Flamme, keine heißen Oberflächen.',
        'Ether nur in kleinen Mengen und frisch verwenden.',
      ],
      ppe: ['Schutzbrille', 'Säurefeste Handschuhe', 'Abzug', 'Schutzscheibe'],
      waste: 'Säurerückstand neutralisieren.',
      level: 'Fortgeschritten',
    },
    typicalYield: '60–80 %',
    scale: ['Laborsynthese', 'Industrie'],
    keywords: ['Ether', 'Kondensation', 'Säurekatalyse', 'Temperatur', 'Eliminierung'],
    references: [
      { title: 'Organikum, Ether', source: 'Lehrbuch' },
    ],
  },
  {
    id: 'aromaten-bromierung',
    name: 'Elektrophile Bromierung von Aromaten',
    category: 'organisch',
    reactionType: 'Elektrophile aromatische Substitution',
    summary:
      'Brom allein reagiert nicht mit Benzol – erst eine Lewis-Säure wie Eisen(III)-bromid polarisiert das Brommolekül so stark, dass der Aromat angegriffen werden kann. Anders als bei Alkenen wird substituiert, nicht addiert.',
    smirks: '[cH:1]>>[c:1]Br',
    reactantDefaults: ['c1ccccc1'],
    substrateSlots: [0],
    functionalGroups: ['aromat'],
    generalEquation: 'C₆H₆ + Br₂ → C₆H₅Br + HBr  (FeBr₃)',
    example: {
      substrate: 'c1ccccc1',
      rxnSmiles: 'c1ccccc1>>Brc1ccccc1',
      caption: 'Benzol wird zu Brombenzol.',
    },
    reagents: [
      { name: 'Aromat', role: 'Reagenz', equivalents: '1,0 Äq.' },
      { name: 'Brom', role: 'Reagenz', equivalents: '1,0 Äq.' },
      { name: 'Eisen(III)-bromid oder Eisenpulver', role: 'Katalysator', equivalents: '5 mol%', note: 'Eisen bildet mit Brom das FeBr₃ selbst' },
    ],
    conditions: {
      temperature: 'Raumtemperatur bis 40 °C',
      duration: '1–3 h',
      solvent: 'ohne oder Dichlormethan',
      apparatus: 'Kolben mit Gasableitung für HBr',
      workup: 'Mit Natriumthiosulfat-Lösung überschüssiges Brom entfernen',
      monitoring: 'Braune Bromfarbe verschwindet, HBr entweicht (feuchtes Indikatorpapier rot)',
    },
    procedure: [
      {
        title: 'Vorlegen',
        detail:
          'Aromat und Eisenpulver vorlegen.',
      },
      {
        title: 'Brom zutropfen',
        detail:
          'Brom langsam zutropfen; das entstehende Bromwasserstoffgas über eine Waschflasche ableiten.',
        caution: 'Brom verursacht schwere Verätzungen und ist sehr giftig beim Einatmen – nur im Abzug.',
      },
      {
        title: 'Aufarbeiten',
        detail:
          'Mit Thiosulfatlösung und Wasser waschen, trocknen, destillieren.',
        tip: 'Der Unterschied zur Alkenbromierung ist ein klassischer Prüfungsgegenstand: Addition gegen Substitution.',
      },
    ],
    mechanism: {
      type: 'SEAr über den σ-Komplex',
      summary:
        'Die Lewis-Säure erzeugt ein Brom-Elektrophil; der Aromat bildet einen σ-Komplex und rearomatisiert unter Protonenabgabe.',
      steps: [
        {
          title: '1. Aktivierung des Broms',
          description:
            'FeBr₃ bindet ein Bromatom; das andere wird stark positiv polarisiert.',
          electronFlow: 'Elektronenpaar des Broms → Eisen.',
          relativeEnergy: 15,
        },
        {
          title: '2. Angriff des Aromaten',
          description:
            'Die π-Elektronen greifen das polarisierte Brom an; es entsteht der σ-Komplex (Areniumion).',
          electronFlow: 'π-Elektronen → Br; Br–Br-Bindung bricht.',
          relativeEnergy: 85,
          rateDetermining: true,
        },
        {
          title: '3. Rearomatisierung',
          description:
            'Ein Proton wird abgegeben, der aromatische Zustand kehrt zurück; HBr und FeBr₃ entstehen.',
          electronFlow: 'C–H-Elektronen → Ring.',
          relativeEnergy: -20,
        },
      ],
      competingPathways:
        'Bei Alkenen addiert Brom ohne Katalysator. Der Aromat verzichtet darauf, weil die Addition die Aromatizität zerstören würde.',
      productEnergy: -40,
    },
    safety: {
      ghs: ['GHS05', 'GHS06', 'GHS09'],
      hazards: [
        'Brom ist sehr giftig beim Einatmen und verätzt schwer (H330, H314).',
        'Bromwasserstoff ist ein ätzendes Gas.',
      ],
      precautions: [
        'Ausschließlich im Abzug arbeiten.',
        'Natriumthiosulfatlösung zum Neutralisieren von Brom bereithalten.',
      ],
      ppe: ['Schutzbrille', 'Nitrilhandschuhe (doppelt)', 'Abzug'],
      waste: 'Bromreste mit Thiosulfat reduzieren, halogenhaltig entsorgen.',
      level: 'Fortgeschritten',
    },
    typicalYield: '70–90 %',
    scale: ['Laborsynthese', 'Industrie'],
    keywords: ['SEAr', 'Brom', 'Lewis-Säure', 'Substitution', 'σ-Komplex'],
    references: [
      { title: 'Clayden, Organic Chemistry, Kap. 21', source: 'Lehrbuch' },
    ],
  },
  {
    id: 'seitenkettenoxidation',
    name: 'Seitenkettenoxidation von Alkylaromaten',
    category: 'organisch',
    reactionType: 'Oxidation',
    summary:
      'Kaliumpermanganat oxidiert jede Alkylgruppe am Aromaten, die ein benzylisches Wasserstoffatom trägt, zur Carbonsäuregruppe – gleich wie lang die Kette ist. Der aromatische Ring selbst bleibt unangetastet.',
    smirks: '[c:1][CX4;!H0]>>[c:1]C(=O)O',
    reactantDefaults: ['Cc1ccccc1'],
    substrateSlots: [0],
    functionalGroups: ['aromat'],
    generalEquation: 'Ar–CH₃ + 2 KMnO₄ → Ar–COOK + 2 MnO₂ + KOH + H₂O',
    example: {
      substrate: 'Cc1ccccc1',
      rxnSmiles: 'Cc1ccccc1>>O=C(O)c1ccccc1',
      caption: 'Toluol wird zu Benzoesäure.',
    },
    reagents: [
      { name: 'Alkylaromat', role: 'Reagenz', equivalents: '1,0 Äq.' },
      { name: 'Kaliumpermanganat', role: 'Oxidationsmittel', equivalents: '2,0 Äq.' },
    ],
    conditions: {
      temperature: 'Rückfluss, 100 °C',
      duration: '3–6 h',
      solvent: 'Wasser',
      workup: 'Braunstein heiß abfiltrieren, Filtrat ansäuern – die Säure fällt aus',
      purification: 'Umkristallisieren aus Wasser',
    },
    procedure: [
      {
        title: 'Kochen',
        detail:
          'Alkylaromat mit Permanganatlösung unter Rückfluss kochen, bis die violette Farbe verschwunden ist.',
      },
      {
        title: 'Filtrieren',
        detail:
          'Den Braunstein heiß abfiltrieren.',
      },
      {
        title: 'Fällen',
        detail:
          'Das Filtrat mit Salzsäure ansäuern; die aromatische Carbonsäure kristallisiert aus.',
        tip: 'tert-Butylbenzol reagiert nicht – ihm fehlt das benzylische Wasserstoffatom.',
      },
    ],
    mechanism: {
      type: 'Radikalische Oxidation an der Benzylposition',
      summary:
        'Das benzylische Wasserstoffatom wird abstrahiert, weil das entstehende Radikal durch den Ring stabilisiert ist; weitere Oxidation spaltet die Kette.',
      steps: [
        {
          title: '1. Abstraktion des benzylischen Wasserstoffs',
          description:
            'Permanganat entzieht der Benzylposition ein Wasserstoffatom; das Benzylradikal ist mesomeriestabilisiert.',
          electronFlow: 'Homolytische Spaltung der C–H-Bindung.',
          relativeEnergy: 80,
          rateDetermining: true,
        },
        {
          title: '2. Weiteroxidation',
          description:
            'Über Alkohol und Aldehyd wird die Benzylposition bis zur Carbonsäure oxidiert; überzählige Kettenglieder werden abgespalten.',
          electronFlow: 'Mehrere Oxidationsschritte.',
          relativeEnergy: 40,
        },
      ],
      competingPathways:
        'Ohne benzylisches H (tert-Butylgruppe) findet keine Oxidation statt.',
      productEnergy: -600,
    },
    safety: {
      ghs: ['GHS03', 'GHS07', 'GHS09'],
      hazards: [
        'Kaliumpermanganat ist brandfördernd (H272).',
        'Toluol ist entzündlich und reproduktionstoxisch.',
      ],
      precautions: [
        'Nicht mit organischen Stoffen trocken mischen.',
        'Im Abzug arbeiten.',
      ],
      ppe: ['Schutzbrille', 'Nitrilhandschuhe'],
      waste: 'Braunstein als Schwermetallabfall.',
      level: 'Laborpraktikum',
    },
    typicalYield: '50–80 %',
    scale: ['Schulversuch', 'Laborsynthese', 'Industrie'],
    keywords: ['Oxidation', 'Benzoesäure', 'Permanganat', 'Benzylposition'],
    references: [
      { title: 'Organikum, Oxidation von Seitenketten', source: 'Lehrbuch' },
    ],
  },
  {
    id: 'radikalische-chlorierung',
    name: 'Radikalische Chlorierung von Alkanen',
    aliases: ['Photochlorierung', 'Radikalische Substitution'],
    category: 'organisch',
    reactionType: 'Radikalische Substitution (Kettenreaktion)',
    summary:
      'Unter Licht spaltet Chlor in Radikale, die eine Kettenreaktion auslösen. Alkane – sonst sehr reaktionsträge – werden so substituiert. Es entsteht ein Gemisch der möglichen Monochloride und mehrfach chlorierter Produkte.',
    smirks: '[CX4;!H0;!$(C~[!#6;!#1]):1]>>[C:1]Cl',
    reactantDefaults: ['CC(C)C'],
    substrateSlots: [0],
    functionalGroups: [],
    generalEquation: 'R–H + Cl₂ → R–Cl + HCl  (Licht)',
    example: {
      substrate: 'C',
      rxnSmiles: 'C>>CCl',
      caption: 'Methan wird zu Chlormethan – bei Chlorüberschuss weiter bis Tetrachlormethan.',
    },
    reagents: [
      { name: 'Alkan', role: 'Reagenz', equivalents: 'Überschuss', note: 'verhindert Mehrfachchlorierung' },
      { name: 'Chlor', role: 'Reagenz', equivalents: '1,0 Äq.' },
    ],
    conditions: {
      temperature: 'Raumtemperatur, UV-Licht oder Sonnenlicht',
      duration: 'Minuten bis Stunden',
      solvent: 'Gasphase oder ohne',
      workup: 'Chlorwasserstoff auswaschen, fraktionierend destillieren',
      monitoring: 'Die grünliche Chlorfarbe verschwindet; HCl-Nebel an feuchter Luft',
    },
    procedure: [
      {
        title: 'Mischen',
        detail:
          'Alkan im Überschuss mit Chlor mischen – im Dunkeln passiert nichts.',
        caution: 'Chlor ist ein giftiges Atemgift – ausschließlich im Abzug.',
      },
      {
        title: 'Belichten',
        detail:
          'Mit UV-Licht bestrahlen. Die Reaktion startet sofort.',
        tip: 'Genau darin liegt der Beweis für den Radikalmechanismus: Ohne Licht keine Startreaktion.',
      },
      {
        title: 'Trennen',
        detail:
          'Chlorwasserstoff auswaschen und die Chloralkane destillativ trennen.',
      },
    ],
    mechanism: {
      type: 'Radikalkettenmechanismus',
      summary:
        'Start durch Lichtspaltung des Chlors, Kettenfortpflanzung über Alkyl- und Chlorradikale, Abbruch durch Rekombination.',
      steps: [
        {
          title: '1. Kettenstart',
          description:
            'Licht spaltet das Chlormolekül homolytisch in zwei Chloratome.',
          electronFlow: 'Homolyse der Cl–Cl-Bindung (Einelektronenpfeile).',
          relativeEnergy: 240,
        },
        {
          title: '2. Kettenfortpflanzung I',
          description:
            'Ein Chlorradikal abstrahiert ein Wasserstoffatom vom Alkan; es entstehen HCl und ein Alkylradikal.',
          electronFlow: 'Homolyse der C–H-Bindung, Bildung der H–Cl-Bindung.',
          relativeEnergy: 15,
          rateDetermining: true,
        },
        {
          title: '3. Kettenfortpflanzung II',
          description:
            'Das Alkylradikal reagiert mit Chlor zum Chloralkan und einem neuen Chlorradikal.',
          electronFlow: 'Homolyse von Cl–Cl, Bildung von C–Cl.',
          relativeEnergy: 5,
        },
        {
          title: '4. Kettenabbruch',
          description:
            'Zwei Radikale vereinigen sich.',
          electronFlow: 'Rekombination zweier Radikalelektronen.',
          relativeEnergy: -100,
        },
      ],
      competingPathways:
        'Tertiäre C–H-Bindungen reagieren schneller als primäre, beim Chlor aber nur mäßig selektiv (etwa 5:1) – bei Brom ist die Selektivität viel höher.',
      productEnergy: -100,
    },
    safety: {
      ghs: ['GHS03', 'GHS06', 'GHS09'],
      hazards: [
        'Chlor ist giftig beim Einatmen und stark ätzend (H330).',
        'Chloralkane sind teils krebsverdächtig.',
        'Chlor-Kohlenwasserstoff-Gemische können unter starker Belichtung explosionsartig reagieren.',
      ],
      precautions: [
        'Ausschließlich im Abzug, kleine Mengen.',
        'Keine direkte starke UV-Bestrahlung großer Gasvolumina.',
      ],
      ppe: ['Schutzbrille', 'Nitrilhandschuhe', 'Abzug'],
      waste: 'Halogenhaltige Abfälle getrennt sammeln.',
      level: 'Nur Fachlabor',
    },
    typicalYield: 'Produktgemisch',
    scale: ['Industrie'],
    keywords: ['Radikal', 'Kettenreaktion', 'Licht', 'Chlor', 'Substitution'],
    references: [
      { title: 'Clayden, Organic Chemistry, Radikalreaktionen', source: 'Lehrbuch' },
    ],
  },
  {
    id: 'grignard-bildung',
    name: 'Herstellung eines Grignard-Reagenzes',
    category: 'organisch',
    reactionType: 'Oxidative Addition von Magnesium',
    summary:
      'Magnesium schiebt sich in die Kohlenstoff-Halogen-Bindung. Dadurch kehrt sich die Polarität um: Der Kohlenstoff, vorher elektrophil, wird zum stark nucleophilen Carbanion-Äquivalent – der Schlüssel zu neuen C–C-Bindungen.',
    smirks: '[CX4,c:1][Br,I:2]>>[*:1][Mg][*:2]',
    reactantDefaults: ['CCBr'],
    substrateSlots: [0],
    functionalGroups: ['halogenalkan_prim', 'halogenalkan_sek', 'arylhalogenid'],
    generalEquation: 'R–Br + Mg → R–MgBr',
    example: {
      substrate: 'Brc1ccccc1',
      rxnSmiles: 'Brc1ccccc1>>Br[Mg]c1ccccc1',
      caption: 'Brombenzol und Magnesium ergeben Phenylmagnesiumbromid.',
    },
    reagents: [
      { name: 'Halogenalkan oder Arylhalogenid', role: 'Reagenz', equivalents: '1,0 Äq.' },
      { name: 'Magnesium', role: 'Reagenz', equivalents: '1,2 Äq.', note: 'Späne, frisch angeätzt' },
      { name: 'Iod', role: 'Katalysator', equivalents: '1 Körnchen', note: 'startet die Reaktion' },
    ],
    conditions: {
      temperature: 'Rückfluss des Ethers, 35 °C',
      duration: '1–2 h',
      solvent: 'absoluter Diethylether oder THF',
      atmosphere: 'Stickstoff oder Argon',
      apparatus: 'ausgeheizte Apparatur mit Rückflusskühler und Trockenrohr',
      monitoring: 'Trübung und selbstständiges Sieden zeigen den Start',
    },
    procedure: [
      {
        title: 'Ausheizen',
        detail:
          'Apparatur ausheizen und unter Schutzgas abkühlen lassen. Spuren von Wasser verhindern die Reaktion.',
      },
      {
        title: 'Starten',
        detail:
          'Magnesiumspäne mit einem Iodkristall und wenig Halogenid in Ether vorlegen, bis die Reaktion anspringt.',
        caution: 'Diethylether ist extrem entzündlich – keine offene Flamme.',
        tip: 'Anspringen erkennt man am Entfärben des Iods und am Sieden ohne Heizung.',
      },
      {
        title: 'Zutropfen',
        detail:
          'Das restliche Halogenid so zutropfen, dass der Ether gleichmäßig siedet.',
      },
    ],
    mechanism: {
      type: 'Einelektronenübertragung an der Metalloberfläche',
      summary:
        'Magnesium überträgt nacheinander zwei Elektronen auf das Halogenid.',
      steps: [
        {
          title: '1. Elektronenübertragung',
          description:
            'Ein Elektron geht vom Magnesium auf die C–Br-Bindung über; es entstehen ein Alkylradikal und Bromid.',
          electronFlow: 'Einelektronenübertragung Mg → σ*(C–Br).',
          relativeEnergy: 55,
          rateDetermining: true,
        },
        {
          title: '2. Rekombination',
          description:
            'Das Radikal verbindet sich mit dem Magnesium(I)-bromid an der Oberfläche zum Grignard-Reagenz.',
          electronFlow: 'Radikalrekombination.',
          relativeEnergy: -50,
        },
      ],
      competingPathways:
        'Wasser, Alkohole und Säuren zerstören das Reagenz sofort (R–MgBr + H₂O → R–H). Deshalb muss alles absolut trocken sein.',
      productEnergy: -250,
    },
    safety: {
      ghs: ['GHS02', 'GHS05'],
      hazards: [
        'Diethylether ist extrem entzündlich und bildet Peroxide (H224).',
        'Grignard-Reagenzien reagieren heftig mit Wasser.',
      ],
      precautions: [
        'Absolut wasserfrei unter Schutzgas arbeiten.',
        'Eisbad bereithalten, falls die Reaktion durchgeht.',
      ],
      ppe: ['Schutzbrille', 'Nitrilhandschuhe', 'Abzug'],
      waste: 'Reste vorsichtig mit gesättigter Ammoniumchloridlösung zersetzen.',
      level: 'Fortgeschritten',
    },
    typicalYield: '80–95 % (in Lösung, nicht isoliert)',
    scale: ['Laborsynthese'],
    keywords: ['Grignard', 'Magnesium', 'Umpolung', 'Organometall'],
    references: [
      { title: 'V. Grignard, C. R. Acad. Sci. 1900, 130, 1322', source: 'Originalarbeit, Nobelpreis 1912' },
    ],
  },
  {
    id: 'saeurechlorid-alkohol',
    name: 'Veresterung mit Säurechloriden',
    category: 'organisch',
    reactionType: 'Nucleophile Acyl-Substitution',
    summary:
      'Säurechloride reagieren mit Alkoholen schnell und vollständig zum Ester – anders als die Fischer-Veresterung ist das keine Gleichgewichtsreaktion. Eine Hilfsbase fängt den entstehenden Chlorwasserstoff ab.',
    smirks: '[CX3:1](=[OX1:2])[Cl].[OX2H1;!$(O[CX3]=O):3][#6:4]>>[CX3:1](=[OX1:2])[O:3][#6:4]',
    reactantDefaults: ['CC(=O)Cl', 'CCO'],
    substrateSlots: [0, 1],
    functionalGroups: ['saeurechlorid', 'alkohol_prim', 'alkohol_sek', 'phenol'],
    generalEquation: 'R–COCl + R′–OH → R–COOR′ + HCl',
    example: {
      substrate: 'CC(=O)Cl',
      rxnSmiles: 'CC(=O)Cl.CCO>>CCOC(C)=O',
      caption: 'Acetylchlorid und Ethanol ergeben Essigsäureethylester.',
    },
    reagents: [
      { name: 'Säurechlorid', role: 'Reagenz', equivalents: '1,1 Äq.' },
      { name: 'Alkohol', role: 'Reagenz', equivalents: '1,0 Äq.' },
      { name: 'Pyridin', role: 'Base', equivalents: '1,5 Äq.', note: 'fängt HCl ab und katalysiert' },
    ],
    conditions: {
      temperature: '0 °C bis Raumtemperatur',
      duration: '30 min bis 2 h',
      solvent: 'Dichlormethan oder Pyridin',
      workup: 'Mit verdünnter Salzsäure und Wasser waschen',
      purification: 'Destillation',
    },
    procedure: [
      {
        title: 'Kühlen',
        detail:
          'Alkohol und Pyridin im Lösungsmittel vorlegen und auf 0 °C kühlen.',
      },
      {
        title: 'Zutropfen',
        detail:
          'Das Säurechlorid langsam zutropfen – die Reaktion ist exotherm.',
        caution: 'Säurechloride reizen stark und reagieren heftig mit Wasser.',
      },
      {
        title: 'Aufarbeiten',
        detail:
          'Mit verdünnter Salzsäure das Pyridin auswaschen, trocknen und destillieren.',
      },
    ],
    mechanism: {
      type: 'Additions-Eliminierung',
      summary:
        'Der Alkohol greift das sehr elektrophile Säurechlorid an; Chlorid ist eine hervorragende Abgangsgruppe.',
      steps: [
        {
          title: '1. Angriff des Alkohols',
          description:
            'Der Alkoholsauerstoff greift den Carbonylkohlenstoff an; es entsteht ein tetraedrisches Zwischenprodukt.',
          electronFlow: 'Elektronenpaar des Alkohols → Carbonylkohlenstoff.',
          relativeEnergy: 35,
          rateDetermining: true,
        },
        {
          title: '2. Abspaltung von Chlorid',
          description:
            'Die C=O-Bindung bildet sich zurück, Chlorid tritt aus; Pyridin übernimmt das Proton.',
          electronFlow: 'C–Cl-Elektronen → Chlorid.',
          relativeEnergy: 10,
        },
      ],
      competingPathways:
        'Wasser konkurriert mit dem Alkohol und hydrolysiert das Säurechlorid zur Säure – deshalb trocken arbeiten.',
      productEnergy: -80,
    },
    safety: {
      ghs: ['GHS02', 'GHS05'],
      hazards: [
        'Säurechloride sind ätzend und entwickeln mit Feuchtigkeit HCl (H314).',
        'Pyridin ist gesundheitsschädlich.',
      ],
      precautions: [
        'Im Abzug arbeiten.',
        'Trocken arbeiten.',
      ],
      ppe: ['Schutzbrille', 'Nitrilhandschuhe', 'Abzug'],
      waste: 'Reste mit Ethanol zersetzen, dann entsorgen.',
      level: 'Laborpraktikum',
    },
    typicalYield: '85–98 %',
    scale: ['Laborsynthese'],
    keywords: ['Ester', 'Säurechlorid', 'irreversibel', 'Pyridin'],
    references: [
      { title: 'Organikum, Carbonsäurederivate', source: 'Lehrbuch' },
    ],
  },
];
