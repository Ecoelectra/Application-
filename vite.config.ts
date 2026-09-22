import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Relativer Basispfad: So läuft die App sowohl unter einer Unteradresse
// (GitHub Pages) als auch im Tauri-Fenster, wo sie von der Festplatte geladen wird.
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 900,
  },
  server: {
    host: true,
    port: 5173,
  },
});
