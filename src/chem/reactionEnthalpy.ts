/**
 * Reaktionsenthalpie für Werkbank-Ergebnisse: erst über die Gleichung
 * (Summenformeln, bei wässriger Lösung mit Ionen), sonst über die Strukturen
 * der beteiligten Stoffe und Produkte.
 */
import type { MainModule } from '@rdkit/rdkit';
import { splitSalt, solubility } from './ions';
import {
  asciiSpecies,
  dissolutionEnthalpy,
  enthalpyFromStructures,
  enthalpyOfEquation,
  type EnthalpyContext,
  type ReactionEnthalpy,
  type SpeciesInput,
} from './thermo';
import type { Substance } from '../data/types';

export interface EnthalpyInput {
  kind: 'anorganisch' | 'organisch' | 'physikalisch';
  equation: string;
  ionicEquation?: string;
  products: Array<{ smiles?: string; formula?: string; name?: string }>;
  participants?: string[];
}

export interface EnthalpyOutcome {
  enthalpy: ReactionEnthalpy | null;
  /** Stoffe ohne Bildungsenthalpie, wenn nicht gerechnet werden konnte */
  missing?: string[];
}

function isWater(substance: Substance): boolean {
  return substance.formula === 'H2O';
}

function hintsFor(substances: Substance[], products: EnthalpyInput['products']): NonNullable<EnthalpyContext['hints']> {
  return [
    ...substances.map((substance) => ({ formula: asciiSpecies(substance.formula), smiles: substance.smiles, name: substance.name })),
    ...products.filter((product) => product.formula).map((product) => ({ formula: asciiSpecies(product.formula as string), smiles: product.smiles, name: product.name })),
  ];
}

/** Lösungsenthalpie, wenn ein lösliches Salz in Wasser gegeben wird. */
function dissolution(reaction: EnthalpyInput, vessel: Substance[]): ReactionEnthalpy | null {
  if (reaction.kind !== 'physikalisch' || !reaction.participants) return null;
  const pair = reaction.participants.map((id) => vessel.find((substance) => substance.id === id)).filter((entry): entry is Substance => Boolean(entry));
  const water = pair.find(isWater);
  const other = pair.find((substance) => substance !== water);
  if (!water || !other) return null;
  const salt = splitSalt(other.formula);
  if (!salt || salt.cation.formula === 'H' || solubility(salt.cation, salt.anion).solubility !== 'löslich') return null;
  const enthalpy = dissolutionEnthalpy(other.formula);
  if (!enthalpy) return null;
  enthalpy.terms[0].label = other.name;
  enthalpy.terms[1].label = `${other.name} gelöst`;
  return enthalpy;
}

/** Reaktionsenthalpie für eine Reaktion der Werkbank oder eine Vorhersage. */
export function reactionEnthalpy(rdkit: MainModule | null, reaction: EnthalpyInput, vessel: Substance[], aqueous: boolean): EnthalpyOutcome {
  if (reaction.kind === 'physikalisch') {
    const enthalpy = dissolution(reaction, vessel);
    return { enthalpy };
  }
  const context: EnthalpyContext = { aqueous, hints: hintsFor(vessel, reaction.products) };
  let missing: string[] | undefined;

  for (const equation of [reaction.equation, reaction.ionicEquation]) {
    if (!equation) continue;
    const result = enthalpyOfEquation(rdkit, equation, context);
    if (result?.ok) return { enthalpy: result.enthalpy };
    if (result && !missing) missing = result.missing;
  }

  // Über Strukturen: beteiligte Stoffe im Gefäß und berechnete Produkte
  if (rdkit && reaction.participants?.length && reaction.products.length) {
    const reactants: SpeciesInput[] = [...new Set(reaction.participants)]
      .map((id) => vessel.find((substance) => substance.id === id))
      .filter((entry): entry is Substance => Boolean(entry))
      .map((substance) => ({ formula: asciiSpecies(substance.formula), smiles: substance.smiles, label: substance.name }));
    const products: SpeciesInput[] = reaction.products
      .filter((product) => product.smiles || product.formula)
      .map((product) => ({ formula: product.formula ? asciiSpecies(product.formula) : '', smiles: product.smiles, label: product.name ?? product.formula }));
    if (reactants.length && products.length) {
      const result = enthalpyFromStructures(rdkit, reactants, products, context);
      if (result?.ok) return { enthalpy: result.enthalpy };
      if (result && !missing) missing = result.missing;
    }
  }
  return { enthalpy: null, missing };
}
