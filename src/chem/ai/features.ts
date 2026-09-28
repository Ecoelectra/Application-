/**
 * Eingabe für das neuronale Netz: Morgan-Fingerabdruck (Radius 2, 2048 Bit)
 * aller Edukte, bitweise ODER-verknüpft. Training und App berechnen ihn mit
 * derselben RDKit-Funktion, damit das Netz in der App genau das sieht, was es
 * beim Lernen gesehen hat.
 */
import type { MainModule } from '@rdkit/rdkit';

export const FINGERPRINT_BITS = 2048;
const DETAILS = JSON.stringify({ radius: 2, nBits: FINGERPRINT_BITS });

const cache = new Map<string, Uint8Array | null>();

function packed(rdkit: MainModule, smiles: string): Uint8Array | null {
  const cached = cache.get(smiles);
  if (cached !== undefined) return cached;
  let result: Uint8Array | null = null;
  const mol = rdkit.get_mol(smiles);
  try {
    if (mol && mol.is_valid()) result = mol.get_morgan_fp_as_uint8array(DETAILS) as Uint8Array;
  } catch {
    result = null;
  } finally {
    mol?.delete();
  }
  if (cache.size > 20_000) cache.clear();
  cache.set(smiles, result);
  return result;
}

/** Gesetzte Bits des gemeinsamen Fingerabdrucks, aufsteigend; null bei ungültiger Struktur. */
export function reactantBits(rdkit: MainModule, smiles: string[]): Uint16Array | null {
  const combined = new Uint8Array(FINGERPRINT_BITS / 8);
  for (const entry of smiles) {
    const bits = packed(rdkit, entry);
    if (!bits) return null;
    for (let i = 0; i < combined.length; i++) combined[i] |= bits[i];
  }
  const active: number[] = [];
  for (let i = 0; i < combined.length; i++) {
    const byte = combined[i];
    if (!byte) continue;
    for (let bit = 0; bit < 8; bit++) if (byte & (1 << bit)) active.push(i * 8 + bit);
  }
  return Uint16Array.from(active);
}
