import type { ReactNode } from 'react';
import { Icon, type IconName } from './Icon';

type Tone = 'info' | 'warning' | 'error' | 'success';

const tones: Record<Tone, { box: string; icon: IconName; iconClass: string }> = {
  info: { box: 'border-line bg-subtle text-ink', icon: 'info', iconClass: 'text-ink-2' },
  warning: { box: 'border-warning-line bg-warning-soft text-ink', icon: 'alert', iconClass: 'text-warning' },
  error: { box: 'border-negative/30 bg-negative-soft text-ink', icon: 'alert', iconClass: 'text-negative' },
  success: { box: 'border-primary/25 bg-primary-soft text-ink', icon: 'check', iconClass: 'text-positive' },
};

/** Inline message tied to the surrounding task. Errors are announced immediately; everything else politely. */
export function Notice({ tone = 'info', title, children, action, className = '' }: { tone?: Tone; title?: string; children?: ReactNode; action?: ReactNode; className?: string }) {
  const style = tones[tone];
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={`flex gap-3 rounded-md border px-3.5 py-3 text-sm ${style.box} ${className}`}>
      <Icon name={style.icon} size={18} className={`mt-px shrink-0 ${style.iconClass}`} />
      <div className="min-w-0 flex-1">
        {title && <p className="font-medium">{title}</p>}
        {children && <div className={`${title ? 'mt-0.5 ' : ''}break-words text-ink-2`}>{children}</div>}
        {action && <div className="mt-2.5 flex flex-wrap gap-2">{action}</div>}
      </div>
    </div>
  );
}
