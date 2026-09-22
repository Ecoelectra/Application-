/**
 * Anorganische und technische Verfahren.
 *
 * Diese Reaktionen werden nicht über SMILES beschrieben, sondern über feste,
 * bereits ausgeglichene Gleichungen (`fixedEquation`). Die App erkennt sie
 * anhand der Summenformel des eingegebenen Stoffes.
 */
import type { ReactionRule } from '../types';

export const INORGANIC_REACTIONS: ReactionRule[] = [
  {
    id: 'chloralkali-elektrolyse',
    name: 'Chloralkali-Elektrolyse (Membranverfahren)',
    aliases: ['Chlor-Alkali-Elektrolyse', 'NaCl-Elektrolyse'],
    category: 'elektrochemie',
    reactionType: 'Elektrolyse wässriger Lösung',
    summary:
      'Aus Steinsalzlösung entstehen gleichzeitig Chlor, Natronlauge und Wasserstoff. Das Membranverfahren hat Amalgam- und Diaphragmaverfahren weitgehend abgelöst, weil es ohne Quecksilber und Asbest auskommt.',
    functionalGroups: [],
    generalEquation: '2 NaCl + 2 H₂O → Cl₂ + H₂ + 2 NaOH',
    fixedEquation: {
      reactants: ['NaCl', 'H2O'],
      products: ['Cl2', 'H2', 'NaOH'],
      balanced: '2 NaCl + 2 H₂O → Cl₂ ↑ + H₂ ↑ + 2 NaOH',
    },
    reagents: [
      { name: 'Natriumchlorid-Sole (ca. 25 %)', formula: 'NaCl', role: 'Reagenz' },
      { name: 'Wasser', formula: 'H2O', role: 'Reagenz' },
      { name: 'Kationenaustauschermembran (Nafion)', role: 'Elektrolyt', note: 'lässt nur Na⁺ passieren' },
    ],
    conditions: {
      temperature: '80–90 °C',
      pressure: 'Normaldruck',
      solvent: 'Wasser',
      apparatus: 'Membranzelle mit Titananode (DSA) und Nickelkathode',
      workup: 'Chlor trocknen und verflüssigen, Natronlauge aufkonzentrieren',
      monitoring: 'Zellspannung, Stromausbeute, Chloridgehalt der Lauge',
    },
    electro: {
      cellType: 'geteilt durch Kationenaustauschermembran',
      anode: 'Titan mit Ruthenium-/Iridiumoxid-Beschichtung (dimensionsstabile Anode)',
      cathode: 'Nickel oder Nickel mit Aktivbeschichtung',
      electrolyte: 'gesättigte, gereinigte NaCl-Sole (Anolyt) / verdünnte NaOH (Katholyt)',
      mode: 'galvanostatisch',
      currentDensity: '300–600 mA/cm²',
      potential: 'Zellspannung 2,9–3,2 V (thermodynamisch 2,19 V + Überspannungen + IR)',
      charge: '2 F je Mol Cl₂',
      faradaicEfficiency: '95–98 %',
      electrons: 2,
    },
    procedure: [
      {
        title: 'Sole reinigen',
        detail:
          'Die Rohsole wird von Calcium-, Magnesium- und Sulfationen befreit (Fällung mit Soda und Natronlauge, danach Ionentauscher). Härtebildner würden die Membran zerstören.',
        tip: 'Die Solereinigung bestimmt maßgeblich die Lebensdauer der Membran.',
      },
      {
        title: 'Zelle betreiben',
        detail:
          'Sole in den Anodenraum, verdünnte Natronlauge in den Kathodenraum leiten. Natriumionen wandern durch die Membran zur Kathode.',
      },
      {
        title: 'Produkte abführen',
        detail:
          'An der Anode entsteht Chlorgas, an der Kathode Wasserstoff und Hydroxidionen. Die Lauge verlässt die Zelle mit ca. 32 % NaOH.',
        caution: 'Chlor und Wasserstoff dürfen sich niemals mischen – Chlorknallgas ist explosionsfähig.',
      },
      {
        title: 'Aufbereiten',
        detail:
          'Chlor kühlen, trocknen (Schwefelsäure) und verflüssigen; Natronlauge auf 50 % eindampfen; Wasserstoff als Energieträger nutzen.',
      },
    ],
    mechanism: {
      type: 'Elektrodenreaktionen mit Ionentransport',
      summary:
        'An der Anode werden Chloridionen oxidiert, an der Kathode Wasser reduziert. Die Membran trennt beide Räume und lässt nur Natriumionen durch – deshalb bleibt die Lauge chloridarm.',
      steps: [
        {
          title: 'Anode (Oxidation)',
          description:
            '2 Cl⁻ → Cl₂ + 2 e⁻ (E° = +1,36 V). Obwohl Wasser thermodynamisch leichter oxidierbar wäre (+1,23 V), entsteht wegen der hohen Sauerstoffüberspannung an der DSA-Beschichtung fast ausschließlich Chlor.',
          electronFlow: 'Elektronen vom Chlorid → Anode → äußerer Stromkreis.',
          relativeEnergy: 131,
          rateDetermining: true,
        },
        {
          title: 'Ionenwanderung durch die Membran',
          description:
            'Na⁺ wandert mit seiner Hydrathülle durch die sulfonierte Polymermembran in den Kathodenraum. Chlorid und Hydroxid werden zurückgehalten.',
          electronFlow: 'Kein Elektronenfluss – reiner Ionentransport zur Ladungsbilanz.',
          relativeEnergy: 0,
        },
        {
          title: 'Kathode (Reduktion)',
          description:
            '2 H₂O + 2 e⁻ → H₂ + 2 OH⁻ (E° = −0,83 V). Natrium wird in wässriger Lösung nicht abgeschieden, weil Wasser viel leichter reduzierbar ist.',
          electronFlow: 'Elektronen von der Kathode → Wassermoleküle.',
          relativeEnergy: -80,
        },
      ],
      competingPathways:
        'Sauerstoffentwicklung an der Anode und Rückvermischung von Hydroxid in den Anolyten senken die Stromausbeute; beides wird über Beschichtung, pH-Wert und Membranqualität begrenzt.',
    },
    safety: {
      ghs: ['GHS03', 'GHS05', 'GHS06', 'GHS09'],
      hazards: [
        'Chlor ist giftig beim Einatmen (H331) und stark ätzend für die Atemwege.',
        'Wasserstoff ist hochentzündlich (H220); Chlorknallgas reagiert explosionsartig unter Lichteinfluss.',
        'Natronlauge verursacht schwere Verätzungen (H314).',
      ],
      precautions: [
        'Gasräume strikt getrennt halten und auf Dichtheit überwachen.',
        'Chlorgaswarnanlage und Notfallabsorber (Natronlauge) vorhalten.',
      ],
      ppe: ['Vollschutz', 'Atemschutz bei Wartung', 'geschlossene Anlage'],
      waste: 'Abgase über Natronlauge absorbieren; verbrauchte Sole aufbereiten.',
      level: 'Nur Fachlabor',
    },
    typicalYield: '95–98 % Stromausbeute',
    scale: ['Industrie'],
    keywords: ['Chlor', 'Natronlauge', 'Membranverfahren', 'Überspannung', 'DSA'],
    references: [
      { title: 'Ullmann’s Encyclopedia: Chlorine', source: 'Wiley-VCH' },
      { title: 'Hollemann-Wiberg, Lehrbuch der Anorganischen Chemie', source: 'de Gruyter' },
    ],
    thermodynamics: {
      note:
        'Zersetzungsspannung 2,19 V; in der Praxis 2,9–3,2 V. Spezifischer Energiebedarf etwa 2,3–2,6 kWh je kg Chlor.',
    },
  },
  {
    id: 'wasserelektrolyse',
    name: 'Wasserelektrolyse',
    aliases: ['alkalische Elektrolyse', 'PEM-Elektrolyse', 'grüner Wasserstoff'],
    category: 'elektrochemie',
    reactionType: 'Elektrolyse',
    summary:
      'Wasser wird in Wasserstoff und Sauerstoff zerlegt. Mit Strom aus erneuerbaren Quellen ist das der zentrale Baustein für grünen Wasserstoff und Power-to-X.',
    functionalGroups: [],
    generalEquation: '2 H₂O → 2 H₂ + O₂',
    fixedEquation: {
      reactants: ['H2O'],
      products: ['H2', 'O2'],
      balanced: '2 H₂O → 2 H₂ ↑ + O₂ ↑',
    },
    reagents: [
      { name: 'Wasser (deionisiert)', formula: 'H2O', role: 'Reagenz' },
      { name: 'Kalilauge (20–30 %)', formula: 'KOH', role: 'Elektrolyt', note: 'alkalische Elektrolyse' },
      { name: 'Protonenaustauschermembran', role: 'Elektrolyt', note: 'PEM-Variante, arbeitet ohne Lauge' },
    ],
    conditions: {
      temperature: '60–90 °C (alkalisch), 50–80 °C (PEM)',
      pressure: '1–30 bar',
      solvent: 'Wasser',
      apparatus: 'Elektrolyseur mit Gasabscheidern',
      monitoring: 'Zellspannung, Gasreinheit, Wirkungsgrad',
    },
    electro: {
      cellType: 'geteilt (Diaphragma bzw. Membran)',
      anode: 'Nickel/Nickeloxid (alkalisch) oder Iridiumoxid auf Titan (PEM)',
      cathode: 'Nickel oder Platin auf Kohlenstoff',
      electrolyte: '25 % KOH oder Festpolymermembran',
      mode: 'galvanostatisch',
      currentDensity: '200–800 mA/cm² (alkalisch), bis 2000 mA/cm² (PEM)',
      potential: 'Zellspannung 1,8–2,1 V (thermodynamisch 1,23 V)',
      charge: '2 F je Mol H₂',
      faradaicEfficiency: '> 99 %',
      electrons: 2,
    },
    procedure: [
      {
        title: 'Wasser aufbereiten',
        detail: 'Vollentsalztes Wasser einsetzen; Fremdionen vergiften die Katalysatoren und die Membran.',
      },
      {
        title: 'Elektrolyseur starten',
        detail: 'Zelle auf Betriebstemperatur bringen und die Stromdichte langsam hochfahren.',
        caution: 'Wasserstoff und Sauerstoff im Verhältnis 2:1 ergeben Knallgas – Gasräume strikt trennen.',
      },
      {
        title: 'Gase abtrennen',
        detail: 'Wasserstoff und Sauerstoff in getrennten Abscheidern vom Elektrolyt befreien und trocknen.',
      },
      {
        title: 'Wirkungsgrad prüfen',
        detail:
          'Spannungswirkungsgrad = 1,23 V / Zellspannung. Bei 1,9 V liegt er bei etwa 65 %; bezogen auf den Heizwert rechnet man mit 50–55 kWh je kg Wasserstoff.',
      },
    ],
    mechanism: {
      type: 'Elektrodenreaktionen mit Überspannung',
      summary:
        'Die Wasserstoffentwicklung an der Kathode ist kinetisch einfach, die Sauerstoffentwicklung an der Anode benötigt dagegen eine hohe Überspannung – sie bestimmt den Energiebedarf.',
      steps: [
        {
          title: 'Kathode: Wasserstoffentwicklung (HER)',
          description:
            'Im Alkalischen: 2 H₂O + 2 e⁻ → H₂ + 2 OH⁻. Der Volmer-Heyrovsky- bzw. Volmer-Tafel-Mechanismus läuft über adsorbierten Wasserstoff.',
          electronFlow: 'Elektronen von der Kathode → Wasserstoffatome.',
          relativeEnergy: -40,
        },
        {
          title: 'Anode: Sauerstoffentwicklung (OER)',
          description:
            '4 OH⁻ → O₂ + 2 H₂O + 4 e⁻. Vier Elektronen und vier Protonen müssen übertragen werden; die Überspannung beträgt 0,3–0,4 V und verursacht den größten Teil der Verluste.',
          electronFlow: 'Elektronen von Hydroxid/Wasser → Anode.',
          relativeEnergy: 120,
          rateDetermining: true,
        },
      ],
      competingPathways:
        'Gasübertritt durch das Diaphragma senkt die Reinheit und kann zu gefährlichen Gemischen führen – besonders im Teillastbetrieb.',
      productEnergy: 237,
    },
    safety: {
      ghs: ['GHS02', 'GHS03', 'GHS05'],
      hazards: [
        'Wasserstoff ist hochentzündlich, das Gemisch mit Luft ist von 4 bis 77 % explosionsfähig (H220).',
        'Sauerstoff wirkt stark brandfördernd (H270).',
        'Kalilauge ist stark ätzend (H314).',
      ],
      precautions: [
        'Explosionsschutz, Gaswarnanlage, keine Zündquellen.',
        'Anlage vor dem Start inertisieren.',
      ],
      ppe: ['Schutzbrille', 'Laugenschutzhandschuhe', 'antistatische Kleidung'],
      waste: 'Verbrauchten Elektrolyt neutralisieren.',
      level: 'Fortgeschritten',
    },
    typicalYield: '> 99 % Stromausbeute; Energiewirkungsgrad 60–75 %',
    scale: ['Schulversuch', 'Industrie'],
    keywords: ['Wasserstoff', 'Hofmann-Apparat', 'Überspannung', 'Power-to-X', 'PEM'],
    references: [
      { title: 'Ullmann’s Encyclopedia: Hydrogen', source: 'Wiley-VCH' },
    ],
    thermodynamics: {
      deltaH: 286,
      note:
        'ΔH = +286 kJ/mol, ΔG = +237 kJ/mol je Mol H₂. Daraus folgen die Zersetzungsspannung 1,23 V und die thermoneutrale Spannung 1,48 V.',
    },
  },
  {
    id: 'hall-heroult',
    name: 'Schmelzflusselektrolyse von Aluminium (Hall-Héroult)',
    category: 'elektrochemie',
    reactionType: 'Schmelzflusselektrolyse',
    summary:
      'Aluminiumoxid wird in geschmolzenem Kryolith gelöst und elektrolytisch zerlegt. Das Verfahren verbraucht etwa 13–15 kWh je kg Aluminium und ist damit einer der größten industriellen Stromverbraucher.',
    functionalGroups: [],
    generalEquation: '2 Al₂O₃ + 3 C → 4 Al + 3 CO₂',
    fixedEquation: {
      reactants: ['Al2O3', 'C'],
      products: ['Al', 'CO2'],
      balanced: '2 Al₂O₃ + 3 C → 4 Al + 3 CO₂ ↑',
    },
    reagents: [
      { name: 'Aluminiumoxid', formula: 'Al2O3', role: 'Reagenz', note: 'aus Bauxit über das Bayer-Verfahren' },
      {
        name: 'Kryolith',
        formula: 'Na3AlF6',
        role: 'Lösungsmittel',
        note: 'senkt den Schmelzpunkt von 2045 °C auf etwa 950 °C',
      },
      { name: 'Kohlenstoffanoden', formula: 'C', role: 'Reagenz', note: 'werden verbraucht' },
    ],
    conditions: {
      temperature: '940–980 °C',
      solvent: 'Kryolithschmelze',
      apparatus: 'Elektrolysewanne mit Kohlenstoffauskleidung',
      workup: 'Flüssiges Aluminium absaugen',
      monitoring: 'Tonerdegehalt (Anodeneffekt vermeiden)',
    },
    electro: {
      cellType: 'ungeteilt',
      anode: 'vorgebackene Kohlenstoffanoden (Verbrauch ca. 0,4 kg je kg Al)',
      cathode: 'Kohlenstoffauskleidung der Wanne; flüssiges Aluminium bildet die eigentliche Kathode',
      electrolyte: 'Na₃AlF₆-Schmelze mit 2–8 % Al₂O₃ und CaF₂-Zusatz',
      mode: 'galvanostatisch',
      currentDensity: '700–1000 mA/cm²',
      potential: 'Zellspannung 4,0–4,5 V bei 150–500 kA Zellstrom',
      charge: '3 F je Mol Al',
      faradaicEfficiency: '92–96 %',
      electrons: 3,
    },
    procedure: [
      {
        title: 'Tonerde zugeben',
        detail: 'Aluminiumoxid laufend in die Schmelze dosieren, damit der Gehalt bei 2–4 % bleibt.',
        tip: 'Sinkt der Gehalt zu stark, tritt der Anodeneffekt auf: die Spannung springt auf über 30 V und es bilden sich klimaschädliche Perfluorkohlenstoffe.',
      },
      {
        title: 'Elektrolysieren',
        detail: 'Bei 950 °C mit hohem Strom elektrolysieren. Flüssiges Aluminium sammelt sich am Wannenboden.',
        caution: 'Kontakt von Schmelze mit Wasser führt zu Dampfexplosionen.',
      },
      { title: 'Metall absaugen', detail: 'Das Aluminium regelmäßig mit einem Saugheber entnehmen.' },
      { title: 'Anoden wechseln', detail: 'Die abgebrannten Kohleanoden turnusmäßig ersetzen.' },
    ],
    mechanism: {
      type: 'Schmelzelektrolyse mit reagierender Anode',
      summary:
        'In der Schmelze liegen komplexe Aluminium-Fluorid-Oxid-Ionen vor. Kathodisch wird Aluminium abgeschieden, anodisch wird Sauerstoff frei, der sofort mit dem Kohlenstoff der Anode zu CO₂ reagiert.',
      steps: [
        {
          title: 'Kathode: Aluminiumabscheidung',
          description: 'Al³⁺ (als Fluoridkomplex) + 3 e⁻ → Al(l). Das flüssige Metall sammelt sich als Schicht am Boden.',
          electronFlow: 'Elektronen von der Kathode → Aluminiumspezies.',
          relativeEnergy: -100,
        },
        {
          title: 'Anode: Sauerstoffentwicklung',
          description: '2 O²⁻ → O₂ + 4 e⁻. Der entstehende Sauerstoff ist bei 950 °C extrem reaktiv.',
          electronFlow: 'Elektronen vom Oxid → Anode.',
          relativeEnergy: 140,
          rateDetermining: true,
        },
        {
          title: 'Verbrennung der Anode',
          description:
            'C + O₂ → CO₂. Weil der Kohlenstoff mitreagiert, sinkt die nötige Zersetzungsspannung von 2,2 V auf etwa 1,2 V – dafür wird die Anode verbraucht.',
          electronFlow: 'Chemische Folgereaktion ohne Elektrodenbeteiligung.',
          relativeEnergy: -390,
        },
      ],
      competingPathways:
        'Rücklösung von Aluminium in der Schmelze und Bildung von CO senken die Stromausbeute auf etwa 94 %.',
    },
    safety: {
      ghs: ['GHS05', 'GHS07'],
      hazards: [
        'Schmelze bei 950 °C – schwere Verbrennungen.',
        'Fluoridhaltige Stäube und Gase sind giftig.',
        'Beim Anodeneffekt entstehen CF₄ und C₂F₆ mit extrem hohem Treibhauspotential.',
      ],
      precautions: ['Feuchtigkeit fernhalten.', 'Abgasreinigung mit Tonerde-Trockenwäsche.'],
      ppe: ['Hitzeschutzkleidung', 'Gesichtsschutz', 'Atemschutz'],
      waste: 'Fluoridhaltige Stäube zurückführen; Ofenausbruch als Sondermüll.',
      level: 'Nur Fachlabor',
    },
    typicalYield: '92–96 % Stromausbeute',
    scale: ['Industrie'],
    keywords: ['Aluminium', 'Kryolith', 'Schmelzfluss', 'Anodeneffekt', 'Energiebedarf'],
    references: [
      { title: 'Hall, US-Patent 400664 (1889); Héroult, FR-Patent 175711 (1886)', source: 'Patente' },
    ],
    thermodynamics: {
      note: 'Praktischer Energiebedarf 13–15 kWh/kg Al; Recycling benötigt nur etwa 5 % davon.',
    },
  },
  {
    id: 'kupferraffination',
    name: 'Elektrolytische Kupferraffination',
    category: 'elektrochemie',
    reactionType: 'Elektrolyse mit löslicher Anode',
    summary:
      'Rohkupfer wird als Anode aufgelöst und an der Kathode als hochreines Kupfer (99,99 %) wieder abgeschieden. Edelmetalle sammeln sich im Anodenschlamm – ihr Verkauf finanziert einen erheblichen Teil des Verfahrens.',
    functionalGroups: [],
    generalEquation: 'Cu(Anode) → Cu²⁺ + 2 e⁻ ; Cu²⁺ + 2 e⁻ → Cu(Kathode)',
    fixedEquation: {
      reactants: ['Cu'],
      products: ['Cu'],
      balanced: 'Cu(roh) → Cu(rein) – Stofftransport von der Anode zur Kathode',
    },
    reagents: [
      { name: 'Rohkupfer (Anodenkupfer, 99 %)', formula: 'Cu', role: 'Reagenz' },
      { name: 'Kupfersulfatlösung', formula: 'CuSO4', role: 'Elektrolyt' },
      { name: 'Schwefelsäure', formula: 'H2SO4', role: 'Elektrolyt', note: 'erhöht die Leitfähigkeit' },
    ],
    conditions: {
      temperature: '55–65 °C',
      solvent: 'Wasser',
      apparatus: 'Elektrolysewannen mit abwechselnd Anoden- und Kathodenblechen',
      duration: '7–14 Tage je Kathodenzyklus',
      monitoring: 'Zellspannung, Kupfergehalt, Anodenschlammanfall',
    },
    electro: {
      cellType: 'ungeteilt',
      anode: 'Rohkupferplatte (löst sich auf)',
      cathode: 'dünnes Kupferstartblech oder Edelstahl',
      electrolyte: '40 g/L Cu²⁺ in 150–200 g/L H₂SO₄',
      mode: 'galvanostatisch',
      currentDensity: '20–30 mA/cm²',
      potential: 'nur 0,2–0,3 V – es wird kein Stoff zersetzt, nur transportiert',
      charge: '2 F je Mol Cu',
      faradaicEfficiency: '94–97 %',
      electrons: 2,
    },
    procedure: [
      { title: 'Anoden gießen', detail: 'Rohkupfer zu Anodenplatten gießen und in die Zelle hängen.' },
      {
        title: 'Elektrolyse',
        detail:
          'Mit niedriger Spannung elektrolysieren. Unedle Begleitmetalle (Fe, Zn, Ni) gehen in Lösung, bleiben aber gelöst; edlere (Ag, Au, Pt) fallen als Anodenschlamm zu Boden.',
        tip: 'Die Trennung beruht direkt auf der elektrochemischen Spannungsreihe.',
      },
      { title: 'Kathoden ernten', detail: 'Nach 7–14 Tagen die Kathoden entnehmen, waschen und einschmelzen.' },
      { title: 'Anodenschlamm aufarbeiten', detail: 'Silber, Gold und Platinmetalle aus dem Schlamm gewinnen.' },
    ],
    mechanism: {
      type: 'Elektrodenreaktionen nach der Spannungsreihe',
      summary:
        'Anodische Auflösung und kathodische Abscheidung desselben Metalls laufen parallel. Die Selektivität ergibt sich aus den Standardpotentialen der Begleitmetalle.',
      steps: [
        {
          title: 'Anode: Auflösung',
          description:
            'Cu → Cu²⁺ + 2 e⁻ (E° = +0,34 V). Unedlere Metalle lösen sich ebenfalls, edlere nicht – sie fallen als Schlamm ab.',
          electronFlow: 'Elektronen vom Kupfer → Anode.',
          relativeEnergy: 33,
        },
        {
          title: 'Kathode: Abscheidung',
          description:
            'Cu²⁺ + 2 e⁻ → Cu. Bei der geringen Zellspannung werden Fe²⁺, Ni²⁺ und Zn²⁺ nicht mitabgeschieden, weil ihre Potentiale deutlich negativer liegen.',
          electronFlow: 'Elektronen von der Kathode → Kupferionen.',
          relativeEnergy: -33,
          rateDetermining: true,
        },
      ],
      competingPathways:
        'Steigt die Stromdichte zu stark, wird die Abscheidung unselektiv und das Kupfer wächst dendritisch – dann drohen Kurzschlüsse zwischen den Blechen.',
    },
    safety: {
      ghs: ['GHS05', 'GHS07', 'GHS09'],
      hazards: [
        'Schwefelsäurehaltiger Elektrolyt ist ätzend (H314).',
        'Kupfersalze sind umweltgefährlich (H410).',
        'Bei der Arsen-haltigen Anodenqualität kann Arsenwasserstoff entstehen.',
      ],
      precautions: ['Säurenebel absaugen.', 'Elektrolyt auf Arsengehalt überwachen.'],
      ppe: ['Schutzbrille', 'Säureschutzhandschuhe', 'Schürze'],
      waste: 'Kupferhaltige Lösungen als Schwermetallabfall; Anodenschlamm verwerten.',
      level: 'Laborpraktikum',
    },
    typicalYield: '99,99 % Reinheit',
    scale: ['Schulversuch', 'Industrie'],
    keywords: ['Raffination', 'Anodenschlamm', 'Spannungsreihe', 'lösliche Anode'],
    references: [{ title: 'Ullmann’s Encyclopedia: Copper', source: 'Wiley-VCH' }],
  },
  {
    id: 'galvanisieren',
    name: 'Galvanisches Abscheiden (Vernickeln, Verkupfern, Verzinken)',
    aliases: ['Galvanik', 'Elektroplattieren'],
    category: 'elektrochemie',
    reactionType: 'Elektrolytische Metallabscheidung',
    summary:
      'Ein Werkstück wird als Kathode geschaltet und mit einer dünnen Metallschicht überzogen – für Korrosionsschutz, Verschleißfestigkeit oder Dekoration. Die Schichtdicke folgt direkt aus dem Faradayschen Gesetz.',
    functionalGroups: [],
    generalEquation: 'Ni²⁺ + 2 e⁻ → Ni (Kathode); Ni → Ni²⁺ + 2 e⁻ (Anode)',
    fixedEquation: {
      // Lösliche Anode: Nickel wird anodisch gelöst und kathodisch wieder abgeschieden.
      reactants: ['Ni'],
      products: ['Ni'],
      balanced: 'Anode: Ni → Ni²⁺ + 2 e⁻  |  Kathode: Ni²⁺ + 2 e⁻ → Ni',
    },
    reagents: [
      { name: 'Nickelsulfat', formula: 'NiSO4', role: 'Elektrolyt', note: '240–300 g/L' },
      { name: 'Nickelchlorid', formula: 'NiCl2', role: 'Elektrolyt', note: '40 g/L, verbessert die Anodenauflösung' },
      { name: 'Borsäure', formula: 'H3BO3', role: 'Elektrolyt', note: '30–40 g/L als Puffer (Watts-Bad)' },
      { name: 'Glanzbildner (Saccharin, Cumarin)', role: 'Katalysator', note: 'steuert Kornwachstum und Glanz' },
    ],
    conditions: {
      temperature: '45–60 °C',
      solvent: 'Wasser',
      apparatus: 'Galvanikbecken mit Gleichrichter, Nickelanoden in Titankörben',
      duration: 'je nach Schichtdicke, typisch 15–60 min',
      workup: 'Spülen, trocknen, ggf. passivieren',
      monitoring: 'pH 3,5–4,5, Stromdichte, Badanalyse',
    },
    electro: {
      cellType: 'ungeteilt',
      anode: 'Nickel (lösliche Anode)',
      cathode: 'das zu beschichtende Werkstück',
      electrolyte: 'Watts-Bad (NiSO₄/NiCl₂/H₃BO₃), pH 4',
      mode: 'galvanostatisch',
      currentDensity: '20–80 mA/cm²',
      charge: '2 F je Mol Ni',
      faradaicEfficiency: '93–98 %',
      electrons: 2,
    },
    procedure: [
      {
        title: 'Vorbehandeln',
        detail:
          'Entfetten, beizen und dekapieren. Eine unsaubere Oberfläche ist die häufigste Ursache für abplatzende Schichten.',
        tip: 'Der Wassertest hilft: Ein gleichmäßiger Wasserfilm zeigt eine fettfreie Oberfläche an.',
      },
      {
        title: 'Bad ansetzen',
        detail: 'Watts-Bad ansetzen, auf 50 °C erwärmen und den pH-Wert auf 4,0 einstellen.',
      },
      {
        title: 'Beschichten',
        detail:
          'Werkstück als Kathode einhängen und bei gewählter Stromdichte beschichten. Die Zeit ergibt sich aus m = (I·t·M)/(z·F) und der gewünschten Schichtdicke.',
        caution: 'Nickelsalze sind sensibilisierend und krebsverdächtig – Aerosole vermeiden.',
      },
      {
        title: 'Nachbehandeln',
        detail: 'Gründlich spülen, trocknen und je nach Anwendung mit Chromatierung oder Versiegelung nachbehandeln.',
      },
    ],
    mechanism: {
      type: 'Metallabscheidung mit Keimbildung und Kristallwachstum',
      summary:
        'Das hydratisierte Metallion wandert zur Kathode, verliert seine Hydrathülle, wird entladen und in das Kristallgitter eingebaut. Glanzbildner blockieren Wachstumsstellen und erzeugen feinkörnige Schichten.',
      steps: [
        {
          title: '1. Transport und Entladung',
          description: 'Ni²⁺ diffundiert zur Kathode und nimmt zwei Elektronen auf.',
          electronFlow: 'Elektronen von der Kathode → Nickelion.',
          relativeEnergy: -25,
          rateDetermining: true,
        },
        {
          title: '2. Keimbildung und Einbau',
          description:
            'Das Adatom wandert über die Oberfläche zu einer Stufe oder Halbkristalllage und wird dort ins Gitter eingebaut.',
          electronFlow: 'Metallische Bindung entsteht.',
          relativeEnergy: -60,
        },
      ],
      competingPathways:
        'Wasserstoffentwicklung senkt die Stromausbeute und kann zur Wasserstoffversprödung führen. Zu hohe Stromdichte erzeugt raue, dendritische Schichten („Anbrennen").',
    },
    safety: {
      ghs: ['GHS07', 'GHS08', 'GHS09'],
      hazards: [
        'Nickelsalze sind sensibilisierend und krebsverdächtig (H317, H351).',
        'Saure Bäder sind ätzend; bei Chrombädern kommt Chrom(VI) hinzu.',
      ],
      precautions: ['Badabsaugung.', 'Hautkontakt vermeiden.', 'Nickelallergie beachten.'],
      ppe: ['Schutzbrille', 'Handschuhe', 'Schürze', 'Absaugung'],
      waste: 'Metallhaltige Spülwässer über Ionentauscher oder Fällung behandeln.',
      level: 'Laborpraktikum',
    },
    typicalYield: '93–98 % Stromausbeute',
    scale: ['Schulversuch', 'Industrie'],
    keywords: ['Galvanik', 'Faraday', 'Schichtdicke', 'Korrosionsschutz', 'Watts-Bad'],
    references: [{ title: 'Ullmann’s Encyclopedia: Electroplating', source: 'Wiley-VCH' }],
  },
  {
    id: 'haber-bosch',
    name: 'Haber-Bosch-Verfahren',
    aliases: ['Ammoniaksynthese'],
    category: 'technisch',
    reactionType: 'Heterogen katalysierte Gleichgewichtsreaktion',
    summary:
      'Stickstoff und Wasserstoff reagieren an einem Eisenkatalysator zu Ammoniak. Das Verfahren ernährt einen Großteil der Weltbevölkerung und verbraucht etwa 1–2 % der weltweiten Primärenergie.',
    functionalGroups: [],
    generalEquation: 'N₂ + 3 H₂ ⇌ 2 NH₃  (ΔH = −92 kJ/mol)',
    fixedEquation: {
      reactants: ['N2', 'H2'],
      products: ['NH3'],
      balanced: 'N₂ + 3 H₂ ⇌ 2 NH₃',
    },
    reagents: [
      { name: 'Stickstoff', formula: 'N2', role: 'Reagenz', note: 'aus der Luftzerlegung' },
      { name: 'Wasserstoff', formula: 'H2', role: 'Reagenz', note: 'aus Erdgas-Dampfreformierung oder Elektrolyse' },
      {
        name: 'Eisenkatalysator mit Al₂O₃/K₂O-Promotoren',
        formula: 'Fe',
        role: 'Katalysator',
        note: 'aus Magnetit reduziert',
      },
    ],
    conditions: {
      temperature: '400–500 °C',
      pressure: '150–300 bar',
      apparatus: 'Hochdruckreaktor mit Kreislaufführung und Ammoniakabscheider',
      monitoring: 'Umsatz je Durchgang nur 15–20 % – nicht umgesetztes Gas wird zurückgeführt',
    },
    procedure: [
      {
        title: 'Synthesegas bereitstellen',
        detail:
          'Wasserstoff aus Dampfreformierung (oder Elektrolyse) und Stickstoff aus der Luftzerlegung im Verhältnis 3:1 mischen und von Katalysatorgiften (Schwefel, CO) befreien.',
        caution: 'Kohlenmonoxid vergiftet den Eisenkatalysator irreversibel.',
      },
      {
        title: 'Verdichten',
        detail: 'Das Gasgemisch auf 200–300 bar verdichten.',
      },
      {
        title: 'Reaktion führen',
        detail:
          'Über den Eisenkatalysator bei 450 °C leiten. Die Temperatur ist ein Kompromiss: Das Gleichgewicht bevorzugt die Kälte, die Kinetik die Wärme.',
        tip: 'Nach Le Chatelier verschiebt hoher Druck das Gleichgewicht zur Seite der geringeren Teilchenzahl – also zum Ammoniak.',
      },
      {
        title: 'Ammoniak abtrennen',
        detail:
          'Das Produkt auskondensieren (NH₃ siedet bei −33 °C) und das nicht umgesetzte Gas in den Kreislauf zurückführen. So werden insgesamt über 95 % Umsatz erreicht.',
      },
    ],
    mechanism: {
      type: 'Heterogene Katalyse mit dissoziativer Adsorption',
      summary:
        'Die Spaltung der sehr stabilen N≡N-Dreifachbindung (941 kJ/mol) an der Eisenoberfläche ist der geschwindigkeitsbestimmende Schritt. Anschließend wird der Stickstoff schrittweise hydriert.',
      steps: [
        {
          title: '1. Adsorption',
          description: 'N₂ und H₂ adsorbieren an der Eisenoberfläche.',
          electronFlow: 'Wechselwirkung der Molekülorbitale mit den d-Orbitalen des Eisens.',
          relativeEnergy: -30,
        },
        {
          title: '2. Dissoziation des Stickstoffs',
          description:
            'Die N≡N-Bindung wird gespalten – der langsamste Schritt. Die Eisenoberfläche senkt die Aktivierungsenergie von etwa 941 kJ/mol auf rund 230 kJ/mol.',
          electronFlow: 'Elektronendichte des Eisens → antibindendes π*-Orbital des N₂.',
          relativeEnergy: 200,
          rateDetermining: true,
        },
        {
          title: '3. Schrittweise Hydrierung',
          description: 'N(ads) → NH → NH₂ → NH₃: adsorbierte Wasserstoffatome werden nacheinander übertragen.',
          electronFlow: 'Oberflächengebundene Elektronen bilden die N–H-Bindungen.',
          relativeEnergy: -60,
        },
        {
          title: '4. Desorption',
          description: 'Ammoniak löst sich von der Oberfläche und gibt den aktiven Platz wieder frei.',
          electronFlow: 'Bindung zur Oberfläche wird gelöst.',
          relativeEnergy: -92,
        },
      ],
      competingPathways:
        'Die Rückreaktion gewinnt bei hoher Temperatur an Bedeutung; deshalb ist die Kreislaufführung mit Zwischenabscheidung entscheidend.',
    },
    safety: {
      ghs: ['GHS02', 'GHS04', 'GHS05', 'GHS06', 'GHS09'],
      hazards: [
        'Ammoniak ist giftig beim Einatmen und stark ätzend (H331, H314).',
        'Wasserstoff ist hochentzündlich; die Anlage steht unter sehr hohem Druck.',
      ],
      precautions: ['Druckführende Teile regelmäßig prüfen.', 'Gaswarnanlage für NH₃ und H₂.'],
      ppe: ['geschlossene Anlage', 'Atemschutz bei Wartung'],
      waste: 'Ammoniakhaltige Abgase in Säure absorbieren.',
      level: 'Nur Fachlabor',
    },
    typicalYield: '15–20 % je Durchgang, > 95 % im Kreislauf',
    scale: ['Industrie'],
    keywords: ['Ammoniak', 'Gleichgewicht', 'Le Chatelier', 'Katalyse', 'Düngemittel'],
    references: [
      { title: 'Appl, Ammonia: Principles and Industrial Practice', source: 'Wiley-VCH' },
      { title: 'Nobelpreise 1918 (Haber) und 1931 (Bosch)', source: 'Historisch' },
    ],
    thermodynamics: {
      deltaH: -92,
      deltaG: -33,
      note: 'Exotherm und entropisch ungünstig (4 → 2 Teilchen): tiefe Temperatur und hoher Druck begünstigen das Produkt.',
    },
  },
  {
    id: 'ostwald-verfahren',
    name: 'Ostwald-Verfahren (Salpetersäure)',
    category: 'technisch',
    reactionType: 'Katalytische Oxidation',
    summary:
      'Ammoniak wird an Platinnetzen zu Stickstoffmonoxid oxidiert, weiter zu NO₂ und schließlich mit Wasser zu Salpetersäure umgesetzt. Zusammen mit Haber-Bosch die Basis der Düngemittel- und Sprengstoffindustrie.',
    functionalGroups: [],
    generalEquation: '4 NH₃ + 5 O₂ → 4 NO + 6 H₂O; 2 NO + O₂ → 2 NO₂; 3 NO₂ + H₂O → 2 HNO₃ + NO',
    fixedEquation: {
      reactants: ['NH3', 'O2'],
      products: ['NO', 'H2O'],
      balanced: '4 NH₃ + 5 O₂ → 4 NO + 6 H₂O',
    },
    reagents: [
      { name: 'Ammoniak', formula: 'NH3', role: 'Reagenz' },
      { name: 'Luftsauerstoff', formula: 'O2', role: 'Oxidationsmittel' },
      {
        name: 'Platin-Rhodium-Netz (90:10)',
        role: 'Katalysator',
        note: 'Kontaktzeit nur etwa 1 Millisekunde',
      },
    ],
    conditions: {
      temperature: '800–950 °C (Verbrennung), 30–50 °C (Absorption)',
      pressure: '1–10 bar',
      apparatus: 'Kontaktofen mit Platinnetzen, Kühler, Absorptionskolonne',
      monitoring: 'Temperatur am Netz, NOx-Gehalt im Abgas',
    },
    procedure: [
      {
        title: 'Ammoniak verbrennen',
        detail:
          'Ammoniak-Luft-Gemisch (ca. 10 % NH₃) mit hoher Geschwindigkeit über glühende Platinnetze leiten.',
        tip: 'Die sehr kurze Kontaktzeit verhindert die thermodynamisch bevorzugte Weiterreaktion zu Stickstoff.',
        caution: 'Ammoniak-Luft-Gemische sind oberhalb von 15 % explosionsfähig.',
      },
      {
        title: 'Abkühlen und nachoxidieren',
        detail: 'Das Gas rasch abkühlen; NO reagiert mit Sauerstoff zu braunem NO₂ – diese Reaktion ist bei Kälte schneller.',
      },
      {
        title: 'Absorbieren',
        detail:
          'NO₂ im Gegenstrom mit Wasser in einer Kolonne absorbieren. Es entsteht Salpetersäure (ca. 60 %); das gebildete NO wird zurückgeführt.',
      },
      {
        title: 'Abgas reinigen',
        detail: 'Restliche Stickoxide katalytisch reduzieren (SCR), sonst sichtbarer „Fuchsschwanz" am Kamin.',
      },
    ],
    mechanism: {
      type: 'Katalytische Oxidation mit Folgereaktionen',
      summary:
        'Selektivität durch Kinetik: Am Platin läuft die Oxidation zu NO sehr schnell ab, während die thermodynamisch begünstigte Bildung von N₂ zurückbleibt.',
      steps: [
        {
          title: '1. Katalytische Oxidation',
          description:
            '4 NH₃ + 5 O₂ → 4 NO + 6 H₂O. Stickstoff wird von −3 auf +2 oxidiert; die Reaktion ist stark exotherm und hält das Netz auf Temperatur.',
          electronFlow: 'Elektronenübertragung vom Stickstoff auf Sauerstoff an der Platinoberfläche.',
          relativeEnergy: -906,
          rateDetermining: true,
        },
        {
          title: '2. Oxidation zu Stickstoffdioxid',
          description:
            '2 NO + O₂ → 2 NO₂. Ungewöhnlich: Diese Reaktion wird bei tieferer Temperatur schneller (negative Aktivierungsenergie).',
          electronFlow: 'Radikalische Kombination mit Sauerstoff.',
          relativeEnergy: -114,
        },
        {
          title: '3. Disproportionierung in Wasser',
          description:
            '3 NO₂ + H₂O → 2 HNO₃ + NO. Stickstoff wird gleichzeitig oxidiert (+4 → +5) und reduziert (+4 → +2).',
          electronFlow: 'Interne Elektronenübertragung zwischen NO₂-Molekülen.',
          relativeEnergy: -72,
        },
      ],
      competingPathways:
        'Bei zu langer Kontaktzeit oder zu niedriger Temperatur entsteht N₂ oder N₂O – letzteres ist ein starkes Treibhausgas und wird katalytisch nachbehandelt.',
    },
    safety: {
      ghs: ['GHS03', 'GHS05', 'GHS06'],
      hazards: [
        'Stickoxide sind sehr giftig; die Symptome eines Lungenödems treten verzögert auf (H330).',
        'Salpetersäure ist stark ätzend und brandfördernd (H272, H314).',
      ],
      precautions: ['Geschlossene Anlage mit Abgasreinigung.', 'NOx-Warngeräte.'],
      ppe: ['geschlossene Anlage', 'Atemschutz bei Wartung', 'Säureschutz'],
      waste: 'Stickoxidhaltige Abgase katalytisch reduzieren.',
      level: 'Nur Fachlabor',
    },
    typicalYield: '94–98 % (NH₃ → NO)',
    scale: ['Industrie'],
    keywords: ['Salpetersäure', 'Platinkatalysator', 'Kinetik', 'Stickoxide', 'Ostwald'],
    references: [
      { title: 'Ostwald, DE-Patent 168272 (1902)', source: 'Patent (Nobelpreis 1909)' },
    ],
    thermodynamics: {
      deltaH: -906,
      note: 'Die Verbrennung liefert genug Wärme, um das Platinnetz ohne Zusatzheizung auf 900 °C zu halten.',
    },
  },
  {
    id: 'kontaktverfahren',
    name: 'Kontaktverfahren (Schwefelsäure)',
    category: 'technisch',
    reactionType: 'Heterogen katalysierte Gleichgewichtsreaktion',
    summary:
      'Schwefeldioxid wird an Vanadiumpentoxid zu Schwefeltrioxid oxidiert und in konzentrierter Schwefelsäure zu Oleum absorbiert. Schwefelsäure ist die mengenmäßig meistproduzierte Chemikalie der Welt.',
    functionalGroups: [],
    generalEquation: '2 SO₂ + O₂ ⇌ 2 SO₃  (ΔH = −198 kJ/mol)',
    fixedEquation: {
      reactants: ['SO2', 'O2'],
      products: ['SO3'],
      balanced: '2 SO₂ + O₂ ⇌ 2 SO₃',
    },
    reagents: [
      { name: 'Schwefeldioxid', formula: 'SO2', role: 'Reagenz', note: 'aus Schwefelverbrennung oder Röstgasen' },
      { name: 'Luftsauerstoff', formula: 'O2', role: 'Oxidationsmittel' },
      { name: 'Vanadium(V)-oxid auf Kieselgel', formula: 'V2O5', role: 'Katalysator', note: 'mit Kaliumsulfat promotiert' },
      { name: 'Konzentrierte Schwefelsäure', formula: 'H2SO4', role: 'Lösungsmittel', note: 'Absorptionsmedium' },
    ],
    conditions: {
      temperature: '420–620 °C in mehreren Horden mit Zwischenkühlung',
      pressure: '1–2 bar',
      apparatus: 'Hordenreaktor mit Zwischenabsorption (Doppelkontaktverfahren)',
      monitoring: 'SO₂-Restgehalt im Abgas (< 0,05 %)',
    },
    procedure: [
      {
        title: 'Schwefeldioxid erzeugen',
        detail: 'Schwefel verbrennen (S + O₂ → SO₂) oder Röstgase aus der Metallgewinnung reinigen und trocknen.',
        caution: 'Katalysatorgifte wie Arsen müssen vollständig entfernt werden.',
      },
      {
        title: 'Katalytisch oxidieren',
        detail:
          'Das Gas über mehrere Katalysatorhorden leiten und zwischen den Horden kühlen. So bleibt man nahe am Gleichgewicht, ohne dass die Temperatur davonläuft.',
        tip: 'Das Doppelkontaktverfahren zieht nach der dritten Horde das SO₃ ab – nach Le Chatelier steigt der Gesamtumsatz dadurch auf über 99,5 %.',
      },
      {
        title: 'Absorbieren',
        detail:
          'SO₃ in 98 %iger Schwefelsäure zu Oleum lösen. Direkte Absorption in Wasser ist unbrauchbar: es bildet sich ein feiner Säurenebel, der kaum abzuscheiden ist.',
      },
      { title: 'Verdünnen', detail: 'Oleum kontrolliert mit Wasser auf die gewünschte Konzentration einstellen.' },
    ],
    mechanism: {
      type: 'Mars-van-Krevelen-Mechanismus (Redoxcyclus am Katalysator)',
      summary:
        'Der Katalysator liegt unter Reaktionsbedingungen als Schmelze vor. Vanadium wechselt zwischen +5 und +4 und überträgt Sauerstoff auf das SO₂.',
      steps: [
        {
          title: '1. Oxidation des SO₂ durch V(V)',
          description: 'SO₂ + 2 V⁵⁺ + O²⁻ → SO₃ + 2 V⁴⁺. Der Katalysator gibt Gittersauerstoff ab.',
          electronFlow: 'Elektronen vom Schwefel → Vanadium(V).',
          relativeEnergy: -100,
          rateDetermining: true,
        },
        {
          title: '2. Reoxidation des Katalysators',
          description: '2 V⁴⁺ + ½ O₂ → 2 V⁵⁺ + O²⁻. Luftsauerstoff stellt den Ausgangszustand wieder her.',
          electronFlow: 'Elektronen vom Vanadium(IV) → Sauerstoff.',
          relativeEnergy: -98,
        },
      ],
      competingPathways:
        'Unterhalb von 400 °C wird der Katalysator inaktiv (er erstarrt), oberhalb von 620 °C zersetzt er sich und das Gleichgewicht verschiebt sich zurück zu SO₂.',
    },
    safety: {
      ghs: ['GHS05', 'GHS06', 'GHS08'],
      hazards: [
        'Schwefeldioxid ist giftig und ätzend (H331, H314).',
        'Oleum reagiert heftig mit Wasser.',
        'Vanadiumpentoxid ist giftig und erbgutverändernd (H341, H351).',
      ],
      precautions: ['Geschlossene Anlage.', 'Beim Katalysatorwechsel Atemschutz tragen.'],
      ppe: ['geschlossene Anlage', 'Säureschutz', 'Atemschutz bei Wartung'],
      waste: 'Verbrauchten Katalysator als vanadiumhaltigen Sondermüll entsorgen.',
      level: 'Nur Fachlabor',
    },
    typicalYield: '99,5–99,8 % (Doppelkontakt)',
    scale: ['Industrie'],
    keywords: ['Schwefelsäure', 'Doppelkontakt', 'Vanadiumpentoxid', 'Le Chatelier', 'Oleum'],
    references: [{ title: 'Ullmann’s Encyclopedia: Sulfuric Acid', source: 'Wiley-VCH' }],
    thermodynamics: {
      deltaH: -198,
      note: 'Exotherm und teilchenzahlvermindernd – tiefe Temperatur wäre ideal, wird aber durch die Kinetik begrenzt.',
    },
  },
  {
    id: 'solvay-verfahren',
    name: 'Solvay-Verfahren (Soda)',
    aliases: ['Ammoniak-Soda-Verfahren'],
    category: 'technisch',
    reactionType: 'Fällung mit Stoffkreislauf',
    summary:
      'Aus Steinsalz und Kalkstein entsteht Natriumcarbonat. Das Verfahren ist ein Musterbeispiel für Kreislaufführung: Ammoniak wird vollständig zurückgewonnen, als Abfall bleibt nur Calciumchlorid.',
    functionalGroups: [],
    generalEquation: '2 NaCl + CaCO₃ → Na₂CO₃ + CaCl₂ (Bruttogleichung)',
    fixedEquation: {
      reactants: ['NaCl', 'CaCO3'],
      products: ['Na2CO3', 'CaCl2'],
      balanced: '2 NaCl + CaCO₃ → Na₂CO₃ + CaCl₂',
    },
    reagents: [
      { name: 'Natriumchlorid-Sole', formula: 'NaCl', role: 'Reagenz' },
      { name: 'Kalkstein', formula: 'CaCO3', role: 'Reagenz' },
      { name: 'Ammoniak', formula: 'NH3', role: 'Katalysator', note: 'wird im Kreis geführt, nicht verbraucht' },
    ],
    conditions: {
      temperature: '30–40 °C (Fällung), 150–200 °C (Calcinierung), 900–1000 °C (Kalkbrennen)',
      pressure: 'Normaldruck',
      apparatus: 'Solvay-Turm, Drehrohrofen, Ammoniak-Rückgewinnungskolonne',
      workup: 'Filtration des Natriumhydrogencarbonats',
      monitoring: 'Ammoniakverluste als Kostenfaktor',
    },
    procedure: [
      {
        title: 'Sole ammonisieren',
        detail: 'Gesättigte Kochsalzlösung mit Ammoniak sättigen.',
      },
      {
        title: 'Kohlenstoffdioxid einleiten',
        detail:
          'CO₂ aus dem Kalkbrennen im Gegenstrom einleiten. Natriumhydrogencarbonat ist am wenigsten löslich und fällt aus: NaCl + NH₃ + CO₂ + H₂O → NaHCO₃↓ + NH₄Cl.',
        tip: 'Die Löslichkeitsunterschiede treiben das gesamte Verfahren an.',
      },
      {
        title: 'Calcinieren',
        detail: 'NaHCO₃ abfiltrieren und bei 175 °C zu Soda zersetzen: 2 NaHCO₃ → Na₂CO₃ + CO₂ + H₂O. Das CO₂ geht zurück in den Turm.',
      },
      {
        title: 'Ammoniak zurückgewinnen',
        detail:
          'Die Ammoniumchloridlösung mit gebranntem Kalk behandeln: 2 NH₄Cl + Ca(OH)₂ → 2 NH₃↑ + CaCl₂ + 2 H₂O. Ammoniak wird erneut eingesetzt.',
      },
    ],
    mechanism: {
      type: 'Gekoppelte Gleichgewichte mit Löslichkeitssteuerung',
      summary:
        'Die Einzelschritte sind einfache Säure-Base- und Fällungsreaktionen. Die Kunst liegt in der Kopplung: Vier Teilprozesse greifen so ineinander, dass nur Salz und Kalk verbraucht werden.',
      steps: [
        {
          title: '1. Kalkbrennen',
          description: 'CaCO₃ → CaO + CO₂ bei 1000 °C – liefert das Kohlenstoffdioxid für den Turm.',
          electronFlow: 'Thermische Zersetzung, keine Redoxreaktion.',
          relativeEnergy: 178,
        },
        {
          title: '2. Fällung im Solvay-Turm',
          description:
            'Ammoniak macht die Lösung basisch, CO₂ bildet Hydrogencarbonat. Natriumhydrogencarbonat überschreitet als erstes sein Löslichkeitsprodukt und kristallisiert aus.',
          electronFlow: 'Säure-Base-Reaktionen, Protonenübertragung.',
          relativeEnergy: -60,
          rateDetermining: true,
        },
        {
          title: '3. Calcinierung',
          description: '2 NaHCO₃ → Na₂CO₃ + H₂O + CO₂ – das CO₂ kehrt in den Kreislauf zurück.',
          electronFlow: 'Thermische Zersetzung.',
          relativeEnergy: 129,
        },
        {
          title: '4. Ammoniakrückgewinnung',
          description: 'Der gebrannte Kalk setzt aus Ammoniumchlorid wieder Ammoniak frei.',
          electronFlow: 'Säure-Base-Reaktion: Hydroxid deprotoniert Ammonium.',
          relativeEnergy: -45,
        },
      ],
      competingPathways:
        'Nachteil des Verfahrens sind die großen Mengen Calciumchlorid-Lösung, für die es kaum Verwendung gibt.',
    },
    safety: {
      ghs: ['GHS05', 'GHS07'],
      hazards: [
        'Ammoniak ist giftig und ätzend (H331, H314).',
        'Gebrannter Kalk reagiert heftig mit Wasser und ist stark ätzend.',
      ],
      precautions: ['Ammoniakdichtheit überwachen.', 'Kalkstaub vermeiden.'],
      ppe: ['Schutzbrille', 'Handschuhe', 'Staubschutz'],
      waste: 'Calciumchlorid-Abwasser fällt in großen Mengen an und muss geregelt eingeleitet werden.',
      level: 'Fortgeschritten',
    },
    typicalYield: '70–75 % bezogen auf Natrium',
    scale: ['Industrie'],
    keywords: ['Soda', 'Kreislaufprozess', 'Löslichkeitsprodukt', 'Solvay'],
    references: [{ title: 'Ullmann’s Encyclopedia: Sodium Carbonate', source: 'Wiley-VCH' }],
  },
  {
    id: 'thermitreaktion',
    name: 'Thermitreaktion',
    aliases: ['aluminothermisches Schweißen', 'Goldschmidt-Verfahren'],
    category: 'anorganisch',
    reactionType: 'Redoxreaktion (Metallothermie)',
    summary:
      'Aluminium reduziert Eisenoxid unter enormer Wärmeentwicklung zu flüssigem Eisen. Die Reaktion erreicht über 2400 °C und wird zum Schweißen von Eisenbahnschienen eingesetzt.',
    functionalGroups: [],
    generalEquation: '2 Al + Fe₂O₃ → Al₂O₃ + 2 Fe  (ΔH = −852 kJ/mol)',
    fixedEquation: {
      reactants: ['Al', 'Fe2O3'],
      products: ['Al2O3', 'Fe'],
      balanced: '2 Al + Fe₂O₃ → Al₂O₃ + 2 Fe',
    },
    reagents: [
      { name: 'Aluminiumgrieß', formula: 'Al', role: 'Reduktionsmittel', equivalents: '2 Äq.' },
      { name: 'Eisen(III)-oxid', formula: 'Fe2O3', role: 'Oxidationsmittel', equivalents: '1 Äq.' },
      {
        name: 'Zündkirsche (Bariumperoxid/Magnesium)',
        role: 'Reagenz',
        note: 'liefert die nötige Aktivierungsenergie',
      },
    ],
    conditions: {
      temperature: 'Zündtemperatur ca. 1000 °C, Reaktionstemperatur über 2400 °C',
      apparatus: 'feuerfester Tiegel mit Sandbett, Schutzabstand',
      monitoring: 'rein visuell – die Reaktion läuft in Sekunden ab',
    },
    procedure: [
      {
        title: 'Aufbau',
        detail:
          'Tiegel aus feuerfestem Material auf trockenem Sand aufstellen. Umgebung räumen, Mindestabstand von mehreren Metern einhalten.',
        caution: 'Feuchtigkeit im Sand oder Tiegel führt zu Dampfexplosionen mit Metallauswurf.',
      },
      {
        title: 'Gemisch einfüllen',
        detail: 'Das Gemisch aus Aluminium und Eisenoxid (Massenverhältnis etwa 1:3) trocken einfüllen.',
      },
      {
        title: 'Zünden',
        detail:
          'Mit Magnesiumband oder Zündkirsche aus sicherer Entfernung zünden. Die Reaktion läuft selbstständig und sehr schnell ab.',
        caution:
          'Niemals mit einem Brenner direkt zünden. Blendendes Licht – UV-Schutzbrille erforderlich. Nicht mit Wasser löschen.',
      },
      {
        title: 'Abkühlen lassen',
        detail:
          'Den Tiegel vollständig auskühlen lassen. Unter der Aluminiumoxidschlacke liegt der Eisenregulus.',
      },
    ],
    mechanism: {
      type: 'Feststoff-Redoxreaktion',
      summary:
        'Aluminium hat eine deutlich höhere Sauerstoffaffinität als Eisen. Die Differenz der Bildungsenthalpien beider Oxide wird vollständig als Wärme frei.',
      steps: [
        {
          title: 'Oxidation des Aluminiums',
          description: '2 Al → 2 Al³⁺ + 6 e⁻. Aluminium gibt Elektronen ab und wird zum Oxid.',
          electronFlow: 'Elektronen vom Aluminium → Eisenionen.',
          relativeEnergy: 0,
          rateDetermining: true,
        },
        {
          title: 'Reduktion des Eisenoxids',
          description:
            'Fe₂O₃ + 6 e⁻ → 2 Fe + 3 O²⁻. Das Eisen entsteht wegen der hohen Temperatur flüssig und sammelt sich unter der leichteren Schlacke.',
          electronFlow: 'Elektronen → Eisen(III)-Ionen.',
          relativeEnergy: -852,
        },
      ],
      competingPathways:
        'Dieselbe Methode funktioniert mit Cr₂O₃, MnO₂ oder V₂O₅ und dient dort zur Gewinnung kohlenstofffreier Metalle.',
    },
    safety: {
      ghs: ['GHS02', 'GHS07'],
      hazards: [
        'Extrem heiße Schmelze und Funkenflug (bis über 2400 °C).',
        'Intensive UV-Strahlung schädigt die Augen.',
        'Mit Wasser kommt es zu explosionsartigen Reaktionen.',
      ],
      precautions: [
        'Nur als Demonstrationsversuch von geschultem Personal, mit Schutzscheibe und Sicherheitsabstand.',
        'Trockene Materialien, Sandbett, kein Wasser in der Nähe.',
        'Metallbrandlöscher (Klasse D) bereithalten.',
      ],
      ppe: ['UV-Schutzbrille/Schweißerschutz', 'Hitzeschutzhandschuhe', 'schwer entflammbare Kleidung'],
      waste: 'Erkaltete Schlacke und Eisenregulus als Feststoffabfall.',
      level: 'Nur Fachlabor',
    },
    typicalYield: '85–95 %',
    scale: ['Demonstrationsversuch', 'Industrie'],
    keywords: ['Thermit', 'Redox', 'exotherm', 'Schienenschweißen', 'Goldschmidt'],
    references: [
      { title: 'Goldschmidt, DE-Patent 96317 (1895)', source: 'Patent' },
    ],
    thermodynamics: {
      deltaH: -852,
      note: 'Die freigesetzte Wärme reicht aus, um das entstehende Eisen (Schmelzpunkt 1538 °C) vollständig zu verflüssigen.',
    },
  },
  {
    id: 'hochofenprozess',
    name: 'Hochofenprozess (Roheisengewinnung)',
    category: 'technisch',
    reactionType: 'Reduktion im Gegenstrom',
    summary:
      'Eisenoxid wird mit Kohlenstoffmonoxid stufenweise zu Eisen reduziert. Der Hochofen arbeitet im Gegenstrom: Möller sinkt ab, heißes Reduktionsgas steigt auf.',
    functionalGroups: [],
    generalEquation: 'Fe₂O₃ + 3 CO → 2 Fe + 3 CO₂',
    fixedEquation: {
      reactants: ['Fe2O3', 'CO'],
      products: ['Fe', 'CO2'],
      balanced: 'Fe₂O₃ + 3 CO → 2 Fe + 3 CO₂',
    },
    reagents: [
      { name: 'Eisenerz (Hämatit/Magnetit)', formula: 'Fe2O3', role: 'Reagenz' },
      { name: 'Koks', formula: 'C', role: 'Reduktionsmittel', note: 'liefert Wärme und erzeugt das CO' },
      { name: 'Kalkstein', formula: 'CaCO3', role: 'Reagenz', note: 'Zuschlag zur Schlackebildung' },
      { name: 'Heißwind (1200 °C)', formula: 'O2', role: 'Oxidationsmittel' },
    ],
    conditions: {
      temperature: '200 °C (Gicht) bis 2000 °C (Blasformen)',
      pressure: '2–4 bar',
      apparatus: 'Hochofen mit Winderhitzern (Cowper)',
      duration: 'kontinuierlicher Betrieb über Jahre',
      monitoring: 'Gichtgaszusammensetzung, Temperaturprofil',
    },
    procedure: [
      {
        title: 'Möller aufgeben',
        detail: 'Erz, Koks und Zuschläge schichtweise über die Gicht aufgeben.',
      },
      {
        title: 'Heißwind einblasen',
        detail:
          'Auf 1200 °C vorgewärmte Luft durch die Blasformen einblasen. Der Koks verbrennt zu CO₂, das mit weiterem Koks sofort zu CO reagiert (Boudouard-Gleichgewicht).',
        caution: 'Gichtgas enthält bis zu 25 % Kohlenstoffmonoxid – geruchlos und hochgiftig.',
      },
      {
        title: 'Reduktion im Gegenstrom',
        detail:
          'Das aufsteigende CO reduziert das Erz stufenweise: Fe₂O₃ → Fe₃O₄ → FeO → Fe. Jede Stufe hat ihren eigenen Temperaturbereich.',
      },
      {
        title: 'Abstich',
        detail:
          'Flüssiges Roheisen (etwa 4 % Kohlenstoff) und darüber die Schlacke regelmäßig abstechen. Das Roheisen geht zur Entkohlung ins Sauerstoffblasverfahren.',
      },
    ],
    mechanism: {
      type: 'Gestufte Gasreduktion mit Boudouard-Gleichgewicht',
      summary:
        'Die eigentliche Reduktion übernimmt Kohlenstoffmonoxid, nicht der feste Kohlenstoff (indirekte Reduktion). Das Boudouard-Gleichgewicht C + CO₂ ⇌ 2 CO stellt das CO laufend bereit.',
      steps: [
        {
          title: '1. Verbrennung des Kokses',
          description: 'C + O₂ → CO₂ an den Blasformen bei 2000 °C – liefert die gesamte Prozesswärme.',
          electronFlow: 'Elektronen vom Kohlenstoff → Sauerstoff.',
          relativeEnergy: -394,
        },
        {
          title: '2. Boudouard-Reaktion',
          description:
            'CO₂ + C ⇌ 2 CO (ΔH = +172 kJ/mol). Oberhalb von 1000 °C liegt das Gleichgewicht fast vollständig bei CO.',
          electronFlow: 'Elektronenübertragung zwischen Kohlenstoffatomen.',
          relativeEnergy: 172,
          rateDetermining: true,
        },
        {
          title: '3. Indirekte Reduktion',
          description:
            'Stufenweise bei 400–900 °C: 3 Fe₂O₃ + CO → 2 Fe₃O₄ + CO₂, dann Fe₃O₄ + CO → 3 FeO + CO₂ und schließlich FeO + CO → Fe + CO₂.',
          electronFlow: 'Elektronen vom Kohlenstoffmonoxid → Eisenionen.',
          relativeEnergy: -25,
        },
        {
          title: '4. Direkte Reduktion und Aufkohlung',
          description:
            'Unterhalb der Kohlensackzone reduziert fester Kohlenstoff den Rest: FeO + C → Fe + CO. Gleichzeitig löst sich Kohlenstoff im Eisen und senkt dessen Schmelzpunkt auf etwa 1150 °C.',
          electronFlow: 'Elektronen vom Kohlenstoff → Eisen.',
          relativeEnergy: 155,
        },
      ],
      competingPathways:
        'Direktreduktionsverfahren mit Wasserstoff statt Koks vermeiden das CO₂ – sie sind der zentrale Ansatz für klimaneutralen Stahl.',
      productEnergy: -28,
    },
    safety: {
      ghs: ['GHS02', 'GHS06', 'GHS08'],
      hazards: [
        'Gichtgas enthält Kohlenstoffmonoxid – geruchlos, giftig, brennbar (H331, H360D).',
        'Flüssiges Eisen und Schlacke bei über 1400 °C.',
      ],
      precautions: ['CO-Warngeräte tragen.', 'Feuchtigkeitsfreie Abstichrinnen.'],
      ppe: ['Hitzeschutzanzug', 'CO-Warner', 'Gesichtsschutz'],
      waste: 'Schlacke als Baustoff verwerten; Gichtgas als Brennstoff nutzen.',
      level: 'Nur Fachlabor',
    },
    typicalYield: 'ca. 95 % Eisenausbringung',
    scale: ['Industrie'],
    keywords: ['Roheisen', 'Boudouard', 'Gegenstrom', 'Koks', 'Direktreduktion'],
    references: [{ title: 'Ullmann’s Encyclopedia: Iron', source: 'Wiley-VCH' }],
    thermodynamics: {
      note: 'Der Prozess erzeugt etwa 1,8 t CO₂ je Tonne Stahl – daher der Umbau auf Wasserstoff-Direktreduktion.',
    },
  },
  {
    id: 'downs-zelle',
    name: 'Downs-Verfahren (Natriumgewinnung)',
    category: 'elektrochemie',
    reactionType: 'Schmelzflusselektrolyse',
    summary:
      'Natriumchlorid wird als Schmelze elektrolysiert; es entstehen Natriummetall und Chlor. In wässriger Lösung ist das unmöglich, weil dort Wasser statt Natrium reduziert wird.',
    functionalGroups: [],
    generalEquation: '2 NaCl(l) → 2 Na(l) + Cl₂(g)',
    fixedEquation: {
      reactants: ['NaCl'],
      products: ['Na', 'Cl2'],
      balanced: '2 NaCl → 2 Na + Cl₂ ↑',
    },
    reagents: [
      { name: 'Natriumchlorid', formula: 'NaCl', role: 'Reagenz' },
      {
        name: 'Calciumchlorid',
        formula: 'CaCl2',
        role: 'Lösungsmittel',
        note: 'senkt den Schmelzpunkt von 801 °C auf etwa 580 °C',
      },
    ],
    conditions: {
      temperature: '580–600 °C',
      apparatus: 'Downs-Zelle mit ringförmiger Anode, Stahlkathode und Drahtnetz-Trennwand',
      atmosphere: 'Schutzgas über dem Natrium',
      workup: 'Flüssiges Natrium abschöpfen und unter Öl lagern',
    },
    electro: {
      cellType: 'geteilt durch ein Stahldrahtnetz (verhindert die Rückreaktion)',
      anode: 'Graphit (ringförmig)',
      cathode: 'Stahlring',
      electrolyte: 'NaCl/CaCl₂-Schmelze (eutektisch)',
      mode: 'galvanostatisch',
      currentDensity: 'hoch, Zellstrom bis 40 kA',
      potential: 'Zellspannung etwa 7 V',
      charge: '1 F je Mol Na',
      faradaicEfficiency: '75–85 %',
      electrons: 1,
    },
    procedure: [
      { title: 'Schmelze vorbereiten', detail: 'NaCl/CaCl₂-Gemisch aufschmelzen und auf 590 °C halten.' },
      {
        title: 'Elektrolysieren',
        detail:
          'Natrium scheidet sich flüssig an der Kathode ab und steigt auf (Dichte 0,93 g/cm³), Chlor entsteht an der Graphitanode.',
        caution: 'Natrium und Chlor dürfen sich nicht begegnen – das Drahtnetz trennt beide Produkte.',
      },
      {
        title: 'Produkte abführen',
        detail: 'Natrium über einen Steigkanal abziehen, Chlor über eine Glocke absaugen.',
      },
      {
        title: 'Lagern',
        detail: 'Natrium unter Paraffinöl oder Schutzgas lagern.',
        caution: 'Natrium reagiert mit Wasser heftig unter Wasserstoffentwicklung und Selbstentzündung.',
      },
    ],
    mechanism: {
      type: 'Schmelzelektrolyse',
      summary:
        'In der Schmelze gibt es kein Wasser, das bevorzugt reduziert werden könnte. Deshalb werden hier tatsächlich Natriumionen entladen.',
      steps: [
        {
          title: 'Kathode: Natriumabscheidung',
          description: 'Na⁺ + e⁻ → Na(l), E° = −2,71 V. In Wasser würde stattdessen Wasserstoff entstehen.',
          electronFlow: 'Elektronen von der Kathode → Natriumion.',
          relativeEnergy: 261,
          rateDetermining: true,
        },
        {
          title: 'Anode: Chlorentwicklung',
          description: '2 Cl⁻ → Cl₂ + 2 e⁻, E° = +1,36 V.',
          electronFlow: 'Elektronen vom Chlorid → Anode.',
          relativeEnergy: 131,
        },
      ],
      competingPathways:
        'Calcium wird bei zu hoher Spannung mitabgeschieden; die Betriebsparameter werden entsprechend eng geführt.',
      productEnergy: 411,
    },
    safety: {
      ghs: ['GHS02', 'GHS05', 'GHS06'],
      hazards: [
        'Natrium ist selbstentzündlich in feuchter Luft (H260) und stark ätzend.',
        'Chlor ist giftig (H331).',
        'Schmelze bei 590 °C.',
      ],
      precautions: [
        'Absolut wasserfrei arbeiten.',
        'Metallbrandlöscher bereithalten – niemals Wasser oder CO₂.',
      ],
      ppe: ['Hitzeschutz', 'Gesichtsschutz', 'trockene Umgebung'],
      waste: 'Natriumreste kontrolliert mit Isopropanol vernichten.',
      level: 'Nur Fachlabor',
    },
    typicalYield: '75–85 % Stromausbeute',
    scale: ['Industrie'],
    keywords: ['Natrium', 'Schmelzflusselektrolyse', 'Downs', 'Alkalimetall'],
    references: [{ title: 'Downs, US-Patent 1501756 (1924)', source: 'Patent' }],
  },
];
