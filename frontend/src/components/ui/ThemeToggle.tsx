'use client';

import { useEffect, useState } from 'react';
import { Icon } from './Icon';

type Theme = 'light' | 'dark' | 'system';

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('system');
  useEffect(() => {
    const saved = window.localStorage.getItem('afripay-theme') as Theme | null;
    const selected = saved ?? 'system';
    setTheme(selected);
    const dark = selected === 'dark' || (selected === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', dark);
  }, []);
  function cycle() {
    const next: Theme = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
    setTheme(next);
    window.localStorage.setItem('afripay-theme', next);
    const dark = next === 'dark' || (next === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', dark);
  }
  const icon = theme === 'light' ? 'sun' : theme === 'dark' ? 'moon' : 'system';
  return <button type="button" onClick={cycle} aria-label={`Theme: ${theme}. Change theme`} title={`Theme: ${theme}`} className="icon-button"><Icon name={icon} size={17} /></button>;
}
