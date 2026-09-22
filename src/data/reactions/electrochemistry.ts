/**
 * Elektroorganische Synthesen.
 *
 * Statt chemischer Oxidations- oder Reduktionsmittel wird der Elektronenfluss
 * direkt über Elektroden geführt. Kennzahlen: Stromdichte, Ladungsmenge in
 * F/mol und Stromausbeute.
 */
import type { ReactionRule } from '../types';

export const ELECTROCHEMISTRY_REACTIONS: ReactionRule[] = [
  {
    id: 'kolbe-elektrolyse',
    name: 'Kolbe-Elektrolyse',
    aliases: ['Kolbe-Synthese', 'anodische Decarboxylierung'],
    category: 'elektrochemie',
    reactionType: 'Anodische Oxidation (radikalische Dimerisierung)',
    summary:
      'Carboxylate werden an der Anode zu Radikalen oxidiert, die unter Verlust von CO₂ zum symmetrischen Dimer rekombinieren. Die älteste benannte Elektrosynthese – 1849 von Hermann Kolbe beschrieben.',
    smirks: '[#6:1][CX3](=[OX1])[OX2H1].[#6:2][CX3](=[OX1])[OX2H1]>>[#6:1][#6:2]',
    reactantDefaults: ['CCCCC(=O)O', 'CCCCC(=O)O'],
    substrateSlots: [0, 1],
    functionalGroups: ['carbonsaeure', 'carboxylat'],
    generalEquation: '2 R–COO⁻ → R–R + 2 CO₂ + 2 e⁻',
    example: {
      substrate: 'CCCCC(=O)O',
      rxnSmiles: 'CCCCC(=O)O.CCCCC(=O)O>>CCCCCCCC',
      caption: 'Zwei Moleküle Valeriansäure ergeben n-Octan und zwei Moleküle CO₂.',
    },
    reagents: [
      { name: 'Carbonsäure', role: 'Reagenz', equivalents: '2,0 Äq.' },
      {
        name: 'Natriummethanolat',
        role: 'Base',
        equivalents: '0,05–0,2 Äq.',
        note: 'stellt einen Teil der Säure als Carboxylat bereit und erhöht die Leitfähigkeit',
      },
      { name: 'Methanol', role: 'Lösungsmittel', note: 'hohe Überspannung an Platin, gute Löslichkeit' },
    ],
    conditions: {
      temperature: '15–40 °C, mit Kühlung',
      duration: '4–12 h (bis 2,2 F/mol umgesetzt sind)',
      solvent: 'Methanol',
      apparatus: 'ungeteilte Zelle mit Platinelektroden, Thermostat und Rührung',
      workup: 'Methanol abdestillieren, Rückstand extrahieren',
      purification: 'Destillation',
      monitoring: 'Ladungsmenge mitzählen – die Stromausbeute ist die entscheidende Größe',
    },
    electro: {
      cellType: 'ungeteilt',
      anode: 'Platin (glatt, hohe Überspannung erforderlich)',
      cathode: 'Platin oder Edelstahl',
      electrolyte: 'Methanol mit 5–20 mol% Natriummethanolat',
      mode: 'galvanostatisch',
      currentDensity: '150–500 mA/cm² (hohe Stromdichte unterdrückt die Nebenreaktion)',
      charge: '2,2–2,5 F/mol Dimer',
      faradaicEfficiency: '50–90 %',
      electrons: 2,
    },
    procedure: [
      {
        title: 'Elektrolyt ansetzen',
        detail:
          'Carbonsäure in Methanol lösen und mit Natriummethanolat teilweise neutralisieren (etwa 10 % Carboxylat).',
        tip: 'Vollständige Neutralisation senkt die Ausbeute – ein Überschuss freier Säure hält den pH-Wert günstig.',
      },
      {
        title: 'Zelle bestücken',
        detail:
          'Platinelektroden mit geringem Abstand (2–5 mm) einbauen, kräftig rühren und die Zelle auf unter 40 °C kühlen.',
        caution: 'An der Kathode entsteht Wasserstoff – für Abzug und Funkenfreiheit sorgen.',
      },
      {
        title: 'Elektrolysieren',
        detail:
          'Mit hoher Stromdichte galvanostatisch elektrolysieren, bis 2,2 F/mol geflossen sind (Q = I·t).',
        tip: 'Hohe Stromdichte begünstigt die Radikalkupplung gegenüber der Weiteroxidation zum Carbeniumion.',
      },
      {
        title: 'Aufarbeiten',
        detail:
          'Methanol abdestillieren, Rückstand mit Wasser versetzen, mit Ether extrahieren, trocknen und destillieren.',
      },
    ],
    mechanism: {
      type: 'Radikalmechanismus an der Anode',
      summary:
        'Die Anode entzieht dem Carboxylat ein Elektron. Das Acyloxyradikal zerfällt sofort unter CO₂-Abgabe zum Alkylradikal; zwei Alkylradikale rekombinieren.',
      steps: [
        {
          title: '1. Anodische Einelektronenoxidation',
          rxnSmiles: 'CCCCC(=O)[O-]>>CCCCC(=O)[O]',
          description:
            'Das Carboxylation gibt an der Anode ein Elektron ab. Es entsteht ein Acyloxyradikal – dieser Schritt bestimmt das benötigte Anodenpotential (ca. +2,1 V gegen NHE).',
          electronFlow: 'Elektron vom Carboxylat-Sauerstoff → Anode.',
          relativeEnergy: 95,
          rateDetermining: true,
        },
        {
          title: '2. Decarboxylierung',
          rxnSmiles: 'CCCCC(=O)[O]>>[CH2]CCCC',
          description:
            'Das Acyloxyradikal verliert innerhalb von Nanosekunden Kohlenstoffdioxid; zurück bleibt ein Alkylradikal.',
          electronFlow: 'C–C-Bindung bricht homolytisch, CO₂ entweicht.',
          intermediate: 'Alkylradikal',
          relativeEnergy: 20,
        },
        {
          title: '3. Radikalrekombination',
          rxnSmiles: 'CCCCC(=O)O.CCCCC(=O)O>>CCCCCCCC',
          description:
            'Zwei Alkylradikale in der anodennahen Schicht verbinden sich zum symmetrischen Dimer. Die hohe lokale Radikalkonzentration ist der Grund für die hohe Stromdichte.',
          electronFlow: 'Zwei ungepaarte Elektronen bilden die neue σ-Bindung.',
          relativeEnergy: -180,
        },
      ],
      competingPathways:
        'Wird das Alkylradikal ein zweites Mal oxidiert, entsteht ein Carbeniumion – das führt zur Hofer-Moest-Reaktion (Alkohol, Ether oder Alken). Niedrige Stromdichte, Graphitanoden und stabilisierende Substituenten begünstigen diesen Weg.',
    },
    safety: {
      ghs: ['GHS02', 'GHS07'],
      hazards: [
        'An der Kathode entsteht Wasserstoff – Knallgasgefahr in geschlossenen Zellen.',
        'Methanol ist giftig und leichtentzündlich (H225, H301, H331, H370).',
      ],
      precautions: [
        'Zelle offen oder mit Gasableitung betreiben, niemals dicht verschließen.',
        'Elektrische Anschlüsse vor dem Einschalten prüfen; Netzteil strombegrenzt betreiben.',
      ],
      ppe: ['Schutzbrille', 'Handschuhe', 'Laborkittel', 'Abzug'],
      waste: 'Methanolische Lösungen als halogenfreien organischen Abfall sammeln.',
      level: 'Fortgeschritten',
    },
    typicalYield: '40–85 %',
    scale: ['Laborsynthese', 'Industrie'],
    keywords: ['Kolbe', 'Elektrolyse', 'Radikal', 'Decarboxylierung', 'Dimerisierung'],
    references: [
      { title: 'Kolbe, Liebigs Ann. Chem. 1849, 69, 257', source: 'Originalarbeit' },
      {
        title: 'Named Reactions Powered by Electroorganic Syntheses',
        source: 'Beilstein J. Org. Chem. / PMC13082866',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC13082866/',
      },
    ],
    thermodynamics: {
      note: 'Anodenpotential etwa +2,1 V gegen NHE; die CO₂-Freisetzung liefert die Triebkraft für den Radikalzerfall.',
    },
  },
  {
    id: 'hofer-moest',
    name: 'Hofer-Moest-Reaktion (Nicht-Kolbe-Elektrolyse)',
    category: 'elektrochemie',
    reactionType: 'Anodische Oxidation (Zwei-Elektronen-Weg)',
    summary:
      'Wird das aus der Decarboxylierung entstandene Radikal ein zweites Mal oxidiert, entsteht ein Carbeniumion. Nucleophile fangen es ab – so werden aus Carbonsäuren Alkohole, Ether oder Alkene.',
    smirks: '[#6:1][CX3](=[OX1])[OX2H1]>>[#6:1][OX2H1]',
    reactantDefaults: ['CC(C)(C)CC(=O)O'],
    substrateSlots: [0],
    functionalGroups: ['carbonsaeure', 'carboxylat'],
    generalEquation: 'R–COO⁻ + Nu⁻ → R–Nu + CO₂ + 2 e⁻',
    example: {
      substrate: 'CC(C)(C)CC(=O)O',
      rxnSmiles: 'CC(C)(C)CC(=O)O>>CC(C)(C)CO',
      caption: 'Aus der Säure entsteht über das Carbeniumion der Alkohol (bzw. der Methylether in Methanol).',
    },
    reagents: [
      { name: 'Carbonsäure', role: 'Reagenz', equivalents: '1,0 Äq.' },
      { name: 'Natriumcarbonat oder -methanolat', role: 'Base', equivalents: '0,5 Äq.' },
      { name: 'Methanol/Wasser', role: 'Lösungsmittel', note: 'dient zugleich als Nucleophil' },
    ],
    conditions: {
      temperature: '20–50 °C',
      duration: '4–10 h',
      solvent: 'Methanol oder Methanol/Wasser',
      apparatus: 'ungeteilte Zelle mit Graphitanode',
      workup: 'Lösungsmittel abziehen, extrahieren',
      purification: 'Destillation oder Chromatographie',
    },
    electro: {
      cellType: 'ungeteilt',
      anode: 'Graphit oder Glaskohlenstoff (niedrigere Überspannung als Platin)',
      cathode: 'Edelstahl',
      electrolyte: 'Methanol mit Natriumcarbonat',
      mode: 'galvanostatisch',
      currentDensity: '10–50 mA/cm² (niedrig – begünstigt die Zweitoxidation)',
      charge: '2,0–3,0 F/mol',
      faradaicEfficiency: '40–80 %',
      electrons: 2,
    },
    procedure: [
      { title: 'Elektrolyt ansetzen', detail: 'Säure in Methanol lösen und teilweise mit Base neutralisieren.' },
      {
        title: 'Elektrolyse',
        detail: 'Bei niedriger Stromdichte an Graphit elektrolysieren, bis etwa 2,5 F/mol geflossen sind.',
        tip: 'Anders als bei Kolbe ist hier die niedrige Stromdichte erwünscht.',
      },
      { title: 'Aufarbeiten', detail: 'Lösungsmittel entfernen, Rückstand extrahieren und reinigen.' },
    ],
    mechanism: {
      type: 'Zweifache anodische Oxidation über Carbeniumion',
      summary:
        'Nach Decarboxylierung wird das Alkylradikal ein weiteres Mal oxidiert. Das Carbeniumion reagiert mit dem Lösungsmittel oder eliminiert zum Alken.',
      steps: [
        {
          title: '1. Oxidation und Decarboxylierung',
          description: 'Wie bei Kolbe entsteht zunächst das Alkylradikal.',
          electronFlow: 'Elektron → Anode; CO₂ wird abgespalten.',
          relativeEnergy: 95,
          rateDetermining: true,
        },
        {
          title: '2. Zweite Einelektronenoxidation',
          rxnSmiles: '[CH2]C(C)(C)C>>[CH2+]C(C)(C)C',
          description:
            'Das Radikal gibt ein weiteres Elektron ab. Stabilisierte Radikale (sekundär, tertiär, benzylisch, α-Heteroatom) nehmen diesen Weg besonders leicht.',
          electronFlow: 'Elektron vom Radikal → Anode.',
          intermediate: 'Carbeniumion',
          relativeEnergy: 60,
        },
        {
          title: '3. Abfangen durch das Nucleophil',
          rxnSmiles: 'CC(C)(C)CC(=O)O>>CC(C)(C)CO',
          description: 'Methanol oder Wasser addiert an das Carbeniumion; alternativ entsteht durch Eliminierung ein Alken.',
          electronFlow: 'Elektronenpaar des Nucleophils → Carbeniumzentrum.',
          relativeEnergy: -120,
        },
      ],
      competingPathways:
        'Kolbe-Dimerisierung (hohe Stromdichte, Platin) und Hofer-Moest (niedrige Stromdichte, Graphit) konkurrieren direkt – über Elektrodenmaterial und Stromdichte lässt sich gezielt steuern.',
    },
    safety: {
      ghs: ['GHS02', 'GHS07'],
      hazards: ['Wasserstoffentwicklung an der Kathode.', 'Methanol ist giftig.'],
      precautions: ['Zelle belüften.', 'Temperatur kontrollieren.'],
      ppe: ['Schutzbrille', 'Handschuhe', 'Laborkittel', 'Abzug'],
      waste: 'Organische Lösungen getrennt sammeln.',
      level: 'Fortgeschritten',
    },
    typicalYield: '35–75 %',
    scale: ['Laborsynthese'],
    keywords: ['Hofer-Moest', 'Carbeniumion', 'Decarboxylierung', 'Stromdichte'],
    references: [
      { title: 'Hofer, Moest, Liebigs Ann. Chem. 1902, 323, 284', source: 'Originalarbeit' },
    ],
  },
  {
    id: 'shono-oxidation',
    name: 'Shono-Oxidation',
    aliases: ['anodische α-Methoxylierung von Amiden'],
    category: 'elektrochemie',
    reactionType: 'Anodische C–H-Funktionalisierung',
    summary:
      'Carbamate und Amide werden anodisch am α-Kohlenstoff oxidiert. Über ein N-Acyliminiumion entsteht ein α-Methoxyamid – ein lagerfähiger Baustein, der später durch Nucleophile ersetzt wird.',
    smirks: '[NX3:1]([CX3:2]=[OX1:3])[CX4;H1,H2:4]>>[N:1]([C:2]=[O:3])[C:4]OC',
    reactantDefaults: ['O=C(OC)N1CCCC1'],
    substrateSlots: [0],
    functionalGroups: ['amid', 'amin_tert'],
    generalEquation: 'R₂N–CH₂–R′ + MeOH → R₂N–CH(OMe)–R′ + 2 H⁺ + 2 e⁻',
    example: {
      substrate: 'O=C(OC)N1CCCC1',
      rxnSmiles: 'O=C(OC)N1CCCC1>>O=C(OC)N1CCCC1OC',
      caption: 'N-Methoxycarbonylpyrrolidin wird zum 2-Methoxyderivat oxidiert – Shonos Originalsubstrat.',
    },
    reagents: [
      { name: 'Carbamat oder Amid', role: 'Reagenz', equivalents: '1,0 Äq.' },
      { name: 'Methanol', role: 'Lösungsmittel', note: 'gleichzeitig Nucleophil' },
      {
        name: 'Tetraethylammoniumtosylat',
        role: 'Leitsalz',
        equivalents: '0,1 Äq.',
        note: 'nicht oxidierbares Leitsalz; Perchlorate vermeiden',
      },
    ],
    conditions: {
      temperature: '0–25 °C',
      duration: '3–8 h',
      solvent: 'Methanol',
      apparatus: 'ungeteilte Zelle, Graphit- oder Platinanode, Rührung',
      workup: 'Methanol abziehen, in Ether aufnehmen, filtrieren',
      purification: 'Destillation oder Chromatographie',
      monitoring: 'GC – das Produkt ist deutlich polarer als das Edukt',
    },
    electro: {
      cellType: 'ungeteilt',
      anode: 'Graphit oder Platin',
      cathode: 'Platin oder Edelstahl (dort entsteht Wasserstoff)',
      electrolyte: 'Methanol mit Tetraalkylammoniumsalz (0,05–0,1 M)',
      mode: 'galvanostatisch',
      currentDensity: '10–30 mA/cm²',
      charge: '2,2–2,5 F/mol',
      faradaicEfficiency: '60–90 %',
      electrons: 2,
    },
    procedure: [
      {
        title: 'Zelle vorbereiten',
        detail: 'Substrat und Leitsalz in Methanol lösen und in die ungeteilte Zelle geben.',
      },
      {
        title: 'Elektrolysieren',
        detail: 'Bei konstanter Stromstärke elektrolysieren, bis 2,2 F/mol geflossen sind; dabei kühlen und rühren.',
        caution: 'Wasserstoffentwicklung an der Kathode – Zelle offen betreiben.',
      },
      {
        title: 'Aufarbeiten',
        detail: 'Methanol am Rotationsverdampfer entfernen, Rückstand in Ether aufnehmen, Leitsalz abfiltrieren.',
      },
      {
        title: 'Weiterverwenden',
        detail:
          'Das α-Methoxyamid mit einer Lewis-Säure (TiCl₄, BF₃) aktivieren und mit Nucleophilen (Allylsilan, Enolether) umsetzen.',
        tip: 'Das Methoxyderivat ist lagerfähig – das instabile N-Acyliminiumion wird erst bei Bedarf erzeugt.',
      },
    ],
    mechanism: {
      type: 'Anodische Oxidation über N-Acyliminiumion',
      summary:
        'Das Stickstoffatom wird zum Radikalkation oxidiert. Verlust eines α-Protons und ein weiteres Elektron liefern das N-Acyliminiumion, das Methanol abfängt.',
      steps: [
        {
          title: '1. Bildung des Radikalkations',
          description:
            'Die Anode entzieht dem Stickstoff ein Elektron. Das Carbonyl senkt die Elektronendichte, deshalb sind höhere Potentiale nötig als bei freien Aminen.',
          electronFlow: 'Freies Elektronenpaar des Stickstoffs → Anode.',
          intermediate: 'Aminium-Radikalkation',
          relativeEnergy: 100,
          rateDetermining: true,
        },
        {
          title: '2. Verlust eines α-Protons',
          description: 'Das acide α-Wasserstoffatom wird abgegeben; es entsteht ein α-Aminoalkylradikal.',
          electronFlow: 'C–H-Bindungselektronen → Radikalzentrum am Stickstoff.',
          relativeEnergy: 45,
        },
        {
          title: '3. Zweite Oxidation zum Acyliminiumion',
          description: 'Das Radikal wird erneut oxidiert; es bildet sich das elektrophile N-Acyliminiumion.',
          electronFlow: 'Elektron → Anode.',
          intermediate: 'N-Acyliminiumion',
          relativeEnergy: 55,
        },
        {
          title: '4. Angriff des Methanols',
          rxnSmiles: 'O=C(OC)N1CCCC1>>O=C(OC)N1CCCC1OC',
          description: 'Methanol addiert an das Iminiumkohlenstoffatom; nach Deprotonierung liegt das α-Methoxyamid vor.',
          electronFlow: 'Elektronenpaar des Methanolsauerstoffs → Iminiumkohlenstoff.',
          relativeEnergy: -110,
        },
      ],
      stereochemistry:
        'Das planare Acyliminiumion wird in der Folgechemie diastereoselektiv angegriffen, wenn benachbarte Stereozentren vorhanden sind.',
      competingPathways:
        'Freie Amine werden bereits bei viel niedrigerem Potential oxidiert und müssen deshalb als Carbamat oder Amid geschützt vorliegen.',
    },
    safety: {
      ghs: ['GHS02', 'GHS07'],
      hazards: ['Methanol ist giftig (H301+H311+H331).', 'Wasserstoffentwicklung an der Kathode.'],
      precautions: [
        'Zelle offen betreiben und ausreichend kühlen.',
        'Keine Perchlorat-Leitsalze verwenden – Explosionsgefahr beim Eindampfen.',
      ],
      ppe: ['Schutzbrille', 'Handschuhe', 'Laborkittel', 'Abzug'],
      waste: 'Methanolhaltige Lösungen getrennt sammeln.',
      level: 'Fortgeschritten',
    },
    typicalYield: '60–90 %',
    scale: ['Laborsynthese', 'Wirkstoffentwicklung'],
    keywords: ['Shono', 'Acyliminium', 'C-H-Funktionalisierung', 'Elektrosynthese'],
    references: [
      { title: 'Shono et al., J. Am. Chem. Soc. 1975, 97, 4264', source: 'Originalarbeit' },
      {
        title: 'Recent Developments in Shono-Type Oxidation',
        source: 'ACS Electrochemistry',
        url: 'https://pubs.acs.org/aeclc7/article/2/1/14/5087301/Recent-Developments-in-Shono-Type-Oxidation',
      },
    ],
  },
  {
    id: 'baizer-hydrodimerisierung',
    name: 'Baizer-Prozess: kathodische Hydrodimerisierung von Acrylnitril',
    aliases: ['Adipodinitril-Elektrosynthese', 'Monsanto-Prozess'],
    category: 'elektrochemie',
    reactionType: 'Kathodische Reduktion (Hydrodimerisierung)',
    summary:
      'Die größte organische Elektrosynthese der Welt: Acrylnitril wird kathodisch zu Adipodinitril gekuppelt, der Vorstufe von Hexamethylendiamin für Nylon-6,6. Jahresproduktion über 300.000 Tonnen.',
    smirks:
      '[CX3;H2:1]=[CX3:2][CX2:3]#[NX1:4].[CX3;H2:5]=[CX3:6][CX2:7]#[NX1:8]>>[NX1:4]#[CX2:3][CH2:2][CH2:1][CH2:5][CH2:6][CX2:7]#[NX1:8]',
    reactantDefaults: ['C=CC#N', 'C=CC#N'],
    substrateSlots: [0, 1],
    functionalGroups: ['nitril', 'alken'],
    generalEquation: '2 CH₂=CH–CN + 2 H₂O + 2 e⁻ → NC–(CH₂)₄–CN + 2 OH⁻',
    example: {
      substrate: 'C=CC#N',
      rxnSmiles: 'C=CC#N.C=CC#N>>N#CCCCCC#N',
      caption: 'Zwei Moleküle Acrylnitril werden zu Adipodinitril hydrodimerisiert.',
    },
    reagents: [
      { name: 'Acrylnitril', role: 'Reagenz', equivalents: '2,0 Äq.' },
      {
        name: 'Tetraethylammonium-p-toluolsulfonat',
        role: 'Leitsalz',
        note: 'lagert sich an der Kathode an und verdrängt Wasser – unterdrückt die Wasserstoffentwicklung',
      },
      { name: 'Wasser', role: 'Reagenz', note: 'Protonenquelle' },
      { name: 'Dinatriumhydrogenphosphat', role: 'Elektrolyt', note: 'Puffer' },
    ],
    conditions: {
      temperature: '50–60 °C',
      duration: 'kontinuierlicher Betrieb',
      solvent: 'Wasser (Emulsion mit Acrylnitril)',
      apparatus: 'ungeteilte Plattenstapelzelle mit engem Elektrodenabstand (ca. 2 mm)',
      workup: 'Phasentrennung, Extraktion',
      purification: 'mehrstufige Destillation',
      monitoring: 'Stromausbeute und Selektivität online',
    },
    electro: {
      cellType: 'ungeteilt (moderne Anlagen), früher geteilt',
      anode: 'Kohlenstoffstahl mit Magnetitschicht',
      cathode: 'Cadmium oder Blei – hohe Wasserstoffüberspannung ist entscheidend',
      electrolyte: 'wässrige Emulsion mit quartärem Ammoniumsalz, pH 8–9',
      mode: 'galvanostatisch',
      currentDensity: '200–2000 mA/cm²',
      charge: '2 F/mol Adipodinitril',
      faradaicEfficiency: '88–92 %',
      mediator: 'kein Mediator – direkte Elektronenübertragung',
      electrons: 2,
    },
    procedure: [
      {
        title: 'Emulsion herstellen',
        detail: 'Acrylnitril mit der wässrigen Leitsalzlösung zu einer feinen Emulsion verrühren.',
        caution: 'Acrylnitril ist krebserzeugend, giftig und leichtentzündlich – nur im geschlossenen System.',
      },
      {
        title: 'Kathode wählen',
        detail:
          'Elektrode mit hoher Wasserstoffüberspannung (Cd, Pb, Hg-frei: verbleite Stähle) einsetzen, sonst dominiert die Wasserstoffentwicklung.',
      },
      {
        title: 'Elektrolysieren',
        detail: 'Bei hoher Stromdichte und engem Elektrodenabstand kontinuierlich elektrolysieren, Temperatur regeln.',
      },
      {
        title: 'Produkt abtrennen',
        detail: 'Organische Phase abtrennen, Adipodinitril destillativ von Propionitril und Oligomeren befreien.',
      },
    ],
    mechanism: {
      type: 'Radikalanionen-Kupplung',
      summary:
        'An der Kathode entsteht aus Acrylnitril ein Radikalanion. Zwei dieser Teilchen kuppeln am β-Kohlenstoff; die entstehende Dicarbanion-Spezies wird von Wasser protoniert.',
      steps: [
        {
          title: '1. Kathodische Einelektronenreduktion',
          rxnSmiles: 'C=CC#N>>[CH2-][CH]C#N',
          description:
            'Das Elektron tritt in das π*-Orbital des Acrylnitrils ein. Die Nitrilgruppe stabilisiert die negative Ladung – deshalb gelingt die Reduktion bei moderatem Potential (ca. −1,9 V).',
          electronFlow: 'Elektron von der Kathode → π*-Orbital der C=C-Bindung.',
          intermediate: 'Radikalanion',
          relativeEnergy: 80,
          rateDetermining: true,
        },
        {
          title: '2. Kupplung zweier Radikalanionen',
          description:
            'Zwei Radikalanionen verbinden sich mit ihren radikalischen β-Kohlenstoffatomen. Das quartäre Ammoniumsalz hält Acrylnitril in Kathodennähe angereichert.',
          electronFlow: 'Zwei ungepaarte Elektronen bilden die neue C–C-Bindung.',
          intermediate: 'Dianion',
          relativeEnergy: 30,
        },
        {
          title: '3. Protonierung',
          rxnSmiles: 'C=CC#N.C=CC#N>>N#CCCCCC#N',
          description: 'Wasser protoniert beide carbanionischen Zentren; Hydroxidionen bleiben zurück.',
          electronFlow: 'Carbanion-Elektronenpaare → Protonen des Wassers.',
          relativeEnergy: -150,
        },
      ],
      competingPathways:
        'Einfache Hydrierung zu Propionitril und Oligomerisierung sind die Hauptnebenreaktionen. Das Leitsalz und die hohe Stromdichte drängen beide zurück; ohne sie überwiegt die Wasserstoffentwicklung.',
    },
    safety: {
      ghs: ['GHS02', 'GHS06', 'GHS08', 'GHS09'],
      hazards: [
        'Acrylnitril ist krebserzeugend (H350), giftig (H301+H311+H331) und leichtentzündlich (H225).',
        'Cadmiumelektroden sind hochgiftig und umweltgefährlich.',
      ],
      precautions: [
        'Nur im geschlossenen System mit Absaugung.',
        'Diese Reaktion ist ein Industrieverfahren – im Laborpraktikum nicht nachzustellen.',
      ],
      ppe: ['Vollschutz', 'Atemschutz bei Wartung', 'geschlossene Anlage'],
      waste: 'Cyanid- und cadmiumhaltige Abfälle streng getrennt entsorgen.',
      level: 'Nur Fachlabor',
    },
    typicalYield: '88–92 % Stromausbeute, > 95 % Selektivität',
    scale: ['Industrie'],
    keywords: ['Baizer', 'Adipodinitril', 'Nylon', 'Hydrodimerisierung', 'Radikalanion'],
    references: [
      { title: 'Baizer, J. Electrochem. Soc. 1964, 111, 215', source: 'Originalarbeit' },
      { title: 'Frontiers in Chemistry: Electrochemical organic reactions – a tutorial review', source: 'Front. Chem. 2022, 10, 956502', url: 'https://www.frontiersin.org/journals/chemistry/articles/10.3389/fchem.2022.956502/full' },
    ],
  },
  {
    id: 'tempo-anodische-oxidation',
    name: 'Mediierte anodische Alkoholoxidation (TEMPO)',
    category: 'elektrochemie',
    reactionType: 'Mediierte anodische Oxidation',
    summary:
      'TEMPO wird an der Anode zum Oxoammoniumion oxidiert und überträgt die Oxidation auf den Alkohol. Der Mediator wird laufend regeneriert – so ersetzt Strom das stöchiometrische Oxidationsmittel vollständig.',
    smirks: '[CX4;H2:1][OX2H1:2]>>[CX3;H1:1]=[OX1:2]',
    reactantDefaults: ['OCc1ccccc1'],
    substrateSlots: [0],
    functionalGroups: ['alkohol_prim', 'alkohol_sek'],
    generalEquation: 'R–CH₂OH →(TEMPO⁺/Anode) R–CHO + 2 H⁺ + 2 e⁻',
    example: {
      substrate: 'OCc1ccccc1',
      rxnSmiles: 'OCc1ccccc1>>O=Cc1ccccc1',
      caption: 'Benzylalkohol wird elektrochemisch zu Benzaldehyd oxidiert – ohne Chrom und ohne Hypochlorit.',
    },
    reagents: [
      { name: 'Alkohol', role: 'Reagenz', equivalents: '1,0 Äq.' },
      { name: 'TEMPO', role: 'Mediator', equivalents: '0,05–0,1 Äq.' },
      { name: '2,6-Lutidin', role: 'Base', equivalents: '2 Äq.' },
      { name: 'Natriumperchlorat oder LiClO₄-freie Alternative', role: 'Leitsalz', equivalents: '0,1 M' },
      { name: 'Acetonitril/Wasser', role: 'Lösungsmittel' },
    ],
    conditions: {
      temperature: 'Raumtemperatur',
      duration: '3–8 h',
      solvent: 'Acetonitril/Wasser 9:1',
      apparatus: 'ungeteilte Zelle, Graphitanode, Platin- oder Edelstahlkathode',
      workup: 'Extraktion',
      purification: 'Chromatographie oder Destillation',
      monitoring: 'DC/GC',
    },
    electro: {
      cellType: 'ungeteilt',
      anode: 'Graphit oder Glaskohlenstoff',
      cathode: 'Platin oder Edelstahl',
      electrolyte: 'MeCN/H₂O mit 0,1 M Leitsalz und Base',
      mode: 'galvanostatisch',
      currentDensity: '5–15 mA/cm²',
      potential: 'ca. +0,6 bis +0,8 V gegen Ag/AgCl (Redoxpotential des TEMPO)',
      charge: '2,2 F/mol (Aldehyd) bzw. 4,4 F/mol (Carbonsäure)',
      faradaicEfficiency: '70–95 %',
      mediator: 'TEMPO / Oxoammoniumion',
      electrons: 2,
    },
    procedure: [
      { title: 'Ansatz', detail: 'Alkohol, TEMPO, Base und Leitsalz in MeCN/Wasser lösen.' },
      {
        title: 'Elektrolysieren',
        detail: 'Bei konstanter Stromstärke elektrolysieren, bis 2,2 F/mol geflossen sind.',
        tip: 'Im Basischen bleibt die Oxidation beim Aldehyd stehen; im Sauren und mit mehr Ladung entsteht die Carbonsäure.',
      },
      { title: 'Aufarbeiten', detail: 'Mit Wasser verdünnen, extrahieren, trocknen und einengen.' },
    ],
    mechanism: {
      type: 'Mediierte Oxidation (Redox-Katalyse)',
      summary:
        'Die Anode oxidiert nicht den Alkohol selbst, sondern den Mediator. Das Oxoammoniumion reagiert chemisch mit dem Alkohol und wird anschließend elektrochemisch regeneriert.',
      steps: [
        {
          title: '1. Anodische Oxidation des TEMPO',
          description:
            'Das Nitroxylradikal gibt ein Elektron ab; es entsteht das Oxoammoniumion – das eigentliche Oxidationsmittel.',
          electronFlow: 'Elektron vom Stickstoff-Sauerstoff-Radikal → Anode.',
          intermediate: 'Oxoammoniumion',
          relativeEnergy: 50,
        },
        {
          title: '2. Bildung des Alkoxy-Adduktes',
          description: 'Der deprotonierte Alkohol addiert an das Oxoammoniumion.',
          electronFlow: 'Elektronenpaar des Alkoholats → Stickstoff.',
          relativeEnergy: 35,
        },
        {
          title: '3. Hydridabstraktion',
          rxnSmiles: 'OCc1ccccc1>>O=Cc1ccccc1',
          description:
            'Über einen cyclischen Übergangszustand wird das α-Wasserstoffatom übertragen; der Aldehyd entsteht, TEMPO-H bleibt zurück.',
          electronFlow: 'C–H-Bindungselektronen → Stickstoff; C=O-Bindung entsteht.',
          relativeEnergy: 60,
          rateDetermining: true,
        },
        {
          title: '4. Regeneration des Mediators',
          description: 'Das Hydroxylamin wird an der Anode wieder zum Nitroxylradikal oxidiert – der Kreis schließt sich.',
          electronFlow: 'Elektronen → Anode.',
          relativeEnergy: -100,
        },
      ],
      competingPathways:
        'Sekundäre Alkohole reagieren langsamer als primäre – daraus ergibt sich eine nützliche Chemoselektivität.',
    },
    safety: {
      ghs: ['GHS02', 'GHS07'],
      hazards: [
        'Acetonitril ist leichtentzündlich und giftig (H225, H302+H312+H332).',
        'Perchlorat-Leitsalze bilden beim Eindampfen explosive Rückstände – besser Tetrafluoroborate verwenden.',
      ],
      precautions: ['Trockene Perchloratrückstände strikt vermeiden.', 'Zelle belüften.'],
      ppe: ['Schutzbrille', 'Handschuhe', 'Laborkittel', 'Abzug'],
      waste: 'Organische Lösungen getrennt sammeln.',
      level: 'Fortgeschritten',
    },
    typicalYield: '70–95 %',
    scale: ['Laborsynthese', 'Industrie'],
    keywords: ['TEMPO', 'Mediator', 'grüne Chemie', 'Oxoammonium'],
    references: [
      { title: 'Semmelhack et al., J. Am. Chem. Soc. 1983, 105, 4492', source: 'Originalarbeit' },
    ],
  },
  {
    id: 'kathodische-nitroreduktion',
    name: 'Kathodische Reduktion von Nitroaromaten',
    category: 'elektrochemie',
    reactionType: 'Kathodische Reduktion',
    summary:
      'Über das Kathodenpotential lässt sich die Reduktionstiefe gezielt einstellen: Hydroxylamin, Amin oder – im stark sauren Milieu – über die Bamberger-Umlagerung p-Aminophenol.',
    smirks: '[c:1][NX3+:2](=[OX1])[OX1-]>>[c:1][NX3;H2+0:2]',
    reactantDefaults: ['[O-][N+](=O)c1ccccc1'],
    substrateSlots: [0],
    functionalGroups: ['nitro', 'aromat'],
    generalEquation: 'Ar–NO₂ + 6 H⁺ + 6 e⁻ → Ar–NH₂ + 2 H₂O',
    example: {
      substrate: '[O-][N+](=O)c1ccccc1',
      rxnSmiles: '[O-][N+](=O)c1ccccc1>>Nc1ccccc1',
      caption: 'Nitrobenzol wird an der Kathode zu Anilin reduziert – ohne Eisenschlamm.',
    },
    reagents: [
      { name: 'Nitroaromat', role: 'Reagenz', equivalents: '1,0 Äq.' },
      { name: 'Schwefelsäure (10–20 %)', role: 'Elektrolyt', note: 'Protonenquelle' },
      { name: 'Ethanol', role: 'Lösungsmittel', note: 'Löslichkeitsvermittler' },
    ],
    conditions: {
      temperature: '25–60 °C',
      duration: '4–10 h',
      solvent: 'Ethanol/Schwefelsäure',
      apparatus: 'geteilte Zelle mit Kationenaustauschermembran',
      workup: 'Alkalisch stellen und extrahieren',
      purification: 'Destillation',
      monitoring: 'Ladungsmenge und Cyclovoltammetrie',
    },
    electro: {
      cellType: 'geteilt (Nafion-Membran) – verhindert die Rückoxidation an der Anode',
      anode: 'Platin oder bleidioxidbeschichtetes Titan',
      cathode: 'Blei, Kupfer oder Glaskohlenstoff (hohe Wasserstoffüberspannung)',
      electrolyte: 'verdünnte Schwefelsäure in Ethanol/Wasser',
      mode: 'potentiostatisch',
      potential: '−0,6 V (Hydroxylamin) bis −1,2 V gegen Ag/AgCl (Amin)',
      currentDensity: '20–100 mA/cm²',
      charge: '6 F/mol für das Amin, 4 F/mol für das Hydroxylamin',
      faradaicEfficiency: '60–90 %',
      electrons: 6,
    },
    procedure: [
      {
        title: 'Zelle aufbauen',
        detail: 'Geteilte Zelle mit Membran bestücken; Katholyt und Anolyt getrennt befüllen.',
      },
      {
        title: 'Potential einstellen',
        detail:
          'Mit Referenzelektrode potentiostatisch arbeiten. Bei −0,6 V bleibt die Reduktion beim Hydroxylamin stehen, bei −1,1 V läuft sie bis zum Amin.',
        tip: 'Vorab ein Cyclovoltammogramm aufnehmen, um die Stufen zu finden.',
      },
      { title: 'Elektrolysieren', detail: 'Bis zur berechneten Ladungsmenge (6 F/mol) elektrolysieren.' },
      {
        title: 'Aufarbeiten',
        detail: 'Katholyt alkalisch stellen, Amin extrahieren oder mit Wasserdampf destillieren.',
      },
    ],
    mechanism: {
      type: 'Stufenweise Elektronen-Protonen-Übertragung',
      summary:
        'Drei aufeinanderfolgende Zwei-Elektronen-Schritte führen über Nitroso- und Hydroxylaminstufe zum Amin. Jede Stufe hat ein eigenes Potential – daher die gute Steuerbarkeit.',
      steps: [
        {
          title: '1. Nitro → Nitroso (2 e⁻, 2 H⁺)',
          rxnSmiles: '[O-][N+](=O)c1ccccc1>>O=Nc1ccccc1',
          description: 'Erste Zwei-Elektronen-Reduktion unter Wasserabspaltung.',
          electronFlow: 'Elektronen von der Kathode → Stickstoff.',
          relativeEnergy: -50,
        },
        {
          title: '2. Nitroso → Hydroxylamin (2 e⁻, 2 H⁺)',
          rxnSmiles: 'O=Nc1ccccc1>>ONc1ccccc1',
          description: 'Das Nitrosobenzol wird leichter reduziert als das Edukt und reichert sich kaum an.',
          electronFlow: 'Elektronen → N=O-π*-Orbital.',
          relativeEnergy: -55,
        },
        {
          title: '3. Hydroxylamin → Amin (2 e⁻, 2 H⁺)',
          rxnSmiles: 'ONc1ccccc1>>Nc1ccccc1',
          description:
            'Die letzte N–O-Bindung wird gespalten. Dieser Schritt verlangt das negativste Potential.',
          electronFlow: 'Elektronen → N–O-σ*-Orbital.',
          relativeEnergy: -40,
          rateDetermining: true,
        },
      ],
      competingPathways:
        'In konzentrierter Schwefelsäure lagert das Hydroxylamin nach Bamberger zu p-Aminophenol um – technisch genutzt zur Paracetamol-Vorstufe. Konkurrenzreaktion ist immer die Wasserstoffentwicklung.',
    },
    safety: {
      ghs: ['GHS02', 'GHS06', 'GHS08'],
      hazards: [
        'Nitroaromaten und Aniline sind giftig und hautgängig.',
        'Wasserstoffentwicklung an der Kathode.',
      ],
      precautions: ['Geteilte Zelle belüften.', 'Hautkontakt vermeiden.'],
      ppe: ['Schutzbrille', 'doppelte Handschuhe', 'Laborkittel', 'Abzug'],
      waste: 'Aminhaltige Lösungen als Sondermüll.',
      level: 'Nur Fachlabor',
    },
    typicalYield: '65–90 %',
    scale: ['Laborsynthese', 'Industrie'],
    keywords: ['Kathode', 'Nitroreduktion', 'Bamberger', 'p-Aminophenol', 'Potentialkontrolle'],
    references: [
      { title: 'Frontiers in Chemistry, Electrochemical organic reactions: a tutorial review', source: 'Front. Chem. 2022, 10, 956502' },
    ],
  },
  {
    id: 'elektrochemische-pinakolkupplung',
    name: 'Elektrochemische Pinakolkupplung',
    category: 'elektrochemie',
    reactionType: 'Kathodische Reduktion (reduktive Dimerisierung)',
    summary:
      'Zwei Carbonylverbindungen werden kathodisch zu Ketylradikalen reduziert, die zum 1,2-Diol (Pinakol) kuppeln. Elektrochemisch gelingt das ohne Metallabfall wie bei der klassischen Magnesium-Variante.',
    smirks: '[CX3:1]=[OX1:2].[CX3:3]=[OX1:4]>>[CX4:1]([OX2H1:2])[CX4:3][OX2H1:4]',
    reactantDefaults: ['CC(C)=O', 'CC(C)=O'],
    substrateSlots: [0, 1],
    functionalGroups: ['keton', 'aldehyd'],
    generalEquation: '2 R₂C=O + 2 H⁺ + 2 e⁻ → R₂C(OH)–C(OH)R₂',
    example: {
      substrate: 'CC(C)=O',
      rxnSmiles: 'CC(C)=O.CC(C)=O>>CC(C)(O)C(C)(C)O',
      caption: 'Aus zwei Molekülen Aceton entsteht Pinakol (2,3-Dimethylbutan-2,3-diol).',
    },
    reagents: [
      { name: 'Keton oder Aldehyd', role: 'Reagenz', equivalents: '2,0 Äq.' },
      { name: 'Tetrabutylammoniumbromid', role: 'Leitsalz', equivalents: '0,1 M' },
      { name: 'Essigsäure oder Ammoniumchlorid', role: 'Säure', note: 'Protonenquelle' },
      { name: 'Isopropanol/Wasser', role: 'Lösungsmittel' },
    ],
    conditions: {
      temperature: '10–30 °C',
      duration: '4–8 h',
      solvent: 'Isopropanol/Wasser',
      apparatus: 'geteilte oder ungeteilte Zelle mit Opferanode (Magnesium)',
      workup: 'Extraktion',
      purification: 'Umkristallisieren – Pinakol kristallisiert als Hexahydrat',
    },
    electro: {
      cellType: 'ungeteilt mit Opferanode',
      anode: 'Magnesium oder Zink (Opferanode – löst sich auf)',
      cathode: 'Blei, Zink oder Glaskohlenstoff',
      electrolyte: 'Isopropanol/Wasser mit Tetraalkylammoniumsalz',
      mode: 'galvanostatisch',
      currentDensity: '10–40 mA/cm²',
      charge: '1 F/mol Keton (2 F/mol Diol)',
      faradaicEfficiency: '50–85 %',
      electrons: 1,
    },
    procedure: [
      { title: 'Zelle bestücken', detail: 'Opferanode und Kathode einsetzen, Elektrolyt mit Substrat befüllen.' },
      {
        title: 'Elektrolysieren',
        detail: 'Bei konstantem Strom arbeiten, bis 1 F/mol Carbonylverbindung geflossen ist.',
        caution: 'Die Opferanode verbraucht sich – Materialabtrag kontrollieren.',
      },
      { title: 'Aufarbeiten', detail: 'Metallsalze abfiltrieren, extrahieren und das Diol umkristallisieren.' },
      {
        title: 'Weiterreaktion (optional)',
        detail: 'Mit Säure lässt sich das Pinakol zur Pinakolon-Umlagerung nutzen.',
      },
    ],
    mechanism: {
      type: 'Ketylradikal-Kupplung',
      summary:
        'Das Carbonyl nimmt ein Elektron auf und wird zum Ketylradikalanion. Zwei dieser Radikale verbinden sich an den Kohlenstoffatomen; nach Protonierung liegt das Diol vor.',
      steps: [
        {
          title: '1. Bildung des Ketylradikalanions',
          rxnSmiles: 'CC(C)=O>>C[C](C)[O-]',
          description: 'Ein Elektron tritt in das π*-Orbital der Carbonylgruppe ein.',
          electronFlow: 'Elektron von der Kathode → C=O-π*-Orbital.',
          intermediate: 'Ketylradikalanion',
          relativeEnergy: 85,
          rateDetermining: true,
        },
        {
          title: '2. C–C-Kupplung',
          description: 'Zwei Ketylradikale verbinden sich über ihre Kohlenstoffatome zum Dialkoholat.',
          electronFlow: 'Zwei ungepaarte Elektronen bilden die C–C-Bindung.',
          relativeEnergy: 20,
        },
        {
          title: '3. Protonierung',
          rxnSmiles: 'CC(C)=O.CC(C)=O>>CC(C)(O)C(C)(C)O',
          description: 'Beide Alkoholate nehmen Protonen auf; das Pinakol ist fertig.',
          electronFlow: 'Elektronenpaare der Alkoholate → Protonen.',
          relativeEnergy: -140,
        },
      ],
      competingPathways:
        'Bei zu negativem Potential wird weiter zum Alkohol reduziert; aromatische Ketone kuppeln besonders gut, weil ihre Ketylradikale mesomeriestabilisiert sind.',
    },
    safety: {
      ghs: ['GHS02', 'GHS07'],
      hazards: ['Wasserstoffentwicklung möglich.', 'Ketone und Isopropanol sind leichtentzündlich.'],
      precautions: ['Zelle belüften.', 'Keine Zündquellen.'],
      ppe: ['Schutzbrille', 'Handschuhe', 'Laborkittel', 'Abzug'],
      waste: 'Metallsalzhaltige Abfälle gesondert sammeln.',
      level: 'Fortgeschritten',
    },
    typicalYield: '45–80 %',
    scale: ['Laborsynthese'],
    keywords: ['Pinakol', 'Ketylradikal', 'Opferanode', 'reduktive Kupplung'],
    references: [
      { title: 'Fry, Synthetic Organic Electrochemistry, Wiley', source: 'Monographie' },
    ],
  },
  {
    id: 'anodische-methoxylierung-furan',
    name: 'Anodische Methoxylierung von Furan',
    aliases: ['BASF-Verfahren für 2,5-Dimethoxy-2,5-dihydrofuran'],
    category: 'elektrochemie',
    reactionType: 'Anodische Addition',
    summary:
      'Furan wird anodisch oxidiert und von Methanol in 2,5-Stellung addiert. Das Produkt ist Ausgangsstoff für Maleinaldehyd und wird technisch im Tonnenmaßstab elektrochemisch hergestellt.',
    substrateSmarts: ['c1ccoc1'],
    functionalGroups: ['aromat', 'ether'],
    generalEquation: 'Furan + 2 CH₃OH → 2,5-Dimethoxy-2,5-dihydrofuran + 2 H⁺ + 2 e⁻',
    example: {
      substrate: 'c1ccoc1',
      rxnSmiles: 'c1ccoc1.CO.CO>>COC1C=CC(OC)O1',
      caption: 'Furan und Methanol ergeben 2,5-Dimethoxy-2,5-dihydrofuran.',
    },
    reagents: [
      { name: 'Furan', role: 'Reagenz', equivalents: '1,0 Äq.' },
      { name: 'Methanol', role: 'Lösungsmittel', note: 'zugleich Nucleophil' },
      { name: 'Natriumbromid', role: 'Mediator', equivalents: '0,05 Äq.', note: 'bildet anodisch Brom als Mediator' },
    ],
    conditions: {
      temperature: '0–20 °C',
      duration: '4–8 h',
      solvent: 'Methanol',
      apparatus: 'ungeteilte Zelle mit Kohleelektroden',
      workup: 'Neutralisieren, Methanol abdestillieren',
      purification: 'Vakuumdestillation',
    },
    electro: {
      cellType: 'ungeteilt',
      anode: 'Graphit',
      cathode: 'Edelstahl',
      electrolyte: 'Methanol mit Natriumbromid',
      mode: 'galvanostatisch',
      currentDensity: '20–60 mA/cm²',
      charge: '2,0–2,4 F/mol',
      faradaicEfficiency: '80–95 %',
      mediator: 'Bromid/Brom – indirekte Elektrolyse',
      electrons: 2,
    },
    procedure: [
      { title: 'Elektrolyt ansetzen', detail: 'Furan und Natriumbromid in Methanol lösen, auf 0–10 °C kühlen.' },
      {
        title: 'Elektrolysieren',
        detail: 'Bei konstanter Stromstärke elektrolysieren, bis etwa 2,2 F/mol geflossen sind.',
        caution: 'Furan ist leichtentzündlich und krebsverdächtig.',
      },
      { title: 'Aufarbeiten', detail: 'Mit Natriumcarbonat neutralisieren, Methanol abziehen und im Vakuum destillieren.' },
    ],
    mechanism: {
      type: 'Indirekte anodische Oxidation über Brom',
      summary:
        'An der Anode entsteht aus Bromid elementares Brom, das Furan im Lösungsraum angreift. Methanol substituiert die Bromide – der Mediator wird zurückgewonnen.',
      steps: [
        {
          title: '1. Anodische Bromidoxidation',
          description: 'Bromid gibt Elektronen ab; es bildet sich Brom bzw. Hypobromit als Mediator.',
          electronFlow: 'Elektronen vom Bromid → Anode.',
          relativeEnergy: 55,
        },
        {
          title: '2. Addition an Furan',
          description: 'Brom addiert an das elektronenreiche Furan; ein Bromoniumion entsteht und wird von Methanol geöffnet.',
          electronFlow: 'π-Elektronen des Furans → Brom.',
          relativeEnergy: 40,
          rateDetermining: true,
        },
        {
          title: '3. Substitution durch Methanol',
          rxnSmiles: 'c1ccoc1.CO.CO>>COC1C=CC(OC)O1',
          description:
            'Methanol ersetzt beide Bromide in 2- und 5-Stellung; Bromid kehrt in den Kreislauf zurück.',
          electronFlow: 'Elektronenpaar des Methanolsauerstoffs → Ringkohlenstoff.',
          relativeEnergy: -95,
        },
      ],
      competingPathways:
        'Ohne Mediator gelingt die direkte anodische Oxidation ebenfalls, benötigt aber ein höheres Potential und liefert mehr Nebenprodukte.',
    },
    safety: {
      ghs: ['GHS02', 'GHS07', 'GHS08'],
      hazards: ['Furan ist hochentzündlich und krebserzeugend (H224, H350).', 'Methanol ist giftig.'],
      precautions: ['Gekühlt und im geschlossenen System arbeiten.', 'Bromdämpfe vermeiden.'],
      ppe: ['Schutzbrille', 'Handschuhe', 'Laborkittel', 'Abzug'],
      waste: 'Bromidhaltige Lösungen mit Thiosulfat behandeln.',
      level: 'Nur Fachlabor',
    },
    typicalYield: '75–90 %',
    scale: ['Industrie'],
    keywords: ['Mediator', 'indirekte Elektrolyse', 'Furan', 'BASF'],
    references: [
      { title: 'Steckhan, Angew. Chem. 1986, 98, 681', source: 'Übersichtsartikel zu Mediatoren' },
    ],
  },
  {
    id: 'elektrocarboxylierung',
    name: 'Elektrocarboxylierung mit CO₂',
    category: 'elektrochemie',
    reactionType: 'Kathodische Reduktion mit CO₂-Fixierung',
    summary:
      'Organische Halogenide werden kathodisch reduziert und fangen Kohlenstoffdioxid ab. So wird CO₂ als C1-Baustein genutzt – etwa bei der Synthese von Ibuprofen-Vorstufen.',
    smirks: '[c:1][Br,Cl,I]>>[c:1][CX3](=[OX1])[OX2H1]',
    reactantDefaults: ['Brc1ccccc1'],
    substrateSlots: [0],
    functionalGroups: ['arylhalogenid', 'halogenalkan_sek', 'halogenalkan_prim'],
    generalEquation: 'R–X + CO₂ + 2 e⁻ → R–COO⁻ + X⁻',
    example: {
      substrate: 'Brc1ccccc1',
      rxnSmiles: 'Brc1ccccc1>>OC(=O)c1ccccc1',
      caption: 'Brombenzol wird unter CO₂-Atmosphäre zu Benzoesäure carboxyliert.',
    },
    reagents: [
      { name: 'Organisches Halogenid', role: 'Reagenz', equivalents: '1,0 Äq.' },
      { name: 'Kohlenstoffdioxid', formula: 'CO2', role: 'Reagenz', equivalents: 'gesättigt (1 bar)' },
      { name: 'Tetrabutylammoniumtetrafluoroborat', role: 'Leitsalz', equivalents: '0,1 M' },
      { name: 'DMF oder Acetonitril', role: 'Lösungsmittel', note: 'wasserfrei – Wasser würde nur H₂ liefern' },
    ],
    conditions: {
      temperature: '0–25 °C',
      duration: '4–12 h',
      solvent: 'trockenes DMF',
      atmosphere: 'CO₂ (kontinuierlich eingeleitet)',
      apparatus: 'ungeteilte Zelle mit Magnesium- oder Aluminium-Opferanode',
      workup: 'Ansäuern und extrahieren',
      purification: 'Umkristallisieren',
    },
    electro: {
      cellType: 'ungeteilt mit Opferanode',
      anode: 'Magnesium oder Aluminium (Opferanode)',
      cathode: 'Silber, Kupfer oder Glaskohlenstoff – Silber senkt das nötige Potential deutlich',
      electrolyte: 'DMF mit 0,1 M Tetraalkylammoniumsalz, CO₂-gesättigt',
      mode: 'galvanostatisch',
      currentDensity: '5–20 mA/cm²',
      potential: '−1,8 bis −2,4 V gegen Ag/AgCl',
      charge: '2–3 F/mol',
      faradaicEfficiency: '40–80 %',
      electrons: 2,
    },
    procedure: [
      {
        title: 'Elektrolyt sättigen',
        detail: 'Trockenes DMF mit Leitsalz vorlegen und 30 min CO₂ einleiten.',
        tip: 'Wasserfreies Arbeiten ist entscheidend – schon Spuren Wasser senken die Stromausbeute stark.',
      },
      { title: 'Substrat zugeben', detail: 'Halogenid zugeben und unter CO₂-Strom elektrolysieren.' },
      {
        title: 'Elektrolysieren',
        detail: 'Bei konstantem Strom arbeiten, bis 2,5 F/mol geflossen sind.',
        caution: 'CO₂ ist erstickend – Abzug und Gasableitung sicherstellen.',
      },
      { title: 'Aufarbeiten', detail: 'Mit verdünnter Salzsäure ansäuern, extrahieren und die Säure umkristallisieren.' },
    ],
    mechanism: {
      type: 'Radikalanion mit CO₂-Insertion',
      summary:
        'Das Halogenid nimmt ein Elektron auf und zerfällt zum Radikal. Ein zweites Elektron liefert das Carbanion, das an CO₂ addiert.',
      steps: [
        {
          title: '1. Dissoziative Elektronenaufnahme',
          description: 'Das Radikalanion zerfällt sofort in Halogenid und organisches Radikal.',
          electronFlow: 'Elektron von der Kathode → C–X-σ*-Orbital.',
          intermediate: 'Aryl- bzw. Alkylradikal',
          relativeEnergy: 90,
          rateDetermining: true,
        },
        {
          title: '2. Zweite Reduktion zum Carbanion',
          description: 'Das Radikal nimmt an der Elektrode ein weiteres Elektron auf.',
          electronFlow: 'Elektron → Radikalzentrum.',
          intermediate: 'Carbanion',
          relativeEnergy: 50,
        },
        {
          title: '3. Addition an CO₂',
          rxnSmiles: 'Brc1ccccc1>>OC(=O)c1ccccc1',
          description:
            'Das Carbanion greift das elektrophile Kohlenstoffatom des CO₂ an; es entsteht das Carboxylat, das beim Ansäuern zur Säure wird.',
          electronFlow: 'Carbanion-Elektronenpaar → CO₂-Kohlenstoff; π-Elektronen → Sauerstoff.',
          relativeEnergy: -130,
        },
      ],
      competingPathways:
        'Protonierung des Carbanions durch Restwasser (liefert das Aren) und direkte CO₂-Reduktion zu Formiat oder CO sind die Hauptkonkurrenzreaktionen.',
    },
    safety: {
      ghs: ['GHS04', 'GHS07', 'GHS08'],
      hazards: ['DMF ist reproduktionstoxisch (H360D).', 'CO₂ wirkt erstickend.'],
      precautions: ['Abzug und Gasableitung.', 'Keine geschlossenen Systeme unter CO₂-Druck.'],
      ppe: ['Schutzbrille', 'Handschuhe', 'Laborkittel', 'Abzug'],
      waste: 'DMF-haltige Abfälle getrennt sammeln.',
      level: 'Nur Fachlabor',
    },
    typicalYield: '40–80 %',
    scale: ['Laborsynthese', 'Industrie'],
    keywords: ['CO2-Nutzung', 'Opferanode', 'Carboxylierung', 'grüne Chemie'],
    references: [
      {
        title: 'The Future of Electro-organic Synthesis in Drug Discovery',
        source: 'ACS Org. Inorg. Au 2024',
        url: 'https://pubs.acs.org/doi/10.1021/acsorginorgau.4c00068',
      },
    ],
  },
];
