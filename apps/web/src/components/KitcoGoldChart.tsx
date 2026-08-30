'use client';

import { useEffect, useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import type { KitcoPoint } from '@/pages/api/kitco-history';

type Range = '30d' | '60d' | '1y';

interface ChartRow {
  label: string;
  price: number;
}

function buildRows(points: KitcoPoint[]): ChartRow[] {
  return points.map(p => ({
    label: new Date(p.ts * 1000).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' }),
    price: p.price,
  }));
}

function fmt(v: number) {
  return `$${v.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

const RANGE_LABELS: Record<Range, string> = { '30d': '30 Days', '60d': '60 Days', '1y': '1 Year' };

export function KitcoGoldChart() {
  const [range, setRange]   = useState<Range>('30d');
  const [rows, setRows]     = useState<ChartRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(false);

    fetch(`/api/kitco-history?range=${range}`)
      .then(r => r.json())
      .then(d => {
        if (!active) return;
        if (d.points?.length) {
          setRows(buildRows(d.points));
        } else {
          setError(true);
        }
      })
      .catch(() => { if (active) setError(true); })
      .finally(() => { if (active) setLoading(false); });

    return () => { active = false; };
  }, [range]);

  const min = rows.length ? Math.min(...rows.map(r => r.price)) : 0;
  const max = rows.length ? Math.max(...rows.map(r => r.price)) : 0;
  const domain: [number, number] = rows.length ? [Math.floor(min * 0.998), Math.ceil(max * 1.002)] : [0, 1];

  return (
    <div>
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-ink-900 dark:text-white">
            Gold Spot Price — USD/oz
          </h3>
          <p className="text-xs text-ink-400 dark:text-zinc-500">
            Live historical data via{' '}
            <a href="https://www.kitco.com" target="_blank" rel="noopener noreferrer"
              className="underline hover:text-gold-600 dark:hover:text-gold-400">Kitco</a>
          </p>
        </div>

        {/* Range selector */}
        <div className="flex gap-1 rounded-lg border border-ink-200 bg-ink-50 p-0.5 dark:border-dark-border dark:bg-dark-raised">
          {(['30d', '60d', '1y'] as Range[]).map(r => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`rounded-md px-3 py-1 text-xs font-semibold transition-all ${
                range === r
                  ? 'bg-gold-500 text-white shadow-sm'
                  : 'text-ink-500 hover:text-ink-800 dark:text-zinc-400 dark:hover:text-white'
              }`}
            >
              {RANGE_LABELS[r]}
            </button>
          ))}
        </div>
      </div>

      {/* Current range summary */}
      {rows.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-4 text-sm">
          <div>
            <span className="text-ink-400 dark:text-zinc-500">Latest </span>
            <span className="font-bold tabular-nums text-gold-700 dark:text-gold-400">{fmt(rows[rows.length - 1]!.price)}</span>
          </div>
          <div>
            <span className="text-ink-400 dark:text-zinc-500">Range </span>
            <span className="tabular-nums text-ink-700 dark:text-zinc-300">{fmt(min)} – {fmt(max)}</span>
          </div>
          {(() => {
            const first = rows[0]!.price;
            const last = rows[rows.length - 1]!.price;
            const pct = ((last - first) / first * 100);
            const up = pct >= 0;
            return (
              <div>
                <span className="text-ink-400 dark:text-zinc-500">Change </span>
                <span className={`font-semibold tabular-nums ${up ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                  {up ? '+' : ''}{pct.toFixed(2)}%
                </span>
              </div>
            );
          })()}
        </div>
      )}

      {/* Chart */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gold-300 border-t-gold-600" />
        </div>
      ) : error ? (
        <div className="flex h-64 items-center justify-center rounded-lg border border-ink-100 bg-ink-50/60 dark:border-dark-border dark:bg-dark-raised/30">
          <p className="text-sm text-ink-400 dark:text-zinc-500">Unable to load chart data</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={rows} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#d97706" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#d97706" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(156,163,175,0.15)" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: '#9ca3af' }}
              tickLine={false} axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={domain}
              tick={{ fontSize: 10, fill: '#9ca3af' }}
              tickLine={false} axisLine={false}
              tickFormatter={fmt}
              width={60}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(17,17,17,0.92)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '8px', fontSize: 12,
              }}
              labelStyle={{ color: '#e5e7eb', marginBottom: 4 }}
              itemStyle={{ color: '#fbbf24' }}
              formatter={(v) => [fmt(Number(v)), 'Gold USD/oz']}
            />
            <Area
              type="monotone"
              dataKey="price"
              stroke="#d97706"
              strokeWidth={2}
              fill="url(#goldGrad)"
              dot={false}
              activeDot={{ r: 4, fill: '#d97706' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
