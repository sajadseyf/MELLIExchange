'use client';

import { useTranslations } from 'next-intl';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import type { GoldHistoryPoint } from '@/lib/api';

interface Props {
  data: GoldHistoryPoint[];
}

function formatDate(iso: string) {
  const parts = iso.split('-');
  return `${parseInt(parts[1] ?? '0')}/${parseInt(parts[2] ?? '0')}`;
}

export function GoldPriceChart({ data }: Props) {
  const t = useTranslations('gold');

  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-ink-400 dark:text-zinc-500">
        {t('empty')}
      </div>
    );
  }

  const chartData = data.map((d) => ({ ...d, label: formatDate(d.date) }));

  return (
    <div className="w-full">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-ink-900 dark:text-white">{t('chart_title')}</h3>
        <p className="text-xs text-ink-400 dark:text-zinc-500">{t('chart_sub')}</p>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ top: 5, right: 16, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(156,163,175,0.2)" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `$${v}`}
            width={52}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(17,17,17,0.92)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '8px',
              fontSize: 12,
            }}
            labelStyle={{ color: '#e5e7eb', marginBottom: 4 }}
            itemStyle={{ color: '#d1d5db' }}
            formatter={(value) => [`$${Number(value).toFixed(2)} CAD`, '']}
          />
          <Legend
            wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
            formatter={(value) => {
              if (value === 'k14') return t('k14_label');
              if (value === 'k18') return t('k18_label');
              if (value === 'k22') return t('k22_label');
              if (value === 'k24') return t('k24_label');
              return value;
            }}
          />
          <Line type="monotone" dataKey="k14" stroke="#a3e635" strokeWidth={2} dot={false} name="k14" />
          <Line type="monotone" dataKey="k18" stroke="#d97706" strokeWidth={2} dot={false} name="k18" />
          <Line type="monotone" dataKey="k22" stroke="#b45309" strokeWidth={2} dot={false} name="k22" />
          <Line type="monotone" dataKey="k24" stroke="#78350f" strokeWidth={2} dot={false} name="k24" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
