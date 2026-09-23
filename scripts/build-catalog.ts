/**
 * Erzeugt den Synthesekatalog.
 *
 * Kombiniert alle Reaktionsvorlagen mit allen Stoffen der Datenbank und
 * berechnet für jede passende Kombination das tatsächliche Produkt. Anorganische
 * Reaktionen werden über das Ionenmodell erzeugt und exakt ausgeglichen.
 *
 * Aufruf: npx vite-node scripts/build-catalog.ts
 * Ergebnis: src/data/generated/catalog.json
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import initRDKitModule from '@rdkit/rdkit';
import type { MainModule } from '@rdkit/rdkit';
import { canonicalSmiles, molecularFormula, runReaction } from '../src/chem/rdkit';
import { isPublishableProduct } from '../src/chem/safety';
import { reactPair, reactSingle } from '../src/chem/inorganicRules';
import { REACTIONS } from '../src/data/reactions';
import { SUBSTANCES, substanceSlug } from '../src/data/substances';
import type { Substance } from '../src/data/types';

/**
 * Ein Eintrag des Katalogs: eine konkrete Synthese eines konkreten Stoffes.
 *
 * Wiederkehrende Angaben – Name der Reaktion, Typ, Bedingungen – stehen nicht
 * bei jedem Eintrag, sondern einmal in der Vorlagentabelle. Das hält die Datei
 * klein genug, um sie auch auf dem iPad zügig zu laden.
 */
interface CatalogEntry {
  /** Index in der Vorlagentabelle */
  k: number;
  /** Anzeigename des Produkts */
  p: string;
  /** Kennung des Produkts in der Stoffdatenbank */
  pi?: string;
  ps?: string;
  pf?: string;
  /** Kennungen der Edukte in der Stoffdatenbank */
  ed: string[];
  /** Namen der Edukte, die nicht in der Datenbank stehen */
  en?: string[];
  /** Gleichung, sofern sie von der Vorlage abweicht (anorganische Reaktionen) */
  eq?: string;
}

interface CatalogKind {
  /** Kennung der Reaktionsvorlage, falls es eine Detailseite gibt */
  ruleId?: string;
  name: string;
  type: string;
  category: string;
  equation: string;
  conditions: string;
  level: string;
  /** zusätzliche Suchbegriffe der Vorlage */
  keywords: string;
}

const kinds: CatalogKind[] = [];
const kindIndex = new Map<string, number>();

function kindFor(kind: CatalogKind): number {
  const key = `${kind.ruleId ?? ''}|${kind.name}|${kind.equation}|${kind.conditions}`;
  const existing = kindIndex.get(key);
  if (existing !== undefined) return existing;
  kinds.push(kind);
  kindIndex.set(key, kinds.length - 1);
  return kinds.length - 1;
}

const rdkit: MainModule = await initRDKitModule();

const structureIndex = new Map<string, Substance>();
for (const substance of SUBSTANCES) {
  if (!substance.smiles) continue;
  const canonical = canonicalSmiles(rdkit, substance.smiles);
  if (canonical && !structureIndex.has(canonical)) structureIndex.set(canonical, substance);
}

const entries: CatalogEntry[] = [];
const seen = new Set<string>();

function add(entry: CatalogEntry): void {
  // Gleiche Synthese mit vertauschten Edukten ist dieselbe Synthese
  const key = `${entry.ps ?? entry.pf ?? entry.p}|${entry.k}|${[...entry.ed].sort().join('+')}`;
  if (seen.has(key)) return;
  seen.add(key);
  entries.push(entry);
}

// ---------- Organische Synthesen aus Vorlage und Substrat ----------

const withStructure = SUBSTANCES.filter((substance) => substance.smiles);
let organicCount = 0;

for (const rule of REACTIONS) {
  if (!rule.smirks) continue;
  const defaults = rule.reactantDefaults ?? [];
  const slots = rule.substrateSlots ?? [0];

  for (const substrate of withStructure) {
    for (const slot of slots) {
      if (slot >= Math.max(1, defaults.length)) continue;
      const reactants = defaults.length ? [...defaults] : [substrate.smiles as string];
      reactants[slot] = substrate.smiles as string;

      const productSets = runReaction(rdkit, rule.smirks, reactants);
      if (!productSets.length) continue;

      const products = productSets[0];
      if (!products.every((smiles) => isPublishableProduct(smiles, rdkit))) continue;

      // Das Hauptprodukt ist das größte Bruchstück
      const main = products.reduce((a, b) => (b.length > a.length ? b : a));
      const canonical = canonicalSmiles(rdkit, main) ?? main;
      const known = structureIndex.get(canonical);

      // Reaktionen, die den Stoff unverändert lassen, überspringen
      if (known && known.id === substrate.id) continue;

      const coEducts = reactants
        .map((smiles, index) => (index === slot ? null : structureIndex.get(canonicalSmiles(rdkit, smiles) ?? smiles)))
        .filter((entry): entry is Substance => Boolean(entry));

      const educts = [substrate, ...coEducts];
      const formula = molecularFormula(rdkit, canonical) ?? undefined;
      // Ist das Produkt nicht in der Datenbank, dient die Summenformel als Name –
      // die Struktur daneben sagt ohnehin mehr als ein erfundener Name.
      const productName = known?.name ?? formula ?? canonical;

      const kind = kindFor({
        ruleId: rule.id,
        name: rule.name,
        type: rule.reactionType,
        category: rule.category,
        equation: rule.generalEquation,
        conditions: [rule.conditions.temperature, rule.conditions.solvent].filter(Boolean).join(', '),
        level: rule.safety.level,
        keywords: [...(rule.aliases ?? []), ...rule.keywords].join(' ').toLowerCase(),
      });

      add({
        k: kind,
        p: productName,
        pi: known?.id,
        ps: canonical,
        pf: formula,
        ed: educts.map((entry) => entry.id),
      });
      organicCount++;
      break;
    }
  }
}

// ---------- Anorganische Reaktionen aus dem Ionenmodell ----------

const inorganicPool = SUBSTANCES.filter((substance) =>
  ['Salz', 'Säure', 'Base', 'Element', 'Oxid', 'Gas', 'Oxidationsmittel', 'Reduktionsmittel'].includes(
    substance.category,
  ),
);

let inorganicCount = 0;

function addInorganic(reaction: ReturnType<typeof reactPair>[number], educts: Substance[]): void {
  // Das erste Produkt gilt als Zielstoff der Synthese
  const productFormula = reaction.products[0];
  const known = SUBSTANCES.find((substance) => substance.formula === productFormula);

  const kind = kindFor({
    name: reaction.type,
    type: reaction.type,
    category: 'anorganisch',
    equation: '',
    conditions: reaction.conditions,
    level: reaction.safetyLevel,
    keywords: reaction.tags.join(' ').toLowerCase(),
  });

  add({
    k: kind,
    p: known?.name ?? productFormula,
    pi: known?.id,
    ps: known?.smiles,
    pf: productFormula,
    ed: educts.map((entry) => entry.id),
    eq: reaction.equation,
  });
  inorganicCount++;
}

for (let i = 0; i < inorganicPool.length; i++) {
  for (let j = i + 1; j < inorganicPool.length; j++) {
    for (const reaction of reactPair(inorganicPool[i], inorganicPool[j])) {
      addInorganic(reaction, [inorganicPool[i], inorganicPool[j]]);
    }
  }
}

for (const substance of inorganicPool) {
  for (const reaction of reactSingle(substance)) {
    addInorganic(reaction, [substance]);
  }
}

// ---------- Feste Verfahren aus der Reaktionsdatenbank ----------

for (const rule of REACTIONS) {
  if (!rule.fixedEquation) continue;
  const educts = rule.fixedEquation.reactants
    .map((formula) => SUBSTANCES.find((substance) => substance.formula === formula))
    .filter((entry): entry is Substance => Boolean(entry));
  const productFormula = rule.fixedEquation.products[0];
  const known = SUBSTANCES.find((substance) => substance.formula === productFormula);

  const kind = kindFor({
    ruleId: rule.id,
    name: rule.name,
    type: rule.reactionType,
    category: rule.category,
    equation: rule.fixedEquation.balanced,
    conditions: rule.conditions.temperature,
    level: rule.safety.level,
    keywords: [...(rule.aliases ?? []), ...rule.keywords].join(' ').toLowerCase(),
  });

  add({
    k: kind,
    p: known?.name ?? productFormula,
    pi: known?.id,
    pf: productFormula,
    ps: known?.smiles,
    ed: educts.map((entry) => entry.id),
    en: educts.length ? undefined : rule.fixedEquation.reactants,
  });
}

// ---------- Schreiben ----------

const byProduct = new Map<string, number>();
for (const entry of entries) {
  byProduct.set(entry.pi ?? entry.p, (byProduct.get(entry.pi ?? entry.p) ?? 0) + 1);
}

const outputDir = resolve(import.meta.dirname, '../src/data/generated');
mkdirSync(outputDir, { recursive: true });
const payload = JSON.stringify({ version: 1, kinds, entries });
writeFileSync(resolve(outputDir, 'catalog.json'), payload);

const stats = {
  gesamt: entries.length,
  organisch: organicCount,
  anorganisch: inorganicCount,
  Vorlagen: kinds.length,
  'verschiedene Produkte': byProduct.size,
  'benannte Produkte': entries.filter((entry) => entry.pi).length,
};
console.log('Synthesekatalog erzeugt:');
for (const [key, value] of Object.entries(stats)) console.log(`  ${key}: ${value}`);
console.log(`  Dateigröße: ${Math.round(payload.length / 1024)} kB`);

// Kleine Kostprobe zur Sichtprüfung
console.log('\nBeispiele:');
for (const entry of entries.filter((e) => e.pi).slice(0, 6)) {
  console.log(`  ${entry.p} ← ${entry.ed.join(' + ')} (${kinds[entry.k].name})`);
}
