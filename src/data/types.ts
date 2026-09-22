/** Datenmodell der Reaktions- und Stoffdatenbank. */

export type ReactionCategory =
  | 'organisch'
  | 'anorganisch'
  | 'elektrochemie'
  | 'technisch'
  | 'analytik';

export type ReagentRole =
  | 'Reagenz'
  | 'Katalysator'
  | 'Lösungsmittel'
  | 'Base'
  | 'Säure'
  | 'Oxidationsmittel'
  | 'Reduktionsmittel'
  | 'Elektrolyt'
  | 'Leitsalz'
  | 'Mediator'
  | 'Schutzgas'
  | 'Trockenmittel';

export interface Reagent {
  name: string;
  formula?: string;
  smiles?: string;
  role: ReagentRole;
  /** Äquivalente bezogen auf das Substrat, z. B. "1,2 Äq." */
  equivalents?: string;
  note?: string;
}

export interface Conditions {
  temperature: string;
  duration?: string;
  solvent?: string;
  atmosphere?: string;
  pressure?: string;
  apparatus?: string;
  workup?: string;
  purification?: string;
  monitoring?: string;
}

export interface ProcedureStep {
  title: string;
  detail: string;
  caution?: string;
  tip?: string;
}

export interface MechanismStep {
  title: string;
  /** Reaktions-SMILES dieses Teilschritts für die grafische Darstellung */
  rxnSmiles?: string;
  description: string;
  /** Elektronenfluss im Pfeilformalismus, in Worten beschrieben */
  electronFlow?: string;
  intermediate?: string;
  /** relative freie Energie in kJ/mol für das Energieprofil */
  relativeEnergy?: number;
  rateDetermining?: boolean;
}

export interface Mechanism {
  /** Kurzbezeichnung, z. B. "SN2" oder "Additions-Eliminierungs-Mechanismus" */
  type: string;
  summary: string;
  steps: MechanismStep[];
  stereochemistry?: string;
  kinetics?: string;
  /** Hinweise auf konkurrierende Reaktionswege */
  competingPathways?: string;
  /**
   * Energieniveau der Produkte relativ zu den Edukten in kJ/mol.
   * Schließt das Energieprofil ab; ohne diesen Wert endet die Kurve beim
   * letzten angegebenen Schritt.
   */
  productEnergy?: number;
}

export type SafetyLevel =
  | 'Schulversuch'
  | 'Laborpraktikum'
  | 'Fortgeschritten'
  | 'Nur Fachlabor';

export interface SafetyInfo {
  /** GHS-Piktogrammcodes, z. B. "GHS02" */
  ghs: string[];
  hazards: string[];
  precautions: string[];
  ppe: string[];
  waste: string;
  level: SafetyLevel;
}

export interface ElectroSpec {
  cellType: string;
  anode: string;
  cathode: string;
  electrolyte: string;
  mode: 'galvanostatisch' | 'potentiostatisch' | 'Wechselstrom';
  currentDensity?: string;
  potential?: string;
  /** Ladungsmenge je Mol Substrat, z. B. "2,2 F/mol" */
  charge?: string;
  faradaicEfficiency?: string;
  mediator?: string;
  /** Zahl der übertragenen Elektronen für den Faraday-Rechner */
  electrons?: number;
}

export interface ReactionReference {
  title: string;
  source: string;
  url?: string;
}

export interface ExampleReaction {
  /** SMILES des Beispielsubstrats */
  substrate: string;
  /** vollständiges Reaktions-SMILES "Edukte>Reagenzien>Produkte" */
  rxnSmiles: string;
  caption: string;
}

/** Feste, nicht über SMILES beschreibbare Gleichung (anorganisch/technisch). */
export interface FixedEquation {
  reactants: string[];
  products: string[];
  /** bereits ausgeglichene Gleichung als Text */
  balanced: string;
}

export interface ReactionRule {
  id: string;
  name: string;
  aliases?: string[];
  category: ReactionCategory;
  /** Reaktionstyp, z. B. "Nucleophile Substitution" */
  reactionType: string;
  summary: string;
  /** Reaktions-SMARTS zur Berechnung der Produkte */
  smirks?: string;
  /**
   * Vorgabe-SMILES für alle Edukt-Templates der SMIRKS, in deren Reihenfolge.
   * Beispiel Veresterung: ['CC(=O)O', 'CCO'].
   */
  reactantDefaults?: string[];
  /**
   * Indizes der Templates, die der eingegebene Stoff einnehmen darf.
   * Die Veresterung greift mit [0, 1] sowohl bei Säuren als auch bei Alkoholen.
   */
  substrateSlots?: number[];
  /** Muster, die das Substrat enthalten muss (ODER-verknüpft je Eintrag) */
  substrateSmarts?: string[];
  /** Muster, die das Substrat nicht enthalten darf */
  excludeSmarts?: string[];
  /** IDs funktioneller Gruppen, auf die die Reaktion anspricht */
  functionalGroups: string[];
  /** allgemeine Gleichung in Textform, z. B. "R–OH + R'–COOH ⇌ R'–COOR + H2O" */
  generalEquation: string;
  example?: ExampleReaction;
  fixedEquation?: FixedEquation;
  reagents: Reagent[];
  conditions: Conditions;
  procedure: ProcedureStep[];
  mechanism: Mechanism;
  safety: SafetyInfo;
  electro?: ElectroSpec;
  typicalYield?: string;
  /** Einsatzbereich, z. B. ["Laborsynthese", "Industrie"] */
  scale: string[];
  keywords: string[];
  references: ReactionReference[];
  thermodynamics?: {
    deltaH?: number;
    deltaG?: number;
    note?: string;
  };
}

export interface FunctionalGroup {
  id: string;
  name: string;
  smarts: string;
  description: string;
  /** Zeichenkette zur Anzeige, z. B. "R–OH" */
  notation: string;
  /** Farbton für die Hervorhebung in der Struktur */
  hue: number;
}

export interface Substance {
  name: string;
  synonyms: string[];
  formula: string;
  smiles?: string;
  molarMass: number;
  cas?: string;
  pubchemCid?: number;
  category: string;
  /** Kurzbeschreibung für die Trefferliste */
  description?: string;
  ghs?: string[];
  meltingPoint?: string;
  boilingPoint?: string;
  density?: string;
  solubility?: string;
}

export interface StandardPotential {
  /** Reduktionsgleichung als Text */
  halfReaction: string;
  /** Standardpotential in V gegen Normalwasserstoffelektrode */
  potential: number;
  electrons: number;
  oxidized: string;
  reduced: string;
  category: 'Metall' | 'Nichtmetall' | 'Sauerstoff/Wasser' | 'Komplex' | 'Organisch' | 'Sonstige';
  note?: string;
}
