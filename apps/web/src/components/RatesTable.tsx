import { getTranslations } from 'next-intl/server';
import { Card, Flag } from '@melli/ui';
import type { Currency } from '@melli/types';

interface Props {
  rows: Currency[];
  compact?: boolean;
}

export async function RatesTable({ rows, compact = false }: Props) {
  const t = await getTranslations('common');

  const visible = rows.filter((c) => !c.hidden);

  if (visible.length === 0) {
    return (
      <div className="p-8 text-center text-sm text-ink-500 dark:text-zinc-400">
        {t('empty_rates')}
      </div>
    );
  }

  const Wrapper = compact ? 'div' : Card;

  return (
    <Wrapper className={compact ? '' : 'overflow-hidden'}>
      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full text-sm">
          <thead className="bg-white/40 text-start text-xs uppercase tracking-wider text-ink-500 dark:bg-dark-raised/50 dark:text-zinc-500">
            <tr>
              <th className="px-6 py-3 text-start">{t('currency')}</th>
              <th className="px-6 py-3 text-start">{t('code')}</th>
              {!compact && <th className="hidden px-6 py-3 text-start md:table-cell">{t('symbol')}</th>}
              <th className="px-6 py-3 text-end">{t('we_buy')}</th>
              <th className="px-6 py-3 text-end">{t('we_sell')}</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((c) => (
              <tr key={c.code} className="border-t border-navy-100/70 transition-colors hover:bg-white/50 dark:border-dark-border dark:hover:bg-dark-raised/50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <Flag code={c.flag} size="md" />
                    <span className="font-medium text-ink-900 dark:text-white">{c.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 font-mono text-start text-ink-700 dark:text-zinc-400">{c.code}</td>
                {!compact && (
                  <td className="hidden px-6 py-4 text-start text-ink-500 dark:text-zinc-500 md:table-cell">{c.symbol}</td>
                )}
                <td className="px-6 py-4 text-end tabular-nums font-medium text-ink-900 dark:text-zinc-200">
                  {c.contactUs ? <span className="text-sm font-medium text-blue-600 dark:text-blue-400">{t('contact_us')}</span> : formatRate(Math.min(c.buy, c.sell))}
                </td>
                <td className="px-6 py-4 text-end tabular-nums font-medium text-gold-700 dark:text-gold-400">
                  {c.contactUs ? <span className="text-sm font-medium text-blue-600 dark:text-blue-400">{t('contact_us')}</span> : formatRate(Math.max(c.buy, c.sell))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="divide-y divide-navy-100/70 dark:divide-dark-border sm:hidden">
        {visible.map((c) => (
          <div key={c.code} className="flex items-center gap-3 px-4 py-3">
            <Flag code={c.flag} size="md" />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2">
                <span className="truncate font-medium text-ink-900 dark:text-white">{c.name}</span>
                <span className="font-mono text-xs text-ink-400 dark:text-zinc-500">{c.code}</span>
              </div>
              <div className="mt-1 flex gap-4 text-sm tabular-nums">
                <span className="text-ink-600 dark:text-zinc-400">
                  <span className="text-xs text-ink-400 dark:text-zinc-500">{t('buy')} </span>
                  {c.contactUs ? <span className="text-blue-600 dark:text-blue-400">{t('contact_us')}</span> : formatRate(Math.min(c.buy, c.sell))}
                </span>
                <span className="font-medium text-gold-700 dark:text-gold-400">
                  <span className="text-xs text-ink-400 dark:text-zinc-500">{t('sell')} </span>
                  {c.contactUs ? <span className="text-blue-600 dark:text-blue-400">{t('contact_us')}</span> : formatRate(Math.max(c.buy, c.sell))}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Wrapper>
  );
}

function formatRate(n: number): string {
  if (n < 0.01) return n.toFixed(6);
  if (n < 1) return n.toFixed(4);
  return n.toFixed(4);
}
