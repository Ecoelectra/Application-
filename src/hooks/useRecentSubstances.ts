import { useCallback, useEffect, useState } from 'react';

export interface RecentEntry {
  label: string;
  smiles?: string;
  formula?: string;
  cid?: number;
}

const STORAGE_KEY = 'synthesis-app:recent';
const MAX_ENTRIES = 12;

function read(): RecentEntry[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as RecentEntry[]) : [];
  } catch {
    return [];
  }
}

/** Merkt sich die zuletzt betrachteten Stoffe lokal auf dem Gerät. */
export function useRecentSubstances(): {
  recent: RecentEntry[];
  remember: (entry: RecentEntry) => void;
  clear: () => void;
} {
  const [recent, setRecent] = useState<RecentEntry[]>([]);

  useEffect(() => {
    setRecent(read());
  }, []);

  const remember = useCallback((entry: RecentEntry) => {
    setRecent((current) => {
      const filtered = current.filter(
        (item) => item.label.toLowerCase() !== entry.label.toLowerCase(),
      );
      const next = [entry, ...filtered].slice(0, MAX_ENTRIES);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* Speichern ist optional */
      }
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setRecent([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* egal */
    }
  }, []);

  return { recent, remember, clear };
}
