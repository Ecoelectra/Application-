/**
 * Baut die Reaktions-KI komplett neu: Vorlagen parallel herausschneiden, dann
 * das Netz trainieren und bewerten. Aufruf: npm run ki
 *
 * Voraussetzung: die USPTO-Daten unter .cache/uspto (lädt «npm run reaktionen»).
 * Mit mehreren Quellen (empfohlen) vorher die Schritte aus
 * scripts/ki/quellen/download.sh, prepare.py und map.py ausführen; dann liest
 * die Extraktion die zugeordneten Reaktionen aus .cache/quellen.
 *
 * Dauer auf vier Kernen: nur USPTO-MIT etwa 7 Minuten Extraktion und 20–30
 * Minuten Training; mit allen Quellen (1,31 Mio. Reaktionen) etwa 2–3 Stunden
 * Atomzuordnung, 15 Minuten Extraktion und 70 Minuten Training.
 *
 * Mit KI_VERGLEICH=<Ordner> wird danach das neue Modell mit einem alten
 * (netz.bin.gz + vorlagen.json.gz) auf denselben Testreaktionen verglichen.
 */
import { spawn } from 'node:child_process';
import { cpus } from 'node:os';

const parts = Math.max(1, Math.min(4, cpus().length));

function run(args) {
  return new Promise((resolve, reject) => {
    const child = spawn('npx', ['vite-node', ...args], { stdio: 'inherit', shell: process.platform === 'win32' });
    child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`${args.join(' ')} endete mit Code ${code}`))));
  });
}

await Promise.all(Array.from({ length: parts }, (_, part) => run(['scripts/ki/extract.ts', String(part), String(parts)])));
await run(['scripts/ki/train.ts']);
if (process.env.KI_VERGLEICH) {
  await run(['scripts/ki/evaluate.ts', `vorher=${process.env.KI_VERGLEICH}`, 'nachher=public/ki']);
}
