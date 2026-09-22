/**
 * Kopiert die RDKit-WebAssembly-Dateien aus node_modules nach public/rdkit,
 * damit die App sie offline ausliefern kann (PWA-Cache, Tauri-Bundle).
 */
import { mkdir, copyFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = resolve(root, 'node_modules/@rdkit/rdkit/dist');
const target = resolve(root, 'public/rdkit');

await mkdir(target, { recursive: true });
for (const file of ['RDKit_minimal.js', 'RDKit_minimal.wasm']) {
  await copyFile(resolve(source, file), resolve(target, file));
  console.log(`RDKit: ${file} → public/rdkit/`);
}
