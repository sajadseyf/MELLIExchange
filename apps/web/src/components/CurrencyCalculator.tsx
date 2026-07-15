'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Flag } from '@melli/ui';
import type { Currency } from '@melli/types';

interface Props {
  currencies: Currency[];
}

export function CurrencyCalculator({ currencies }: Props) {
  const t = useTranslations('calculator');

  const [mode,        setMode]        = useState<'buy' | 'sell'>('buy');
  const [foreignCode, setForeignCode] = useState('USD');
  const [cadAmt,      setCadAmt]      = useState('5000');
  const [foreignAmt,  setForeignAmt]  = useState('');
  const [anchor,      setAnchor]      = useState<'cad' | 'foreign'>('cad');

  const flagMap = useMemo(() => {
    const m: Record<string, string> = { CAD: 'ca' };
    currencies.forEach((c) => { m[c.code] = c.flag; });
    return m;
  }, [currencies]);

  const { rate, rateLabel } = useMemo(() => {
    const cur = currencies.find(c => c.code === foreignCode);
    if (!cur) return { rate: null, rateLabel: null };

    const weBuy  = Math.min(cur.buy, cur.sell); // exchange buys foreign from customer
    const weSell = Math.max(cur.buy, cur.sell); // exchange sells foreign to customer

    if (mode === 'sell') {
      // WE sell foreign to customer → customer pays CAD → weSell rate (higher)
      return { rate: weSell, rateLabel: `1 ${foreignCode} = ${weSell.toFixed(4)} CAD` };
    } else {
      // WE buy foreign from customer → customer gets CAD → weBuy rate (lower)
      return { rate: weBuy, rateLabel: `1 ${foreignCode} = ${weBuy.toFixed(4)} CAD` };
    }
  }, [foreignCode, mode, currencies]);

  // Derived: whichever field wasn't last typed updates from the other
  const cadDisplay = anchor === 'cad'
    ? cadAmt
    : (rate && foreignAmt ? (parseFloat(foreignAmt) * rate).toFixed(2) : '');

  const foreignDisplay = anchor === 'foreign'
    ? foreignAmt
    : (rate && cadAmt ? (parseFloat(cadAmt) / rate).toFixed(2) : '');

  function handleCad(v: string)     { setCadAmt(v);     setAnchor('cad'); }
  function handleForeign(v: string) { setForeignAmt(v); setAnchor('foreign'); }

  const inputClass =
    'block h-11 w-full min-w-0 flex-1 rounded-lg border border-ink-200 bg-white px-3 text-base tabular-nums text-ink-900 focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent dark:border-dark-border dark:bg-dark-raised dark:text-white';

  const selectClass =
    'h-11 w-[110px] appearance-none rounded-lg border border-ink-200 bg-white pl-9 pr-7 text-sm font-medium text-ink-900 focus:outline-none focus:ring-2 focus:ring-gold-400 dark:border-dark-border dark:bg-dark-raised dark:text-white';

  // SELL = we sell foreign → customer pays CAD (top) → gets foreign (bottom)
  // BUY  = we buy foreign  → customer brings foreign (top) → gets CAD (bottom)
  const topIsCad = mode === 'sell';

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-navy-100 px-5 py-3.5 dark:border-dark-border">
        <h3 className="text-base font-semibold text-ink-900 dark:text-white">{t('title')}</h3>
        <p className="text-[11px] text-ink-400 dark:text-zinc-500">{t('sub')}</p>
      </div>

      <div className="flex flex-1 flex-col justify-center gap-4 p-4">

        {/* BUY / SELL toggle */}
        <div className="flex rounded-xl border border-ink-200 bg-ink-50/60 p-1 dark:border-dark-border dark:bg-dark-raised">
          <button
            onClick={() => setMode('buy')}
            className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all ${
              mode === 'buy'
                ? 'bg-gold-500 text-white shadow-sm'
                : 'text-ink-500 hover:text-ink-700 dark:text-zinc-400'
            }`}
          >
            {t('buy')}
          </button>
          <button
            onClick={() => setMode('sell')}
            className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all ${
              mode === 'sell'
                ? 'bg-navy-700 text-white shadow-sm dark:bg-navy-600'
                : 'text-ink-500 hover:text-ink-700 dark:text-zinc-400'
            }`}
          >
            {t('sell')}
          </button>
        </div>

        {/* Top field */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-medium uppercase tracking-wider text-ink-400 dark:text-zinc-500">
            {t('i_have')}
          </label>
          <div className="flex gap-2">
            {topIsCad ? (
              <>
                <input
                  type="number" min="0" step="any" placeholder="0"
                  value={cadDisplay}
                  onChange={(e) => handleCad(e.target.value)}
                  onFocus={() => setAnchor('cad')}
                  className={inputClass}
                />
                <div className="relative">
                  <div className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2">
                    <Flag code="ca" size="sm" />
                  </div>
                  <div className={`${selectClass} flex items-center text-ink-500 dark:text-zinc-400 cursor-default`}>
                    CAD
                  </div>
                </div>
              </>
            ) : (
              <>
                <input
                  type="number" min="0" step="any" placeholder="0"
                  value={foreignDisplay}
                  onChange={(e) => handleForeign(e.target.value)}
                  onFocus={() => setAnchor('foreign')}
                  className={inputClass}
                />
                <div className="relative">
                  <div className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2">
                    <Flag code={flagMap[foreignCode] ?? ''} size="sm" />
                  </div>
                  <select
                    value={foreignCode}
                    onChange={(e) => setForeignCode(e.target.value)}
                    className={selectClass}
                  >
                    {currencies.map((c) => <option key={c.code} value={c.code}>{c.code}</option>)}
                  </select>
                  <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-ink-400">
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Rate */}
        <div className="flex items-center gap-2">
          <div className="h-px flex-1 bg-ink-100 dark:bg-dark-border" />
          {rateLabel && (
            <span className="text-[11px] tabular-nums text-ink-400 dark:text-zinc-500">{rateLabel}</span>
          )}
          <div className="h-px flex-1 bg-ink-100 dark:bg-dark-border" />
        </div>

        {/* Bottom field */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-medium uppercase tracking-wider text-ink-400 dark:text-zinc-500">
            {t('i_get')}
          </label>
          <div className="flex gap-2">
            {topIsCad ? (
              <>
                <input
                  type="number" min="0" step="any" placeholder="0"
                  value={foreignDisplay}
                  onChange={(e) => handleForeign(e.target.value)}
                  onFocus={() => setAnchor('foreign')}
                  className={inputClass}
                />
                <div className="relative">
                  <div className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2">
                    <Flag code={flagMap[foreignCode] ?? ''} size="sm" />
                  </div>
                  <select
                    value={foreignCode}
                    onChange={(e) => setForeignCode(e.target.value)}
                    className={selectClass}
                  >
                    {currencies.map((c) => <option key={c.code} value={c.code}>{c.code}</option>)}
                  </select>
                  <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-ink-400">
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </>
            ) : (
              <>
                <input
                  type="number" min="0" step="any" placeholder="0"
                  value={cadDisplay}
                  onChange={(e) => handleCad(e.target.value)}
                  onFocus={() => setAnchor('cad')}
                  className={inputClass}
                />
                <div className="relative">
                  <div className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2">
                    <Flag code="ca" size="sm" />
                  </div>
                  <div className={`${selectClass} flex items-center text-ink-500 dark:text-zinc-400 cursor-default`}>
                    CAD
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
