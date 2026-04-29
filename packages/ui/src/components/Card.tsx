import type { HTMLAttributes } from 'react';
import { cn } from '../utils/cn';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-xl2 border border-ink-100 bg-white shadow-card',
        'dark:border-dark-border dark:bg-dark-card dark:shadow-none',
        className,
      )}
      {...props}
    />
  );
}
