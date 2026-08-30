'use client';

import { useEffect, useState } from 'react';
import type { IranGoldData } from '@/pages/api/iran-gold';

const ROWS = [
  { key: 'geram18' as const, labelEn: '18K Gold (per gram)',  labelFa: 'طلا ۱۸ عیار (هر گرم)', color: 'text-amber-600 dark:text-amber-400' },
  { key: 'mithqal' as const, labelEn: 'Gold Mithqal',        labelFa: 'مثقال طلا',             color: 'text-yellow-600 dark:text-yellow-400' },
  { key: 'ons'     as const, labelEn: 'Gold Ounce (USD eq)', labelFa: 'انس طلا',               color: 'text-gold-700 dark:text-gold-400' },
  { key: 'tedpix'  as const, labelEn: 'Tehran Stock (TEDPIX)', labelFa: 'شاخص بورس تهران',    color: 'text-blue-600 dark:text-blue-400' },
] as const;

interface Props {
  locale?: string;
}

export function IranGoldPrices({ locale = 'en' }: Props) {
  const isFa = locale === 'fa';
  const [data, setData] = useState<IranGoldData | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const res = await fetch('/api/iran-gold', { cache: 'no-store' });
        if (!res.ok) return;
        const d: IranGoldData = await res.json();
        if (active) {
          setData(d);
          setUpdatedAt(new Date(d.updatedAt).toLocaleTimeString('en-CA', { hour: '2-digit', minute: '2-digit' }));
        }
      } catch { /* ignore */ } finally {
        if (active) setLoading(false);
      }
    }

    load();
    const id = setInterval(load, 2 * 60 * 1000); // refresh every 2 min
    return () => { active = false; clearInterval(id); };
  }, []);

  const hasData = data && (data.geram18 || data.mithqal || data.ons || data.tedpix);

  return (
    <div className="rounded-xl border border-gold-200/60 bg-gradient-to-br from-gold-50/40 via-white to-amber-50/30 dark:border-gold-500/20 dark:from-gold-900/10 dark:via-dark-card dark:to-dark-card">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gold-100 px-5 py-4 dark:border-gold-500/10">
        <div>
          <h3 className="text-base font-semibold text-ink-900 dark:text-white">
            {isFa ? 'قیمت طلا در بازار ایران' : 'Iran Gold Market Prices'}
          </h3>
          <p className="mt-0.5 text-xs text-ink-400 dark:text-zinc-500">
            {isFa ? 'منبع: tgju.org · تومان' : 'Source: tgju.org · Iranian Toman'}
            {updatedAt && <span className="ml-2 opacity-60">· {updatedAt}</span>}
          </p>
        </div>
        {/* Pulsing dot */}
        <span className={`h-2 w-2 rounded-full ${hasData ? 'animate-pulse bg-gold-500' : 'bg-zinc-300 dark:bg-zinc-600'}`} />
      </div>

      {/* Rows */}
      <div className="divide-y divide-gold-100/60 dark:divide-gold-500/10">
        {loading ? (
          /* Skeleton */
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between px-5 py-3.5">
              <div className="h-3.5 w-32 animate-pulse rounded bg-ink-100 dark:bg-dark-raised" />
              <div className="h-4 w-28 animate-pulse rounded bg-ink-100 dark:bg-dark-raised" />
            </div>
          ))
        ) : !hasData ? (
          <div className="px-5 py-6 text-center text-sm text-ink-400 dark:text-zinc-500">
            {isFa ? 'در حال دریافت اطلاعات…' : 'Data unavailable'}
          </div>
        ) : (
          ROWS.map(row => (
            <div key={row.key} className="flex items-center justify-between px-5 py-3.5">
              <span className="text-sm font-medium text-ink-700 dark:text-zinc-300">
                {isFa ? row.labelFa : row.labelEn}
              </span>
              <span className={`text-base font-bold tabular-nums ${row.color}`}>
                {data?.[row.key] ?? '—'}
                {row.key !== 'tedpix' && (
                  <span className="ml-1 text-xs font-normal text-ink-400 dark:text-zinc-500">
                    {isFa ? 'تومان' : 'T'}
                  </span>
                )}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="rounded-b-xl border-t border-gold-100/60 bg-gold-50/30 px-5 py-2.5 dark:border-gold-500/10 dark:bg-gold-900/5">
        <p className="text-[10px] text-ink-400 dark:text-zinc-600">
          {isFa
            ? 'قیمت‌ها از tgju.org دریافت می‌شوند و ممکن است با بازار تفاوت داشته باشند.'
            : 'Prices sourced from tgju.org. For reference only — may differ from in-store rates.'}
        </p>
      </div>
    </div>
  );
}
