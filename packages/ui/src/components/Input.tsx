import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '../utils/cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id ?? props.name;
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-ink-700"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'h-10 rounded-lg border border-ink-200 bg-white px-3 text-sm text-ink-900',
            'placeholder:text-ink-400',
            'focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent',
            error && 'border-burgundy focus:ring-burgundy/40',
            className,
          )}
          {...props}
        />
        {error && <span className="text-xs text-burgundy">{error}</span>}
      </div>
    );
  },
);
Input.displayName = 'Input';
