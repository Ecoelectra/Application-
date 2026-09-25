/**
 * Schlüssel für den Abgleich von Strukturen mit der Datenbank belegter Reaktionen.
 *
 * Datenbank und App müssen denselben Stoff auf dieselbe Zeichenkette abbilden.
 * Dazu wird die Stereochemie entfernt (Stoffdatenbank und Patente geben sie
 * unterschiedlich genau an) und die SMILES mit RDKit kanonisiert.
 */
import type { MainModule } from '@rdkit/rdkit';
import { canonicalSmiles } from './rdkit';

/** Zahl der Teildateien, auf die die Datenbank verteilt ist. */
export const SHARD_COUNT = 256;

const keyCache = new Map<string, string | null>();

/** Kanonische SMILES ohne Stereoinformation – der Vergleichsschlüssel. */
export function structureKey(rdkit: MainModule, smiles: string): string | null {
  const cached = keyCache.get(smiles);
  if (cached !== undefined) return cached;
  const flat = smiles.replace(/@+/g, '').replace(/[/\\]/g, '');
  const key = canonicalSmiles(rdkit, flat);
  keyCache.set(smiles, key);
  return key;
}

/**
 * Schlüssel eines Stoffes und seiner Bestandteile.
 * Natronlauge ([Na+].[OH-]) passt so auch auf Reaktionen, in denen nur [OH-] steht.
 */
export function substanceKeys(rdkit: MainModule, smiles: string): string[] {
  const keys = new Set<string>();
  const whole = structureKey(rdkit, smiles);
  if (whole) keys.add(whole);
  if (smiles.includes('.')) {
    for (const fragment of smiles.split('.')) {
      const key = structureKey(rdkit, fragment);
      if (key) keys.add(key);
    }
  }
  return [...keys];
}

/** FNV-1a-Hash; bestimmt, in welcher Teildatei ein Schlüssel steht. */
export function shardOf(key: string, count = SHARD_COUNT): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < key.length; i++) {
    hash ^= key.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0) % count;
}
