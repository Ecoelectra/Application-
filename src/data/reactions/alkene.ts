/** Additionen an C=C-Doppelbindungen, Cycloadditionen und Oxidationen von Alkenen. */
import type { ReactionRule } from '../types';

export const ALKENE_REACTIONS: ReactionRule[] = [
  {
    id: 'katalytische-hydrierung',
    name: 'Katalytische Hydrierung',
    category: 'organisch',
    reactionType: 'Addition (Reduktion)',
    summary:
      'Wasserstoff addiert an der Oberfläche eines Übergangsmetallkatalysators syn an die Doppelbindung. Technisch die wichtigste Methode zur Fetthärtung.',
    smirks: '[CX3:1]=[CX3:2]>>[CX4:1][CX4:2]',
    reactantDefaults: ['CC=CC'],
    substrateSlots: [0],
    functionalGroups: ['alken', 'alkin'],
    generalEquation: 'R–CH=CH–R′ + H₂ →(Pd/C) R–CH₂–CH₂–R′',
    example: {
      substrate: 'CC=CC',
      rxnSmiles: 'CC=CC>>CCCC',
      caption: 'But-2-en wird zu Butan hydriert.',
    },
    reagents: [
      { name: 'Alken', role: 'Reagenz', equivalents: '1,0 Äq.' },
      { name: 'Wasserstoff', formula: 'H2', role: 'Reagenz', equivalents: '1–3 bar' },
      { name: 'Palladium auf Aktivkohle (10 %)', role: 'Katalysator', equivalents: '5–10 Gew.-%' },
      { name: 'Ethanol oder Ethylacetat', role: 'Lösungsmittel' },
    ],
    conditions: {
      temperature: 'Raumtemperatur bis 60 °C',
      duration: '1–12 h',
      pressure: '1 bar (Ballon) bis 50 bar (Autoklav)',
      solvent: 'Ethanol, Methanol oder Ethylacetat',
      atmosphere: 'Wasserstoff',
      apparatus: 'Hydrierapparatur oder Autoklav',
      workup: 'Katalysator über Celite abfiltrieren',
      purification: 'Einengen, meist ohne weitere Reinigung',
    },
    procedure: [
      {
        title: 'Katalysator vorlegen',
        detail: 'Pd/C unter Stickstoff in den Kolben geben und mit Lösungsmittel benetzen.',
        caution: 'Trockener Pd/C kann Lösungsmitteldämpfe entzünden – immer zuerst benetzen.',
      },
      { title: 'Substrat zugeben', detail: 'Alken in Lösung zugeben und die Apparatur dreimal mit Wasserstoff spülen.' },
      { title: 'Hydrieren', detail: 'Unter Wasserstoffatmosphäre kräftig rühren; der Verbrauch lässt sich am Ballon oder Manometer ablesen.' },
      {
        title: 'Aufarbeiten',
        detail: 'Mit Stickstoff spülen, Katalysator über Celite abfiltrieren (nicht trockenlaufen lassen) und einengen.',
      },
    ],
    mechanism: {
      type: 'Heterogene Katalyse (Horiuti-Polanyi)',
      summary:
        'Wasserstoff wird an der Metalloberfläche dissoziativ adsorbiert. Das Alken koordiniert daneben, dann werden nacheinander zwei H-Atome übertragen.',
      steps: [
        {
          title: '1. Dissoziative Adsorption des Wasserstoffs',
          description: 'H₂ bindet an die Metalloberfläche, die H–H-Bindung wird gespalten; es entstehen Metallhydride.',
          electronFlow: 'σ-Bindungselektronen des H₂ → Metall-d-Orbitale.',
          relativeEnergy: -20,
        },
        {
          title: '2. Koordination des Alkens',
          description: 'Die π-Elektronen der Doppelbindung koordinieren an das Metall.',
          electronFlow: 'π-Elektronen → leeres Metallorbital; Rückbindung in das π*-Orbital.',
          relativeEnergy: -30,
        },
        {
          title: '3. Schrittweise Hydridübertragung',
          rxnSmiles: 'CC=CC>>CCCC',
          description:
            'Beide Wasserstoffatome werden von derselben Seite übertragen. Deshalb verläuft die Addition syn.',
          electronFlow: 'Metall–H-Bindungselektronen → Kohlenstoffatome.',
          relativeEnergy: 25,
          rateDetermining: true,
        },
      ],
      stereochemistry: 'Syn-Addition: beide H-Atome treten von der Katalysatorseite her ein.',
      competingPathways:
        'Mit Lindlar-Katalysator lässt sich ein Alkin selektiv zum cis-Alken hydrieren; Benzolringe werden unter milden Bedingungen nicht angegriffen.',
      productEnergy: -120,
    },
    safety: {
      ghs: ['GHS02'],
      hazards: ['Wasserstoff ist hochentzündlich und bildet mit Luft Knallgas (H220).', 'Pd/C kann sich selbst entzünden.'],
      precautions: ['Keine Zündquellen.', 'Apparatur vor und nach der Reaktion mit Inertgas spülen.'],
      ppe: ['Schutzbrille', 'Handschuhe', 'Laborkittel', 'Abzug'],
      waste: 'Katalysatorreste feucht halten und als edelmetallhaltigen Abfall sammeln.',
      level: 'Fortgeschritten',
    },
    typicalYield: '90–100 %',
    scale: ['Laborsynthese', 'Industrie'],
    keywords: ['Hydrierung', 'Palladium', 'syn-Addition', 'Fetthärtung'],
    references: [{ title: 'Horiuti, Polanyi, Trans. Faraday Soc. 1934, 30, 1164', source: 'Originalarbeit' }],
    thermodynamics: { deltaH: -120, note: 'Hydrierwärme etwa −120 kJ/mol je Doppelbindung.' },
  },
  {
    id: 'bromaddition-alken',
    name: 'Bromaddition an Alkene',
    aliases: ['Bromwasserprobe'],
    category: 'organisch',
    reactionType: 'Elektrophile Addition',
    summary:
      'Brom addiert über ein cyclisches Bromoniumion anti an die Doppelbindung. Die Entfärbung von Bromwasser ist der klassische Nachweis für Alkene.',
    smirks: '[CX3:1]=[CX3:2]>>[CX4:1](Br)[CX4:2]Br',
    reactantDefaults: ['CC=CC'],
    substrateSlots: [0],
    functionalGroups: ['alken'],
    generalEquation: 'R–CH=CH–R′ + Br₂ → R–CHBr–CHBr–R′',
    example: {
      substrate: 'C1=CCCCC1',
      rxnSmiles: 'C1=CCCCC1>>BrC1CCCCC1Br',
      caption: 'Cyclohexen ergibt trans-1,2-Dibromcyclohexan.',
    },
    reagents: [
      { name: 'Alken', role: 'Reagenz', equivalents: '1,0 Äq.' },
      { name: 'Brom', formula: 'Br2', role: 'Reagenz', equivalents: '1,0 Äq.', note: 'als Lösung in Dichlormethan oder als Bromwasser' },
    ],
    conditions: {
      temperature: '0–25 °C',
      duration: '10–60 min',
      solvent: 'Dichlormethan, Tetrachlormethan oder Wasser',
      workup: 'Mit Natriumthiosulfatlösung überschüssiges Brom entfernen',
      purification: 'Umkristallisieren oder Destillation',
      monitoring: 'Die braune Farbe verschwindet bei Umsatz',
    },
    procedure: [
      { title: 'Alken lösen', detail: 'Alken in Dichlormethan lösen und auf 0 °C kühlen.' },
      {
        title: 'Brom zutropfen',
        detail: 'Bromlösung langsam zutropfen, bis die Braunfärbung bestehen bleibt.',
        caution: 'Brom verursacht schwere Verätzungen und ist stark ätzend für die Atemwege. Nur im Abzug!',
      },
      { title: 'Entfärben', detail: 'Überschüssiges Brom mit Natriumthiosulfatlösung zerstören.' },
      { title: 'Aufarbeiten', detail: 'Phasen trennen, trocknen, einengen und umkristallisieren.' },
    ],
    mechanism: {
      type: 'Elektrophile Addition über Bromoniumion',
      summary:
        'Die π-Elektronen greifen Brom an; es bildet sich ein cyclisches Bromoniumion. Das Bromid öffnet den Ring von der Rückseite – daher anti-Addition.',
      steps: [
        {
          title: '1. Bildung des Bromoniumions',
          rxnSmiles: 'CC=CC>>C[CH]1[CH](C)[Br+]1',
          description:
            'Die Doppelbindung polarisiert das Brommolekül und greift es an. Es entsteht ein dreigliedriges Bromoniumion, Bromid wird frei.',
          electronFlow: 'π-Elektronen → Br; Br–Br-Bindungselektronen → austretendes Bromid.',
          intermediate: 'cyclisches Bromoniumion',
          relativeEnergy: 60,
          rateDetermining: true,
        },
        {
          title: '2. Rückseitiger Angriff des Bromids',
          rxnSmiles: 'C1=CCCCC1>>Br[C@H]1CCCC[C@@H]1Br',
          description:
            'Das Bromid öffnet den Ring an der dem Bromoniumion abgewandten Seite. Deshalb stehen beide Bromatome anti zueinander.',
          electronFlow: 'Elektronenpaar des Bromids → Ringkohlenstoff; C–Br⁺-Bindung bricht.',
          relativeEnergy: -75,
        },
      ],
      stereochemistry:
        'Anti-Addition: aus Cyclohexen entsteht ausschließlich das trans-Produkt, aus cis-But-2-en das Racemat der (R,R)- und (S,S)-Form.',
      competingPathways:
        'In Wasser fängt das Wassermolekül das Bromoniumion ab; es entsteht ein Bromhydrin (Halogenhydrin-Bildung).',
    },
    safety: {
      ghs: ['GHS05', 'GHS06', 'GHS09'],
      hazards: [
        'Brom ist lebensgefährlich beim Einatmen und verursacht schwere Verätzungen (H330, H314).',
        'Sehr giftig für Wasserorganismen (H400).',
      ],
      precautions: [
        'Nur im Abzug mit Bromhandschuhen arbeiten.',
        'Natriumthiosulfatlösung als Notfallmittel bereithalten.',
      ],
      ppe: ['Schutzbrille', 'Vollvisier bei größeren Mengen', 'Butylhandschuhe', 'Abzug'],
      waste: 'Halogenhaltige Abfälle getrennt; Bromreste mit Thiosulfat entgiften.',
      level: 'Laborpraktikum',
    },
    typicalYield: '85–98 %',
    scale: ['Schulversuch', 'Laborsynthese'],
    keywords: ['Bromoniumion', 'anti-Addition', 'Nachweisreaktion', 'Alken'],
    references: [{ title: 'Clayden, Organic Chemistry, Kap. 19', source: 'Oxford University Press' }],
  },
  {
    id: 'hydrohalogenierung-markovnikov',
    name: 'Addition von Halogenwasserstoff (Markovnikov)',
    category: 'organisch',
    reactionType: 'Elektrophile Addition',
    summary:
      'HBr addiert so an die Doppelbindung, dass das stabilere Carbeniumion durchlaufen wird: Das Halogen landet am höher substituierten Kohlenstoff.',
    smirks: '[CX3;H2:1]=[CX3:2]>>[CX4;H3:1][CX4:2]Br',
    reactantDefaults: ['CC(C)=C'],
    substrateSlots: [0],
    functionalGroups: ['alken'],
    generalEquation: 'R₂C=CH₂ + HBr → R₂CBr–CH₃',
    example: {
      substrate: 'CC(C)=C',
      rxnSmiles: 'CC(C)=C>>CC(C)(C)Br',
      caption: 'Isobuten und HBr ergeben tert-Butylbromid – das Bromid sitzt am höher substituierten C-Atom.',
    },
    reagents: [
      { name: 'Alken', role: 'Reagenz', equivalents: '1,0 Äq.' },
      { name: 'Bromwasserstoff', formula: 'HBr', role: 'Reagenz', equivalents: '1,1 Äq.', note: 'gasförmig oder als Eisessiglösung' },
    ],
    conditions: {
      temperature: '0–25 °C',
      duration: '1–3 h',
      solvent: 'Dichlormethan oder Eisessig',
      atmosphere: 'trocken – Peroxide führen zur anti-Markovnikov-Addition',
      workup: 'Mit Wasser und NaHCO₃-Lösung waschen',
      purification: 'Destillation',
    },
    procedure: [
      { title: 'Vorlegen', detail: 'Alken in Dichlormethan lösen und im Eisbad kühlen.' },
      {
        title: 'HBr einleiten',
        detail: 'Trockenes HBr-Gas einleiten oder HBr in Eisessig zutropfen.',
        caution: 'HBr ist stark ätzend; Abgase über eine Waschflasche leiten.',
      },
      { title: 'Rühren', detail: '1–2 h rühren und den Umsatz per GC oder NMR prüfen.' },
      { title: 'Aufarbeiten', detail: 'Mit Wasser, dann NaHCO₃-Lösung waschen, trocknen und destillieren.' },
    ],
    mechanism: {
      type: 'Elektrophile Addition über Carbeniumion',
      summary:
        'Das Proton addiert zuerst und erzeugt das stabilste mögliche Carbeniumion; anschließend fängt das Halogenid dieses ab.',
      steps: [
        {
          title: '1. Protonierung der Doppelbindung',
          rxnSmiles: 'CC(C)=C>>CC(C)([CH3])[CH2+]',
          description:
            'Die π-Elektronen greifen das Proton an. Es bildet sich bevorzugt das tertiäre Carbeniumion, weil es durch Hyperkonjugation und induktive Effekte stabilisiert wird.',
          electronFlow: 'π-Elektronen → Proton.',
          intermediate: 'tertiäres Carbeniumion',
          relativeEnergy: 75,
          rateDetermining: true,
        },
        {
          title: '2. Angriff des Halogenids',
          rxnSmiles: 'CC(C)=C>>CC(C)(C)Br',
          description: 'Das Bromid greift das planare Carbeniumion an; das Halogenalkan entsteht.',
          electronFlow: 'Elektronenpaar des Bromids → Carbeniumzentrum.',
          relativeEnergy: -95,
        },
      ],
      stereochemistry: 'Da das Carbeniumion planar ist, entsteht bei neuen Stereozentren ein Racemat.',
      competingPathways:
        'In Gegenwart von Peroxiden verläuft die HBr-Addition radikalisch und anti-Markovnikov (Kharasch-Effekt). Carbeniumionen können außerdem umlagern.',
    },
    safety: {
      ghs: ['GHS05', 'GHS07'],
      hazards: ['HBr ist stark ätzend (H314, H335).', 'Halogenalkane sind gesundheitsschädlich.'],
      precautions: ['Im Abzug arbeiten.', 'Saure Gase auswaschen.'],
      ppe: ['Schutzbrille', 'Handschuhe', 'Laborkittel', 'Abzug'],
      waste: 'Halogenhaltige Abfälle getrennt sammeln.',
      level: 'Laborpraktikum',
    },
    typicalYield: '70–95 %',
    scale: ['Laborsynthese', 'Industrie'],
    keywords: ['Markovnikov', 'Carbeniumion', 'Addition', 'Regioselektivität'],
    references: [{ title: 'Markownikoff, Ann. Chem. Pharm. 1870, 153, 228', source: 'Originalarbeit' }],
  },
  {
    id: 'hydroborierung-oxidation',
    name: 'Hydroborierung-Oxidation',
    category: 'organisch',
    reactionType: 'Addition (anti-Markovnikov)',
    summary:
      'Boran addiert syn und anti-Markovnikov an das Alken; die anschließende Oxidation mit Wasserstoffperoxid ersetzt Bor durch eine Hydroxygruppe. So gelingt der Zugang zum „falsch herum" hydratisierten Alkohol.',
    smirks: '[CX3;H2:1]=[CX3:2]>>[CX4:1][OX2H1].[CX4:2]',
    reactantDefaults: ['CC(C)=C'],
    substrateSlots: [0],
    functionalGroups: ['alken'],
    generalEquation: 'R₂C=CH₂ →(1. BH₃·THF, 2. H₂O₂/NaOH) R₂CH–CH₂–OH',
    example: {
      substrate: 'CC(C)=C',
      rxnSmiles: 'CC(C)=C>>CC(C)CO',
      caption: 'Isobuten liefert 2-Methylpropan-1-ol – die OH-Gruppe sitzt am weniger substituierten C-Atom.',
    },
    reagents: [
      { name: 'Alken', role: 'Reagenz', equivalents: '1,0 Äq.' },
      { name: 'Boran-THF-Komplex', formula: 'BH3', role: 'Reagenz', equivalents: '0,35 Äq. (3 Alkene je BH₃)' },
      { name: 'Wasserstoffperoxid (30 %)', role: 'Oxidationsmittel', equivalents: '3 Äq.' },
      { name: 'Natronlauge (3 M)', role: 'Base', equivalents: '3 Äq.' },
    ],
    conditions: {
      temperature: '0 °C (Hydroborierung), dann 25–40 °C (Oxidation)',
      duration: '1 h + 1 h',
      solvent: 'THF',
      atmosphere: 'Stickstoff oder Argon',
      workup: 'Phasentrennung, Extraktion',
      purification: 'Destillation oder Chromatographie',
    },
    procedure: [
      {
        title: 'Hydroborierung',
        detail: 'Alken in THF vorlegen, bei 0 °C Boran-Lösung zutropfen und 1 h rühren.',
        caution: 'Boran ist selbstentzündlich und reagiert heftig mit Wasser.',
      },
      {
        title: 'Oxidation',
        detail: 'Nacheinander Natronlauge und vorsichtig Wasserstoffperoxid zutropfen – stark exotherm!',
        caution: 'Temperatur durch langsames Zutropfen unter 40 °C halten.',
      },
      { title: 'Nachrühren', detail: '1 h bei Raumtemperatur rühren, bis die Oxidation vollständig ist.' },
      { title: 'Aufarbeiten', detail: 'Phasen trennen, wässrige Phase extrahieren, trocknen, einengen und reinigen.' },
    ],
    mechanism: {
      type: 'Konzertierte syn-Addition mit anschließender 1,2-Umlagerung',
      summary:
        'Bor und Wasserstoff werden gleichzeitig von derselben Seite übertragen; Bor setzt sich sterisch bedingt an das weniger substituierte C-Atom. Bei der Oxidation wandert der Alkylrest vom Bor zum Sauerstoff.',
      steps: [
        {
          title: '1. Syn-Addition des Borans',
          description:
            'Über einen viergliedrigen Übergangszustand addieren B und H gleichzeitig. Das Bor – der elektrophile Teil – geht an das sterisch günstigere, weniger substituierte Kohlenstoffatom.',
          electronFlow: 'π-Elektronen → Bor; B–H-Bindungselektronen → benachbartes C-Atom.',
          intermediate: 'Trialkylboran',
          relativeEnergy: 35,
          rateDetermining: true,
        },
        {
          title: '2. Angriff des Hydroperoxidions',
          description: 'HOO⁻ addiert an das elektronenarme Bor; es entsteht ein Borat-Komplex.',
          electronFlow: 'Elektronenpaar des Hydroperoxids → Bor.',
          relativeEnergy: 10,
        },
        {
          title: '3. 1,2-Alkylwanderung',
          rxnSmiles: 'CC(C)=C>>CC(C)CO',
          description:
            'Der Alkylrest wandert mit seinem Bindungselektronenpaar vom Bor zum benachbarten Sauerstoff; Hydroxid tritt aus. Die Konfiguration am Kohlenstoff bleibt dabei erhalten.',
          electronFlow: 'C–B-Bindungselektronen → O–O-σ*-Orbital; O–O-Bindung bricht.',
          relativeEnergy: -60,
        },
      ],
      stereochemistry:
        'Syn-Addition mit Retention bei der Oxidation: H und OH treten insgesamt von derselben Seite ein.',
      competingPathways:
        'Die saure Hydratisierung liefert genau das umgekehrte (Markovnikov-)Produkt – beide Methoden ergänzen sich.',
    },
    safety: {
      ghs: ['GHS02', 'GHS05', 'GHS03'],
      hazards: [
        'Boran-Lösungen sind selbstentzündlich (H250) und reagieren heftig mit Wasser.',
        'Wasserstoffperoxid (30 %) ist brandfördernd und ätzend (H271, H314).',
      ],
      precautions: ['Unter Schutzgas arbeiten.', 'Peroxidzugabe langsam und gekühlt.'],
      ppe: ['Schutzbrille', 'Handschuhe', 'Laborkittel', 'Abzug'],
      waste: 'Borhaltige Abfälle gesondert; Peroxidreste mit Thiosulfat zerstören.',
      level: 'Fortgeschritten',
    },
    typicalYield: '70–90 %',
    scale: ['Laborsynthese'],
    keywords: ['Hydroborierung', 'anti-Markovnikov', 'syn-Addition', 'Brown'],
    references: [
      { title: 'H. C. Brown, Hydroboration, 1962', source: 'Monographie (Nobelpreis 1979)' },
    ],
  },
  {
    id: 'epoxidierung-mcpba',
    name: 'Epoxidierung mit Persäuren',
    aliases: ['Prilezhaev-Reaktion'],
    category: 'organisch',
    reactionType: 'Elektrophile Addition (Oxidation)',
    summary:
      'Eine Persäure überträgt in einem Schritt ein Sauerstoffatom auf die Doppelbindung. Das entstehende Epoxid ist ein vielseitiger Baustein für Ringöffnungen.',
    smirks: '[CX3:1]=[CX3:2]>>[CX4:1]1[CX4:2][OX2]1',
    reactantDefaults: ['C1=CCCCC1'],
    substrateSlots: [0],
    functionalGroups: ['alken'],
    generalEquation: 'R₂C=CR₂ + R′CO₃H → Epoxid + R′COOH',
    example: {
      substrate: 'C1=CCCCC1',
      rxnSmiles: 'C1=CCCCC1>>C1CCC2OC2C1',
      caption: 'Cyclohexen wird zu Cyclohexenoxid epoxidiert.',
    },
    reagents: [
      { name: 'Alken', role: 'Reagenz', equivalents: '1,0 Äq.' },
      { name: 'meta-Chlorperbenzoesäure (mCPBA)', role: 'Oxidationsmittel', equivalents: '1,1–1,3 Äq.' },
      { name: 'Dichlormethan', role: 'Lösungsmittel' },
      { name: 'Natriumhydrogencarbonat', role: 'Base', note: 'puffert die entstehende Carbonsäure ab' },
    ],
    conditions: {
      temperature: '0 °C → Raumtemperatur',
      duration: '1–6 h',
      solvent: 'Dichlormethan',
      workup: 'Mit Na₂S₂O₃- und NaHCO₃-Lösung waschen',
      purification: 'Chromatographie oder Destillation',
      monitoring: 'DC; Peroxidtest-Streifen zeigen Restoxidationsmittel an',
    },
    procedure: [
      { title: 'Vorlegen', detail: 'Alken in Dichlormethan lösen, Hydrogencarbonat zugeben und auf 0 °C kühlen.' },
      {
        title: 'mCPBA zugeben',
        detail: 'Persäure portionsweise zugeben; die entstehende Chlorbenzoesäure fällt teilweise aus.',
        caution: 'Persäuren sind oxidierend und können beim Erwärmen zerfallen.',
      },
      { title: 'Rühren', detail: 'Auf Raumtemperatur erwärmen und bis zum vollständigen Umsatz rühren.' },
      {
        title: 'Aufarbeiten',
        detail: 'Mit Thiosulfatlösung (zerstört Peroxid) und Hydrogencarbonatlösung waschen, trocknen und reinigen.',
      },
    ],
    mechanism: {
      type: 'Konzertierter „Schmetterlings"-Übergangszustand',
      summary:
        'Persäure und Alken reagieren in einem einzigen Schritt: die O–O-Bindung bricht, während beide neuen C–O-Bindungen entstehen.',
      steps: [
        {
          title: '1. Konzertierte Sauerstoffübertragung',
          rxnSmiles: 'C1=CCCCC1>>C1CCC2OC2C1',
          description:
            'Die π-Elektronen greifen das endständige Sauerstoffatom der Persäure an. Gleichzeitig wandert das Proton zum Carbonylsauerstoff und die O–O-Bindung bricht – alles in einem cyclischen Übergangszustand.',
          electronFlow:
            'π-Elektronen → äußeres O; O–O-Elektronen → O–H-Bindung; O–H-Elektronen → Carbonylsauerstoff.',
          relativeEnergy: 70,
          rateDetermining: true,
        },
      ],
      stereochemistry:
        'Die Konfiguration des Alkens bleibt vollständig erhalten: aus cis-Alkenen entstehen cis-Epoxide. Elektronenreiche Doppelbindungen reagieren deutlich schneller.',
      competingPathways:
        'Mit Sharpless-Epoxidierung (Ti(OiPr)₄, Tartrat, TBHP) lassen sich Allylalkohole enantioselektiv epoxidieren.',
      productEnergy: -175,
    },
    safety: {
      ghs: ['GHS02', 'GHS05', 'GHS07'],
      hazards: [
        'mCPBA ist brandfördernd und kann explosionsartig zerfallen (H242).',
        'Epoxide sind oft krebsverdächtig.',
      ],
      precautions: ['Kühl lagern.', 'Nicht mit Metallspateln reiben.', 'Peroxidreste zerstören.'],
      ppe: ['Schutzbrille', 'Handschuhe', 'Laborkittel', 'Abzug'],
      waste: 'Peroxidhaltige Abfälle reduzieren, dann getrennt entsorgen.',
      level: 'Fortgeschritten',
    },
    typicalYield: '70–95 %',
    scale: ['Laborsynthese', 'Industrie'],
    keywords: ['Epoxid', 'Persäure', 'mCPBA', 'konzertiert'],
    references: [{ title: 'Prilezhaev, Ber. Dtsch. Chem. Ges. 1909, 42, 4811', source: 'Originalarbeit' }],
  },
  {
    id: 'dihydroxylierung',
    name: 'Syn-Dihydroxylierung',
    aliases: ['Upjohn-Dihydroxylierung', 'Baeyer-Probe'],
    category: 'organisch',
    reactionType: 'Oxidation (Cycloaddition)',
    summary:
      'Osmiumtetroxid oder kaltes Permanganat überträgt zwei Hydroxygruppen syn auf die Doppelbindung; es entsteht ein cis-Diol. Die Baeyer-Probe nutzt die Braunfärbung als Alkennachweis.',
    smirks: '[CX3:1]=[CX3:2]>>[CX4:1]([OX2H1])[CX4:2][OX2H1]',
    reactantDefaults: ['C1=CCCCC1'],
    substrateSlots: [0],
    functionalGroups: ['alken'],
    generalEquation: 'R₂C=CR₂ + OsO₄ + NMO + H₂O → cis-Diol',
    example: {
      substrate: 'C1=CCCCC1',
      rxnSmiles: 'C1=CCCCC1>>OC1CCCCC1O',
      caption: 'Cyclohexen ergibt cis-Cyclohexan-1,2-diol.',
    },
    reagents: [
      { name: 'Alken', role: 'Reagenz', equivalents: '1,0 Äq.' },
      { name: 'Osmiumtetroxid', formula: 'OsO4', role: 'Katalysator', equivalents: '0,01–0,05 Äq.' },
      { name: 'N-Methylmorpholin-N-oxid (NMO)', role: 'Oxidationsmittel', equivalents: '1,5 Äq.', note: 'reoxidiert das Osmium' },
      { name: 'Aceton/Wasser', role: 'Lösungsmittel' },
    ],
    conditions: {
      temperature: '0–25 °C',
      duration: '4–24 h',
      solvent: 'Aceton/Wasser 8:1',
      workup: 'Mit Natriumsulfit oder Thiosulfat reduktiv aufarbeiten',
      purification: 'Chromatographie oder Umkristallisieren',
    },
    procedure: [
      {
        title: 'Ansatz',
        detail: 'Alken und NMO in Aceton/Wasser lösen, katalytisch OsO₄-Lösung zugeben.',
        caution: 'Osmiumtetroxid ist hochgiftig und flüchtig – ausschließlich als Lösung im Abzug handhaben.',
      },
      { title: 'Rühren', detail: 'Bei Raumtemperatur rühren; die Lösung färbt sich dunkel.' },
      { title: 'Reduktiv aufarbeiten', detail: 'Natriumsulfitlösung zugeben und 30 min rühren, um Osmium zu reduzieren.' },
      { title: 'Reinigen', detail: 'Extrahieren, trocknen, einengen und chromatographieren.' },
    ],
    mechanism: {
      type: '[3+2]-Cycloaddition',
      summary:
        'Das Osmiumtetroxid addiert in einem Schritt mit zwei Sauerstoffatomen an die Doppelbindung. Der fünfgliedrige Osmatester wird hydrolytisch zum cis-Diol gespalten.',
      steps: [
        {
          title: '1. [3+2]-Cycloaddition',
          description:
            'Zwei Os=O-Gruppen und die C=C-Doppelbindung bilden gemeinsam einen fünfgliedrigen Ring (Osmatester). Beide Sauerstoffatome treten zwangsläufig von derselben Seite ein.',
          electronFlow: 'π-Elektronen → Osmium-Sauerstoff-Einheit.',
          intermediate: 'cyclischer Osmatester',
          relativeEnergy: 40,
          rateDetermining: true,
        },
        {
          title: '2. Hydrolyse des Osmatesters',
          rxnSmiles: 'C1=CCCCC1>>O[C@H]1CCCC[C@H]1O',
          description: 'Wasser bzw. Sulfit spaltet den Ester; das cis-Diol wird frei, Osmium wird reduziert.',
          electronFlow: 'Elektronenpaar des Wassers → Osmium; Os–O-Bindungen brechen.',
          relativeEnergy: -50,
        },
      ],
      stereochemistry:
        'Strikte syn-Addition – im Gegensatz zur anti-Öffnung eines Epoxids. Mit chiralen Liganden (Sharpless-AD) wird die Reaktion enantioselektiv.',
    },
    safety: {
      ghs: ['GHS06', 'GHS05'],
      hazards: [
        'Osmiumtetroxid ist lebensgefährlich beim Einatmen und schädigt die Augen irreversibel (H300+H330, H314).',
      ],
      precautions: [
        'Nur katalytische Mengen als verdünnte Lösung verwenden.',
        'Alle Geräte nach Gebrauch mit Öl oder Sulfitlösung dekontaminieren.',
      ],
      ppe: ['Schutzbrille', 'doppelte Nitrilhandschuhe', 'Laborkittel', 'Abzug'],
      waste: 'Osmiumhaltige Abfälle streng getrennt als Schwermetallsondermüll.',
      level: 'Nur Fachlabor',
    },
    typicalYield: '70–95 %',
    scale: ['Laborsynthese'],
    keywords: ['cis-Diol', 'Osmium', 'syn-Addition', 'Sharpless'],
    references: [
      { title: 'VanRheenen et al., Tetrahedron Lett. 1976, 17, 1973', source: 'Originalarbeit' },
    ],
  },
  {
    id: 'ozonolyse',
    name: 'Ozonolyse',
    category: 'organisch',
    reactionType: 'Oxidative Spaltung',
    summary:
      'Ozon spaltet die C=C-Doppelbindung vollständig. Je nach Aufarbeitung entstehen Aldehyde/Ketone (reduktiv) oder Carbonsäuren (oxidativ) – ein klassisches Werkzeug der Strukturaufklärung.',
    smirks: '[CX3:1]=[CX3:2]>>[CX3:1]=[OX1].[CX3:2]=[OX1]',
    reactantDefaults: ['CC=CC'],
    substrateSlots: [0],
    functionalGroups: ['alken'],
    generalEquation: 'R₂C=CR′₂ →(1. O₃, 2. Me₂S) R₂C=O + R′₂C=O',
    example: {
      substrate: 'CC=CC',
      rxnSmiles: 'CC=CC>>CC=O.CC=O',
      caption: 'But-2-en wird zu zwei Molekülen Acetaldehyd gespalten.',
    },
    reagents: [
      { name: 'Alken', role: 'Reagenz', equivalents: '1,0 Äq.' },
      { name: 'Ozon', formula: 'O3', role: 'Oxidationsmittel', equivalents: '1,0 Äq.', note: 'aus dem Ozongenerator' },
      { name: 'Dimethylsulfid oder Zink/Essigsäure', role: 'Reduktionsmittel', equivalents: '2,0 Äq.' },
    ],
    conditions: {
      temperature: '−78 °C',
      duration: '15–60 min Einleitung, dann 1–12 h Aufarbeitung',
      solvent: 'Dichlormethan oder Methanol',
      apparatus: 'Ozongenerator, Waschflasche mit KI-Lösung für Restozon',
      workup: 'Reduktiv mit Dimethylsulfid',
      purification: 'Chromatographie oder Destillation',
      monitoring: 'Die Blaufärbung der Lösung zeigt Ozonüberschuss an',
    },
    procedure: [
      {
        title: 'Kühlen',
        detail: 'Alkenlösung auf −78 °C kühlen (Trockeneis/Aceton).',
        caution: 'Ozon ist hochgiftig; Abgase über Kaliumiodidlösung leiten.',
      },
      {
        title: 'Ozon einleiten',
        detail: 'Ozon einleiten, bis die Lösung anhaltend blau bleibt. Dann mit Stickstoff spülen, bis die Farbe verschwindet.',
      },
      {
        title: 'Reduktiv aufarbeiten',
        detail: 'Dimethylsulfid zugeben und über Nacht auf Raumtemperatur kommen lassen.',
        tip: 'Ohne Reduktionsmittel bleibt das explosionsgefährliche Ozonid zurück – dieser Schritt ist Pflicht.',
      },
      { title: 'Reinigen', detail: 'Einengen und chromatographisch oder destillativ reinigen.' },
    ],
    mechanism: {
      type: 'Criegee-Mechanismus (1,3-dipolare Cycloadditionen)',
      summary:
        'Ozon addiert zum Primärozonid, das sofort in Carbonylverbindung und Carbonyloxid zerfällt. Beide rekombinieren zum Sekundärozonid, das reduktiv gespalten wird.',
      steps: [
        {
          title: '1. 1,3-dipolare Cycloaddition',
          description: 'Ozon addiert an die Doppelbindung; es entsteht das instabile Primärozonid (Molozonid).',
          electronFlow: 'π-Elektronen → terminales Ozon-Sauerstoffatom.',
          intermediate: 'Primärozonid',
          relativeEnergy: 30,
          rateDetermining: true,
        },
        {
          title: '2. Retro-Cycloaddition',
          description: 'Der Fünfring zerfällt in eine Carbonylverbindung und ein Carbonyloxid (Criegee-Zwitterion).',
          electronFlow: 'O–O- und C–C-Bindungen brechen gleichzeitig.',
          intermediate: 'Criegee-Zwitterion',
          relativeEnergy: 10,
        },
        {
          title: '3. Rekombination zum Sekundärozonid',
          description: 'Beide Fragmente addieren erneut aneinander – das 1,2,4-Trioxolan ist isolierbar, aber explosiv.',
          electronFlow: 'Carbonyloxid → Carbonylgruppe.',
          relativeEnergy: -35,
        },
        {
          title: '4. Reduktive Spaltung',
          rxnSmiles: 'CC=CC>>CC=O.CC=O',
          description:
            'Dimethylsulfid nimmt ein Sauerstoffatom auf (wird zu DMSO); es bleiben zwei Carbonylverbindungen zurück.',
          electronFlow: 'Elektronenpaar des Schwefels → Peroxidsauerstoff; O–O-Bindung bricht.',
          relativeEnergy: -80,
        },
      ],
      competingPathways:
        'Oxidative Aufarbeitung mit H₂O₂ liefert stattdessen Carbonsäuren; Reduktion mit NaBH₄ führt direkt zu Alkoholen.',
    },
    safety: {
      ghs: ['GHS03', 'GHS06', 'GHS08'],
      hazards: [
        'Ozon ist sehr giftig und stark oxidierend (H270, H330).',
        'Ozonide sind explosionsgefährlich – niemals einengen oder isolieren.',
      ],
      precautions: [
        'Immer reduktiv aufarbeiten, bevor eingeengt wird.',
        'Peroxidtest vor dem Entfernen des Lösungsmittels.',
        'Restozon über KI-Lösung vernichten.',
      ],
      ppe: ['Schutzbrille', 'Handschuhe', 'Laborkittel', 'Abzug'],
      waste: 'Peroxidhaltige Lösungen reduzieren, dann als organischen Sondermüll entsorgen.',
      level: 'Nur Fachlabor',
    },
    typicalYield: '60–90 %',
    scale: ['Laborsynthese', 'Industrie'],
    keywords: ['Ozonid', 'Criegee', 'Spaltung', 'Strukturaufklärung'],
    references: [{ title: 'Criegee, Angew. Chem. 1975, 87, 765', source: 'Übersichtsartikel' }],
  },
  {
    id: 'diels-alder',
    name: 'Diels-Alder-Reaktion',
    aliases: ['[4+2]-Cycloaddition'],
    category: 'organisch',
    reactionType: 'Cycloaddition',
    summary:
      'Ein konjugiertes Dien und ein Dienophil bilden in einem Schritt einen Sechsring. Zwei C–C-Bindungen und bis zu vier Stereozentren entstehen gleichzeitig und hochgradig kontrolliert.',
    smirks:
      '[CX3:1]=[CX3:2][CX3:3]=[CX3:4].[CX3:5]=[CX3:6]>>[CX4:1]1[CX3:2]=[CX3:3][CX4:4][CX4:5][CX4:6]1',
    reactantDefaults: ['C=CC=C', 'C=CC=O'],
    substrateSlots: [0, 1],
    functionalGroups: ['alken'],
    generalEquation: 'Dien + Dienophil → Cyclohexen-Derivat',
    example: {
      substrate: 'C=CC=C',
      rxnSmiles: 'C=CC=C.C=CC=O>>O=CC1CCC=CC1',
      caption: 'Butadien und Acrolein ergeben Cyclohex-3-encarbaldehyd.',
    },
    reagents: [
      { name: 'konjugiertes Dien', role: 'Reagenz', equivalents: '1,0–2,0 Äq.' },
      { name: 'Dienophil (elektronenarm)', role: 'Reagenz', equivalents: '1,0 Äq.' },
      { name: 'Lewis-Säure (AlCl₃, ZnCl₂)', role: 'Katalysator', equivalents: '0,1 Äq.', note: 'beschleunigt und erhöht die Selektivität' },
    ],
    conditions: {
      temperature: '25–150 °C (mit Lewis-Säure oft Raumtemperatur)',
      duration: '2–24 h',
      solvent: 'Toluol, Dichlormethan oder ohne Lösungsmittel',
      apparatus: 'Rückflussapparatur oder Druckrohr',
      workup: 'Einengen',
      purification: 'Chromatographie oder Destillation',
    },
    procedure: [
      { title: 'Ansatz', detail: 'Dien und Dienophil im Lösungsmittel vereinigen; gegebenenfalls Lewis-Säure zugeben.' },
      {
        title: 'Erhitzen',
        detail: 'Auf Reaktionstemperatur erhitzen. Flüchtige Diene im geschlossenen Druckrohr umsetzen.',
        caution: 'Druckrohre nur bis zum zulässigen Druck befüllen und hinter Schutzscheibe erhitzen.',
      },
      { title: 'Verfolgen', detail: 'Umsatz per DC oder NMR prüfen.' },
      { title: 'Aufarbeiten', detail: 'Lewis-Säure wässrig entfernen, einengen und reinigen.' },
    ],
    mechanism: {
      type: 'Pericyclische [4+2]-Cycloaddition (konzertiert, suprafacial)',
      summary:
        'Sechs Elektronen bewegen sich in einem cyclischen Übergangszustand. Das HOMO des Diens überlappt mit dem LUMO des Dienophils – daher beschleunigen elektronenziehende Gruppen am Dienophil die Reaktion.',
      steps: [
        {
          title: '1. Konzertierte Cycloaddition',
          rxnSmiles: 'C=CC=C.C=CC=O>>O=CC1CCC=CC1',
          description:
            'Das Dien muss die s-cis-Konformation einnehmen. Beide neuen σ-Bindungen entstehen gleichzeitig; es gibt kein Zwischenprodukt.',
          electronFlow:
            'π-Elektronen des Diens (HOMO) → π*-Orbital des Dienophils (LUMO); gleichzeitig zyklische Elektronenverschiebung über sechs Zentren.',
          relativeEnergy: 80,
          rateDetermining: true,
        },
      ],
      stereochemistry:
        'Suprafacial-suprafacial: die Konfiguration beider Partner bleibt erhalten (cis-Prinzip). Die endo-Regel bevorzugt das sterisch ungünstigere endo-Produkt, weil sekundäre Orbitalwechselwirkungen den Übergangszustand stabilisieren.',
      kinetics: 'Zweiter Ordnung, stark beschleunigt durch Lewis-Säuren und durch Wasser als Lösungsmittel.',
      competingPathways:
        'Bei hohen Temperaturen kann die Retro-Diels-Alder-Reaktion zurückführen – das nutzt man etwa bei Cyclopentadien-Dimeren.',
      productEnergy: -160,
    },
    safety: {
      ghs: ['GHS02', 'GHS07'],
      hazards: ['Diene sind leichtentzündlich.', 'Acrolein und ähnliche Dienophile sind sehr giftig und tränenreizend.'],
      precautions: ['Im Abzug arbeiten.', 'Cyclopentadien frisch aus dem Dimer cracken.'],
      ppe: ['Schutzbrille', 'Handschuhe', 'Laborkittel', 'Abzug'],
      waste: 'Organische Abfälle halogenfrei sammeln.',
      level: 'Laborpraktikum',
    },
    typicalYield: '70–95 %',
    scale: ['Schulversuch', 'Laborsynthese', 'Industrie'],
    keywords: ['Cycloaddition', 'pericyclisch', 'endo-Regel', 'Nobelpreis 1950'],
    references: [
      { title: 'Diels, Alder, Liebigs Ann. Chem. 1928, 460, 98', source: 'Originalarbeit' },
      { title: 'Woodward, Hoffmann, Angew. Chem. 1969, 81, 797', source: 'Orbitalsymmetrie' },
    ],
  },
  {
    id: 'michael-addition',
    name: 'Michael-Addition',
    aliases: ['1,4-Addition', 'konjugierte Addition'],
    category: 'organisch',
    reactionType: 'C–C-Verknüpfung (konjugierte Addition)',
    summary:
      'Ein stabilisiertes Carbanion addiert an das β-Kohlenstoffatom eines α,β-ungesättigten Carbonylsystems. Die 1,4-Addition ist thermodynamisch gegenüber der direkten 1,2-Addition bevorzugt.',
    smirks:
      '[CX3:1]=[CX3:2][CX3:3]=[OX1:4].[CX4;H2:5]([CX3:6]=[OX1:7])[CX3:8]=[OX1:9]>>[CX4:5]([CX3:6]=[OX1:7])([CX3:8]=[OX1:9])[CX4:1][CX4:2][CX3:3]=[OX1:4]',
    reactantDefaults: ['C=CC(C)=O', 'CCOC(=O)CC(=O)OCC'],
    substrateSlots: [0, 1],
    functionalGroups: ['keton', 'aldehyd', 'alpha_ch_acid', 'ester'],
    generalEquation: 'C=C–C=O + ⁻CH(COR)₂ → (RCO)₂CH–C–C–C=O',
    example: {
      substrate: 'C=CC(C)=O',
      rxnSmiles: 'C=CC(C)=O.CCOC(=O)CC(=O)OCC>>CCOC(=O)C(C(=O)OCC)CCC(C)=O',
      caption: 'Malonsäurediethylester addiert an Methylvinylketon.',
    },
    reagents: [
      { name: 'Michael-Akzeptor (Enon)', role: 'Reagenz', equivalents: '1,0 Äq.' },
      { name: 'CH-acide Verbindung (Malonester, β-Ketoester)', role: 'Reagenz', equivalents: '1,0–1,2 Äq.' },
      { name: 'Natriumethanolat oder DBU', role: 'Base', equivalents: '0,1–0,3 Äq.' },
    ],
    conditions: {
      temperature: '0–60 °C',
      duration: '2–12 h',
      solvent: 'Ethanol, THF oder lösungsmittelfrei',
      workup: 'Neutralisieren und extrahieren',
      purification: 'Chromatographie oder Destillation',
    },
    procedure: [
      { title: 'Donor deprotonieren', detail: 'CH-acide Verbindung in Ethanol vorlegen und katalytisch Base zugeben.' },
      {
        title: 'Akzeptor zutropfen',
        detail: 'Enon langsam zutropfen und die Temperatur kontrollieren.',
        caution: 'Michael-Akzeptoren wie Acrylnitril und Acrolein sind giftig und sensibilisierend.',
      },
      { title: 'Rühren', detail: 'Bis zum vollständigen Umsatz rühren (DC).' },
      { title: 'Aufarbeiten', detail: 'Mit verdünnter Säure neutralisieren, extrahieren, trocknen und reinigen.' },
    ],
    mechanism: {
      type: 'Konjugierte Addition über Enolat',
      summary:
        'Die Base erzeugt ein stabilisiertes Enolat. Dieses greift das β-Kohlenstoffatom an; das entstehende Enolat wird protoniert.',
      steps: [
        {
          title: '1. Deprotonierung des Donors',
          rxnSmiles: 'CCOC(=O)CC(=O)OCC>>CCOC(=O)[CH-]C(=O)OCC',
          description: 'Das Proton zwischen zwei Carbonylgruppen ist mit pKs ≈ 13 leicht abzulösen.',
          electronFlow: 'Elektronenpaar der Base → acides H; Ladung wird über beide C=O delokalisiert.',
          relativeEnergy: 5,
        },
        {
          title: '2. Angriff am β-Kohlenstoff',
          description:
            'Das Carbanion greift das β-C-Atom des Enons an – dort liegt durch Mesomerie eine positive Partialladung.',
          electronFlow: 'Carbanion → β-C; π-Elektronen → Carbonylsauerstoff.',
          intermediate: 'Enolat des Additionsprodukts',
          relativeEnergy: 40,
          rateDetermining: true,
        },
        {
          title: '3. Protonierung',
          rxnSmiles: 'C=CC(C)=O.CCOC(=O)CC(=O)OCC>>CCOC(=O)C(C(=O)OCC)CCC(C)=O',
          description: 'Das Enolat nimmt ein Proton auf und tautomerisiert zur Carbonylform.',
          electronFlow: 'Elektronenpaar des Enolats → Proton.',
          relativeEnergy: -55,
        },
      ],
      competingPathways:
        'Harte Nucleophile (Grignard, LiAlH₄) greifen bevorzugt 1,2 am Carbonylkohlenstoff an; weiche Nucleophile wie Cuprate und Enolate addieren 1,4.',
    },
    safety: {
      ghs: ['GHS05', 'GHS06', 'GHS07'],
      hazards: [
        'Michael-Akzeptoren sind häufig giftig und hautsensibilisierend.',
        'Alkoholate reagieren heftig mit Wasser.',
      ],
      precautions: ['Im Abzug arbeiten.', 'Hautkontakt strikt vermeiden.'],
      ppe: ['Schutzbrille', 'Handschuhe', 'Laborkittel', 'Abzug'],
      waste: 'Organische Abfälle sammeln.',
      level: 'Laborpraktikum',
    },
    typicalYield: '65–95 %',
    scale: ['Laborsynthese', 'Industrie'],
    keywords: ['Michael', '1,4-Addition', 'Enolat', 'Malonester'],
    references: [{ title: 'Michael, J. Prakt. Chem. 1887, 35, 349', source: 'Originalarbeit' }],
  },
];
