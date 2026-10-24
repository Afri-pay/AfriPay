'use client';

import { useEffect, useRef, useState } from 'react';
import { addressGroups } from '@/lib/format';
import { Icon } from './Icon';

/** Full address in groups of four. Groups are spaced with margin, so selecting and copying gives the raw key. */
export function AddressText({ address, className = '' }: { address: string; className?: string }) {
  return (
    <span className={`font-mono text-[13px] leading-6 break-words ${className}`}>
      {addressGroups(address).map((group, index) => <span key={index} className="mr-[0.45em] inline-block last:mr-0">{group}</span>)}
    </span>
  );
}

export function CopyButton({ value, label = 'Copy', className = '' }: { value: string; label?: string; className?: string }) {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  async function copy() {
    try { await navigator.clipboard.writeText(value); setState('copied'); } catch { setState('failed'); }
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setState('idle'), 1800);
  }
  return (
    <button type="button" onClick={copy} className={`inline-flex h-8 items-center gap-1.5 rounded-md border border-line-strong bg-surface px-2.5 text-[13px] font-medium text-ink transition-colors hover:bg-subtle ${className}`}>
      <Icon name={state === 'copied' ? 'check' : 'copy'} size={15} className={state === 'copied' ? 'text-positive' : 'text-ink-2'} />
      <span aria-live="polite">{state === 'copied' ? 'Copied' : state === 'failed' ? 'Copy failed' : label}</span>
    </button>
  );
}
