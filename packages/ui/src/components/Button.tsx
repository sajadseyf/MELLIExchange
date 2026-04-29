import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '../utils/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const base =
  'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-dark';

const variants: Record<Variant, string> = {
  primary: 'bg-navy-900 text-white hover:bg-navy-800 active:bg-navy-700 dark:bg-gold-500 dark:text-white dark:hover:bg-gold-600',
  secondary:
    'bg-ink-100 text-ink-800 hover:bg-ink-200 active:bg-ink-300 border border-ink-200 dark:bg-dark-raised dark:text-zinc-200 dark:border-dark-border dark:hover:bg-dark-muted',
  ghost: 'bg-transparent text-ink-700 hover:bg-ink-100 dark:text-zinc-300 dark:hover:bg-dark-raised',
  danger: 'bg-burgundy text-cream hover:opacity-90',
};

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';
