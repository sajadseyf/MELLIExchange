import { Card } from '@melli/ui';
import type { GoldPrice } from '@melli/types';

const KARAT_LABELS: Record<number, string> = {
  18: 'Fine for jewelry and design pieces',
  22: 'Traditional high-purity standard',
  24: 'Pure gold — investment grade',
};

interface Props {
  rows: GoldPrice[];
  stacked?: boolean;
}

export function GoldCards({ rows, stacked = false }: Props) {
  if (rows.length === 0) {
    return (
      <div className="p-8 text-center text-sm text-ink-500 dark:text-zinc-400">
        Gold prices are being updated. Please check back shortly.
      </div>
    );
  }

  if (stacked) {
    return (
      <div className="divide-y divide-gold-200/40 dark:divide-dark-border">
        {rows.map((g) => (
          <div key={g.karat} className="flex items-baseline justify-between py-3 first:pt-0 last:pb-0">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-gold-700 dark:text-gold-400">
                {g.karat}K Gold
              </div>
              <p className="mt-0.5 text-xs text-ink-500 dark:text-zinc-500">
                {KARAT_LABELS[g.karat]}
              </p>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold tabular-nums text-ink-900 dark:text-white">
                ${g.pricePerGram.toFixed(2)}
              </div>
              <div className="text-[10px] uppercase tracking-wider text-ink-400 dark:text-zinc-500">
                CAD / gram
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {rows.map((g) => (
        <Card key={g.karat} className="p-6">
          <div className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-gold-600 dark:text-gold-400">
            {g.karat}-karat gold
          </div>
          <div className="text-4xl font-bold tabular-nums text-ink-900 dark:text-white">
            CAD {g.pricePerGram.toFixed(2)}
            <span className="ml-2 text-base font-normal text-ink-400 dark:text-zinc-500">
              / gram
            </span>
          </div>
          <p className="mt-3 text-sm text-ink-500 dark:text-zinc-400">
            {KARAT_LABELS[g.karat]}
          </p>
          <p className="mt-4 text-xs text-ink-400 dark:text-zinc-500">
            Updated {new Date(g.updatedAt).toLocaleString()}
          </p>
        </Card>
      ))}
    </div>
  );
}
