import { useEffect, useState } from 'react';
import type { MainModule } from '@rdkit/rdkit';
import { loadRDKit, rdkitOrNull } from '../chem/rdkit';

export type RDKitStatus = 'laden' | 'bereit' | 'fehler';

interface RDKitState {
  rdkit: MainModule | null;
  status: RDKitStatus;
  error?: string;
}

/**
 * Lädt die RDKit-Bibliothek einmalig und stellt sie der ganzen App bereit.
 * Solange sie lädt, bleibt die Oberfläche bedienbar – nur Strukturbilder und
 * Produktberechnungen stehen dann noch nicht zur Verfügung.
 */
export function useRDKit(): RDKitState {
  const [state, setState] = useState<RDKitState>(() => {
    const existing = rdkitOrNull();
    return existing ? { rdkit: existing, status: 'bereit' } : { rdkit: null, status: 'laden' };
  });

  useEffect(() => {
    if (state.status === 'bereit') return;
    let active = true;

    loadRDKit()
      .then((instance) => {
        if (active) setState({ rdkit: instance, status: 'bereit' });
      })
      .catch((error: Error) => {
        if (active) setState({ rdkit: null, status: 'fehler', error: error.message });
      });

    return () => {
      active = false;
    };
  }, [state.status]);

  return state;
}
