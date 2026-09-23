import { useEffect, useState } from 'react';
import { loadCatalog, type Synthesis } from '../data/catalog';

/** Lädt den Synthesekatalog beim ersten Bedarf. */
export function useCatalog(): { catalog: Synthesis[]; loading: boolean } {
  const [catalog, setCatalog] = useState<Synthesis[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    loadCatalog().then((entries) => {
      if (!active) return;
      setCatalog(entries);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  return { catalog, loading };
}
