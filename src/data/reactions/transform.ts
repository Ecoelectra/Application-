/** Umwandlungen funktioneller Gruppen und Aktivierungsreaktionen. */
import type { ReactionRule } from '../types';

export const TRANSFORM_REACTIONS: ReactionRule[] = [
  {
    id: 'finkelstein',
    name: 'Finkelstein-Reaktion',
    category: 'organisch',
    reactionType: 'Nucleophile Substitution (SN2)',
    summary:
      'Ein Chlorid oder Bromid wird gegen Iodid getauscht. Die Triebkraft ist rein physikalisch: Natriumiodid löst sich in Aceton, das entstehende Natriumchlorid nicht – es fällt aus und entzieht sich dem Gleichgewicht.',
    smirks: '[CX4:1][Cl,Br]>>[CX4:1][I]',
    reactantDefaults: ['CCCCBr'],
    substrateSlots: [0],
    functionalGroups: ['halogenalkan_prim', 'halogenalkan_sek'],
    generalEquation: 'R–Cl + NaI → R–I + NaCl↓',
    example: {
      substrate: 'CCCCBr',
      rxnSmiles: 'CCCCBr>>CCCCI',
      caption: '1-Brombutan wird zu 1-Iodbutan, das reaktiver ist.',
    },
    reagents: [
      { name: 'Halogenalkan', role: 'Reagenz', equivalents: '1,0 Äq.' },
      { name: 'Natriumiodid', role: 'Reagenz', equivalents: '1,5 Äq.', note: 'in Aceton gesättigt' },
    ],
    conditions: {
      temperature: 'Rückfluss, 56 °C',
      duration: '2–6 h',
      solvent: 'Aceton',
      workup: 'Filtrieren, Aceton abziehen',
      purification: 'Destillation',
    },
    procedure: [
      {
        title: 'Lösen',
        detail:
          'Natriumiodid in trockenem Aceton lösen und das Halogenalkan zugeben.',
      },
      {
        title: 'Erhitzen',
        detail:
          'Unter Rückfluss erhitzen. Nach kurzer Zeit fällt Natriumchlorid als weißer Niederschlag aus.',
        tip: 'Der Niederschlag zeigt den Fortschritt an – er ist das eigentliche Maß der Reaktion.',
      },
      {
        title: 'Aufarbeiten',
        detail:
          'Das Salz abfiltrieren und das Lösungsmittel entfernen.',
      },
    ],
    mechanism: {
      type: 'SN2',
      summary:
        'Iodid greift den Kohlenstoff von der Rückseite an; das Halogenid tritt gleichzeitig aus.',
      steps: [
        {
          title: '1. Rückseitenangriff',
          description:
            'Das Iodid-Ion nähert sich dem Kohlenstoff gegenüber der Abgangsgruppe. Bindungsbildung und -bruch laufen gleichzeitig ab.',
          electronFlow: 'Elektronenpaar des Iodids → Kohlenstoff; C–Br-Elektronen → Bromid.',
          relativeEnergy: 55,
          rateDetermining: true,
        },
        {
          title: '2. Ausfällen des Salzes',
          description:
            'Das entstandene Natriumbromid ist in Aceton unlöslich und fällt aus. Dadurch kann die Rückreaktion nicht stattfinden.',
          electronFlow: 'Ionengitterbildung – keine Elektronenverschiebung.',
          relativeEnergy: -20,
        },
      ],
      stereochemistry: 'Am Reaktionszentrum tritt Inversion ein.',
      competingPathways:
        'Tertiäre Substrate eliminieren statt zu substituieren.',
      productEnergy: -45,
    },
    safety: {
      ghs: ['GHS02', 'GHS07'],
      hazards: [
        'Aceton ist leichtentzündlich (H225).',
        'Iodalkane sind lichtempfindlich und reizend.',
      ],
      precautions: [
        'Zündquellen fernhalten.',
        'Produkt dunkel aufbewahren.',
      ],
      ppe: ['Schutzbrille', 'Nitrilhandschuhe'],
      waste: 'Halogenhaltige Reste getrennt sammeln.',
      level: 'Laborpraktikum',
    },
    typicalYield: '70–90 %',
    scale: ['Laborsynthese'],
    keywords: ['Halogenaustausch', 'SN2', 'Aceton', 'Löslichkeit'],
    references: [
      { title: 'H. Finkelstein, Ber. Dtsch. Chem. Ges. 1910, 43, 1528', source: 'Originalarbeit' },
    ],
  },
  {
    id: 'appel-reaktion',
    name: 'Appel-Reaktion',
    category: 'organisch',
    reactionType: 'Nucleophile Substitution (Aktivierung der OH-Gruppe)',
    summary:
      'Ein Alkohol wird mit Triphenylphosphin und Tetrabrommethan in ein Bromalkan überführt. Die Triebkraft ist die außerordentlich stabile P=O-Bindung des Nebenprodukts Triphenylphosphinoxid.',
    smirks: '[CX4:1][OX2H1]>>[CX4:1][Br]',
    reactantDefaults: ['CCCCO'],
    substrateSlots: [0],
    functionalGroups: ['alkohol_prim', 'alkohol_sek'],
    generalEquation: 'R–OH + PPh₃ + CBr₄ → R–Br + OPPh₃ + CHBr₃',
    example: {
      substrate: 'CCCCO',
      rxnSmiles: 'CCCCO>>CCCCBr',
      caption: 'Butan-1-ol wird unter milden Bedingungen zu 1-Brombutan.',
    },
    reagents: [
      { name: 'Alkohol', role: 'Reagenz', equivalents: '1,0 Äq.' },
      { name: 'Triphenylphosphin', role: 'Reagenz', equivalents: '1,2 Äq.' },
      { name: 'Tetrabrommethan', role: 'Reagenz', equivalents: '1,2 Äq.', note: 'für Chloride stattdessen CCl4' },
    ],
    conditions: {
      temperature: '0 °C bis Raumtemperatur',
      duration: '1–3 h',
      solvent: 'Dichlormethan',
      atmosphere: 'Stickstoff',
      workup: 'Mit Pentan verrühren – Triphenylphosphinoxid fällt aus',
      purification: 'Säulenchromatographie oder Destillation',
    },
    procedure: [
      {
        title: 'Vorlegen',
        detail:
          'Alkohol und Triphenylphosphin in Dichlormethan lösen und auf 0 °C kühlen.',
      },
      {
        title: 'Zugeben',
        detail:
          'Tetrabrommethan portionsweise zugeben und auf Raumtemperatur kommen lassen.',
        caution: 'Die Reaktion ist exotherm – langsam zugeben.',
      },
      {
        title: 'Abtrennen',
        detail:
          'Das ausgefallene Triphenylphosphinoxid abfiltrieren.',
        tip: 'Es fällt in Pentan besonders gut aus – das erspart die Säule.',
      },
    ],
    mechanism: {
      type: 'SN2 über ein Oxyphosphoniumsalz',
      summary:
        'Das Phosphin aktiviert den Alkohol zu einer guten Abgangsgruppe; anschließend erfolgt der SN2-Angriff des Bromids.',
      steps: [
        {
          title: '1. Bildung des Phosphoniumsalzes',
          description:
            'Triphenylphosphin greift Tetrabrommethan an; es entsteht ein Bromphosphoniumsalz.',
          electronFlow: 'Freies Elektronenpaar des Phosphors → Bromatom.',
          relativeEnergy: 25,
        },
        {
          title: '2. Aktivierung des Alkohols',
          description:
            'Der Alkohol greift das Phosphoratom an. Die OH-Gruppe wird dadurch zur exzellenten Abgangsgruppe OPPh₃.',
          electronFlow: 'Elektronenpaar des Alkoholsauerstoffs → Phosphor.',
          relativeEnergy: 35,
        },
        {
          title: '3. SN2-Substitution',
          description:
            'Bromid greift den Kohlenstoff von der Rückseite an; Triphenylphosphinoxid tritt aus.',
          electronFlow: 'Elektronenpaar des Bromids → Kohlenstoff; C–O-Elektronen → Phosphoroxid.',
          relativeEnergy: 55,
          rateDetermining: true,
        },
      ],
      stereochemistry: 'Inversion der Konfiguration – die Appel-Reaktion eignet sich deshalb zur gezielten Umkehr eines Stereozentrums.',
      competingPathways:
        'Tertiäre und allylische Alkohole können über Carbeniumionen racemisieren.',
      productEnergy: -110,
    },
    safety: {
      ghs: ['GHS07', 'GHS08'],
      hazards: [
        'Tetrabrommethan ist gesundheitsschädlich und schädigt die Ozonschicht.',
        'Dichlormethan steht im Verdacht, Krebs zu erzeugen (H351).',
      ],
      precautions: [
        'Im Abzug arbeiten.',
        'Halogenkohlenwasserstoffe getrennt entsorgen.',
      ],
      ppe: ['Schutzbrille', 'Nitrilhandschuhe', 'Abzug'],
      waste: 'Halogenhaltige Abfälle gesondert sammeln.',
      level: 'Fortgeschritten',
    },
    typicalYield: '70–95 %',
    scale: ['Laborsynthese'],
    keywords: ['Alkohol', 'Bromid', 'Triphenylphosphin', 'Inversion', 'Appel'],
    references: [
      { title: 'R. Appel, Angew. Chem. 1975, 87, 863', source: 'Originalarbeit' },
    ],
  },
  {
    id: 'tosylierung',
    name: 'Tosylierung von Alkoholen',
    category: 'organisch',
    reactionType: 'Nucleophile Substitution am Schwefel',
    summary:
      'Der Alkohol wird in einen Sulfonsäureester überführt. Die OH-Gruppe, die als Abgangsgruppe unbrauchbar ist, wird dadurch zu einer der besten überhaupt – ohne dass sich am Kohlenstoff etwas ändert.',
    smirks: '[CX4:1][OX2H1:2]>>[CX4:1][O:2]S(=O)(=O)c1ccc(C)cc1',
    reactantDefaults: ['CCCCO'],
    substrateSlots: [0],
    functionalGroups: ['alkohol_prim', 'alkohol_sek'],
    generalEquation: 'R–OH + TsCl + Base → R–OTs + Base·HCl',
    example: {
      substrate: 'CCCCO',
      rxnSmiles: 'CCCCO>>CCCCOS(=O)(=O)c1ccc(C)cc1',
      caption: 'Butan-1-ol wird zum Tosylat aktiviert.',
    },
    reagents: [
      { name: 'Alkohol', role: 'Reagenz', equivalents: '1,0 Äq.' },
      { name: 'Tosylchlorid', role: 'Reagenz', equivalents: '1,2 Äq.' },
      { name: 'Pyridin', role: 'Base', equivalents: '2,0 Äq.', note: 'zugleich Lösungsmittel' },
    ],
    conditions: {
      temperature: '0 °C bis Raumtemperatur',
      duration: '2–12 h',
      solvent: 'Pyridin oder Dichlormethan mit Triethylamin',
      workup: 'Auf Eiswasser gießen, ausethern, mit verdünnter Salzsäure waschen',
      purification: 'Umkristallisieren',
    },
    procedure: [
      {
        title: 'Kühlen',
        detail:
          'Alkohol in Pyridin lösen und auf 0 °C kühlen.',
      },
      {
        title: 'Tosylchlorid zugeben',
        detail:
          'Tosylchlorid portionsweise zugeben und über Nacht bei Raumtemperatur rühren.',
        caution: 'Tosylchlorid reizt Augen und Atemwege stark.',
      },
      {
        title: 'Aufarbeiten',
        detail:
          'Auf Eiswasser gießen und das Produkt absaugen oder ausethern.',
        tip: 'Das überschüssige Pyridin lässt sich mit verdünnter Salzsäure auswaschen.',
      },
    ],
    mechanism: {
      type: 'Additions-Eliminierung am Schwefel',
      summary:
        'Der Alkohol greift das Schwefelatom an; Chlorid tritt aus. Die Base fängt die entstehende Salzsäure ab.',
      steps: [
        {
          title: '1. Angriff am Schwefel',
          description:
            'Das Alkoholsauerstoffatom greift das elektrophile Schwefelatom des Tosylchlorids an.',
          electronFlow: 'Elektronenpaar des Alkoholsauerstoffs → Schwefel.',
          relativeEnergy: 40,
          rateDetermining: true,
        },
        {
          title: '2. Abspaltung von Chlorid',
          description:
            'Chlorid tritt aus, die S=O-Bindungen bilden sich zurück.',
          electronFlow: 'S–Cl-Bindungselektronen → Chlorid.',
          relativeEnergy: 20,
        },
        {
          title: '3. Deprotonierung',
          description:
            'Pyridin nimmt das Proton auf; es entsteht Pyridiniumhydrochlorid.',
          electronFlow: 'Elektronenpaar des Pyridinstickstoffs → Proton.',
          relativeEnergy: -15,
        },
      ],
      stereochemistry: 'Die C–O-Bindung bleibt unberührt – die Konfiguration am Kohlenstoff bleibt vollständig erhalten.',
      competingPathways:
        'Bei sterisch gehinderten Alkoholen ist Mesylchlorid die bessere Wahl.',
      productEnergy: -70,
    },
    safety: {
      ghs: ['GHS05', 'GHS07'],
      hazards: [
        'Tosylchlorid wirkt ätzend und reizt die Atemwege stark (H314).',
        'Pyridin ist leichtentzündlich und gesundheitsschädlich.',
      ],
      precautions: [
        'Im Abzug arbeiten.',
        'Tosylchlorid vor Feuchtigkeit schützen.',
      ],
      ppe: ['Schutzbrille', 'Nitrilhandschuhe', 'Abzug'],
      waste: 'Pyridinhaltige Abfälle gesondert sammeln.',
      level: 'Laborpraktikum',
    },
    typicalYield: '80–95 %',
    scale: ['Laborsynthese'],
    keywords: ['Tosylat', 'Abgangsgruppe', 'Aktivierung', 'Sulfonsäureester'],
    references: [
      { title: 'Organikum, Sulfonsäureester', source: 'Lehrbuch' },
    ],
  },
  {
    id: 'acetylierung-anhydrid',
    name: 'Acetylierung mit Acetanhydrid',
    category: 'organisch',
    reactionType: 'Nucleophile Acyl-Substitution',
    summary:
      'Alkohole, Phenole und Amine werden mit Acetanhydrid acetyliert. Die bekannteste Anwendung ist die Aspirin-Synthese aus Salicylsäure.',
    smirks: '[OX2H1:1][#6:2].CC(=O)OC(C)=O>>[#6:2][O:1]C(C)=O',
    reactantDefaults: ['Oc1ccccc1C(=O)O', 'CC(=O)OC(C)=O'],
    substrateSlots: [0],
    functionalGroups: ['phenol', 'alkohol_prim', 'alkohol_sek'],
    generalEquation: 'R–OH + (CH₃CO)₂O → R–O–CO–CH₃ + CH₃COOH',
    example: {
      substrate: 'Oc1ccccc1C(=O)O',
      rxnSmiles: 'Oc1ccccc1C(=O)O.CC(=O)OC(C)=O>>CC(=O)Oc1ccccc1C(=O)O.CC(=O)O',
      caption: 'Salicylsäure und Acetanhydrid ergeben Acetylsalicylsäure – Aspirin.',
    },
    reagents: [
      { name: 'Alkohol oder Phenol', role: 'Reagenz', equivalents: '1,0 Äq.' },
      { name: 'Acetanhydrid', role: 'Reagenz', equivalents: '1,5 Äq.' },
      { name: 'Schwefelsäure (konz.)', role: 'Katalysator', equivalents: '3 Tropfen', note: 'alternativ Phosphorsäure oder DMAP' },
    ],
    conditions: {
      temperature: '60–80 °C',
      duration: '20–30 min',
      solvent: 'Acetanhydrid im Überschuss',
      workup: 'Auf Eiswasser geben; das Produkt fällt aus',
      purification: 'Umkristallisieren aus Ethanol/Wasser',
      monitoring: 'Eisen(III)-chlorid-Probe: Verschwindet die Violettfärbung, ist das Phenol umgesetzt',
    },
    procedure: [
      {
        title: 'Ansatz',
        detail:
          'Salicylsäure im Erlenmeyerkolben mit Acetanhydrid übergießen.',
      },
      {
        title: 'Katalysator',
        detail:
          'Wenige Tropfen konzentrierte Schwefelsäure zugeben und im Wasserbad auf 60 °C erwärmen.',
        caution: 'Acetanhydrid reagiert heftig mit Wasser – Gefäße müssen trocken sein.',
      },
      {
        title: 'Fällen',
        detail:
          'Nach 20 Minuten auf Eiswasser geben. Überschüssiges Anhydrid hydrolysiert, das Produkt kristallisiert aus.',
        tip: 'Die Reinheit prüft man mit Eisen(III)-chlorid: Reines Aspirin färbt sich nicht violett.',
      },
      {
        title: 'Umkristallisieren',
        detail:
          'Aus wenig heißem Ethanol umkristallisieren und den Schmelzpunkt bestimmen (135 °C).',
      },
    ],
    mechanism: {
      type: 'Additions-Eliminierungs-Mechanismus',
      summary:
        'Die Säure aktiviert das Anhydrid; der Alkohol addiert und Essigsäure tritt aus.',
      steps: [
        {
          title: '1. Protonierung des Anhydrids',
          description:
            'Die Säure protoniert eine Carbonylgruppe und macht sie stark elektrophil.',
          electronFlow: 'Freies Elektronenpaar des Carbonylsauerstoffs → Proton.',
          relativeEnergy: -5,
        },
        {
          title: '2. Angriff des Alkohols',
          description:
            'Der Alkohol greift den Carbonylkohlenstoff an; es entsteht ein tetraedrisches Zwischenprodukt.',
          electronFlow: 'Elektronenpaar des Alkoholsauerstoffs → Carbonylkohlenstoff.',
          relativeEnergy: 45,
          rateDetermining: true,
        },
        {
          title: '3. Abspaltung von Essigsäure',
          description:
            'Die C=O-Bindung bildet sich zurück, Acetat tritt als Essigsäure aus.',
          electronFlow: 'Elektronenpaar des Sauerstoffs → C–O-Bindung; C–O-Bindung zum Acetat bricht.',
          relativeEnergy: 25,
        },
      ],
      competingPathways:
        'Bei Aminen läuft die Reaktion schneller und braucht keinen Katalysator – Amine sind die besseren Nucleophile.',
      productEnergy: -75,
    },
    safety: {
      ghs: ['GHS02', 'GHS05'],
      hazards: [
        'Acetanhydrid wirkt ätzend und reizt die Augen stark (H314, H332).',
        'Konzentrierte Schwefelsäure verätzt die Haut.',
      ],
      precautions: [
        'Im Abzug arbeiten.',
        'Nicht einatmen – Acetanhydrid reizt die Schleimhäute stark.',
      ],
      ppe: ['Schutzbrille', 'Nitrilhandschuhe', 'Abzug'],
      waste: 'Reste mit viel Wasser hydrolysieren und neutralisieren.',
      level: 'Schulversuch',
    },
    typicalYield: '70–90 %',
    scale: ['Schulversuch', 'Laborsynthese', 'Industrie'],
    keywords: ['Aspirin', 'Acetylierung', 'Anhydrid', 'Salicylsäure', 'Ester'],
    references: [
      { title: 'F. Hoffmann, Bayer 1897', source: 'Historisch' },
      { title: 'Organikum, Acylierungen', source: 'Lehrbuch' },
    ],
  },
  {
    id: 'snar-substitution',
    name: 'Nucleophile aromatische Substitution',
    category: 'organisch',
    reactionType: 'Nucleophile aromatische Substitution (SNAr)',
    summary:
      'Am Aromaten läuft eine Substitution nur, wenn stark elektronenziehende Gruppen wie Nitrogruppen in ortho- oder para-Stellung sitzen. Sie stabilisieren die negativ geladene Zwischenstufe.',
    smirks: '[c:1][F,Cl,Br]>>[c:1][OX2H0]C',
    reactantDefaults: ['O=[N+]([O-])c1ccc(Cl)cc1'],
    substrateSlots: [0],
    functionalGroups: ['arylhalogenid', 'nitro', 'aromat'],
    generalEquation: 'Ar–X + Nu⁻ → Ar–Nu + X⁻  (Ar mit Nitrogruppe in ortho/para)',
    example: {
      substrate: 'O=[N+]([O-])c1ccc(Cl)cc1',
      rxnSmiles: 'O=[N+]([O-])c1ccc(Cl)cc1>>COc1ccc([N+](=O)[O-])cc1',
      caption: '4-Chlornitrobenzol und Methanolat ergeben 4-Nitroanisol.',
    },
    reagents: [
      { name: 'Aktiviertes Arylhalogenid', role: 'Reagenz', equivalents: '1,0 Äq.' },
      { name: 'Natriummethanolat', role: 'Reagenz', equivalents: '1,2 Äq.', note: 'alternativ Amine oder Thiolate' },
    ],
    conditions: {
      temperature: '60–100 °C',
      duration: '2–8 h',
      solvent: 'Methanol oder DMSO',
      workup: 'Auf Wasser geben; das Produkt fällt aus',
      purification: 'Umkristallisieren',
    },
    procedure: [
      {
        title: 'Lösen',
        detail:
          'Das Arylhalogenid im Lösungsmittel lösen.',
      },
      {
        title: 'Nucleophil zugeben',
        detail:
          'Das Nucleophil zugeben und erwärmen. Die Lösung färbt sich oft tief rot – das ist der Meisenheimer-Komplex.',
        tip: 'Die Farbe ist ein direkter Beleg für die Zwischenstufe.',
      },
      {
        title: 'Fällen',
        detail:
          'Auf Wasser geben und das Produkt absaugen.',
      },
    ],
    mechanism: {
      type: 'Additions-Eliminierungs-Mechanismus über den Meisenheimer-Komplex',
      summary:
        'Das Nucleophil addiert zuerst an den Ring; der aromatische Charakter geht vorübergehend verloren. Danach tritt das Halogenid aus.',
      steps: [
        {
          title: '1. Addition des Nucleophils',
          description:
            'Das Nucleophil greift den Kohlenstoff mit dem Halogen an. Der Ring verliert seine Aromatizität; die negative Ladung wird von der Nitrogruppe aufgenommen.',
          electronFlow: 'Elektronenpaar des Nucleophils → Ringkohlenstoff; π-Elektronen → Nitrogruppe.',
          relativeEnergy: 75,
          rateDetermining: true,
        },
        {
          title: '2. Abspaltung des Halogenids',
          description:
            'Die Bindungselektronen kehren in den Ring zurück, das Halogenid tritt aus und die Aromatizität wird wiederhergestellt.',
          electronFlow: 'Elektronen des Meisenheimer-Komplexes → C–X-Bindung; Halogenid tritt aus.',
          relativeEnergy: 20,
        },
      ],
      competingPathways:
        'Ohne aktivierende Gruppe läuft die Reaktion nicht – dann bräuchte es den Arin-Mechanismus mit sehr starken Basen.',
      productEnergy: -60,
    },
    safety: {
      ghs: ['GHS06', 'GHS08'],
      hazards: [
        'Nitroaromaten sind giftig und werden über die Haut aufgenommen (H301, H311).',
        '2,4-Dinitrochlorbenzol sensibilisiert die Haut stark.',
      ],
      precautions: [
        'Hautkontakt unbedingt vermeiden.',
        'Im Abzug arbeiten.',
      ],
      ppe: ['Schutzbrille', 'Nitrilhandschuhe', 'Abzug'],
      waste: 'Nitroaromatenhaltige Abfälle gesondert sammeln.',
      level: 'Fortgeschritten',
    },
    typicalYield: '60–90 %',
    scale: ['Laborsynthese', 'Industrie'],
    keywords: ['SNAr', 'Meisenheimer', 'Nitrogruppe', 'aktiviert'],
    references: [
      { title: 'J. Meisenheimer, Liebigs Ann. Chem. 1902, 323, 205', source: 'Originalarbeit' },
    ],
  },
  {
    id: 'sonogashira-kupplung',
    name: 'Sonogashira-Kupplung',
    aliases: ['Sonogashira-Hagihara-Kupplung'],
    category: 'organisch',
    reactionType: 'Übergangsmetallkatalysierte Kreuzkupplung',
    summary:
      'Ein Arylhalogenid wird mit einem terminalen Alkin verknüpft. Zwei Katalysatoren arbeiten zusammen: Palladium aktiviert das Arylhalogenid, Kupfer das Alkin.',
    smirks: '[c:1][Br,I].[CX2:2]#[CX2H1:3]>>[c:1][CX2:3]#[CX2:2]',
    reactantDefaults: ['Ic1ccccc1', 'C#Cc1ccccc1'],
    substrateSlots: [0, 1],
    functionalGroups: ['arylhalogenid', 'alkin'],
    generalEquation: 'Ar–X + H–C≡C–R → Ar–C≡C–R + HX',
    example: {
      substrate: 'Ic1ccccc1',
      rxnSmiles: 'Ic1ccccc1.C#Cc1ccccc1>>C(#Cc1ccccc1)c1ccccc1',
      caption: 'Iodbenzol und Phenylacetylen ergeben Diphenylacetylen (Tolan).',
    },
    reagents: [
      { name: 'Arylhalogenid', role: 'Reagenz', equivalents: '1,0 Äq.', note: 'Iodide reagieren am schnellsten' },
      { name: 'Terminales Alkin', role: 'Reagenz', equivalents: '1,2 Äq.' },
      { name: 'Pd(PPh3)4', role: 'Katalysator', equivalents: '2 mol%' },
      { name: 'Kupfer(I)-iodid', role: 'Katalysator', equivalents: '4 mol%', note: 'aktiviert das Alkin' },
      { name: 'Triethylamin', role: 'Base', equivalents: '3,0 Äq.', note: 'fängt HX ab und dient oft als Lösungsmittel' },
    ],
    conditions: {
      temperature: 'Raumtemperatur bis 60 °C',
      duration: '2–12 h',
      solvent: 'Triethylamin oder THF',
      atmosphere: 'Argon – Sauerstoff führt zur Alkinkupplung',
      workup: 'Filtrieren, Lösungsmittel entfernen',
      purification: 'Säulenchromatographie',
    },
    procedure: [
      {
        title: 'Entgasen',
        detail:
          'Lösungsmittel und Base entgasen. Sauerstoff muss ausgeschlossen sein.',
        tip: 'Dreimal einfrieren, evakuieren und auftauen ist die zuverlässigste Methode.',
      },
      {
        title: 'Katalysatoren zugeben',
        detail:
          'Unter Argon Palladiumkatalysator und Kupferiodid zugeben.',
        caution: 'Palladiumverbindungen sind teuer und teils giftig – sorgfältig arbeiten.',
      },
      {
        title: 'Kuppeln',
        detail:
          'Arylhalogenid und Alkin zugeben und rühren, bis die Dünnschichtchromatographie vollständigen Umsatz zeigt.',
      },
    ],
    mechanism: {
      type: 'Katalysecyclus mit Palladium und Kupfer',
      summary:
        'Palladium durchläuft oxidative Addition, Transmetallierung und reduktive Eliminierung. Kupfer bildet parallel ein Kupferacetylid.',
      steps: [
        {
          title: '1. Oxidative Addition',
          description:
            'Das Palladium(0) schiebt sich in die Aryl–Halogen-Bindung; die Oxidationsstufe steigt auf +II.',
          electronFlow: 'Elektronenpaar des Palladiums → C–X-Bindung.',
          relativeEnergy: 45,
          rateDetermining: true,
        },
        {
          title: '2. Bildung des Kupferacetylids',
          description:
            'Die Base deprotoniert das terminale Alkin; Kupfer(I) bildet damit ein Acetylid.',
          electronFlow: 'C–H-Bindungselektronen → Base; Alkinid koordiniert an Kupfer.',
          relativeEnergy: 25,
        },
        {
          title: '3. Transmetallierung',
          description:
            'Der Alkinylrest wandert vom Kupfer zum Palladium.',
          electronFlow: 'Kupfer–C-Bindungselektronen → Palladium.',
          relativeEnergy: 35,
        },
        {
          title: '4. Reduktive Eliminierung',
          description:
            'Aryl- und Alkinylrest verlassen gemeinsam das Palladium; die neue C–C-Bindung entsteht und Palladium(0) wird zurückgebildet.',
          electronFlow: 'Pd–C-Bindungselektronen → neue C–C-Bindung.',
          relativeEnergy: 30,
        },
      ],
      competingPathways:
        'Ohne Sauerstoffausschluss kuppeln zwei Alkine miteinander (Glaser-Kupplung) – das ist die häufigste Fehlerquelle.',
      productEnergy: -120,
    },
    safety: {
      ghs: ['GHS02', 'GHS07'],
      hazards: [
        'Triethylamin ist leichtentzündlich und ätzend (H225, H314).',
        'Palladium- und Kupferverbindungen sind umweltgefährlich.',
      ],
      precautions: [
        'Unter Schutzgas arbeiten.',
        'Schwermetallhaltige Abfälle gesondert sammeln.',
      ],
      ppe: ['Schutzbrille', 'Nitrilhandschuhe', 'Abzug'],
      waste: 'Palladiumhaltige Rückstände zur Rückgewinnung sammeln.',
      level: 'Fortgeschritten',
    },
    typicalYield: '70–95 %',
    scale: ['Laborsynthese', 'Industrie'],
    keywords: ['Kreuzkupplung', 'Palladium', 'Alkin', 'Tolan', 'C–C-Verknüpfung'],
    references: [
      { title: 'K. Sonogashira, Tetrahedron Lett. 1975, 16, 4467', source: 'Originalarbeit' },
    ],
  },
  {
    id: 'buchwald-hartwig',
    name: 'Buchwald-Hartwig-Aminierung',
    category: 'organisch',
    reactionType: 'Übergangsmetallkatalysierte C–N-Kupplung',
    summary:
      'Ein Arylhalogenid wird direkt mit einem Amin verknüpft. Vor dieser Reaktion war die Arylierung von Aminen nur über harsche Umwege möglich.',
    smirks: '[c:1][Br,I].[NX3;H2,H1:2]>>[c:1][NX3:2]',
    reactantDefaults: ['Brc1ccccc1', 'NCc1ccccc1'],
    substrateSlots: [0, 1],
    functionalGroups: ['arylhalogenid', 'amin_prim', 'amin_sek'],
    generalEquation: 'Ar–X + HNR₂ → Ar–NR₂ + HX',
    example: {
      substrate: 'Brc1ccccc1',
      rxnSmiles: 'Brc1ccccc1.NCc1ccccc1>>c1ccc(CNc2ccccc2)cc1',
      caption: 'Brombenzol und Benzylamin ergeben N-Benzylanilin.',
    },
    reagents: [
      { name: 'Arylhalogenid', role: 'Reagenz', equivalents: '1,0 Äq.' },
      { name: 'Amin', role: 'Reagenz', equivalents: '1,2 Äq.' },
      { name: 'Palladium(II)-acetat', role: 'Katalysator', equivalents: '2 mol%' },
      { name: 'Phosphanligand', role: 'Katalysator', equivalents: '4 mol%', note: 'sperrige Liganden wie BINAP oder XPhos' },
      { name: 'Natrium-tert-butanolat', role: 'Base', equivalents: '1,4 Äq.' },
    ],
    conditions: {
      temperature: '80–110 °C',
      duration: '6–24 h',
      solvent: 'Toluol oder Dioxan',
      atmosphere: 'Argon',
      workup: 'Filtrieren über Kieselgel',
      purification: 'Säulenchromatographie',
    },
    procedure: [
      {
        title: 'Ansatz',
        detail:
          'Alle Feststoffe unter Argon einwiegen und das entgaste Lösungsmittel zugeben.',
      },
      {
        title: 'Erhitzen',
        detail:
          'Auf 100 °C erhitzen und über Nacht rühren.',
        caution: 'Natrium-tert-butanolat reagiert heftig mit Wasser.',
      },
      {
        title: 'Aufarbeiten',
        detail:
          'Abkühlen, über Kieselgel filtrieren und chromatographisch reinigen.',
        tip: 'Der Ligand entscheidet über den Erfolg – bei Problemen zuerst ihn wechseln.',
      },
    ],
    mechanism: {
      type: 'Palladium-Katalysecyclus',
      summary:
        'Oxidative Addition, Koordination des Amins, Deprotonierung und reduktive Eliminierung.',
      steps: [
        {
          title: '1. Oxidative Addition',
          description:
            'Palladium(0) schiebt sich in die Aryl–Halogen-Bindung.',
          electronFlow: 'Elektronenpaar des Palladiums → C–X-Bindung.',
          relativeEnergy: 50,
          rateDetermining: true,
        },
        {
          title: '2. Koordination des Amins',
          description:
            'Das Amin bindet an das Palladiumzentrum und wird durch die Base deprotoniert.',
          electronFlow: 'Freies Elektronenpaar des Stickstoffs → Palladium; N–H-Elektronen → Base.',
          relativeEnergy: 30,
        },
        {
          title: '3. Reduktive Eliminierung',
          description:
            'Aryl- und Amidrest verlassen gemeinsam das Metall; die C–N-Bindung entsteht.',
          electronFlow: 'Pd–C- und Pd–N-Bindungselektronen → neue C–N-Bindung.',
          relativeEnergy: 40,
        },
      ],
      competingPathways:
        'Bei β-ständigen Wasserstoffatomen kann eine Hydrodehalogenierung als Nebenreaktion auftreten.',
      productEnergy: -95,
    },
    safety: {
      ghs: ['GHS02', 'GHS05', 'GHS07'],
      hazards: [
        'Natrium-tert-butanolat ist selbstentzündlich und ätzend (H228, H314).',
        'Toluol ist leichtentzündlich und reproduktionstoxisch.',
      ],
      precautions: [
        'Unter Schutzgas und wasserfrei arbeiten.',
        'Im Abzug arbeiten.',
      ],
      ppe: ['Schutzbrille', 'Nitrilhandschuhe', 'Abzug'],
      waste: 'Palladiumhaltige Rückstände zur Rückgewinnung sammeln.',
      level: 'Nur Fachlabor',
    },
    typicalYield: '60–95 %',
    scale: ['Laborsynthese', 'Industrie'],
    keywords: ['C–N-Kupplung', 'Palladium', 'Amin', 'Arylamin', 'Ligand'],
    references: [
      { title: 'J. F. Hartwig, S. L. Buchwald, 1994–1995', source: 'Originalarbeiten' },
    ],
  },
  {
    id: 'olefinmetathese',
    name: 'Olefinmetathese',
    aliases: ['Kreuzmetathese', 'Grubbs-Metathese'],
    category: 'organisch',
    reactionType: 'Metallkatalysierte Umverteilung von Doppelbindungen',
    summary:
      'Zwei Alkene tauschen ihre Molekülhälften wie bei einem Partnerwechsel. Der Rutheniumkatalysator macht daraus eine der elegantesten Methoden zur C–C-Verknüpfung – ausgezeichnet mit dem Nobelpreis 2005.',
    smirks: '[CX3H2:1]=[CX3H1:2][#6:3].[CX3H2]=[CX3H1:4][#6:5]>>[#6:3][CX3H1:2]=[CX3H1:4][#6:5]',
    reactantDefaults: ['C=CCCCC', 'C=CCCCC'],
    substrateSlots: [0],
    functionalGroups: ['alken'],
    generalEquation: '2 R–CH=CH₂ → R–CH=CH–R + CH₂=CH₂↑',
    example: {
      substrate: 'C=CCCCC',
      rxnSmiles: 'C=CCCCC.C=CCCCC>>CCCCC=CCCCC',
      caption: 'Zwei Moleküle Hex-1-en ergeben Dec-5-en; Ethen entweicht.',
    },
    reagents: [
      { name: 'Alken', role: 'Reagenz', equivalents: '2,0 Äq.' },
      { name: 'Grubbs-Katalysator', role: 'Katalysator', equivalents: '2–5 mol%', note: 'Ruthenium-Carben-Komplex' },
    ],
    conditions: {
      temperature: '40–60 °C',
      duration: '2–24 h',
      solvent: 'Dichlormethan oder Toluol',
      atmosphere: 'Argon',
      workup: 'Katalysator über Kieselgel abtrennen',
      purification: 'Säulenchromatographie',
    },
    procedure: [
      {
        title: 'Lösen',
        detail:
          'Das Alken im entgasten Lösungsmittel lösen.',
      },
      {
        title: 'Katalysator zugeben',
        detail:
          'Den Grubbs-Katalysator zugeben und erwärmen.',
        tip: 'Das entweichende Ethen zieht das Gleichgewicht auf die Produktseite – ein leicht geöffnetes System hilft.',
      },
      {
        title: 'Reinigen',
        detail:
          'Den Katalysator über Kieselgel abtrennen.',
      },
    ],
    mechanism: {
      type: 'Chauvin-Mechanismus über Metallacyclobutan',
      summary:
        'Carben und Alken bilden einen Vierring, der sich in der anderen Richtung wieder öffnet.',
      steps: [
        {
          title: '1. Cycloaddition',
          description:
            'Das Rutheniumcarben und das Alken bilden ein Metallacyclobutan – einen viergliedrigen Ring mit dem Metall.',
          electronFlow: 'π-Elektronen des Alkens → Carbenkohlenstoff; Metall–C-Bindung schließt den Ring.',
          relativeEnergy: 45,
          rateDetermining: true,
        },
        {
          title: '2. Ringöffnung in der anderen Richtung',
          description:
            'Der Vierring öffnet sich um 90 Grad versetzt. Dabei entsteht ein neues Alken und ein neues Carben.',
          electronFlow: 'Ringbindungselektronen → neue C=C-Doppelbindung.',
          relativeEnergy: 40,
        },
        {
          title: '3. Abgabe des Ethens',
          description:
            'Das gebildete Ethen entweicht als Gas und macht die Reaktion irreversibel.',
          electronFlow: 'Keine – Phasenwechsel.',
          relativeEnergy: -10,
        },
      ],
      stereochemistry: 'Meist entsteht bevorzugt das E-Isomer.',
      competingPathways:
        'Bei Dienen im selben Molekül läuft stattdessen eine Ringschlussmetathese – ein wichtiger Weg zu Makrocyclen.',
      productEnergy: -40,
    },
    safety: {
      ghs: ['GHS07'],
      hazards: [
        'Rutheniumkatalysatoren sind luft- und feuchtigkeitsempfindlich.',
        'Dichlormethan steht im Verdacht, Krebs zu erzeugen.',
      ],
      precautions: [
        'Unter Schutzgas arbeiten.',
        'Im Abzug arbeiten.',
      ],
      ppe: ['Schutzbrille', 'Nitrilhandschuhe', 'Abzug'],
      waste: 'Rutheniumhaltige Rückstände gesondert sammeln.',
      level: 'Fortgeschritten',
    },
    typicalYield: '60–90 %',
    scale: ['Laborsynthese', 'Industrie'],
    keywords: ['Metathese', 'Grubbs', 'Ruthenium', 'Carben', 'Nobelpreis'],
    references: [
      { title: 'Y. Chauvin, R. H. Grubbs, R. R. Schrock, Nobelpreis für Chemie 2005', source: 'Auszeichnung' },
      { title: 'R. H. Grubbs, Angew. Chem. 2006, 118, 3845', source: 'Übersichtsartikel' },
    ],
  },
  {
    id: 'lindlar-hydrierung',
    name: 'Lindlar-Hydrierung',
    category: 'organisch',
    reactionType: 'Partielle katalytische Hydrierung',
    summary:
      'Ein Alkin wird nur bis zum cis-Alken hydriert. Der Katalysator ist absichtlich vergiftet, damit die Reaktion auf halbem Weg stehen bleibt.',
    smirks: '[CX2:1]#[CX2:2]>>[CX3H1:1]=[CX3H1:2]',
    reactantDefaults: ['CC#CC'],
    substrateSlots: [0],
    functionalGroups: ['alkin'],
    generalEquation: 'R–C≡C–R′ + H₂ → cis-R–CH=CH–R′',
    example: {
      substrate: 'CC#CC',
      rxnSmiles: 'CC#CC>>CC=CC',
      caption: 'But-2-in ergibt ausschließlich cis-But-2-en.',
    },
    reagents: [
      { name: 'Alkin', role: 'Reagenz', equivalents: '1,0 Äq.' },
      { name: 'Wasserstoff', role: 'Reagenz', equivalents: '1,0 Äq.', note: 'Normaldruck genügt' },
      { name: 'Lindlar-Katalysator', role: 'Katalysator', equivalents: '5 Gew.-%', note: 'Palladium auf Calciumcarbonat, mit Blei vergiftet' },
      { name: 'Chinolin', role: 'Katalysator', equivalents: 'Spuren', note: 'zusätzlicher Katalysatormoderator' },
    ],
    conditions: {
      temperature: 'Raumtemperatur',
      duration: '1–4 h',
      solvent: 'Ethanol oder Hexan',
      pressure: '1 bar Wasserstoff',
      atmosphere: 'Wasserstoff',
      workup: 'Katalysator abfiltrieren',
      monitoring: 'Wasserstoffaufnahme messen – nach einem Äquivalent abbrechen',
    },
    procedure: [
      {
        title: 'Ansatz',
        detail:
          'Alkin und Katalysator im Lösungsmittel vorlegen, Apparatur mit Wasserstoff spülen.',
        caution: 'Wasserstoff bildet mit Luft ein explosionsfähiges Gemisch.',
      },
      {
        title: 'Hydrieren',
        detail:
          'Unter Rühren Wasserstoff aufnehmen lassen und die aufgenommene Menge verfolgen.',
        tip: 'Genau ein Äquivalent – danach sofort abbrechen, sonst entsteht das Alkan.',
      },
      {
        title: 'Abfiltrieren',
        detail:
          'Den Katalysator über Celite abfiltrieren.',
        caution: 'Der Filterkuchen darf nicht trockenlaufen – Palladium auf Kohle kann sich entzünden.',
      },
    ],
    mechanism: {
      type: 'Syn-Addition an der Metalloberfläche',
      summary:
        'Beide Wasserstoffatome werden von derselben Seite übertragen; daher entsteht das cis-Alken.',
      steps: [
        {
          title: '1. Adsorption',
          description:
            'Alkin und Wasserstoff lagern sich an der Palladiumoberfläche an. Der Wasserstoff wird dabei in Atome gespalten.',
          electronFlow: 'H–H-Bindungselektronen → Metallorbitale.',
          relativeEnergy: 30,
        },
        {
          title: '2. Übertragung beider Wasserstoffatome',
          description:
            'Beide Atome werden nacheinander von derselben Seite auf die Dreifachbindung übertragen.',
          electronFlow: 'Metall–H-Bindungselektronen → Kohlenstoffatome.',
          relativeEnergy: 45,
          rateDetermining: true,
        },
        {
          title: '3. Ablösung',
          description:
            'Das cis-Alken löst sich von der Oberfläche. Durch die Bleivergiftung bindet es zu schwach für eine zweite Hydrierung.',
          electronFlow: 'Keine – Desorption.',
          relativeEnergy: -10,
        },
      ],
      stereochemistry: 'Syn-Addition: Beide Wasserstoffatome treten auf derselben Seite ein, es entsteht ausschließlich das Z-Alken.',
      competingPathways:
        'Mit unvergiftetem Palladium läuft die Hydrierung bis zum Alkan durch. Die Alternative zum trans-Alken ist die Birch-artige Reduktion mit Natrium in Ammoniak.',
      productEnergy: -155,
    },
    safety: {
      ghs: ['GHS02', 'GHS08'],
      hazards: [
        'Wasserstoff ist hochentzündlich (H220).',
        'Der Katalysator enthält Blei und ist reproduktionstoxisch.',
      ],
      precautions: [
        'Zündquellen fernhalten.',
        'Katalysator niemals trocken an der Luft stehen lassen.',
      ],
      ppe: ['Schutzbrille', 'Nitrilhandschuhe', 'Abzug'],
      waste: 'Katalysatorreste feucht halten und zur Rückgewinnung geben.',
      level: 'Fortgeschritten',
    },
    typicalYield: '80–95 %',
    scale: ['Laborsynthese', 'Industrie'],
    keywords: ['cis-Alken', 'Alkin', 'Palladium', 'vergiftet', 'Stereoselektivität'],
    references: [
      { title: 'H. Lindlar, Helv. Chim. Acta 1952, 35, 446', source: 'Originalarbeit' },
    ],
  },
  {
    id: 'baeyer-villiger',
    name: 'Baeyer-Villiger-Oxidation',
    category: 'organisch',
    reactionType: 'Oxidation mit Umlagerung',
    summary:
      'Eine Persäure schiebt ein Sauerstoffatom in die Bindung neben der Carbonylgruppe: Aus einem Keton wird ein Ester. Welche Seite wandert, folgt einer klaren Rangfolge.',
    smirks: '[#6:1][CX3:2](=[OX1:3])[#6:4]>>[#6:1][OX2][CX3:2](=[OX1:3])[#6:4]',
    reactantDefaults: ['CC(=O)c1ccccc1'],
    substrateSlots: [0],
    functionalGroups: ['keton'],
    generalEquation: 'R–CO–R′ + RCO₃H → R–O–CO–R′ + RCOOH',
    example: {
      substrate: 'CC(=O)c1ccccc1',
      rxnSmiles: 'CC(=O)c1ccccc1>>COC(=O)c1ccccc1',
      caption: 'Acetophenon wird zu Benzoesäuremethylester – der Phenylrest wandert.',
    },
    reagents: [
      { name: 'Keton', role: 'Reagenz', equivalents: '1,0 Äq.' },
      { name: 'meta-Chlorperbenzoesäure', role: 'Oxidationsmittel', equivalents: '1,3 Äq.', note: 'alternativ Peressigsäure' },
    ],
    conditions: {
      temperature: '0 °C bis Raumtemperatur',
      duration: '4–24 h',
      solvent: 'Dichlormethan',
      workup: 'Mit Natriumhydrogensulfit-Lösung überschüssige Persäure zerstören',
      purification: 'Säulenchromatographie oder Destillation',
      monitoring: 'Peroxidteststäbchen vor dem Einengen',
    },
    procedure: [
      {
        title: 'Kühlen',
        detail:
          'Das Keton in Dichlormethan lösen und auf 0 °C kühlen.',
      },
      {
        title: 'Persäure zugeben',
        detail:
          'mCPBA portionsweise zugeben.',
        caution: 'Persäuren sind stoß- und temperaturempfindlich – nicht erhitzen, nicht trocken eindampfen.',
      },
      {
        title: 'Überschuss zerstören',
        detail:
          'Mit Natriumhydrogensulfit-Lösung waschen, bis der Peroxidtest negativ ist.',
        caution: 'Niemals mit Peroxidresten einengen.',
        tip: 'Das ist der wichtigste Sicherheitsschritt der ganzen Synthese.',
      },
    ],
    mechanism: {
      type: 'Criegee-Umlagerung',
      summary:
        'Die Persäure addiert an die Carbonylgruppe; im entstandenen Criegee-Intermediat wandert ein Rest zum Sauerstoff.',
      steps: [
        {
          title: '1. Addition der Persäure',
          description:
            'Der Carbonylkohlenstoff wird von der Persäure angegriffen; es entsteht das Criegee-Intermediat.',
          electronFlow: 'Elektronenpaar des Persäuresauerstoffs → Carbonylkohlenstoff.',
          relativeEnergy: 45,
        },
        {
          title: '2. Wanderung eines Restes',
          description:
            'Ein Rest wandert mitsamt Bindungselektronen zum benachbarten Sauerstoff; gleichzeitig bricht die O–O-Bindung. Es wandert der Rest, der die positive Ladung besser tragen kann.',
          electronFlow: 'C–C-Bindungselektronen → Sauerstoff; O–O-Bindung bricht heterolytisch.',
          relativeEnergy: 70,
          rateDetermining: true,
        },
      ],
      stereochemistry: 'Der wandernde Rest behält seine Konfiguration vollständig bei.',
      competingPathways:
        'Wanderungstendenz: tertiär > sekundär ≈ Aryl > primär > Methyl. Daraus lässt sich das Produkt vorhersagen.',
      productEnergy: -140,
    },
    safety: {
      ghs: ['GHS02', 'GHS05', 'GHS07'],
      hazards: [
        'mCPBA ist brandfördernd und kann sich beim Erhitzen explosionsartig zersetzen (H242).',
        'Persäuren verätzen Haut und Augen.',
      ],
      precautions: [
        'Niemals über 40 °C erwärmen.',
        'Vor dem Einengen stets auf Peroxide prüfen.',
        'Nur in kleinen Ansätzen arbeiten.',
      ],
      ppe: ['Schutzbrille', 'Nitrilhandschuhe', 'Abzug', 'Schutzscheibe'],
      waste: 'Peroxidhaltige Lösungen mit Hydrogensulfit zerstören, dann entsorgen.',
      level: 'Fortgeschritten',
    },
    typicalYield: '60–90 %',
    scale: ['Laborsynthese', 'Industrie'],
    keywords: ['Persäure', 'Umlagerung', 'Criegee', 'Lacton', 'Caprolacton'],
    references: [
      { title: 'A. Baeyer, V. Villiger, Ber. Dtsch. Chem. Ges. 1899, 32, 3625', source: 'Originalarbeit' },
    ],
  },
  {
    id: 'beckmann-umlagerung',
    name: 'Beckmann-Umlagerung',
    category: 'organisch',
    reactionType: 'Umlagerung',
    summary:
      'Ein Oxim lagert sich im Sauren zum Amid um. Technisch entsteht so aus Cyclohexanonoxim das Caprolactam – der Baustein für Nylon-6.',
    smirks: '[CX3:1](=[NX2][OX2H1])[#6:2]>>[NX3H1:1][CX3:2]=[OX1]',
    reactantDefaults: ['CC(=NO)C'],
    substrateSlots: [0],
    functionalGroups: ['imin'],
    generalEquation: 'R₂C=N–OH → R–CO–NH–R′',
    example: {
      substrate: 'CC(=NO)C',
      rxnSmiles: 'CC(=NO)C>>CNC=O',
      caption: 'Acetonoxim lagert sich zu N-Methylformamid um.',
    },
    reagents: [
      { name: 'Oxim', role: 'Reagenz', equivalents: '1,0 Äq.' },
      { name: 'Schwefelsäure (konz.)', role: 'Katalysator', equivalents: 'Überschuss', note: 'technisch auch Oleum oder Phosphorsäure' },
    ],
    conditions: {
      temperature: '100–120 °C',
      duration: '1–2 h',
      solvent: 'konzentrierte Schwefelsäure',
      workup: 'Vorsichtig auf Eis geben und mit Ammoniak neutralisieren',
      purification: 'Umkristallisieren oder Destillation',
    },
    procedure: [
      {
        title: 'Oxim herstellen',
        detail:
          'Keton mit Hydroxylaminhydrochlorid und Natriumacetat zum Oxim umsetzen.',
      },
      {
        title: 'Umlagern',
        detail:
          'Das Oxim in konzentrierte Schwefelsäure eintragen und auf 110 °C erhitzen.',
        caution: 'Stark exotherm – langsam eintragen und gut kühlen.',
      },
      {
        title: 'Aufarbeiten',
        detail:
          'Auf Eis geben und mit Ammoniak neutralisieren.',
        caution: 'Die Neutralisation entwickelt viel Wärme.',
      },
    ],
    mechanism: {
      type: 'Konzertierte Umlagerung über ein Nitrilium-Ion',
      summary:
        'Die OH-Gruppe wird zur Abgangsgruppe; gleichzeitig wandert der Rest, der ihr gegenüber steht.',
      steps: [
        {
          title: '1. Protonierung',
          description:
            'Die Hydroxygruppe des Oxims wird protoniert und damit zur Abgangsgruppe Wasser.',
          electronFlow: 'Freies Elektronenpaar des Sauerstoffs → Proton.',
          relativeEnergy: -5,
        },
        {
          title: '2. Wanderung unter Wasserabspaltung',
          description:
            'Der Rest, der dem austretenden Wasser gegenüber steht (anti-Stellung), wandert zum Stickstoff. Beides geschieht gleichzeitig; es entsteht ein Nitrilium-Ion.',
          electronFlow: 'C–C-Bindungselektronen → Stickstoff; C–OH₂-Bindung bricht.',
          relativeEnergy: 80,
          rateDetermining: true,
        },
        {
          title: '3. Addition von Wasser und Tautomerie',
          description:
            'Wasser addiert an das Nitrilium-Ion; Umlagerung des Protons liefert das Amid.',
          electronFlow: 'Elektronenpaar des Wassers → Nitrilium-Kohlenstoff.',
          relativeEnergy: 20,
        },
      ],
      stereochemistry: 'Es wandert stets der Rest in anti-Stellung zur OH-Gruppe. Aus der Konfiguration des Oxims lässt sich das Produkt daher genau vorhersagen.',
      competingPathways:
        'Bei zu hoher Temperatur treten Fragmentierungen auf.',
      productEnergy: -110,
    },
    safety: {
      ghs: ['GHS05', 'GHS07'],
      hazards: [
        'Konzentrierte Schwefelsäure verursacht schwere Verätzungen (H314).',
        'Hydroxylamin ist gesundheitsschädlich und thermisch instabil.',
      ],
      precautions: [
        'Langsam eintragen und gut kühlen.',
        'Schutzschild verwenden.',
      ],
      ppe: ['Schutzbrille', 'Säurefeste Handschuhe', 'Abzug', 'Schutzscheibe'],
      waste: 'Sauren Rückstand vorsichtig neutralisieren.',
      level: 'Nur Fachlabor',
    },
    typicalYield: '70–95 %',
    scale: ['Laborsynthese', 'Industrie'],
    keywords: ['Umlagerung', 'Oxim', 'Caprolactam', 'Nylon', 'anti'],
    references: [
      { title: 'E. Beckmann, Ber. Dtsch. Chem. Ges. 1886, 19, 988', source: 'Originalarbeit' },
    ],
  },
  {
    id: 'gabriel-synthese',
    name: 'Gabriel-Synthese',
    category: 'organisch',
    reactionType: 'Nucleophile Substitution mit Schutzgruppe',
    summary:
      'Primäre Amine lassen sich nicht sauber durch Alkylierung von Ammoniak herstellen – man erhält immer ein Gemisch. Die Gabriel-Synthese löst das Problem: Phthalimid kann nur einmal alkyliert werden.',
    smirks: '[NX3:1]([CX3:2]=[OX1:3])[CX3:4]=[OX1:5].[CX4:6][Br,Cl,I]>>[NX3:1]([CX3:2]=[OX1:3])([CX3:4]=[OX1:5])[CX4:6]',
    reactantDefaults: ['O=C1NC(=O)c2ccccc12', 'CCCBr'],
    substrateSlots: [0, 1],
    functionalGroups: ['amid', 'halogenalkan_prim'],
    generalEquation: 'Phthalimid-K⁺ + R–X → N-Alkylphthalimid → R–NH₂',
    example: {
      substrate: 'CCCBr',
      rxnSmiles: 'O=C1NC(=O)c2ccccc12.CCCBr>>CCCN1C(=O)c2ccccc2C1=O',
      caption: '1-Brompropan liefert N-Propylphthalimid, aus dem Propylamin freigesetzt wird.',
    },
    reagents: [
      { name: 'Kaliumphthalimid', role: 'Reagenz', equivalents: '1,0 Äq.' },
      { name: 'Halogenalkan', role: 'Reagenz', equivalents: '1,1 Äq.', note: 'nur primäre' },
      { name: 'Hydrazin', role: 'Reagenz', equivalents: '1,5 Äq.', note: 'zur Freisetzung des Amins im zweiten Schritt' },
    ],
    conditions: {
      temperature: '80–100 °C',
      duration: '4–8 h',
      solvent: 'DMF',
      workup: 'Auf Wasser geben, Produkt absaugen',
      purification: 'Umkristallisieren',
    },
    procedure: [
      {
        title: 'Alkylieren',
        detail:
          'Kaliumphthalimid und Halogenalkan in DMF erhitzen.',
      },
      {
        title: 'Fällen',
        detail:
          'Auf Wasser geben; das N-Alkylphthalimid fällt aus.',
      },
      {
        title: 'Amin freisetzen',
        detail:
          'Mit Hydrazin in Ethanol erhitzen. Das Phthalhydrazid fällt aus, das freie Amin bleibt in Lösung.',
        caution: 'Hydrazin ist giftig und krebserzeugend – nur im Abzug und mit Handschuhen.',
        tip: 'Alternativ gelingt die Freisetzung mit Natronlauge unter Druck.',
      },
    ],
    mechanism: {
      type: 'SN2 am Phthalimid-Anion',
      summary:
        'Das Stickstoffatom des Phthalimids ist durch zwei Carbonylgruppen so weit entschärft, dass es nur einmal alkyliert.',
      steps: [
        {
          title: '1. SN2-Angriff',
          description:
            'Das Phthalimid-Anion greift den Kohlenstoff des Halogenalkans an; Halogenid tritt aus.',
          electronFlow: 'Elektronenpaar des Stickstoffs → Kohlenstoff; C–X-Elektronen → Halogenid.',
          relativeEnergy: 55,
          rateDetermining: true,
        },
        {
          title: '2. Freisetzung mit Hydrazin',
          description:
            'Hydrazin greift beide Carbonylgruppen an und bindet sie als cyclisches Phthalhydrazid; das Amin wird frei.',
          electronFlow: 'Elektronenpaare des Hydrazins → Carbonylkohlenstoffe.',
          relativeEnergy: 40,
        },
      ],
      stereochemistry: 'Am angegriffenen Kohlenstoff tritt Inversion ein.',
      competingPathways:
        'Sekundäre Halogenalkane reagieren träge, tertiäre eliminieren nur.',
      productEnergy: -70,
    },
    safety: {
      ghs: ['GHS06', 'GHS08'],
      hazards: [
        'Hydrazin ist giftig und krebserzeugend (H350, H301).',
        'DMF ist reproduktionstoxisch (H360).',
      ],
      precautions: [
        'Ausschließlich im Abzug arbeiten.',
        'Hautkontakt strikt vermeiden.',
      ],
      ppe: ['Schutzbrille', 'Nitrilhandschuhe', 'Abzug', 'Laborkittel'],
      waste: 'Hydrazinhaltige Abfälle gesondert sammeln.',
      level: 'Fortgeschritten',
    },
    typicalYield: '60–85 %',
    scale: ['Laborsynthese'],
    keywords: ['primäres Amin', 'Phthalimid', 'Schutzgruppe', 'SN2', 'Hydrazin'],
    references: [
      { title: 'S. Gabriel, Ber. Dtsch. Chem. Ges. 1887, 20, 2224', source: 'Originalarbeit' },
    ],
  },
  {
    id: 'wolff-kishner',
    name: 'Wolff-Kishner-Reduktion',
    aliases: ['Huang-Minlon-Variante'],
    category: 'organisch',
    reactionType: 'Reduktion der Carbonylgruppe zur Methylengruppe',
    summary:
      'Eine Carbonylgruppe wird vollständig zur CH₂-Gruppe reduziert. Im Basischen gelingt das über ein Hydrazon – im Sauren leistet die Clemmensen-Reduktion dasselbe.',
    smirks: '[CX3:1](=[OX1])[#6:2]>>[CX4H2:1][#6:2]',
    reactantDefaults: ['CC(=O)c1ccccc1'],
    substrateSlots: [0],
    functionalGroups: ['keton', 'aldehyd'],
    generalEquation: 'R₂C=O + H₂N–NH₂ + KOH → R₂CH₂ + N₂↑ + H₂O',
    example: {
      substrate: 'CC(=O)c1ccccc1',
      rxnSmiles: 'CC(=O)c1ccccc1>>CCc1ccccc1',
      caption: 'Acetophenon wird zu Ethylbenzol reduziert.',
    },
    reagents: [
      { name: 'Keton oder Aldehyd', role: 'Reagenz', equivalents: '1,0 Äq.' },
      { name: 'Hydrazinhydrat', role: 'Reduktionsmittel', equivalents: '3,0 Äq.' },
      { name: 'Kaliumhydroxid', role: 'Base', equivalents: '3,0 Äq.' },
      { name: 'Diethylenglycol', role: 'Lösungsmittel', note: 'hoher Siedepunkt nötig' },
    ],
    conditions: {
      temperature: '180–200 °C',
      duration: '3–6 h',
      solvent: 'Diethylenglycol',
      apparatus: 'Kolben mit Destillationsbrücke',
      workup: 'Abkühlen, mit Wasser verdünnen, ausethern',
      purification: 'Destillation',
    },
    procedure: [
      {
        title: 'Hydrazon bilden',
        detail:
          'Keton, Hydrazinhydrat und Kaliumhydroxid in Diethylenglycol auf 120 °C erhitzen.',
        caution: 'Hydrazin ist giftig und krebserzeugend.',
      },
      {
        title: 'Wasser abdestillieren',
        detail:
          'Wasser und überschüssiges Hydrazin abdestillieren, bis die Innentemperatur 190 °C erreicht.',
        tip: 'Erst bei dieser Temperatur zerfällt das Hydrazon – deshalb der hochsiedende Alkohol.',
      },
      {
        title: 'Zersetzen',
        detail:
          'Bei 190 °C mehrere Stunden halten; Stickstoff entweicht sichtbar.',
        caution: 'Kräftige Gasentwicklung – Apparatur darf nicht geschlossen sein.',
      },
    ],
    mechanism: {
      type: 'Hydrazonzerfall unter Stickstoffabspaltung',
      summary:
        'Das Hydrazon wird deprotoniert; der Zerfall unter Bildung von Stickstoff ist die Triebkraft.',
      steps: [
        {
          title: '1. Bildung des Hydrazons',
          description:
            'Hydrazin addiert an die Carbonylgruppe; nach Wasserabspaltung liegt das Hydrazon vor.',
          electronFlow: 'Freies Elektronenpaar des Stickstoffs → Carbonylkohlenstoff.',
          relativeEnergy: 35,
        },
        {
          title: '2. Deprotonierung',
          description:
            'Die Base entfernt ein Proton vom Stickstoff; es entsteht ein Diazenylanion.',
          electronFlow: 'N–H-Bindungselektronen → Hydroxid.',
          relativeEnergy: 40,
        },
        {
          title: '3. Stickstoffabspaltung',
          description:
            'Unter Abgabe von Stickstoff entsteht ein Carbanion. Der Austritt des stabilen Stickstoffmoleküls ist die eigentliche Triebkraft.',
          electronFlow: 'C–N-Bindungselektronen → Carbanion; N≡N entsteht.',
          relativeEnergy: 85,
          rateDetermining: true,
        },
        {
          title: '4. Protonierung',
          description:
            'Das Carbanion nimmt ein Proton aus dem Lösungsmittel auf.',
          electronFlow: 'Elektronenpaar des Carbanions → Proton.',
          relativeEnergy: -20,
        },
      ],
      competingPathways:
        'Säureempfindliche Substrate wählt man hier; säurestabile, aber basenempfindliche besser bei der Clemmensen-Reduktion.',
      productEnergy: -145,
    },
    safety: {
      ghs: ['GHS05', 'GHS06', 'GHS08'],
      hazards: [
        'Hydrazin ist giftig, ätzend und krebserzeugend (H350, H301, H314).',
        'Kaliumhydroxid verätzt Haut und Augen.',
        'Bei 200 °C besteht Verbrennungsgefahr.',
      ],
      precautions: [
        'Ausschließlich im Abzug arbeiten.',
        'Apparatur niemals verschließen – es entsteht Stickstoff.',
        'Schutzschild verwenden.',
      ],
      ppe: ['Schutzbrille', 'Nitrilhandschuhe', 'Abzug', 'Schutzscheibe'],
      waste: 'Hydrazinhaltige Abfälle gesondert sammeln.',
      level: 'Nur Fachlabor',
    },
    typicalYield: '60–90 %',
    scale: ['Laborsynthese'],
    keywords: ['Reduktion', 'Hydrazon', 'Stickstoff', 'Methylen', 'Clemmensen'],
    references: [
      { title: 'N. Kishner 1911; L. Wolff, Liebigs Ann. Chem. 1912, 394, 86', source: 'Originalarbeiten' },
      { title: 'Huang-Minlon, J. Am. Chem. Soc. 1946, 68, 2487', source: 'Verbesserte Variante' },
    ],
  },
  {
    id: 'oximbildung',
    name: 'Oxim- und Hydrazonbildung',
    category: 'organisch',
    reactionType: 'Kondensation an der Carbonylgruppe',
    summary:
      'Hydroxylamin und Hydrazine addieren an Carbonylverbindungen und spalten Wasser ab. Die kristallinen Produkte dienten früher zur Identifizierung von Aldehyden und Ketonen über ihren Schmelzpunkt.',
    smirks: '[CX3:1]=[OX1:2].[NX3H2:3][OX2H1:4]>>[CX3:1]=[NX2:3][OX2H1:4]',
    reactantDefaults: ['CC(C)=O', 'NO'],
    substrateSlots: [0],
    functionalGroups: ['keton', 'aldehyd'],
    generalEquation: 'R₂C=O + H₂N–OH → R₂C=N–OH + H₂O',
    example: {
      substrate: 'CC(C)=O',
      rxnSmiles: 'CC(C)=O.NO>>CC(C)=NO.O',
      caption: 'Aceton und Hydroxylamin ergeben Acetonoxim.',
    },
    reagents: [
      { name: 'Carbonylverbindung', role: 'Reagenz', equivalents: '1,0 Äq.' },
      { name: 'Hydroxylaminhydrochlorid', role: 'Reagenz', equivalents: '1,2 Äq.' },
      { name: 'Natriumacetat', role: 'Base', equivalents: '1,5 Äq.', note: 'puffert auf pH 4–5' },
    ],
    conditions: {
      temperature: 'Raumtemperatur bis 60 °C',
      duration: '30 min bis 2 h',
      solvent: 'Ethanol/Wasser',
      workup: 'Abkühlen; das Oxim kristallisiert aus',
      purification: 'Umkristallisieren aus Ethanol',
    },
    procedure: [
      {
        title: 'Puffern',
        detail:
          'Hydroxylaminhydrochlorid und Natriumacetat in Wasser lösen – der pH-Wert soll bei 4 bis 5 liegen.',
        tip: 'Der pH-Wert ist entscheidend: Zu sauer protoniert das Hydroxylamin, zu basisch wird die Carbonylgruppe nicht aktiviert.',
      },
      {
        title: 'Carbonylverbindung zugeben',
        detail:
          'Die in Ethanol gelöste Carbonylverbindung zugeben und kurz erwärmen.',
      },
      {
        title: 'Kristallisieren',
        detail:
          'Abkühlen; das Oxim fällt meist von selbst aus. Schmelzpunkt bestimmen.',
      },
    ],
    mechanism: {
      type: 'Additions-Eliminierung mit pH-Optimum',
      summary:
        'Das Stickstoffnucleophil addiert, danach wird Wasser abgespalten. Beide Schritte haben gegensätzliche pH-Ansprüche.',
      steps: [
        {
          title: '1. Nucleophile Addition',
          description:
            'Das Stickstoffatom greift den Carbonylkohlenstoff an; es entsteht ein Halbaminal.',
          electronFlow: 'Freies Elektronenpaar des Stickstoffs → Carbonylkohlenstoff.',
          relativeEnergy: 40,
        },
        {
          title: '2. Wasserabspaltung',
          description:
            'Nach Protonierung der OH-Gruppe wird Wasser abgespalten; die C=N-Doppelbindung entsteht.',
          electronFlow: 'Freies Elektronenpaar des Stickstoffs → C–N-Bindung; C–OH₂ bricht.',
          relativeEnergy: 55,
          rateDetermining: true,
        },
      ],
      stereochemistry: 'Oxime können als E- und Z-Isomer vorliegen; sie lassen sich oft trennen.',
      competingPathways:
        'Bei pH unter 3 ist das Nucleophil protoniert und die Reaktion kommt zum Erliegen – genau deshalb wird gepuffert.',
      productEnergy: -50,
    },
    safety: {
      ghs: ['GHS07', 'GHS08'],
      hazards: [
        'Hydroxylamin ist gesundheitsschädlich und thermisch instabil (H302, H315).',
        'Hydrazine sind giftig und krebserzeugend.',
      ],
      precautions: [
        'Hydroxylamin nicht erhitzen.',
        'Im Abzug arbeiten.',
      ],
      ppe: ['Schutzbrille', 'Nitrilhandschuhe', 'Abzug'],
      waste: 'Wässrige Lösungen neutralisieren und sammeln.',
      level: 'Laborpraktikum',
    },
    typicalYield: '80–95 %',
    scale: ['Schulversuch', 'Laborsynthese'],
    keywords: ['Oxim', 'Hydrazon', 'Kondensation', 'Identifizierung', 'Schmelzpunkt'],
    references: [
      { title: 'Organikum, Carbonylverbindungen', source: 'Lehrbuch' },
    ],
  },
  {
    id: 'amidhydrolyse',
    name: 'Amidhydrolyse',
    category: 'organisch',
    reactionType: 'Nucleophile Acyl-Substitution (Hydrolyse)',
    summary:
      'Amide sind die stabilsten Carbonsäurederivate – ihre Spaltung braucht kräftige Bedingungen. Genau diese Stabilität macht die Peptidbindung in Proteinen so haltbar.',
    smirks: '[CX3:1](=[OX1:2])[NX3:3]>>[CX3:1](=[OX1:2])[OX2H1].[NX3:3]',
    reactantDefaults: ['CC(=O)Nc1ccccc1'],
    substrateSlots: [0],
    functionalGroups: ['amid'],
    generalEquation: 'R–CO–NR′₂ + H₂O → R–COOH + HNR′₂',
    example: {
      substrate: 'CC(=O)Nc1ccccc1',
      rxnSmiles: 'CC(=O)Nc1ccccc1>>CC(=O)O.Nc1ccccc1',
      caption: 'Acetanilid wird zu Essigsäure und Anilin gespalten.',
    },
    reagents: [
      { name: 'Amid', role: 'Reagenz', equivalents: '1,0 Äq.' },
      { name: 'Salzsäure oder Natronlauge', role: 'Reagenz', equivalents: 'Überschuss', note: '6-molar' },
    ],
    conditions: {
      temperature: 'Rückfluss, 100–120 °C',
      duration: '4–12 h',
      solvent: 'Wasser',
      workup: 'Im Sauren: Amin bleibt als Salz gelöst; im Basischen: Säure bleibt als Carboxylat gelöst',
      purification: 'Nach Neutralisation extrahieren oder umkristallisieren',
    },
    procedure: [
      {
        title: 'Ansatz',
        detail:
          'Das Amid in 6-molarer Salzsäure suspendieren.',
      },
      {
        title: 'Erhitzen',
        detail:
          'Mehrere Stunden unter Rückfluss kochen, bis eine klare Lösung entsteht.',
        tip: 'Die Trübung verschwindet, sobald das Amid vollständig gespalten ist.',
      },
      {
        title: 'Trennen',
        detail:
          'Mit Natronlauge alkalisch stellen und das Amin ausethern; die Säure bleibt als Carboxylat zurück.',
      },
    ],
    mechanism: {
      type: 'Additions-Eliminierungs-Mechanismus',
      summary:
        'Wasser addiert an die Carbonylgruppe; nach Protonierung tritt das Amin aus.',
      steps: [
        {
          title: '1. Protonierung',
          description:
            'Die Säure protoniert den Carbonylsauerstoff und aktiviert die Carbonylgruppe.',
          electronFlow: 'Freies Elektronenpaar des Sauerstoffs → Proton.',
          relativeEnergy: -5,
        },
        {
          title: '2. Angriff des Wassers',
          description:
            'Wasser greift den Carbonylkohlenstoff an; es entsteht ein tetraedrisches Zwischenprodukt.',
          electronFlow: 'Elektronenpaar des Wassersauerstoffs → Carbonylkohlenstoff.',
          relativeEnergy: 70,
          rateDetermining: true,
        },
        {
          title: '3. Abspaltung des Amins',
          description:
            'Nach Protonierung des Stickstoffs tritt das Amin als Ammoniumion aus; die Carbonsäure bleibt zurück.',
          electronFlow: 'Elektronenpaar des Sauerstoffs → C=O; C–N-Bindung bricht.',
          relativeEnergy: 35,
        },
      ],
      competingPathways:
        'Die Amidbindung ist durch Mesomerie stabilisiert: Das freie Elektronenpaar des Stickstoffs steht mit der Carbonylgruppe in Konjugation. Deshalb sind Amide viel reaktionsträger als Ester.',
      productEnergy: -35,
    },
    safety: {
      ghs: ['GHS05', 'GHS06'],
      hazards: [
        'Konzentrierte Säuren und Laugen verätzen Haut und Augen.',
        'Anilin ist giftig und wird über die Haut aufgenommen (H301, H311).',
      ],
      precautions: [
        'Unter Rückfluss arbeiten, nicht offen kochen.',
        'Aromatische Amine nicht auf die Haut bringen.',
      ],
      ppe: ['Schutzbrille', 'Nitrilhandschuhe', 'Abzug'],
      waste: 'Nach Neutralisation getrennt sammeln.',
      level: 'Laborpraktikum',
    },
    typicalYield: '80–95 %',
    scale: ['Laborsynthese'],
    keywords: ['Hydrolyse', 'Amid', 'Peptidbindung', 'Mesomerie'],
    references: [
      { title: 'Organikum, Carbonsäurederivate', source: 'Lehrbuch' },
    ],
  },
  {
    id: 'umesterung',
    name: 'Umesterung',
    aliases: ['Transesterifizierung', 'Biodieselherstellung'],
    category: 'organisch',
    reactionType: 'Nucleophile Acyl-Substitution',
    summary:
      'Ein Ester tauscht seinen Alkoholrest gegen einen anderen. Technisch macht man daraus Biodiesel: Pflanzenöl und Methanol ergeben Fettsäuremethylester und Glycerin.',
    smirks: '[CX3:1](=[OX1:2])[OX2:3][CX4:4].[OX2H1:5][CX4:6]>>[CX3:1](=[OX1:2])[O:5][CX4:6]',
    reactantDefaults: ['CCOC(C)=O', 'CO'],
    substrateSlots: [0, 1],
    functionalGroups: ['ester', 'alkohol_prim', 'alkohol_sek'],
    generalEquation: 'R–COOR′ + R″–OH ⇌ R–COOR″ + R′–OH',
    example: {
      substrate: 'CCOC(C)=O',
      rxnSmiles: 'CCOC(C)=O.CO>>COC(C)=O.CCO',
      caption: 'Essigsäureethylester und Methanol ergeben Essigsäuremethylester.',
    },
    reagents: [
      { name: 'Ester', role: 'Reagenz', equivalents: '1,0 Äq.' },
      { name: 'Alkohol', role: 'Reagenz', equivalents: 'großer Überschuss', note: 'verschiebt das Gleichgewicht' },
      { name: 'Natriummethanolat', role: 'Katalysator', equivalents: '1 mol%', note: 'alternativ Schwefelsäure' },
    ],
    conditions: {
      temperature: '60–65 °C',
      duration: '1–2 h',
      solvent: 'Alkohol im Überschuss',
      workup: 'Glycerinphase abtrennen, Esterphase waschen',
      purification: 'Waschen und Trocknen',
      monitoring: 'Die Phasentrennung zeigt den Fortschritt',
    },
    procedure: [
      {
        title: 'Katalysator lösen',
        detail:
          'Natriummethanolat in Methanol lösen.',
        caution: 'Methanol ist giftig und führt zur Erblindung – Dämpfe nicht einatmen.',
      },
      {
        title: 'Öl zugeben',
        detail:
          'Das Pflanzenöl auf 60 °C erwärmen und die Katalysatorlösung zugeben.',
        tip: 'Nach etwa einer Stunde setzt sich Glycerin als schwere untere Phase ab.',
      },
      {
        title: 'Trennen',
        detail:
          'Im Scheidetrichter die Glycerinphase abtrennen und den Ester mit Wasser waschen.',
      },
    ],
    mechanism: {
      type: 'Additions-Eliminierung am Acylkohlenstoff',
      summary:
        'Das Alkoholat greift die Estergruppe an; der ursprüngliche Alkoholrest tritt aus.',
      steps: [
        {
          title: '1. Angriff des Alkoholats',
          description:
            'Das Alkoholat greift den Carbonylkohlenstoff an; es entsteht ein tetraedrisches Zwischenprodukt.',
          electronFlow: 'Elektronenpaar des Alkoholats → Carbonylkohlenstoff.',
          relativeEnergy: 45,
          rateDetermining: true,
        },
        {
          title: '2. Austritt des alten Alkoholrests',
          description:
            'Die C=O-Bindung bildet sich zurück, das ursprüngliche Alkoholat tritt aus.',
          electronFlow: 'Elektronenpaar des Sauerstoffs → C=O; alte C–O-Bindung bricht.',
          relativeEnergy: 25,
        },
      ],
      competingPathways:
        'Bei freien Fettsäuren im Öl bildet sich Seife statt Ester – deshalb muss das Öl vorher entsäuert werden.',
      productEnergy: -15,
    },
    safety: {
      ghs: ['GHS02', 'GHS05', 'GHS06'],
      hazards: [
        'Methanol ist giftig und führt bei Verschlucken zur Erblindung (H301, H331).',
        'Natriummethanolat wirkt stark ätzend.',
      ],
      precautions: [
        'Im Abzug arbeiten.',
        'Methanol niemals in Getränkeflaschen umfüllen.',
      ],
      ppe: ['Schutzbrille', 'Nitrilhandschuhe', 'Abzug'],
      waste: 'Glycerinphase und Methanolreste getrennt sammeln.',
      level: 'Laborpraktikum',
    },
    typicalYield: '85–98 %',
    scale: ['Schulversuch', 'Industrie'],
    keywords: ['Biodiesel', 'Umesterung', 'Glycerin', 'Fettsäuremethylester', 'Gleichgewicht'],
    references: [
      { title: 'Ullmanns Enzyklopädie, Fatty Acid Esters', source: 'Technische Chemie' },
    ],
  },
  {
    id: 'nitril-reduktion',
    name: 'Reduktion von Nitrilen zu Aminen',
    category: 'organisch',
    reactionType: 'Reduktion',
    summary:
      'Lithiumaluminiumhydrid reduziert die Dreifachbindung eines Nitrils vollständig zum primären Amin. Zusammen mit der Nitrilsynthese aus einem Halogenalkan verlängert das eine Kette um ein Kohlenstoffatom.',
    smirks: '[CX2:1]#[NX1:2]>>[CX4H2:1][NX3H2:2]',
    reactantDefaults: ['CCCC#N'],
    substrateSlots: [0],
    functionalGroups: ['nitril'],
    generalEquation: 'R–C≡N + 4 [H] → R–CH₂–NH₂',
    example: {
      substrate: 'CCCC#N',
      rxnSmiles: 'CCCC#N>>CCCCN',
      caption: 'Butyronitril wird zu Butylamin reduziert.',
    },
    reagents: [
      { name: 'Nitril', role: 'Reagenz', equivalents: '1,0 Äq.' },
      { name: 'Lithiumaluminiumhydrid', role: 'Reduktionsmittel', equivalents: '2,0 Äq.', note: 'alternativ Wasserstoff an Raney-Nickel' },
    ],
    conditions: {
      temperature: '0 °C bis Rückfluss',
      duration: '2–6 h',
      solvent: 'absoluter Diethylether oder THF',
      atmosphere: 'Stickstoff',
      workup: 'Vorsichtig mit Wasser, dann Natronlauge hydrolysieren',
      purification: 'Destillation',
    },
    procedure: [
      {
        title: 'Vorlegen',
        detail:
          'Lithiumaluminiumhydrid in absolutem Ether suspendieren und auf 0 °C kühlen.',
        caution: 'LiAlH₄ entzündet sich bei Kontakt mit Wasser – absolut wasserfrei arbeiten.',
      },
      {
        title: 'Nitril zutropfen',
        detail:
          'Das Nitril langsam zutropfen und anschließend unter Rückfluss erhitzen.',
      },
      {
        title: 'Aufarbeiten',
        detail:
          'Nach Fieser: je Gramm LiAlH₄ nacheinander 1 mL Wasser, 1 mL 15-prozentige Natronlauge und 3 mL Wasser zutropfen.',
        caution: 'Die Hydrolyse entwickelt Wasserstoff – keine Zündquellen.',
        tip: 'Die Aluminiumsalze fallen dabei körnig aus und lassen sich gut abfiltrieren.',
      },
    ],
    mechanism: {
      type: 'Zweifache Hydridübertragung',
      summary:
        'Zwei Hydrid-Ionen werden nacheinander auf den Nitrilkohlenstoff übertragen.',
      steps: [
        {
          title: '1. Erste Hydridübertragung',
          description:
            'Ein Hydrid greift den Nitrilkohlenstoff an; es entsteht ein Metallimid.',
          electronFlow: 'Hydrid → Nitrilkohlenstoff; π-Elektronen → Stickstoff.',
          relativeEnergy: 50,
          rateDetermining: true,
        },
        {
          title: '2. Zweite Hydridübertragung',
          description:
            'Ein weiteres Hydrid addiert an das Imin; es entsteht ein Amid-Anion.',
          electronFlow: 'Hydrid → Iminkohlenstoff; π-Elektronen → Stickstoff.',
          relativeEnergy: 40,
        },
        {
          title: '3. Hydrolyse',
          description:
            'Bei der Aufarbeitung wird das Amid-Anion protoniert; das freie Amin entsteht.',
          electronFlow: 'Elektronenpaar des Stickstoffs → Proton.',
          relativeEnergy: -25,
        },
      ],
      competingPathways:
        'Mit DIBAL-H bei tiefer Temperatur bleibt die Reduktion beim Aldehyd stehen – eine nützliche Alternative.',
      productEnergy: -175,
    },
    safety: {
      ghs: ['GHS02', 'GHS05'],
      hazards: [
        'Lithiumaluminiumhydrid entzündet sich an feuchter Luft von selbst (H260).',
        'Ether bildet explosive Peroxide.',
      ],
      precautions: [
        'Absolut wasserfrei arbeiten.',
        'Metallbrandlöscher bereithalten – niemals Wasser.',
        'Ether vor Gebrauch auf Peroxide prüfen.',
      ],
      ppe: ['Schutzbrille', 'Nitrilhandschuhe', 'Abzug', 'Laborkittel aus Baumwolle'],
      waste: 'LiAlH₄-Reste vorsichtig mit Essigester zerstören.',
      level: 'Nur Fachlabor',
    },
    typicalYield: '70–90 %',
    scale: ['Laborsynthese'],
    keywords: ['Nitril', 'Amin', 'LiAlH4', 'Kettenverlängerung', 'Hydrid'],
    references: [
      { title: 'Organikum, Reduktionen', source: 'Lehrbuch' },
    ],
  },
  {
    id: 'kolbe-schmitt',
    name: 'Kolbe-Schmitt-Reaktion',
    category: 'organisch',
    reactionType: 'Elektrophile aromatische Substitution mit Kohlenstoffdioxid',
    summary:
      'Phenolat reagiert unter Druck mit Kohlenstoffdioxid zur Salicylsäure – dem Ausgangsstoff für Aspirin. Es ist eines der wenigen technischen Verfahren, die Kohlenstoffdioxid stofflich nutzen.',
    smirks: '[cH:1][c:2][OX2H1:3]>>[c:2]([O:3])[c:1]C(=O)O',
    reactantDefaults: ['Oc1ccccc1'],
    substrateSlots: [0],
    functionalGroups: ['phenol', 'aromat'],
    generalEquation: 'C₆H₅O⁻Na⁺ + CO₂ → 2-HO–C₆H₄–COO⁻Na⁺',
    example: {
      substrate: 'Oc1ccccc1',
      rxnSmiles: 'Oc1ccccc1>>O=C(O)c1ccccc1O',
      caption: 'Phenol wird über das Natriumphenolat zur Salicylsäure carboxyliert.',
    },
    reagents: [
      { name: 'Natriumphenolat', role: 'Reagenz', equivalents: '1,0 Äq.', note: 'vorher aus Phenol und Natronlauge herstellen und trocknen' },
      { name: 'Kohlenstoffdioxid', role: 'Reagenz', equivalents: 'Überschuss', note: '5 bar' },
    ],
    conditions: {
      temperature: '125 °C',
      duration: '4–8 h',
      pressure: '5 bar Kohlenstoffdioxid',
      apparatus: 'Autoklav',
      workup: 'Mit Schwefelsäure ansäuern – Salicylsäure fällt aus',
      purification: 'Umkristallisieren aus Wasser',
    },
    procedure: [
      {
        title: 'Phenolat trocknen',
        detail:
          'Natriumphenolat sorgfältig trocknen – Wasser stört die Reaktion vollständig.',
      },
      {
        title: 'Unter Druck setzen',
        detail:
          'Im Autoklav bei 125 °C und 5 bar Kohlenstoffdioxid mehrere Stunden halten.',
        caution: 'Arbeiten unter Druck nur mit geprüfter Apparatur und Erfahrung.',
      },
      {
        title: 'Ansäuern',
        detail:
          'Den Rückstand in Wasser lösen und mit Schwefelsäure ansäuern; die Salicylsäure fällt aus.',
        tip: 'Aus ihr entsteht mit Acetanhydrid direkt Aspirin.',
      },
    ],
    mechanism: {
      type: 'Elektrophile Substitution am Phenolat',
      summary:
        'Das Phenolat ist stark aktiviert und greift Kohlenstoffdioxid an. Das Natrium-Ion dirigiert den Angriff in die ortho-Stellung.',
      steps: [
        {
          title: '1. Koordination',
          description:
            'Das Natrium-Ion des Phenolats koordiniert das Kohlenstoffdioxid und bringt es in die Nähe der ortho-Position.',
          electronFlow: 'Elektronenpaar des Phenolatsauerstoffs → Natrium; Natrium → CO₂.',
          relativeEnergy: 30,
        },
        {
          title: '2. Angriff auf CO₂',
          description:
            'Der ortho-Kohlenstoff greift das Kohlenstoffatom des CO₂ an; der Ring verliert vorübergehend seine Aromatizität.',
          electronFlow: 'π-Elektronen des Rings → Kohlenstoff des CO₂.',
          relativeEnergy: 75,
          rateDetermining: true,
        },
        {
          title: '3. Rearomatisierung',
          description:
            'Ein Proton wandert zum Carboxylat; der aromatische Zustand wird wiederhergestellt.',
          electronFlow: 'Elektronen der C–H-Bindung → Ring.',
          relativeEnergy: -20,
        },
      ],
      competingPathways:
        'Mit Kalium statt Natrium entsteht bevorzugt das para-Produkt, die 4-Hydroxybenzoesäure – das Ion steuert also die Regiochemie.',
      productEnergy: -45,
    },
    safety: {
      ghs: ['GHS05', 'GHS07'],
      hazards: [
        'Phenol ist ätzend und wird über die Haut aufgenommen (H314, H301).',
        'Arbeiten unter Druck bergen Berstgefahr.',
      ],
      precautions: [
        'Nur mit geprüftem Autoklav arbeiten.',
        'Phenol nicht auf die Haut bringen – sofort mit Polyethylenglycol abwaschen.',
      ],
      ppe: ['Schutzbrille', 'Nitrilhandschuhe', 'Abzug'],
      waste: 'Phenolhaltige Abfälle gesondert sammeln.',
      level: 'Nur Fachlabor',
    },
    typicalYield: '60–80 %',
    scale: ['Industrie'],
    keywords: ['Salicylsäure', 'Kohlenstoffdioxid', 'Carboxylierung', 'Aspirin', 'Druck'],
    references: [
      { title: 'H. Kolbe, R. Schmitt, J. Prakt. Chem. 1885, 31, 397', source: 'Originalarbeit' },
    ],
  },
  {
    id: 'iodoform-probe',
    name: 'Iodoform-Reaktion',
    aliases: ['Haloform-Reaktion', 'Iodoformprobe'],
    category: 'analytik',
    reactionType: 'Mehrfache Halogenierung mit Spaltung',
    summary:
      'Methylketone werden im Basischen dreifach iodiert; anschließend bricht die Bindung und gelbes Iodoform fällt aus. Der gelbe Niederschlag mit typischem Geruch weist Methylketone und Ethanol nach.',
    smirks: '[CX3:1](=[OX1:2])[CX4H3]>>[CX3:1](=[OX1:2])[OX2H1]',
    reactantDefaults: ['CC(=O)c1ccccc1'],
    substrateSlots: [0],
    functionalGroups: ['keton'],
    generalEquation: 'R–CO–CH₃ + 3 I₂ + 4 NaOH → R–COO⁻Na⁺ + CHI₃↓ + 3 NaI + 3 H₂O',
    example: {
      substrate: 'CC(=O)c1ccccc1',
      rxnSmiles: 'CC(=O)c1ccccc1>>O=C(O)c1ccccc1',
      caption: 'Acetophenon liefert Benzoesäure und gelbes Iodoform.',
    },
    reagents: [
      { name: 'Methylketon', role: 'Reagenz', equivalents: '1,0 Äq.' },
      { name: 'Iod-Kaliumiodid-Lösung', role: 'Reagenz', equivalents: '3,0 Äq.', note: 'Lugolsche Lösung' },
      { name: 'Natronlauge', role: 'Base', equivalents: '4,0 Äq.', note: '2-molar' },
    ],
    conditions: {
      temperature: 'Raumtemperatur bis 60 °C',
      duration: '5–15 min',
      solvent: 'Wasser/Ethanol',
      workup: 'Niederschlag absaugen',
      monitoring: 'Gelber Niederschlag mit Geruch nach Krankenhaus',
    },
    procedure: [
      {
        title: 'Probe ansetzen',
        detail:
          'Wenige Tropfen der Probe in Wasser oder Ethanol lösen.',
      },
      {
        title: 'Reagenz zugeben',
        detail:
          'Natronlauge und tropfenweise Iodlösung zugeben, bis die braune Farbe bestehen bleibt.',
        tip: 'Bleibt die Farbe sofort, liegt kein Methylketon vor.',
      },
      {
        title: 'Beobachten',
        detail:
          'Nach kurzem Erwärmen fällt gelbes Iodoform aus; der Geruch ist charakteristisch.',
        tip: 'Auch Ethanol und sekundäre Methylcarbinole reagieren positiv – sie werden zuerst zum Methylketon oxidiert.',
      },
    ],
    mechanism: {
      type: 'Dreifache Halogenierung mit anschließender Spaltung',
      summary:
        'Jede Iodierung macht die verbleibenden Wasserstoffatome saurer; nach der dritten bricht die C–C-Bindung.',
      steps: [
        {
          title: '1. Enolatbildung und Iodierung',
          description:
            'Die Base bildet ein Enolat, das Iod angreift. Die eingeführte Iodgruppe erhöht die Acidität der restlichen Wasserstoffatome.',
          electronFlow: 'Enolat-Elektronen → Iodmolekül; I–I-Bindung bricht.',
          relativeEnergy: 30,
        },
        {
          title: '2. Zweifache Wiederholung',
          description:
            'Der Vorgang wiederholt sich zweimal, bis eine Triiodmethylgruppe vorliegt.',
          electronFlow: 'Wie Schritt 1, jeweils schneller.',
          relativeEnergy: 25,
        },
        {
          title: '3. Spaltung durch Hydroxid',
          description:
            'Hydroxid greift die Carbonylgruppe an; das Triiodmethyl-Anion tritt aus – es ist durch drei Iodatome stabilisiert.',
          electronFlow: 'Elektronenpaar des Hydroxids → Carbonylkohlenstoff; C–C-Elektronen → Triiodmethyl-Anion.',
          relativeEnergy: 60,
          rateDetermining: true,
        },
        {
          title: '4. Protonierung',
          description:
            'Das Anion nimmt ein Proton auf; gelbes Iodoform fällt aus.',
          electronFlow: 'Elektronenpaar des Carbanions → Proton.',
          relativeEnergy: -40,
        },
      ],
      competingPathways:
        'Aldehyde ohne Methylgruppe und Ketone ohne CH₃ reagieren nicht – genau darauf beruht die Aussagekraft der Probe.',
      productEnergy: -120,
    },
    safety: {
      ghs: ['GHS07'],
      hazards: [
        'Iodlösung färbt Haut und Kleidung.',
        'Iodoform riecht durchdringend und ist gesundheitsschädlich.',
      ],
      precautions: [
        'Im Abzug arbeiten.',
        'Nur kleine Mengen ansetzen.',
      ],
      ppe: ['Schutzbrille', 'Nitrilhandschuhe'],
      waste: 'Iodhaltige Lösungen mit Thiosulfat entfärben, dann entsorgen.',
      level: 'Schulversuch',
    },
    typicalYield: 'Nachweisreaktion – keine präparative Ausbeute',
    scale: ['Schulversuch', 'Analytik'],
    keywords: ['Nachweis', 'Methylketon', 'Iodoform', 'gelb', 'Haloform'],
    references: [
      { title: 'Organikum, Nachweisreaktionen', source: 'Lehrbuch' },
    ],
  },
];
