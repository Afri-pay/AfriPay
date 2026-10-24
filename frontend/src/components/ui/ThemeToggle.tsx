'use client';

import { useTheme, type Theme } from '@/lib/theme';
import { Icon } from './Icon';

const options: Array<{ value: Theme; label: string; icon: 'sun' | 'moon' | 'system' }> = [
  { value: 'light', label: 'Light', icon: 'sun' },
  { value: 'dark', label: 'Dark', icon: 'moon' },
  { value: 'system', label: 'System', icon: 'system' },
];

export function ThemeSelect() {
  const { theme, setTheme } = useTheme();
  return (
    <div role="radiogroup" aria-label="Theme" className="inline-flex rounded-md border border-line-strong bg-subtle p-0.5">
      {options.map((option) => (
        <button key={option.value} type="button" role="radio" aria-checked={theme === option.value} onClick={() => setTheme(option.value)}
          className={`inline-flex h-8 items-center gap-1.5 rounded-[5px] px-3 text-[13px] font-medium transition-colors ${theme === option.value ? 'bg-surface text-ink shadow-[0_1px_2px_rgba(0,0,0,0.08)]' : 'text-ink-2 hover:text-ink'}`}>
          <Icon name={option.icon} size={15} />{option.label}
        </button>
      ))}
    </div>
  );
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const next: Theme = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
  const icon = theme === 'light' ? 'sun' : theme === 'dark' ? 'moon' : 'system';
  return (
    <button type="button" onClick={() => setTheme(next)} aria-label={`Theme: ${theme}. Switch to ${next}`} title={`Theme: ${theme}`}
      className="inline-flex size-8 items-center justify-center rounded-md text-ink-2 transition-colors hover:bg-subtle hover:text-ink">
      <Icon name={icon} size={17} />
    </button>
  );
}
