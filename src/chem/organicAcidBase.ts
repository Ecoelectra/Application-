/**
 * Säure-Base-Reaktionen organischer Stoffe.
 *
 * Carbonsäuren, Phenole und Amine reagieren mit anorganischen Säuren, Basen und
 * unedlen Metallen genauso wie ihre anorganischen Verwandten – nur dass das
 * Produkt ein organisches Salz ist. Diese Reaktionen erklären unter anderem,
 * warum sich Benzoesäure in Natronlauge löst oder Anilin in Salzsäure.
 */
import type { MainModule } from '@rdkit/rdkit';
import { buildReaction, type InorganicReaction } from './inorganicRules';
import { canonicalSmiles, matchSmarts, molecularFormula, runReaction } from './rdkit';
import type { Substance } from '../data/types';

export interface OrganicSaltReaction extends InorganicReaction {
  /** Strukturen der Produkte, soweit berechenbar */
  productSmiles: string[];
}

const CARBOXYLIC_ACID = '[CX3](=[OX1])[OX2H1]';
const PHENOL = '[OX2H1]c';
const ALCOHOL = '[OX2H1][CX4]';
const BASIC_AMINE = '[NX3;H2,H1,H0;!$(N[C,S,P]=[O,S,N]);!$(N-[N,O]);!$(N#*);!$(N=*);!$([N]-a:a-[N+](=O)[O-])]';

interface BaseInfo {
  cation: string;
  charge: number;
  /** Nebenprodukte außer dem Salz */
  byproducts: string[];
  kind: 'hydroxid' | 'carbonat' | 'hydrogencarbonat' | 'ammoniak';
}

const BASES: Record<string, BaseInfo> = {
  NaOH: { cation: 'Na', charge: 1, byproducts: ['H2O'], kind: 'hydroxid' },
  KOH: { cation: 'K', charge: 1, byproducts: ['H2O'], kind: 'hydroxid' },
  LiOH: { cation: 'Li', charge: 1, byproducts: ['H2O'], kind: 'hydroxid' },
  'Ca(OH)2': { cation: 'Ca', charge: 2, byproducts: ['H2O'], kind: 'hydroxid' },
  NaHCO3: { cation: 'Na', charge: 1, byproducts: ['H2O', 'CO2'], kind: 'hydrogencarbonat' },
  KHCO3: { cation: 'K', charge: 1, byproducts: ['H2O', 'CO2'], kind: 'hydrogencarbonat' },
  Na2CO3: { cation: 'Na', charge: 1, byproducts: ['H2O', 'CO2'], kind: 'carbonat' },
  K2CO3: { cation: 'K', charge: 1, byproducts: ['H2O', 'CO2'], kind: 'carbonat' },
  CaCO3: { cation: 'Ca', charge: 2, byproducts: ['H2O', 'CO2'], kind: 'carbonat' },
  NH3: { cation: 'NH4', charge: 1, byproducts: [], kind: 'ammoniak' },
};

const ACIDS: Record<string, { anionSmiles: string; charge: number; name: string }> = {
  HCl: { anionSmiles: '[Cl-]', charge: 1, name: 'Hydrochlorid' },
  HBr: { anionSmiles: '[Br-]', charge: 1, name: 'Hydrobromid' },
  HNO3: { anionSmiles: '[O-][N+](=O)[O-]', charge: 1, name: 'Nitrat' },
  H2SO4: { anionSmiles: '[O-]S(=O)(=O)[O-]', charge: 2, name: 'Sulfat' },
};

const METALS: Record<string, number> = { Na: 1, K: 1, Li: 1, Mg: 2, Ca: 2, Zn: 2, Fe: 2, Al: 3 };

function cationSmiles(cation: string, charge: number): string {
  if (cation === 'NH4') return '[NH4+]';
  return `[${cation}${charge === 1 ? '+' : `+${charge}`}]`;
}

/** Deprotoniert die erste passende Gruppe eines Moleküls. */
function deprotonate(rdkit: MainModule, smiles: string, pattern: 'saeure' | 'phenol' | 'alkohol'): string | null {
  const smirks = {
    saeure: '[CX3:1](=[OX1:2])[OX2H1:3]>>[CX3:1](=[OX1:2])[O-:3]',
    phenol: '[OX2H1:1][c:2]>>[O-:1][c:2]',
    alkohol: '[OX2H1:1][CX4:2]>>[O-:1][CX4:2]',
  }[pattern];
  const sets = runReaction(rdkit, smirks, [smiles]);
  return sets[0]?.[0] ?? null;
}

/** Protoniert das basischste Stickstoffatom. */
function protonateAmine(rdkit: MainModule, smiles: string): string | null {
  for (const smirks of [
    '[NX3;H2;!$(N[C,S,P]=[O,S,N]):1]>>[NH3+:1]',
    '[NX3;H1;!$(N[C,S,P]=[O,S,N]);!$(Na):1]>>[NH2+:1]',
    '[NX3;H0;!$(N[C,S,P]=[O,S,N]);!$(Na):1]>>[NH+:1]',
    '[nX2:1]>>[nH+:1]',
  ]) {
    const sets = runReaction(rdkit, smirks, [smiles]);
    if (sets[0]?.[0]) return sets[0][0];
  }
  return null;
}

/** Baut Salz aus Anion (organisch) und Kation, bei mehrwertigen Kationen mehrfach. */
function saltSmiles(anion: string, cation: string, charge: number): string {
  return [...Array(charge).fill(anion), cationSmiles(cation, charge)].join('.');
}

function formulaOf(rdkit: MainModule, smiles: string): string | null {
  return molecularFormula(rdkit, smiles);
}

function withSmiles(
  reaction: InorganicReaction | null,
  productSmiles: string[],
): OrganicSaltReaction | null {
  return reaction ? { ...reaction, productSmiles } : null;
}

/** Säure-Base-Reaktionen eines organischen Stoffes mit einem anorganischen Partner. */
export function organicAcidBase(
  rdkit: MainModule,
  organic: Substance,
  partner: Substance,
): OrganicSaltReaction[] {
  if (!organic.smiles) return [];
  const results: OrganicSaltReaction[] = [];
  const smiles = canonicalSmiles(rdkit, organic.smiles) ?? organic.smiles;
  const isAcid = matchSmarts(rdkit, smiles, CARBOXYLIC_ACID).length > 0;
  const isPhenol = !isAcid && matchSmarts(rdkit, smiles, PHENOL).length > 0;
  const isAlcohol = matchSmarts(rdkit, smiles, ALCOHOL).length > 0;
  const isAmine = matchSmarts(rdkit, smiles, BASIC_AMINE).length > 0 && !isAcid;

  // Carbonsäure oder Phenol mit einer Base
  const base = BASES[partner.formula];
  if (base && (isAcid || (isPhenol && base.kind === 'hydroxid'))) {
    const anion = deprotonate(rdkit, smiles, isAcid ? 'saeure' : 'phenol');
    if (anion) {
      const salt = saltSmiles(anion, base.cation, base.charge);
      const saltFormula = formulaOf(rdkit, salt);
      if (saltFormula) {
        const gas = base.kind === 'carbonat' || base.kind === 'hydrogencarbonat';
        const reaction = buildReaction({
          id: `organisch-base-${organic.id}-${partner.id}`,
          type: 'Neutralisation',
          requires: { aqueous: true },
          title: `${organic.name} und ${partner.name}`,
          reactants: [organic.formula, partner.formula],
          products: [saltFormula, ...base.byproducts],
          observation: gas
            ? 'Es schäumt kräftig auf: Kohlenstoffdioxid entweicht. Das Salz bleibt gelöst.'
            : isPhenol
              ? 'Das schwer wasserlösliche Phenol löst sich in der Lauge als Phenolat auf.'
              : 'Die Säure löst sich als Salz in der Lösung; die Lösung erwärmt sich leicht.',
          explanation: isPhenol
            ? 'Phenole sind schwache Säuren (pKs ≈ 10): Sie reagieren mit Natronlauge, nicht aber mit Natriumhydrogencarbonat. Daran lassen sich Phenole von Carbonsäuren unterscheiden.'
            : 'Die Carboxygruppe gibt ihr Proton an die Base ab. Das Carboxylat ist als Salz wasserlöslich – so lassen sich Carbonsäuren aus organischen Gemischen herauslösen.',
          safetyLevel: 'Schulversuch',
          hazards: base.kind === 'hydroxid' ? ['Laugen sind ätzend.'] : [],
          tags: gas ? ['Gasentwicklung', 'Kohlenstoffdioxid', 'Salzbildung'] : ['Salzbildung', 'Säure-Base-Reaktion'],
        });
        const result = withSmiles(reaction, [salt]);
        if (result) results.push(result);
      }
    }
  }

  // Phenol und Hydrogencarbonat: keine Reaktion – eine Erklärung wert, aber kein Eintrag.

  // Amin mit einer Säure
  const acid = ACIDS[partner.formula];
  if (acid && isAmine) {
    const cation = protonateAmine(rdkit, smiles);
    if (cation) {
      const salt = [...Array(acid.charge).fill(cation), acid.anionSmiles].join('.');
      const saltFormula = formulaOf(rdkit, salt);
      if (saltFormula) {
        const reaction = buildReaction({
          id: `amin-saeure-${organic.id}-${partner.id}`,
          type: 'Ammoniak und Säure',
          requires: { aqueous: true },
          title: `${organic.name} und ${partner.name}`,
          reactants: [organic.formula, partner.formula],
          products: [saltFormula],
          observation: 'Das Amin löst sich in der Säure als Ammoniumsalz; der typische Amingeruch verschwindet.',
          explanation:
            'Amine sind Basen: Das freie Elektronenpaar am Stickstoff nimmt ein Proton auf. Das entstehende Ammoniumsalz ist wasserlöslich – deshalb werden viele Arzneistoffe als Hydrochloride verkauft.',
          safetyLevel: 'Schulversuch',
          hazards: ['Säuren und Amine reizen Haut und Schleimhäute.'],
          tags: ['Salzbildung', 'Säure-Base-Reaktion'],
        });
        const result = withSmiles(reaction, [salt]);
        if (result) results.push(result);
      }
    }
  }

  // Unedles Metall mit Carbonsäure oder Alkalimetall mit Alkohol
  const metalCharge = METALS[partner.formula];
  if (metalCharge && (isAcid || ((isAlcohol || isPhenol) && metalCharge === 1))) {
    const anion = deprotonate(rdkit, smiles, isAcid ? 'saeure' : isPhenol ? 'phenol' : 'alkohol');
    if (anion) {
      const salt = saltSmiles(anion, partner.formula, metalCharge);
      const saltFormula = formulaOf(rdkit, salt);
      if (saltFormula) {
        const reaction = buildReaction({
          id: `metall-${organic.id}-${partner.id}`,
          type: 'Metall und Säure',
          requires: isAcid ? { aqueous: true } : { dry: true },
          title: `${partner.name} und ${organic.name}`,
          reactants: [partner.formula, organic.formula],
          products: [saltFormula, 'H2'],
          observation: isAcid
            ? 'Das Metall löst sich unter Gasentwicklung; die Knallgasprobe ist positiv.'
            : 'Das Alkalimetall löst sich unter Wasserstoffentwicklung – deutlich ruhiger als in Wasser.',
          explanation: isAcid
            ? 'Carbonsäuren sind schwache Säuren, reagieren aber mit unedlen Metallen wie Salzsäure – nur langsamer.'
            : 'Alkohole sind noch schwächere Säuren als Wasser. Natrium reduziert trotzdem ihr Proton zu Wasserstoff; zurück bleibt das Alkoholat, eine starke Base. So vernichtet man im Labor Natriumreste gefahrlos.',
          safetyLevel: isAcid ? 'Schulversuch' : 'Fortgeschritten',
          hazards: ['Wasserstoff ist hochentzündlich.'],
          tags: ['Gasentwicklung', 'Wasserstoff', 'Redoxreaktion'],
        });
        const result = withSmiles(reaction, [salt]);
        if (result) results.push(result);
      }
    }
  }

  return results;
}
