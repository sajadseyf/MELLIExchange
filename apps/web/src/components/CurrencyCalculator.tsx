'use client';

import { useState, useMemo } from 'react';
import { ArrowsUpDownIcon } from '@heroicons/react/24/solid';
import { useTranslations } from 'next-intl';
import { Flag } from '@melli/ui';
import type { Currency } from '@melli/types';

interface Props {
  currencies: Currency[];
}

export function CurrencyCalculator({ currencies }: Props) {
  const t = useTranslations('calculator');
  const [amount, setAmount] = useState('100');
  const [fromCode, setFromCode] = useState('CAD');
  const [toCode, setToCode] = useState('USD');
  const [direction, setDirection] = useState<'buy' | 'sell'>('sell');

  const flagMap = useMemo(() => {
    const m: Record<string, string> = { CAD: 'ca' };
    currencies.forEach((c) => { m[c.code] = c.flag; });
    return m;
  }, [currencies]);

  const result = useMemo(() => {
    const num = parseFloat(amount);
    if (!num || num <= 0) return null;

    if (fromCode === 'CAD') {
      const target = currencies.find((c) => c.code === toCode);
      if (!target) return null;
      const rate = direction === 'sell' ? target.sell : target.buy;
      if (!rate) return null;
      return { value: num / rate, label: `1 ${toCode} = ${rate.toFixed(4)} CAD` };
    }

    if (toCode === 'CAD') {
      const source = currencies.find((c) => c.code === fromCode);
      if (!source) return null;
      const rate = direction === 'buy' ? source.buy : source.sell;
      if (!rate) return null;
      return { value: num * rate, label: `1 ${fromCode} = ${rate.toFixed(4)} CAD` };
    }

    const source = currencies.find((c) => c.code === fromCode);
    const target = currencies.find((c) => c.code === toCode);
    if (!source || !target) return null;
    const cadAmount = num * source.buy;
    return { value: cadAmount / target.sell, label: t('sub') };
  }, [amount, fromCode, toCode, direction, currencies, t]);

  function swap() {
    setFromCode(toCode);
    setToCode(fromCode);
    setDirection((d) => (d === 'buy' ? 'sell' : 'buy'));
  }

  const allCodes = ['CAD', ...currencies.map((c) => c.code)];

  const selectClass =
    'h-11 w-[100px] appearance-none rounded-lg border border-ink-200 bg-white pl-9 pr-7 text-sm font-medium text-ink-900 focus:outline-none focus:ring-2 focus:ring-gold-400 dark:border-dark-border dark:bg-dark-raised dark:text-white';

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-navy-100 px-5 py-3.5 dark:border-dark-border">
        <h3 className="text-base font-semibold text-ink-900 dark:text-white">{t('title')}</h3>
        <p className="text-[11px] text-ink-400 dark:text-zinc-500">{t('sub')}</p>
      </div>

      <div className="flex flex-1 flex-col justify-center gap-3 p-4">
        <div className="space-y-1.5">
          <label className="text-[11px] font-medium uppercase tracking-wider text-ink-400 dark:text-zinc-500">{t('i_have')}</label>
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
                <Flag code={flagMap[fromCode] ?? ''} size="sm" />
              </div>
              <select value={fromCode} onChange={(e) => setFromCode(e.target.value)} className={selectClass}>
                {allCodes.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-ink-400 dark:text-zinc-500">
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-center">
          <button onClick={swap} className="flex h-9 w-9 items-center justify-center rounded-full border border-ink-200 bg-white text-ink-400 transition-all hover:bg-gold-50 hover:text-gold-600 hover:border-gold-300 active:scale-95 dark:border-dark-border dark:bg-dark-raised dark:text-zinc-400 dark:hover:bg-dark-muted dark:hover:text-gold-400" aria-label="Swap">
            <ArrowsUpDownIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-medium uppercase tracking-wider text-ink-400 dark:text-zinc-500">{t('i_get')}</label>
          <div className="flex gap-2">
            <div className="flex h-11 flex-1 items-center rounded-lg border border-navy-100 bg-white/70 px-3 text-base tabular-nums font-semibold text-ink-900 dark:border-dark-border dark:bg-dark-raised dark:text-white">
              {result ? result.value.toFixed(2) : '—'}
            </div>
            <div className="relative">
              <div className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2">
                <Flag code={flagMap[toCode] ?? ''} size="sm" />
              </div>
              <select value={toCode} onChange={(e) => setToCode(e.target.value)} className={selectClass}>
                {allCodes.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-ink-400 dark:text-zinc-500">
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
          </div>
        </div>

        {result && (
          <div className="rounded-lg bg-gold-50/70 px-3 py-2 text-center text-xs font-medium text-ink-600 dark:bg-gold-900/20 dark:text-gold-400">
            {result.label}
          </div>
        )}
      </div>
    </div>
  );
}
