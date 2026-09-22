import { useCallback, useEffect, useState } from 'react';

export type Theme = 'hell' | 'dunkel';

const STORAGE_KEY = 'synthesis-app:theme';

function initialTheme(): Theme {
  if (typeof window === 'undefined') return 'hell';
  try {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
    if (stored === 'hell' || stored === 'dunkel') return stored;
  } catch {
    /* privater Modus */
  }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dunkel' : 'hell';
}

export function useTheme(): { theme: Theme; toggleTheme: () => void } {
  const [theme, setTheme] = useState<Theme>(initialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme === 'dunkel' ? 'dark' : 'light';
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* Speichern ist optional */
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((current) => (current === 'hell' ? 'dunkel' : 'hell'));
  }, []);

  return { theme, toggleTheme };
}
