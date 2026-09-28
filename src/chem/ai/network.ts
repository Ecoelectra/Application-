/**
 * Das neuronale Netz der Reaktions-KI.
 *
 * Aufbau: Fingerabdruck der Edukte (2048 Bit) → verdeckte Schicht mit ReLU →
 * zwei Ausgänge:
 *  - Softmax über alle Reaktionsvorlagen: Welche Reaktion läuft ab?
 *  - Sigmoid je Hilfsstoff-Kategorie: Welcher Katalysator, welche Base,
 *    welches Reagenz wurde dafür benutzt?
 *
 * Gespeichert wird das Netz mit 8-Bit-Gewichten (je Zeile ein Skalenfaktor),
 * das hält die Datei klein. Beim Laden werden die Gewichte wieder zu
 * Gleitkommazahlen.
 */

export interface Network {
  inputs: number;
  hidden: number;
  templates: number;
  categories: number;
  /** inputs × hidden, zeilenweise je Eingangsbit */
  w1: Float32Array;
  b1: Float32Array;
  /** templates × hidden */
  w2: Float32Array;
  b2: Float32Array;
  /** categories × hidden */
  w3: Float32Array;
  b3: Float32Array;
}

export interface NetworkOutput {
  hidden: Float32Array;
  /** Wahrscheinlichkeit je Vorlage (Summe 1) */
  templates: Float32Array;
  /** Wahrscheinlichkeit je Hilfsstoff-Kategorie (unabhängig) */
  categories: Float32Array;
}

export function createNetwork(inputs: number, hidden: number, templates: number, categories: number): Network {
  return {
    inputs, hidden, templates, categories,
    w1: new Float32Array(inputs * hidden), b1: new Float32Array(hidden),
    w2: new Float32Array(templates * hidden), b2: new Float32Array(templates),
    w3: new Float32Array(categories * hidden), b3: new Float32Array(categories),
  };
}

/** Verdeckte Schicht für die gesetzten Eingangsbits. */
export function hiddenLayer(net: Network, bits: ArrayLike<number>, out = new Float32Array(net.hidden)): Float32Array {
  out.set(net.b1);
  for (let k = 0; k < bits.length; k++) {
    const row = bits[k] * net.hidden;
    for (let j = 0; j < net.hidden; j++) out[j] += net.w1[row + j];
  }
  for (let j = 0; j < net.hidden; j++) if (out[j] < 0) out[j] = 0;
  return out;
}

export function softmaxInPlace(values: Float32Array): void {
  let max = -Infinity;
  for (let i = 0; i < values.length; i++) if (values[i] > max) max = values[i];
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    values[i] = Math.exp(values[i] - max);
    sum += values[i];
  }
  for (let i = 0; i < values.length; i++) values[i] /= sum;
}

/** Vorwärtsrechnung für einen Fingerabdruck. */
export function forward(net: Network, bits: ArrayLike<number>): NetworkOutput {
  const hidden = hiddenLayer(net, bits);
  const templates = new Float32Array(net.templates);
  for (let t = 0; t < net.templates; t++) {
    let sum = net.b2[t];
    const row = t * net.hidden;
    for (let j = 0; j < net.hidden; j++) sum += net.w2[row + j] * hidden[j];
    templates[t] = sum;
  }
  softmaxInPlace(templates);
  const categories = new Float32Array(net.categories);
  for (let c = 0; c < net.categories; c++) {
    let sum = net.b3[c];
    const row = c * net.hidden;
    for (let j = 0; j < net.hidden; j++) sum += net.w3[row + j] * hidden[j];
    categories[c] = 1 / (1 + Math.exp(-sum));
  }
  return { hidden, templates, categories };
}

// ---------------------------------------------------------------------
// Speichern und Laden (8-Bit-Gewichte)
// ---------------------------------------------------------------------

const MAGIC = 'RKI1';

interface Header {
  inputs: number;
  hidden: number;
  templates: number;
  categories: number;
}

function quantize(matrix: Float32Array, rows: number, cols: number): { values: Int8Array; scales: Float32Array } {
  const values = new Int8Array(rows * cols);
  const scales = new Float32Array(rows);
  for (let r = 0; r < rows; r++) {
    let max = 0;
    for (let c = 0; c < cols; c++) max = Math.max(max, Math.abs(matrix[r * cols + c]));
    const scale = max / 127 || 1;
    scales[r] = scale;
    for (let c = 0; c < cols; c++) values[r * cols + c] = Math.round(matrix[r * cols + c] / scale);
  }
  return { values, scales };
}

/** Netz als kompakte Binärdatei. */
export function encodeNetwork(net: Network): Uint8Array {
  const header: Header = { inputs: net.inputs, hidden: net.hidden, templates: net.templates, categories: net.categories };
  const headerBytes = new TextEncoder().encode(JSON.stringify(header));
  const parts: Uint8Array[] = [];
  const pushFloats = (values: Float32Array) => parts.push(new Uint8Array(values.buffer.slice(values.byteOffset, values.byteOffset + values.byteLength)));
  for (const [matrix, bias, rows] of [
    [net.w1, net.b1, net.inputs],
    [net.w2, net.b2, net.templates],
    [net.w3, net.b3, net.categories],
  ] as const) {
    const { values, scales } = quantize(matrix, rows, net.hidden);
    parts.push(new Uint8Array(values.buffer));
    pushFloats(scales);
    pushFloats(bias);
  }
  const total = 8 + headerBytes.length + parts.reduce((sum, part) => sum + part.length, 0);
  const out = new Uint8Array(total);
  out.set(new TextEncoder().encode(MAGIC), 0);
  new DataView(out.buffer).setUint32(4, headerBytes.length, true);
  out.set(headerBytes, 8);
  let offset = 8 + headerBytes.length;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

/** Liest eine mit encodeNetwork geschriebene Datei. */
export function decodeNetwork(bytes: Uint8Array): Network {
  if (new TextDecoder().decode(bytes.slice(0, 4)) !== MAGIC) throw new Error('Keine Netzdatei der Reaktions-KI');
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const headerLength = view.getUint32(4, true);
  const header = JSON.parse(new TextDecoder().decode(bytes.slice(8, 8 + headerLength))) as Header;
  const net = createNetwork(header.inputs, header.hidden, header.templates, header.categories);
  let offset = 8 + headerLength;
  const readFloats = (count: number): Float32Array => {
    const values = new Float32Array(count);
    for (let i = 0; i < count; i++) values[i] = view.getFloat32(offset + i * 4, true);
    offset += count * 4;
    return values;
  };
  for (const [matrix, bias, rows] of [
    [net.w1, net.b1, net.inputs],
    [net.w2, net.b2, net.templates],
    [net.w3, net.b3, net.categories],
  ] as const) {
    const values = new Int8Array(bytes.buffer, bytes.byteOffset + offset, rows * net.hidden);
    offset += rows * net.hidden;
    const scales = readFloats(rows);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < net.hidden; c++) matrix[r * net.hidden + c] = values[r * net.hidden + c] * scales[r];
    }
    bias.set(readFloats(bias.length));
  }
  return net;
}
