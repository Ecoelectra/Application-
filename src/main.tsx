import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles/global.css';

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Service Worker für den Offline-Betrieb registrieren
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    const base = import.meta.env.BASE_URL || '/';
    navigator.serviceWorker
      .register(`${base}sw.js`, { scope: base })
      .catch(() => {
        // Ohne Service Worker funktioniert die App weiterhin, nur nicht offline
      });
  });
}
