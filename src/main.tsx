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
    // Neue Version installiert und aktiv: einmal neu laden, damit sie sofort gilt
    const hadController = Boolean(navigator.serviceWorker.controller);
    let reloaded = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!hadController || reloaded) return;
      reloaded = true;
      window.location.reload();
    });
    navigator.serviceWorker
      .register(`${base}sw.js`, { scope: base, updateViaCache: 'none' })
      .then((registration) => registration.update())
      .catch(() => {
        // Ohne Service Worker funktioniert die App weiterhin, nur nicht offline
      });
  });
}
