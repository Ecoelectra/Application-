/**
 * Erzeugt die App-Icons als PNG.
 *
 * Statt einer Bildbibliothek wird direkt ein PNG geschrieben: Die Grafik wird
 * vierfach überabgetastet gezeichnet und anschließend heruntergerechnet, das
 * ergibt saubere Kanten.
 */
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const target = resolve(root, 'public/icons');
mkdirSync(target, { recursive: true });

const SUPERSAMPLE = 4;

/** Farbe als [r, g, b] */
const BACKGROUND_TOP = [31, 111, 235];
const BACKGROUND_BOTTOM = [123, 63, 228];
const GLASS = [255, 255, 255];
const LIQUID = [126, 231, 196];

function mix(a, b, t) {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ];
}

/** Liegt der Punkt im Kolben (Erlenmeyerform)? */
function insideFlask(x, y) {
  // Hals
  if (y >= 0.2 && y <= 0.4 && x >= 0.44 && x <= 0.56) return true;
  // Körper: Trapez, das nach unten breiter wird
  if (y > 0.4 && y <= 0.79) {
    const t = (y - 0.4) / (0.79 - 0.4);
    const halfWidth = 0.06 + t * 0.2;
    return Math.abs(x - 0.5) <= halfWidth;
  }
  // Boden
  if (y > 0.79 && y <= 0.82) return Math.abs(x - 0.5) <= 0.26;
  return false;
}

function insideLiquid(x, y) {
  return y >= 0.6 && insideFlask(x, y);
}

function insideRing(x, y) {
  // Öffnung oben
  return y >= 0.17 && y <= 0.21 && Math.abs(x - 0.5) <= 0.1;
}

function drawPixel(x, y) {
  // abgerundetes Quadrat als Hintergrund
  const radius = 0.22;
  const dx = Math.max(Math.abs(x - 0.5) - (0.5 - radius), 0);
  const dy = Math.max(Math.abs(y - 0.5) - (0.5 - radius), 0);
  if (Math.hypot(dx, dy) > radius) return [0, 0, 0, 0];

  const background = mix(BACKGROUND_TOP, BACKGROUND_BOTTOM, (x + y) / 2);

  if (insideRing(x, y)) return [...GLASS, 255];
  if (insideLiquid(x, y)) return [...LIQUID, 255];
  if (insideFlask(x, y)) {
    // Glaswand: nur der Rand wird hell gezeichnet
    const edge =
      !insideFlask(x - 0.012, y) ||
      !insideFlask(x + 0.012, y) ||
      !insideFlask(x, y - 0.012) ||
      !insideFlask(x, y + 0.012);
    if (edge) return [...GLASS, 255];
    return [...mix(background, GLASS, 0.18), 255];
  }
  return [...background, 255];
}

function renderIcon(size) {
  const big = size * SUPERSAMPLE;
  const samples = new Uint8ClampedArray(big * big * 4);

  for (let py = 0; py < big; py++) {
    for (let px = 0; px < big; px++) {
      const [r, g, b, a] = drawPixel((px + 0.5) / big, (py + 0.5) / big);
      const index = (py * big + px) * 4;
      samples[index] = r;
      samples[index + 1] = g;
      samples[index + 2] = b;
      samples[index + 3] = a;
    }
  }

  // Herunterrechnen (Mittelwert über SUPERSAMPLE²)
  const pixels = new Uint8ClampedArray(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let sy = 0; sy < SUPERSAMPLE; sy++) {
        for (let sx = 0; sx < SUPERSAMPLE; sx++) {
          const index = ((y * SUPERSAMPLE + sy) * big + (x * SUPERSAMPLE + sx)) * 4;
          r += samples[index];
          g += samples[index + 1];
          b += samples[index + 2];
          a += samples[index + 3];
        }
      }
      const count = SUPERSAMPLE * SUPERSAMPLE;
      const out = (y * size + x) * 4;
      pixels[out] = r / count;
      pixels[out + 1] = g / count;
      pixels[out + 2] = b / count;
      pixels[out + 3] = a / count;
    }
  }
  return pixels;
}

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buffer) {
  let crc = -1;
  for (const byte of buffer) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ -1) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const typeAndData = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typeAndData));
  return Buffer.concat([length, typeAndData, crc]);
}

function encodePng(pixels, size) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8; // Bittiefe
  header[9] = 6; // RGBA
  header[10] = 0;
  header[11] = 0;
  header[12] = 0;

  // Jede Zeile bekommt ein Filterbyte (0 = keine Filterung)
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    Buffer.from(pixels.buffer, y * size * 4, size * 4).copy(raw, y * (size * 4 + 1) + 1);
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const pngBySize = new Map();
function pngFor(size) {
  if (!pngBySize.has(size)) pngBySize.set(size, encodePng(renderIcon(size), size));
  return pngBySize.get(size);
}

for (const size of [32, 180, 192, 512]) {
  const png = pngFor(size);
  writeFileSync(resolve(target, `icon-${size}.png`), png);
  console.log(`Icon erzeugt: icon-${size}.png (${png.length} Bytes)`);
}

/** Windows-Icon: mehrere Auflösungen als eingebettete PNGs. */
function encodeIco(sizes) {
  const images = sizes.map((size) => ({ size, data: pngFor(size) }));
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserviert
  header.writeUInt16LE(1, 2); // Typ 1 = Icon
  header.writeUInt16LE(images.length, 4);

  let offset = 6 + images.length * 16;
  const entries = [];
  for (const image of images) {
    const entry = Buffer.alloc(16);
    entry[0] = image.size >= 256 ? 0 : image.size; // Breite (0 bedeutet 256)
    entry[1] = image.size >= 256 ? 0 : image.size; // Höhe
    entry[2] = 0; // Farbpalette
    entry[3] = 0; // reserviert
    entry.writeUInt16LE(1, 4); // Farbebenen
    entry.writeUInt16LE(32, 6); // Bits je Pixel
    entry.writeUInt32LE(image.data.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += image.data.length;
    entries.push(entry);
  }

  return Buffer.concat([header, ...entries, ...images.map((image) => image.data)]);
}

// Icons für den Windows-Build (Tauri erwartet diese Dateinamen)
const tauriIcons = resolve(root, 'src-tauri/icons');
mkdirSync(tauriIcons, { recursive: true });
writeFileSync(resolve(tauriIcons, '32x32.png'), pngFor(32));
writeFileSync(resolve(tauriIcons, '128x128.png'), pngFor(128));
writeFileSync(resolve(tauriIcons, '128x128@2x.png'), pngFor(256));
writeFileSync(resolve(tauriIcons, 'icon.png'), pngFor(512));
writeFileSync(resolve(tauriIcons, 'icon.ico'), encodeIco([16, 32, 48, 256]));
console.log('Windows-Icons erzeugt: src-tauri/icons/');

// Zusätzlich ein Vektor-Favicon
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1f6feb"/>
      <stop offset="100%" stop-color="#7b3fe4"/>
    </linearGradient>
  </defs>
  <rect width="100" height="100" rx="22" fill="url(#g)"/>
  <path d="M44 20 h12 v20 l20 39 a4 4 0 0 1 -3.5 6 h-45 a4 4 0 0 1 -3.5 -6 l20 -39 z"
        fill="none" stroke="#fff" stroke-width="4" stroke-linejoin="round"/>
  <path d="M33 62 h34 l8 17 a4 4 0 0 1 -3.5 6 h-43 a4 4 0 0 1 -3.5 -6 z" fill="#7ee7c4"/>
  <line x1="40" y1="20" x2="60" y2="20" stroke="#fff" stroke-width="5" stroke-linecap="round"/>
</svg>
`;
writeFileSync(resolve(root, 'public/favicon.svg'), svg);
console.log('Favicon erzeugt: favicon.svg');
