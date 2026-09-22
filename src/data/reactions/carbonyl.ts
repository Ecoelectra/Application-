/** Reaktionen der Carbonylchemie: Carbonsäurederivate, Reduktionen, C–C-Verknüpfungen. */
import type { ReactionRule } from '../types';

export const CARBONYL_REACTIONS: ReactionRule[] = [
  {
    id: 'fischer-veresterung',
    name: 'Fischer-Veresterung',
    aliases: ['Säurekatalysierte Veresterung', 'Fischer-Speier-Veresterung'],
    category: 'organisch',
    reactionType: 'Nucleophile Acyl-Substitution (Kondensation)',
    summary:
      'Carbonsäure und Alkohol bilden unter Säurekatalyse einen Ester. Die Reaktion ist eine Gleichgewichtsreaktion – das Wasser muss entfernt oder ein Reaktionspartner im Überschuss eingesetzt werden.',
    smirks: '[CX3:1](=[OX1:2])[OX2H1].[OX2H1:3][CX4:4]>>[CX3:1](=[OX1:2])[O:3][CX4:4]',
    reactantDefaults: ['CC(=O)O', 'CCO'],
    substrateSlots: [0, 1],
    functionalGroups: ['carbonsaeure', 'alkohol_prim', 'alkohol_sek'],
    generalEquation: 'R–COOH + R′–OH ⇌ R–COOR′ + H₂O',
    example: {
      substrate: 'CC(=O)O',
      rxnSmiles: 'CC(=O)O.CCO>>CCOC(C)=O.O',
      caption: 'Essigsäure und Ethanol ergeben Essigsäureethylester (Fruchtester, Geruch nach Klebstoff).',
    },
    reagents: [
      { name: 'Carbonsäure', role: 'Reagenz', equivalents: '1,0 Äq.' },
      { name: 'Alkohol', role: 'Reagenz', equivalents: '5–10 Äq. oder als Lösungsmittel' },
      {
        name: 'Schwefelsäure (konz.)',
        formula: 'H2SO4',
        role: 'Katalysator',
        equivalents: '0,05–0,1 Äq.',
        note: 'Alternativ p-Toluolsulfonsäure (pTsOH) – weniger oxidierend.',
      },
    ],
    conditions: {
      temperature: 'Rückfluss, je nach Alkohol 65–120 °C',
      duration: '2–12 h',
      solvent: 'Alkohol im Überschuss oder Toluol',
      apparatus: 'Rundkolben mit Rückflusskühler, bei Toluol zusätzlich Wasserabscheider',
      workup: 'Auf Eiswasser gießen, mit Natriumhydrogencarbonat neutralisieren, Phasen trennen',
      purification: 'Trocknen über Na₂SO₄, anschließend Destillation',
      monitoring: 'Dünnschichtchromatographie; Umsatz an der abgeschiedenen Wassermenge ablesbar',
    },
    procedure: [
      {
        title: 'Ansatz vorbereiten',
        detail:
          'Carbonsäure im Rundkolben vorlegen und im Überschuss des Alkohols lösen. Siedesteine oder Rührfisch zugeben.',
      },
      {
        title: 'Katalysator zugeben',
        detail:
          'Konzentrierte Schwefelsäure langsam und unter Rühren zutropfen (ca. 5 mol% bezogen auf die Säure).',
        caution: 'Stark exotherm – die Säure immer zur Mischung geben, niemals umgekehrt.',
      },
      {
        title: 'Erhitzen',
        detail:
          'Mit Rückflusskühler 2–12 h unter Rückfluss erhitzen. Mit Wasserabscheider lässt sich das Gleichgewicht durch Entfernen des Wassers auf die Produktseite verschieben.',
        tip: 'Ohne Wasserentzug bleibt der Umsatz bei etwa 65 % stehen (K ≈ 4 bei Essigsäure/Ethanol).',
      },
      {
        title: 'Aufarbeiten',
        detail:
          'Abkühlen, auf Eiswasser gießen, vorsichtig mit gesättigter NaHCO₃-Lösung neutralisieren (Gasentwicklung!), organische Phase abtrennen.',
      },
      {
        title: 'Reinigen',
        detail:
          'Organische Phase über Natriumsulfat trocknen, filtrieren und den Ester destillieren. Reinheit über Siedepunkt und IR (C=O bei ca. 1740 cm⁻¹) prüfen.',
      },
    ],
    mechanism: {
      type: 'Additions-Eliminierungs-Mechanismus (AAC2)',
      summary:
        'Die Säure aktiviert die Carbonylgruppe durch Protonierung; der Alkohol addiert, danach wird Wasser abgespalten. Alle Schritte sind Gleichgewichte.',
      steps: [
        {
          title: '1. Protonierung der Carbonylgruppe',
          rxnSmiles: 'CC(=O)O>>CC(=[OH+])O',
          description:
            'Das Carbonyl-Sauerstoffatom nimmt ein Proton auf. Dadurch wird das Carbonyl-Kohlenstoffatom deutlich elektrophiler.',
          electronFlow: 'Freies Elektronenpaar des Carbonylsauerstoffs → Proton der Säure.',
          relativeEnergy: -5,
        },
        {
          title: '2. Nucleophiler Angriff des Alkohols',
          rxnSmiles: 'CC(=[OH+])O.CCO>>CC([OH])([OH+]CC)O',
          description:
            'Der Alkohol greift mit einem freien Elektronenpaar am Carbonylkohlenstoff an. Es entsteht ein tetraedrisches Zwischenprodukt.',
          electronFlow: 'Elektronenpaar des Alkoholsauerstoffs → Carbonylkohlenstoff; π-Elektronen → Sauerstoff.',
          intermediate: 'tetraedrisches Zwischenprodukt (Orthoester-artig)',
          relativeEnergy: 45,
          rateDetermining: true,
        },
        {
          title: '3. Protonenwanderung',
          description:
            'Ein Proton wandert auf eine der Hydroxygruppen und macht daraus eine gute Abgangsgruppe (Wasser).',
          electronFlow: 'Protonenübertragung zwischen den Sauerstoffatomen, meist über Lösungsmittelmoleküle.',
          relativeEnergy: 38,
        },
        {
          title: '4. Abspaltung von Wasser',
          description:
            'Wasser wird abgespalten, die C=O-Doppelbindung bildet sich zurück; es entsteht das protonierte Esterderivat.',
          electronFlow: 'Freies Elektronenpaar des verbleibenden OH-Sauerstoffs → C–O-Bindung; C–OH₂-Bindung bricht heterolytisch.',
          relativeEnergy: 30,
        },
        {
          title: '5. Deprotonierung',
          rxnSmiles: 'CC(=[OH+])OCC>>CCOC(C)=O',
          description: 'Abgabe des Protons an den Alkohol oder an Wasser liefert den Ester und regeneriert den Katalysator.',
          electronFlow: 'Elektronenpaar des Alkohols → Proton.',
          relativeEnergy: -12,
        },
      ],
      stereochemistry:
        'Am Carbonylkohlenstoff entsteht kein Stereozentrum. Ein Stereozentrum im Alkoholteil bleibt unberührt, da die C–O-Bindung des Alkohols nicht gespalten wird.',
      kinetics:
        'Säurekatalysiert, insgesamt zweiter Ordnung. Geschwindigkeitsbestimmend ist der Angriff des Alkohols am protonierten Carbonyl.',
      competingPathways:
        'Bei tertiären Alkoholen überwiegt die Eliminierung zum Alken (E1 über das Carbeniumion).',
    },
    safety: {
      ghs: ['GHS02', 'GHS05', 'GHS07'],
      hazards: [
        'Konzentrierte Schwefelsäure verursacht schwere Verätzungen (H314).',
        'Die meisten Alkohole und Ester sind leichtentzündlich (H225).',
      ],
      precautions: [
        'Nur mit Rückflusskühler und ohne offene Flamme arbeiten (Ölbad oder Heizpilz).',
        'Beim Neutralisieren mit Hydrogencarbonat tritt CO₂-Entwicklung auf – Gefäß nicht verschließen.',
      ],
      ppe: ['Schutzbrille', 'Nitrilhandschuhe', 'Laborkittel', 'Abzug'],
      waste: 'Organische Phase in den Behälter für halogenfreie Lösungsmittel; wässrige Phase neutralisieren.',
      level: 'Laborpraktikum',
    },
    typicalYield: '60–95 % (abhängig vom Wasserentzug)',
    scale: ['Schulversuch', 'Laborsynthese', 'Industrie'],
    keywords: ['Ester', 'Gleichgewicht', 'Säurekatalyse', 'Kondensation', 'Fruchtester'],
    references: [
      { title: 'Organikum, 24. Auflage, Kapitel Veresterung', source: 'Wiley-VCH' },
      { title: 'E. Fischer, A. Speier, Ber. Dtsch. Chem. Ges. 1895, 28, 3252', source: 'Originalarbeit' },
    ],
    thermodynamics: {
      note: 'Nahezu thermoneutral (ΔH ≈ 0); die Lage des Gleichgewichts wird über die Konzentrationen gesteuert.',
    },
  },
  {
    id: 'esterverseifung',
    name: 'Esterverseifung (alkalische Hydrolyse)',
    aliases: ['Verseifung', 'Basische Esterhydrolyse'],
    category: 'organisch',
    reactionType: 'Nucleophile Acyl-Substitution',
    summary:
      'Hydroxidionen spalten den Ester irreversibel in das Carboxylat und den Alkohol. Die Reaktion ist die Grundlage der Seifenherstellung aus Fetten.',
    smirks: '[CX3:1](=[OX1:2])[OX2:3][CX4:4]>>[CX3:1](=[OX1:2])[OX2H1].[OX2H1:3][CX4:4]',
    reactantDefaults: ['CCOC(C)=O'],
    substrateSlots: [0],
    functionalGroups: ['ester'],
    generalEquation: 'R–COOR′ + NaOH → R–COO⁻Na⁺ + R′–OH',
    example: {
      substrate: 'CCOC(C)=O',
      rxnSmiles: 'CCOC(C)=O.[OH-]>>CC(=O)[O-].CCO',
      caption: 'Essigsäureethylester wird zu Acetat und Ethanol gespalten.',
    },
    reagents: [
      { name: 'Ester', role: 'Reagenz', equivalents: '1,0 Äq.' },
      {
        name: 'Natronlauge',
        formula: 'NaOH',
        role: 'Base',
        equivalents: '1,5–2,0 Äq.',
        note: 'Wird stöchiometrisch verbraucht, wirkt nicht katalytisch.',
      },
      { name: 'Ethanol/Wasser', role: 'Lösungsmittel', note: 'Löslichkeitsvermittler für längerkettige Ester.' },
    ],
    conditions: {
      temperature: '60–100 °C (Rückfluss)',
      duration: '1–4 h',
      solvent: 'Wasser/Ethanol 1:1',
      apparatus: 'Rundkolben mit Rückflusskühler',
      workup: 'Ansäuern mit verdünnter Salzsäure setzt die freie Carbonsäure frei',
      purification: 'Umkristallisieren der Säure oder Aussalzen der Seife',
    },
    procedure: [
      {
        title: 'Ester und Lauge vereinigen',
        detail: 'Ester in Ethanol lösen, Natronlauge (2 M) zugeben und die Mischung rühren.',
      },
      {
        title: 'Erhitzen',
        detail:
          'Unter Rückfluss erhitzen, bis die Phasengrenze verschwindet – das ist ein gutes Zeichen für vollständigen Umsatz.',
        tip: 'Bei Fetten (Seifensieden) 30–60 min kochen und anschließend mit gesättigter Kochsalzlösung aussalzen.',
      },
      {
        title: 'Aufarbeiten',
        detail:
          'Ethanol abdestillieren, den Rückstand mit Salzsäure auf pH 2 ansäuern; die Carbonsäure fällt aus oder wird mit Ether extrahiert.',
        caution: 'Beim Ansäuern kann es zu starker Wärmeentwicklung kommen – im Eisbad arbeiten.',
      },
      {
        title: 'Reinigen',
        detail: 'Rohprodukt aus Wasser oder Ethanol/Wasser umkristallisieren und den Schmelzpunkt bestimmen.',
      },
    ],
    mechanism: {
      type: 'BAC2 (basisch, bimolekular, Acyl-Sauerstoff-Spaltung)',
      summary:
        'Hydroxid addiert an die Carbonylgruppe, das Alkoholat wird abgespalten und sofort protoniert. Der letzte Schritt macht die Reaktion irreversibel.',
      steps: [
        {
          title: '1. Addition des Hydroxidions',
          rxnSmiles: 'CCOC(C)=O.[OH-]>>CCO[C-](C)([OH])[O-]',
          description:
            'Das Hydroxidion greift den elektrophilen Carbonylkohlenstoff an; es bildet sich ein tetraedrisches Alkoxid-Zwischenprodukt.',
          electronFlow: 'Elektronenpaar des Hydroxids → Carbonylkohlenstoff; π-Elektronen → Carbonylsauerstoff.',
          intermediate: 'tetraedrisches Alkoxid',
          relativeEnergy: 40,
          rateDetermining: true,
        },
        {
          title: '2. Abspaltung des Alkoholats',
          description:
            'Die C=O-Doppelbindung bildet sich zurück und drückt das Alkoholat heraus – das schlechtere Nucleophil ist die bessere Abgangsgruppe.',
          electronFlow: 'Elektronenpaar des Alkoxid-Sauerstoffs → C–O-Bindung; C–OR′-Bindung bricht.',
          relativeEnergy: 15,
        },
        {
          title: '3. Protonenübertragung (irreversibel)',
          rxnSmiles: 'CC(=O)O.[O-]CC>>CC(=O)[O-].CCO',
          description:
            'Das stark basische Alkoholat entreißt der Carbonsäure das Proton. Das entstehende Carboxylat ist mesomeriestabilisiert und reagiert nicht zurück.',
          electronFlow: 'Elektronenpaar des Alkoholats → Säureproton.',
          relativeEnergy: -55,
        },
      ],
      kinetics: 'Zweiter Ordnung: v = k·[Ester]·[OH⁻].',
      competingPathways:
        'Im Sauren verläuft die Hydrolyse über den umgekehrten Weg der Fischer-Veresterung und bleibt ein Gleichgewicht.',
    },
    safety: {
      ghs: ['GHS05', 'GHS02'],
      hazards: ['Natronlauge wirkt stark ätzend (H314).', 'Ethanol ist leichtentzündlich (H225).'],
      precautions: [
        'Schutzbrille konsequent tragen – Laugenspritzer sind für die Augen besonders gefährlich.',
        'Beim Ansäuern langsam und gekühlt arbeiten.',
      ],
      ppe: ['Schutzbrille', 'Handschuhe', 'Laborkittel'],
      waste: 'Neutralisierte wässrige Lösungen in den Sammelbehälter für wässrige Abfälle.',
      level: 'Schulversuch',
    },
    typicalYield: '85–98 %',
    scale: ['Schulversuch', 'Laborsynthese', 'Industrie'],
    keywords: ['Verseifung', 'Seife', 'Hydrolyse', 'Carboxylat', 'irreversibel'],
    references: [
      { title: 'Organikum, Kapitel Esterhydrolyse', source: 'Wiley-VCH' },
      { title: 'Clayden, Organic Chemistry, Kap. 10', source: 'Oxford University Press' },
    ],
  },
  {
    id: 'saeurechlorid-socl2',
    name: 'Carbonsäurechlorid aus Thionylchlorid',
    category: 'organisch',
    reactionType: 'Nucleophile Acyl-Substitution (Aktivierung)',
    summary:
      'Thionylchlorid überführt Carbonsäuren in die deutlich reaktiveren Säurechloride. Die Nebenprodukte SO₂ und HCl sind gasförmig und treiben die Reaktion vollständig zum Produkt.',
    smirks: '[CX3:1](=[OX1:2])[OX2H1]>>[CX3:1](=[OX1:2])[Cl]',
    reactantDefaults: ['CC(=O)O'],
    substrateSlots: [0],
    functionalGroups: ['carbonsaeure'],
    generalEquation: 'R–COOH + SOCl₂ → R–COCl + SO₂↑ + HCl↑',
    example: {
      substrate: 'c1ccccc1C(=O)O',
      rxnSmiles: 'OC(=O)c1ccccc1>>ClC(=O)c1ccccc1',
      caption: 'Benzoesäure wird zu Benzoylchlorid aktiviert.',
    },
    reagents: [
      { name: 'Carbonsäure', role: 'Reagenz', equivalents: '1,0 Äq.' },
      { name: 'Thionylchlorid', formula: 'SOCl2', role: 'Reagenz', equivalents: '1,5–3,0 Äq.' },
      {
        name: 'N,N-Dimethylformamid',
        role: 'Katalysator',
        equivalents: '0,01–0,05 Äq.',
        note: 'Bildet das eigentliche Chlorierungsreagenz (Vilsmeier-Salz).',
      },
    ],
    conditions: {
      temperature: '40–80 °C',
      duration: '1–3 h',
      solvent: 'lösungsmittelfrei oder in Dichlormethan/Toluol',
      atmosphere: 'trockener Stickstoff – das Produkt hydrolysiert sofort',
      apparatus: 'Rückflusskühler mit Trockenrohr und Gaswaschflasche (NaOH-Lösung)',
      workup: 'Überschüssiges SOCl₂ am Rotationsverdampfer entfernen',
      purification: 'Destillation unter vermindertem Druck; Säurechloride nicht wässrig aufarbeiten',
    },
    procedure: [
      {
        title: 'Apparatur trocknen',
        detail:
          'Glasgeräte im Trockenschrank trocknen und unter Schutzgas abkühlen lassen. Alle Reagenzien müssen wasserfrei sein.',
        caution: 'Thionylchlorid reagiert mit Wasser heftig zu HCl und SO₂.',
      },
      {
        title: 'Zugabe',
        detail:
          'Carbonsäure vorlegen, Thionylchlorid im Überschuss zutropfen und einen Tropfen DMF zugeben. Die Gasentwicklung setzt sofort ein.',
      },
      {
        title: 'Reaktion führen',
        detail:
          'Auf 60–80 °C erwärmen, bis keine Gasentwicklung mehr zu beobachten ist. Abgase über eine mit Natronlauge gefüllte Waschflasche leiten.',
        tip: 'Vollständigkeit erkennt man am Ende der SO₂-Entwicklung und an der klaren Lösung.',
      },
      {
        title: 'Aufarbeiten',
        detail:
          'Überschüssiges Thionylchlorid im Vakuum abziehen (Kühlfalle!) und das Säurechlorid direkt weiterverwenden oder destillieren.',
        caution: 'Niemals mit Wasser aufarbeiten – heftige Hydrolyse.',
      },
    ],
    mechanism: {
      type: 'Additions-Eliminierungs-Mechanismus über Chlorsulfitester',
      summary:
        'Die Carbonsäure greift das Schwefelatom an. Der entstehende Chlorsulfitester besitzt eine hervorragende Abgangsgruppe, die als SO₂ und Chlorid zerfällt.',
      steps: [
        {
          title: '1. Bildung des Chlorsulfitesters',
          description:
            'Der Carbonyl- bzw. Hydroxysauerstoff greift das elektrophile Schwefelatom des SOCl₂ an; Chlorid wird abgespalten, HCl entweicht.',
          electronFlow: 'Elektronenpaar des Hydroxysauerstoffs → Schwefel; S–Cl-Bindung bricht.',
          intermediate: 'R–C(=O)–O–S(=O)Cl',
          relativeEnergy: 20,
        },
        {
          title: '2. Angriff des Chloridions',
          description:
            'Das freigesetzte Chlorid addiert an den Carbonylkohlenstoff – erneut ein tetraedrisches Zwischenprodukt.',
          electronFlow: 'Elektronenpaar des Chlorids → Carbonylkohlenstoff.',
          relativeEnergy: 35,
          rateDetermining: true,
        },
        {
          title: '3. Zerfall in Produkt, SO₂ und HCl',
          rxnSmiles: 'CC(=O)OS(=O)Cl>>CC(=O)Cl',
          description:
            'Die Abgangsgruppe zerfällt in Schwefeldioxid und Chlorid. Weil beide Nebenprodukte gasförmig entweichen, ist die Reaktion praktisch irreversibel.',
          electronFlow: 'π-Elektronen bilden die C=O-Bindung zurück; O–S-Bindung bricht.',
          relativeEnergy: -40,
        },
      ],
      competingPathways:
        'Oxalylchlorid (COCl)₂ mit DMF ist die mildere Alternative, besonders für empfindliche Substrate.',
    },
    safety: {
      ghs: ['GHS05', 'GHS06'],
      hazards: [
        'Thionylchlorid ist ätzend und giftig beim Einatmen (H302+H331, H314).',
        'Freisetzung von HCl und SO₂ – Reizung der Atemwege (EUH014: reagiert heftig mit Wasser).',
      ],
      precautions: [
        'Ausschließlich im gut ziehenden Abzug arbeiten.',
        'Abgase in Natronlauge einleiten.',
        'Säurechloride luft- und feuchtigkeitsdicht lagern.',
      ],
      ppe: ['Schutzbrille', 'Butylkautschuk-Handschuhe', 'Laborkittel', 'Abzug'],
      waste: 'Reste vorsichtig in Eiswasser hydrolysieren, neutralisieren, dann Sondermüll.',
      level: 'Fortgeschritten',
    },
    typicalYield: '85–99 %',
    scale: ['Laborsynthese', 'Industrie'],
    keywords: ['Aktivierung', 'Thionylchlorid', 'Acylierung', 'Säurechlorid'],
    references: [{ title: 'Organikum, Kapitel Carbonsäurehalogenide', source: 'Wiley-VCH' }],
  },
  {
    id: 'schotten-baumann-amid',
    name: 'Amidbildung nach Schotten-Baumann',
    aliases: ['Acylierung von Aminen'],
    category: 'organisch',
    reactionType: 'Nucleophile Acyl-Substitution',
    summary:
      'Ein Säurechlorid acyliert ein Amin zum Amid. Eine Hilfsbase fängt den entstehenden Chlorwasserstoff ab, damit das Amin nucleophil bleibt.',
    smirks: '[CX3:1](=[OX1:2])[Cl].[NX3;H2,H1;!$(NC=O):3]>>[CX3:1](=[OX1:2])[N:3]',
    reactantDefaults: ['CC(=O)Cl', 'NCc1ccccc1'],
    substrateSlots: [0, 1],
    functionalGroups: ['saeurechlorid', 'amin_prim', 'amin_sek', 'anilin'],
    generalEquation: 'R–COCl + R′₂NH + Base → R–CO–NR′₂ + Base·HCl',
    example: {
      substrate: 'ClC(=O)c1ccccc1',
      rxnSmiles: 'ClC(=O)c1ccccc1.NCc1ccccc1>>O=C(NCc1ccccc1)c1ccccc1',
      caption: 'Benzoylchlorid und Benzylamin ergeben N-Benzylbenzamid.',
    },
    reagents: [
      { name: 'Säurechlorid', role: 'Reagenz', equivalents: '1,0–1,1 Äq.' },
      { name: 'Amin', role: 'Reagenz', equivalents: '1,0 Äq.' },
      {
        name: 'Triethylamin oder NaOH',
        role: 'Base',
        equivalents: '2,0 Äq.',
        note: 'Ohne Hilfsbase würde die Hälfte des Amins als Hydrochlorid ausfallen.',
      },
    ],
    conditions: {
      temperature: '0 °C → Raumtemperatur',
      duration: '30 min – 2 h',
      solvent: 'Dichlormethan, THF oder zweiphasig Wasser/Ether',
      apparatus: 'Rundkolben mit Tropftrichter, Eisbad',
      workup: 'Waschen mit verdünnter Salzsäure, Hydrogencarbonatlösung und Wasser',
      purification: 'Umkristallisieren oder Säulenchromatographie',
    },
    procedure: [
      {
        title: 'Amin vorlegen',
        detail: 'Amin und Base im Lösungsmittel lösen und auf 0 °C kühlen.',
      },
      {
        title: 'Säurechlorid zutropfen',
        detail:
          'Säurechlorid langsam zutropfen, damit die Temperatur unter 10 °C bleibt. Es bildet sich ein Niederschlag aus Ammoniumsalz.',
        caution: 'Die Acylierung ist stark exotherm.',
      },
      {
        title: 'Nachrühren',
        detail: 'Auf Raumtemperatur erwärmen lassen und 1–2 h rühren; per DC auf vollständigen Umsatz prüfen.',
      },
      {
        title: 'Aufarbeiten',
        detail:
          'Mit 1 M HCl (entfernt überschüssiges Amin), dann mit NaHCO₃-Lösung (entfernt Säurereste) und Wasser waschen. Trocknen und einengen.',
      },
    ],
    mechanism: {
      type: 'Additions-Eliminierungs-Mechanismus',
      summary:
        'Das Amin addiert an den Carbonylkohlenstoff; Chlorid wird als gute Abgangsgruppe abgespalten, die Base neutralisiert das Proton.',
      steps: [
        {
          title: '1. Nucleophiler Angriff des Amins',
          rxnSmiles: 'CC(=O)Cl.NCc1ccccc1>>CC([O-])(Cl)[NH2+]Cc1ccccc1',
          description:
            'Das freie Elektronenpaar des Stickstoffs greift den Carbonylkohlenstoff an; es entsteht ein tetraedrisches Zwitterion.',
          electronFlow: 'Elektronenpaar des Stickstoffs → Carbonylkohlenstoff.',
          relativeEnergy: 30,
          rateDetermining: true,
        },
        {
          title: '2. Abspaltung des Chlorids',
          description: 'Die C=O-Doppelbindung bildet sich zurück und stößt das Chloridion aus.',
          electronFlow: 'Elektronenpaar des Alkoxids → C–O-Bindung; C–Cl-Bindung bricht.',
          relativeEnergy: 5,
        },
        {
          title: '3. Deprotonierung durch die Hilfsbase',
          description:
            'Triethylamin oder Hydroxid nimmt das Proton auf; es entsteht das neutrale Amid und ein Ammoniumsalz.',
          electronFlow: 'Elektronenpaar der Base → N–H-Proton.',
          relativeEnergy: -60,
        },
      ],
      competingPathways:
        'Mit Wasser als konkurrierendem Nucleophil entsteht die Carbonsäure – bei der zweiphasigen Variante hilft die schnelle Amin-Acylierung.',
    },
    safety: {
      ghs: ['GHS05', 'GHS07'],
      hazards: ['Säurechloride wirken stark ätzend und tränenreizend.', 'Amine sind ätzend und oft geruchsintensiv.'],
      precautions: ['Im Abzug arbeiten.', 'Exotherme Zugabe durch Kühlung kontrollieren.'],
      ppe: ['Schutzbrille', 'Handschuhe', 'Laborkittel', 'Abzug'],
      waste: 'Halogenhaltige organische Abfälle getrennt sammeln.',
      level: 'Laborpraktikum',
    },
    typicalYield: '75–98 %',
    scale: ['Laborsynthese', 'Industrie'],
    keywords: ['Amid', 'Peptidbindung', 'Acylierung', 'Hilfsbase'],
    references: [
      { title: 'Organikum, Kapitel Carbonsäureamide', source: 'Wiley-VCH' },
      { title: 'C. Schotten, Ber. Dtsch. Chem. Ges. 1884, 17, 2544', source: 'Originalarbeit' },
    ],
  },
  {
    id: 'amidkupplung-edc',
    name: 'Peptidkupplung mit Carbodiimid (EDC/HOBt)',
    aliases: ['Amidkupplung', 'Peptidsynthese'],
    category: 'organisch',
    reactionType: 'Nucleophile Acyl-Substitution (Kupplungsreagenz)',
    summary:
      'Carbodiimide aktivieren Carbonsäuren in situ, sodass Amine ohne den Umweg über Säurechloride zu Amiden reagieren. Standardmethode der Peptid- und Wirkstoffsynthese.',
    smirks: '[CX3:1](=[OX1:2])[OX2H1].[NX3;H2,H1;!$(NC=O):3]>>[CX3:1](=[OX1:2])[N:3]',
    reactantDefaults: ['CC(=O)O', 'NCc1ccccc1'],
    substrateSlots: [0, 1],
    functionalGroups: ['carbonsaeure', 'amin_prim', 'amin_sek'],
    generalEquation: 'R–COOH + R′NH₂ + EDC → R–CO–NHR′ + Harnstoffderivat',
    example: {
      substrate: 'CC(C)C(N)C(=O)O',
      rxnSmiles: 'CC(C)C(N)C(=O)O.NCc1ccccc1>>CC(C)C(N)C(=O)NCc1ccccc1',
      caption: 'Valin wird mit Benzylamin zum Amid gekuppelt.',
    },
    reagents: [
      { name: 'Carbonsäure', role: 'Reagenz', equivalents: '1,0 Äq.' },
      { name: 'Amin', role: 'Reagenz', equivalents: '1,0–1,2 Äq.' },
      { name: 'EDC·HCl', role: 'Reagenz', equivalents: '1,2 Äq.', note: 'wasserlösliches Carbodiimid, Harnstoff lässt sich auswaschen' },
      { name: 'HOBt oder Oxyma', role: 'Katalysator', equivalents: '1,2 Äq.', note: 'unterdrückt Racemisierung' },
      { name: 'N,N-Diisopropylethylamin', role: 'Base', equivalents: '2,0 Äq.' },
    ],
    conditions: {
      temperature: '0 °C → Raumtemperatur',
      duration: '4–16 h',
      solvent: 'DMF oder Dichlormethan',
      atmosphere: 'Stickstoff empfohlen',
      workup: 'Waschen mit Citronensäure-, Hydrogencarbonat- und Kochsalzlösung',
      purification: 'Säulenchromatographie oder Umkristallisation',
      monitoring: 'DC oder LC-MS',
    },
    procedure: [
      {
        title: 'Säure aktivieren',
        detail:
          'Carbonsäure, HOBt und EDC·HCl in DMF lösen, auf 0 °C kühlen und 15 min rühren; dabei bildet sich der Aktivester.',
      },
      {
        title: 'Amin zugeben',
        detail: 'Amin und Base zugeben und langsam auf Raumtemperatur erwärmen lassen.',
        tip: 'Bei Aminhydrochloriden ein zusätzliches Äquivalent Base einsetzen.',
      },
      {
        title: 'Reaktion verfolgen',
        detail: 'Über Nacht rühren und den Umsatz per DC oder LC-MS kontrollieren.',
      },
      {
        title: 'Aufarbeiten',
        detail:
          'Mit Ethylacetat verdünnen, nacheinander mit 5 % Citronensäure, gesättigter NaHCO₃-Lösung und Kochsalzlösung waschen, trocknen und einengen.',
      },
    ],
    mechanism: {
      type: 'Aktivierung über O-Acylisoharnstoff',
      summary:
        'Das Carboxylat addiert an das Carbodiimid. Der reaktive O-Acylisoharnstoff wird von HOBt in den stabileren Aktivester überführt, den das Amin abfängt.',
      steps: [
        {
          title: '1. Addition an das Carbodiimid',
          description:
            'Das Carboxylat greift das zentrale Kohlenstoffatom des Carbodiimids an; es entsteht der O-Acylisoharnstoff.',
          electronFlow: 'Elektronenpaar des Carboxylat-Sauerstoffs → Carbodiimid-Kohlenstoff.',
          relativeEnergy: 25,
        },
        {
          title: '2. Umesterung zum HOBt-Aktivester',
          description:
            'HOBt greift den O-Acylisoharnstoff an. Der so gebildete Aktivester ist weniger anfällig für die Umlagerung zum unreaktiven N-Acylharnstoff.',
          electronFlow: 'Elektronenpaar des HOBt-Sauerstoffs → Acylkohlenstoff.',
          relativeEnergy: 20,
        },
        {
          title: '3. Aminolyse',
          description:
            'Das Amin greift den Aktivester an; nach Abspaltung von HOBt entsteht das Amid, der Harnstoff bleibt als Nebenprodukt zurück.',
          electronFlow: 'Elektronenpaar des Stickstoffs → Acylkohlenstoff.',
          relativeEnergy: 15,
          rateDetermining: true,
        },
      ],
      stereochemistry:
        'HOBt/Oxyma unterdrücken die Bildung von Oxazolonen und damit die Racemisierung am α-Kohlenstoff.',
      productEnergy: -65,
    },
    safety: {
      ghs: ['GHS07', 'GHS08'],
      hazards: [
        'EDC wirkt sensibilisierend (H317).',
        'DMF ist reproduktionstoxisch (H360D) – Ersatz durch 2-MeTHF oder EtOAc prüfen.',
        'Trockenes HOBt ist explosionsgefährlich; nur wasserfeuchte Ware verwenden.',
      ],
      precautions: ['Im Abzug arbeiten.', 'Hautkontakt strikt vermeiden.'],
      ppe: ['Schutzbrille', 'Nitrilhandschuhe (doppelt bei DMF)', 'Laborkittel'],
      waste: 'DMF-haltige Abfälle gesondert sammeln.',
      level: 'Fortgeschritten',
    },
    typicalYield: '70–95 %',
    scale: ['Laborsynthese', 'Wirkstoffentwicklung'],
    keywords: ['Peptid', 'Kupplungsreagenz', 'EDC', 'HOBt', 'Amidbindung'],
    references: [
      { title: 'El-Faham, Albericio, Chem. Rev. 2011, 111, 6557', source: 'Übersichtsartikel' },
    ],
  },
  {
    id: 'nabh4-reduktion',
    name: 'Reduktion von Aldehyden und Ketonen mit Natriumborhydrid',
    aliases: ['NaBH4-Reduktion'],
    category: 'organisch',
    reactionType: 'Nucleophile Addition (Reduktion)',
    summary:
      'Natriumborhydrid überträgt Hydrid auf die Carbonylgruppe und liefert den entsprechenden Alkohol. Ester, Amide und Carbonsäuren bleiben unberührt – das macht die Methode sehr selektiv.',
    smirks: '[CX3;!$([CX3](=O)[O,N,Cl,Br,I,S]):1]=[OX1:2]>>[CX4:1][OX2H1:2]',
    reactantDefaults: ['CC(=O)c1ccccc1'],
    substrateSlots: [0],
    functionalGroups: ['aldehyd', 'keton'],
    generalEquation: '4 R₂C=O + NaBH₄ + 4 H₂O → 4 R₂CH–OH + NaB(OH)₄',
    example: {
      substrate: 'CC(=O)c1ccccc1',
      rxnSmiles: 'CC(=O)c1ccccc1>>CC(O)c1ccccc1',
      caption: 'Acetophenon wird zu 1-Phenylethanol reduziert.',
    },
    reagents: [
      { name: 'Carbonylverbindung', role: 'Reagenz', equivalents: '1,0 Äq.' },
      {
        name: 'Natriumborhydrid',
        formula: 'NaBH4',
        role: 'Reduktionsmittel',
        equivalents: '0,3–1,0 Äq.',
        note: 'Formal überträgt ein Molekül vier Hydridionen.',
      },
      { name: 'Methanol oder Ethanol', role: 'Lösungsmittel', note: 'protisches Medium beschleunigt die Reaktion' },
    ],
    conditions: {
      temperature: '0 °C → Raumtemperatur',
      duration: '30 min – 2 h',
      solvent: 'Methanol, Ethanol oder THF/Wasser',
      apparatus: 'Rundkolben mit Rückflusskühler und Eisbad',
      workup: 'Vorsichtig mit verdünnter Säure oder gesättigter NH₄Cl-Lösung hydrolysieren',
      purification: 'Extraktion und Destillation oder Chromatographie',
    },
    procedure: [
      {
        title: 'Substrat lösen',
        detail: 'Carbonylverbindung in Methanol lösen und im Eisbad auf 0 °C kühlen.',
      },
      {
        title: 'Hydrid portionsweise zugeben',
        detail:
          'Natriumborhydrid in kleinen Portionen zugeben. Es entwickelt sich Wasserstoff, die Lösung schäumt.',
        caution: 'Wasserstoffentwicklung – keine Zündquellen, Gefäß nicht verschließen.',
      },
      {
        title: 'Ausreagieren lassen',
        detail: 'Nach beendeter Zugabe auf Raumtemperatur erwärmen und 1 h rühren; DC-Kontrolle.',
      },
      {
        title: 'Aufarbeiten',
        detail:
          'Überschüssiges Hydrid vorsichtig mit gesättigter Ammoniumchloridlösung zerstören, mit Ethylacetat extrahieren, trocknen und einengen.',
        tip: 'Borsäureester werden durch kurzes Rühren mit verdünnter Säure gespalten.',
      },
    ],
    mechanism: {
      type: 'Nucleophile Addition eines Hydridions',
      summary:
        'Das Boranat überträgt ein Hydrid auf den Carbonylkohlenstoff; das entstehende Alkoholat wird vom Lösungsmittel protoniert.',
      steps: [
        {
          title: '1. Hydridübertragung',
          rxnSmiles: 'CC(=O)c1ccccc1>>CC([O-])c1ccccc1',
          description:
            'Ein Hydridion des BH₄⁻ greift den elektrophilen Carbonylkohlenstoff an. Die π-Elektronen weichen auf den Sauerstoff aus.',
          electronFlow: 'B–H-Bindungselektronen → Carbonylkohlenstoff; C=O-π-Elektronen → Sauerstoff.',
          intermediate: 'Alkoholat (an Bor koordiniert)',
          relativeEnergy: 35,
          rateDetermining: true,
        },
        {
          title: '2. Protonierung',
          rxnSmiles: 'CC([O-])c1ccccc1>>CC(O)c1ccccc1',
          description:
            'Das Alkoholat nimmt ein Proton aus dem Alkohol-Lösungsmittel auf; es entsteht der Alkohol.',
          electronFlow: 'Elektronenpaar des Alkoholats → Proton des Lösungsmittels.',
          relativeEnergy: -75,
        },
      ],
      stereochemistry:
        'Der Angriff erfolgt von der sterisch weniger gehinderten Seite; bei prochiralen Ketonen entsteht ein Racemat.',
      competingPathways:
        'Lithiumaluminiumhydrid ist stärker und reduziert auch Ester und Carbonsäuren, erfordert aber wasserfreie Bedingungen.',
    },
    safety: {
      ghs: ['GHS02', 'GHS05', 'GHS06'],
      hazards: [
        'Natriumborhydrid entwickelt mit Wasser und Säuren Wasserstoff (H260).',
        'Giftig beim Verschlucken, verursacht Verätzungen (H301, H314).',
      ],
      precautions: [
        'Portionsweise zugeben und kühlen.',
        'Offene Flammen und Funken fernhalten.',
        'Reste nur stark verdünnt und langsam hydrolysieren.',
      ],
      ppe: ['Schutzbrille', 'Handschuhe', 'Laborkittel', 'Abzug'],
      waste: 'Hydridreste kontrolliert hydrolysieren, dann als wässrigen Abfall entsorgen.',
      level: 'Laborpraktikum',
    },
    typicalYield: '80–98 %',
    scale: ['Schulversuch', 'Laborsynthese', 'Industrie'],
    keywords: ['Reduktion', 'Hydrid', 'Alkohol', 'selektiv'],
    references: [
      { title: 'Organikum, Kapitel Reduktion von Carbonylverbindungen', source: 'Wiley-VCH' },
      { title: 'Chaikin, Brown, J. Am. Chem. Soc. 1949, 71, 122', source: 'Originalarbeit' },
    ],
  },
  {
    id: 'alkohol-oxidation-keton',
    name: 'Oxidation sekundärer Alkohole zum Keton',
    aliases: ['Jones-Oxidation', 'Dess-Martin-Oxidation'],
    category: 'organisch',
    reactionType: 'Oxidation',
    summary:
      'Sekundäre Alkohole lassen sich zum Keton oxidieren. Klassisch mit Chrom(VI), heute bevorzugt mit Dess-Martin-Periodinan oder katalytisch mit TEMPO – diese Varianten sind ungiftig und milder.',
    smirks: '[CX4;H1:1]([#6:3])([#6:4])[OX2H1:2]>>[CX3:1](=[OX1:2])([#6:3])[#6:4]',
    reactantDefaults: ['CC(O)c1ccccc1'],
    substrateSlots: [0],
    functionalGroups: ['alkohol_sek'],
    generalEquation: '3 R₂CH–OH + Cr₂O₇²⁻ + 8 H⁺ → 3 R₂C=O + 2 Cr³⁺ + 7 H₂O',
    example: {
      substrate: 'CC(O)c1ccccc1',
      rxnSmiles: 'CC(O)c1ccccc1>>CC(=O)c1ccccc1',
      caption: '1-Phenylethanol wird zu Acetophenon oxidiert.',
    },
    reagents: [
      { name: 'sekundärer Alkohol', role: 'Reagenz', equivalents: '1,0 Äq.' },
      {
        name: 'Dess-Martin-Periodinan',
        role: 'Oxidationsmittel',
        equivalents: '1,1–1,5 Äq.',
        note: 'Alternative: Jones-Reagenz (CrO₃/H₂SO₄) oder TEMPO/NaOCl.',
      },
      { name: 'Dichlormethan', role: 'Lösungsmittel' },
    ],
    conditions: {
      temperature: '0 °C → Raumtemperatur',
      duration: '30 min – 2 h',
      solvent: 'Dichlormethan (DMP) bzw. Aceton (Jones)',
      workup: 'Mit Natriumthiosulfat- und Hydrogencarbonatlösung ausrühren',
      purification: 'Säulenchromatographie oder Destillation',
      monitoring: 'DC – das Keton läuft deutlich weiter als der Alkohol',
    },
    procedure: [
      { title: 'Vorlegen', detail: 'Alkohol in trockenem Dichlormethan lösen und auf 0 °C kühlen.' },
      {
        title: 'Oxidationsmittel zugeben',
        detail: 'Dess-Martin-Periodinan portionsweise zugeben; die Lösung trübt sich.',
        caution: 'Bei Chrom(VI)-Varianten unbedingt Kontakt und Stäube vermeiden – krebserzeugend.',
      },
      { title: 'Rühren', detail: 'Auf Raumtemperatur erwärmen und bis zum vollständigen Umsatz rühren (DC).' },
      {
        title: 'Aufarbeiten',
        detail:
          'Mit gesättigter Na₂S₂O₃-Lösung und NaHCO₃-Lösung ausrühren, bis beide Phasen klar sind. Organische Phase trocknen und einengen.',
      },
    ],
    mechanism: {
      type: 'Oxidation über Ester-Zwischenstufe und β-Hydrid-Eliminierung',
      summary:
        'Der Alkohol bildet mit dem Oxidationsmittel einen Ester. Eine Base entfernt das α-Wasserstoffatom, das Metall bzw. Iod wird reduziert und die C=O-Bindung entsteht.',
      steps: [
        {
          title: '1. Esterbildung',
          description:
            'Der Alkohol greift das elektrophile Zentrum (Cr(VI) bzw. I(V)) an; es entsteht ein Chromat- bzw. Periodinanester.',
          electronFlow: 'Elektronenpaar des Alkoholsauerstoffs → Metall-/Iodzentrum.',
          relativeEnergy: 15,
        },
        {
          title: '2. Eliminierung des α-Wasserstoffs',
          rxnSmiles: 'CC(O)c1ccccc1>>CC(=O)c1ccccc1',
          description:
            'Eine Base entfernt das Wasserstoffatom am Carbinolkohlenstoff. Die Elektronen bilden die C=O-Doppelbindung, das Oxidationsmittel wird reduziert abgespalten.',
          electronFlow: 'C–H-Bindungselektronen → C–O-Bindung; O–Metall-Bindung bricht.',
          relativeEnergy: 40,
          rateDetermining: true,
        },
      ],
      competingPathways:
        'Primäre Alkohole werden unter wässrig-sauren Chrombedingungen bis zur Carbonsäure durchoxidiert; um beim Aldehyd zu stoppen, sind wasserfreie Bedingungen (PCC, Swern, DMP) nötig.',
      productEnergy: -95,
    },
    safety: {
      ghs: ['GHS05', 'GHS07', 'GHS08'],
      hazards: [
        'Chrom(VI)-Verbindungen sind krebserzeugend und erbgutverändernd (H350, H340).',
        'Dess-Martin-Periodinan kann beim Erhitzen explosionsartig zerfallen.',
      ],
      precautions: [
        'Chromfreie Alternative bevorzugen (DMP, TEMPO/NaOCl, Swern).',
        'Nicht über 60 °C erhitzen, keine Reibung bei DMP.',
      ],
      ppe: ['Schutzbrille', 'Handschuhe', 'Laborkittel', 'Abzug'],
      waste: 'Chromhaltige Abfälle separat als Schwermetallabfall sammeln.',
      level: 'Fortgeschritten',
    },
    typicalYield: '75–95 %',
    scale: ['Laborsynthese', 'Industrie'],
    keywords: ['Oxidation', 'Keton', 'Chromat', 'Dess-Martin', 'TEMPO'],
    references: [
      { title: 'Dess, Martin, J. Org. Chem. 1983, 48, 4155', source: 'Originalarbeit' },
      { title: 'Organikum, Kapitel Oxidation von Alkoholen', source: 'Wiley-VCH' },
    ],
  },
  {
    id: 'alkohol-oxidation-aldehyd',
    name: 'Oxidation primärer Alkohole zum Aldehyd',
    aliases: ['Swern-Oxidation', 'PCC-Oxidation'],
    category: 'organisch',
    reactionType: 'Oxidation',
    summary:
      'Unter wasserfreien Bedingungen bleibt die Oxidation primärer Alkohole auf der Stufe des Aldehyds stehen. In Wasser würde das Hydrat weiter zur Carbonsäure oxidiert.',
    smirks: '[CX4;H2:1]([#6:3])[OX2H1:2]>>[CX3;H1:1](=[OX1:2])[#6:3]',
    reactantDefaults: ['OCc1ccccc1'],
    substrateSlots: [0],
    functionalGroups: ['alkohol_prim'],
    generalEquation: 'R–CH₂OH + [O] → R–CHO + H₂O',
    example: {
      substrate: 'OCc1ccccc1',
      rxnSmiles: 'OCc1ccccc1>>O=Cc1ccccc1',
      caption: 'Benzylalkohol wird zu Benzaldehyd oxidiert.',
    },
    reagents: [
      { name: 'primärer Alkohol', role: 'Reagenz', equivalents: '1,0 Äq.' },
      { name: 'Oxalylchlorid', role: 'Reagenz', equivalents: '1,2 Äq.', note: 'Swern-Variante' },
      { name: 'Dimethylsulfoxid', role: 'Oxidationsmittel', equivalents: '2,4 Äq.' },
      { name: 'Triethylamin', role: 'Base', equivalents: '5,0 Äq.' },
    ],
    conditions: {
      temperature: '−78 °C (Swern), danach Erwärmen auf Raumtemperatur',
      duration: '1–2 h',
      solvent: 'trockenes Dichlormethan',
      atmosphere: 'Stickstoff oder Argon',
      apparatus: 'Dreihalskolben mit Tieftemperaturthermometer, Trockeneis/Aceton-Bad',
      workup: 'Mit Wasser quenchen, Phasen trennen',
      purification: 'Destillation oder Chromatographie',
    },
    procedure: [
      {
        title: 'Aktivierung',
        detail: 'DMSO in Dichlormethan bei −78 °C zu Oxalylchlorid tropfen; es entweicht CO und CO₂.',
        caution: 'Kohlenmonoxid entsteht – nur im Abzug arbeiten.',
      },
      { title: 'Alkohol zugeben', detail: 'Alkohol langsam zutropfen und 30 min bei −78 °C rühren.' },
      {
        title: 'Base zugeben',
        detail: 'Triethylamin zutropfen; die Lösung wird klar. Anschließend langsam auf Raumtemperatur erwärmen.',
        tip: 'Der typische Dimethylsulfid-Geruch zeigt den Reaktionsverlauf an.',
      },
      { title: 'Aufarbeiten', detail: 'Mit Wasser waschen, organische Phase trocknen, einengen und reinigen.' },
    ],
    mechanism: {
      type: 'Swern-Mechanismus (Sulfoniumylid)',
      summary:
        'DMSO wird durch Oxalylchlorid aktiviert, der Alkohol bildet ein Alkoxysulfoniumsalz. Die Base erzeugt ein Ylid, das intramolekular das α-Wasserstoffatom abstrahiert.',
      steps: [
        {
          title: '1. Aktivierung des DMSO',
          description: 'Oxalylchlorid überführt DMSO in ein Chlordimethylsulfoniumion; CO und CO₂ entweichen.',
          electronFlow: 'Elektronenpaar des Sulfoxidsauerstoffs → Carbonylkohlenstoff des Oxalylchlorids.',
          relativeEnergy: 10,
        },
        {
          title: '2. Bildung des Alkoxysulfoniumsalzes',
          description: 'Der Alkohol greift das Schwefelzentrum an; Chlorid wird abgespalten.',
          electronFlow: 'Elektronenpaar des Alkoholsauerstoffs → Schwefel.',
          relativeEnergy: 20,
        },
        {
          title: '3. Ylidbildung und intramolekulare Eliminierung',
          rxnSmiles: 'OCc1ccccc1>>O=Cc1ccccc1',
          description:
            'Triethylamin deprotoniert eine Methylgruppe am Schwefel. Das Ylid holt über einen fünfgliedrigen Übergangszustand das α-Wasserstoffatom; Dimethylsulfid wird frei.',
          electronFlow: 'Carbanion → α-Wasserstoff; C–H-Elektronen → C–O-Bindung; C–S-Bindung bricht.',
          relativeEnergy: 45,
          rateDetermining: true,
        },
      ],
      competingPathways:
        'Oberhalb von −40 °C kann die Pummerer-Umlagerung zu Methylthiomethylethern führen – die tiefe Temperatur ist entscheidend.',
      productEnergy: -85,
    },
    safety: {
      ghs: ['GHS02', 'GHS05', 'GHS06'],
      hazards: [
        'Oxalylchlorid ist giftig und ätzend, reagiert heftig mit Wasser (EUH014).',
        'Bei der Aktivierung entsteht Kohlenmonoxid (H331).',
      ],
      precautions: ['Ausschließlich im Abzug.', 'Temperatur strikt bei −78 °C halten.'],
      ppe: ['Schutzbrille', 'Kälteschutzhandschuhe', 'Laborkittel', 'Abzug'],
      waste: 'Halogenhaltige Lösungsmittel getrennt sammeln.',
      level: 'Fortgeschritten',
    },
    typicalYield: '80–95 %',
    scale: ['Laborsynthese'],
    keywords: ['Swern', 'Aldehyd', 'Oxidation', 'Tieftemperatur'],
    references: [{ title: 'Mancuso, Swern, Synthesis 1981, 165', source: 'Übersichtsartikel' }],
  },
  {
    id: 'aldehyd-oxidation-saeure',
    name: 'Oxidation von Aldehyden zur Carbonsäure',
    aliases: ['Tollens-Probe', 'Pinnick-Oxidation'],
    category: 'organisch',
    reactionType: 'Oxidation',
    summary:
      'Aldehyde werden von milden Oxidationsmitteln zur Carbonsäure oxidiert. Die Silberspiegelprobe nach Tollens nutzt diese Reaktion zum Nachweis.',
    smirks: '[CX3;H1:1](=[OX1:2])[#6:3]>>[CX3:1](=[OX1:2])([OX2H1])[#6:3]',
    reactantDefaults: ['O=Cc1ccccc1'],
    substrateSlots: [0],
    functionalGroups: ['aldehyd'],
    generalEquation: 'R–CHO + 2 [Ag(NH₃)₂]⁺ + 3 OH⁻ → R–COO⁻ + 2 Ag↓ + 4 NH₃ + 2 H₂O',
    example: {
      substrate: 'O=Cc1ccccc1',
      rxnSmiles: 'O=Cc1ccccc1>>OC(=O)c1ccccc1',
      caption: 'Benzaldehyd wird zu Benzoesäure oxidiert.',
    },
    reagents: [
      { name: 'Aldehyd', role: 'Reagenz', equivalents: '1,0 Äq.' },
      {
        name: 'Natriumchlorit',
        formula: 'NaClO2',
        role: 'Oxidationsmittel',
        equivalents: '2,0 Äq.',
        note: 'Pinnick-Bedingungen, sehr mild und funktionsgruppentolerant.',
      },
      { name: '2-Methyl-2-buten', role: 'Reagenz', equivalents: '5 Äq.', note: 'fängt die entstehende hypochlorige Säure ab' },
      { name: 'Natriumdihydrogenphosphat', role: 'Reagenz', note: 'Puffer' },
    ],
    conditions: {
      temperature: '0–25 °C',
      duration: '1–3 h',
      solvent: 'tert-Butanol/Wasser',
      workup: 'Ansäuern und extrahieren',
      purification: 'Umkristallisieren',
    },
    procedure: [
      { title: 'Ansatz', detail: 'Aldehyd in tert-Butanol lösen, Puffer und Radikalfänger zugeben.' },
      { title: 'Oxidationsmittel zutropfen', detail: 'Natriumchloritlösung langsam zutropfen und bei Raumtemperatur rühren.' },
      { title: 'Kontrolle', detail: 'Per DC verfolgen; das Produkt bleibt auf der Startlinie oder läuft stark tailend.' },
      { title: 'Aufarbeiten', detail: 'Mit HCl auf pH 2 ansäuern, mit Ethylacetat extrahieren, trocknen und einengen.' },
    ],
    mechanism: {
      type: 'Oxidation über das Aldehydhydrat',
      summary:
        'Das Aldehydhydrat wird am Kohlenstoff deprotoniert bzw. oxidiert. Bei Tollens wird Silber(I) zu elementarem Silber reduziert, das sich als Spiegel abscheidet.',
      steps: [
        {
          title: '1. Hydratbildung',
          rxnSmiles: 'O=Cc1ccccc1>>OC(O)c1ccccc1',
          description: 'Wasser addiert an die Carbonylgruppe; es entsteht das geminale Diol (Aldehydhydrat).',
          electronFlow: 'Elektronenpaar des Wassers → Carbonylkohlenstoff.',
          relativeEnergy: 12,
        },
        {
          title: '2. Oxidation des Hydrats',
          description:
            'Das Oxidationsmittel entzieht dem Hydrat zwei Elektronen und ein Proton; es entsteht die Carbonsäure. Silber(I) wird dabei zu Silber reduziert.',
          electronFlow: 'C–H-Bindungselektronen → Oxidationsmittel.',
          relativeEnergy: 38,
          rateDetermining: true,
        },
      ],
      competingPathways:
        'Ketone besitzen kein Wasserstoffatom am Carbonylkohlenstoff und werden deshalb nicht oxidiert – genau darauf beruht die Unterscheidung mit der Tollens- oder Fehling-Probe.',
      productEnergy: -130,
    },
    safety: {
      ghs: ['GHS03', 'GHS05', 'GHS07'],
      hazards: [
        'Natriumchlorit ist brandfördernd (H272) und ätzend.',
        'Tollens-Reagenz darf nicht aufbewahrt werden: es bildet explosives Silbernitrid.',
      ],
      precautions: [
        'Tollens-Reagenz stets frisch ansetzen und Reste sofort mit Salzsäure zersetzen.',
        'Chlorit nicht mit Säuren mischen – ClO₂-Bildung.',
      ],
      ppe: ['Schutzbrille', 'Handschuhe', 'Laborkittel'],
      waste: 'Silberhaltige Lösungen als Schwermetallabfall sammeln.',
      level: 'Laborpraktikum',
    },
    typicalYield: '80–98 %',
    scale: ['Schulversuch', 'Laborsynthese'],
    keywords: ['Tollens', 'Silberspiegel', 'Pinnick', 'Nachweisreaktion'],
    references: [
      { title: 'Bal, Pinnick et al., Tetrahedron 1981, 37, 2091', source: 'Originalarbeit' },
    ],
  },
  {
    id: 'aldol-kondensation',
    name: 'Aldolkondensation',
    aliases: ['Aldolreaktion', 'Claisen-Schmidt-Reaktion'],
    category: 'organisch',
    reactionType: 'C–C-Verknüpfung (nucleophile Addition + Eliminierung)',
    summary:
      'Zwei Carbonylverbindungen verknüpfen sich über ein Enolat zum β-Hydroxycarbonyl (Aldol); beim Erwärmen wird Wasser abgespalten und es entsteht ein konjugiertes Enon.',
    smirks:
      '[CX3;H1:1](=[OX1:2])[CX4;H1,H2,H3:3].[CX3;H1:4](=[OX1:5])[#6:6]>>[CX3;H1:1](=[OX1:2])[CX3:3]=[CX3:4][#6:6]',
    reactantDefaults: ['CC=O', 'CC=O'],
    substrateSlots: [0, 1],
    functionalGroups: ['aldehyd', 'keton', 'alpha_ch_acid'],
    generalEquation: '2 R–CH₂–CHO →(OH⁻) R–CH₂–CH(OH)–CHR–CHO →(−H₂O) R–CH₂–CH=CR–CHO',
    example: {
      substrate: 'CC=O',
      rxnSmiles: 'CC=O.CC=O>>C/C=C/C=O.O',
      caption: 'Zwei Moleküle Acetaldehyd ergeben Crotonaldehyd (But-2-enal).',
    },
    reagents: [
      { name: 'Carbonylverbindung mit α-H', role: 'Reagenz', equivalents: '1,0 Äq.' },
      { name: 'Natronlauge', formula: 'NaOH', role: 'Base', equivalents: '0,1–1,0 Äq.' },
      { name: 'Ethanol/Wasser', role: 'Lösungsmittel' },
    ],
    conditions: {
      temperature: '0–25 °C für das Aldol, 60–100 °C für die Kondensation',
      duration: '1–6 h',
      solvent: 'Ethanol/Wasser',
      workup: 'Neutralisieren, Produkt fällt häufig aus',
      purification: 'Umkristallisieren',
      monitoring: 'DC; das Enon absorbiert stark im UV',
    },
    procedure: [
      { title: 'Vorlegen', detail: 'Carbonylverbindung(en) in Ethanol lösen und auf 0 °C kühlen.' },
      {
        title: 'Base zugeben',
        detail: 'Natronlauge zutropfen und rühren. Bei gemischten Aldolreaktionen den Partner ohne α-H vorlegen.',
        tip: 'Ein Aldehyd ohne α-Wasserstoff (z. B. Benzaldehyd) verhindert unerwünschte Selbstkondensation.',
      },
      {
        title: 'Kondensation',
        detail: 'Zum Abschluss auf 60–80 °C erwärmen, bis das Wasser abgespalten ist und das Enon auskristallisiert.',
      },
      { title: 'Aufarbeiten', detail: 'Abkühlen, Kristalle absaugen, mit kaltem Ethanol waschen und umkristallisieren.' },
    ],
    mechanism: {
      type: 'Enolat-Mechanismus mit anschließender E1cb-Eliminierung',
      summary:
        'Die Base erzeugt ein Enolat, das als C-Nucleophil an eine zweite Carbonylgruppe addiert. Nach Protonierung entsteht das Aldol, das über ein Carbanion Wasser abspaltet.',
      steps: [
        {
          title: '1. Enolatbildung',
          rxnSmiles: 'CC=O>>[CH2-]C=O',
          description: 'Die Base entfernt ein α-Wasserstoffatom; das entstehende Enolat ist mesomeriestabilisiert.',
          electronFlow: 'Elektronenpaar der Base → α-H; C–H-Elektronen → C–C-Bindung, weiter zum Sauerstoff.',
          intermediate: 'Enolat',
          relativeEnergy: 25,
        },
        {
          title: '2. Nucleophile Addition',
          description: 'Das Enolat-Kohlenstoffatom greift die Carbonylgruppe des zweiten Moleküls an.',
          electronFlow: 'Carbanion-Elektronenpaar → Carbonylkohlenstoff; π-Elektronen → Sauerstoff.',
          intermediate: 'β-Alkoxid',
          relativeEnergy: 30,
          rateDetermining: true,
        },
        {
          title: '3. Protonierung zum Aldol',
          description: 'Das Alkoholat nimmt ein Proton aus dem Lösungsmittel auf; das β-Hydroxycarbonyl ist isolierbar.',
          electronFlow: 'Elektronenpaar des Alkoholats → Proton.',
          relativeEnergy: -20,
        },
        {
          title: '4. Wasserabspaltung (E1cb)',
          rxnSmiles: 'CC(O)CC=O>>C/C=C/C=O.O',
          description:
            'Erneute Deprotonierung am α-Kohlenstoff, danach Abgang des Hydroxids. Das konjugierte Enon ist thermodynamisch begünstigt.',
          electronFlow: 'Carbanion-Elektronenpaar → C–C-Bindung; C–OH-Bindung bricht.',
          relativeEnergy: -45,
        },
      ],
      stereochemistry:
        'Die Kondensation liefert bevorzugt das E-konfigurierte Enon. Gezielte Stereokontrolle gelingt über Evans-Auxiliare oder Organokatalyse.',
      kinetics: 'Basenkatalysiert; bei niedriger Temperatur bleibt die Reaktion auf der Aldolstufe stehen.',
    },
    safety: {
      ghs: ['GHS02', 'GHS05', 'GHS07'],
      hazards: ['Natronlauge ist ätzend (H314).', 'Niedere Aldehyde sind leichtentzündlich und reizend.'],
      precautions: ['Im Abzug arbeiten.', 'Aldehyde kühl und dunkel lagern (Autoxidation).'],
      ppe: ['Schutzbrille', 'Handschuhe', 'Laborkittel'],
      waste: 'Organische Abfälle halogenfrei sammeln.',
      level: 'Schulversuch',
    },
    typicalYield: '60–90 %',
    scale: ['Schulversuch', 'Laborsynthese', 'Industrie'],
    keywords: ['Aldol', 'Enolat', 'C-C-Verknüpfung', 'Kondensation', 'Enon'],
    references: [
      { title: 'Clayden, Organic Chemistry, Kap. 26', source: 'Oxford University Press' },
      { title: 'Organikum, Kapitel Aldolreaktion', source: 'Wiley-VCH' },
    ],
  },
  {
    id: 'claisen-kondensation',
    name: 'Claisen-Esterkondensation',
    category: 'organisch',
    reactionType: 'C–C-Verknüpfung (Acyl-Substitution)',
    summary:
      'Zwei Estermoleküle kondensieren basenvermittelt zum β-Ketoester. Die Triebkraft ist die Deprotonierung des besonders aciden Produkts, daher wird ein volles Äquivalent Base benötigt.',
    smirks:
      '[CX3:1](=[OX1:2])[OX2][CX4].[CX4;H2,H3:5][CX3:3](=[OX1:4])[OX2:6][CX4:7]>>[CX3:1](=[OX1:2])[CX4:5][CX3:3](=[OX1:4])[OX2:6][CX4:7]',
    reactantDefaults: ['CCOC(C)=O', 'CCOC(C)=O'],
    substrateSlots: [0, 1],
    functionalGroups: ['ester', 'alpha_ch_acid'],
    generalEquation: '2 R–CH₂–COOEt + NaOEt → R–CH₂–CO–CHR–COOEt + EtOH',
    example: {
      substrate: 'CCOC(C)=O',
      rxnSmiles: 'CCOC(C)=O.CCOC(C)=O>>CCOC(=O)CC(C)=O.CCO',
      caption: 'Aus Essigsäureethylester entsteht Acetessigester – der klassische Baustein der Esterkondensation.',
    },
    reagents: [
      { name: 'Ester mit α-H', role: 'Reagenz', equivalents: '2,0 Äq.' },
      {
        name: 'Natriumethanolat',
        role: 'Base',
        equivalents: '1,0 Äq.',
        note: 'Das Alkoholat muss zum Esterrest passen, sonst kommt es zur Umesterung.',
      },
      { name: 'Ethanol (wasserfrei)', role: 'Lösungsmittel' },
    ],
    conditions: {
      temperature: 'Rückfluss (78 °C)',
      duration: '3–8 h',
      solvent: 'wasserfreies Ethanol oder Toluol',
      atmosphere: 'trockener Stickstoff',
      workup: 'Mit verdünnter Essigsäure ansäuern',
      purification: 'Destillation im Vakuum',
    },
    procedure: [
      {
        title: 'Base bereiten',
        detail: 'Natrium in absolutem Ethanol lösen oder frisches Natriumethanolat einwiegen.',
        caution: 'Natrium reagiert heftig mit Wasser – nur mit absolutem Alkohol arbeiten.',
      },
      { title: 'Ester zugeben', detail: 'Ester zutropfen und unter Rückfluss erhitzen; das Gemisch färbt sich.' },
      {
        title: 'Nachrühren',
        detail: 'Mehrere Stunden kochen, bis kein Edukt mehr nachweisbar ist.',
        tip: 'Das Natriumsalz des β-Ketoesters fällt oft aus – ein gutes Zeichen für den Umsatz.',
      },
      {
        title: 'Aufarbeiten',
        detail: 'Abkühlen, mit Eisessig neutralisieren, mit Wasser versetzen, extrahieren und im Vakuum destillieren.',
      },
    ],
    mechanism: {
      type: 'Additions-Eliminierungs-Mechanismus mit Enolat',
      summary:
        'Das Esterenolat greift ein zweites Estermolekül an; das Alkoholat wird abgespalten. Erst die Deprotonierung des β-Ketoesters macht die Reaktion irreversibel.',
      steps: [
        {
          title: '1. Enolatbildung',
          description: 'Das Alkoholat entfernt ein α-Wasserstoffatom des Esters (pKs ≈ 25).',
          electronFlow: 'Elektronenpaar der Base → α-H.',
          relativeEnergy: 35,
        },
        {
          title: '2. Angriff am zweiten Ester',
          description: 'Das Enolat addiert an den Carbonylkohlenstoff; es bildet sich das tetraedrische Zwischenprodukt.',
          electronFlow: 'Carbanion → Carbonylkohlenstoff.',
          relativeEnergy: 40,
          rateDetermining: true,
        },
        {
          title: '3. Abspaltung des Alkoholats',
          description: 'Die C=O-Bindung bildet sich zurück und stößt das Ethanolat aus – der β-Ketoester entsteht.',
          electronFlow: 'Alkoxid-Elektronenpaar → C–O-Bindung; C–OEt-Bindung bricht.',
          relativeEnergy: 10,
        },
        {
          title: '4. Deprotonierung des Produkts (Triebkraft)',
          rxnSmiles: 'CCOC(=O)CC(C)=O>>CCOC(=O)[CH-]C(C)=O',
          description:
            'Das Methylen zwischen beiden Carbonylgruppen ist mit pKs ≈ 11 deutlich acider als die Edukte. Die Deprotonierung zieht das Gleichgewicht vollständig auf die Produktseite.',
          electronFlow: 'Elektronenpaar der Base → acides H; Ladung wird über beide Carbonylgruppen delokalisiert.',
          relativeEnergy: -50,
        },
      ],
      competingPathways:
        'Ester ohne α-Wasserstoff (z. B. Benzoesäureester) können nur als Elektrophil dienen – gekreuzte Claisen-Reaktion.',
    },
    safety: {
      ghs: ['GHS02', 'GHS05'],
      hazards: ['Natrium und Alkoholate reagieren heftig mit Wasser (H260).', 'Ethanol ist leichtentzündlich.'],
      precautions: ['Feuchtigkeit ausschließen.', 'Natriumreste mit Isopropanol vernichten.'],
      ppe: ['Schutzbrille', 'Handschuhe', 'Laborkittel', 'Abzug'],
      waste: 'Alkoholathaltige Reste vorsichtig mit Isopropanol, dann Wasser zersetzen.',
      level: 'Fortgeschritten',
    },
    typicalYield: '60–85 %',
    scale: ['Laborsynthese', 'Industrie'],
    keywords: ['Claisen', 'Acetessigester', 'β-Ketoester', 'Enolat'],
    references: [{ title: 'Organikum, Kapitel Esterkondensation', source: 'Wiley-VCH' }],
  },
  {
    id: 'grignard-addition',
    name: 'Grignard-Addition an Carbonylverbindungen',
    category: 'organisch',
    reactionType: 'C–C-Verknüpfung (nucleophile Addition)',
    summary:
      'Organomagnesiumverbindungen übertragen einen Kohlenstoffrest auf Aldehyde und Ketone. Nach wässriger Aufarbeitung entstehen sekundäre bzw. tertiäre Alkohole.',
    smirks: '[CX3:1]=[OX1:2].[#6:3][Mg][F,Cl,Br,I]>>[CX4:1][#6:3].[OX2H1:2]',
    reactantDefaults: ['CC(C)=O', 'C[Mg]Br'],
    substrateSlots: [0, 1],
    functionalGroups: ['aldehyd', 'keton', 'grignard'],
    generalEquation: 'R₂C=O + R′MgX → R₂C(OMgX)R′ →(H₃O⁺) R₂C(OH)R′',
    example: {
      substrate: 'CC(C)=O',
      rxnSmiles: 'CC(C)=O.C[Mg]Br>>CC(C)(C)O',
      caption: 'Aceton und Methylmagnesiumbromid ergeben tert-Butanol.',
    },
    reagents: [
      { name: 'Carbonylverbindung', role: 'Reagenz', equivalents: '1,0 Äq.' },
      { name: 'Grignard-Reagenz', role: 'Reagenz', equivalents: '1,1–1,5 Äq.' },
      { name: 'Diethylether oder THF', role: 'Lösungsmittel', note: 'stabilisiert das Magnesium durch Koordination' },
      { name: 'Ammoniumchloridlösung', role: 'Säure', note: 'zur Hydrolyse des Alkoholats' },
    ],
    conditions: {
      temperature: '0 °C → Raumtemperatur',
      duration: '1–3 h',
      solvent: 'absoluter Diethylether oder THF',
      atmosphere: 'Stickstoff oder Argon – absolut wasserfrei',
      apparatus: 'ausgeheizter Kolben mit Tropftrichter und Trockenrohr',
      workup: 'Gesättigte NH₄Cl-Lösung zugeben',
      purification: 'Destillation oder Chromatographie',
    },
    procedure: [
      {
        title: 'Alles trocknen',
        detail: 'Glasgeräte ausheizen, Lösungsmittel absolutieren. Schon Spuren von Wasser zerstören das Reagenz.',
        caution: 'Grignard-Verbindungen reagieren heftig mit Wasser zum Alkan.',
      },
      { title: 'Reagenz vorlegen', detail: 'Grignard-Lösung im Kolben vorlegen und auf 0 °C kühlen.' },
      {
        title: 'Carbonyl zutropfen',
        detail: 'Die Carbonylverbindung in Ether gelöst langsam zutropfen; die Reaktion ist stark exotherm.',
        tip: 'Zutropfgeschwindigkeit so wählen, dass der Ether nicht siedet.',
      },
      {
        title: 'Hydrolysieren',
        detail:
          'Nach 1–2 h Rühren vorsichtig gesättigte Ammoniumchloridlösung zugeben, bis sich die Magnesiumsalze lösen. Phasen trennen, trocknen, einengen.',
      },
    ],
    mechanism: {
      type: 'Nucleophile Addition eines Carbanionäquivalents',
      summary:
        'Die stark polarisierte C–Mg-Bindung macht den Kohlenstoff nucleophil. Er addiert an das Carbonyl; das Magnesiumalkoholat wird erst bei der Aufarbeitung hydrolysiert.',
      steps: [
        {
          title: '1. Koordination und Addition',
          rxnSmiles: 'CC(C)=O.C[Mg]Br>>CC(C)(C)[O-]',
          description:
            'Das Magnesium koordiniert an den Carbonylsauerstoff und aktiviert ihn; gleichzeitig greift der Alkylrest den Carbonylkohlenstoff an (viergliedriger Übergangszustand).',
          electronFlow: 'C–Mg-Bindungselektronen → Carbonylkohlenstoff; π-Elektronen → Sauerstoff.',
          intermediate: 'Magnesiumalkoholat',
          relativeEnergy: 30,
          rateDetermining: true,
        },
        {
          title: '2. Hydrolyse',
          rxnSmiles: 'CC(C)(C)[O-]>>CC(C)(C)O',
          description: 'Bei der Aufarbeitung nimmt das Alkoholat ein Proton auf; es entsteht der Alkohol.',
          electronFlow: 'Elektronenpaar des Alkoholats → Proton.',
          relativeEnergy: -80,
        },
      ],
      competingPathways:
        'Bei sterisch anspruchsvollen Ketonen treten Enolisierung und Reduktion als Nebenreaktionen auf; dann helfen Organocer- oder Organolithiumverbindungen.',
    },
    safety: {
      ghs: ['GHS02', 'GHS05'],
      hazards: [
        'Grignard-Lösungen sind selbstentzündlich an Luft (H250) und reagieren heftig mit Wasser (H261).',
        'Diethylether ist hochentzündlich und bildet Peroxide (H224, EUH019).',
      ],
      precautions: [
        'Unter Schutzgas arbeiten, keine offenen Flammen.',
        'Ether auf Peroxide prüfen, bevor er eingeengt wird.',
      ],
      ppe: ['Schutzbrille', 'Handschuhe', 'Laborkittel', 'Abzug'],
      waste: 'Reste unter Kühlung mit Isopropanol, dann Wasser zersetzen.',
      level: 'Fortgeschritten',
    },
    typicalYield: '65–92 %',
    scale: ['Laborsynthese', 'Industrie'],
    keywords: ['Grignard', 'metallorganisch', 'Alkohol', 'C-C-Knüpfung'],
    references: [
      { title: 'V. Grignard, C. R. Acad. Sci. 1900, 130, 1322', source: 'Originalarbeit (Nobelpreis 1912)' },
      { title: 'Organikum, Kapitel Metallorganische Verbindungen', source: 'Wiley-VCH' },
    ],
  },
  {
    id: 'wittig-reaktion',
    name: 'Wittig-Reaktion',
    category: 'organisch',
    reactionType: 'Olefinierung',
    summary:
      'Ein Phosphorylid wandelt die Carbonylgruppe in eine C=C-Doppelbindung um. Anders als bei Eliminierungen ist die Lage der neuen Doppelbindung eindeutig festgelegt.',
    smirks: '[CX3:1]=[OX1:2].[CX3:3]=[PX4:4]>>[CX3:1]=[CX3:3]',
    reactantDefaults: ['O=Cc1ccccc1', 'CC=P(c1ccccc1)(c1ccccc1)c1ccccc1'],
    substrateSlots: [0],
    functionalGroups: ['aldehyd', 'keton'],
    generalEquation: 'R₂C=O + Ph₃P=CR′₂ → R₂C=CR′₂ + Ph₃P=O',
    example: {
      substrate: 'O=Cc1ccccc1',
      rxnSmiles: 'O=Cc1ccccc1.CC=P(c1ccccc1)(c1ccccc1)c1ccccc1>>CC=Cc1ccccc1',
      caption: 'Benzaldehyd wird mit einem Ylid zu 1-Phenylpropen olefiniert.',
    },
    reagents: [
      { name: 'Carbonylverbindung', role: 'Reagenz', equivalents: '1,0 Äq.' },
      { name: 'Phosphoniumsalz', role: 'Reagenz', equivalents: '1,2 Äq.' },
      { name: 'n-Butyllithium oder NaH', role: 'Base', equivalents: '1,2 Äq.', note: 'erzeugt das Ylid' },
      { name: 'THF', role: 'Lösungsmittel' },
    ],
    conditions: {
      temperature: '−78 °C → Raumtemperatur',
      duration: '2–12 h',
      solvent: 'THF oder Dichlormethan',
      atmosphere: 'Argon',
      workup: 'Mit Wasser quenchen; Triphenylphosphinoxid abtrennen',
      purification: 'Säulenchromatographie – das Phosphinoxid ist stark polar',
    },
    procedure: [
      {
        title: 'Ylid erzeugen',
        detail: 'Phosphoniumsalz in THF suspendieren, auf −78 °C kühlen und die Base zutropfen. Die typische tiefe Farbe zeigt das Ylid an.',
        caution: 'n-Butyllithium ist selbstentzündlich – nur mit Spritzentechnik unter Argon handhaben.',
      },
      { title: 'Carbonyl zugeben', detail: 'Aldehyd oder Keton in THF gelöst zutropfen und langsam erwärmen lassen.' },
      { title: 'Rühren', detail: 'Über Nacht bei Raumtemperatur rühren; die Farbe verschwindet bei vollständigem Umsatz.' },
      { title: 'Aufarbeiten', detail: 'Mit Wasser quenchen, extrahieren, einengen und chromatographisch reinigen.' },
    ],
    mechanism: {
      type: '[2+2]-Cycloaddition über Oxaphosphetan',
      summary:
        'Das Ylid addiert an die Carbonylgruppe, es bildet sich ein viergliedriges Oxaphosphetan. Dieses zerfällt in das Alken und Triphenylphosphinoxid – die starke P=O-Bindung ist die Triebkraft.',
      steps: [
        {
          title: '1. Angriff des Ylids',
          description: 'Der carbanionische Ylidkohlenstoff greift den Carbonylkohlenstoff an.',
          electronFlow: 'Carbanion-Elektronenpaar → Carbonylkohlenstoff; π-Elektronen → Sauerstoff.',
          intermediate: 'Betain bzw. direkt das Oxaphosphetan',
          relativeEnergy: 25,
          rateDetermining: true,
        },
        {
          title: '2. Bildung des Oxaphosphetans',
          description: 'Der Sauerstoff bindet an den Phosphor; es entsteht der gespannte Vierring.',
          electronFlow: 'Elektronenpaar des Alkoxids → Phosphor.',
          relativeEnergy: 5,
        },
        {
          title: '3. Cycloreversion',
          rxnSmiles: 'O=Cc1ccccc1.CC=P(c1ccccc1)(c1ccccc1)c1ccccc1>>CC=Cc1ccccc1',
          description:
            'Der Vierring zerfällt in das Alken und Triphenylphosphinoxid. Die Bildung der sehr stabilen P=O-Bindung (ca. 540 kJ/mol) macht den Schritt irreversibel.',
          electronFlow: 'C–P- und C–O-Bindungen brechen, C=C- und P=O-Bindungen entstehen.',
          relativeEnergy: -90,
        },
      ],
      stereochemistry:
        'Nicht stabilisierte Ylide liefern überwiegend das Z-Alken, stabilisierte (mit Estergruppe) das E-Alken. Die Horner-Wadsworth-Emmons-Variante mit Phosphonaten ist E-selektiv.',
    },
    safety: {
      ghs: ['GHS02', 'GHS05', 'GHS07'],
      hazards: ['n-Butyllithium entzündet sich an Luft selbst (H250).', 'THF bildet Peroxide (EUH019).'],
      precautions: ['Strikt unter Schutzgas arbeiten.', 'Löschmittel für Metallbrände bereithalten (Sand, Klasse D).'],
      ppe: ['Schutzbrille', 'schwer entflammbarer Kittel', 'Handschuhe', 'Abzug'],
      waste: 'Reste unter Argon mit Isopropanol quenchen.',
      level: 'Fortgeschritten',
    },
    typicalYield: '60–95 %',
    scale: ['Laborsynthese', 'Industrie'],
    keywords: ['Wittig', 'Ylid', 'Alken', 'Olefinierung', 'Nobelpreis 1979'],
    references: [
      { title: 'Wittig, Geissler, Liebigs Ann. Chem. 1953, 580, 44', source: 'Originalarbeit' },
    ],
  },
  {
    id: 'reduktive-aminierung',
    name: 'Reduktive Aminierung',
    category: 'organisch',
    reactionType: 'Kondensation mit anschließender Reduktion',
    summary:
      'Aus Carbonylverbindung und Amin entsteht ein Imin, das direkt im Ansatz zum Amin reduziert wird. Das ist der zuverlässigste Weg zu sekundären und tertiären Aminen ohne Mehrfachalkylierung.',
    smirks: '[CX3:1]=[OX1:2].[NX3;H2,H1;!$(NC=O):3]>>[CX4:1][NX3:3]',
    reactantDefaults: ['CC(C)=O', 'NCc1ccccc1'],
    substrateSlots: [0, 1],
    functionalGroups: ['aldehyd', 'keton', 'amin_prim', 'amin_sek'],
    generalEquation: 'R₂C=O + R′NH₂ →(−H₂O) R₂C=NR′ →(NaBH₃CN) R₂CH–NHR′',
    example: {
      substrate: 'CC(C)=O',
      rxnSmiles: 'CC(C)=O.NCc1ccccc1>>CC(C)NCc1ccccc1',
      caption: 'Aceton und Benzylamin ergeben N-Benzylisopropylamin.',
    },
    reagents: [
      { name: 'Carbonylverbindung', role: 'Reagenz', equivalents: '1,0 Äq.' },
      { name: 'Amin', role: 'Reagenz', equivalents: '1,0–1,2 Äq.' },
      {
        name: 'Natriumtriacetoxyborhydrid',
        role: 'Reduktionsmittel',
        equivalents: '1,5 Äq.',
        note: 'reduziert Imine deutlich schneller als Ketone – deshalb Eintopfreaktion möglich',
      },
      { name: 'Essigsäure', role: 'Katalysator', equivalents: '0,1–1,0 Äq.' },
    ],
    conditions: {
      temperature: 'Raumtemperatur',
      duration: '4–24 h',
      solvent: '1,2-Dichlorethan, THF oder Methanol',
      workup: 'Mit NaHCO₃-Lösung quenchen',
      purification: 'Säulenchromatographie oder Salzbildung (Hydrochlorid)',
    },
    procedure: [
      { title: 'Imin bilden', detail: 'Carbonylverbindung und Amin mit etwas Essigsäure 30 min rühren.' },
      {
        title: 'Reduktionsmittel zugeben',
        detail: 'Natriumtriacetoxyborhydrid portionsweise zugeben.',
        caution: 'Gasentwicklung möglich – Kolben nicht verschließen.',
      },
      { title: 'Rühren', detail: 'Bei Raumtemperatur bis zum vollständigen Umsatz rühren (DC/LC-MS).' },
      {
        title: 'Aufarbeiten',
        detail: 'Mit gesättigter NaHCO₃-Lösung quenchen, extrahieren, trocknen und reinigen.',
      },
    ],
    mechanism: {
      type: 'Kondensation zum Iminiumion mit Hydridreduktion',
      summary:
        'Das Amin addiert an die Carbonylgruppe. Nach Wasserabspaltung entsteht ein Iminiumion, das vom Hydrid abgefangen wird.',
      steps: [
        {
          title: '1. Addition des Amins',
          description: 'Das Amin greift den Carbonylkohlenstoff an; es entsteht das Halbaminal.',
          electronFlow: 'Elektronenpaar des Stickstoffs → Carbonylkohlenstoff.',
          relativeEnergy: 25,
        },
        {
          title: '2. Wasserabspaltung zum Iminiumion',
          rxnSmiles: 'CC(C)=O.NCc1ccccc1>>CC(C)=[NH+]Cc1ccccc1',
          description:
            'Säurekatalysiert wird Wasser abgespalten; das Iminiumion ist das eigentliche Elektrophil. Der pH-Wert von etwa 5 ist optimal.',
          electronFlow: 'Freies Elektronenpaar des Stickstoffs → C–N-Bindung; C–OH₂-Bindung bricht.',
          intermediate: 'Iminiumion',
          relativeEnergy: 30,
          rateDetermining: true,
        },
        {
          title: '3. Hydridübertragung',
          rxnSmiles: 'CC(C)=[NH+]Cc1ccccc1>>CC(C)NCc1ccccc1',
          description: 'Das Borhydrid überträgt ein Hydrid auf das Iminiumkohlenstoffatom; das Amin entsteht.',
          electronFlow: 'B–H-Bindungselektronen → Iminiumkohlenstoff.',
          relativeEnergy: -70,
        },
      ],
      competingPathways:
        'Bei zu hohem pH bleibt das Imin unprotoniert und wird nicht reduziert; bei zu niedrigem pH ist das Amin protoniert und nicht mehr nucleophil.',
    },
    safety: {
      ghs: ['GHS02', 'GHS05', 'GHS07'],
      hazards: [
        'Borhydride entwickeln mit Wasser Wasserstoff (H260).',
        'Natriumcyanoborhydrid setzt mit Säure Blausäure frei – Triacetoxyvariante bevorzugen.',
      ],
      precautions: ['Im Abzug arbeiten.', 'Keine Säurezugabe zu Cyanoborhydrid-Ansätzen.'],
      ppe: ['Schutzbrille', 'Handschuhe', 'Laborkittel', 'Abzug'],
      waste: 'Borhydridreste kontrolliert hydrolysieren; cyanidhaltige Abfälle gesondert.',
      level: 'Laborpraktikum',
    },
    typicalYield: '70–95 %',
    scale: ['Laborsynthese', 'Wirkstoffentwicklung', 'Industrie'],
    keywords: ['Amin', 'Iminium', 'Hydrid', 'Eintopfreaktion'],
    references: [
      { title: 'Abdel-Magid et al., J. Org. Chem. 1996, 61, 3849', source: 'Originalarbeit' },
    ],
  },
  {
    id: 'acetal-schutzgruppe',
    name: 'Schützen von Carbonylgruppen als cyclisches Acetal',
    aliases: ['Dioxolan-Schutzgruppe'],
    category: 'organisch',
    reactionType: 'Schutzgruppenchemie (Kondensation)',
    summary:
      'Aldehyde und Ketone werden mit Ethylenglycol in das cyclische Acetal überführt. Acetale sind gegen Basen und Nucleophile stabil und lassen sich sauer wieder abspalten.',
    smirks: '[CX3:1]=[OX1:2].[OX2H1:3][CX4:4][CX4:5][OX2H1:6]>>[CX4:1]1[O:3][C:4][C:5][O:6]1',
    reactantDefaults: ['CC(=O)CCC=O', 'OCCO'],
    substrateSlots: [0],
    functionalGroups: ['aldehyd', 'keton'],
    generalEquation: 'R₂C=O + HOCH₂CH₂OH ⇌ R₂C(OCH₂CH₂O) + H₂O',
    example: {
      substrate: 'CC(=O)c1ccccc1',
      rxnSmiles: 'CC(=O)c1ccccc1.OCCO>>CC1(c2ccccc2)OCCO1.O',
      caption: 'Acetophenon wird als 1,3-Dioxolan geschützt.',
    },
    reagents: [
      { name: 'Carbonylverbindung', role: 'Reagenz', equivalents: '1,0 Äq.' },
      { name: 'Ethylenglycol', role: 'Reagenz', equivalents: '2–5 Äq.' },
      { name: 'p-Toluolsulfonsäure', role: 'Katalysator', equivalents: '0,05 Äq.' },
      { name: 'Toluol', role: 'Lösungsmittel', note: 'bildet mit Wasser ein Azeotrop' },
    ],
    conditions: {
      temperature: 'Rückfluss (110 °C)',
      duration: '4–16 h',
      solvent: 'Toluol',
      apparatus: 'Wasserabscheider nach Dean-Stark',
      workup: 'Mit NaHCO₃-Lösung neutralisieren',
      purification: 'Destillation oder Chromatographie',
      monitoring: 'Menge des abgeschiedenen Wassers',
    },
    procedure: [
      { title: 'Ansatz', detail: 'Carbonylverbindung, Glycol und Katalysator in Toluol vorlegen.' },
      {
        title: 'Wasser auskreisen',
        detail: 'Mit Wasserabscheider unter Rückfluss erhitzen, bis die berechnete Wassermenge abgeschieden ist.',
        tip: 'Je vollständiger das Wasser entfernt wird, desto weiter liegt das Gleichgewicht beim Acetal.',
      },
      { title: 'Neutralisieren', detail: 'Abkühlen, mit Hydrogencarbonatlösung waschen – sonst spaltet die Säure das Acetal wieder.' },
      {
        title: 'Entschützen (später)',
        detail: 'Zur Freisetzung der Carbonylgruppe mit verdünnter Salzsäure oder Aceton/Wasser rühren.',
      },
    ],
    mechanism: {
      type: 'Säurekatalysierte Acetalbildung über Oxocarbeniumion',
      summary:
        'Nach Protonierung addiert der Alkohol zum Halbacetal. Erneute Protonierung und Wasserabspaltung liefern ein Oxocarbeniumion, das vom zweiten Hydroxyl intramolekular abgefangen wird.',
      steps: [
        {
          title: '1. Protonierung und Addition',
          description: 'Die Carbonylgruppe wird protoniert, ein Hydroxyl des Glycols addiert zum Halbacetal.',
          electronFlow: 'Elektronenpaar des Alkohols → Carbonylkohlenstoff.',
          relativeEnergy: 20,
        },
        {
          title: '2. Bildung des Oxocarbeniumions',
          description: 'Die Halbacetal-Hydroxygruppe wird protoniert und als Wasser abgespalten.',
          electronFlow: 'Freies Elektronenpaar des Ethersauerstoffs → C–O-Bindung; C–OH₂ bricht.',
          intermediate: 'Oxocarbeniumion',
          relativeEnergy: 45,
          rateDetermining: true,
        },
        {
          title: '3. Ringschluss',
          rxnSmiles: 'CC(=O)c1ccccc1.OCCO>>CC1(c2ccccc2)OCCO1',
          description: 'Das zweite Hydroxyl greift intramolekular an; nach Deprotonierung liegt das Dioxolan vor.',
          electronFlow: 'Elektronenpaar des zweiten Alkohols → Oxocarbeniumkohlenstoff.',
          relativeEnergy: -25,
        },
      ],
      competingPathways:
        'Die gesamte Sequenz ist reversibel: wässrige Säure führt das Acetal wieder in die Carbonylverbindung zurück – genau das macht es als Schutzgruppe brauchbar.',
    },
    safety: {
      ghs: ['GHS02', 'GHS07'],
      hazards: ['Toluol ist leichtentzündlich und fruchtschädigend (H225, H361d).', 'pTsOH wirkt reizend.'],
      precautions: ['Im Abzug arbeiten.', 'Wasserabscheider sicher befestigen.'],
      ppe: ['Schutzbrille', 'Handschuhe', 'Laborkittel', 'Abzug'],
      waste: 'Toluolhaltige Abfälle halogenfrei sammeln.',
      level: 'Laborpraktikum',
    },
    typicalYield: '80–98 %',
    scale: ['Laborsynthese', 'Industrie'],
    keywords: ['Schutzgruppe', 'Acetal', 'Dioxolan', 'Gleichgewicht'],
    references: [
      { title: 'Greene, Wuts, Protective Groups in Organic Synthesis', source: 'Wiley' },
    ],
  },
  {
    id: 'lialh4-esterreduktion',
    name: 'Reduktion von Estern mit Lithiumaluminiumhydrid',
    category: 'organisch',
    reactionType: 'Reduktion',
    summary:
      'Lithiumaluminiumhydrid reduziert Ester über den Aldehyd hinaus zum primären Alkohol. Es greift auch Carbonsäuren, Amide und Nitrile an und ist damit deutlich unselektiver als Natriumborhydrid.',
    smirks: '[CX3:1](=[OX1:2])[OX2:3][CX4:4]>>[CX4:1][OX2H1:2].[OX2H1:3][CX4:4]',
    reactantDefaults: ['CCOC(=O)c1ccccc1'],
    substrateSlots: [0],
    functionalGroups: ['ester', 'carbonsaeure'],
    generalEquation: '4 R–COOR′ + 3 LiAlH₄ → 4 R–CH₂–OH + 4 R′–OH (nach Hydrolyse)',
    example: {
      substrate: 'CCOC(=O)c1ccccc1',
      rxnSmiles: 'CCOC(=O)c1ccccc1>>OCc1ccccc1.CCO',
      caption: 'Benzoesäureethylester wird zu Benzylalkohol und Ethanol reduziert.',
    },
    reagents: [
      { name: 'Ester', role: 'Reagenz', equivalents: '1,0 Äq.' },
      { name: 'Lithiumaluminiumhydrid', formula: 'LiAlH4', role: 'Reduktionsmittel', equivalents: '1,0–2,0 Äq.' },
      { name: 'THF oder Diethylether (absolut)', role: 'Lösungsmittel' },
    ],
    conditions: {
      temperature: '0 °C → Rückfluss',
      duration: '1–4 h',
      solvent: 'absolutes THF',
      atmosphere: 'Argon oder Stickstoff',
      apparatus: 'ausgeheizte Apparatur mit Trockenrohr',
      workup: 'Fieser-Aufarbeitung: pro g LiAlH₄ nacheinander 1 mL Wasser, 1 mL 15 % NaOH, 3 mL Wasser',
      purification: 'Filtrieren, trocknen, destillieren',
    },
    procedure: [
      {
        title: 'Hydrid suspendieren',
        detail: 'LiAlH₄ in absolutem THF unter Schutzgas suspendieren und auf 0 °C kühlen.',
        caution: 'Feststoff niemals mit Wasser oder Feuchtigkeit in Kontakt bringen – Brandgefahr.',
      },
      { title: 'Ester zutropfen', detail: 'Ester in THF gelöst langsam zutropfen; es entwickelt sich Wasserstoff.' },
      { title: 'Erhitzen', detail: 'Zum Abschluss 1–2 h unter Rückfluss erhitzen.' },
      {
        title: 'Fieser-Aufarbeitung',
        detail:
          'Im Eisbad nacheinander Wasser, Natronlauge und wieder Wasser zutropfen. Die Aluminiumsalze werden körnig und lassen sich abfiltrieren.',
        tip: 'Die Mengenregel 1:1:3 liefert einen gut filtrierbaren Niederschlag statt eines Gels.',
      },
    ],
    mechanism: {
      type: 'Zweifache Hydridaddition',
      summary:
        'Nach der ersten Hydridaddition zerfällt das tetraedrische Zwischenprodukt zum Aldehyd, der sofort ein zweites Hydrid aufnimmt – deshalb lässt sich die Reaktion nicht auf der Aldehydstufe anhalten.',
      steps: [
        {
          title: '1. Erste Hydridaddition',
          description: 'Ein Hydrid des AlH₄⁻ addiert an den Carbonylkohlenstoff; es entsteht ein Alkoxid.',
          electronFlow: 'Al–H-Bindungselektronen → Carbonylkohlenstoff.',
          relativeEnergy: 30,
          rateDetermining: true,
        },
        {
          title: '2. Abspaltung des Alkoholats zum Aldehyd',
          description: 'Das Alkoxid stößt das Alkoholat aus; der freigesetzte Aldehyd ist reaktiver als der Ester.',
          electronFlow: 'Alkoxid-Elektronenpaar → C–O-Bindung; C–OR′ bricht.',
          relativeEnergy: 10,
        },
        {
          title: '3. Zweite Hydridaddition',
          rxnSmiles: 'O=Cc1ccccc1>>OCc1ccccc1',
          description: 'Der Aldehyd wird sofort weiterreduziert; nach der Hydrolyse liegt der primäre Alkohol vor.',
          electronFlow: 'Al–H-Bindungselektronen → Aldehydkohlenstoff.',
          relativeEnergy: -85,
        },
      ],
      competingPathways:
        'Um beim Aldehyd zu stoppen, verwendet man DIBAL-H bei −78 °C – ein sterisch anspruchsvolles Hydrid mit nur einem übertragbaren H.',
    },
    safety: {
      ghs: ['GHS02', 'GHS05'],
      hazards: [
        'LiAlH₄ entzündet sich in Kontakt mit Wasser selbst (H260, H250).',
        'Ether und THF sind hochentzündlich und bilden Peroxide.',
      ],
      precautions: [
        'Nur mit trockenen Geräten und unter Schutzgas arbeiten.',
        'Metallbrandlöscher (Klasse D) oder trockenen Sand bereitstellen – kein Wasser, kein CO₂.',
      ],
      ppe: ['Schutzbrille', 'schwer entflammbarer Kittel', 'Handschuhe', 'Abzug'],
      waste: 'Reste unter Eiskühlung mit Ethylacetat, dann Isopropanol zersetzen.',
      level: 'Nur Fachlabor',
    },
    typicalYield: '75–95 %',
    scale: ['Laborsynthese'],
    keywords: ['LiAlH4', 'Reduktion', 'primärer Alkohol', 'Fieser-Aufarbeitung'],
    references: [{ title: 'Organikum, Kapitel Komplexe Hydride', source: 'Wiley-VCH' }],
  },
];
