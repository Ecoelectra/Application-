/**
 * Reaktions-KI: Was entsteht aus diesen Stoffen, und welcher Katalysator
 * macht es möglich?
 *
 * 1. Das neuronale Netz bekommt den Fingerabdruck der Edukte und schätzt für
 *    jede der gelernten Reaktionsvorlagen, wie wahrscheinlich sie hier greift.
 * 2. Die wahrscheinlichsten Vorlagen werden mit RDKit auf die echten Stoffe
 *    angewendet. Nur was dabei ein gültiges Produkt ergibt, bleibt übrig.
 * 3. Welche Hilfsstoffe nötig sind, kommt aus zwei Quellen: der zweiten
 *    Ausgabe des Netzes (bezogen auf genau diese Edukte) und der Statistik
 *    der Patente, aus denen die Vorlage stammt.
 * 4. Die Reaktionsfamilie liefert Richtwerte für die Aktivierungsenergie mit
 *    und ohne Katalysator; daraus folgt mit der Arrhenius-Gleichung, ob die
 *    Reaktion bei der eingestellten Temperatur abläuft.
 *
 * Für anorganische und technische Katalyseprozesse, die in den Patenten der
 * organischen Chemie nicht vorkommen, gibt es zusätzlich die Wissensbasis in
 * src/data/catalysis.ts.
 */
import type { MainModule } from '@rdkit/rdkit';
import { maximumBarrier, kinetics, requiredTemperature, type Kinetics } from './activation';
import { AGENT_CATEGORY_BY_ID, classifyAgent, type AgentRole } from './agents';
import { reactantBits } from './features';
import { FAMILY_BY_ID, type ReactionFamily } from './families';
import type { ReactionModel, TemplateInfo } from './model';
import { forward } from './network';
import { canonicalSmiles, molecularFormula } from '../rdkit';
import { structureKey } from '../reactionKeys';
import { isPublishableProduct } from '../safety';
import { enthalpyFromStructures, enthalpyOfEquation, type ReactionEnthalpy } from '../thermo';
import { structureOf } from '../substanceStructures';
import { CATALYZED_PROCESSES, processesFor, type CatalyzedProcess } from '../../data/catalysis';
import { SUBSTANCES, substanceById } from '../../data/substances';
import type { Substance } from '../../data/types';
import type { Catalysis } from '../../data/workbenchSpecs';

export interface CatalystSuggestion {
  category: string;
  label: string;
  role: AgentRole;
  /** Einschätzung 0–1, wie sehr dieser Hilfsstoff dazugehört */
  score: number;
  /** Anteil der Patente dieser Vorlage mit einem Hilfsstoff dieser Art */
  share: number;
  purpose: string;
  /** konkrete Stoffe aus den Patenten */
  examples: string[];
  /** Stoffe der Offline-Datenbank, die man ins Gefäß geben kann */
  substanceIds: string[];
  /** Workbench-Einstellung «Katalyse», die dazu passt */
  catalysis?: Catalysis;
  /** schon im Gefäß oder eingestellt */
  present: boolean;
}

export interface EnergyProfile {
  eaUncatalyzed: number;
  eaCatalyzed: number | null;
  catalystName: string | null;
  /** Rolle des Stoffes im Gefäß, der die Barriere senkt (Katalysator oder Reagenz) */
  presentRole?: AgentRole | null;
  uncatalyzed: Kinetics;
  catalyzed: Kinetics | null;
  /** Temperatur, ab der die Reaktion ohne Katalysator binnen einer Stunde abläuft */
  temperatureUncatalyzed: number | null;
  temperatureCatalyzed: number | null;
  /** Ohne Katalysator gibt es praktisch keinen Weg */
  requiresCatalyst: boolean;
  /** Bei der eingestellten Temperatur zu langsam – mit Katalysator machbar */
  catalystNeeded: boolean;
  /** Ein passender Katalysator ist im Gefäß oder eingestellt */
  catalystPresent: boolean;
  reliability: string;
  bimolecular: boolean;
  /** eigener Stoßfaktor, falls abweichend vom Standardwert */
  preExponential?: number;
}

export interface AiProduct {
  smiles?: string;
  formula?: string;
  name: string;
  substanceId?: string;
}

export interface AiProposal {
  id: string;
  source: 'ki' | 'wissensbasis';
  title: string;
  familyId: string;
  family: ReactionFamily | null;
  /** Stoffe, deren Atome ins Produkt gehen */
  reactants: Substance[];
  /** Stoff im Gefäß, der als Reagenz oder Katalysator wirkt */
  reagent?: Substance;
  products: AiProduct[];
  equation: string;
  /** Sicherheit der KI, 0–1 */
  confidence: number;
  /** Patente, aus denen die Vorlage stammt */
  templateCount?: number;
  example?: string;
  exampleSource?: string;
  catalysts: CatalystSuggestion[];
  energy: EnergyProfile | null;
  /** Reaktionsenthalpie ΔrH° (Satz von Hess), falls berechenbar */
  enthalpy?: ReactionEnthalpy | null;
  explanation: string;
  hazards: string[];
  conditions?: string;
}

export interface PredictionOptions {
  temperatureC: number;
  catalysis?: Catalysis | 'keine';
  /** weitere Stoffe im Gefäß (Katalysatoren, Lösungsmittel) */
  others?: Substance[];
  limit?: number;
  /** für die Reaktionsenthalpie organischer Stoffe der Wissensbasis */
  rdkit?: MainModule | null;
}

export const CATALYSIS_CATEGORIES: Record<Catalysis, string[]> = {
  sauer: ['saeure', 'schwache-saeure'],
  basisch: ['aminbase', 'anorganische-base', 'starke-base', 'dmap'],
  metall: ['pd', 'pt', 'ni', 'edelmetall', 'cu'],
  lewis: ['lewis'],
};

function catalysisFor(category: string): Catalysis | undefined {
  return (Object.entries(CATALYSIS_CATEGORIES) as Array<[Catalysis, string[]]>).find(([, list]) => list.includes(category))?.[0];
}

/** Strukturschlüssel eines Stoffes (auch für Salze), oder null. */
function keyOf(rdkit: MainModule, substance: Substance): string | null {
  const smiles = substance.smiles ?? structureOf(substance);
  return smiles ? structureKey(rdkit, smiles) : null;
}

const categoryCache = new Map<string, string | null>();
/** Hilfsstoff-Kategorie eines Stoffes im Gefäß. */
export function substanceCategory(rdkit: MainModule, substance: Substance): string | null {
  if (categoryCache.has(substance.id)) return categoryCache.get(substance.id) as string | null;
  const key = keyOf(rdkit, substance);
  let category = key ? (classifyAgent(rdkit, key)?.category ?? null) : null;
  // Metalle und Katalysatoren ohne Struktur
  if (!category) {
    if (/^Pd/.test(substance.formula) || /palladium/i.test(substance.id)) category = 'pd';
    else if (substance.formula === 'Pt') category = 'pt';
    else if (substance.formula === 'Ni') category = 'ni';
    else if (['Rh', 'Ru', 'Ir'].includes(substance.formula) || substance.id === 'grubbs-katalysator') category = 'edelmetall';
    else if (substance.formula === 'H2') category = 'wasserstoff';
  }
  categoryCache.set(substance.id, category);
  return category;
}

let knownByKey: Map<string, Substance> | null = null;
/** Stoff der Datenbank mit dieser Struktur (Strukturschlüssel), falls vorhanden. */
export function knownProduct(rdkit: MainModule, key: string): Substance | undefined {
  if (!knownByKey) {
    knownByKey = new Map();
    for (const substance of SUBSTANCES) {
      if (!substance.smiles) continue;
      const k = structureKey(rdkit, substance.smiles);
      if (k && !knownByKey.has(k)) knownByKey.set(k, substance);
    }
  }
  return knownByKey.get(key);
}

export function describeProduct(rdkit: MainModule, smiles: string): AiProduct {
  const key = structureKey(rdkit, smiles) ?? smiles;
  const known = knownProduct(rdkit, key);
  const formula = molecularFormula(rdkit, smiles) ?? undefined;
  return { smiles: key, formula, name: known?.name ?? formula ?? key, substanceId: known?.id };
}

/** Name eines Hilfsstoffs aus den Patenten; ohne Namen die Summenformel. */
function agentName(rdkit: MainModule, entry: [string, number, string, string]): string {
  if (entry[2]) return entry[2];
  if (/Pd/.test(entry[0])) return 'Palladiumkomplex';
  return molecularFormula(rdkit, entry[0])?.replace(/\^.*$/, '') ?? entry[0];
}

/** Familien, in denen Wasserstoff nur zusammen mit einem Metallkatalysator wirkt */
const HYDROGENATION_FAMILIES = ['hydrierung', 'nitro-reduktion', 'reduktion', 'schutzgruppe-n', 'etherspaltung'];

function buildCatalysts(
  rdkit: MainModule,
  template: TemplateInfo,
  family: ReactionFamily,
  nnCategories: Float32Array,
  model: ReactionModel,
  present: Set<string>,
): CatalystSuggestion[] {
  const scores = new Map<string, { score: number; share: number }>();
  model.categories.forEach((id, index) => {
    const share = template.c[id] ?? 0;
    scores.set(id, { score: 0.6 * share + 0.4 * nnCategories[index], share });
  });
  // Lehrbuchwissen der Familie: der klassische Katalysator steht vorn
  family.catalysts.forEach((id, rank) => {
    const entry = scores.get(id) ?? { score: 0, share: 0 };
    entry.score = Math.max(entry.score, rank === 0 ? 0.3 : 0.2) + (rank === 0 ? 0.25 : 0);
    scores.set(id, entry);
  });
  // Wasserstoff im Gefäß: Ohne Metallkatalysator passiert nichts
  if (present.has('wasserstoff') && HYDROGENATION_FAMILIES.includes(family.id)) {
    const pd = scores.get('pd') ?? { score: 0, share: 0 };
    pd.score = Math.max(pd.score, 0.7);
    scores.set('pd', pd);
  }
  const suggestions: CatalystSuggestion[] = [];
  for (const [id, { score, share }] of scores) {
    const category = AGENT_CATEGORY_BY_ID.get(id);
    if (!category || category.role === 'Lösungsmittel' || score < 0.15) continue;
    suggestions.push({
      category: id,
      label: category.label,
      role: category.role,
      score: Math.min(1, score),
      share,
      purpose: category.purpose,
      examples: [...new Set(template.t.filter((entry) => entry[3] === id).map((entry) => agentName(rdkit, entry)))].slice(0, 3),
      substanceIds: category.substanceIds.filter((substanceId) => substanceById(substanceId)),
      catalysis: catalysisFor(id),
      present: present.has(id),
    });
  }
  return suggestions.sort((a, b) => b.score - a.score).slice(0, 5);
}

const ACTIVATING_ROLES: AgentRole[] = ['Katalysator', 'Säure', 'Base', 'Aktivierungsreagenz', 'Reduktionsmittel', 'Oxidationsmittel', 'Halogenierungsmittel'];

function energyFor(family: ReactionFamily, catalysts: CatalystSuggestion[], temperatureC: number): EnergyProfile {
  const order = (entry: CatalystSuggestion) => {
    const index = family.catalysts.indexOf(entry.category);
    return index < 0 ? family.catalysts.length : index;
  };
  const relevant = catalysts
    .filter((entry) => family.catalysts.includes(entry.category) || (entry.score >= 0.4 && ACTIVATING_ROLES.includes(entry.role)))
    .sort((a, b) => order(a) - order(b) || b.score - a.score);
  // Wasserstoff allein ist kein Katalysator – er braucht Palladium, Platin oder Nickel
  const hydrogenOnly = (entry: CatalystSuggestion) => entry.category === 'wasserstoff';
  const presentEntries = relevant.filter((entry) => entry.present && !hydrogenOnly(entry));
  // Der klassische Katalysator der Familie zuerst; Wasserstoff zählt nur zusammen mit Metall
  const main = relevant.find((entry) => !entry.present && !hydrogenOnly(entry)) ?? relevant.find((entry) => !hydrogenOnly(entry)) ?? null;
  const catalystPresent = presentEntries.length > 0;
  const lowered = family.eaCatalyzed < family.eaUncatalyzed && (relevant.length > 0 || family.catalysts.length > 0);
  const uncatalyzed = kinetics(family.eaUncatalyzed, temperatureC, family.bimolecular);
  const catalyzed = lowered ? kinetics(family.eaCatalyzed, temperatureC, family.bimolecular) : null;
  const slow = (entry: Kinetics) => entry.speed === 'langsam' || entry.speed === 'blockiert';
  const name = catalystPresent ? presentEntries[0].label : main ? main.label : null;
  return {
    eaUncatalyzed: family.eaUncatalyzed,
    eaCatalyzed: lowered ? family.eaCatalyzed : null,
    catalystName: name,
    presentRole: catalystPresent ? presentEntries[0].role : null,
    uncatalyzed,
    catalyzed,
    temperatureUncatalyzed: family.requiresCatalyst ? null : requiredTemperature(family.eaUncatalyzed, family.bimolecular),
    temperatureCatalyzed: lowered ? requiredTemperature(family.eaCatalyzed, family.bimolecular) : null,
    requiresCatalyst: family.requiresCatalyst,
    catalystNeeded: Boolean(catalyzed) && (family.requiresCatalyst || slow(uncatalyzed)),
    catalystPresent,
    reliability: 'Richtwert der Reaktionsfamilie (Lehrbuch- und Literaturwerte, ± 10–20 kJ/mol)',
    bimolecular: family.bimolecular,
  };
}

function formatNumber(value: number): string {
  return Math.round(value).toLocaleString('de-DE');
}

interface Hypothesis {
  reactants: Substance[];
  keys: string[];
  reagent?: Substance;
  /** Gewicht der Annahme (zwei Edukte oder Edukt + Reagenz) */
  weight: (template: TemplateInfo, nnCategories: Float32Array) => number;
}

const resultCache = new Map<string, AiProposal[]>();

// Vorlagen und Edukte werden oft wiederholt angewendet: RDKit-Objekte zwischenspeichern
const reactionObjects = new Map<string, ReturnType<MainModule['get_rxn']> | null>();
const moleculeObjects = new Map<string, ReturnType<MainModule['get_mol']> | null>();

function cachedMol(rdkit: MainModule, smiles: string): ReturnType<MainModule['get_mol']> | null {
  if (!moleculeObjects.has(smiles)) {
    if (moleculeObjects.size > 400) {
      for (const mol of moleculeObjects.values()) mol?.delete();
      moleculeObjects.clear();
    }
    const mol = rdkit.get_mol(smiles);
    moleculeObjects.set(smiles, mol && mol.is_valid() ? mol : null);
  }
  return moleculeObjects.get(smiles) ?? null;
}

/** Wendet eine Vorlage an und liefert die Strukturschlüssel der Hauptprodukte. */
/** Vorlage vorwärts anwenden; liefert die Strukturschlüssel der Hauptprodukte. */
export function applyTemplate(rdkit: MainModule, smarts: string, reactants: string[]): string[] {
  if (!reactionObjects.has(smarts)) {
    let rxn: ReturnType<MainModule['get_rxn']> | null = null;
    try {
      rxn = rdkit.get_rxn(smarts);
    } catch {
      rxn = null;
    }
    reactionObjects.set(smarts, rxn);
  }
  const rxn = reactionObjects.get(smarts);
  if (!rxn) return [];
  const mols = reactants.map((smiles) => cachedMol(rdkit, smiles));
  if (mols.some((mol) => !mol)) return [];
  const list = new rdkit.MolList();
  const products: string[] = [];
  try {
    mols.forEach((mol) => list.append(mol as NonNullable<typeof mol>));
    const sets = rxn.run_reactants(list, 12);
    for (let i = 0; i < sets.size(); i++) {
      const set = sets.get(i);
      if (!set) continue;
      let main = '';
      for (let j = 0; j < set.size(); j++) {
        const product = set.at(j);
        if (!product) continue;
        try {
          const smiles = product.get_smiles();
          if (smiles.length > main.length) main = smiles;
        } catch {
          // ungültiges Produkt
        } finally {
          product.delete();
        }
      }
      set.delete();
      const key = main ? structureKey(rdkit, main) : null;
      if (key) products.push(key);
    }
    sets.delete();
  } catch {
    return products;
  } finally {
    list.delete();
  }
  return [...new Set(products)];
}

/**
 * Vorhersage der KI für die Stoffe im Gefäß (ein oder zwei Edukte).
 * Liefert die wahrscheinlichsten Reaktionen, jeweils mit Katalysator und
 * Aktivierungsenergie.
 */
export function predictWithModel(
  rdkit: MainModule,
  model: ReactionModel,
  substances: Substance[],
  options: PredictionOptions,
): AiProposal[] {
  const others = options.others ?? [];
  const cacheKey = `${substances.map((entry) => entry.id).join('+')}|${others.map((entry) => entry.id).join('+')}|${options.temperatureC}|${options.catalysis ?? ''}`;
  const cached = resultCache.get(cacheKey);
  if (cached) return cached;

  const present = new Set<string>();
  for (const substance of [...substances, ...others]) {
    const category = substanceCategory(rdkit, substance);
    if (category) present.add(category);
  }
  if (options.catalysis && options.catalysis !== 'keine') for (const id of CATALYSIS_CATEGORIES[options.catalysis]) present.add(id);

  // Edukte: alle Stoffe mit Struktur (auch Säuren und Salze ohne eigenes SMILES)
  const organic = substances.filter((substance) => keyOf(rdkit, substance));
  const hypotheses: Hypothesis[] = [];
  const categoryIndex = new Map(model.categories.map((id, index) => [id, index]));
  if (organic.length >= 2) {
    const [a, b] = organic;
    hypotheses.push({ reactants: [a, b], keys: [keyOf(rdkit, a) as string, keyOf(rdkit, b) as string], weight: () => 1 });
  }
  for (const reactant of organic) {
    const partner = substances.find((entry) => entry !== reactant);
    const partnerCategory = partner ? substanceCategory(rdkit, partner) : null;
    hypotheses.push({
      reactants: [reactant],
      keys: [keyOf(rdkit, reactant) as string],
      reagent: partner,
      weight: (template, nnCategories) => {
        if (!partner) return 1;
        if (!partnerCategory || partnerCategory === 'loesungsmittel') return 0.12;
        const share = template.c[partnerCategory] ?? 0;
        const nn = nnCategories[categoryIndex.get(partnerCategory) ?? -1] ?? 0;
        return 0.1 + 0.9 * Math.max(share, nn);
      },
    });
  }

  interface Candidate {
    product: string;
    score: number;
    best: { template: number; contribution: number; hypothesis: Hypothesis; nn: Float32Array };
  }
  const candidates = new Map<string, Candidate>();
  const reactantKeys = new Set(organic.map((substance) => keyOf(rdkit, substance)));

  for (const hypothesis of hypotheses) {
    const bits = reactantBits(rdkit, hypothesis.keys);
    if (!bits) continue;
    const out = forward(model.network, bits);
    const ranked = [...out.templates.keys()]
      .filter((index) => model.templates[index].a === hypothesis.keys.length && out.templates[index] > 1e-4)
      .sort((x, y) => out.templates[y] - out.templates[x])
      .slice(0, 50);
    for (const index of ranked) {
      const template = model.templates[index];
      const orders = hypothesis.keys.length === 2 ? [hypothesis.keys, [...hypothesis.keys].reverse()] : [hypothesis.keys];
      const products = new Set<string>();
      for (const order of orders) {
        for (const key of applyTemplate(rdkit, template.s, order)) {
          if (!reactantKeys.has(key)) products.add(key);
        }
      }
      if (!products.size) continue;
      const contribution = (out.templates[index] * hypothesis.weight(template, out.categories)) / products.size;
      for (const product of products) {
        if (!isPublishableProduct(product, rdkit)) continue;
        const entry = candidates.get(product);
        if (!entry) {
          candidates.set(product, { product, score: contribution, best: { template: index, contribution, hypothesis, nn: out.categories } });
        } else {
          entry.score += contribution;
          if (contribution > entry.best.contribution) entry.best = { template: index, contribution, hypothesis, nn: out.categories };
        }
      }
    }
  }

  // Dirigierende Wirkung bei elektrophiler Substitution am Aromaten berücksichtigen
  for (const candidate of candidates.values()) {
    const family = model.templates[candidate.best.template].f;
    if (family !== 'halogenierung' && family !== 'aromaten-substitution') continue;
    for (const reactant of candidate.best.hypothesis.keys) candidate.score *= directingFactor(rdkit, reactant, candidate.product);
  }

  const proposals: AiProposal[] = [...candidates.values()]
    .filter((candidate) => candidate.score >= (model.templates[candidate.best.template].f === 'sonstige' ? 0.05 : 0.01))
    // gerundet vergleichen, damit die Reihenfolge der Stoffe keine Rolle spielt
    .sort((a, b) => Math.round(b.score * 1e6) - Math.round(a.score * 1e6) || a.product.localeCompare(b.product))
    .slice(0, options.limit ?? 5)
    .map((candidate, rank) => {
      const template = model.templates[candidate.best.template];
      const family = adjustFamily(
        rdkit,
        FAMILY_BY_ID.get(template.f) ?? (FAMILY_BY_ID.get('sonstige') as ReactionFamily),
        candidate.best.hypothesis.keys,
      );
      const catalysts = buildCatalysts(rdkit, template, family, candidate.best.nn, model, present);
      const energy = energyFor(family, catalysts, options.temperatureC);
      const product = describeProduct(rdkit, candidate.product);
      const { reactants, reagent } = candidate.best.hypothesis;
      const equation = `${reactants.map((entry) => entry.name).join(' + ')}${reagent && reactants.length === 1 ? ` (mit ${reagent.name})` : ''} → ${product.name}`;
      const enthalpy = enthalpyFromStructures(
        rdkit,
        reactants.map((entry) => ({ formula: entry.formula, smiles: entry.smiles, label: entry.name })),
        [{ formula: product.formula ?? '', smiles: product.smiles, label: product.name }],
      );
      return {
        id: `ki-${reactants.map((entry) => entry.id).join('-')}-${rank}-${candidate.product.length}`,
        source: 'ki' as const,
        title: family.name,
        familyId: family.id,
        family,
        reactants,
        reagent: reactants.length === 1 ? reagent : undefined,
        products: [product],
        equation,
        confidence: Math.min(1, candidate.score),
        templateCount: template.n,
        example: template.e,
        exampleSource: template.q,
        catalysts,
        energy,
        enthalpy: enthalpy?.ok ? enthalpy.enthalpy : null,
        explanation: explain(family, template, energy, catalysts),
        hazards: [],
      };
    });

  if (resultCache.size > 200) resultCache.clear();
  resultCache.set(cacheKey, proposals);
  return proposals;
}

const ACTIVATORS = ['[OX2H1]', '[OX2][CX4]', '[NX3;H2,H1;!$(N[C,S]=O)]', '[NX3;H0;!$(N[C,S]=O);!$([N+])]', '[CH3]'];
const DEACTIVATORS = ['[N+](=O)[O-]', 'C#N', '[CX3]=O', 'S(=O)(=O)'];
const ENTERING = '[Br,Cl,I,$([N+](=O)[O-])]';

function countMatches(rdkit: MainModule, smiles: string, smarts: string): number {
  return withMolCount(rdkit, smiles, smarts);
}

function withMolCount(rdkit: MainModule, smiles: string, smarts: string): number {
  const mol = rdkit.get_mol(smiles);
  const query = rdkit.get_qmol(smarts);
  try {
    if (!mol || !query || !mol.is_valid()) return 0;
    const result = JSON.parse(mol.get_substruct_matches(query)) as unknown[];
    return Array.isArray(result) ? result.length : 0;
  } catch {
    return 0;
  } finally {
    mol?.delete();
    query?.delete();
  }
}

/**
 * Faktor für die Stellung eines neu eingeführten Substituenten am Aromaten:
 * Aktivierende Gruppen dirigieren nach ortho/para, desaktivierende nach meta.
 */
function directingFactor(rdkit: MainModule, reactant: string, product: string): number {
  const path = (group: string, bonds: number) => `[c;$(c-${group})]${':c'.repeat(bonds - 1)}:[c]-${ENTERING}`;
  const added = (smarts: string) => countMatches(rdkit, product, smarts) - countMatches(rdkit, reactant, smarts);
  let factor = 1;
  for (const group of ACTIVATORS) {
    if (!countMatches(rdkit, reactant, `c-${group}`)) continue;
    const orthoPara = added(path(group, 1)) + added(path(group, 3));
    if (added(path(group, 2)) > 0 && orthoPara <= 0) factor *= 0.05;
    else if (orthoPara > 0 && added(path(group, 3)) > 0) factor *= 1.3; // para leicht bevorzugt
    break;
  }
  if (factor === 1) {
    for (const group of DEACTIVATORS) {
      if (!countMatches(rdkit, reactant, `c${group.startsWith('[N+]') ? '-' : ''}${group}`)) continue;
      if (added(path(group, 1)) + added(path(group, 3)) > 0 && added(path(group, 2)) <= 0) factor *= 0.2;
      break;
    }
  }
  return factor;
}

/**
 * Stark aktivierte Aromaten (Phenole, Aniline) reagieren mit Elektrophilen schon
 * ohne Katalysator – Bromwasser wird von Phenol sofort entfärbt.
 */
function adjustFamily(rdkit: MainModule, family: ReactionFamily, reactants: string[]): ReactionFamily {
  if (family.id !== 'halogenierung' && family.id !== 'aromaten-substitution') return family;
  const activated = reactants.some((smiles) => countMatches(rdkit, smiles, 'c[OX2H1,NX3H2,NX3H1;!$(N[C,S]=O)]') > 0);
  if (!activated) return family;
  return {
    ...family,
    eaUncatalyzed: family.eaUncatalyzed - 45,
    eaCatalyzed: family.eaCatalyzed - 35,
    requiresCatalyst: false,
    effect: `${family.effect} Die OH- bzw. NH₂-Gruppe schiebt aber so viel Elektronendichte in den Ring, dass die Substitution hier schon ohne Katalysator abläuft (ortho und para).`,
  };
}

function explain(family: ReactionFamily, template: TemplateInfo, energy: EnergyProfile, catalysts: CatalystSuggestion[]): string {
  const parts: string[] = [];
  parts.push(`${family.description} Die KI kennt diesen Reaktionstyp aus ${template.n.toLocaleString('de-DE')} Patentreaktionen.`);
  if (energy.catalyzed) parts.push(family.effect);
  const main = catalysts.find((entry) => ACTIVATING_ROLES.includes(entry.role));
  if (main && main.share > 0) {
    parts.push(`In ${Math.round(main.share * 100)} % dieser Patente wurde ein Hilfsstoff der Art «${main.label}» verwendet${main.examples.length ? `, meist ${main.examples.slice(0, 2).join(' oder ')}` : ''}.`);
  }
  return parts.join(' ');
}

/** «mit Palladiumkatalysator», aber «mit «Konzentrierte Schwefelsäure»». */
export function withCatalyst(name: string | null | undefined): string {
  if (!name) return 'mit Katalysator';
  return /(katalysator|reagenz|mittel)$/i.test(name) ? `mit ${name}` : `mit «${name}»`;
}

/** Satz zur Aktivierungsenergie bei der eingestellten Temperatur. */
export function energyText(energy: EnergyProfile, temperatureC: number): string {
  const t = `${formatNumber(temperatureC)} °C`;
  const without = energy.requiresCatalyst
    ? `Ohne Katalysator gibt es praktisch keinen Reaktionsweg (Ea ≈ ${formatNumber(energy.eaUncatalyzed)} kJ/mol).`
    : `Ohne Katalysator: Ea ≈ ${formatNumber(energy.eaUncatalyzed)} kJ/mol – bei ${t} ${speedWords(energy.uncatalyzed)}${
        energy.temperatureUncatalyzed !== null && energy.uncatalyzed.speed !== 'schnell' && energy.uncatalyzed.speed !== 'praktikabel'
          ? `; in einer Stunde erst ab etwa ${formatNumber(Math.max(energy.temperatureUncatalyzed, -50))} °C`
          : ''
      }.`;
  if (!energy.catalyzed || energy.eaCatalyzed === null) return without;
  const withText = `${capitalize(withCatalyst(energy.catalystName))}: Ea ≈ ${formatNumber(energy.eaCatalyzed)} kJ/mol – bei ${t} ${speedWords(energy.catalyzed)}${
    energy.temperatureCatalyzed !== null && (energy.catalyzed.speed === 'langsam' || energy.catalyzed.speed === 'blockiert')
      ? `; zügig ab etwa ${formatNumber(Math.max(energy.temperatureCatalyzed, -50))} °C`
      : ''
  }.`;
  return `${without} ${withText}`;
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function speedWords(entry: Kinetics): string {
  const half = formatHalfLife(entry.halfLife);
  switch (entry.speed) {
    case 'schnell':
      return `sofort (Halbwertszeit ${half})`;
    case 'praktikabel':
      return `gut durchführbar (Halbwertszeit ${half})`;
    case 'langsam':
      return `sehr langsam (Halbwertszeit ${half})`;
    default:
      return `praktisch keine Reaktion (Halbwertszeit ${half})`;
  }
}

function formatHalfLife(seconds: number): string {
  if (seconds < 1) return 'unter 1 s';
  if (seconds < 120) return `${Math.round(seconds)} s`;
  if (seconds < 7200) return `${Math.round(seconds / 60)} min`;
  if (seconds < 172_800) return `${Math.round(seconds / 3600)} h`;
  if (seconds < 3.15e7 * 2) return `${Math.round(seconds / 86_400)} Tage`;
  const years = seconds / 3.15e7;
  if (years < 1e6) return `${Number(years.toPrecision(2)).toLocaleString('de-DE')} Jahre`;
  if (years < 1e9) return `${Number((years / 1e6).toPrecision(2)).toLocaleString('de-DE')} Mio. Jahre`;
  return 'länger als das Alter des Universums';
}

// ---------------------------------------------------------------------
// Wissensbasis für anorganische und technische Katalyse
// ---------------------------------------------------------------------

/** Aktivierungsenergie aus einer Starttemperatur (Arrhenius, Halbwertszeit eine Stunde). */
function barrierFromStart(startC: number, bimolecular: boolean): number {
  return maximumBarrier(startC, bimolecular);
}

/** Vorschläge aus der Wissensbasis für die Stoffe im Gefäß. */
export function predictFromKnowledge(
  substances: Substance[],
  options: PredictionOptions,
): AiProposal[] {
  const all = [...substances, ...(options.others ?? [])];
  const ids = all.map((entry) => entry.id);
  const processes = new Set<CatalyzedProcess>(processesFor(ids).filter((process) => process.reactants.length > 1));
  // Zerfall eines einzelnen Stoffes: wenn er allein im Gefäß ist oder sein Katalysator dabei ist (H2O2 + Braunstein)
  for (const process of CATALYZED_PROCESSES) {
    if (process.reactants.length !== 1 || !process.reactants[0].some((id) => ids.includes(id))) continue;
    const catalystPresent = process.catalysts.some(
      (option) => option.substanceIds.some((id) => ids.includes(id)) || (option.catalysis && option.catalysis === options.catalysis),
    );
    if (substances.length === 1 || catalystPresent) processes.add(process);
  }
  return [...processes].map((process) => knowledgeProposal(process, all, options));
}

function knowledgeProposal(process: CatalyzedProcess, vessel: Substance[], options: PredictionOptions): AiProposal {
  const T = options.temperatureC;
  const ids = new Set(vessel.map((entry) => entry.id));
  const options2 = process.catalysts.map((option) => {
    const present =
      option.substanceIds.some((id) => ids.has(id)) || (options.catalysis !== undefined && options.catalysis !== 'keine' && option.catalysis === options.catalysis);
    const ea = option.ea ?? (option.startC !== undefined ? barrierFromStart(option.startC, process.bimolecular) : undefined);
    return { option, present, ea };
  });
  const best = options2.find((entry) => entry.present) ?? [...options2].sort((a, b) => (a.ea ?? 999) - (b.ea ?? 999))[0];
  const eaUncatalyzed =
    process.eaUncatalyzed ?? (process.startUncatalyzed !== undefined && process.startUncatalyzed !== null ? barrierFromStart(process.startUncatalyzed, process.bimolecular) : undefined);
  const requiresCatalyst = eaUncatalyzed === undefined && process.startUncatalyzed === null;
  const reactants = process.reactants
    .map((slot) => vessel.find((entry) => slot.includes(entry.id)))
    .filter((entry): entry is Substance => Boolean(entry));

  let energy: EnergyProfile | null = null;
  const uncatalyzedEa = eaUncatalyzed ?? 250;
  if (best?.ea !== undefined || eaUncatalyzed !== undefined || requiresCatalyst) {
    const pre = process.preExponential;
    const uncatalyzed = kinetics(uncatalyzedEa, T, process.bimolecular, pre);
    const catalyzed = best?.ea !== undefined ? kinetics(best.ea, T, process.bimolecular, pre) : null;
    const slow = (entry: Kinetics) => entry.speed === 'langsam' || entry.speed === 'blockiert';
    energy = {
      eaUncatalyzed: uncatalyzedEa,
      eaCatalyzed: best?.ea ?? null,
      catalystName: best?.option.name ?? null,
      uncatalyzed,
      catalyzed,
      temperatureUncatalyzed: requiresCatalyst ? null : (process.startUncatalyzed ?? requiredTemperature(uncatalyzedEa, process.bimolecular, pre)),
      temperatureCatalyzed: best ? (best.option.startC ?? (best.ea !== undefined ? requiredTemperature(best.ea, process.bimolecular, pre) : null)) : null,
      requiresCatalyst,
      catalystNeeded: Boolean(catalyzed) && (requiresCatalyst || slow(uncatalyzed)),
      catalystPresent: options2.some((entry) => entry.present),
      presentRole: options2.some((entry) => entry.present) ? 'Katalysator' : null,
      reliability:
        process.reliability === 'Tabellenwert' && (best?.option.reliability ?? 'Tabellenwert') === 'Tabellenwert'
          ? 'Tabellenwert aus Lehrbüchern'
          : 'Größenordnung; wo nur die Starttemperatur bekannt ist, ist Ea daraus abgeleitet',
      bimolecular: process.bimolecular,
      preExponential: pre,
    };
  }

  const catalysts: CatalystSuggestion[] = options2.map(({ option, present }) => ({
    category: option.catalysis ?? 'wissensbasis',
    label: option.name,
    role: 'Katalysator',
    score: present ? 1 : 0.8,
    share: 0,
    purpose: option.note ?? process.explanation,
    examples: [],
    substanceIds: option.substanceIds.filter((id) => substanceById(id)),
    catalysis: option.catalysis,
    present,
  }));

  const temperatureNote = !energy && best ? `${best.option.name}: ${best.option.note ?? 'beschleunigt die Reaktion deutlich.'}` : '';

  return {
    id: `wissen-${process.id}`,
    source: 'wissensbasis',
    title: process.name,
    familyId: process.id,
    family: null,
    reactants,
    products: [],
    equation: process.equation,
    confidence: 0.9,
    catalysts,
    energy,
    enthalpy: knowledgeEnthalpy(process, vessel, options.rdkit ?? null),
    explanation: `${process.explanation} ${temperatureNote}`.trim(),
    hazards: process.hazards ?? [],
    conditions: process.conditions,
  };
}

function knowledgeEnthalpy(process: CatalyzedProcess, vessel: Substance[], rdkit: MainModule | null): ReactionEnthalpy | null {
  const hints = vessel.map((entry) => ({ formula: entry.formula, smiles: entry.smiles, name: entry.name }));
  const result = enthalpyOfEquation(rdkit, process.equation, { hints });
  return result?.ok ? result.enthalpy : null;
}

/** SMILES eines Produkts gültig? Für Tests. */
export function validProduct(rdkit: MainModule, smiles: string): boolean {
  return canonicalSmiles(rdkit, smiles) !== null;
}
