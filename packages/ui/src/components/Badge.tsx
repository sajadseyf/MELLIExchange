import type { HTMLAttributes } from 'react';
import { cn } from '../utils/cn';

type Tone = 'gold' | 'ink' | 'success' | 'danger';

interface Props extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
}

const tones: Record<Tone, string> = {
  gold: 'bg-gold-100 text-gold-700',
  ink: 'bg-ink-100 text-ink-700',
  success: 'bg-emerald-100 text-emerald-700',
  danger: 'bg-burgundy/10 text-burgundy',
};

export function Badge({ className, tone = 'ink', ...props }: Props) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
