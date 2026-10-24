'use client';

import { useCallback, useEffect, useState } from 'react';

export type Theme = 'light' | 'dark' | 'system';
export const THEME_STORAGE_KEY = 'afripay-theme';

/** Runs before hydration (see layout.tsx) so dark-mode users never see a light flash. */
export const themeBootScript = `(function(){try{var t=localStorage.getItem('${THEME_STORAGE_KEY}');var d=t==='dark'||(t!=='light'&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d)}catch(e){}})()`;

function readTheme(): Theme {
  try {
    const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
    return saved === 'light' || saved === 'dark' ? saved : 'system';
  } catch { return 'system'; }
}

function applyTheme(theme: Theme) {
  const dark = theme === 'dark' || (theme === 'system' && Boolean(window.matchMedia?.('(prefers-color-scheme: dark)').matches));
  document.documentElement.classList.toggle('dark', dark);
}

export function useTheme() {
  // Null until storage is read, so the first effect never overrides the boot script's choice.
  const [theme, setThemeState] = useState<Theme | null>(null);
  useEffect(() => { setThemeState(readTheme()); }, []);
  useEffect(() => {
    if (!theme) return;
    applyTheme(theme);
    if (theme !== 'system') return;
    const media = window.matchMedia?.('(prefers-color-scheme: dark)');
    if (!media) return;
    const follow = () => applyTheme('system');
    media.addEventListener?.('change', follow);
    return () => media.removeEventListener?.('change', follow);
  }, [theme]);
  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    try { window.localStorage.setItem(THEME_STORAGE_KEY, next); } catch { /* storage may be blocked */ }
  }, []);
  return { theme: theme ?? 'system', setTheme };
}
