import { getTranslations } from 'next-intl/server';
import { Card } from '@melli/ui';
import type { GoldPrice } from '@melli/types';

interface Props {
  rows: GoldPrice[];
  stacked?: boolean;
}

export async function GoldCards({ rows, stacked = false }: Props) {
  const t = await getTranslations('gold');

  const karatDesc: Record<number, string> = {
    14: t('k14_desc'),
    18: t('k18_desc'),
    22: t('k22_desc'),
    24: t('k24_desc'),
  };
  const cadGram = t('cad_gram');

  if (rows.length === 0) {
    return (
      <div className="p-8 text-center text-sm text-ink-500 dark:text-zinc-400">{t('empty')}</div>
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
              <p className="mt-0.5 text-xs text-ink-500 dark:text-zinc-500">{karatDesc[g.karat]}</p>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold tabular-nums text-ink-900 dark:text-white">
                ${g.pricePerGram.toFixed(2)}
              </div>
              <div className="text-[10px] uppercase tracking-wider text-ink-400 dark:text-zinc-500">
                {cadGram}
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
            <span className="ml-2 text-base font-normal text-ink-400 dark:text-zinc-500">/ gram</span>
          </div>
          <p className="mt-3 text-sm text-ink-500 dark:text-zinc-400">{karatDesc[g.karat]}</p>
          <p className="mt-4 text-xs text-ink-400 dark:text-zinc-500">
            Updated {new Date(g.updatedAt).toLocaleString()}
          </p>
        </Card>
      ))}
    </div>
  );
}
