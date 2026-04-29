import { Card, Flag } from '@melli/ui';
import type { Currency } from '@melli/types';

interface Props {
  rows: Currency[];
  compact?: boolean;
}

export function RatesTable({ rows, compact = false }: Props) {
  if (rows.length === 0) {
    return (
      <Card className="p-8 text-center text-sm text-ink-500">
        Rates are being updated. Please check back shortly.
      </Card>
    );
  }
  return (
    <Card className="overflow-hidden">
      {/* Desktop table */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-ink-50/60 text-left text-xs uppercase tracking-wider text-ink-500">
            <tr>
              <th className="px-6 py-3">Currency</th>
              <th className="px-6 py-3">Code</th>
              {!compact && <th className="hidden md:table-cell px-6 py-3">Symbol</th>}
              <th className="px-6 py-3 text-right">We Buy (CAD)</th>
              <th className="px-6 py-3 text-right">We Sell (CAD)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.code} className="border-t border-ink-100 hover:bg-gold-50/30">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <Flag code={c.flag} size="md" />
                    <span className="font-medium text-ink-900">{c.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 font-mono text-ink-700">{c.code}</td>
                {!compact && <td className="hidden md:table-cell px-6 py-4 text-ink-500">{c.symbol}</td>}
                <td className="px-6 py-4 text-right tabular-nums font-medium text-ink-900">
                  {formatRate(c.buy)}
                </td>
                <td className="px-6 py-4 text-right tabular-nums font-medium text-gold-700">
                  {formatRate(c.sell)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile card list */}
      <div className="sm:hidden divide-y divide-ink-100">
        {rows.map((c) => (
          <div key={c.code} className="flex items-center gap-3 px-4 py-3">
            <Flag code={c.flag} size="md" />
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="font-medium text-ink-900 truncate">{c.name}</span>
                <span className="font-mono text-xs text-ink-400">{c.code}</span>
              </div>
              <div className="mt-1 flex gap-4 text-sm tabular-nums">
                <span className="text-ink-600">
                  <span className="text-xs text-ink-400">Buy </span>
                  {formatRate(c.buy)}
                </span>
                <span className="text-gold-700 font-medium">
                  <span className="text-xs text-ink-400">Sell </span>
                  {formatRate(c.sell)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function formatRate(n: number): string {
  if (n < 0.01) return n.toFixed(6);
  if (n < 1) return n.toFixed(4);
  return n.toFixed(4);
}
