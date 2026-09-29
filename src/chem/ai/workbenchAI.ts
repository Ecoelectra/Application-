/**
 * Werkbank mit dem neuronalen Netz: Für jedes Stoffpaar im Gefäß sagt die
 * Reaktions-KI die wahrscheinlichsten Produkte voraus. Jede Vorhersage wird
 * wie eine Stufe der KI-Synthese im Reaktor bewertet – bei der eingestellten
 * Temperatur, dem Druck und dem Katalysator, der im Gefäß ist oder als
 * Katalyse eingestellt wurde. Daraus entsteht eine vollwertige Reaktion der
 * Werkbank: läuft sie nicht, steht dabei, was fehlt (Katalysator, Wärme …).
 *
 * Findet schon eine Regel oder ein Patentbeleg dasselbe Produkt, wird die
 * Reaktion nicht doppelt gezeigt; sie bekommt nur den Vermerk, dass die KI
 * zum selben Ergebnis kommt.
 */
import type { MainModule } from '@rdkit/rdkit';
import type { ReactionModel } from './model';
import { predictWithModel, type AiProposal } from './reactionAI';
import {
  evaluateProposal,
  formatBar,
  formatC,
  lowersBarrier,
  proposalHelpers,
  type StepEvaluation,
} from './synthesisConditions';
import { structureKey } from '../reactionKeys';
import type { Confidence } from '../prediction';
import type { WorkbenchReaction } from '../workbench';
import { CATALYSIS_LABELS, type Catalysis } from '../../data/workbenchSpecs';
import type { Substance } from '../../data/types';

export interface AiReactorConditions {
  temperatureC: number;
  pressureBar: number;
  catalysis: Catalysis | 'keine';
}

/** Vorschläge je Stoffpaar, die als Reaktion erscheinen */
const PER_GROUP = 3;
/** Mindestsicherheit des besten Vorschlags eines Paares */
const MIN_BEST = 0.04;
/** Mindestsicherheit für weitere Vorschläge desselben Paares */
const MIN_FURTHER = 0.25;
/** Hat das Paar schon eine vollständige Reaktion, zählen nur sichere Alternativen */
const MIN_ALTERNATIVE = 0.4;

/** Hilfsstoffe, ohne die ein einzelner Stoff nicht umgesetzt wird */
const PARTNER_ROLES = new Set(['Oxidationsmittel', 'Reduktionsmittel', 'Halogenierungsmittel', 'Reagenz', 'Aktivierungsreagenz']);

function isOrganic(substance: Substance): boolean {
  return Boolean(substance.smiles) && /C(?![a-z])/.test(substance.formula);
}

export function confidenceOf(value: number): Confidence {
  return value >= 0.5 ? 'hoch' : value >= 0.2 ? 'mittel' : 'gering';
}

function percent(value: number): string {
  return `${Math.max(1, Math.round(value * 100))} %`;
}

function trainingText(model: ReactionModel): string {
  const counts = Object.values(model.sources ?? {});
  const total = counts.reduce((sum, count) => sum + count, 0);
  return total
    ? `trainiert mit ${total.toLocaleString('de-DE')} Reaktionen aus ${counts.length} Datenquellen`
    : 'trainiert mit Reaktionen aus der Patentliteratur';
}

/** Katalysator, mit dem die Werkbank rechnet: was im Gefäß ist oder eingestellt wurde */
function presentCatalyst(proposal: AiProposal): string | null {
  const present = proposalHelpers(proposal).filter((entry) => entry.present && entry.category !== 'wasserstoff');
  return (present.find((entry) => lowersBarrier(proposal, entry.category)) ?? present[0])?.category ?? null;
}

function helperLabel(proposal: AiProposal, category: string | null): string | null {
  if (!category) return null;
  return proposal.catalysts.find((entry) => entry.category === category)?.label ?? null;
}

/** Was fehlt, damit die Reaktion bei den eingestellten Bedingungen abläuft */
function missingFor(proposal: AiProposal, evaluation: StepEvaluation): string[] {
  const missing: string[] = [];
  const helpers = proposalHelpers(proposal);
  let partnerCategory: string | null = null;
  if (proposal.reactants.length === 1 && !proposal.reagent) {
    const partner = helpers.find((entry) => !entry.present && PARTNER_ROLES.has(entry.role) && entry.score >= 0.3);
    partnerCategory = partner?.category ?? null;
    missing.push(
      partner
        ? `Reaktionspartner: ${partner.label}${partner.examples.length ? ` (z. B. ${partner.examples.slice(0, 2).join(', ')})` : ''}.`
        : 'Ein passendes Reagenz – die KI kennt diese Umsetzung nur zusammen mit weiteren Stoffen.',
    );
  }
  if (evaluation.verdict === 'blockiert' && evaluation.recommended.catalyst !== partnerCategory) {
    const best = helpers.find((entry) => entry.category === evaluation.recommended.catalyst);
    const label = best?.label ?? 'passender Katalysator';
    const examples = best?.examples.length ? ` (z. B. ${best.examples.slice(0, 2).join(', ')})` : '';
    const setting = best?.catalysis ? ` Stoff zugeben oder «${CATALYSIS_LABELS[best.catalysis]}» einstellen.` : ' Stoff ins Gefäß geben.';
    missing.push(`Katalysator: ${label}${examples} – ohne ihn gibt es keinen Reaktionsweg.${setting}`);
  } else if (evaluation.verdict === 'langsam') {
    missing.push(evaluation.summary);
  } else if (evaluation.verdict === 'problem') {
    missing.push(...evaluation.problems);
  }
  return missing;
}

function observationFor(proposal: AiProposal, evaluation: StepEvaluation): string {
  const product = proposal.products[0]?.name ?? 'das Produkt';
  // Die Einzelheiten stehen in der Bewertung im Reaktor
  switch (evaluation.verdict) {
    case 'läuft':
      return `Die KI erwartet ${product}.`;
    case 'langsam':
      return `Unter diesen Bedingungen entsteht kaum ${product} – die Reaktion ist zu langsam.`;
    case 'blockiert':
      return `Ohne passenden Katalysator entsteht kein ${product}.`;
    default:
      return `Vorsicht: ${evaluation.summary}`;
  }
}

/** Ein Vorschlag der KI als Reaktion der Werkbank, bewertet im Reaktor */
export function aiWorkbenchReaction(
  rdkit: MainModule | null,
  model: ReactionModel,
  proposal: AiProposal,
  conditions: AiReactorConditions,
): WorkbenchReaction {
  const catalyst = presentCatalyst(proposal);
  const vessel = [...proposal.reactants, ...(proposal.reagent ? [proposal.reagent] : [])];
  const evaluation = evaluateProposal(rdkit, proposal, () => vessel, {
    temperatureC: conditions.temperatureC,
    pressureBar: conditions.pressureBar,
    catalyst,
  });
  const { recommended } = evaluation;
  const recommendedLabel = helperLabel(proposal, recommended.catalyst);
  const catalystLabel = helperLabel(proposal, catalyst);
  const setting = proposal.catalysts.find((entry) => entry.category === catalyst)?.catalysis;
  const templateText = proposal.templateCount ? `; Reaktionsvorlage aus ${proposal.templateCount.toLocaleString('de-DE')} Reaktionen` : '';
  const note = `Vorhersage der Reaktions-KI: Ein neuronales Netz, ${trainingText(model)}, hält diese Umsetzung für wahrscheinlich (Sicherheit ${percent(proposal.confidence)}${templateText}). Geschwindigkeit, Katalysator und Druck sind aus der Aktivierungsenergie der Reaktionsfamilie abgeschätzt. Für genau diese Stoffe ist das nicht experimentell belegt.`;

  return {
    id: `ki-${[...proposal.reactants.map((entry) => entry.id), proposal.reagent?.id ?? ''].join('+')}-${proposal.products[0]?.smiles ?? proposal.id}`,
    kind: 'organisch',
    title: `${proposal.title}: ${proposal.reactants.map((entry) => entry.name).join(' + ')}`,
    reactionType: `KI-Vorhersage · ${proposal.family?.name ?? proposal.title}`,
    equation: proposal.equation,
    products: proposal.products.map((product) => ({
      smiles: product.smiles,
      formula: product.formula,
      name: product.name,
      substanceId: product.substanceId,
    })),
    observation: observationFor(proposal, evaluation),
    explanation: proposal.explanation,
    conditions: `Empfehlung der KI: ${formatC(recommended.temperatureC)}, ${formatBar(recommended.pressureBar)}${recommendedLabel ? `, ${recommendedLabel}` : ''}. Eingestellt: ${formatC(conditions.temperatureC)}, ${formatBar(conditions.pressureBar)}, ${catalystLabel ?? 'ohne Katalysator'}.`,
    safetyLevel: 'Fortgeschritten',
    hazards: [
      'Vorhersage der KI – vor einem Versuch eine Literaturvorschrift suchen und die Sicherheitsdatenblätter aller Stoffe lesen.',
      ...evaluation.problems,
    ],
    tags: ['KI'],
    missing: missingFor(proposal, evaluation),
    catalysisMatched: Boolean(setting && setting === conditions.catalysis && evaluation.catalyzed),
    evidence: 'ki',
    evidenceNote: note,
    confidence: confidenceOf(proposal.confidence),
    participants: vessel.map((entry) => entry.id),
    enthalpy: proposal.enthalpy ?? undefined,
    ai: proposal,
    reactor: evaluation,
  };
}

function productKeys(rdkit: MainModule, reaction: WorkbenchReaction): string[] {
  return reaction.products
    .map((product) => (product.smiles ? structureKey(rdkit, product.smiles) : null))
    .filter((key): key is string => Boolean(key));
}

/**
 * Reaktionen der KI für alle Stoffpaare im Gefäß (bzw. den einzelnen Stoff).
 * `known` sind die schon gefundenen Reaktionen: Sagt die KI dasselbe Produkt
 * voraus, wird das dort vermerkt statt eine zweite Reaktion anzulegen.
 */
export function aiReactions(
  rdkit: MainModule,
  model: ReactionModel,
  substances: Substance[],
  vessel: Substance[],
  conditions: AiReactorConditions,
  known: WorkbenchReaction[],
): WorkbenchReaction[] {
  const groups: Substance[][] = [];
  if (substances.length === 1) {
    if (isOrganic(substances[0])) groups.push(substances);
  } else {
    for (let i = 0; i < substances.length; i++) {
      for (let j = i + 1; j < substances.length; j++) {
        if (isOrganic(substances[i]) || isOrganic(substances[j])) groups.push([substances[i], substances[j]]);
      }
    }
  }
  if (!groups.length) return [];

  const knownKeys = known.map((reaction) => ({ reaction, keys: productKeys(rdkit, reaction) }));
  const results: WorkbenchReaction[] = [];
  const seen = new Set<string>();
  for (const group of groups) {
    const others = vessel.filter((entry) => !group.includes(entry));
    const proposals = predictWithModel(rdkit, model, group, {
      temperatureC: conditions.temperatureC,
      catalysis: conditions.catalysis,
      others,
      limit: PER_GROUP,
    });
    const involves = (reaction: WorkbenchReaction) => group.every((entry) => reaction.participants?.includes(entry.id));
    const settled = known.some((reaction) => !reaction.missing.length && involves(reaction));
    proposals.forEach((proposal, rank) => {
      const product = proposal.products[0]?.smiles;
      const key = product ? structureKey(rdkit, product) : null;
      if (!key) return;
      const identity = `${proposal.reactants.map((entry) => entry.id).sort().join('+')}>${key}`;
      if (seen.has(identity)) return;
      // Dasselbe Produkt kennt schon eine Regel oder ein Beleg: dort vermerken.
      // Eigene Reaktion nur, wenn der Weg der KI jetzt läuft, der bekannte aber
      // nicht – etwa Hydrierung mit Pd statt kathodischer Reduktion.
      const same = knownKeys.filter(
        (entry) => entry.keys.includes(key) && proposal.reactants.some((reactant) => entry.reaction.participants?.includes(reactant.id)),
      );
      for (const entry of same) if (!entry.reaction.ai) entry.reaction.ai = proposal;
      if (same.some((entry) => !entry.reaction.missing.length)) return;
      const threshold = settled ? MIN_ALTERNATIVE : rank === 0 ? MIN_BEST : MIN_FURTHER;
      if (proposal.confidence < threshold) return;
      const reaction = aiWorkbenchReaction(rdkit, model, proposal, conditions);
      if (same.length && reaction.missing.length) return;
      seen.add(identity);
      results.push(reaction);
    });
  }
  return results;
}
