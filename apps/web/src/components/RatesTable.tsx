import { Card, Flag } from '@melli/ui';
import type { Currency } from '@melli/types';

interface Props {
  rows: Currency[];
  compact?: boolean;
}

export function RatesTable({ rows, compact = false }: Props) {
  if (rows.length === 0) {
    return (
      <div className="p-8 text-center text-sm text-ink-500 dark:text-zinc-400">
        Rates are being updated. Please check back shortly.
      </div>
    );
  }

  const Wrapper = compact ? 'div' : Card;

  return (
    <Wrapper className={compact ? '' : 'overflow-hidden'}>
      {/* Desktop table */}
      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full text-sm">
          <thead className="bg-ink-50/60 text-left text-xs uppercase tracking-wider text-ink-500 dark:bg-dark-raised/50 dark:text-zinc-500">
            <tr>
              <th className="px-6 py-3">Currency</th>
              <th className="px-6 py-3">Code</th>
              {!compact && <th className="hidden px-6 py-3 md:table-cell">Symbol</th>}
              <th className="px-6 py-3 text-right">We Buy (CAD)</th>
              <th className="px-6 py-3 text-right">We Sell (CAD)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr
                key={c.code}
                className="border-t border-ink-100 transition-colors hover:bg-ink-50/50 dark:border-dark-border dark:hover:bg-dark-raised/50"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <Flag code={c.flag} size="md" />
                    <span className="font-medium text-ink-900 dark:text-white">{c.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 font-mono text-ink-700 dark:text-zinc-400">{c.code}</td>
                {!compact && (
                  <td className="hidden px-6 py-4 text-ink-500 dark:text-zinc-500 md:table-cell">
                    {c.symbol}
                  </td>
                )}
                <td className="px-6 py-4 text-right tabular-nums font-medium text-ink-900 dark:text-zinc-200">
                  {formatRate(c.buy)}
                </td>
                <td className="px-6 py-4 text-right tabular-nums font-medium text-gold-700 dark:text-gold-400">
                  {formatRate(c.sell)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile card list */}
      <div className="divide-y divide-ink-100 dark:divide-dark-border sm:hidden">
        {rows.map((c) => (
          <div key={c.code} className="flex items-center gap-3 px-4 py-3">
            <Flag code={c.flag} size="md" />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2">
                <span className="truncate font-medium text-ink-900 dark:text-white">{c.name}</span>
                <span className="font-mono text-xs text-ink-400 dark:text-zinc-500">{c.code}</span>
              </div>
              <div className="mt-1 flex gap-4 text-sm tabular-nums">
                <span className="text-ink-600 dark:text-zinc-400">
                  <span className="text-xs text-ink-400 dark:text-zinc-500">Buy </span>
                  {formatRate(c.buy)}
                </span>
                <span className="font-medium text-gold-700 dark:text-gold-400">
                  <span className="text-xs text-ink-400 dark:text-zinc-500">Sell </span>
                  {formatRate(c.sell)}
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
