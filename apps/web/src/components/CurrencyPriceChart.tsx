'use client';

import { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import type { Currency } from '@melli/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

type Timeframe = '24h' | '7d' | '30d';

const TF_HOURS: Record<Timeframe, number> = { '24h': 24, '7d': 168, '30d': 720 };

interface Point { label: string; buy: number; sell: number; }

async function fetchLive(code: string, hours: number): Promise<Point[]> {
  try {
    const res = await fetch(`${API_URL}/api/currencies/live?code=${code}&hours=${hours}`);
    if (!res.ok) return [];
    const raw = (await res.json()) as Array<{ time: string; buy: number; sell: number }>;

    // Decide label format based on range
    return raw.map((p, i) => {
      const d = new Date(p.time);
      let label: string;
      if (hours <= 24) {
        // e.g. "14:30"
        label = `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;
      } else if (hours <= 168) {
        // e.g. "Mon 14:00"
        const day = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getDay()] ?? '';
        label = `${day} ${d.getHours().toString().padStart(2,'0')}:00`;
      } else {
        // e.g. "Apr 28"
        label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
      void i; // suppress unused
      return { label, buy: p.buy, sell: p.sell };
    });
  } catch { return []; }
}

const TIMEFRAMES: { key: Timeframe; label: string }[] = [
  { key: '24h', label: '24h' },
  { key: '7d',  label: '7d'  },
  { key: '30d', label: '30d' },
];

interface Props { currencies: Currency[] }

export function CurrencyPriceChart({ currencies }: Props) {
  const visible = currencies.filter((c) => !c.hidden);
  const [selected,  setSelected]  = useState(visible[0]?.code ?? 'USD');
  const [timeframe, setTimeframe] = useState<Timeframe>('24h');
  const [data,      setData]      = useState<Point[]>([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchLive(selected, TF_HOURS[timeframe])
      .then((d) => { setData(d); setLoading(false); });
  }, [selected, timeframe]);

  const cur = currencies.find((c) => c.code === selected);

  const xInterval =
    timeframe === '24h' ? Math.max(1, Math.floor(data.length / 8))  :
    timeframe === '7d'  ? Math.max(1, Math.floor(data.length / 7))  :
                          Math.max(1, Math.floor(data.length / 10));

  return (
    <div className="flex flex-col gap-5">
      {/* Currency picker + timeframe */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="rounded-lg border border-ink-200 bg-white px-3 py-1.5 text-sm font-semibold text-ink-900 outline-none transition-colors hover:border-ink-400 dark:border-dark-border dark:bg-dark-raised dark:text-white"
        >
          {visible.map((c) => (
            <option key={c.code} value={c.code}>
              {c.code} — {c.name}
            </option>
          ))}
        </select>

        <div className="flex overflow-hidden rounded-lg border border-ink-200 text-xs font-semibold dark:border-dark-border">
          {TIMEFRAMES.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTimeframe(key)}
              className={[
                'px-3 py-1.5 transition-colors',
                timeframe === key
                  ? 'bg-ink-900 text-white dark:bg-white dark:text-ink-900'
                  : 'text-ink-500 hover:bg-ink-100 dark:text-zinc-400 dark:hover:bg-dark-raised',
              ].join(' ')}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Title */}
      <div>
        <h3 className="text-base font-semibold text-ink-900 dark:text-white">
          {cur?.name ?? selected}
          <span className="ml-2 text-xs font-normal text-emerald-500">● live</span>
        </h3>
        <p className="text-xs text-ink-400 dark:text-zinc-500">Buy &amp; sell rates vs CAD</p>
      </div>

      {/* Chart */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-gold-400 border-t-transparent" />
        </div>
      ) : data.length === 0 ? (
        <div className="flex h-64 items-center justify-center text-sm text-ink-400 dark:text-zinc-500">
          No data available for this currency.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={data} margin={{ top: 5, right: 16, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(156,163,175,0.15)" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              tickLine={false}
              axisLine={false}
              interval={xInterval}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `$${Number(v).toFixed(3)}`}
              width={60}
              domain={['auto', 'auto']}
            />
            <Tooltip
              contentStyle={{ backgroundColor: 'rgba(17,17,17,0.92)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', fontSize: 12 }}
              labelStyle={{ color: '#e5e7eb', marginBottom: 4 }}
              itemStyle={{ color: '#d1d5db' }}
              formatter={(v) => [`$${Number(v).toFixed(4)} CAD`, '']}
            />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
            <Line type="monotone" dataKey="buy"  stroke="#16a34a" strokeWidth={2} dot={false} name="Buy"  />
            <Line type="monotone" dataKey="sell" stroke="#d97706" strokeWidth={2} dot={false} name="Sell" />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
