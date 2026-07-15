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
  const [amount, setAmount]         = useState('100');
  const [foreignCode, setForeignCode] = useState('USD');
  const [mode, setMode]             = useState<'buy' | 'sell'>('buy');

  const flagMap = useMemo(() => {
    const m: Record<string, string> = { CAD: 'ca' };
    currencies.forEach((c) => { m[c.code] = c.flag; });
    return m;
  }, [currencies]);

  const result = useMemo(() => {
    const num = parseFloat(amount);
    if (!num || num <= 0) return null;
    const currency = currencies.find((c) => c.code === foreignCode);
    if (!currency) return null;

    // Always use the lower value as WE BUY rate, higher as WE SELL rate
    const weBuy  = Math.min(currency.buy, currency.sell);
    const weSell = Math.max(currency.buy, currency.sell);

    if (mode === 'buy') {
      // Customer pays CAD → receives foreign currency (exchange sells at weSell)
      const cad = num * weSell;
      return { cadAmount: cad, foreignAmount: num, rate: weSell };
    } else {
      // Customer brings foreign currency → receives CAD (exchange buys at weBuy)
      const cad = num * weBuy;
      return { cadAmount: cad, foreignAmount: num, rate: weBuy };
    }
  }, [amount, foreignCode, mode, currencies]);

  const foreignCodes = currencies.map((c) => c.code);

  const selectClass =
    'h-11 w-[110px] appearance-none rounded-lg border border-ink-200 bg-white pl-9 pr-7 text-sm font-medium text-ink-900 focus:outline-none focus:ring-2 focus:ring-gold-400 dark:border-dark-border dark:bg-dark-raised dark:text-white';

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
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
                : 'text-ink-500 hover:text-ink-700 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            {t('buy')}
          </button>
          <button
            onClick={() => setMode('sell')}
            className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all ${
              mode === 'sell'
                ? 'bg-navy-700 text-white shadow-sm dark:bg-navy-600'
                : 'text-ink-500 hover:text-ink-700 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            {t('sell')}
          </button>
        </div>

        {/* Currency selector + amount */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-medium uppercase tracking-wider text-ink-400 dark:text-zinc-500">
            {mode === 'buy' ? t('i_want_to_buy') : t('i_want_to_sell')}
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              min="0"
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="block h-11 w-full min-w-0 flex-1 rounded-lg border border-ink-200 bg-white px-3 text-base tabular-nums text-ink-900 focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent dark:border-dark-border dark:bg-dark-raised dark:text-white"
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
                {foreignCodes.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-ink-400 dark:text-zinc-500">
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Result */}
        <div className={`rounded-xl border p-4 ${
          mode === 'buy'
            ? 'border-gold-200 bg-gold-50/60 dark:border-gold-500/20 dark:bg-gold-900/10'
            : 'border-navy-200 bg-navy-50/60 dark:border-navy-700/40 dark:bg-navy-900/10'
        }`}>
          {result ? (
            <>
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-medium text-ink-400 dark:text-zinc-500">
                  {mode === 'buy' ? t('you_pay') : t('you_receive')}
                </span>
                <div className="flex items-center gap-1.5">
                  <Flag code="ca" size="sm" />
                  <span className="text-xl font-black tabular-nums text-ink-900 dark:text-white">
                    {result.cadAmount.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className="text-sm font-medium text-ink-400 dark:text-zinc-500">CAD</span>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between border-t border-ink-100 pt-2 dark:border-dark-border">
                <span className="text-[11px] text-ink-400 dark:text-zinc-500">
                  {mode === 'buy' ? t('we_sell_at') : t('we_buy_at')}
                </span>
                <span className="text-[11px] font-semibold tabular-nums text-ink-600 dark:text-zinc-300">
                  1 {foreignCode} = {result.rate.toFixed(4)} CAD
                </span>
              </div>
            </>
          ) : (
            <p className="text-center text-sm text-ink-400 dark:text-zinc-500">—</p>
          )}
        </div>
      </div>
    </div>
  );
}
