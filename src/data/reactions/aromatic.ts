/** Elektrophile Aromatensubstitution, Diazoniumchemie und Kreuzkupplungen. */
import type { ReactionRule } from '../types';

export const AROMATIC_REACTIONS: ReactionRule[] = [
  {
    id: 'nitrierung-aromat',
    name: 'Nitrierung von Aromaten',
    category: 'organisch',
    reactionType: 'Elektrophile aromatische Substitution',
    summary:
      'Nitriersäure erzeugt das Nitroniumion, das den Aromaten angreift. Die Nitrogruppe ist Ausgangspunkt für Anilin, Azofarbstoffe und viele Wirkstoffe.',
    smirks: '[cH:1]>>[c:1][N+](=O)[O-]',
    reactantDefaults: ['c1ccccc1'],
    substrateSlots: [0],
    functionalGroups: ['aromat'],
    generalEquation: 'Ar–H + HNO₃ →(H₂SO₄) Ar–NO₂ + H₂O',
    example: {
      substrate: 'Cc1ccccc1',
      rxnSmiles: 'Cc1ccccc1>>Cc1ccccc1[N+](=O)[O-]',
      caption: 'Toluol wird nitriert; die Methylgruppe dirigiert nach ortho und para.',
    },
    reagents: [
      { name: 'Aromat', role: 'Reagenz', equivalents: '1,0 Äq.' },
      { name: 'Salpetersäure (konz.)', formula: 'HNO3', role: 'Reagenz', equivalents: '1,1 Äq.' },
      { name: 'Schwefelsäure (konz.)', formula: 'H2SO4', role: 'Katalysator', equivalents: '2 Äq.', note: 'protoniert die Salpetersäure und bindet das Wasser' },
    ],
    conditions: {
      temperature: '0–50 °C – Temperatur streng kontrollieren',
      duration: '1–3 h',
      solvent: 'Nitriersäure selbst oder Dichlormethan',
      apparatus: 'Dreihalskolben mit Innenthermometer, Tropftrichter und Eisbad',
      workup: 'Auf Eis gießen, Produkt fällt aus oder wird extrahiert',
      purification: 'Umkristallisieren oder Vakuumdestillation',
      monitoring: 'DC; Temperatur als wichtigster Prozessparameter',
    },
    procedure: [
      {
        title: 'Nitriersäure ansetzen',
        detail: 'Schwefelsäure vorlegen, im Eisbad kühlen und Salpetersäure langsam zutropfen.',
        caution: 'Stark exotherm. Niemals Wasser zur Säure geben.',
      },
      {
        title: 'Aromat zutropfen',
        detail: 'Den Aromaten so langsam zutropfen, dass die Innentemperatur unter 50 °C bleibt.',
        caution: 'Bei zu hoher Temperatur droht Mehrfachnitrierung und ein Durchgehen der Reaktion.',
      },
      { title: 'Nachrühren', detail: '1–2 h bei kontrollierter Temperatur rühren.' },
      {
        title: 'Aufarbeiten',
        detail: 'Auf Eiswasser gießen, Niederschlag absaugen, neutral waschen und umkristallisieren.',
      },
    ],
    mechanism: {
      type: 'SEAr – elektrophile aromatische Substitution',
      summary:
        'Schwefelsäure erzeugt aus Salpetersäure das Nitroniumion. Dieses wird vom aromatischen π-System angegriffen; der entstehende σ-Komplex gibt ein Proton ab und stellt die Aromatizität wieder her.',
      steps: [
        {
          title: '1. Bildung des Nitroniumions',
          rxnSmiles: 'O[N+](=O)[O-]>>[N+](=O)=O',
          description:
            'Schwefelsäure protoniert die Salpetersäure; Wasser wird abgespalten und es entsteht das lineare Nitroniumion NO₂⁺.',
          electronFlow: 'Elektronenpaar des Hydroxysauerstoffs → Proton; C–O-artige Bindung bricht heterolytisch.',
          relativeEnergy: 20,
        },
        {
          title: '2. Angriff des Aromaten (σ-Komplex)',
          description:
            'Das π-System greift das Nitroniumion an. Es entsteht ein mesomeriestabilisiertes Carbeniumion – der σ-Komplex oder Arenium-Ion. Hier geht die Aromatizität vorübergehend verloren.',
          electronFlow: 'π-Elektronen des Aromaten → Stickstoff des Nitroniumions.',
          intermediate: 'σ-Komplex (Arenium-Ion)',
          relativeEnergy: 85,
          rateDetermining: true,
        },
        {
          title: '3. Deprotonierung',
          rxnSmiles: 'c1ccccc1>>[O-][N+](=O)c1ccccc1',
          description:
            'Hydrogensulfat nimmt das Proton am sp³-Kohlenstoff auf; die Elektronen kehren ins Ringsystem zurück und die Aromatizität ist wiederhergestellt.',
          electronFlow: 'C–H-Bindungselektronen → aromatisches System.',
          relativeEnergy: -70,
        },
      ],
      competingPathways:
        'Zweitsubstitution: Aktivierende Gruppen (–OH, –NH₂, –CH₃) dirigieren nach ortho/para, desaktivierende (–NO₂, –COOH, –SO₃H) nach meta. Halogene sind desaktivierend, dirigieren aber trotzdem ortho/para.',
    },
    safety: {
      ghs: ['GHS03', 'GHS05', 'GHS06'],
      hazards: [
        'Nitriersäure ist stark oxidierend und ätzend (H272, H314).',
        'Polynitroaromaten sind explosionsgefährlich.',
        'Nitrobenzol ist giftig und reproduktionstoxisch (H301, H360F).',
      ],
      precautions: [
        'Temperatur laufend kontrollieren und Kühlbad bereithalten.',
        'Nur kleine Ansätze; niemals bis zur Mehrfachnitrierung treiben.',
        'Keine Berührung mit organischen Lösungsmitteln in der Nitriersäure.',
      ],
      ppe: ['Schutzbrille', 'Vollvisier', 'Säureschutzhandschuhe', 'Abzug mit Schutzscheibe'],
      waste: 'Nitroaromaten als Sondermüll, saure Abfälle gesondert neutralisieren.',
      level: 'Nur Fachlabor',
    },
    typicalYield: '70–95 %',
    scale: ['Laborsynthese', 'Industrie'],
    keywords: ['SEAr', 'Nitroniumion', 'σ-Komplex', 'Zweitsubstitution'],
    references: [{ title: 'Organikum, Kapitel Nitrierung', source: 'Wiley-VCH' }],
  },
  {
    id: 'sulfonierung-aromat',
    name: 'Sulfonierung von Aromaten',
    category: 'organisch',
    reactionType: 'Elektrophile aromatische Substitution',
    summary:
      'Rauchende Schwefelsäure überträgt SO₃ auf den Aromaten. Die Reaktion ist reversibel – Sulfonsäuregruppen lassen sich als Platzhalter einsetzen und später wieder abspalten.',
    smirks: '[cH:1]>>[c:1][SX4](=[OX1])(=[OX1])[OX2H1]',
    reactantDefaults: ['c1ccccc1'],
    substrateSlots: [0],
    functionalGroups: ['aromat'],
    generalEquation: 'Ar–H + SO₃ ⇌ Ar–SO₃H',
    example: {
      substrate: 'c1ccccc1',
      rxnSmiles: 'c1ccccc1>>OS(=O)(=O)c1ccccc1',
      caption: 'Benzol wird zu Benzolsulfonsäure sulfoniert.',
    },
    reagents: [
      { name: 'Aromat', role: 'Reagenz', equivalents: '1,0 Äq.' },
      { name: 'Oleum (20 % SO₃)', role: 'Reagenz', equivalents: '2–3 Äq.' },
    ],
    conditions: {
      temperature: '40–120 °C',
      duration: '2–6 h',
      solvent: 'ohne – die Säure ist zugleich Lösungsmittel',
      workup: 'Auf Eis gießen und als Natriumsalz aussalzen',
      purification: 'Umkristallisieren aus Wasser',
    },
    procedure: [
      { title: 'Vorlegen', detail: 'Oleum im Kolben vorlegen und den Aromaten langsam zutropfen.' },
      {
        title: 'Erwärmen',
        detail: 'Auf 80–100 °C erwärmen und rühren, bis sich eine Probe klar in Wasser löst.',
        caution: 'Oleum reagiert mit Wasser explosionsartig.',
      },
      { title: 'Aussalzen', detail: 'Vorsichtig auf Eis gießen und mit Kochsalz das Natriumsulfonat ausfällen.' },
      { title: 'Reinigen', detail: 'Absaugen und aus wenig heißem Wasser umkristallisieren.' },
    ],
    mechanism: {
      type: 'SEAr mit SO₃ als Elektrophil',
      summary:
        'Schwefeltrioxid ist wegen der drei elektronenziehenden Sauerstoffatome stark elektrophil und wird direkt vom Aromaten angegriffen. Alle Schritte sind Gleichgewichte.',
      steps: [
        {
          title: '1. Angriff auf SO₃',
          description: 'Das π-System greift das Schwefelatom an; es bildet sich der σ-Komplex.',
          electronFlow: 'π-Elektronen → Schwefel; S=O-π-Elektronen → Sauerstoff.',
          intermediate: 'σ-Komplex',
          relativeEnergy: 75,
          rateDetermining: true,
        },
        {
          title: '2. Rearomatisierung',
          rxnSmiles: 'c1ccccc1>>OS(=O)(=O)c1ccccc1',
          description: 'Protonenabgabe stellt die Aromatizität wieder her; nach Protonierung liegt die Sulfonsäure vor.',
          electronFlow: 'C–H-Bindungselektronen → Ring.',
          relativeEnergy: -35,
        },
      ],
      competingPathways:
        'Die Reaktion ist umkehrbar: mit überhitztem Wasserdampf lässt sich die Sulfonsäuregruppe wieder abspalten. Das nutzt man, um eine para-Position zu blockieren und gezielt ortho zu substituieren.',
    },
    safety: {
      ghs: ['GHS05'],
      hazards: ['Oleum verursacht schwerste Verätzungen (H314) und reagiert heftig mit Wasser (EUH014).'],
      precautions: ['Nur im Abzug mit Schutzscheibe.', 'Immer Säure auf Eis geben, nie Wasser in die Säure.'],
      ppe: ['Vollvisier', 'Säureschutzhandschuhe', 'Säureschürze', 'Abzug'],
      waste: 'Vorsichtig neutralisieren, dann als wässrigen Abfall entsorgen.',
      level: 'Nur Fachlabor',
    },
    typicalYield: '75–95 %',
    scale: ['Laborsynthese', 'Industrie'],
    keywords: ['Sulfonsäure', 'reversibel', 'Blockierungsgruppe', 'Tensid'],
    references: [{ title: 'Organikum, Kapitel Sulfonierung', source: 'Wiley-VCH' }],
  },
  {
    id: 'friedel-crafts-acylierung',
    name: 'Friedel-Crafts-Acylierung',
    category: 'organisch',
    reactionType: 'Elektrophile aromatische Substitution',
    summary:
      'Eine Lewis-Säure erzeugt aus dem Säurechlorid ein Acyliumion, das den Aromaten acyliert. Anders als bei der Alkylierung tritt keine Mehrfachsubstitution und keine Umlagerung auf.',
    smirks: '[cH:1].[CX3:2](=[OX1:3])[Cl]>>[c:1][CX3:2]=[OX1:3]',
    reactantDefaults: ['c1ccccc1', 'CC(=O)Cl'],
    substrateSlots: [0, 1],
    functionalGroups: ['aromat', 'saeurechlorid'],
    generalEquation: 'Ar–H + R–COCl →(AlCl₃) Ar–CO–R + HCl',
    example: {
      substrate: 'c1ccccc1',
      rxnSmiles: 'c1ccccc1.CC(=O)Cl>>CC(=O)c1ccccc1',
      caption: 'Benzol und Acetylchlorid ergeben Acetophenon.',
    },
    reagents: [
      { name: 'Aromat', role: 'Reagenz', equivalents: '1,0 Äq. oder als Lösungsmittel' },
      { name: 'Säurechlorid oder Anhydrid', role: 'Reagenz', equivalents: '1,1 Äq.' },
      {
        name: 'Aluminiumchlorid',
        formula: 'AlCl3',
        role: 'Katalysator',
        equivalents: '1,2 Äq.',
        note: 'wird stöchiometrisch verbraucht, weil es das Keton komplexiert',
      },
    ],
    conditions: {
      temperature: '0 °C → Raumtemperatur',
      duration: '2–6 h',
      solvent: 'Dichlormethan, Schwefelkohlenstoff oder Aromatenüberschuss',
      atmosphere: 'trocken – AlCl₃ hydrolysiert sofort',
      workup: 'Vorsichtig auf Eis/Salzsäure geben',
      purification: 'Destillation oder Umkristallisieren',
    },
    procedure: [
      {
        title: 'Katalysator vorlegen',
        detail: 'Wasserfreies Aluminiumchlorid im trockenen Kolben in Dichlormethan suspendieren und auf 0 °C kühlen.',
        caution: 'AlCl₃ reagiert heftig mit Wasser unter HCl-Entwicklung.',
      },
      { title: 'Säurechlorid zugeben', detail: 'Säurechlorid zutropfen; es bildet sich der Acylium-Komplex.' },
      {
        title: 'Aromat zutropfen',
        detail: 'Aromaten langsam zugeben – HCl entwickelt sich. Abgase in Waschflasche leiten.',
      },
      {
        title: 'Aufarbeiten',
        detail: 'Auf Eis/konz. Salzsäure gießen, um den Komplex zu zersetzen, Phasen trennen, waschen, trocknen und reinigen.',
      },
    ],
    mechanism: {
      type: 'SEAr über Acyliumion',
      summary:
        'Die Lewis-Säure abstrahiert das Chlorid und erzeugt ein mesomeriestabilisiertes Acyliumion. Nach dem Angriff des Aromaten und Rearomatisierung bleibt das Keton als AlCl₃-Komplex zurück.',
      steps: [
        {
          title: '1. Bildung des Acyliumions',
          rxnSmiles: 'CC(=O)Cl>>C[C+]=O',
          description:
            'AlCl₃ nimmt das Chlorid auf; das entstehende Acyliumion ist durch die Beteiligung des Sauerstoffs stabilisiert (R–C≡O⁺).',
          electronFlow: 'C–Cl-Bindungselektronen → Aluminium.',
          intermediate: 'Acyliumion',
          relativeEnergy: 30,
        },
        {
          title: '2. Angriff des Aromaten',
          description: 'Das π-System greift das Acyliumion an; es entsteht der σ-Komplex.',
          electronFlow: 'π-Elektronen → Acyliumkohlenstoff.',
          relativeEnergy: 80,
          rateDetermining: true,
        },
        {
          title: '3. Rearomatisierung und Komplexierung',
          rxnSmiles: 'c1ccccc1.CC(=O)Cl>>CC(=O)c1ccccc1',
          description:
            'Nach Protonenabgabe liegt das Keton vor. Es bindet AlCl₃ als Lewis-Base – deshalb ist ein volles Äquivalent nötig.',
          electronFlow: 'C–H-Bindungselektronen → Ring.',
          relativeEnergy: -55,
        },
      ],
      competingPathways:
        'Stark desaktivierte Aromaten (Nitrobenzol) reagieren nicht. Die Acylierung stoppt nach einfacher Substitution, weil die Carbonylgruppe den Ring desaktiviert – ein Vorteil gegenüber der Alkylierung.',
    },
    safety: {
      ghs: ['GHS05', 'GHS07'],
      hazards: [
        'Aluminiumchlorid reagiert heftig mit Wasser (EUH014) und ist ätzend (H314).',
        'Säurechloride sind ätzend und tränenreizend.',
        'Benzol ist krebserzeugend (H350) – wo möglich durch Toluol ersetzen.',
      ],
      precautions: ['Trocken und im Abzug arbeiten.', 'HCl-Abgase auswaschen.'],
      ppe: ['Schutzbrille', 'Handschuhe', 'Laborkittel', 'Abzug'],
      waste: 'Aluminiumhaltige wässrige Phasen neutralisieren; benzolhaltige Abfälle als Sondermüll.',
      level: 'Fortgeschritten',
    },
    typicalYield: '70–95 %',
    scale: ['Laborsynthese', 'Industrie'],
    keywords: ['Friedel-Crafts', 'Acylium', 'Lewis-Säure', 'Keton'],
    references: [
      { title: 'Friedel, Crafts, C. R. Acad. Sci. 1877, 84, 1392', source: 'Originalarbeit' },
    ],
  },
  {
    id: 'friedel-crafts-alkylierung',
    name: 'Friedel-Crafts-Alkylierung',
    category: 'organisch',
    reactionType: 'Elektrophile aromatische Substitution',
    summary:
      'Ein Halogenalkan alkyliert den Aromaten unter Lewis-Säure-Katalyse. Umlagerungen des Carbeniumions und Mehrfachalkylierung schränken die Methode ein.',
    smirks: '[cH:1].[CX4:2][Cl,Br]>>[c:1][CX4:2]',
    reactantDefaults: ['c1ccccc1', 'CC(C)Cl'],
    substrateSlots: [0, 1],
    functionalGroups: ['aromat', 'halogenalkan_prim', 'halogenalkan_sek', 'halogenalkan_tert'],
    generalEquation: 'Ar–H + R–X →(AlCl₃) Ar–R + HX',
    example: {
      substrate: 'c1ccccc1',
      rxnSmiles: 'c1ccccc1.CC(C)Cl>>CC(C)c1ccccc1',
      caption: 'Benzol und 2-Chlorpropan ergeben Cumol – Zwischenprodukt der Phenolherstellung.',
    },
    reagents: [
      { name: 'Aromat', role: 'Reagenz', equivalents: '3–10 Äq. (Überschuss gegen Mehrfachalkylierung)' },
      { name: 'Halogenalkan oder Alken', role: 'Reagenz', equivalents: '1,0 Äq.' },
      { name: 'Aluminiumchlorid', role: 'Katalysator', equivalents: '0,1–0,3 Äq.' },
    ],
    conditions: {
      temperature: '0–50 °C',
      duration: '1–4 h',
      solvent: 'Aromatenüberschuss',
      atmosphere: 'trocken',
      workup: 'Auf Eis/HCl geben',
      purification: 'Destillation',
    },
    procedure: [
      { title: 'Ansatz', detail: 'Aromat und AlCl₃ vorlegen, gut rühren und kühlen.' },
      {
        title: 'Alkylierungsmittel zutropfen',
        detail: 'Halogenalkan langsam zutropfen; HCl entweicht.',
        caution: 'Bei zu schneller Zugabe kann die Reaktion durchgehen.',
      },
      { title: 'Rühren', detail: '1–3 h bei Raumtemperatur rühren.' },
      { title: 'Aufarbeiten', detail: 'Auf Eis/Salzsäure geben, Phasen trennen, waschen und destillieren.' },
    ],
    mechanism: {
      type: 'SEAr über Carbeniumion',
      summary:
        'Die Lewis-Säure erzeugt ein Carbeniumion oder einen stark polarisierten Komplex, der den Aromaten angreift.',
      steps: [
        {
          title: '1. Bildung des Carbeniumions',
          description:
            'AlCl₃ zieht das Halogenid ab. Primäre Substrate bilden kein freies Carbeniumion, sondern reagieren über den polarisierten Komplex.',
          electronFlow: 'C–Cl-Bindungselektronen → Aluminium.',
          intermediate: 'Carbeniumion bzw. polarisierter Komplex',
          relativeEnergy: 65,
        },
        {
          title: '2. Angriff des Aromaten',
          description: 'Das π-System greift das Elektrophil an; der σ-Komplex entsteht.',
          electronFlow: 'π-Elektronen → Carbeniumzentrum.',
          relativeEnergy: 85,
          rateDetermining: true,
        },
        {
          title: '3. Rearomatisierung',
          rxnSmiles: 'c1ccccc1.CC(C)Cl>>CC(C)c1ccccc1',
          description: 'Protonenabgabe stellt den Aromaten wieder her, HCl entweicht und der Katalysator wird frei.',
          electronFlow: 'C–H-Bindungselektronen → Ring.',
          relativeEnergy: -60,
        },
      ],
      competingPathways:
        'Zwei bekannte Schwächen: (1) Primäre Carbeniumionen lagern zum stabileren sekundären/tertiären um – aus 1-Chlorpropan entsteht überwiegend Cumol statt Propylbenzol. (2) Der Alkylrest aktiviert den Ring, deshalb folgt leicht eine Mehrfachalkylierung.',
    },
    safety: {
      ghs: ['GHS02', 'GHS05', 'GHS08'],
      hazards: ['AlCl₃ ist ätzend und reagiert heftig mit Wasser.', 'Benzol ist krebserzeugend (H350).'],
      precautions: ['Trocken arbeiten.', 'Benzol durch Toluol ersetzen, wo möglich.'],
      ppe: ['Schutzbrille', 'Handschuhe', 'Laborkittel', 'Abzug'],
      waste: 'Aromatenhaltige Abfälle als Sondermüll.',
      level: 'Fortgeschritten',
    },
    typicalYield: '50–85 %',
    scale: ['Laborsynthese', 'Industrie'],
    keywords: ['Alkylierung', 'Umlagerung', 'Cumol', 'Mehrfachsubstitution'],
    references: [{ title: 'Organikum, Kapitel Friedel-Crafts-Reaktionen', source: 'Wiley-VCH' }],
  },
  {
    id: 'nitro-reduktion',
    name: 'Reduktion von Nitroaromaten zu Anilinen',
    aliases: ['Béchamp-Reduktion'],
    category: 'organisch',
    reactionType: 'Reduktion',
    summary:
      'Nitroaromaten lassen sich mit Eisen/Säure, Zinn(II) oder katalytisch mit Wasserstoff zu Anilinen reduzieren – der Einstieg in Farbstoffe und Arzneistoffe.',
    smirks: '[c:1][NX3+:2](=[OX1])[OX1-]>>[c:1][NX3;H2+0:2]',
    reactantDefaults: ['[O-][N+](=O)c1ccccc1'],
    substrateSlots: [0],
    functionalGroups: ['nitro', 'aromat'],
    generalEquation: 'Ar–NO₂ + 3 Fe + 6 H⁺ → Ar–NH₂ + 3 Fe²⁺ + 2 H₂O',
    example: {
      substrate: '[O-][N+](=O)c1ccccc1',
      rxnSmiles: '[O-][N+](=O)c1ccccc1>>Nc1ccccc1',
      caption: 'Nitrobenzol wird zu Anilin reduziert.',
    },
    reagents: [
      { name: 'Nitroaromat', role: 'Reagenz', equivalents: '1,0 Äq.' },
      { name: 'Eisenpulver', formula: 'Fe', role: 'Reduktionsmittel', equivalents: '3–5 Äq.' },
      { name: 'Salzsäure oder Essigsäure', role: 'Säure', equivalents: 'katalytisch bis stöchiometrisch' },
      { name: 'Alternative: H₂ / Pd-C', role: 'Reduktionsmittel', note: 'sauberer, aber apparativ aufwendiger' },
    ],
    conditions: {
      temperature: '70–100 °C',
      duration: '2–6 h',
      solvent: 'Ethanol/Wasser',
      apparatus: 'Rundkolben mit Rückflusskühler und kräftigem Rührer',
      workup: 'Alkalisch stellen und mit Wasserdampf destillieren',
      purification: 'Destillation',
    },
    procedure: [
      { title: 'Ansatz', detail: 'Eisenpulver in Ethanol/Wasser mit etwas Salzsäure aktivieren.' },
      {
        title: 'Nitroverbindung zugeben',
        detail: 'Nitroaromat zutropfen und unter Rückfluss kräftig rühren – die Suspension muss in Bewegung bleiben.',
        caution: 'Stark exotherm; Wasserstoffentwicklung möglich.',
      },
      { title: 'Reaktion verfolgen', detail: 'Bis zum vollständigen Umsatz kochen (DC).' },
      {
        title: 'Aufarbeiten',
        detail: 'Mit Natronlauge alkalisch stellen, Eisenoxide abfiltrieren und das Anilin mit Wasserdampf überdestillieren.',
      },
    ],
    mechanism: {
      type: 'Stufenweise Sechs-Elektronen-Reduktion',
      summary:
        'Die Nitrogruppe wird über Nitroso- und Hydroxylaminstufe zum Amin reduziert. Insgesamt werden sechs Elektronen und sechs Protonen übertragen.',
      steps: [
        {
          title: '1. Nitro → Nitroso (2 e⁻)',
          rxnSmiles: '[O-][N+](=O)c1ccccc1>>O=Nc1ccccc1',
          description: 'Aufnahme von zwei Elektronen und zwei Protonen, Abspaltung von Wasser.',
          electronFlow: 'Elektronen vom Eisen → Stickstoff; N–O-Bindung bricht.',
          relativeEnergy: -40,
        },
        {
          title: '2. Nitroso → Hydroxylamin (2 e⁻)',
          rxnSmiles: 'O=Nc1ccccc1>>ONc1ccccc1',
          description: 'Weitere zwei Elektronen liefern das N-Arylhydroxylamin.',
          electronFlow: 'Elektronen → N=O-π*-Orbital.',
          relativeEnergy: -45,
        },
        {
          title: '3. Hydroxylamin → Amin (2 e⁻)',
          rxnSmiles: 'ONc1ccccc1>>Nc1ccccc1',
          description: 'Die letzte N–O-Bindung wird gespalten; das Anilin entsteht.',
          electronFlow: 'Elektronen → N–O-σ*-Orbital; Wasser wird abgespalten.',
          relativeEnergy: -50,
          rateDetermining: true,
        },
      ],
      competingPathways:
        'Im alkalischen Milieu kondensieren die Zwischenstufen zu Azoxy-, Azo- und Hydrazoverbindungen – das ist die Grundlage der Azobenzolsynthese.',
    },
    safety: {
      ghs: ['GHS06', 'GHS08', 'GHS09'],
      hazards: [
        'Nitrobenzol ist giftig, reproduktionstoxisch und hautgängig (H301, H311, H360F).',
        'Anilin ist giftig und krebsverdächtig (H301+H311+H331, H341).',
      ],
      precautions: [
        'Hautkontakt unbedingt vermeiden – beide Stoffe werden über die Haut aufgenommen.',
        'Im Abzug arbeiten.',
      ],
      ppe: ['Schutzbrille', 'doppelte Handschuhe (Butyl/Nitril)', 'Laborkittel', 'Abzug'],
      waste: 'Aminhaltige Abfälle als Sondermüll; Eisenschlamm gesondert.',
      level: 'Nur Fachlabor',
    },
    typicalYield: '80–95 %',
    scale: ['Laborsynthese', 'Industrie'],
    keywords: ['Anilin', 'Reduktion', 'Béchamp', 'Farbstoffvorstufe'],
    references: [{ title: 'Organikum, Kapitel Aromatische Amine', source: 'Wiley-VCH' }],
  },
  {
    id: 'diazotierung',
    name: 'Diazotierung aromatischer Amine',
    category: 'organisch',
    reactionType: 'Substitution am Stickstoff',
    summary:
      'Salpetrige Säure überführt Aniline bei 0–5 °C in Diazoniumsalze. Diese sind vielseitige Zwischenstufen – aber thermisch labil und dürfen nicht isoliert werden.',
    smirks: '[c:1][NX3;H2:2]>>[c:1][N+:2]#[N]',
    reactantDefaults: ['Nc1ccccc1'],
    substrateSlots: [0],
    functionalGroups: ['anilin', 'amin_prim'],
    generalEquation: 'Ar–NH₂ + NaNO₂ + 2 HCl → Ar–N₂⁺Cl⁻ + NaCl + 2 H₂O',
    example: {
      substrate: 'Nc1ccccc1',
      rxnSmiles: 'Nc1ccccc1>>[N+](#N)c1ccccc1',
      caption: 'Anilin wird zum Benzoldiazoniumion diazotiert.',
    },
    reagents: [
      { name: 'aromatisches Amin', role: 'Reagenz', equivalents: '1,0 Äq.' },
      { name: 'Natriumnitrit', formula: 'NaNO2', role: 'Reagenz', equivalents: '1,05 Äq.' },
      { name: 'Salzsäure (2 M)', role: 'Säure', equivalents: '2,5 Äq.' },
      { name: 'Eis', role: 'Reagenz', note: 'Temperaturkontrolle ist der wichtigste Faktor' },
    ],
    conditions: {
      temperature: '0–5 °C – keinesfalls höher',
      duration: '30 min',
      solvent: 'Wasser',
      apparatus: 'Becherglas im Eis/Kochsalz-Bad mit Thermometer',
      workup: 'Lösung sofort weiterverwenden',
      monitoring: 'Iod-Stärke-Papier zeigt überschüssige salpetrige Säure an',
    },
    procedure: [
      { title: 'Amin lösen', detail: 'Anilin in verdünnter Salzsäure lösen und im Eisbad auf 0–5 °C kühlen.' },
      {
        title: 'Nitrit zutropfen',
        detail: 'Kalte Natriumnitritlösung langsam zutropfen und dabei die Temperatur laufend kontrollieren.',
        caution: 'Oberhalb von 5 °C zersetzt sich das Diazoniumsalz unter Stickstoffentwicklung zum Phenol.',
      },
      {
        title: 'Endpunkt prüfen',
        detail: 'Ein Tropfen auf Iod-Stärke-Papier muss sich blau färben – dann ist genügend Nitrit vorhanden.',
      },
      {
        title: 'Sofort weiterverwenden',
        detail: 'Die eiskalte Lösung direkt für Azokupplung oder Sandmeyer-Reaktion einsetzen.',
        caution: 'Trockene Diazoniumsalze sind explosionsgefährlich – niemals isolieren.',
      },
    ],
    mechanism: {
      type: 'Nitrosierung mit anschließender Dehydratisierung',
      summary:
        'Aus Nitrit und Säure entsteht das Nitrosylkation. Nach Angriff des Amins und mehreren Protonenwanderungen wird Wasser abgespalten; das Diazoniumion ist mesomeriestabilisiert.',
      steps: [
        {
          title: '1. Bildung des Nitrosylkations',
          description: 'Salpetrige Säure wird protoniert und spaltet Wasser ab; es entsteht NO⁺.',
          electronFlow: 'Elektronenpaar des Hydroxysauerstoffs → Proton; N–O-Bindung bricht.',
          relativeEnergy: 20,
        },
        {
          title: '2. N-Nitrosierung',
          description: 'Das Aminstickstoffatom greift NO⁺ an; es entsteht das N-Nitrosamin.',
          electronFlow: 'Elektronenpaar des Stickstoffs → Nitrosylstickstoff.',
          relativeEnergy: 35,
          rateDetermining: true,
        },
        {
          title: '3. Tautomerisierung und Wasserabspaltung',
          rxnSmiles: 'Nc1ccccc1>>[N+](#N)c1ccccc1',
          description:
            'Nach Protonenwanderung zum Diazohydroxid wird Wasser abgespalten. Das Diazoniumion ist durch den Aromaten stabilisiert.',
          electronFlow: 'Freies Elektronenpaar → N–N-Bindung; N–OH₂-Bindung bricht.',
          relativeEnergy: -30,
        },
      ],
      competingPathways:
        'Aliphatische Diazoniumsalze zerfallen sofort zu Carbeniumionen und Stickstoff – nur aromatische sind bei 0 °C handhabbar.',
    },
    safety: {
      ghs: ['GHS03', 'GHS06', 'GHS08'],
      hazards: [
        'Trockene Diazoniumsalze sind explosionsfähig.',
        'Natriumnitrit ist giftig (H301) und brandfördernd (H272).',
        'Nitrosamine sind krebserzeugend.',
      ],
      precautions: [
        'Immer in Lösung und bei 0–5 °C halten.',
        'Überschüssiges Nitrit mit Amidosulfonsäure oder Harnstoff zerstören.',
      ],
      ppe: ['Schutzbrille', 'Handschuhe', 'Laborkittel', 'Abzug'],
      waste: 'Diazoniumlösungen vor der Entsorgung zersetzen (erwärmen oder mit Reduktionsmittel).',
      level: 'Nur Fachlabor',
    },
    typicalYield: '85–98 % (in Lösung)',
    scale: ['Laborsynthese', 'Industrie'],
    keywords: ['Diazonium', 'Nitrosierung', 'Farbstoffchemie', 'Temperaturkontrolle'],
    references: [{ title: 'Griess, Ann. Chem. Pharm. 1858, 106, 123', source: 'Originalarbeit' }],
  },
  {
    id: 'azokupplung',
    name: 'Azokupplung',
    category: 'organisch',
    reactionType: 'Elektrophile aromatische Substitution',
    summary:
      'Das Diazoniumion kuppelt als schwaches Elektrophil mit elektronenreichen Aromaten (Phenolen, Anilinen) zum Azofarbstoff. Die ausgedehnte Konjugation erzeugt die kräftigen Farben.',
    smirks: '[c:1][N+:2]#[N:3].[cH:4]>>[c:1][N:2]=[N:3][c:4]',
    reactantDefaults: ['[N+](#N)c1ccccc1', 'Oc1ccccc1'],
    substrateSlots: [0, 1],
    functionalGroups: ['diazonium', 'phenol', 'anilin'],
    generalEquation: 'Ar–N₂⁺ + Ar′–H → Ar–N=N–Ar′ + H⁺',
    example: {
      substrate: 'Oc1ccccc1',
      rxnSmiles: '[N+](#N)c1ccccc1.Oc1ccccc1>>Oc1ccc(N=Nc2ccccc2)cc1',
      caption: 'Benzoldiazonium kuppelt mit Phenol in para-Stellung zu 4-Hydroxyazobenzol.',
    },
    reagents: [
      { name: 'Diazoniumsalzlösung', role: 'Reagenz', equivalents: '1,0 Äq.' },
      { name: 'Kupplungskomponente (Phenol, Naphthol, Anilin)', role: 'Reagenz', equivalents: '1,0 Äq.' },
      {
        name: 'Natriumhydroxid oder Natriumacetat',
        role: 'Base',
        note: 'Phenole kuppeln bei pH 8–10, Amine bei pH 4–6',
      },
    ],
    conditions: {
      temperature: '0–5 °C',
      duration: '15–60 min',
      solvent: 'Wasser',
      workup: 'Farbstoff fällt aus und wird abgesaugt',
      purification: 'Umkristallisieren oder Aussalzen',
      monitoring: 'Die Farbe entsteht sofort sichtbar',
    },
    procedure: [
      {
        title: 'Kupplungskomponente vorbereiten',
        detail: 'Phenol in verdünnter Natronlauge lösen (Phenolat ist deutlich reaktiver) und im Eisbad kühlen.',
      },
      {
        title: 'Diazoniumlösung zugeben',
        detail: 'Die kalte Diazoniumlösung langsam zutropfen; der Farbstoff bildet sich sofort.',
        tip: 'Den pH-Wert kontrollieren: zu sauer verhindert die Phenolatbildung, zu basisch zerstört das Diazoniumion.',
      },
      { title: 'Ausfällen', detail: '30 min nachrühren, dann mit Kochsalz aussalzen.' },
      { title: 'Isolieren', detail: 'Absaugen, mit kaltem Wasser waschen und trocknen.' },
    ],
    mechanism: {
      type: 'SEAr mit schwachem Elektrophil',
      summary:
        'Das Diazoniumion ist nur ein mäßiges Elektrophil und reagiert deshalb ausschließlich mit stark aktivierten Aromaten – bevorzugt in para-Stellung.',
      steps: [
        {
          title: '1. Aktivierung der Kupplungskomponente',
          rxnSmiles: 'Oc1ccccc1>>[O-]c1ccccc1',
          description: 'Im alkalischen Milieu entsteht das Phenolat, dessen negative Ladung den Ring stark aktiviert.',
          electronFlow: 'Elektronenpaar der Base → Phenol-Proton.',
          relativeEnergy: -15,
        },
        {
          title: '2. Angriff auf das Diazoniumion',
          description:
            'Das elektronenreiche C-Atom in para-Stellung greift das terminale Stickstoffatom an; der σ-Komplex entsteht.',
          electronFlow: 'π-Elektronen → terminaler Stickstoff des Diazoniumions.',
          intermediate: 'σ-Komplex',
          relativeEnergy: 60,
          rateDetermining: true,
        },
        {
          title: '3. Rearomatisierung',
          rxnSmiles: '[N+](#N)c1ccccc1.Oc1ccccc1>>Oc1ccc(N=Nc2ccccc2)cc1',
          description:
            'Protonenabgabe stellt die Aromatizität wieder her. Das durchgehend konjugierte Azosystem absorbiert sichtbares Licht – daher die intensive Farbe.',
          electronFlow: 'C–H-Bindungselektronen → Ring.',
          relativeEnergy: -65,
        },
      ],
      competingPathways:
        'Ist die para-Position besetzt, erfolgt die Kupplung ortho. Bei zu niedrigem pH bleibt das Amin protoniert und desaktiviert.',
    },
    safety: {
      ghs: ['GHS07', 'GHS08', 'GHS09'],
      hazards: [
        'Viele Azofarbstoffe und Aminvorstufen sind krebsverdächtig (Benzidinfarbstoffe sind verboten).',
        'Diazoniumlösungen sind thermisch labil.',
      ],
      precautions: ['Kalt arbeiten.', 'Hautkontakt mit Farbstofflösungen vermeiden – sie färben stark.'],
      ppe: ['Schutzbrille', 'Handschuhe', 'Laborkittel', 'Abzug'],
      waste: 'Farbstoffhaltige Lösungen als organischen Sondermüll sammeln.',
      level: 'Laborpraktikum',
    },
    typicalYield: '70–95 %',
    scale: ['Schulversuch', 'Laborsynthese', 'Industrie'],
    keywords: ['Azofarbstoff', 'Kupplung', 'Chromophor', 'Indikator'],
    references: [{ title: 'Zollinger, Color Chemistry, Wiley-VCH', source: 'Monographie' }],
  },
  {
    id: 'sandmeyer-reaktion',
    name: 'Sandmeyer-Reaktion',
    category: 'organisch',
    reactionType: 'Radikalische Substitution (kupferkatalysiert)',
    summary:
      'Kupfer(I)-Salze ersetzen die Diazoniumgruppe durch Chlorid, Bromid oder Cyanid. Damit lassen sich Substituenten einführen, die über direkte Substitution nicht zugänglich sind.',
    smirks: '[c:1][N+:2]#[N:3]>>[c:1]Br',
    reactantDefaults: ['[N+](#N)c1ccccc1'],
    substrateSlots: [0],
    functionalGroups: ['diazonium'],
    generalEquation: 'Ar–N₂⁺ + CuX → Ar–X + N₂↑ + Cu²⁺',
    example: {
      substrate: '[N+](#N)c1ccccc1',
      rxnSmiles: '[N+](#N)c1ccccc1>>Brc1ccccc1',
      caption: 'Benzoldiazonium wird zu Brombenzol umgesetzt.',
    },
    reagents: [
      { name: 'Diazoniumsalzlösung', role: 'Reagenz', equivalents: '1,0 Äq.' },
      { name: 'Kupfer(I)-bromid', formula: 'CuBr', role: 'Katalysator', equivalents: '1,0 Äq.' },
      { name: 'Bromwasserstoffsäure', role: 'Säure', note: 'liefert das Halogenid im Überschuss' },
    ],
    conditions: {
      temperature: '0 °C → 60 °C',
      duration: '1–2 h',
      solvent: 'Wasser',
      apparatus: 'Kolben mit Rückflusskühler und Gasableitung (Stickstoff entweicht)',
      workup: 'Wasserdampfdestillation oder Extraktion',
      purification: 'Destillation',
    },
    procedure: [
      { title: 'Kupfersalz vorbereiten', detail: 'CuBr in konzentrierter Bromwasserstoffsäure lösen.' },
      {
        title: 'Diazoniumlösung zugeben',
        detail: 'Die eiskalte Diazoniumlösung langsam zur Kupferlösung geben.',
        caution: 'Kräftige Stickstoffentwicklung – Gefäß nicht verschließen, langsam zugeben.',
      },
      { title: 'Erwärmen', detail: 'Auf 50–60 °C erwärmen, bis keine Gasentwicklung mehr erfolgt.' },
      { title: 'Aufarbeiten', detail: 'Produkt mit Wasserdampf überdestillieren, Phasen trennen, trocknen und destillieren.' },
    ],
    mechanism: {
      type: 'Einelektronenübertragung (Radikalmechanismus)',
      summary:
        'Kupfer(I) überträgt ein Elektron auf das Diazoniumion. Stickstoff entweicht und hinterlässt ein Arylradikal, das vom Kupfer(II)-Halogenid abgefangen wird.',
      steps: [
        {
          title: '1. Einelektronenübertragung',
          description: 'Cu(I) gibt ein Elektron ab; das Diazoniumion wird zum instabilen Diazenylradikal.',
          electronFlow: 'Elektron vom Kupfer → π*-Orbital des Diazoniumions.',
          relativeEnergy: 30,
          rateDetermining: true,
        },
        {
          title: '2. Abspaltung von Stickstoff',
          description:
            'Molekularer Stickstoff entweicht – eine sehr starke Triebkraft. Zurück bleibt ein Arylradikal.',
          electronFlow: 'C–N-Bindung bricht homolytisch.',
          intermediate: 'Arylradikal',
          relativeEnergy: 10,
        },
        {
          title: '3. Übertragung des Halogens',
          rxnSmiles: '[N+](#N)c1ccccc1>>Brc1ccccc1',
          description: 'Das Arylradikal holt sich ein Halogenatom vom Cu(II)X₂; Kupfer(I) wird regeneriert.',
          electronFlow: 'Radikal → Cu–X-Bindung; Kupfer wird reduziert.',
          relativeEnergy: -85,
        },
      ],
      competingPathways:
        'Mit Wasser statt Kupfersalz entsteht das Phenol (Verkochung), mit hypophosphoriger Säure wird die Diazoniumgruppe vollständig durch Wasserstoff ersetzt. Iodide reagieren auch ohne Kupfer.',
    },
    safety: {
      ghs: ['GHS05', 'GHS07', 'GHS09'],
      hazards: [
        'Starke Stickstoffentwicklung – Druckaufbau möglich.',
        'Kupfersalze sind umweltgefährlich (H410).',
        'Bei der Cyanid-Variante entsteht bei Ansäuern Blausäure.',
      ],
      precautions: ['Apparatur offen halten.', 'Langsam zugeben.', 'Cyanidvariante nur im Fachlabor.'],
      ppe: ['Schutzbrille', 'Handschuhe', 'Laborkittel', 'Abzug'],
      waste: 'Kupferhaltige Lösungen als Schwermetallabfall sammeln.',
      level: 'Nur Fachlabor',
    },
    typicalYield: '60–85 %',
    scale: ['Laborsynthese', 'Industrie'],
    keywords: ['Sandmeyer', 'Arylradikal', 'Kupfer', 'Halogenaromat'],
    references: [
      { title: 'Sandmeyer, Ber. Dtsch. Chem. Ges. 1884, 17, 1633', source: 'Originalarbeit' },
    ],
  },
  {
    id: 'suzuki-kupplung',
    name: 'Suzuki-Miyaura-Kupplung',
    category: 'organisch',
    reactionType: 'Palladiumkatalysierte Kreuzkupplung',
    summary:
      'Arylhalogenid und Boronsäure werden palladiumkatalysiert zu einem Biaryl verknüpft. Milde Bedingungen, ungiftige Borreste und hohe Toleranz gegenüber funktionellen Gruppen machen sie zur meistgenutzten Kupplung der Wirkstoffsynthese.',
    smirks: '[c:1][Cl,Br,I].[#6:2][BX3]([OX2H1])[OX2H1]>>[c:1][#6:2]',
    reactantDefaults: ['Brc1ccccc1', 'OB(O)c1ccccc1'],
    substrateSlots: [0, 1],
    functionalGroups: ['arylhalogenid', 'boronsaeure'],
    generalEquation: 'Ar–X + Ar′–B(OH)₂ + Base →(Pd⁰) Ar–Ar′ + X–B(OH)₂',
    example: {
      substrate: 'Brc1ccccc1',
      rxnSmiles: 'Brc1ccccc1.OB(O)c1ccccc1>>c1ccc(-c2ccccc2)cc1',
      caption: 'Brombenzol und Phenylboronsäure ergeben Biphenyl.',
    },
    reagents: [
      { name: 'Arylhalogenid', role: 'Reagenz', equivalents: '1,0 Äq.' },
      { name: 'Boronsäure', role: 'Reagenz', equivalents: '1,2–1,5 Äq.' },
      { name: 'Pd(PPh₃)₄ oder Pd(dppf)Cl₂', role: 'Katalysator', equivalents: '0,01–0,05 Äq.' },
      { name: 'Kaliumcarbonat', formula: 'K2CO3', role: 'Base', equivalents: '2–3 Äq.', note: 'aktiviert die Boronsäure zum Boronat' },
    ],
    conditions: {
      temperature: '60–100 °C',
      duration: '2–24 h',
      solvent: 'Toluol/Ethanol/Wasser, Dioxan/Wasser oder DMF',
      atmosphere: 'Argon – Sauerstoff zerstört den Pd(0)-Katalysator',
      apparatus: 'Schlenkkolben oder Mikrowellenreaktor',
      workup: 'Extraktion, Palladium über Kieselgel abtrennen',
      purification: 'Säulenchromatographie oder Umkristallisieren',
      monitoring: 'DC oder LC-MS',
    },
    procedure: [
      {
        title: 'Entgasen',
        detail: 'Lösungsmittel durch Durchleiten von Argon oder drei Einfrier-Auftau-Zyklen entgasen.',
        tip: 'Sorgfältiges Entgasen ist der häufigste Grund für Erfolg oder Misserfolg.',
      },
      { title: 'Ansatz', detail: 'Arylhalogenid, Boronsäure, Base und Katalysator unter Argon vereinigen.' },
      { title: 'Erhitzen', detail: 'Auf 80 °C erhitzen und den Umsatz per DC oder LC-MS verfolgen.' },
      {
        title: 'Aufarbeiten',
        detail: 'Abkühlen, mit Wasser verdünnen, extrahieren, über Kieselgel filtrieren und chromatographisch reinigen.',
      },
    ],
    mechanism: {
      type: 'Pd(0)/Pd(II)-Katalysecyclus',
      summary:
        'Oxidative Addition, Transmetallierung und reduktive Eliminierung bilden den Kreislauf. Die Base ist unverzichtbar: sie erzeugt aus der Boronsäure das reaktive Boronat.',
      steps: [
        {
          title: '1. Oxidative Addition',
          description:
            'Pd(0) schiebt sich in die C–X-Bindung; das Palladium wird dabei zu Pd(II) oxidiert. Iodide reagieren schneller als Bromide, Chloride benötigen elektronenreiche Liganden.',
          electronFlow: 'Elektronenpaar des Palladiums → σ*-Orbital der C–X-Bindung.',
          intermediate: 'Ar–Pd(II)–X',
          relativeEnergy: 40,
          rateDetermining: true,
        },
        {
          title: '2. Transmetallierung',
          description:
            'Die Base bildet aus der Boronsäure ein Boronat mit erhöhter Nucleophilie. Der Arylrest wandert vom Bor zum Palladium.',
          electronFlow: 'C–B-Bindungselektronen → Palladium; Halogenid tritt aus.',
          intermediate: 'Ar–Pd(II)–Ar′',
          relativeEnergy: 25,
        },
        {
          title: '3. Reduktive Eliminierung',
          rxnSmiles: 'Brc1ccccc1.OB(O)c1ccccc1>>c1ccc(-c2ccccc2)cc1',
          description:
            'Beide Arylreste werden unter Bildung der neuen C–C-Bindung freigesetzt; Pd(0) steht wieder für den nächsten Durchlauf bereit.',
          electronFlow: 'Pd–C-Bindungselektronen → neue C–C-Bindung; Palladium wird reduziert.',
          relativeEnergy: -70,
        },
      ],
      competingPathways:
        'Homokupplung der Boronsäure und Protodeborierung sind die häufigsten Nebenreaktionen – beide nehmen bei Sauerstoffzutritt stark zu.',
    },
    safety: {
      ghs: ['GHS07', 'GHS08'],
      hazards: [
        'Palladiumkomplexe sind sensibilisierend.',
        'Dioxan ist krebsverdächtig (H351), DMF reproduktionstoxisch (H360D).',
      ],
      precautions: ['Unter Argon arbeiten.', 'Lösungsmittelwahl kritisch prüfen (2-MeTHF als Alternative).'],
      ppe: ['Schutzbrille', 'Handschuhe', 'Laborkittel', 'Abzug'],
      waste: 'Palladiumhaltige Rückstände als Edelmetallabfall sammeln – Rückgewinnung lohnt sich.',
      level: 'Fortgeschritten',
    },
    typicalYield: '70–98 %',
    scale: ['Laborsynthese', 'Wirkstoffentwicklung', 'Industrie'],
    keywords: ['Suzuki', 'Kreuzkupplung', 'Palladium', 'Biaryl', 'Nobelpreis 2010'],
    references: [
      { title: 'Miyaura, Suzuki, Chem. Rev. 1995, 95, 2457', source: 'Übersichtsartikel' },
    ],
  },
  {
    id: 'heck-reaktion',
    name: 'Mizoroki-Heck-Reaktion',
    category: 'organisch',
    reactionType: 'Palladiumkatalysierte Kreuzkupplung',
    summary:
      'Ein Arylhalogenid wird mit einem Alken zu einem substituierten Alken verknüpft. Die Reaktion liefert überwiegend das E-Produkt und benötigt kein metallorganisches Reagenz.',
    smirks: '[c:1][Br,I].[CX3;H2:2]=[CX3:3]>>[c:1][CX3:2]=[CX3:3]',
    reactantDefaults: ['Brc1ccccc1', 'C=CC(=O)OC'],
    substrateSlots: [0, 1],
    functionalGroups: ['arylhalogenid', 'alken'],
    generalEquation: 'Ar–X + CH₂=CH–R + Base →(Pd) Ar–CH=CH–R + Base·HX',
    example: {
      substrate: 'Brc1ccccc1',
      rxnSmiles: 'Brc1ccccc1.C=CC(=O)OC>>COC(=O)/C=C/c1ccccc1',
      caption: 'Brombenzol und Acrylsäuremethylester ergeben Zimtsäuremethylester.',
    },
    reagents: [
      { name: 'Arylhalogenid', role: 'Reagenz', equivalents: '1,0 Äq.' },
      { name: 'Alken (elektronenarm bevorzugt)', role: 'Reagenz', equivalents: '1,5 Äq.' },
      { name: 'Palladium(II)-acetat', role: 'Katalysator', equivalents: '0,02 Äq.' },
      { name: 'Triethylamin oder K₂CO₃', role: 'Base', equivalents: '2 Äq.' },
      { name: 'Triphenylphosphin', role: 'Katalysator', equivalents: '0,04 Äq.', note: 'Ligand' },
    ],
    conditions: {
      temperature: '80–140 °C',
      duration: '4–24 h',
      solvent: 'DMF, Acetonitril oder Toluol',
      atmosphere: 'Argon',
      workup: 'Extraktion',
      purification: 'Chromatographie',
    },
    procedure: [
      { title: 'Ansatz', detail: 'Alle Komponenten unter Argon im entgasten Lösungsmittel vereinigen.' },
      { title: 'Erhitzen', detail: 'Auf 100–120 °C erhitzen; Palladiumschwarz zeigt Katalysatorzerfall an.' },
      { title: 'Verfolgen', detail: 'Umsatz per DC prüfen; bei Bedarf Katalysator nachlegen.' },
      { title: 'Aufarbeiten', detail: 'Abkühlen, mit Wasser verdünnen, extrahieren und chromatographieren.' },
    ],
    mechanism: {
      type: 'Pd(0)/Pd(II)-Cyclus mit syn-Insertion und β-Hydrid-Eliminierung',
      summary:
        'Nach oxidativer Addition koordiniert das Alken und insertiert syn in die Pd–Aryl-Bindung. Die anschließende β-Hydrid-Eliminierung erzeugt die neue Doppelbindung.',
      steps: [
        {
          title: '1. Oxidative Addition',
          description: 'Pd(0) insertiert in die Aryl–Halogen-Bindung.',
          electronFlow: 'Palladium-Elektronenpaar → C–X-σ*-Orbital.',
          relativeEnergy: 40,
          rateDetermining: true,
        },
        {
          title: '2. Koordination und syn-Insertion',
          description:
            'Das Alken koordiniert an das Palladium und schiebt sich in die Pd–C-Bindung. Aryl und Palladium treten dabei von derselben Seite ein.',
          electronFlow: 'π-Elektronen → Palladium; Pd–Aryl-Bindung → Alkenkohlenstoff.',
          intermediate: 'σ-Alkylpalladium-Komplex',
          relativeEnergy: 30,
        },
        {
          title: '3. β-Hydrid-Eliminierung',
          rxnSmiles: 'Brc1ccccc1.C=CC(=O)OC>>COC(=O)/C=C/c1ccccc1',
          description:
            'Ein Wasserstoffatom am benachbarten Kohlenstoff wandert zum Palladium; die Doppelbindung entsteht. Nach Rotation liegt bevorzugt das E-Produkt vor.',
          electronFlow: 'C–H-Bindungselektronen → Palladium; C–C-Doppelbindung entsteht.',
          relativeEnergy: -35,
        },
        {
          title: '4. Reduktive Eliminierung von HX',
          description: 'Die Base entfernt HX vom Palladium und regeneriert Pd(0).',
          electronFlow: 'Base → Pd–H-Proton.',
          relativeEnergy: -45,
        },
      ],
      stereochemistry:
        'Die syn-Insertion und die notwendige syn-Anordnung bei der β-Hydrid-Eliminierung führen zusammen überwiegend zum E-Alken.',
    },
    safety: {
      ghs: ['GHS07', 'GHS08'],
      hazards: ['DMF ist reproduktionstoxisch (H360D).', 'Acrylate sind sensibilisierend.'],
      precautions: ['Unter Schutzgas und im Abzug arbeiten.'],
      ppe: ['Schutzbrille', 'Handschuhe', 'Laborkittel', 'Abzug'],
      waste: 'Palladiumhaltige Rückstände getrennt sammeln.',
      level: 'Fortgeschritten',
    },
    typicalYield: '60–95 %',
    scale: ['Laborsynthese', 'Industrie'],
    keywords: ['Heck', 'Alken', 'Palladium', 'β-Hydrid-Eliminierung', 'Nobelpreis 2010'],
    references: [{ title: 'Heck, Nolley, J. Org. Chem. 1972, 37, 2320', source: 'Originalarbeit' }],
  },
];
