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
      <div className="space-y-3">
        {rows.map((g) => (
          <div
            key={g.karat}
            className="flex items-center justify-between rounded-xl border border-ink-100 bg-ink-50/50 px-4 py-3 dark:border-dark-border dark:bg-dark-raised"
          >
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-gold-600 dark:text-gold-400">
                {g.karat}K Gold
              </div>
              <p className="mt-0.5 text-xs text-ink-400 dark:text-zinc-500">
                {KARAT_LABELS[g.karat]}
              </p>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold tabular-nums text-ink-900 dark:text-white">
                ${g.pricePerGram.toFixed(2)}
              </div>
              <div className="text-[11px] text-ink-400 dark:text-zinc-500">CAD / gram</div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {rows.map((g) => (
        <Card key={g.karat} className="relative overflow-hidden p-6">
          <div
            aria-hidden
            className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-gold-100 opacity-40 dark:bg-gold-500/10"
          />
          <div className="relative">
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
          </div>
        </Card>
      ))}
    </div>
  );
}
