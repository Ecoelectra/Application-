/**
 * Baut die Reaktions-KI komplett neu: Vorlagen parallel herausschneiden, dann
 * das Netz trainieren und bewerten. Aufruf: npm run ki
 *
 * Voraussetzung: die USPTO-Daten unter .cache/uspto (lädt «npm run reaktionen»).
 * Dauer auf vier Kernen: etwa 7 Minuten Extraktion und 20–30 Minuten Training.
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
