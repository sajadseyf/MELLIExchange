'use client';

import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card } from '@melli/ui';
import { api } from '@/lib/api';

const RANGES = [
  { label: '1D', days: 1 },
  { label: '1W', days: 7 },
  { label: '1M', days: 30 },
  { label: '3M', days: 90 },
  { label: '1Y', days: 365 },
] as const;

interface CurrencyHistory { date: string; buy: number; sell: number }
interface GoldHistory     { date: string; k24?: number }
interface SpotHistory     { date: string; priceUsd: number }

function fmtDate(iso: string) {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function CurrencyChart({ code, days }: { code: string; days: number }) {
  const [data, setData] = useState<CurrencyHistory[]>([]);
  useEffect(() => {
    api<CurrencyHistory[]>(`/api/currencies/history?code=${code}&days=${days}`)
      .then(setData).catch(() => setData([]));
  }, [code, days]);

  if (!data.length) return <div className="flex h-48 items-center justify-center text-sm text-ink-400">No data</div>;

  const chartData = data.map((d) => ({ ...d, label: fmtDate(d.date) }));
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="label" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} domain={['auto', 'auto']} />
        <Tooltip formatter={(v: any) => (v !== undefined && v !== null ? Number(v).toFixed(4) : '')} />
        <Legend />
        <Line type="monotone" dataKey="buy"  stroke="#16a34a" dot={false} name="Buy"  strokeWidth={1.5} />
        <Line type="monotone" dataKey="sell" stroke="#dc2626" dot={false} name="Sell" strokeWidth={1.5} />
      </LineChart>
    </ResponsiveContainer>
  );
}

function GoldChart({ days }: { days: number }) {
  const [data, setData] = useState<GoldHistory[]>([]);
  useEffect(() => {
    api<GoldHistory[]>(`/api/gold/history?days=${days}`)
      .then(setData).catch(() => setData([]));
  }, [days]);

  if (!data.length) return <div className="flex h-48 items-center justify-center text-sm text-ink-400">No data</div>;

  const chartData = data.map((d) => ({ ...d, label: fmtDate(d.date) }));
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="label" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} domain={['auto', 'auto']} />
        <Tooltip formatter={(v: unknown) => (typeof v === 'number' ? `$${v.toFixed(2)} CAD/g` : String(v))} />
        <Line type="monotone" dataKey="k24" stroke="#d97706" dot={false} name="24K (CAD/g)" strokeWidth={1.5} />
      </LineChart>
    </ResponsiveContainer>
  );
}

function SilverChart({ days }: { days: number }) {
  const [data, setData] = useState<SpotHistory[]>([]);
  useEffect(() => {
    api<SpotHistory[]>(`/api/spot/history?metal=silver&days=${days}`)
      .then(setData).catch(() => setData([]));
  }, [days]);

  if (!data.length) return <div className="flex h-48 items-center justify-center text-sm text-ink-400">No data</div>;

  const chartData = data.map((d) => ({ ...d, label: typeof d.date === 'string' ? fmtDate(d.date) : '' }));
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="label" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} domain={['auto', 'auto']} />
        <Tooltip formatter={(v: unknown) => (typeof v === 'number' ? `$${v.toFixed(2)} USD/oz` : String(v))} />
        <Line type="monotone" dataKey="priceUsd" stroke="#6b7280" dot={false} name="Silver USD/oz" strokeWidth={1.5} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function AdminChartsPanel() {
  const [days,         setDays]         = useState(30);
  const [currencies,   setCurrencies]   = useState<Array<{ code: string; name: string }>>([]);
  const [selectedCode, setSelectedCode] = useState('USD');

  useEffect(() => {
    api<Array<{ code: string; name: string }>>('/api/currencies')
      .then((list) => { setCurrencies(list); if (list.length) setSelectedCode(list[0]?.code ?? 'USD'); })
      .catch(() => {});
  }, []);

  return (
    <div className="flex flex-col gap-6">
      {/* Range selector */}
      <div className="flex gap-2">
        {RANGES.map(({ label, days: d }) => (
          <button
            key={label}
            onClick={() => setDays(d)}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${days === d ? 'bg-gold-500 text-white' : 'bg-ink-100 text-ink-600 hover:bg-ink-200'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Currency chart */}
      <Card className="p-5">
        <div className="mb-4 flex items-center gap-4">
          <h3 className="font-semibold text-ink-800">Exchange Rate</h3>
          <select
            value={selectedCode}
            onChange={(e) => setSelectedCode(e.target.value)}
            className="rounded-lg border border-ink-200 px-2 py-1 text-sm outline-none focus:border-gold-400"
          >
            {currencies.map((c) => (
              <option key={c.code} value={c.code}>{c.code} — {c.name}</option>
            ))}
          </select>
        </div>
        <CurrencyChart code={selectedCode} days={days} />
      </Card>

      {/* Gold chart */}
      <Card className="p-5">
        <h3 className="mb-4 font-semibold text-ink-800">Gold Price (24K · CAD/g)</h3>
        <GoldChart days={days} />
      </Card>

      {/* Silver chart */}
      <Card className="p-5">
        <h3 className="mb-4 font-semibold text-ink-800">Silver Spot Price (USD/oz)</h3>
        <SilverChart days={days} />
      </Card>
    </div>
  );
}
