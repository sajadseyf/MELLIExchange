'use client';

import { useState, useMemo } from 'react';
import { ArrowsUpDownIcon } from '@heroicons/react/24/solid';
import { Card, Flag } from '@melli/ui';
import type { Currency } from '@melli/types';

interface Props {
  currencies: Currency[];
}

export function CurrencyCalculator({ currencies }: Props) {
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
      return { value: num / rate, rate, label: `1 ${toCode} = ${rate.toFixed(4)} CAD` };
    }

    if (toCode === 'CAD') {
      const source = currencies.find((c) => c.code === fromCode);
      if (!source) return null;
      const rate = direction === 'buy' ? source.buy : source.sell;
      if (!rate) return null;
      return { value: num * rate, rate, label: `1 ${fromCode} = ${rate.toFixed(4)} CAD` };
    }

    const source = currencies.find((c) => c.code === fromCode);
    const target = currencies.find((c) => c.code === toCode);
    if (!source || !target) return null;
    const cadAmount = num * source.buy;
    const finalAmount = cadAmount / target.sell;
    return { value: finalAmount, rate: source.buy / target.sell, label: `Via CAD` };
  }, [amount, fromCode, toCode, direction, currencies]);

  function swap() {
    setFromCode(toCode);
    setToCode(fromCode);
    setDirection((d) => (d === 'buy' ? 'sell' : 'buy'));
  }

  const allCodes = ['CAD', ...currencies.map((c) => c.code)];

  return (
    <Card className="overflow-hidden">
      <div className="bg-navy-900 px-5 py-3.5">
        <h3 className="font-serif text-base text-white">Currency Calculator</h3>
        <p className="text-[11px] text-navy-200">Indicative rates — confirmed at counter</p>
      </div>

      <div className="flex flex-col gap-3 p-4">
        {/* I have */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-medium uppercase tracking-wider text-ink-400">I have</label>
          <div className="flex gap-2">
            <input
              type="number"
              min="0"
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="block h-11 w-full min-w-0 flex-1 rounded-lg border border-ink-200 bg-white px-3 text-base tabular-nums text-ink-900 focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent"
            />
            <div className="relative">
              <div className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2">
                <Flag code={flagMap[fromCode] ?? ''} size="sm" />
              </div>
              <select
                value={fromCode}
                onChange={(e) => setFromCode(e.target.value)}
                className="h-11 w-[100px] appearance-none rounded-lg border border-ink-200 bg-white pl-9 pr-7 text-sm font-medium text-ink-900 focus:outline-none focus:ring-2 focus:ring-gold-400"
              >
                {allCodes.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-ink-400">
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
          </div>
        </div>

        {/* Swap */}
        <div className="flex justify-center">
          <button
            onClick={swap}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-ink-200 bg-white text-ink-400 transition-all hover:bg-gold-50 hover:text-gold-600 hover:border-gold-300 active:scale-95"
            aria-label="Swap currencies"
          >
            <ArrowsUpDownIcon className="h-4 w-4" />
          </button>
        </div>

        {/* I get */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-medium uppercase tracking-wider text-ink-400">I get</label>
          <div className="flex gap-2">
            <div className="flex h-11 flex-1 items-center rounded-lg border border-ink-100 bg-ink-50 px-3 text-base tabular-nums font-semibold text-ink-900">
              {result ? result.value.toFixed(2) : '—'}
            </div>
            <div className="relative">
              <div className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2">
                <Flag code={flagMap[toCode] ?? ''} size="sm" />
              </div>
              <select
                value={toCode}
                onChange={(e) => setToCode(e.target.value)}
                className="h-11 w-[100px] appearance-none rounded-lg border border-ink-200 bg-white pl-9 pr-7 text-sm font-medium text-ink-900 focus:outline-none focus:ring-2 focus:ring-gold-400"
              >
                {allCodes.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-ink-400">
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
          </div>
        </div>

        {/* Rate */}
        {result && (
          <div className="rounded-lg bg-gold-50/70 px-3 py-2 text-center text-xs font-medium text-ink-600">
            {result.label}
          </div>
        )}
      </div>
    </Card>
  );
}
