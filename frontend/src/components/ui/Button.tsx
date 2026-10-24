import Link from 'next/link';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

const base = 'inline-flex shrink-0 items-center justify-center gap-2 rounded-md font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50';
const variants: Record<Variant, string> = {
  primary: 'bg-primary text-on-primary hover:bg-primary-hover disabled:bg-primary',
  secondary: 'border border-line-strong bg-surface text-ink hover:bg-subtle disabled:bg-surface',
  ghost: 'text-ink-2 hover:bg-subtle hover:text-ink disabled:bg-transparent',
  danger: 'border border-line-strong bg-surface text-negative hover:bg-negative-soft disabled:bg-surface',
};
const sizes: Record<Size, string> = { sm: 'h-8 px-3 text-[13px]', md: 'h-10 px-4 text-sm', lg: 'h-11 px-5 text-[15px]' };

export function buttonClass(variant: Variant = 'secondary', size: Size = 'md', className = '') {
  return `${base} ${variants[variant]} ${sizes[size]} ${className}`;
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size };

export function Button({ variant = 'secondary', size = 'md', className = '', type = 'button', ...props }: ButtonProps) {
  return <button type={type} className={buttonClass(variant, size, className)} {...props} />;
}

export function ButtonLink({ href, variant = 'secondary', size = 'md', className = '', children }: { href: string; variant?: Variant; size?: Size; className?: string; children: ReactNode }) {
  return <Link href={href} className={buttonClass(variant, size, className)}>{children}</Link>;
}
