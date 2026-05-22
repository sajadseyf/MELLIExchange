'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { Card, Button } from '@melli/ui';
import { api, ApiError } from '@/lib/api';

interface RateMap { [code: string]: { buy: number; sell: number } }
interface SourceData { rates: RateMap; recordedAt: string | null }
interface CompetitorData {
  own:      SourceData;
  vanex:    SourceData;
  arzsina:  SourceData;
  vbce:     SourceData;
  daniel:   SourceData;
  moneyway: SourceData;
}

const SOURCES = ['own', 'vanex', 'arzsina', 'vbce', 'daniel', 'moneyway'] as const;
const SOURCE_LABELS: Record<string, string> = { own: 'My Rate', vanex: 'Vanex', arzsina: 'ArzSina', vbce: 'VBCE', daniel: 'Daniel', moneyway: 'MoneyWay' };

// Most-used currencies in Canada, in order
const PRIORITY = ['USD', 'EUR', 'GBP', 'AUD', 'CHF', 'JPY', 'AED', 'HKD', 'CNY', 'INR', 'MXN', 'TRY', 'SEK', 'KRW', 'PHP'];

const CURRENCY_INFO: Record<string, { flag: string; name: string }> = {
  USD: { flag: 'us', name: 'US Dollar' },
  EUR: { flag: 'eu', name: 'Euro' },
  GBP: { flag: 'gb', name: 'British Pound' },
  AUD: { flag: 'au', name: 'Australian Dollar' },
  CHF: { flag: 'ch', name: 'Swiss Franc' },
  JPY: { flag: 'jp', name: 'Japanese Yen' },
  AED: { flag: 'ae', name: 'UAE Dirham' },
  HKD: { flag: 'hk', name: 'Hong Kong Dollar' },
  CNY: { flag: 'cn', name: 'Chinese Yuan' },
  INR: { flag: 'in', name: 'Indian Rupee' },
  MXN: { flag: 'mx', name: 'Mexican Peso' },
  TRY: { flag: 'tr', name: 'Turkish Lira' },
  SEK: { flag: 'se', name: 'Swedish Krona' },
  KRW: { flag: 'kr', name: 'S. Korean Won' },
  PHP: { flag: 'ph', name: 'Philippine Peso' },
  CAD: { flag: 'ca', name: 'Canadian Dollar' },
  NZD: { flag: 'nz', name: 'New Zealand Dollar' },
  SGD: { flag: 'sg', name: 'Singapore Dollar' },
  NOK: { flag: 'no', name: 'Norwegian Krone' },
  DKK: { flag: 'dk', name: 'Danish Krone' },
  IRR: { flag: 'ir', name: 'Iranian Rial' },
  SAR: { flag: 'sa', name: 'Saudi Riyal' },
  QAR: { flag: 'qa', name: 'Qatari Riyal' },
  YEN: { flag: 'jp', name: 'Japanese Yen' },
};

function priorityIndex(code: string) {
  const i = PRIORITY.indexOf(code);
  return i === -1 ? PRIORITY.length : i;
}

function fmt(v: number | undefined) {
  if (!v) return '—';
  return v.toFixed(4);
}

type SortKey = 'priority' | string;

export function CompetitorRatesTable() {
  const [data,       setData]       = useState<CompetitorData | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [filter,     setFilter]     = useState('');
  const [sortKey,    setSortKey]    = useState<SortKey>('priority');
  const [sortAsc,    setSortAsc]    = useState(true);
  const [inlineEdit, setInlineEdit] = useState<{ code: string; field: 'buy' | 'sell'; value: string } | null>(null);
  const inlineSaving = useRef(false);

  async function load() {
    try {
      const d = await api<CompetitorData>('/api/competitor/latest');
      setData(d);
      setError(null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  async function refresh() {
    setRefreshing(true);
    try {
      await api('/api/competitor/refresh', { method: 'POST', body: '{}' });
      setTimeout(load, 5000);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Refresh failed');
    } finally {
      setRefreshing(false);
    }
  }

  async function saveInline() {
    if (!inlineEdit || inlineSaving.current) return;
    const { code, field, value } = inlineEdit;
    const num = parseFloat(value);
    setInlineEdit(null);
    if (!isNaN(num) && num > 0) {
      inlineSaving.current = true;
      try {
        await api(`/api/currencies/${code}`, { method: 'PUT', body: JSON.stringify({ [field]: num }) });
        await load();
      } finally {
        inlineSaving.current = false;
      }
    }
  }

  useEffect(() => { load(); }, []);

  const allCodes = useMemo(() => {
    if (!data) return [];
    const codes = new Set<string>([
      ...Object.keys(data.own.rates),
      ...Object.keys(data.vanex.rates),
      ...Object.keys(data.arzsina.rates),
      ...Object.keys(data.vbce.rates),
      ...Object.keys(data.daniel.rates),
      ...Object.keys(data.moneyway.rates),
    ]);
    return [...codes];
  }, [data]);

  const rows = useMemo(() => {
    if (!data) return [];
    let codes = allCodes;
    if (filter) codes = codes.filter((c) => c.includes(filter.toUpperCase()));

    return codes.map((code) => {
      const own      = data.own.rates[code];
      const vanex    = data.vanex.rates[code];
      const arzsina  = data.arzsina.rates[code];
      const vbce     = data.vbce.rates[code];
      const daniel   = data.daniel.rates[code];
      const moneyway = data.moneyway.rates[code];

      const buyValues  = [own?.buy,  vanex?.buy,  arzsina?.buy,  vbce?.buy,  daniel?.buy,  moneyway?.buy ].filter((v): v is number => !!v && v > 0);
      const sellValues = [own?.sell, vanex?.sell, arzsina?.sell, vbce?.sell, daniel?.sell, moneyway?.sell].filter((v): v is number => !!v && v > 0);

      const maxBuy  = buyValues.length  ? Math.max(...buyValues)  : 0;
      const minSell = sellValues.length ? Math.min(...sellValues) : 0;

      const EPS = 0.00001;
      const buyClass  = (v?: number) => !v || v <= 0 ? '' : Math.abs(v - maxBuy)  < EPS ? 'text-emerald-600 font-semibold' : 'text-red-500';
      const sellClass = (v?: number) => !v || v <= 0 ? '' : Math.abs(v - minSell) < EPS ? 'text-emerald-600 font-semibold' : 'text-red-500';

      const ownBuyIsBest  = !!own?.buy  && own.buy  > 0 && Math.abs(own.buy  - maxBuy)  < EPS;
      const ownSellIsBest = !!own?.sell && own.sell > 0 && Math.abs(own.sell - minSell) < EPS;

      const competitorBuys  = [vanex?.buy,  arzsina?.buy,  vbce?.buy,  daniel?.buy,  moneyway?.buy ].filter((v): v is number => !!v);
      const competitorSells = [vanex?.sell, arzsina?.sell, vbce?.sell, daniel?.sell, moneyway?.sell].filter((v): v is number => !!v);
      const targetBuy  = competitorBuys.length  ? Math.max(...competitorBuys)  : null;
      const targetSell = competitorSells.length ? Math.min(...competitorSells) : null;

      return { code, own, vanex, arzsina, vbce, daniel, moneyway, buyClass, sellClass, ownBuyIsBest, ownSellIsBest, targetBuy, targetSell };
    }).sort((a, b) => {
      let va: number | string = 0;
      let vb: number | string = 0;

      if (sortKey === 'priority') {
        va = priorityIndex(a.code);
        vb = priorityIndex(b.code);
        if (va === vb) return a.code.localeCompare(b.code);
        return sortAsc ? (va as number) - (vb as number) : (vb as number) - (va as number);
      }

      const [src, side] = sortKey.split('_') as ['own' | 'vanex' | 'arzsina' | 'vbce' | 'daniel' | 'moneyway', 'buy' | 'sell'];
      va = a[src]?.[side] ?? 0;
      vb = b[src]?.[side] ?? 0;
      return sortAsc ? (va < vb ? -1 : va > vb ? 1 : 0) : (va > vb ? -1 : va < vb ? 1 : 0);
    });
  }, [data, allCodes, filter, sortKey, sortAsc]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(true); }
  }

  const thCls = (key: SortKey) =>
    `cursor-pointer select-none px-3 py-2 text-right text-xs font-medium uppercase tracking-wide text-ink-500 hover:text-ink-800 ${sortKey === key ? 'text-gold-600' : ''}`;

  const updatedAt = data?.vanex?.recordedAt
    ? new Date(data.vanex.recordedAt).toLocaleTimeString('en-CA', { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter currency…"
          className="rounded-lg border border-ink-200 bg-white px-3 py-1.5 text-sm outline-none focus:border-gold-400"
        />
        <Button size="sm" variant="ghost" onClick={refresh} disabled={refreshing}>
          {refreshing ? 'Refreshing…' : '↻ Refresh now'}
        </Button>
        {updatedAt && <span className="text-xs text-ink-400">Last updated: {updatedAt}</span>}
      </div>

      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}

      {loading ? (
        <div className="flex h-40 items-center justify-center text-sm text-ink-400">Loading…</div>
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-ink-100 bg-ink-50">
              <tr>
                <th
                  className="sticky left-0 bg-ink-50 px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-ink-500 cursor-pointer min-w-[160px]"
                  onClick={() => toggleSort('priority')}
                >
                  Currency {sortKey === 'priority' ? (sortAsc ? '↑' : '↓') : ''}
                </th>
                {SOURCES.map((src) => (
                  <th key={src} colSpan={2} className="border-l border-ink-100 px-3 py-2 text-center text-xs font-medium uppercase tracking-wide text-ink-500">
                    {SOURCE_LABELS[src]}
                  </th>
                ))}
                <th colSpan={2} className="border-l border-ink-100 px-3 py-2 text-center text-xs font-medium uppercase tracking-wide text-amber-600">
                  My Target
                </th>
              </tr>
              <tr className="border-b border-ink-100">
                <th className="sticky left-0 bg-ink-50 px-3 py-1" />
                {SOURCES.map((src) => (
                  <>
                    <th key={`${src}_buy`}  className={thCls(`${src}_buy`)}  onClick={() => toggleSort(`${src}_buy`)}>Buy {sortKey === `${src}_buy`  ? (sortAsc ? '↑' : '↓') : ''}</th>
                    <th key={`${src}_sell`} className={thCls(`${src}_sell`)} onClick={() => toggleSort(`${src}_sell`)}>Sell {sortKey === `${src}_sell` ? (sortAsc ? '↑' : '↓') : ''}</th>
                  </>
                ))}
                <th className="px-3 py-1 text-right text-xs font-medium text-amber-600">Buy ≥</th>
                <th className="px-3 py-1 text-right text-xs font-medium text-amber-600">Sell ≤</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-50">
              {rows.map(({ code, own, vanex, arzsina, vbce, daniel, moneyway, buyClass, sellClass, ownBuyIsBest, ownSellIsBest, targetBuy, targetSell }) => {
                const info = CURRENCY_INFO[code];
                return (
                  <tr key={code} className="hover:bg-gold-50/30">
                    <td className="sticky left-0 bg-white px-3 py-2">
                      <div className="flex items-center gap-2">
                        {info ? (
                          <span className={`fi fi-${info.flag} rounded-sm`} style={{ width: 20, height: 15, display: 'inline-block', flexShrink: 0 }} />
                        ) : (
                          <span className="inline-block h-[15px] w-[20px] rounded-sm bg-ink-200 flex-shrink-0" />
                        )}
                        <div>
                          <span className="font-mono font-semibold text-ink-800">{code}</span>
                          {info && <p className="text-[10px] text-ink-400 leading-tight">{info.name}</p>}
                        </div>
                      </div>
                    </td>
                    {/* Own — click to edit inline */}
                    {(['buy', 'sell'] as const).map((field) => {
                      const val = own?.[field];
                      const cls = field === 'buy' ? buyClass(val) : sellClass(val);
                      const notBest = field === 'buy' ? !ownBuyIsBest : !ownSellIsBest;
                      const isInline = inlineEdit?.code === code && inlineEdit?.field === field;
                      return (
                        <td key={field} className={`${field === 'buy' ? 'border-l border-ink-50' : ''} px-3 py-2 text-right font-mono ${cls}`}>
                          {isInline ? (
                            <input
                              type="number"
                              step="0.0001"
                              autoFocus
                              value={inlineEdit.value}
                              onChange={(e) => setInlineEdit({ ...inlineEdit, value: e.target.value })}
                              onBlur={saveInline}
                              onKeyDown={(e) => { if (e.key === 'Enter') saveInline(); if (e.key === 'Escape') setInlineEdit(null); }}
                              className="w-24 rounded border border-gold-400 bg-white px-1 py-0.5 text-right text-xs outline-none"
                            />
                          ) : (
                            <span
                              className="cursor-pointer rounded px-1 hover:bg-gold-50 hover:text-gold-700 transition-colors"
                              title="Click to edit"
                              onClick={() => setInlineEdit({ code, field, value: String(val ?? '') })}
                            >
                              {fmt(val)}{val && notBest ? ' ⚠️' : ''}
                            </span>
                          )}
                        </td>
                      );
                    })}
                    {/* Vanex */}
                    <td className={`border-l border-ink-50 px-3 py-2 text-right font-mono ${buyClass(vanex?.buy)}`}>{fmt(vanex?.buy)}</td>
                    <td className={`px-3 py-2 text-right font-mono ${sellClass(vanex?.sell)}`}>{fmt(vanex?.sell)}</td>
                    {/* ArzSina */}
                    <td className={`border-l border-ink-50 px-3 py-2 text-right font-mono ${buyClass(arzsina?.buy)}`}>{fmt(arzsina?.buy)}</td>
                    <td className={`px-3 py-2 text-right font-mono ${sellClass(arzsina?.sell)}`}>{fmt(arzsina?.sell)}</td>
                    {/* VBCE */}
                    <td className={`border-l border-ink-50 px-3 py-2 text-right font-mono ${buyClass(vbce?.buy)}`}>{fmt(vbce?.buy)}</td>
                    <td className={`px-3 py-2 text-right font-mono ${sellClass(vbce?.sell)}`}>{fmt(vbce?.sell)}</td>
                    {/* Daniel */}
                    <td className={`border-l border-ink-50 px-3 py-2 text-right font-mono ${buyClass(daniel?.buy)}`}>{fmt(daniel?.buy)}</td>
                    <td className={`px-3 py-2 text-right font-mono ${sellClass(daniel?.sell)}`}>{fmt(daniel?.sell)}</td>
                    {/* MoneyWay */}
                    <td className={`border-l border-ink-50 px-3 py-2 text-right font-mono ${buyClass(moneyway?.buy)}`}>{fmt(moneyway?.buy)}</td>
                    <td className={`px-3 py-2 text-right font-mono ${sellClass(moneyway?.sell)}`}>{fmt(moneyway?.sell)}</td>
                    {/* Target */}
                    <td className="border-l border-ink-50 px-3 py-2 text-right font-mono text-amber-600">{fmt(targetBuy ?? undefined)}</td>
                    <td className="px-3 py-2 text-right font-mono text-amber-600">{fmt(targetSell ?? undefined)}</td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr><td colSpan={15} className="py-10 text-center text-sm text-ink-400">No data yet. Click Refresh to scrape rates.</td></tr>
              )}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
