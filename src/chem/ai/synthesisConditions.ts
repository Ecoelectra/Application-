/**
 * Läuft eine Synthesestufe unter den eingestellten Bedingungen?
 *
 * Die KI-Synthese liefert je Stufe Ausgangsstoffe, Produkt, Reaktionsfamilie
 * (mit Richtwerten der Aktivierungsenergie) und passende Hilfsstoffe. Hier
 * wird daraus für Temperatur, Druck und den gewählten Katalysator abgeschätzt:
 *
 *  - Geschwindigkeit nach Arrhenius (Halbwertszeit bei 1 mol/L). Ein
 *    passender Katalysator senkt die Barriere auf den Wert der Familie.
 *  - Gase unter den Edukten oder Reagenzien (H2, CO2, NH3 …): Ihre
 *    Konzentration in der Lösung wächst mit dem Druck (Henry), die Reaktion
 *    wird entsprechend schneller.
 *  - Flüssige Edukte, die bei dieser Temperatur und diesem Druck sieden,
 *    verdampfen aus dem offenen Gefäß – Rückflusskühler oder Überdruck nötig.
 *  - Zersetzung und Pyrolyse bei zu hoher Temperatur.
 *  - Gleichgewicht nach Le Chatelier aus Reaktionsenthalpie und Gasbilanz.
 */
import type { MainModule } from '@rdkit/rdkit';
import { formatDuration, kinetics, requiredTemperature, type Kinetics } from './activation';
import type { AiProposal, CatalystSuggestion } from './reactionAI';
import type { RetroStep } from './retrosynthesis';
import { NORMAL_PRESSURE, physicalProperties, stateAt, vaporPressureAt } from '../phase';
import { substanceById } from '../../data/substances';
import type { Substance } from '../../data/types';

export interface StepConditions {
  temperatureC: number;
  pressureBar: number;
  /** gewählter Katalysator bzw. Hilfsstoff (Kategorie), null = ohne */
  catalyst: string | null;
}

export type StepVerdict = 'läuft' | 'langsam' | 'blockiert' | 'problem';

export interface StepEvaluation {
  verdict: StepVerdict;
  /** Kurzurteil für die Anzeige */
  summary: string;
  kinetics: Kinetics;
  /** effektive Halbwertszeit mit Druckeinfluss */
  halfLife: number;
  /** Barriere wurde durch den gewählten Katalysator gesenkt */
  catalyzed: boolean;
  /** Faktor, um den der Druck die Reaktion beschleunigt (Gase) */
  pressureFactor: number;
  notes: string[];
  problems: string[];
  /** empfohlene Bedingungen mit dem besten Katalysator */
  recommended: StepConditions;
}

/** Hilfsstoffe, die eine Stufe wirklich antreiben (keine Lösungsmittel oder Liganden) */
const DRIVING_ROLES = new Set(['Katalysator', 'Säure', 'Base', 'Aktivierungsreagenz', 'Reduktionsmittel', 'Oxidationsmittel', 'Halogenierungsmittel', 'Reagenz']);

/** Katalysatoren, mit denen Wasserstoff als gasförmiges Reagenz hydriert */
const HYDROGENATION_CATALYSTS = new Set(['pd', 'pt', 'ni', 'edelmetall']);

/** Wählbare Hilfsstoffe eines KI-Vorschlags in der Reihenfolge der KI */
export function proposalHelpers(proposal: AiProposal): CatalystSuggestion[] {
  return proposal.catalysts.filter((entry) => DRIVING_ROLES.has(entry.role));
}

/** Wählbare Hilfsstoffe einer Stufe in der Reihenfolge der KI */
export function stepHelpers(step: RetroStep): CatalystSuggestion[] {
  return proposalHelpers(step.proposal);
}

/** Empfohlener Hilfsstoff: der klassische Katalysator der Familie, sonst der erste der KI */
export function recommendedFor(proposal: AiProposal): string | null {
  const helpers = proposalHelpers(proposal);
  const family = proposal.family;
  const classic = family ? helpers.find((entry) => family.catalysts.includes(entry.category) && entry.category !== 'wasserstoff') : undefined;
  return (classic ?? helpers.find((entry) => entry.category !== 'wasserstoff') ?? helpers[0])?.category ?? null;
}

/** Empfohlener Hilfsstoff einer Stufe */
export function recommendedCatalyst(step: RetroStep): string | null {
  return recommendedFor(step.proposal);
}

/** Metalle, die Kupplungen katalysieren – eine Base allein reicht dort nicht */
const COUPLING_METALS = new Set(['pd', 'ni', 'pt', 'edelmetall', 'cu']);

/** Senkt dieser Hilfsstoff die Barriere der Familie? */
export function lowersBarrier(proposal: AiProposal, category: string | null): boolean {
  if (!category || category === 'wasserstoff') return false;
  const family = proposal.family;
  if (!family || family.eaCatalyzed >= family.eaUncatalyzed) return false;
  // Palladiumkupplungen (Suzuki, Heck, Buchwald …): ohne Metall kein Weg, die Base hilft nur mit
  if (family.requiresCatalyst && family.catalysts[0] === 'pd') return COUPLING_METALS.has(category);
  if (family.catalysts.includes(category)) return true;
  const suggestion = proposal.catalysts.find((entry) => entry.category === category);
  return Boolean(suggestion && suggestion.score >= 0.4 && DRIVING_ROLES.has(suggestion.role));
}

export function formatBar(value: number): string {
  return `${value.toLocaleString('de-DE', { maximumFractionDigits: value < 10 ? 1 : 0 })} bar`;
}

export function formatC(value: number): string {
  return `${Math.round(value).toLocaleString('de-DE')} °C`;
}

/** Stoffe, die bei der Stufe im Gefäß sind: Edukte und das gasförmige Reagenz */
function participants(step: RetroStep, catalyst: string | null): Substance[] {
  const list = step.precursors.map((entry) => entry.substance);
  // Hydrierungen: Wasserstoff ist Reagenz, sobald ein Hydrierkatalysator gewählt ist
  const hydrogen = substanceById('wasserstoff');
  const needsHydrogen = stepHelpers(step).some((entry) => entry.category === 'wasserstoff') && catalyst !== null && HYDROGENATION_CATALYSTS.has(catalyst);
  if (needsHydrogen && hydrogen) list.push(hydrogen);
  return list;
}

/** Bewertung einer Stufe unter den gewählten Bedingungen. */
export function evaluateStep(rdkit: MainModule | null, step: RetroStep, conditions: StepConditions): StepEvaluation {
  return evaluateProposal(rdkit, step.proposal, (catalyst) => participants(step, catalyst), conditions);
}

/**
 * Bewertung eines KI-Vorschlags unter den gewählten Bedingungen.
 * `substancesFor` liefert die Stoffe im Gefäß – abhängig vom Katalysator,
 * weil etwa Wasserstoff erst mit einem Hydrierkatalysator mitreagiert.
 */
export function evaluateProposal(
  rdkit: MainModule | null,
  proposal: AiProposal,
  substancesFor: (catalyst: string | null) => Substance[],
  conditions: StepConditions,
): StepEvaluation {
  const { temperatureC: T, pressureBar: P, catalyst } = conditions;
  const family = proposal.family;
  const energy = proposal.energy;
  const bimolecular = family?.bimolecular ?? energy?.bimolecular ?? true;
  const eaUncatalyzed = family?.eaUncatalyzed ?? energy?.eaUncatalyzed ?? 110;
  const eaCatalyzed = family?.eaCatalyzed ?? energy?.eaCatalyzed ?? eaUncatalyzed;
  const requiresCatalyst = family?.requiresCatalyst ?? energy?.requiresCatalyst ?? false;
  const catalyzed = lowersBarrier(proposal, catalyst);
  const ea = catalyzed ? eaCatalyzed : eaUncatalyzed;
  const rate = kinetics(ea, T, bimolecular, energy?.preExponential);

  const notes: string[] = [];
  const problems: string[] = [];

  // Aggregatzustände der Beteiligten bei T und P
  let pressureFactor = 1;
  let minimumPressure = 0;
  const substances = substancesFor(catalyst);
  for (const substance of substances) {
    const properties = physicalProperties(rdkit, substance);
    const state = stateAt(properties, T, P);
    const atRoom = stateAt(properties, 20, NORMAL_PRESSURE);
    if (state.state === 'zersetzt') {
      problems.push(`${substance.name} ${state.text}.`);
    } else if (atRoom.state === 'gasförmig' || (state.state === 'gasförmig' && properties.bp !== undefined && properties.bp < 0)) {
      // Gas als Reaktionspartner: mehr Druck, mehr gelöstes Gas
      pressureFactor = Math.max(pressureFactor, Math.min(300, P / NORMAL_PRESSURE));
      notes.push(
        P > 1.5
          ? `${substance.name} ist ein Gas: Bei ${formatBar(P)} löst sich etwa ${Math.round(P / NORMAL_PRESSURE)}-mal so viel davon – die Reaktion läuft entsprechend schneller.`
          : `${substance.name} ist ein Gas: Mit Überdruck (etwa 3–10 bar im Autoklaven) löst sich mehr davon, und die Reaktion läuft schneller.`,
      );
    } else if (state.state === 'gasförmig' && properties.bp !== undefined) {
      const needed = vaporPressureAt(properties.bp, T, properties.hydrogenBonded);
      minimumPressure = Math.max(minimumPressure, needed);
      notes.push(
        `${substance.name} siedet bei ${formatBar(P)} schon bei ${formatC(state.boilingPoint ?? properties.bp)} und verdampft aus dem offenen Gefäß: Rückflusskühler verwenden oder im geschlossenen Gefäß mindestens ${formatBar(Math.ceil(needed * 10) / 10)} einstellen.`,
      );
    }
  }
  // Pyrolyse betrifft Stoffe mit C–H-Gerüst – nicht CO₂, CO oder das sehr stabile Methan
  const organic = substances.some(
    (substance) => substance.smiles && /C(?![a-z])/.test(substance.formula) && /H/.test(substance.formula) && substance.formula !== 'CH4',
  );
  if (organic && T > 350) problems.push('Oberhalb von etwa 350 °C zersetzen sich die meisten organischen Stoffe (Pyrolyse).');
  if (T < -40) notes.push('Bei so tiefer Temperatur erstarren viele Lösungsmittel; die Stoffe mischen sich schlecht.');

  // Gleichgewicht nach Le Chatelier
  const enthalpy = proposal.enthalpy;
  if (enthalpy) {
    const gas = enthalpy.terms.reduce((sum, term) => sum + (term.phase === 'g' ? (term.side === 'produkt' ? 1 : -1) * term.coefficient : 0), 0);
    if (enthalpy.deltaH < -20 && T > 150) {
      notes.push(`Exotherm (ΔrH° ≈ ${Math.round(enthalpy.deltaH)} kJ/mol): Bei hoher Temperatur liegt ein Gleichgewicht weniger auf der Produktseite – so heiß wie nötig, so kühl wie möglich.`);
    } else if (enthalpy.deltaH > 20) {
      notes.push(`Endotherm (ΔrH° ≈ +${Math.round(enthalpy.deltaH)} kJ/mol): Wärme muss zugeführt werden; höhere Temperatur begünstigt auch das Gleichgewicht.`);
    }
    if (gas < 0 && P < 2) notes.push('Aus Gasen entstehen weniger Gasteilchen: Höherer Druck verschiebt ein Gleichgewicht zu den Produkten.');
    if (gas > 0 && P > 5) notes.push('Bei der Reaktion entsteht Gas; der hohe Druck bremst das. Im offenen Gefäß entweicht es und treibt die Reaktion voran.');
  }

  const halfLife = rate.halfLife / pressureFactor;
  const speed = halfLife < 60 ? 'schnell' : halfLife <= 3600 ? 'praktikabel' : halfLife <= 86_400 * 7 ? 'langsam' : 'blockiert';

  // Empfehlung mit dem besten Hilfsstoff
  const best = recommendedFor(proposal);
  const bestEa = lowersBarrier(proposal, best) ? eaCatalyzed : eaUncatalyzed;
  const recommendedT = Math.min(300, Math.max(20, Math.ceil(requiredTemperature(bestEa, bimolecular, energy?.preExponential) / 10) * 10));
  let recommendedP = NORMAL_PRESSURE;
  for (const substance of substancesFor(best)) {
    const properties = physicalProperties(rdkit, substance);
    const atRoom = stateAt(properties, 20, NORMAL_PRESSURE);
    if (atRoom.state === 'gasförmig') recommendedP = Math.max(recommendedP, 5);
    else if (properties.bp !== undefined && recommendedT >= properties.bp) {
      recommendedP = Math.max(recommendedP, Math.ceil(vaporPressureAt(properties.bp, recommendedT, properties.hydrogenBonded) * 12) / 10);
    }
  }
  const recommended: StepConditions = { temperatureC: recommendedT, pressureBar: Number(recommendedP.toPrecision(3)), catalyst: best };

  // Urteil
  let verdict: StepVerdict;
  let summary: string;
  if (requiresCatalyst && !catalyzed) {
    verdict = 'blockiert';
    summary = 'Ohne passenden Katalysator gibt es keinen Reaktionsweg.';
  } else if (problems.length) {
    verdict = 'problem';
    summary = problems[0];
  } else if (speed === 'schnell' || speed === 'praktikabel') {
    verdict = 'läuft';
    summary = `Läuft bei ${formatC(T)} und ${formatBar(P)} – Halbwertszeit etwa ${formatDuration(halfLife)}.`;
  } else {
    verdict = 'langsam';
    const needed = requiredTemperature(ea, bimolecular, energy?.preExponential);
    summary = `Zu langsam (Halbwertszeit ${formatDuration(halfLife)}); zügig ${catalyzed ? '' : 'mit Katalysator oder '}ab etwa ${formatC(Math.max(needed, -50))}.`;
  }
  if (minimumPressure > P && verdict === 'läuft') {
    notes.unshift('Nur mit Rückflusskühler oder im geschlossenen Gefäß – sonst verdampft ein Edukt.');
  }

  return { verdict, summary, kinetics: rate, halfLife, catalyzed, pressureFactor, notes, problems, recommended };
}

/** Schlechtestes Urteil aller Stufen eines Weges */
export function worstVerdict(verdicts: StepVerdict[]): StepVerdict {
  const order: StepVerdict[] = ['läuft', 'langsam', 'problem', 'blockiert'];
  return verdicts.reduce((worst, entry) => (order.indexOf(entry) > order.indexOf(worst) ? entry : worst), 'läuft' as StepVerdict);
}
