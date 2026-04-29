import type { ReactNode } from 'react';

interface Props {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
}

export function PageHeading({ eyebrow, title, description }: Props) {
  return (
    <div className="flex flex-col gap-2">
      {eyebrow && (
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-600">
          {eyebrow}
        </span>
      )}
      <h1 className="text-3xl font-semibold text-ink-900 dark:text-white sm:text-4xl">{title}</h1>
      {description && (
        <p className="max-w-2xl text-base text-ink-500 dark:text-zinc-400">{description}</p>
      )}
    </div>
  );
}
