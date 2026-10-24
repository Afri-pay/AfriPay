'use client';

import { useId, useState, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react';
import { Icon } from './Icon';

const control = 'w-full rounded-md border border-line-strong bg-surface px-3 text-[15px] text-ink placeholder:text-ink-3 transition-colors focus:border-primary focus:outline-none focus-visible:outline-none focus:ring-2 focus:ring-primary/20 disabled:bg-subtle disabled:text-ink-2 aria-invalid:border-negative';

type FieldShellProps = { label: string; hint?: ReactNode; error?: string | null; aside?: ReactNode; id: string; children: ReactNode };

function FieldShell({ label, hint, error, aside, id, children }: FieldShellProps) {
  return (
    <div className="grid gap-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-[13px] font-medium text-ink">{label}</label>
        {aside && <span className="text-[13px] text-ink-2">{aside}</span>}
      </div>
      {children}
      {error ? <p id={`${id}-msg`} className="text-[13px] text-negative">{error}</p> : hint ? <p id={`${id}-msg`} className="text-[13px] text-ink-2">{hint}</p> : null}
    </div>
  );
}

type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> & { label: string; hint?: ReactNode; error?: string | null; aside?: ReactNode; mono?: boolean; suffix?: ReactNode };

export function TextField({ label, hint, error, aside, mono, suffix, className = '', ...props }: InputProps) {
  const id = useId();
  return (
    <FieldShell label={label} hint={hint} error={error} aside={aside} id={id}>
      <div className="relative">
        <input id={id} aria-invalid={error ? true : undefined} aria-describedby={error || hint ? `${id}-msg` : undefined} className={`${control} h-11 ${mono ? 'font-mono text-sm' : ''} ${suffix ? 'pr-16' : ''} ${className}`} {...props} />
        {suffix && <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-ink-2">{suffix}</span>}
      </div>
    </FieldShell>
  );
}

export function PasswordField({ label, hint, error, ...props }: Omit<InputProps, 'type' | 'mono' | 'suffix'>) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  return (
    <FieldShell label={label} hint={hint} error={error} id={id}>
      <div className="relative">
        <input id={id} type={visible ? 'text' : 'password'} aria-invalid={error ? true : undefined} aria-describedby={error || hint ? `${id}-msg` : undefined} className={`${control} h-11 pr-11`} {...props} />
        <button type="button" onClick={() => setVisible((v) => !v)} aria-label={visible ? 'Hide password' : 'Show password'} className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-ink-3 hover:text-ink">
          <Icon name={visible ? 'eye-off' : 'eye'} size={18} />
        </button>
      </div>
    </FieldShell>
  );
}

type TextAreaProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'> & { label: string; hint?: ReactNode; error?: string | null };

export function TextAreaField({ label, hint, error, className = '', ...props }: TextAreaProps) {
  const id = useId();
  return (
    <FieldShell label={label} hint={hint} error={error} id={id}>
      <textarea id={id} aria-invalid={error ? true : undefined} aria-describedby={error || hint ? `${id}-msg` : undefined} className={`${control} min-h-24 py-2.5 font-mono text-sm ${className}`} {...props} />
    </FieldShell>
  );
}
