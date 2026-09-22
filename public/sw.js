/**
 * Service Worker für den Offline-Betrieb.
 *
 * Strategie:
 *  - Navigationsanfragen: zuerst das Netz, bei Fehlschlag die zwischengespeicherte Startseite.
 *  - Eigene Dateien (JS, CSS, Icons): zuerst der Cache, im Hintergrund wird aktualisiert.
 *  - RDKit-WebAssembly: dauerhaft im Cache, damit Strukturformeln offline funktionieren.
 *  - PubChem: niemals über den Service Worker cachen (die App hat dafür einen eigenen Speicher).
 */
const VERSION = 'v1';
const SHELL_CACHE = `syntheseplaner-shell-${VERSION}`;
const ASSET_CACHE = `syntheseplaner-assets-${VERSION}`;

const SHELL_FILES = [
  './',
  './index.html',
  './manifest.webmanifest',
  './favicon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

// Die großen RDKit-Dateien werden nachgeladen, ohne die Installation aufzuhalten.
const HEAVY_FILES = ['./rdkit/RDKit_minimal.js', './rdkit/RDKit_minimal.wasm'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL_CACHE);
      await cache.addAll(SHELL_FILES).catch(() => undefined);
      self.skipWaiting();
      // Im Hintergrund: RDKit vorladen
      caches.open(ASSET_CACHE).then((assetCache) =>
        Promise.all(
          HEAVY_FILES.map((file) => assetCache.add(file).catch(() => undefined)),
        ),
      );
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names
          .filter((name) => name.startsWith('syntheseplaner-') && !name.endsWith(VERSION))
          .map((name) => caches.delete(name)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Fremde Server (PubChem) nicht abfangen
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          return await fetch(request);
        } catch {
          const cache = await caches.open(SHELL_CACHE);
          return (await cache.match('./index.html')) ?? Response.error();
        }
      })(),
    );
    return;
  }

  event.respondWith(
    (async () => {
      const cache = await caches.open(ASSET_CACHE);
      const cached = await cache.match(request);
      if (cached) {
        // Im Hintergrund aktualisieren
        fetch(request)
          .then((response) => {
            if (response.ok) cache.put(request, response.clone());
          })
          .catch(() => undefined);
        return cached;
      }

      try {
        const response = await fetch(request);
        if (response.ok) cache.put(request, response.clone());
        return response;
      } catch {
        const shell = await caches.open(SHELL_CACHE);
        return (await shell.match(request)) ?? Response.error();
      }
    })(),
  );
});
