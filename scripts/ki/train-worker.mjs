/**
 * Rechenkern für das Training der Reaktions-KI (läuft in mehreren Threads).
 *
 * Jeder Thread rechnet für seinen Teil eines Mini-Batches Vorwärts- und
 * Rückwärtsdurchlauf und schreibt die Gradienten in seinen eigenen, geteilten
 * Speicher. Der Hauptthread summiert und aktualisiert die Gewichte (Adam).
 * Reines JavaScript ohne Abhängigkeiten, damit es ohne Übersetzer läuft.
 */
import { parentPort, workerData } from 'node:worker_threads';

const { dims, shared } = workerData;
const { inputs: I, hidden: H, templates: T, categories: C, categoryWeight } = dims;

const w1 = new Float32Array(shared.w1);
const b1 = new Float32Array(shared.b1);
const w2 = new Float32Array(shared.w2);
const b2 = new Float32Array(shared.b2);
const w3 = new Float32Array(shared.w3);
const b3 = new Float32Array(shared.b3);

const g1 = new Float32Array(shared.g1);
const gb1 = new Float32Array(shared.gb1);
const g2 = new Float32Array(shared.g2);
const gb2 = new Float32Array(shared.gb2);
const g3 = new Float32Array(shared.g3);
const gb3 = new Float32Array(shared.gb3);
const touched = new Uint8Array(shared.touched);

const bits = new Uint16Array(shared.bits);
const offsets = new Int32Array(shared.offsets);
const labels = new Int32Array(shared.labels);
const masks = new Uint32Array(shared.masks);
const order = new Int32Array(shared.order);

const h = new Float32Array(H);
const dh = new Float32Array(H);
const logits = new Float32Array(T);
const catOut = new Float32Array(C);

parentPort.on('message', ({ start, end }) => {
  g2.fill(0);
  gb2.fill(0);
  g3.fill(0);
  gb3.fill(0);
  gb1.fill(0);
  // Nur die zuletzt benutzten Zeilen von g1 zurücksetzen
  for (let i = 0; i < I; i++) {
    if (touched[i]) {
      g1.fill(0, i * H, (i + 1) * H);
      touched[i] = 0;
    }
  }
  let loss = 0;
  let correct = 0;
  for (let p = start; p < end; p++) {
    const sample = order[p];
    const from = offsets[sample];
    const to = offsets[sample + 1];
    // verdeckte Schicht
    h.set(b1);
    for (let k = from; k < to; k++) {
      const row = bits[k] * H;
      for (let j = 0; j < H; j++) h[j] += w1[row + j];
    }
    for (let j = 0; j < H; j++) if (h[j] < 0) h[j] = 0;
    // Vorlagen: Softmax und Kreuzentropie
    let max = -Infinity;
    let best = 0;
    for (let t = 0; t < T; t++) {
      let sum = b2[t];
      const row = t * H;
      for (let j = 0; j < H; j++) sum += w2[row + j] * h[j];
      logits[t] = sum;
      if (sum > max) {
        max = sum;
        best = t;
      }
    }
    let total = 0;
    for (let t = 0; t < T; t++) {
      logits[t] = Math.exp(logits[t] - max);
      total += logits[t];
    }
    const label = labels[sample];
    loss -= Math.log(Math.max(logits[label] / total, 1e-12));
    if (best === label) correct++;
    dh.fill(0);
    for (let t = 0; t < T; t++) {
      const grad = logits[t] / total - (t === label ? 1 : 0);
      if (Math.abs(grad) < 1e-7) continue;
      gb2[t] += grad;
      const row = t * H;
      for (let j = 0; j < H; j++) {
        g2[row + j] += grad * h[j];
        dh[j] += grad * w2[row + j];
      }
    }
    // Hilfsstoff-Kategorien: Sigmoid und binäre Kreuzentropie
    const mask = masks[sample];
    for (let c = 0; c < C; c++) {
      let sum = b3[c];
      const row = c * H;
      for (let j = 0; j < H; j++) sum += w3[row + j] * h[j];
      const prob = 1 / (1 + Math.exp(-sum));
      catOut[c] = prob;
      const target = (mask >>> c) & 1;
      loss -= categoryWeight * (target ? Math.log(Math.max(prob, 1e-12)) : Math.log(Math.max(1 - prob, 1e-12)));
      const grad = categoryWeight * (prob - target);
      gb3[c] += grad;
      for (let j = 0; j < H; j++) {
        g3[row + j] += grad * h[j];
        dh[j] += grad * w3[row + j];
      }
    }
    // zurück in die erste Schicht (nur aktive Neuronen und gesetzte Bits)
    for (let j = 0; j < H; j++) if (h[j] <= 0) dh[j] = 0;
    for (let j = 0; j < H; j++) gb1[j] += dh[j];
    for (let k = from; k < to; k++) {
      const input = bits[k];
      touched[input] = 1;
      const row = input * H;
      for (let j = 0; j < H; j++) g1[row + j] += dh[j];
    }
  }
  parentPort.postMessage({ loss, correct });
});
