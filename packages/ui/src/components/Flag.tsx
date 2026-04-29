import { cn } from '../utils/cn';

interface FlagProps {
  code: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = {
  sm: 'text-base',
  md: 'text-xl',
  lg: 'text-2xl',
};

export function Flag({ code, size = 'md', className }: FlagProps) {
  if (!code) return null;
  return (
    <span
      className={cn(
        'fi inline-block rounded-sm shadow-[inset_0_0_0_1px_rgba(0,0,0,0.08)]',
        `fi-${code.toLowerCase()}`,
        sizes[size],
        className,
      )}
      aria-hidden="true"
    />
  );
}
