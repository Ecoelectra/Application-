/**
 * Metallkatalysatoren mit Herstellungsanleitung.
 *
 * Die Anleitungen folgen etablierten Vorschriften (Organic Syntheses, Inorganic
 * Syntheses, Lehrbuchversuche) und sind auf kleine Ansätze umgerechnet. Sie
 * setzen – je nach Einstufung – Schul- oder Hochschullabor, Abzug und
 * Schutzausrüstung voraus. Wo die Herstellung gefährliche Zwischenstufen
 * braucht (etwa ein Diazoalkan), steht nur, wie man den gekauften Katalysator
 * richtig einsetzt.
 */
import type { SafetyLevel } from './types';
import type { Catalysis } from './workbenchSpecs';

export interface GuideIngredient {
  name: string;
  amount: string;
  /** Stoff der Datenbank, falls vorhanden */
  substanceId?: string;
}

export interface CatalystGuide {
  /** worum es geht, in zwei, drei Sätzen */
  overview: string;
  ingredients: GuideIngredient[];
  equipment: string[];
  steps: string[];
  /** Reaktionsgleichung der Herstellung, falls sinnvoll */
  equation?: string;
  /** woran man erkennt, dass es geklappt hat */
  check?: string;
  storage: string;
  hazards: string[];
  /** Hinweis, wann Kaufen die bessere Wahl ist */
  buyAdvice?: string;
  source: string;
  /** Herstellung wird bewusst nicht beschrieben (nur Einsatz des gekauften Katalysators) */
  purchaseOnly?: boolean;
}

export interface MetalCatalyst {
  id: string;
  name: string;
  /** Kurzformel, z. B. «Pd(PPh₃)₄» */
  short: string;
  metal: string;
  /** Wofür man ihn nimmt */
  uses: string[];
  /** typische Menge im Ansatz */
  loading: string;
  level: SafetyLevel;
  /** Stoffe der Datenbank, die man ins Reaktionsgefäß geben kann */
  substanceIds: string[];
  /** passende Einstellung «Katalyse» in der Werkbank */
  catalysis: Catalysis;
  guide: CatalystGuide;
}

export const METAL_CATALYSTS: MetalCatalyst[] = [
  {
    id: 'pd-c',
    name: 'Palladium auf Aktivkohle (Pd/C, 10 %)',
    short: 'Pd/C',
    metal: 'Palladium',
    uses: ['Hydrierung von C=C- und C≡C-Bindungen', 'Reduktion von Nitrogruppen zu Aminen', 'Abspaltung von Benzyl- und Cbz-Schutzgruppen (Hydrogenolyse)', 'ligandfreie Suzuki-Kupplung einfacher Arylbromide'],
    loading: '5–10 Gew.-% des Substrats (≈ 1–5 mol% Pd), dazu Wasserstoff (Ballon, 1 bar)',
    level: 'Fortgeschritten',
    substanceIds: ['palladium-auf-aktivkohle'],
    catalysis: 'metall',
    guide: {
      overview:
        'Palladium(II)-chlorid wird auf Aktivkohle aufgezogen und mit Formaldehyd in alkalischer Lösung zu fein verteiltem Palladium(0) reduziert. Die riesige Oberfläche der Kohle trägt winzige Palladiumkristalle – daran lagert sich Wasserstoff an und wird auf die Doppelbindung übertragen.',
      ingredients: [
        { name: 'Palladium(II)-chlorid', amount: '1,67 g (≙ 1,0 g Pd)', substanceId: 'palladium-ii-chlorid' },
        { name: 'Salzsäure, konzentriert', amount: '4 mL', substanceId: 'salzsaeure' },
        { name: 'Aktivkohle (mit Salpetersäure gewaschen)', amount: '9,0 g' },
        { name: 'Formaldehyd-Lösung 37 %', amount: '1,6 mL', substanceId: 'formaldehyd' },
        { name: 'Natronlauge 30 %', amount: 'bis schwach alkalisch (einige mL)', substanceId: 'natriumhydroxid' },
        { name: 'destilliertes Wasser', amount: 'etwa 150 mL und zum Waschen', substanceId: 'wasser' },
      ],
      equipment: ['Becherglas 250 mL mit Magnetrührer und Heizplatte', 'Thermometer', 'Büchnertrichter mit Saugflasche', 'Indikatorpapier', 'Abzug'],
      steps: [
        'Palladium(II)-chlorid mit der konzentrierten Salzsäure und 10 mL Wasser unter leichtem Erwärmen lösen (rotbraune Lösung von H₂PdCl₄).',
        'Die Aktivkohle in 120 mL Wasser aufschlämmen und unter Rühren auf 80 °C erwärmen.',
        'Die Palladiumlösung zur heißen Kohle geben und kurz weiterrühren.',
        'Formaldehyd-Lösung zugeben, dann mit Natronlauge vorsichtig schwach alkalisch stellen (Indikatorpapier). Das Palladium wird dabei zu Pd(0) reduziert.',
        'Noch 5 Minuten rühren, heiß über den Büchnertrichter absaugen.',
        'Den Katalysator zehnmal mit je 25 mL Wasser waschen, bis das Filtrat chloridfrei ist (Probe mit Silbernitrat).',
        'An der Luft oder bei höchstens 60 °C trocknen – nicht in der Nähe von Lösungsmitteldämpfen.',
      ],
      equation: 'H₂PdCl₄ + HCHO + 3 OH⁻ → Pd + HCOO⁻ + 4 Cl⁻ + 2 H₂O (auf Kohle)',
      check: 'Schwarzes, rieselfähiges Pulver. Eine Spatelspitze in 3-%iger Wasserstoffperoxid-Lösung entwickelt sofort Gasbläschen.',
      storage: 'Im gut verschlossenen Glas, fern von Lösungsmitteln. Gebrauchten Katalysator nie trocken liegen lassen – feucht in Wasser sammeln.',
      hazards: [
        'Pd/C mit adsorbiertem Wasserstoff ist pyrophor: Trockener, gebrauchter Katalysator kann Lösungsmitteldämpfe entzünden. Immer unter Inertgas oder feucht zugeben und abfiltrieren, Filterkuchen nie trocken saugen.',
        'Formaldehyd ist giftig und krebserzeugend – nur im Abzug.',
        'Konzentrierte Salzsäure und Natronlauge sind ätzend: Schutzbrille, Handschuhe.',
      ],
      buyAdvice: 'Für Hydrierungen im Unterricht ist gekauftes Pd/C (5 % oder 10 %, meist 50 % wasserfeucht) sicherer und gleichmäßiger.',
      source: 'Nach R. Mozingo, Organic Syntheses Coll. Vol. 3, S. 685 (1955), auf 10 % Pd umgerechnet',
    },
  },
  {
    id: 'pd-pph3-4',
    name: 'Tetrakis(triphenylphosphin)palladium(0)',
    short: 'Pd(PPh₃)₄',
    metal: 'Palladium',
    uses: ['Suzuki-Kupplung', 'Stille-Kupplung', 'Negishi- und Sonogashira-Kupplung', 'allgemein: Kreuzkupplungen von Arylhalogeniden'],
    loading: '1–5 mol% bezogen auf das Arylhalogenid',
    level: 'Fortgeschritten',
    substanceIds: ['tetrakis-triphenylphosphin-palladium'],
    catalysis: 'metall',
    guide: {
      overview:
        'Palladium(II)-chlorid und ein Überschuss Triphenylphosphin werden in heißem Dimethylsulfoxid gelöst; Hydrazin reduziert Pd(II) zu Pd(0), das vier Phosphinliganden bindet. Beim Abkühlen kristallisiert der gelbe Komplex aus.',
      ingredients: [
        { name: 'Palladium(II)-chlorid', amount: '0,355 g (2,0 mmol)', substanceId: 'palladium-ii-chlorid' },
        { name: 'Triphenylphosphin', amount: '2,62 g (10,0 mmol)', substanceId: 'triphenylphosphin' },
        { name: 'Dimethylsulfoxid (DMSO)', amount: '24 mL', substanceId: 'dimethylsulfoxid' },
        { name: 'Hydrazinhydrat', amount: '0,39 mL (8,0 mmol)', substanceId: 'hydrazin' },
        { name: 'Ethanol und Diethylether', amount: 'je 2 × 5 mL zum Waschen', substanceId: 'ethanol' },
      ],
      equipment: ['Zweihalskolben 100 mL mit Rückflusskühler', 'Stickstoff- oder Argonanschluss', 'Ölbad mit Thermometer', 'Schlenkfritte oder Büchnertrichter unter Stickstoff', 'Abzug'],
      steps: [
        'Kolben mit Stickstoff spülen. PdCl₂, Triphenylphosphin und DMSO einfüllen.',
        'Unter Stickstoff und Rühren auf etwa 140 °C erhitzen, bis alles gelöst ist (klare orangerote Lösung).',
        'Heizbad entfernen und 15 Minuten weiterrühren.',
        'Hydrazinhydrat zügig innerhalb etwa einer Minute zugeben – es entweicht Stickstoff, die Lösung wird dunkler.',
        'Im Wasserbad abkühlen lassen; ab etwa 125 °C kristallisiert der gelbe Komplex.',
        'Unter Stickstoff abfiltrieren, zweimal mit Ethanol und zweimal mit Ether waschen.',
        'Im Vakuum trocknen. Ausbeute etwa 90 % (2,1 g).',
      ],
      equation: '2 PdCl₂ + 10 PPh₃ + 5 N₂H₄ → 2 Pd(PPh₃)₄ + 4 N₂H₅Cl + N₂',
      check: 'Hellgelbe Kristalle. Braune oder grünliche Verfärbung heißt: Der Komplex hat sich an der Luft zersetzt.',
      storage: 'Unter Argon im Kühlschrank, lichtgeschützt. An der Luft zersetzt er sich in Tagen bis Wochen.',
      hazards: [
        'Hydrazin ist sehr giftig, ätzend und krebserzeugend – nur im Abzug mit Handschuhen.',
        'DMSO trägt gelöste Stoffe durch die Haut: Handschuhe.',
        'Palladiumverbindungen können Allergien auslösen.',
      ],
      buyAdvice: 'Gekauftes Pd(PPh₃)₄ ist oft schon teilweise oxidiert. Frisch hergestellt arbeitet es zuverlässiger – oder man nimmt das stabilere Pd(OAc)₂ mit Phosphin.',
      source: 'Nach D. R. Coulson, Inorganic Syntheses 13, S. 121 (1972), auf 2 mmol umgerechnet',
    },
  },
  {
    id: 'pdcl2-pph3-2',
    name: 'Bis(triphenylphosphin)palladium(II)-chlorid',
    short: 'PdCl₂(PPh₃)₂',
    metal: 'Palladium',
    uses: ['Sonogashira-Kupplung (zusammen mit Kupfer(I)-iodid)', 'Stille- und Suzuki-Kupplung', 'luftstabile Vorstufe für Pd(0)'],
    loading: '1–3 mol%, bei Sonogashira dazu 2–5 mol% CuI',
    level: 'Fortgeschritten',
    substanceIds: [],
    catalysis: 'metall',
    guide: {
      overview:
        'Palladium(II)-chlorid löst sich in heißem Benzonitril als PdCl₂(PhCN)₂; zwei Äquivalente Triphenylphosphin verdrängen das Benzonitril, und der gelbe, luftstabile Komplex fällt aus. Er wird in der Reaktion zu Pd(0) reduziert.',
      ingredients: [
        { name: 'Palladium(II)-chlorid', amount: '0,18 g (1,0 mmol)', substanceId: 'palladium-ii-chlorid' },
        { name: 'Benzonitril', amount: '6 mL' },
        { name: 'Triphenylphosphin', amount: '0,58 g (2,2 mmol)', substanceId: 'triphenylphosphin' },
        { name: 'Diethylether', amount: '20 mL zum Fällen und Waschen' },
      ],
      equipment: ['Rundkolben 25 mL mit Rückflusskühler', 'Ölbad', 'Glasfritte', 'Abzug'],
      steps: [
        'PdCl₂ in Benzonitril bei 100 °C rühren, bis eine klare rotbraune Lösung entstanden ist (etwa 20 Minuten).',
        'Triphenylphosphin in wenig warmem Benzonitril lösen und zur Palladiumlösung geben.',
        'Sofort fällt ein gelber Niederschlag. 10 Minuten bei 100 °C weiterrühren.',
        'Abkühlen lassen, mit Diethylether versetzen, damit der Komplex vollständig ausfällt.',
        'Abfiltrieren, mit Ether waschen und an der Luft trocknen.',
      ],
      equation: 'PdCl₂ + 2 PPh₃ → PdCl₂(PPh₃)₂',
      check: 'Gelbes, luftstabiles Pulver, in Dichlormethan löslich.',
      storage: 'Luftstabil; trocken und dunkel aufbewahren.',
      hazards: ['Benzonitril ist gesundheitsschädlich – Abzug.', 'Diethylether ist extrem entzündlich: keine offenen Flammen.', 'Palladiumverbindungen können Allergien auslösen.'],
      source: 'Nach der üblichen Darstellung über PdCl₂(PhCN)₂ (M. S. Kharasch et al., J. Am. Chem. Soc. 60, 882 (1938))',
    },
  },
  {
    id: 'pd-oac2-ligand',
    name: 'Palladium(II)-acetat mit Phosphinligand (in situ)',
    short: 'Pd(OAc)₂ / PR₃',
    metal: 'Palladium',
    uses: ['Heck-Reaktion', 'Buchwald-Hartwig-Aminierung (mit XPhos, BINAP oder ähnlichen Liganden)', 'Suzuki-Kupplung schwieriger Substrate'],
    loading: '1–5 mol% Pd(OAc)₂ und 2–4 Äquivalente Ligand pro Palladium',
    level: 'Fortgeschritten',
    substanceIds: ['palladium-ii-acetat', 'triphenylphosphin'],
    catalysis: 'metall',
    guide: {
      overview:
        'Der eigentliche Katalysator entsteht erst im Reaktionsgefäß: Palladium(II)-acetat wird vom Phosphin (oder vom Amin bzw. der Base) zu Pd(0) reduziert, das der Ligand stabilisiert. Mit dem Ligand stellt man Aktivität und Selektivität ein – Triphenylphosphin für Heck, sperrige Biarylphosphine (XPhos, SPhos) für Buchwald-Hartwig.',
      ingredients: [
        { name: 'Palladium(II)-acetat', amount: '2 mol% (für 1 mmol Substrat: 4,5 mg)', substanceId: 'palladium-ii-acetat' },
        { name: 'Triphenylphosphin (Heck) oder XPhos/BINAP (Buchwald)', amount: '4–8 mol%', substanceId: 'triphenylphosphin' },
        { name: 'trockenes Lösungsmittel (DMF, Toluol oder Dioxan)', amount: '3–5 mL pro mmol' },
        { name: 'Base (Triethylamin für Heck, Natrium-tert-butanolat oder Cs₂CO₃ für Buchwald)', amount: '1,5–2 Äquivalente' },
      ],
      equipment: ['Schlenkrohr oder Mikrowellengefäß mit Septum', 'Argon- oder Stickstoffanschluss', 'Heizblock', 'Spritzen'],
      steps: [
        'Gefäß ausheizen und mit Argon füllen.',
        'Pd(OAc)₂ und Ligand einwiegen, trockenes Lösungsmittel zugeben.',
        '10 Minuten bei Raumtemperatur rühren: Die orangefarbene Lösung wird hellgelb bis rötlich – Pd(0) hat sich gebildet.',
        'Substrate und Base zugeben, verschließen und auf die Reaktionstemperatur bringen (Heck 80–120 °C, Buchwald 80–110 °C).',
        'Fällt schwarzes Palladium aus («Palladiumschwarz»), ist der Katalysator zerfallen – dann mehr Ligand oder sauberer unter Luftausschluss arbeiten.',
      ],
      check: 'Die Lösung bleibt klar gelb bis rotbraun; ein schwarzer Spiegel an der Glaswand zeigt Zersetzung.',
      storage: 'Pd(OAc)₂ ist luftstabil (trocken, dunkel). Phosphine unter Argon lagern – sie oxidieren langsam an der Luft.',
      hazards: ['Palladiumsalze können Allergien auslösen.', 'DMF und Dioxan sind gesundheitsschädlich (fruchtschädigend bzw. krebsverdächtig) – Abzug.', 'Natrium-tert-butanolat ist ätzend und reagiert heftig mit Wasser.'],
      buyAdvice: 'Palladium(II)-acetat selbst herzustellen (aus Palladiumschwamm, Salpeter- und Essigsäure) lohnt nicht; es wird gekauft.',
      source: 'Allgemeine Arbeitsweise in situ gebildeter Pd(0)-Katalysatoren (R. F. Heck; S. L. Buchwald, J. F. Hartwig)',
    },
  },
  {
    id: 'lindlar',
    name: 'Lindlar-Katalysator',
    short: 'Pd/CaCO₃ + Pb',
    metal: 'Palladium',
    uses: ['Teilhydrierung von Alkinen zu (Z)-Alkenen – die Hydrierung bleibt beim Alken stehen'],
    loading: '5–10 Gew.-% des Alkins, dazu wenig Chinolin und 1 bar Wasserstoff',
    level: 'Fortgeschritten',
    substanceIds: ['lindlar-katalysator'],
    catalysis: 'metall',
    guide: {
      overview:
        'Palladium auf Calciumcarbonat wird mit Blei(II)-acetat gezielt «vergiftet». Die gebremste Oberfläche hydriert Alkine noch, Alkene aber kaum – so entsteht selektiv das cis-Alken. Chinolin im Ansatz dämpft die Aktivität zusätzlich.',
      ingredients: [
        { name: 'Calciumcarbonat, gefällt', amount: '5,0 g', substanceId: 'calciumcarbonat' },
        { name: 'Palladium(II)-chlorid-Lösung 5 % (in verdünnter Salzsäure)', amount: '5 mL (0,25 g PdCl₂)', substanceId: 'palladium-ii-chlorid' },
        { name: 'Wasserstoff', amount: 'zum Reduzieren', substanceId: 'wasserstoff' },
        { name: 'Blei(II)-acetat-Lösung 7,7 %', amount: '5 mL', substanceId: 'blei-ii-acetat' },
        { name: 'destilliertes Wasser', amount: '40 mL + 50 mL + zum Waschen', substanceId: 'wasser' },
        { name: 'Chinolin (bei der Anwendung)', amount: 'etwa 1 Tropfen pro 100 mg Katalysator', substanceId: 'chinolin' },
      ],
      equipment: ['Hydrierapparatur oder Kolben mit Wasserstoffballon', 'Magnetrührer mit Heizplatte', 'Büchnertrichter', 'Vakuumtrockenschrank'],
      steps: [
        'Calciumcarbonat in 40 mL Wasser aufschlämmen, die Palladiumchlorid-Lösung zugeben.',
        '5 Minuten bei Raumtemperatur, dann 10 Minuten bei 80 °C rühren.',
        'Die heiße Suspension unter Wasserstoff rühren, bis kein Wasserstoff mehr aufgenommen wird – das Palladium ist dann zu Pd(0) reduziert (grau-schwarz).',
        'Abfiltrieren, mit Wasser waschen und wieder in 50 mL Wasser aufschlämmen.',
        'Blei(II)-acetat-Lösung zugeben, 10 Minuten bei Raumtemperatur und 40 Minuten im siedenden Wasserbad rühren.',
        'Abfiltrieren, gründlich mit Wasser waschen und im Vakuum bei 40–45 °C trocknen.',
        'Bei der Hydrierung Chinolin zusetzen und die Wasserstoffaufnahme verfolgen: Nach einem Äquivalent H₂ abbrechen.',
      ],
      check: 'Hellgraues Pulver. Die Hydrierung eines Alkins verlangsamt sich deutlich nach Aufnahme von einem Äquivalent Wasserstoff.',
      storage: 'Trocken im verschlossenen Glas; nach Gebrauch feucht halten (pyrophor mit Wasserstoff).',
      hazards: [
        'Bleiverbindungen sind giftig und fruchtschädigend – Handschuhe, Abfälle getrennt als Schwermetall entsorgen.',
        'Wasserstoff ist extrem entzündlich; Knallgasgefahr. Nur in dafür ausgelegter Apparatur und ohne Zündquellen.',
        'Chinolin ist giftig und krebsverdächtig.',
      ],
      source: 'Nach H. Lindlar, R. Dubuis, Organic Syntheses Coll. Vol. 5, S. 880 (1973), auf 1/10 umgerechnet',
    },
  },
  {
    id: 'raney-ni',
    name: 'Raney-Nickel (W-2)',
    short: 'Ra-Ni',
    metal: 'Nickel',
    uses: ['Hydrierung von Nitrilen zu primären Aminen', 'Hydrierung von Carbonylgruppen und Aromaten (bei Druck)', 'Reduktion von Nitrogruppen', 'Entschwefelung von Thioethern'],
    loading: '10–50 Gew.-% des Substrats (feucht), Wasserstoff 1–100 bar',
    level: 'Nur Fachlabor',
    substanceIds: ['nickel'],
    catalysis: 'metall',
    guide: {
      overview:
        'Aus einer Nickel-Aluminium-Legierung löst Natronlauge das Aluminium heraus. Zurück bleibt ein schwammartiges, sehr poröses Nickel voller eingelagertem Wasserstoff – ein billiger und sehr aktiver Hydrierkatalysator.',
      ingredients: [
        { name: 'Raney-Legierung (Ni/Al 50:50), Pulver', amount: '12,5 g' },
        { name: 'Natriumhydroxid, Plätzchen', amount: '16 g', substanceId: 'natriumhydroxid' },
        { name: 'destilliertes Wasser', amount: '60 mL + viel zum Waschen', substanceId: 'wasser' },
        { name: 'Ethanol 95 %', amount: '3 × 20 mL', substanceId: 'ethanol' },
      ],
      equipment: ['Erlenmeyerkolben 250 mL im Eisbad', 'Thermometer', 'Rührer', 'Abzug', 'Spritzflasche'],
      steps: [
        'Natriumhydroxid in 60 mL Wasser lösen und im Eisbad auf 50 °C abkühlen lassen.',
        'Die Legierung in kleinen Portionen über 25–30 Minuten zugeben. Es entweicht viel Wasserstoff und die Lösung schäumt – die Temperatur durch Zugabetempo und Kühlung bei 50 ± 2 °C halten.',
        'Anschließend 50 Minuten bei 50 °C unter schwachem Rühren digerieren.',
        'Die Lauge abgießen und das Nickel dreimal mit je 100 mL Wasser durch Aufschlämmen und Abgießen (Dekantieren) waschen, dann weiter mit Wasser, bis das Waschwasser neutral ist.',
        'Dreimal mit Ethanol dekantieren und unter Ethanol aufbewahren.',
      ],
      equation: '2 Al + 2 NaOH + 6 H₂O → 2 Na[Al(OH)₄] + 3 H₂ (das Nickel bleibt zurück)',
      check: 'Grauschwarzer, schwerer Schlamm, der sich schnell absetzt. Eine winzige Probe, auf Filterpapier getrocknet, glimmt auf – Zeichen der hohen Aktivität (nur im Abzug prüfen).',
      storage: 'Immer unter Wasser oder Ethanol, dicht verschlossen, höchstens einige Wochen – die Aktivität lässt nach.',
      hazards: [
        'Trockenes Raney-Nickel entzündet sich an der Luft von selbst (pyrophor). Nie trocken werden lassen, Reste unter Wasser sammeln und mit verdünnter Säure deaktivieren.',
        'Bei der Herstellung entsteht viel Wasserstoff – keine Zündquellen, gut lüften.',
        'Nickelverbindungen sind krebserzeugend und sensibilisierend.',
        'Konzentrierte Natronlauge ist stark ätzend.',
      ],
      buyAdvice: 'Aktives Raney-Nickel gibt es als wässrige Suspension zu kaufen – für die meisten Zwecke die sicherere Wahl.',
      source: 'Nach R. Mozingo, Organic Syntheses Coll. Vol. 3, S. 181 (1955), auf 1/10 umgerechnet',
    },
  },
  {
    id: 'adams',
    name: 'Adams-Katalysator (Platin(IV)-oxid)',
    short: 'PtO₂',
    metal: 'Platin',
    uses: ['Hydrierung von Aromaten und Ketonen', 'Hydrierung, wenn Palladium zu Nebenreaktionen führt (weniger Hydrogenolyse)', 'Hydrierung in Essigsäure'],
    loading: '1–5 Gew.-% des Substrats, Wasserstoff 1–3 bar',
    level: 'Nur Fachlabor',
    substanceIds: [],
    catalysis: 'metall',
    guide: {
      overview:
        'Hexachloroplatinsäure wird in einer Natriumnitrat-Schmelze zu braunem Platin(IV)-oxid oxidiert. Erst im Reaktionsgefäß reduziert Wasserstoff das Oxid zu hochaktivem «Platinschwarz».',
      ingredients: [
        { name: 'Hexachloroplatinsäure (H₂PtCl₆·6 H₂O)', amount: '3,5 g' },
        { name: 'Natriumnitrat', amount: '35 g', substanceId: 'natriumnitrat' },
        { name: 'destilliertes Wasser', amount: '10 mL + zum Waschen', substanceId: 'wasser' },
      ],
      equipment: ['Porzellanschale (Kasserolle)', 'Brenner oder Muffelofen bis 550 °C', 'Glasstab', 'Filter', 'Abzug (Stickoxide!)'],
      steps: [
        'Hexachloroplatinsäure in 10 mL Wasser lösen und in der Porzellanschale mit dem Natriumnitrat mischen.',
        'Unter Rühren mit dem Glasstab eindampfen, bis eine trockene Masse bleibt.',
        'Im Abzug langsam auf 350–370 °C erhitzen: Die Masse schmilzt, braune Stickoxide entweichen.',
        'Innerhalb von 15 Minuten auf 500–550 °C steigern und 30 Minuten halten, bis keine Gase mehr entweichen.',
        'Abkühlen lassen, die Schmelze mit 50 mL Wasser behandeln; das braune Platinoxid setzt sich ab.',
        'Durch Dekantieren und auf dem Filter mit Wasser waschen, bis es nitratfrei ist, dann trocknen.',
      ],
      check: 'Braunes, feines Pulver. In der Hydrierung wird es unter Wasserstoff schwarz (Platinschwarz) – erst dann ist es aktiv.',
      storage: 'Als Oxid lange haltbar; trocken und verschlossen lagern.',
      hazards: [
        'Beim Schmelzen entstehen giftige Stickoxide – unbedingt im Abzug.',
        'Nitratschmelzen sind stark oxidierend: keine organischen Stoffe in die Nähe.',
        'Platinsalze sind stark sensibilisierend (Platinallergie, Asthma).',
        'Das reduzierte Platinschwarz ist mit Wasserstoff pyrophor.',
      ],
      buyAdvice: 'Wegen des Platinpreises lohnt sich das Recycling alter Platinreste; neu gekauftes PtO₂ ist aber einfacher.',
      source: 'Nach R. Adams, V. Voorhees, R. L. Shriner, Organic Syntheses Coll. Vol. 1, S. 463 (1941)',
    },
  },
  {
    id: 'platin',
    name: 'Platin (Draht, Blech oder Netz)',
    short: 'Pt',
    metal: 'Platin',
    uses: ['Zerfall von Wasserstoffperoxid', 'katalytische Oxidation (Ostwald-Verfahren, Abgaskatalysator, Knallgas)', 'Glühdraht-Versuche mit Methanol- oder Acetondampf'],
    loading: 'ein Stück Draht oder Blech mit möglichst großer Oberfläche',
    level: 'Schulversuch',
    substanceIds: ['platin'],
    catalysis: 'metall',
    guide: {
      overview:
        'Metallisches Platin katalysiert an seiner Oberfläche Oxidationen: Gase wie Wasserstoff, Ammoniak oder Methanoldampf werden dort mit Sauerstoff umgesetzt. Entscheidend ist eine saubere, aktive Oberfläche – die bekommt man durch Säurewäsche und Ausglühen.',
      ingredients: [
        { name: 'Platindraht oder -blech (z. B. Impfnadel, Elektrode)', amount: 'etwa 5 cm', substanceId: 'platin' },
        { name: 'Salzsäure, halbkonzentriert', amount: 'einige mL', substanceId: 'salzsaeure' },
        { name: 'destilliertes Wasser', amount: 'zum Spülen', substanceId: 'wasser' },
      ],
      equipment: ['Gasbrenner', 'Tiegelzange', 'Reagenzglas', 'für den Glühdraht-Versuch: Erlenmeyerkolben mit wenig Methanol oder Aceton'],
      steps: [
        'Den Draht zu einer kleinen Spirale wickeln – so wird die Oberfläche größer.',
        'In halbkonzentrierte Salzsäure tauchen, mit Wasser abspülen.',
        'In der rauschenden Brennerflamme ausglühen, bis die Flamme nicht mehr gefärbt wird. Das entfernt Fett und Reste.',
        'Aktivität prüfen: Die abgekühlte Spirale in 3-%ige Wasserstoffperoxid-Lösung tauchen – es perlt Sauerstoff (Glimmspanprobe).',
        'Glühdraht-Versuch (Lehrerversuch): Die glühend heiße Spirale über wenig Methanol in einen Erlenmeyerkolben hängen – sie glüht weiter, weil der Methanoldampf an ihr oxidiert wird.',
        'Nach Gebrauch wieder ausglühen; mit der Zeit nimmt die Aktivität durch Verunreinigungen ab.',
      ],
      equation: '2 H₂O₂ → 2 H₂O + O₂ (an Pt) · 2 CH₃OH + O₂ → 2 HCHO + 2 H₂O (am glühenden Pt)',
      check: 'Gasentwicklung in Wasserstoffperoxid, Weiterglühen über Methanoldampf.',
      storage: 'Unbegrenzt haltbar. Fettfinger vermeiden.',
      hazards: [
        'Methanol ist giftig und leicht entzündlich; beim Glühdraht-Versuch entsteht Formaldehyd – nur kleine Mengen, gut lüften, Lehrerversuch.',
        'Heiße Drähte nur mit der Tiegelzange anfassen.',
      ],
      source: 'Klassische Schulversuche zur heterogenen Katalyse (z. B. Häusler, Rampf, Reichelt: Experimente für den Chemieunterricht)',
    },
  },
  {
    id: 'cui',
    name: 'Kupfer(I)-iodid',
    short: 'CuI',
    metal: 'Kupfer',
    uses: ['Cokatalysator der Sonogashira-Kupplung', 'Ullmann-Kupplungen (C–N, C–O, C–S)', 'Kupfer-katalysierte Addition von Grignard-Reagenzien (1,4-Addition)'],
    loading: '2–10 mol%',
    level: 'Laborpraktikum',
    substanceIds: ['kupfer-i-iodid'],
    catalysis: 'metall',
    guide: {
      overview:
        'Iodid reduziert Kupfer(II) zu Kupfer(I), das als schwer lösliches Kupfer(I)-iodid ausfällt; nebenbei entsteht Iod. Thiosulfat entfernt das Iod, und zurück bleibt ein fast weißer Niederschlag.',
      ingredients: [
        { name: 'Kupfer(II)-sulfat-Pentahydrat', amount: '2,50 g (10 mmol)', substanceId: 'kupfersulfat' },
        { name: 'Kaliumiodid', amount: '3,32 g (20 mmol)', substanceId: 'kaliumiodid' },
        { name: 'Natriumthiosulfat-Pentahydrat', amount: 'etwa 1,3 g in 10 mL Wasser', substanceId: 'natriumthiosulfat' },
        { name: 'destilliertes Wasser, Ethanol', amount: 'je etwa 30 mL', substanceId: 'wasser' },
      ],
      equipment: ['zwei Bechergläser 50 mL', 'Tropfpipette', 'Büchnertrichter oder Faltenfilter', 'Exsikkator oder Trockenschrank (60 °C)'],
      steps: [
        'Kupfersulfat in 10 mL Wasser lösen (blau), Kaliumiodid in 10 mL Wasser lösen.',
        'Die Kaliumiodid-Lösung unter Rühren zur Kupfersulfat-Lösung geben: Es entsteht ein brauner Brei (Kupfer(I)-iodid, gefärbt durch Iod).',
        'Thiosulfat-Lösung zutropfen, bis die braune Farbe verschwunden ist – der Niederschlag wird weißlich.',
        'Absaugen, mit Wasser und dann mit Ethanol waschen.',
        'Im Dunkeln bei höchstens 60 °C trocknen.',
      ],
      equation: '2 Cu²⁺ + 4 I⁻ → 2 CuI↓ + I₂ · I₂ + 2 S₂O₃²⁻ → 2 I⁻ + S₄O₆²⁻',
      check: 'Weißes bis cremefarbenes Pulver. Wird es braun oder grünlich, ist es durch Licht und Luft teilweise zersetzt.',
      storage: 'Dunkel und trocken, am besten unter Argon.',
      hazards: ['Kupfersalze sind gesundheitsschädlich und giftig für Wasserorganismen – nicht in den Ausguss.', 'Iod reizt Haut und Augen.'],
      source: 'Klassische Fällung nach Lehrbüchern der anorganischen Chemie (z. B. Brauer, Handbuch der Präparativen Anorganischen Chemie)',
    },
  },
  {
    id: 'kupfer',
    name: 'Aktives Kupfer (Pulver oder Kupferspirale)',
    short: 'Cu',
    metal: 'Kupfer',
    uses: ['Oxidation von Methanol oder Ethanol zu Formaldehyd bzw. Acetaldehyd (Kupferspirale)', 'klassische Ullmann-Kupplung (Pulver)', 'Dehydrierung von Alkoholen'],
    loading: 'Spirale aus etwa 30 cm Draht bzw. 1–2 Äquivalente Pulver (Ullmann)',
    level: 'Schulversuch',
    substanceIds: ['kupfer'],
    catalysis: 'metall',
    guide: {
      overview:
        'Zwei einfache Wege zu aktivem Kupfer: Zink scheidet aus Kupfersulfat-Lösung feines, rotbraunes Kupferpulver ab; eine ausgeglühte Kupferspirale wird an der Oberfläche zu Kupferoxid und oxidiert Alkoholdampf – dabei wird sie wieder blank.',
      ingredients: [
        { name: 'Kupfer(II)-sulfat-Pentahydrat (für Pulver)', amount: '5,0 g', substanceId: 'kupfersulfat' },
        { name: 'Zinkpulver (für Pulver)', amount: '1,4 g', substanceId: 'zink' },
        { name: 'Salzsäure, verdünnt (2 mol/L)', amount: '10 mL', substanceId: 'salzsaeure' },
        { name: 'Kupferdraht (für die Spirale)', amount: 'etwa 30 cm, 1 mm', substanceId: 'kupfer' },
        { name: 'Methanol oder Ethanol (Spiralenversuch)', amount: '2 mL', substanceId: 'ethanol' },
      ],
      equipment: ['Becherglas 100 mL', 'Filter', 'Gasbrenner', 'Reagenzglas', 'Tiegelzange'],
      steps: [
        'Pulver: Kupfersulfat in 40 mL Wasser lösen, Zinkpulver in kleinen Portionen einrühren – die blaue Farbe verschwindet, rotbraunes Kupfer fällt aus.',
        'Mit verdünnter Salzsäure überschüssiges Zink auflösen (Wasserstoff entweicht, gut lüften), dann abfiltrieren.',
        'Mit Wasser, dann mit wenig Aceton waschen und rasch trocknen – feuchtes Kupferpulver oxidiert langsam.',
        'Spirale: Kupferdraht um einen Bleistift wickeln, mit der Tiegelzange in der Brennerflamme glühen: Die Oberfläche wird schwarz (Kupferoxid).',
        'Die heiße Spirale in ein Reagenzglas mit etwa 2 mL Ethanol halten (nicht eintauchen): Sie wird sofort wieder kupferrot, es riecht stechend-fruchtig nach Acetaldehyd.',
        'Glühen und Eintauchen lassen sich mehrmals wiederholen – das Kupfer wird nicht verbraucht.',
      ],
      equation: 'CuSO₄ + Zn → Cu + ZnSO₄ · 2 Cu + O₂ → 2 CuO · CuO + CH₃CH₂OH → Cu + CH₃CHO + H₂O',
      check: 'Rotbraunes Pulver bzw. eine Spirale, die über Alkoholdampf wieder blank wird.',
      storage: 'Pulver dicht verschlossen; die Spirale ist unbegrenzt haltbar.',
      hazards: [
        'Methanol ist giftig – für Schülerversuche Ethanol nehmen.',
        'Alkoholdampf ist entzündlich: Spirale nicht in die Flüssigkeit tauchen, keine offene Flamme am Reagenzglas.',
        'Acetaldehyd und Formaldehyd reizen die Atemwege – kleine Mengen, gut lüften.',
      ],
      source: 'Schulversuche «Kupferspirale» und Zementation (u. a. in den Versuchssammlungen der Schulbuchverlage)',
    },
  },
  {
    id: 'cu-ascorbat',
    name: 'Kupfer(I) aus Kupfersulfat und Ascorbat (in situ)',
    short: 'CuSO₄/Ascorbat',
    metal: 'Kupfer',
    uses: ['Kupfer-katalysierte Azid-Alkin-Cycloaddition («Click-Chemie») zu 1,2,3-Triazolen'],
    loading: '1–5 mol% CuSO₄ und 5–10 mol% Natriumascorbat',
    level: 'Laborpraktikum',
    substanceIds: ['kupfersulfat', 'ascorbinsaeure'],
    catalysis: 'metall',
    guide: {
      overview:
        'Ascorbat (Vitamin C) reduziert Kupfer(II) im Reaktionsgemisch zu Kupfer(I), dem eigentlichen Katalysator. Weil der Überschuss Ascorbat gebildetes Kupfer(II) sofort wieder reduziert, verträgt die Reaktion sogar Wasser und Luft.',
      ingredients: [
        { name: 'Kupfer(II)-sulfat-Pentahydrat', amount: '5 mol% (für 1 mmol: 12,5 mg)', substanceId: 'kupfersulfat' },
        { name: 'Natriumascorbat (oder Ascorbinsäure + Natriumhydrogencarbonat)', amount: '10 mol% (für 1 mmol: 20 mg)', substanceId: 'ascorbinsaeure' },
        { name: 'Wasser und tert-Butanol 1:1', amount: '4 mL pro mmol', substanceId: 'wasser' },
      ],
      equipment: ['Rundkolben oder Schraubdeckelglas', 'Magnetrührer'],
      steps: [
        'Alkin und Azid im Wasser-tert-Butanol-Gemisch vorlegen.',
        'Frisch bereitete Ascorbat-Lösung zugeben.',
        'Kupfersulfat-Lösung zugeben: Die Mischung wird kurz gelblich – Kupfer(I) hat sich gebildet.',
        'Bei Raumtemperatur rühren, bis das Triazol ausfällt oder das Alkin verbraucht ist (einige Stunden).',
      ],
      equation: '2 Cu²⁺ + C₆H₈O₆ → 2 Cu⁺ + C₆H₆O₆ + 2 H⁺',
      check: 'Hellgelbe Lösung; eine blaue Farbe zeigt, dass zu wenig Ascorbat da ist.',
      storage: 'Lösungen jeweils frisch ansetzen – Ascorbat oxidiert an der Luft.',
      hazards: [
        'Organische Azide können explosiv sein, besonders kleine Moleküle (Faustregel: mindestens drei Kohlenstoffatome pro Stickstoffatom). Nur kleine Mengen, nie destillieren oder erhitzen.',
        'Kupfersalze sind giftig für Wasserorganismen.',
      ],
      source: 'Nach V. V. Rostovtsev, L. G. Green, V. V. Fokin, K. B. Sharpless, Angew. Chem. 114, 2708 (2002)',
    },
  },
  {
    id: 'cu-tempo',
    name: 'Kupfer/TEMPO (aerobe Alkoholoxidation)',
    short: 'CuBr/bpy/TEMPO',
    metal: 'Kupfer',
    uses: ['Oxidation primärer Alkohole zu Aldehyden mit Luftsauerstoff – ohne Chrom und ohne Überoxidation zur Säure'],
    loading: '5 mol% CuBr, 5 mol% 2,2′-Bipyridin, 5 mol% TEMPO, 10 mol% N-Methylimidazol',
    level: 'Laborpraktikum',
    substanceIds: ['kupfer-i-bromid', 'tempo', '2-2-bipyridin'],
    catalysis: 'metall',
    guide: {
      overview:
        'Kupfer(I), Bipyridin und das stabile Radikal TEMPO bilden zusammen einen Katalysator, der Alkohole mit dem Sauerstoff der Luft zu Aldehyden oxidiert. Das Kupfer überträgt die Elektronen, TEMPO holt den Wasserstoff vom Alkohol.',
      ingredients: [
        { name: 'Kupfer(I)-bromid', amount: '5 mol% (für 1 mmol: 7 mg)', substanceId: 'kupfer-i-bromid' },
        { name: '2,2′-Bipyridin', amount: '5 mol% (8 mg)', substanceId: '2-2-bipyridin' },
        { name: 'TEMPO', amount: '5 mol% (8 mg)', substanceId: 'tempo' },
        { name: 'N-Methylimidazol', amount: '10 mol% (8 µL)' },
        { name: 'Acetonitril', amount: '1 mL pro mmol', substanceId: 'acetonitril' },
      ],
      equipment: ['offenes Reaktionsgefäß oder Kolben mit Luftballon', 'Magnetrührer'],
      steps: [
        'Den Alkohol in Acetonitril lösen.',
        'Kupfer(I)-bromid, Bipyridin und TEMPO zugeben – die Lösung wird dunkelrotbraun.',
        'N-Methylimidazol zugeben und an der Luft kräftig rühren (Luft ist das Oxidationsmittel).',
        'Der Farbumschlag von rotbraun nach grün zeigt das Ende der Reaktion an (meist 1–24 Stunden).',
        'Mit Wasser verdünnen, das Produkt mit Pentan oder Ether ausschütteln.',
      ],
      check: 'Rotbraun während der Reaktion, grün, sobald der Alkohol verbraucht ist.',
      storage: 'CuBr und TEMPO trocken und kühl; Kupfer(I)-bromid unter Argon, weil es an der Luft grün wird.',
      hazards: ['Acetonitril ist giftig und leicht entzündlich.', 'TEMPO reizt Haut und Augen.', 'Kupfersalze sind giftig für Wasserorganismen.'],
      source: 'Nach J. M. Hoover, S. S. Stahl, J. Am. Chem. Soc. 133, 16901 (2011)',
    },
  },
  {
    id: 'wilkinson',
    name: 'Wilkinson-Katalysator',
    short: 'RhCl(PPh₃)₃',
    metal: 'Rhodium',
    uses: ['homogene Hydrierung wenig substituierter Doppelbindungen – andere Gruppen (C=O, NO₂) bleiben unberührt', 'Decarbonylierung von Aldehyden'],
    loading: '0,5–2 mol%, Wasserstoff 1 bar',
    level: 'Fortgeschritten',
    substanceIds: [],
    catalysis: 'metall',
    guide: {
      overview:
        'Rhodium(III)-chlorid wird in siedendem Ethanol von einem großen Überschuss Triphenylphosphin reduziert. Es entsteht der weinrote Rhodium(I)-Komplex, der sich in organischen Lösungsmitteln löst und Wasserstoff in Lösung überträgt.',
      ingredients: [
        { name: 'Rhodium(III)-chlorid-Trihydrat', amount: '0,50 g (1,9 mmol)', substanceId: 'rhodium-iii-chlorid' },
        { name: 'Triphenylphosphin', amount: '3,0 g (11,4 mmol, 6 Äquivalente)', substanceId: 'triphenylphosphin' },
        { name: 'Ethanol, entgast', amount: '17 mL + 90 mL', substanceId: 'ethanol' },
        { name: 'Diethylether', amount: '15 mL zum Waschen' },
      ],
      equipment: ['Dreihalskolben 250 mL mit Rückflusskühler', 'Stickstoffanschluss', 'Heizpilz', 'Glasfritte'],
      steps: [
        'Triphenylphosphin in 90 mL heißem Ethanol unter Stickstoff lösen und zum Sieden bringen.',
        'Rhodiumchlorid in 17 mL heißem Ethanol lösen und zur siedenden Phosphinlösung geben.',
        '30 Minuten unter Rückfluss kochen: Es fallen weinrote bis rotviolette Kristalle aus.',
        'Heiß abfiltrieren, mit wenig Ether waschen und im Vakuum trocknen. Ausbeute etwa 85 %.',
      ],
      equation: 'RhCl₃·3 H₂O + 4 PPh₃ → RhCl(PPh₃)₃ + Ph₃PO + 2 HCl + 2 H₂O (Ethanol wirkt mit)',
      check: 'Weinrote Kristalle; die Lösung in Benzol oder Toluol ist rotbraun.',
      storage: 'Unter Stickstoff oder Argon; in Lösung reagiert er mit Luftsauerstoff.',
      hazards: ['Rhodiumsalze sind gesundheitsschädlich und reizend.', 'Ethanol und Ether sind leicht bzw. extrem entzündlich.', 'Triphenylphosphin reizt und kann Organe schädigen.'],
      source: 'Nach J. A. Osborn, G. Wilkinson, Inorganic Syntheses 10, S. 67 (1967), auf 1/4 umgerechnet',
    },
  },
  {
    id: 'grubbs',
    name: 'Grubbs-Katalysator (2. Generation)',
    short: 'Ru=CHPh',
    metal: 'Ruthenium',
    uses: ['Olefinmetathese: Ringschluss (RCM), Kreuzmetathese, ringöffnende Polymerisation'],
    loading: '1–5 mol%',
    level: 'Nur Fachlabor',
    substanceIds: ['grubbs-katalysator'],
    catalysis: 'metall',
    guide: {
      overview:
        'Ein Ruthenium-Carbenkomplex, der C=C-Doppelbindungen «aufschneidet» und neu verknüpft (Nobelpreis 2005). Die Herstellung braucht ein explosives, giftiges Diazoalkan und wird hier deshalb nicht beschrieben – der Katalysator wird gekauft. Hier steht, wie man ihn richtig einsetzt.',
      ingredients: [
        { name: 'Grubbs-Katalysator 2. Generation (gekauft)', amount: '1–5 mol%', substanceId: 'grubbs-katalysator' },
        { name: 'Dichlormethan oder Toluol, trocken und entgast', amount: 'so viel, dass das Substrat 0,005–0,05 mol/L ist (Ringschluss verdünnt!)' },
        { name: 'Ethylvinylether', amount: 'einige Tropfen zum Beenden' },
      ],
      equipment: ['Schlenkkolben mit Rückflusskühler', 'Argonanschluss', 'Spritzen'],
      steps: [
        'Das Dien im entgasten, trockenen Lösungsmittel unter Argon lösen – für Ringschlüsse stark verdünnt, damit keine Polymere entstehen.',
        'Den Katalysator als Feststoff oder in wenig Lösungsmittel zugeben.',
        'Bei Raumtemperatur bis 40 °C rühren; das entstehende Ethen entweicht (leichter Argonstrom hilft).',
        'Mit einigen Tropfen Ethylvinylether den Katalysator deaktivieren.',
        'Rutheniumreste durch Filtration über Kieselgel oder Aktivkohle entfernen.',
      ],
      check: 'Die rotbraune Lösung wird im Verlauf dunkler; Gasbläschen (Ethen) zeigen die Metathese an.',
      storage: 'Als Feststoff an der Luft einige Zeit stabil; langfristig unter Argon im Kühlschrank.',
      hazards: ['Dichlormethan ist krebsverdächtig – Abzug.', 'Rutheniumverbindungen sind gesundheitsschädlich; Rückstände als Schwermetall entsorgen.'],
      buyAdvice: 'Nur kaufen. Die Synthese (aus RuCl₂(PPh₃)₃ und Phenyldiazomethan, danach Ligandenaustausch) gehört in ein metallorganisches Fachlabor.',
      source: 'Nach R. H. Grubbs et al., Org. Lett. 1, 953 (1999); Einsatz nach gängigen Metathese-Vorschriften',
      purchaseOnly: true,
    },
  },
  {
    id: 'mno2',
    name: 'Braunstein (Mangan(IV)-oxid)',
    short: 'MnO₂',
    metal: 'Mangan',
    uses: ['Zerfall von Wasserstoffperoxid zu Sauerstoff', 'Zerfall von Kaliumchlorat', 'Oxidation allylischer und benzylischer Alkohole (aktiver Braunstein, stöchiometrisch)'],
    loading: 'eine Spatelspitze (für H₂O₂-Zerfall)',
    level: 'Schulversuch',
    substanceIds: ['mangandioxid'],
    catalysis: 'metall',
    guide: {
      overview:
        'Permanganat und Mangan(II)-Salz komproportionieren zu Mangan(IV)-oxid, das als braunschwarzer Niederschlag ausfällt. Frisch gefällter Braunstein hat eine große Oberfläche und zersetzt Wasserstoffperoxid besonders schnell.',
      ingredients: [
        { name: 'Kaliumpermanganat', amount: '1,6 g (10 mmol)', substanceId: 'kaliumpermanganat' },
        { name: 'Mangan(II)-sulfat-Monohydrat', amount: '2,5 g (15 mmol)', substanceId: 'mangan-ii-sulfat' },
        { name: 'destilliertes Wasser', amount: '70 mL + zum Waschen', substanceId: 'wasser' },
      ],
      equipment: ['Becherglas 250 mL', 'Heizplatte mit Magnetrührer', 'Büchnertrichter', 'Trockenschrank 110 °C'],
      steps: [
        'Kaliumpermanganat in 50 mL Wasser lösen (violett), Mangansulfat in 20 mL Wasser lösen.',
        'Die Mangansulfat-Lösung unter Rühren zur Permanganat-Lösung geben: Sofort fällt braunschwarzer Braunstein.',
        '30 Minuten bei 60–80 °C rühren, damit sich der Niederschlag besser filtrieren lässt.',
        'Absaugen und mit Wasser waschen, bis das Filtrat farblos ist.',
        'Bei 110 °C trocknen.',
        'Prüfen: Eine Spatelspitze in 3-%ige Wasserstoffperoxid-Lösung geben – kräftiges Schäumen, ein glimmender Span flammt auf.',
      ],
      equation: '2 KMnO₄ + 3 MnSO₄ + 2 H₂O → 5 MnO₂ + K₂SO₄ + 2 H₂SO₄',
      check: 'Braunschwarzes Pulver, das Wasserstoffperoxid sofort zersetzt und danach unverändert zurückbleibt.',
      storage: 'Unbegrenzt haltbar, trocken lagern.',
      hazards: ['Kaliumpermanganat ist brandfördernd und gesundheitsschädlich; nicht mit organischen Stoffen mischen.', 'Mangansalze sind gesundheitsschädlich beim Einatmen.', 'Konzentriertes Wasserstoffperoxid (über 10 %) nicht verwenden – heftige Reaktion.'],
      source: 'Komproportionierung nach Lehrbüchern der anorganischen Chemie (Holleman-Wiberg); Katalyseversuch nach Schulversuchssammlungen',
    },
  },
  {
    id: 'v2o5',
    name: 'Vanadium(V)-oxid (Kontaktkatalysator)',
    short: 'V₂O₅',
    metal: 'Vanadium',
    uses: ['Oxidation von Schwefeldioxid zu Schwefeltrioxid (Kontaktverfahren, Schwefelsäure)', 'Oxidation von o-Xylol bzw. Naphthalin zu Phthalsäureanhydrid'],
    loading: 'als Schüttung im Rohr (z. B. auf Glaswolle oder Kieselgel), 400–450 °C',
    level: 'Nur Fachlabor',
    substanceIds: ['vanadium-v-oxid'],
    catalysis: 'metall',
    guide: {
      overview:
        'Ammoniummetavanadat zerfällt beim Glühen in Vanadium(V)-oxid, Ammoniak und Wasser. Das orangebraune Oxid wechselt im Kontaktverfahren zwischen V(V) und V(IV) und überträgt so Sauerstoff auf Schwefeldioxid.',
      ingredients: [
        { name: 'Ammoniummetavanadat (NH₄VO₃)', amount: '2,0 g' },
        { name: 'Glaswolle oder Kieselgel als Träger (für den Kontaktversuch)', amount: 'etwa 2 g' },
      ],
      equipment: ['Porzellantiegel mit Deckel', 'Muffelofen oder Brenner mit Tondreieck', 'Abzug', 'Exsikkator'],
      steps: [
        'Ammoniummetavanadat in den Porzellantiegel füllen.',
        'Im Abzug langsam erhitzen: Ab etwa 200 °C entweichen Ammoniak und Wasser (stechender Geruch).',
        'Eine Stunde bei 450–500 °C glühen, bis die Masse einheitlich orangebraun ist.',
        'Im Exsikkator abkühlen lassen.',
        'Für den Kontaktversuch das Pulver mit Glaswolle vermischen und locker in ein schwer schmelzbares Glasrohr füllen.',
      ],
      equation: '2 NH₄VO₃ → V₂O₅ + 2 NH₃ + H₂O',
      check: 'Orangebraunes Pulver; wird beim Erhitzen dunkler und beim Abkühlen wieder heller.',
      storage: 'Dicht verschlossen, gekennzeichnet als giftig.',
      hazards: [
        'Vanadium(V)-oxid ist giftig beim Einatmen, gilt als krebserzeugend und erbgutverändernd – Staub vermeiden, nur im Abzug, Atemschutz beim Umfüllen.',
        'Beim Glühen entweicht Ammoniak.',
        'Der Kontaktversuch selbst arbeitet mit Schwefeldioxid und bildet Schwefeltrioxid (ätzende Nebel) – nur im Fachlabor unter dem Abzug.',
      ],
      source: 'Thermolyse von Ammoniummetavanadat nach Brauer, Handbuch der Präparativen Anorganischen Chemie',
    },
  },
  {
    id: 'eisen-haber',
    name: 'Eisenkatalysator (Haber-Bosch)',
    short: 'Fe (K₂O, Al₂O₃)',
    metal: 'Eisen',
    uses: ['Ammoniaksynthese aus Stickstoff und Wasserstoff', 'Fischer-Tropsch-Synthese (Eisen- oder Cobaltkatalysator)'],
    loading: 'technisch als Schüttung im Reaktor, 400–500 °C, 150–300 bar',
    level: 'Nur Fachlabor',
    substanceIds: ['eisen'],
    catalysis: 'metall',
    guide: {
      overview:
        'Der Katalysator der Ammoniaksynthese ist Eisen mit Zusätzen («Promotoren»): Aluminiumoxid verhindert, dass die feinen Eisenkristalle zusammensintern, Kaliumoxid erhöht die Aktivität. Er wird als Magnetit mit den Zusätzen erschmolzen und erst im Reaktor zu Eisen reduziert. Im Schullabor lässt sich die Ammoniaksynthese nicht sinnvoll nachbauen – hier steht, wie der Katalysator technisch entsteht.',
      ingredients: [
        { name: 'Magnetit (Fe₃O₄)', amount: 'Hauptbestandteil' },
        { name: 'Aluminiumoxid', amount: '2–3 %' },
        { name: 'Kaliumoxid (als Carbonat eingetragen)', amount: 'etwa 1 %' },
        { name: 'Calciumoxid', amount: '2–3 %' },
      ],
      equipment: ['Elektrolichtbogenofen (technisch)', 'Brecher und Siebe', 'Reaktor mit Synthesegas'],
      steps: [
        'Magnetit mit den Oxiden der Promotoren mischen.',
        'Bei etwa 1600 °C im Lichtbogenofen zusammenschmelzen.',
        'Die erstarrte Schmelze brechen und auf Körner von einigen Millimetern sieben.',
        'Im Reaktor mit Wasserstoff und Stickstoff langsam aufheizen: Das Oxid wird zu porösem, hochaktivem Eisen reduziert.',
        'Danach läuft die Synthese bei 400–500 °C und 150–300 bar.',
      ],
      equation: 'Fe₃O₄ + 4 H₂ → 3 Fe + 4 H₂O · N₂ + 3 H₂ ⇌ 2 NH₃ (am Eisen)',
      check: 'Technisch: Ammoniakgehalt am Reaktorausgang (etwa 15–20 %).',
      storage: 'Reduziertes Eisen ist pyrophor; es wird für den Transport oberflächlich passiviert.',
      hazards: ['Wasserstoff unter hohem Druck: Explosionsgefahr.', 'Ammoniak ist giftig und ätzend.', 'Fein verteiltes Eisen kann sich an der Luft entzünden.'],
      source: 'Nach A. Mittasch (BASF, 1909–1912); Darstellung wie in Holleman-Wiberg, Lehrbuch der Anorganischen Chemie',
    },
  },
  {
    id: 'febr3',
    name: 'Eisen(III)-bromid aus Eisen und Brom (in situ)',
    short: 'FeBr₃',
    metal: 'Eisen',
    uses: ['Bromierung von Aromaten (elektrophile Substitution)', 'Friedel-Crafts-Reaktionen (Eisen(III)-chlorid)'],
    loading: '1–5 mol% Eisen, bezogen auf den Aromaten',
    level: 'Fortgeschritten',
    substanceIds: ['eisen', 'eisen-iii-bromid'],
    catalysis: 'lewis',
    guide: {
      overview:
        'Ein paar Eisenspäne im Reaktionsgefäß reagieren mit dem ersten Brom zu Eisen(III)-bromid. Diese Lewis-Säure polarisiert das Brommolekül so stark, dass es den Aromaten angreifen kann.',
      ingredients: [
        { name: 'Eisenspäne oder Eisenpulver', amount: '0,05–0,1 g', substanceId: 'eisen' },
        { name: 'Brom', amount: '1 Äquivalent zum Aromaten', substanceId: 'brom' },
        { name: 'Aromat (z. B. Toluol)', amount: 'laut Vorschrift' },
      ],
      equipment: ['Dreihalskolben mit Tropftrichter und Rückflusskühler', 'Gasableitung in Natronlauge oder Thiosulfatlösung (für HBr)', 'Abzug'],
      steps: [
        'Aromat und Eisenspäne im Kolben vorlegen.',
        'Einige Tropfen Brom zugeben und abwarten, bis die Reaktion anspringt (Entfärbung, Bromwasserstoff entweicht).',
        'Das restliche Brom langsam zutropfen; der entstehende Bromwasserstoff wird in Lauge geleitet.',
        'Nach dem Ende der Gasentwicklung kurz erwärmen, dann mit Wasser und verdünnter Natronlauge aufarbeiten.',
      ],
      equation: '2 Fe + 3 Br₂ → 2 FeBr₃ · FeBr₃ + Br₂ → FeBr₄⁻ + Br⁺ (Elektrophil)',
      check: 'Das Brom entfärbt sich, Bromwasserstoff bildet an feuchter Luft Nebel.',
      storage: 'Wird im Ansatz frisch gebildet; wasserfreies FeBr₃ oder FeCl₃ zieht Wasser und muss dicht verschlossen gelagert werden.',
      hazards: ['Brom ist sehr giftig und verätzt Haut und Atemwege – nur im Abzug mit Schutzhandschuhen, Thiosulfatlösung bereithalten.', 'Bromwasserstoff ist ätzend.'],
      source: 'Klassische Arbeitsweise der Aromatenbromierung (z. B. Organikum, Kapitel Elektrophile Substitution)',
    },
  },
  {
    id: 'ti-oipr4',
    name: 'Titan(IV)-isopropanolat',
    short: 'Ti(OiPr)₄',
    metal: 'Titan',
    uses: ['Umesterung und Veresterung unter milden, nicht sauren Bedingungen', 'direkte Amidbildung aus Carbonsäuren und Aminen', 'Sharpless-Epoxidierung (mit Weinsäureester)'],
    loading: '1–10 mol%',
    level: 'Nur Fachlabor',
    substanceIds: [],
    catalysis: 'metall',
    guide: {
      overview:
        'Titan ist eine milde Lewis-Säure: Es bindet an den Carbonyl-Sauerstoff und macht Ester und Säuren reaktiver, ohne starke Säure. Titanalkoxide entstehen aus Titantetrachlorid und Alkohol, wobei Ammoniak das frei werdende HCl abfängt.',
      ingredients: [
        { name: 'Titan(IV)-chlorid', amount: '19,0 g (0,10 mol)' },
        { name: '2-Propanol, wasserfrei', amount: '24,0 g (0,40 mol)' },
        { name: 'Ammoniak, trocken (Gas)', amount: 'bis zur Sättigung', substanceId: 'ammoniak' },
        { name: 'Toluol, wasserfrei', amount: '150 mL', substanceId: 'toluol' },
      ],
      equipment: ['Dreihalskolben mit Gaseinleitung, Tropftrichter und Rückflusskühler', 'Schutzgas', 'Schlenkfritte', 'Vakuumdestillation', 'Abzug'],
      steps: [
        'Unter Argon Titan(IV)-chlorid in Toluol lösen und mit Eis kühlen.',
        '2-Propanol langsam zutropfen – es entweicht Chlorwasserstoff.',
        'Trockenes Ammoniak einleiten, bis kein Ammoniumchlorid mehr ausfällt.',
        'Ammoniumchlorid unter Schutzgas abfiltrieren.',
        'Toluol abdestillieren und das farblose Titan(IV)-isopropanolat im Vakuum destillieren.',
      ],
      equation: 'TiCl₄ + 4 (CH₃)₂CHOH + 4 NH₃ → Ti(OCH(CH₃)₂)₄ + 4 NH₄Cl',
      check: 'Farblose bis gelbliche Flüssigkeit, die an feuchter Luft sofort weiße Titandioxid-Krusten bildet.',
      storage: 'Unter Argon, absolut wasserfrei.',
      hazards: ['Titantetrachlorid reagiert heftig mit Wasser und Luftfeuchtigkeit zu Salzsäurenebeln – nur im Abzug mit Schutzgas.', 'Ammoniak ist giftig und ätzend.', 'Toluol ist leicht entzündlich und fruchtschädigend.'],
      buyAdvice: 'Titan(IV)-isopropanolat ist günstig zu kaufen; die Herstellung lohnt nur im Fachlabor.',
      source: 'Nach D. C. Bradley, R. C. Mehrotra, W. Wardlaw, J. Chem. Soc. 1952, 2027',
    },
  },
  {
    id: 'cu-zno',
    name: 'Kupfer-Zinkoxid-Katalysator',
    short: 'Cu/ZnO/Al₂O₃',
    metal: 'Kupfer',
    uses: ['Methanolsynthese aus Synthesegas', 'Wassergas-Shift-Reaktion bei tiefer Temperatur'],
    loading: 'als Schüttung im Reaktor, 220–280 °C, 50–100 bar',
    level: 'Nur Fachlabor',
    substanceIds: [],
    catalysis: 'metall',
    guide: {
      overview:
        'Kupfer-, Zink- und Aluminiumnitrat werden gemeinsam als Carbonate gefällt, getrocknet und geglüht. Erst im Reaktor reduziert Wasserstoff das Kupferoxid zu winzigen Kupferteilchen auf Zinkoxid – dem aktiven Zentrum der Methanolsynthese.',
      ingredients: [
        { name: 'Kupfer(II)-nitrat-Trihydrat', amount: '14,5 g (60 mmol)', substanceId: 'kupfer-ii-nitrat' },
        { name: 'Zinknitrat-Hexahydrat', amount: '8,9 g (30 mmol)', substanceId: 'zinknitrat' },
        { name: 'Aluminiumnitrat-Nonahydrat', amount: '3,75 g (10 mmol)', substanceId: 'aluminiumnitrat' },
        { name: 'Natriumcarbonat-Lösung 1 mol/L', amount: 'etwa 120 mL', substanceId: 'natriumcarbonat' },
        { name: 'destilliertes Wasser', amount: '200 mL + zum Waschen', substanceId: 'wasser' },
      ],
      equipment: ['Becherglas 1 L mit Rührer und Heizplatte', 'pH-Meter', 'Büchnertrichter', 'Trockenschrank', 'Muffelofen', 'Rohrofen mit Formiergas (5 % H₂ in N₂)'],
      steps: [
        'Die Nitrate gemeinsam in 200 mL Wasser lösen.',
        'Bei 65 °C unter kräftigem Rühren Natriumcarbonat-Lösung zutropfen, bis pH 7 erreicht ist – ein hellblauer Niederschlag fällt.',
        'Eine Stunde bei 65 °C altern lassen (der Niederschlag wird grünlich).',
        'Absaugen und mit warmem Wasser nitratfrei waschen.',
        'Über Nacht bei 110 °C trocknen, dann 4 Stunden bei 350 °C an Luft glühen (CuO/ZnO/Al₂O₃).',
        'Vor dem Einsatz im Formiergas-Strom bei 250 °C reduzieren.',
      ],
      check: 'Nach dem Glühen schwarzes Pulver (Kupferoxid), nach der Reduktion rotbraun.',
      storage: 'Als Oxid haltbar; reduziert nur unter Schutzgas (pyrophor).',
      hazards: ['Nitrate sind brandfördernd.', 'Wasserstoff- bzw. Formiergas: Explosionsgefahr beim Reduzieren.', 'Kupfer- und Zinksalze sind giftig für Wasserorganismen.'],
      source: 'Co-Fällung nach der Literatur zu Methanolsynthese-Katalysatoren (z. B. M. Behrens et al., Science 336, 893 (2012))',
    },
  },
  {
    id: 'ni-al2o3',
    name: 'Nickel auf Aluminiumoxid (Methanisierungskatalysator)',
    short: 'Ni/Al₂O₃',
    metal: 'Nickel',
    uses: ['Methanisierung von CO₂ und CO (Sabatier-Reaktion, Power-to-Gas)', 'Dampf- und Trockenreformierung von Methan', 'Hydrierungen in der Gasphase'],
    loading: 'als Schüttung im Rohrreaktor; im Labor 0,5–2 g für einige 100 mL Gas pro Minute, 250–400 °C',
    level: 'Nur Fachlabor',
    substanceIds: ['nickel'],
    catalysis: 'metall',
    guide: {
      overview:
        'Poröses Aluminiumoxid wird mit einer Nickelnitrat-Lösung getränkt, getrocknet und geglüht. Dabei entsteht fein verteiltes Nickeloxid auf der großen Oberfläche des Trägers; erst im Wasserstoffstrom wird es zu metallischem Nickel reduziert – dem aktiven Katalysator der Sabatier-Reaktion.',
      ingredients: [
        { name: 'Nickel(II)-nitrat-Hexahydrat', amount: '4,95 g (≙ 1,0 g Ni)', substanceId: 'nickel-ii-nitrat' },
        { name: 'γ-Aluminiumoxid (Pulver oder Kugeln, große Oberfläche)', amount: '9,0 g', substanceId: 'aluminiumoxid' },
        { name: 'destilliertes Wasser', amount: 'so viel, wie der Träger aufsaugt (etwa 8 mL)', substanceId: 'wasser' },
        { name: 'Wasserstoff oder Formiergas (5 % H₂ in N₂)', amount: 'zum Reduzieren', substanceId: 'wasserstoff' },
      ],
      equipment: ['Porzellanschale', 'Trockenschrank (110 °C)', 'Muffelofen (450 °C)', 'Rohrofen mit Quarzrohr und Gasversorgung', 'Abzug'],
      steps: [
        'Das Porenvolumen des Aluminiumoxids bestimmen: Wasser auf eine kleine Probe tropfen, bis sie gerade feucht glänzt (meist etwa 0,9 mL pro Gramm).',
        'Nickelnitrat in genau diesem Volumen Wasser lösen (grüne Lösung) und tropfenweise unter Rühren auf das Aluminiumoxid geben, bis alles gleichmäßig durchfeuchtet ist (Trockenimprägnierung).',
        'Über Nacht bei 110 °C trocknen.',
        'Im Muffelofen langsam auf 450 °C heizen und 4 Stunden glühen – Nitrat zerfällt (braune Stickoxide, Abzug!), es bleibt Nickeloxid auf dem Träger.',
        'Vor dem Einsatz im Rohrofen im Wasserstoff- bzw. Formiergasstrom 2 Stunden bei 450–500 °C reduzieren; das Pulver wird dabei schwarz.',
        'Im Reaktor direkt weiterverwenden – nicht an Luft bringen, solange er heiß ist.',
      ],
      equation: 'Ni(NO₃)₂ → NiO + 2 NO₂ + ½ O₂ (Glühen) · NiO + H₂ → Ni + H₂O (Reduktion) · CO₂ + 4 H₂ ⇌ CH₄ + 2 H₂O (an Ni)',
      check: 'Nach dem Glühen grau-grünes Pulver (NiO), nach der Reduktion schwarz. Im Test bildet sich am Reaktorausgang Methan (Brennprobe, Gaschromatograph).',
      storage: 'Als Oxid unbegrenzt haltbar; der reduzierte Katalysator ist pyrophor und muss vor dem Ausbau mit wenig Luft im Stickstoffstrom passiviert werden.',
      hazards: [
        'Nickelverbindungen sind krebserzeugend und sensibilisierend – Staub vermeiden, Handschuhe und Atemschutz beim Umfüllen.',
        'Beim Glühen entstehen giftige Stickoxide – nur im Abzug.',
        'Wasserstoff bildet mit Luft explosive Gemische; die Anlage vor dem Aufheizen mit Stickstoff spülen.',
        'Frisch reduziertes Nickel entzündet sich an der Luft von selbst.',
      ],
      buyAdvice: 'Methanisierungskatalysatoren gibt es fertig (Nickel auf Aluminiumoxid, 10–20 % Ni); für Laborreaktoren die einfachere Wahl.',
      source: 'Trockenimprägnierung nach J. Haber, J. H. Block, B. Delmon, Pure Appl. Chem. 67, 1257 (1995); Sabatier-Bedingungen nach W. Wang et al., Chem. Soc. Rev. 40, 3703 (2011)',
    },
  },
  {
    id: 'silber',
    name: 'Silberkatalysator auf Aluminiumoxid',
    short: 'Ag/Al₂O₃',
    metal: 'Silber',
    uses: ['Ethylenoxid aus Ethen und Sauerstoff', 'Formaldehyd aus Methanol (Silberkatalysator-Verfahren)'],
    loading: 'als Schüttung im Rohrreaktor, 220–280 °C (Ethylenoxid) bzw. 600–650 °C (Formaldehyd)',
    level: 'Fortgeschritten',
    substanceIds: ['silber'],
    catalysis: 'metall',
    guide: {
      overview:
        'Silbernitrat wird auf Aluminiumoxid-Kügelchen aufgezogen und mit alkalischer Formaldehyd-Lösung zu metallischem Silber reduziert. Die dünne Silberschicht bindet Sauerstoff so, dass er ein einzelnes Sauerstoffatom auf Ethen überträgt – statt es zu verbrennen.',
      ingredients: [
        { name: 'Silbernitrat', amount: '1,6 g (≙ 1,0 g Ag)', substanceId: 'silbernitrat' },
        { name: 'α-Aluminiumoxid-Kugeln (Träger)', amount: '10 g', substanceId: 'aluminiumoxid' },
        { name: 'Formaldehyd-Lösung 37 %', amount: '2 mL', substanceId: 'formaldehyd' },
        { name: 'Natronlauge 2 mol/L', amount: 'etwa 10 mL', substanceId: 'natriumhydroxid' },
        { name: 'destilliertes Wasser', amount: '20 mL + zum Waschen', substanceId: 'wasser' },
      ],
      equipment: ['Becherglas 100 mL', 'Magnetrührer', 'Büchnertrichter', 'Trockenschrank', 'Abzug'],
      steps: [
        'Silbernitrat in 10 mL Wasser lösen und die Aluminiumoxid-Kugeln darin 15 Minuten ziehen lassen.',
        'Die überstehende Lösung abgießen und auffangen; die Kugeln in ein Becherglas mit 10 mL Wasser geben.',
        'Formaldehyd-Lösung zugeben, dann unter Rühren langsam Natronlauge zutropfen: Das Silber scheidet sich grau bis schwarz auf den Kugeln ab.',
        'Die aufgefangene Silberlösung ebenso reduzieren – nie unreduziert stehen lassen.',
        'Die Kugeln mit Wasser waschen, bis das Waschwasser neutral ist, und bei 110 °C trocknen.',
        'Vor dem Einsatz im Luftstrom 2 Stunden bei 250 °C tempern.',
      ],
      equation: '2 Ag⁺ + HCHO + 3 OH⁻ → 2 Ag + HCOO⁻ + 2 H₂O · 2 C₂H₄ + O₂ → 2 C₂H₄O (an Ag)',
      check: 'Gleichmäßig grau-silbrige Kugeln; das Silber haftet und reibt sich nicht ab.',
      storage: 'Trocken und dunkel, unbegrenzt haltbar.',
      hazards: [
        'Silbernitrat ist ätzend, brandfördernd und färbt die Haut schwarz – Handschuhe.',
        'Formaldehyd ist giftig und krebserzeugend – Abzug.',
        'Silberlösungen mit Ammoniak (Tollens-Reagenz) nie aufbewahren – daraus kann explosives Silbernitrid entstehen; diese Anleitung kommt ohne Ammoniak aus.',
        'Ethylenoxid ist giftig, krebserzeugend und hochentzündlich – der Einsatz des Katalysators gehört in ein Fachlabor mit geschlossener Anlage.',
      ],
      source: 'Reduktive Abscheidung nach Brauer, Handbuch der Präparativen Anorganischen Chemie; Einsatz nach Ullmann’s Encyclopedia of Industrial Chemistry, «Ethylene Oxide»',
    },
  },
  {
    id: 'hrh-co',
    name: 'Carbonylhydridotris(triphenylphosphin)rhodium(I)',
    short: 'HRh(CO)(PPh₃)₃',
    metal: 'Rhodium',
    uses: ['Hydroformylierung von Alkenen zu Aldehyden (Oxo-Synthese, Ruhrchemie/Rhône-Poulenc)', 'Isomerisierung und Hydrierung von Alkenen'],
    loading: '0,01–0,5 mol% Rh mit Überschuss Triphenylphosphin, CO/H₂ 1:1 bei 10–50 bar und 80–120 °C',
    level: 'Fortgeschritten',
    substanceIds: [],
    catalysis: 'metall',
    guide: {
      overview:
        'Rhodium(III)-chlorid wird in siedendem Ethanol mit viel Triphenylphosphin, Formaldehyd und Kalilauge umgesetzt: Formaldehyd liefert das CO und den Hydrid-Wasserstoff, Phosphin und Ethanol reduzieren Rh(III) zu Rh(I). Der gelbe Komplex ist der klassische Katalysator der Hydroformylierung.',
      ingredients: [
        { name: 'Rhodium(III)-chlorid-Trihydrat', amount: '0,26 g (1,0 mmol)', substanceId: 'rhodium-iii-chlorid' },
        { name: 'Triphenylphosphin', amount: '2,64 g (10 mmol)', substanceId: 'triphenylphosphin' },
        { name: 'Formaldehyd-Lösung 37–40 %', amount: '20 mL', substanceId: 'formaldehyd' },
        { name: 'Kaliumhydroxid', amount: '0,8 g in 20 mL Ethanol', substanceId: 'kaliumhydroxid' },
        { name: 'Ethanol', amount: '100 mL + 20 mL + zum Waschen', substanceId: 'ethanol' },
      ],
      equipment: ['Dreihalskolben 250 mL mit Rückflusskühler', 'Stickstoffanschluss', 'Heizpilz mit Rührer', 'Glasfritte', 'Abzug'],
      steps: [
        'Triphenylphosphin in 100 mL Ethanol unter Stickstoff zum Sieden bringen und kräftig rühren.',
        'Nacheinander zügig zugeben: die Lösung von Rhodiumchlorid in 20 mL Ethanol, die Formaldehyd-Lösung und die ethanolische Kalilauge.',
        '10 Minuten unter Rückfluss kochen – der gelbe Komplex kristallisiert aus.',
        'Abkühlen lassen, abfiltrieren und nacheinander mit Ethanol, Wasser, Ethanol und Hexan waschen.',
        'Im Vakuum trocknen.',
      ],
      equation: 'RhCl₃ + 3 PPh₃ + HCHO + KOH → HRh(CO)(PPh₃)₃ + … (Formaldehyd liefert CO und H)',
      check: 'Hellgelbe Kristalle; im IR-Spektrum eine CO-Bande bei etwa 1920 cm⁻¹.',
      storage: 'Unter Stickstoff oder Argon, kühl und dunkel.',
      hazards: [
        'Rhodiumsalze sind gesundheitsschädlich.',
        'Formaldehyd ist giftig und krebserzeugend; Kalilauge ist ätzend – Abzug, Handschuhe.',
        'Bei der Anwendung: Kohlenmonoxid ist sehr giftig, Synthesegas unter Druck nur im Autoklaven eines Fachlabors.',
      ],
      source: 'Nach N. Ahmad, J. J. Levison, S. D. Robinson, M. F. Uttley, Inorganic Syntheses 15, S. 59 (1974), auf 1 mmol umgerechnet',
    },
  },
];

const BY_ID = new Map(METAL_CATALYSTS.map((catalyst) => [catalyst.id, catalyst]));

export function metalCatalystById(id: string): MetalCatalyst | undefined {
  return BY_ID.get(id);
}
