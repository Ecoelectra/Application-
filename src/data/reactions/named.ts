/** Klassische Namensreaktionen der organischen Chemie. */
import type { ReactionRule } from '../types';

export const NAMED_REACTIONS: ReactionRule[] = [
  {
    id: 'cannizzaro',
    name: 'Cannizzaro-Reaktion',
    aliases: ['Disproportionierung von Aldehyden'],
    category: 'organisch',
    reactionType: 'Redox-Disproportionierung',
    summary:
      'Aldehyde ohne α-Wasserstoffatom disproportionieren in konzentrierter Lauge: Ein Molekül wird zum Alkohol reduziert, das andere zur Carbonsäure oxidiert. Ein Reduktionsmittel wird nicht gebraucht – der Aldehyd ist beides zugleich.',
    smirks:
      '[CX3H1:1](=[OX1:2])[#6:3].[CX3H1:4](=[OX1:5])[#6:6]>>[OX2H1][CX4H2:1][#6:3].[OX2H1][CX3:4](=[OX1:5])[#6:6]',
    reactantDefaults: ['O=Cc1ccccc1', 'O=Cc1ccccc1'],
    substrateSlots: [0],
    excludeSmarts: ['[CX3H1](=O)[CX4;H1,H2,H3]'],
    functionalGroups: ['aldehyd'],
    generalEquation: '2 Ar–CHO + NaOH → Ar–CH₂OH + Ar–COO⁻Na⁺',
    example: {
      substrate: 'O=Cc1ccccc1',
      rxnSmiles: 'O=Cc1ccccc1.O=Cc1ccccc1>>OCc1ccccc1.O=C(O)c1ccccc1',
      caption: 'Zwei Moleküle Benzaldehyd ergeben Benzylalkohol und Benzoesäure.',
    },
    reagents: [
      { name: 'Aldehyd ohne α-H', role: 'Reagenz', equivalents: '2,0 Äq.' },
      { name: 'Natronlauge (konz.)', formula: 'NaOH', role: 'Base', equivalents: '1,5 Äq.', note: '50-prozentig' },
    ],
    conditions: {
      temperature: '60–80 °C',
      duration: '1–3 h',
      solvent: 'Wasser oder Wasser/Methanol',
      workup: 'Alkohol mit Ether extrahieren, wässrige Phase ansäuern – die Säure fällt aus',
      purification: 'Umkristallisieren der Säure, Destillation des Alkohols',
    },
    procedure: [
      {
        title: 'Lauge vorlegen',
        detail: 'Konzentrierte Natronlauge im Kolben vorlegen und auf 60 °C erwärmen.',
        caution: 'Konzentrierte Lauge verätzt Haut und Augen sofort – Schutzbrille zwingend.',
      },
      {
        title: 'Aldehyd zugeben',
        detail: 'Den Aldehyd langsam zutropfen und kräftig rühren. Die Mischung ist zweiphasig und muss gut durchmischt werden.',
      },
      {
        title: 'Trennen',
        detail:
          'Nach dem Abkühlen mit Ether extrahieren: Der Alkohol geht in die Etherphase, das Carboxylat bleibt als Salz im Wasser.',
        tip: 'Das ist eine saubere Trennung nach Säure-Base-Eigenschaften – ideal, um das Prinzip der Extraktion zu zeigen.',
      },
      {
        title: 'Säure freisetzen',
        detail: 'Die wässrige Phase mit Salzsäure ansäuern; die Carbonsäure fällt als Feststoff aus und wird abfiltriert.',
      },
    ],
    mechanism: {
      type: 'Hydridübertragung',
      summary:
        'Hydroxid addiert an eine Carbonylgruppe. Das entstandene Alkoxid überträgt ein Hydrid-Ion direkt auf ein zweites Aldehydmolekül.',
      steps: [
        {
          title: '1. Addition des Hydroxids',
          rxnSmiles: 'O=Cc1ccccc1>>OC([O-])c1ccccc1',
          description: 'Das Hydroxid-Ion greift den Carbonylkohlenstoff an; es entsteht ein tetraedrisches Alkoxid.',
          electronFlow: 'Elektronenpaar des Hydroxids → Carbonylkohlenstoff; π-Elektronen → Sauerstoff.',
          intermediate: 'tetraedrisches Alkoxid',
          relativeEnergy: 30,
        },
        {
          title: '2. Hydridübertragung',
          description:
            'Das Alkoxid gibt das am Kohlenstoff sitzende Wasserstoffatom mitsamt Bindungselektronen als Hydrid an ein zweites Aldehydmolekül ab.',
          electronFlow: 'C–H-Bindungselektronen → Carbonylkohlenstoff des zweiten Moleküls; dessen π-Elektronen → Sauerstoff.',
          relativeEnergy: 65,
          rateDetermining: true,
        },
        {
          title: '3. Protonenübertragung',
          description:
            'Das entstandene Alkoholat nimmt ein Proton auf, die Carbonsäure gibt eines ab. Am Ende liegen Alkohol und Carboxylat vor.',
          electronFlow: 'Elektronenpaar des Alkoholats → Proton der Carbonsäure.',
          relativeEnergy: -30,
        },
      ],
      kinetics: 'Zweiter Ordnung im Aldehyd, erster Ordnung im Hydroxid – insgesamt dritter Ordnung.',
      competingPathways:
        'Aldehyde mit α-Wasserstoff reagieren stattdessen in der Aldolreaktion; die Cannizzaro-Reaktion bleibt ihnen verschlossen.',
      productEnergy: -95,
    },
    safety: {
      ghs: ['GHS05', 'GHS07'],
      hazards: ['Konzentrierte Natronlauge verursacht schwere Verätzungen (H314).'],
      precautions: ['Schutzbrille mit Seitenschutz tragen.', 'Lauge niemals auf den Aldehyd gießen, sondern umgekehrt.'],
      ppe: ['Schutzbrille', 'Nitrilhandschuhe', 'Laborkittel'],
      waste: 'Wässrige Phase neutralisieren, organische Phase in den Lösungsmittelbehälter.',
      level: 'Laborpraktikum',
    },
    typicalYield: '80–90 % (je Produkt etwa die Hälfte des Einsatzes)',
    scale: ['Laborsynthese', 'Schulversuch'],
    keywords: ['Disproportionierung', 'Hydrid', 'Benzaldehyd', 'Redox'],
    references: [
      { title: 'S. Cannizzaro, Liebigs Ann. Chem. 1853, 88, 129', source: 'Originalarbeit' },
      { title: 'Organikum, Kapitel Aldehyde und Ketone', source: 'Lehrbuch' },
    ],
  },
  {
    id: 'knoevenagel-kondensation',
    name: 'Knoevenagel-Kondensation',
    aliases: ['Doebner-Knoevenagel-Reaktion'],
    category: 'organisch',
    reactionType: 'Kondensation (C–C-Verknüpfung)',
    summary:
      'Ein Aldehyd kondensiert mit einer CH-aciden Verbindung zu einem Alken. Anders als bei der Aldolkondensation genügt eine schwache Base – die beiden Carbonylgruppen machen das Methylen sauer genug.',
    smirks:
      '[CX3H1:1]=[OX1].[CX4H2:2]([CX3:7]=[OX1:8])[CX3:9]=[OX1:10]>>[CX3H1:1]=[CX3:2]([CX3:7]=[OX1:8])[CX3:9]=[OX1:10]',
    reactantDefaults: ['O=Cc1ccccc1', 'CCOC(=O)CC(=O)OCC'],
    substrateSlots: [0, 1],
    functionalGroups: ['aldehyd', 'alpha_ch_acid', 'ester'],
    generalEquation: 'R–CHO + H₂C(COOR′)₂ → R–CH=C(COOR′)₂ + H₂O',
    example: {
      substrate: 'O=Cc1ccccc1',
      rxnSmiles: 'O=Cc1ccccc1.CCOC(=O)CC(=O)OCC>>CCOC(=O)C(=Cc1ccccc1)C(=O)OCC.O',
      caption: 'Benzaldehyd und Malonester ergeben Benzylidenmalonat.',
    },
    reagents: [
      { name: 'Aldehyd', role: 'Reagenz', equivalents: '1,0 Äq.' },
      { name: 'Malonester oder Malonsäure', role: 'Reagenz', equivalents: '1,1 Äq.' },
      { name: 'Piperidin', role: 'Base', equivalents: '0,1 Äq.', note: 'katalytisch; oft mit etwas Essigsäure' },
    ],
    conditions: {
      temperature: 'Rückfluss, 80–110 °C',
      duration: '2–6 h',
      solvent: 'Ethanol, Toluol oder Pyridin',
      apparatus: 'Rundkolben mit Wasserabscheider',
      workup: 'Abkühlen, das Produkt kristallisiert meist direkt aus',
      purification: 'Umkristallisieren aus Ethanol',
    },
    procedure: [
      { title: 'Ansatz', detail: 'Aldehyd und CH-acide Komponente im Lösungsmittel lösen.' },
      {
        title: 'Katalysator',
        detail: 'Piperidin und einen Tropfen Essigsäure zugeben – das Paar bildet den eigentlichen Katalysator.',
      },
      {
        title: 'Erhitzen',
        detail: 'Unter Rückfluss erhitzen und das Reaktionswasser mit dem Wasserabscheider entfernen.',
        tip: 'Der Wasserentzug verschiebt das Gleichgewicht vollständig auf die Produktseite.',
      },
      { title: 'Isolieren', detail: 'Abkühlen lassen; das kristalline Produkt absaugen und aus Ethanol umkristallisieren.' },
    ],
    mechanism: {
      type: 'Additions-Eliminierungs-Mechanismus über ein Carbanion',
      summary:
        'Die Base deprotoniert das Methylen zwischen den beiden Carbonylgruppen. Das stabilisierte Carbanion addiert an den Aldehyd, anschließend wird Wasser abgespalten.',
      steps: [
        {
          title: '1. Deprotonierung',
          description:
            'Das Methylen zwischen zwei Carbonylgruppen hat einen pKs-Wert um 13 und wird schon von schwachen Basen deprotoniert. Das Carbanion ist über beide Carbonylgruppen delokalisiert.',
          electronFlow: 'C–H-Bindungselektronen → Base; Ladung verteilt sich über beide C=O-Gruppen.',
          intermediate: 'mesomeriestabilisiertes Carbanion',
          relativeEnergy: 20,
        },
        {
          title: '2. Addition an den Aldehyd',
          description: 'Das Carbanion greift den Aldehydkohlenstoff an; es entsteht ein Alkoholat.',
          electronFlow: 'Elektronenpaar des Carbanions → Carbonylkohlenstoff des Aldehyds.',
          relativeEnergy: 45,
          rateDetermining: true,
        },
        {
          title: '3. Abspaltung von Wasser',
          description:
            'Nach Protonierung des Alkoholats wird Wasser abgespalten. Die entstehende Doppelbindung steht in Konjugation zu den Carbonylgruppen – das ist die Triebkraft.',
          electronFlow: 'C–H-Elektronen → neue C=C-Bindung; C–OH₂-Bindung bricht heterolytisch.',
          relativeEnergy: 35,
        },
      ],
      stereochemistry: 'Bevorzugt entsteht das E-Isomer, in dem die sperrigen Reste voneinander abgewandt stehen.',
      competingPathways: 'Bei Malonsäure schließt sich oft eine Decarboxylierung an (Doebner-Variante) – man erhält eine Zimtsäure.',
      productEnergy: -70,
    },
    safety: {
      ghs: ['GHS02', 'GHS07'],
      hazards: ['Piperidin ist leichtentzündlich und giftig beim Einatmen (H225, H311).'],
      precautions: ['Im Abzug arbeiten.', 'Zündquellen fernhalten.'],
      ppe: ['Schutzbrille', 'Nitrilhandschuhe', 'Abzug'],
      waste: 'Organische Reste in den Behälter für halogenfreie Lösungsmittel.',
      level: 'Laborpraktikum',
    },
    typicalYield: '70–95 %',
    scale: ['Laborsynthese', 'Industrie'],
    keywords: ['Kondensation', 'CH-acide', 'Malonester', 'Zimtsäure', 'Doebner'],
    references: [
      { title: 'E. Knoevenagel, Ber. Dtsch. Chem. Ges. 1894, 27, 2345', source: 'Originalarbeit' },
    ],
  },
  {
    id: 'claisen-schmidt',
    name: 'Claisen-Schmidt-Kondensation',
    aliases: ['Gekreuzte Aldolkondensation', 'Chalkonsynthese'],
    category: 'organisch',
    reactionType: 'Gekreuzte Aldolkondensation',
    summary:
      'Ein aromatischer Aldehyd ohne α-Wasserstoff kondensiert mit einem Methylketon zum Chalkon. Weil nur das Keton ein Enolat bilden kann, entsteht sauber ein einziges Produkt.',
    smirks:
      '[CX3H1:1](=[OX1:2])[c:3].[CX3:4](=[OX1:5])[CX4H3:6]>>[c:3][CX3H1:1]=[CX3H1:6][CX3:4]=[OX1:5]',
    reactantDefaults: ['O=Cc1ccccc1', 'CC(=O)c1ccccc1'],
    substrateSlots: [0, 1],
    functionalGroups: ['aldehyd', 'keton', 'aromat'],
    generalEquation: 'Ar–CHO + CH₃–CO–R → Ar–CH=CH–CO–R + H₂O',
    example: {
      substrate: 'O=Cc1ccccc1',
      rxnSmiles: 'O=Cc1ccccc1.CC(=O)c1ccccc1>>O=C(C=Cc1ccccc1)c1ccccc1.O',
      caption: 'Benzaldehyd und Acetophenon ergeben Chalkon – einen gelben, kristallinen Feststoff.',
    },
    reagents: [
      { name: 'Aromatischer Aldehyd', role: 'Reagenz', equivalents: '1,0 Äq.' },
      { name: 'Methylketon', role: 'Reagenz', equivalents: '1,0 Äq.' },
      { name: 'Natronlauge', formula: 'NaOH', role: 'Base', equivalents: '1,2 Äq.', note: '10-prozentig in Ethanol/Wasser' },
    ],
    conditions: {
      temperature: 'Raumtemperatur bis 30 °C',
      duration: '1–4 h',
      solvent: 'Ethanol/Wasser',
      workup: 'Mit Salzsäure neutralisieren; das Chalkon fällt aus',
      purification: 'Umkristallisieren aus Ethanol',
      monitoring: 'Das gelbe Produkt ist mit bloßem Auge zu erkennen',
    },
    procedure: [
      { title: 'Lösen', detail: 'Keton und Aldehyd in Ethanol lösen und auf Raumtemperatur bringen.' },
      {
        title: 'Base zugeben',
        detail: 'Natronlauge langsam zutropfen und eine Stunde rühren. Die Mischung färbt sich gelb.',
        tip: 'Die Temperatur unter 30 °C halten – sonst entstehen Nebenprodukte durch Mehrfachkondensation.',
      },
      { title: 'Fällen', detail: 'Mit verdünnter Salzsäure neutralisieren; das Chalkon kristallisiert aus.' },
      { title: 'Reinigen', detail: 'Absaugen, mit kaltem Ethanol waschen und umkristallisieren.' },
    ],
    mechanism: {
      type: 'Aldoladdition mit anschließender Eliminierung (E1cb)',
      summary:
        'Das Keton bildet ein Enolat, das an den Aldehyd addiert. Aus dem Aldol wird Wasser abgespalten – die Konjugation zum Aromaten treibt die Reaktion.',
      steps: [
        {
          title: '1. Enolatbildung',
          rxnSmiles: 'CC(=O)c1ccccc1>>[CH2-]C(=O)c1ccccc1',
          description: 'Die Base entfernt ein α-Wasserstoffatom des Ketons. Nur das Keton kann das – der Aldehyd hat keines.',
          electronFlow: 'C–H-Bindungselektronen → Hydroxid; Ladung wandert auf den Carbonylsauerstoff.',
          intermediate: 'Enolat',
          relativeEnergy: 25,
        },
        {
          title: '2. Aldoladdition',
          description: 'Das Enolat greift den Aldehyd an; es entsteht ein β-Hydroxyketon (Aldol).',
          electronFlow: 'Elektronenpaar des Enolats → Carbonylkohlenstoff des Aldehyds.',
          intermediate: 'β-Hydroxyketon',
          relativeEnergy: 50,
          rateDetermining: true,
        },
        {
          title: '3. Eliminierung von Wasser',
          description:
            'Erneute Deprotonierung und Abspaltung von Hydroxid liefern das konjugierte Enon. Die Konjugation mit dem Aromaten macht diesen Schritt irreversibel.',
          electronFlow: 'Carbanion-Elektronen → C=C-Bindung; C–OH-Bindung bricht.',
          relativeEnergy: 40,
        },
      ],
      stereochemistry: 'Es entsteht praktisch ausschließlich das E-konfigurierte Enon.',
      competingPathways: 'Bei zwei enolisierbaren Partnern entstünde ein Gemisch – deshalb der Aldehyd ohne α-H.',
      productEnergy: -80,
    },
    safety: {
      ghs: ['GHS05', 'GHS07'],
      hazards: ['Natronlauge ist ätzend (H314).', 'Chalkone können die Haut sensibilisieren.'],
      precautions: ['Handschuhe tragen.', 'Temperatur kontrollieren.'],
      ppe: ['Schutzbrille', 'Nitrilhandschuhe', 'Laborkittel'],
      waste: 'Neutralisieren, Feststoffreste in den Behälter für organische Feststoffe.',
      level: 'Schulversuch',
    },
    typicalYield: '75–90 %',
    scale: ['Schulversuch', 'Laborsynthese'],
    keywords: ['Chalkon', 'Aldol', 'gekreuzt', 'Enolat', 'gelb'],
    references: [
      { title: 'Organikum, Aldolreaktionen', source: 'Lehrbuch' },
      { title: 'Chalkone als Vorstufen der Flavonoide', source: 'Naturstoffchemie' },
    ],
  },
  {
    id: 'mannich-reaktion',
    name: 'Mannich-Reaktion',
    aliases: ['Aminomethylierung'],
    category: 'organisch',
    reactionType: 'Dreikomponentenreaktion (C–C-Verknüpfung)',
    summary:
      'Keton, Formaldehyd und ein Amin ergeben in einem Schritt eine β-Aminocarbonylverbindung. Die Reaktion verknüpft drei Bausteine auf einmal und ist ein Schlüsselweg zu Alkaloidgerüsten.',
    smirks:
      '[CX3:1](=[OX1:2])[CX4;H1,H2,H3:3].[NX3;H1,H2;!$(N[CX3]=[OX1]):4]>>[CX3:1](=[OX1:2])[CX4:3][CH2][NX3:4]',
    reactantDefaults: ['CC(C)=O', 'CNC'],
    substrateSlots: [0, 1],
    functionalGroups: ['keton', 'amin_prim', 'amin_sek', 'alpha_ch_acid'],
    generalEquation: 'R–CO–CH₃ + CH₂O + HNR′₂ → R–CO–CH₂–CH₂–NR′₂ + H₂O',
    example: {
      substrate: 'CC(C)=O',
      rxnSmiles: 'CC(C)=O.C=O.CNC>>CC(=O)CCN(C)C.O',
      caption: 'Aceton, Formaldehyd und Dimethylamin ergeben eine Mannich-Base.',
    },
    reagents: [
      { name: 'Keton mit α-H', role: 'Reagenz', equivalents: '1,0 Äq.' },
      { name: 'Formaldehyd', formula: 'CH2O', role: 'Reagenz', equivalents: '1,1 Äq.', note: 'als 37-prozentige Lösung (Formalin)' },
      { name: 'Sekundäres Amin als Hydrochlorid', role: 'Reagenz', equivalents: '1,0 Äq.' },
    ],
    conditions: {
      temperature: '60–80 °C',
      duration: '3–8 h',
      solvent: 'Ethanol oder Wasser',
      workup: 'Alkalisch stellen und mit Ether extrahieren',
      purification: 'Als Hydrochlorid kristallisieren',
      monitoring: 'Dünnschichtchromatographie',
    },
    procedure: [
      { title: 'Ansatz', detail: 'Aminhydrochlorid und Formaldehydlösung in Ethanol vorlegen.' },
      { title: 'Keton zugeben', detail: 'Das Keton zugeben und die Mischung mehrere Stunden erwärmen.' },
      {
        title: 'Aufarbeiten',
        detail: 'Abkühlen, mit Natronlauge alkalisch stellen und das freie Amin mit Ether extrahieren.',
        caution: 'Formaldehyd ist krebserzeugend – ausschließlich im Abzug arbeiten.',
      },
    ],
    mechanism: {
      type: 'Iminium-Additions-Mechanismus',
      summary:
        'Amin und Formaldehyd bilden ein Iminium-Ion. Das Enol des Ketons greift dieses starke Elektrophil an.',
      steps: [
        {
          title: '1. Bildung des Iminium-Ions',
          rxnSmiles: 'C=O.CNC>>C=[N+](C)C',
          description: 'Das Amin addiert an Formaldehyd; nach Wasserabspaltung entsteht ein Iminium-Ion.',
          electronFlow: 'Freies Elektronenpaar des Stickstoffs → Carbonylkohlenstoff; anschließend Abspaltung von Wasser.',
          intermediate: 'Iminium-Ion',
          relativeEnergy: 30,
        },
        {
          title: '2. Enolbildung',
          description: 'Das Keton tautomerisiert im Sauren zum Enol.',
          electronFlow: 'Protonenwanderung vom α-Kohlenstoff zum Carbonylsauerstoff.',
          relativeEnergy: 40,
        },
        {
          title: '3. Angriff des Enols',
          description: 'Das Enol greift das Iminium-Ion an; nach Deprotonierung liegt die Mannich-Base vor.',
          electronFlow: 'π-Elektronen des Enols → Iminium-Kohlenstoff.',
          relativeEnergy: 55,
          rateDetermining: true,
        },
      ],
      competingPathways:
        'Mannich-Basen spalten beim Erhitzen leicht das Amin ab und bilden Enone – das nutzt man gezielt als Michael-Akzeptor-Quelle.',
      productEnergy: -55,
    },
    safety: {
      ghs: ['GHS06', 'GHS08'],
      hazards: [
        'Formaldehyd ist krebserzeugend (H350) und stark reizend.',
        'Amine sind ätzend und haben einen durchdringenden Geruch.',
      ],
      precautions: ['Ausschließlich im Abzug arbeiten.', 'Formaldehydreste nicht offen stehen lassen.'],
      ppe: ['Schutzbrille', 'Nitrilhandschuhe', 'Abzug'],
      waste: 'Formaldehydhaltige Lösungen gesondert sammeln.',
      level: 'Fortgeschritten',
    },
    typicalYield: '50–80 %',
    scale: ['Laborsynthese', 'Industrie'],
    keywords: ['Dreikomponentenreaktion', 'Iminium', 'Aminomethylierung', 'Alkaloid'],
    references: [{ title: 'C. Mannich, W. Krösche, Arch. Pharm. 1912, 250, 647', source: 'Originalarbeit' }],
  },
  {
    id: 'malonester-synthese',
    name: 'Malonester-Synthese',
    aliases: ['Malonestersynthese', 'Alkylierung CH-acider Ester'],
    category: 'organisch',
    reactionType: 'Nucleophile Substitution am Carbanion',
    summary:
      'Der Malonester wird deprotoniert und mit einem Halogenalkan alkyliert. Nach Verseifung und Decarboxylierung erhält man eine um den Alkylrest verlängerte Essigsäure – ein klassischer Weg zu maßgeschneiderten Carbonsäuren.',
    smirks:
      '[CX4H2:1]([CX3:2]=[OX1:3])[CX3:4]=[OX1:5].[CX4:6][Br,I,Cl]>>[CX4:1]([CX3:2]=[OX1:3])([CX3:4]=[OX1:5])[CX4:6]',
    reactantDefaults: ['CCOC(=O)CC(=O)OCC', 'CCCBr'],
    substrateSlots: [0, 1],
    functionalGroups: ['alpha_ch_acid', 'ester', 'halogenalkan_prim', 'halogenalkan_sek'],
    generalEquation: 'H₂C(COOEt)₂ + R–X → R–CH(COOEt)₂ + HX',
    example: {
      substrate: 'CCCBr',
      rxnSmiles: 'CCOC(=O)CC(=O)OCC.CCCBr>>CCCC(C(=O)OCC)C(=O)OCC',
      caption: '1-Brompropan alkyliert den Malonester zum Propylmalonat.',
    },
    reagents: [
      { name: 'Malonsäurediethylester', role: 'Reagenz', equivalents: '1,0 Äq.' },
      { name: 'Natriumethanolat', formula: 'C2H5NaO', role: 'Base', equivalents: '1,05 Äq.' },
      { name: 'Halogenalkan', role: 'Reagenz', equivalents: '1,1 Äq.', note: 'primär oder sekundär – tertiäre eliminieren' },
    ],
    conditions: {
      temperature: 'Rückfluss, 78 °C',
      duration: '4–12 h',
      solvent: 'absolutes Ethanol',
      atmosphere: 'Stickstoff',
      workup: 'Ethanol abdestillieren, Rückstand in Wasser aufnehmen und ausethern',
      purification: 'Fraktionierende Destillation im Vakuum',
    },
    procedure: [
      {
        title: 'Alkoholat herstellen',
        detail: 'Natrium in absolutem Ethanol lösen – es entsteht Natriumethanolat unter Wasserstoffentwicklung.',
        caution: 'Natrium reagiert heftig; nur kleine Stücke zugeben und Zündquellen fernhalten.',
      },
      { title: 'Malonester zugeben', detail: 'Den Malonester zutropfen; er wird sofort deprotoniert.' },
      { title: 'Alkylieren', detail: 'Das Halogenalkan zugeben und unter Rückfluss erhitzen, bis die Lösung neutral reagiert.' },
      {
        title: 'Weiterverarbeiten',
        detail: 'Für die freie Säure anschließend verseifen und über 150 °C decarboxylieren.',
        tip: 'Die Decarboxylierung gelingt nur bei β-Ketosäuren und Malonsäuren – dort stabilisiert ein cyclischer Übergangszustand.',
      },
    ],
    mechanism: {
      type: 'SN2 am deprotonierten Malonester',
      summary:
        'Das durch zwei Estergruppen stabilisierte Carbanion greift das Halogenalkan von der Rückseite an.',
      steps: [
        {
          title: '1. Deprotonierung',
          description:
            'Das Ethanolat entfernt ein Proton vom Kohlenstoff zwischen den Estergruppen (pKs ≈ 13). Das Carbanion ist über beide Carbonylgruppen delokalisiert.',
          electronFlow: 'C–H-Bindungselektronen → Ethanolat; Ladung verteilt sich über beide Estergruppen.',
          intermediate: 'Malonester-Anion',
          relativeEnergy: 15,
        },
        {
          title: '2. SN2-Angriff',
          description: 'Das Carbanion greift den Kohlenstoff des Halogenalkans an, das Halogenid tritt aus.',
          electronFlow: 'Elektronenpaar des Carbanions → Kohlenstoff; C–X-Bindungselektronen → Halogenid.',
          relativeEnergy: 60,
          rateDetermining: true,
        },
      ],
      stereochemistry: 'Am angegriffenen Kohlenstoff tritt Inversion ein (Walden-Umkehr).',
      competingPathways: 'Tertiäre Halogenalkane liefern nur Eliminierungsprodukte; sekundäre teilweise.',
      productEnergy: -60,
    },
    safety: {
      ghs: ['GHS02', 'GHS05'],
      hazards: ['Natrium reagiert heftig mit Wasser (H260).', 'Halogenalkane sind gesundheitsschädlich.'],
      precautions: ['Absolut wasserfrei arbeiten.', 'Natriumreste mit Isopropanol vernichten, nie mit Wasser.'],
      ppe: ['Schutzbrille', 'Nitrilhandschuhe', 'Abzug'],
      waste: 'Halogenhaltige Reste getrennt sammeln.',
      level: 'Fortgeschritten',
    },
    typicalYield: '60–85 %',
    scale: ['Laborsynthese'],
    keywords: ['Malonester', 'Alkylierung', 'CH-acide', 'Decarboxylierung', 'Carbanion'],
    references: [{ title: 'Organikum, CH-acide Verbindungen', source: 'Lehrbuch' }],
  },
];
