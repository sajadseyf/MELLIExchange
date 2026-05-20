'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  TrashIcon, PlusIcon, CheckIcon, XMarkIcon,
  PhoneIcon, EyeSlashIcon, EyeIcon, ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { Badge, Button, Card, Flag, Input } from '@melli/ui';
import type { Currency } from '@melli/types';
import { api, ApiError } from '@/lib/api';

// ── Free sources we always fetch ──────────────────────────────────────────────

const FREE_SOURCES: { key: string; label: string }[] = [
  { key: 'vanex_scrape',   label: 'VanEx' },
  { key: 'vbce_scrape',    label: 'VBCE' },
  { key: 'arzsina_scrape', label: 'ArzSina' },
  { key: 'daniel_scrape',  label: 'Daniel' },
  { key: 'bank_of_canada', label: 'BoC' },
  { key: 'frankfurter',    label: 'Frankfurter' },
  { key: 'open_er_api',    label: 'open.er-api' },
];

type SourceRate = { buy: number; sell: number } | null;
type PreviewData = {
  sources: string[];
  rates: Record<string, Record<string, SourceRate>>;
};

type Draft = { code: string; name: string; symbol: string; flag: string; buy: string; sell: string; order: string };
const emptyDraft: Draft = { code: '', name: '', symbol: '', flag: '', buy: '', sell: '', order: '' };
function fromCurrency(c: Currency): Draft {
  return { code: c.code, name: c.name, symbol: c.symbol, flag: c.flag, buy: String(c.buy), sell: String(c.sell), order: String(c.order) };
}

export function CurrenciesPanel() {
  const [items, setItems]                       = useState<Currency[]>([]);
  const [preview, setPreview]                   = useState<PreviewData | null>(null);
  const [previewLoading, setPreviewLoading]     = useState(false);
  const [creating, setCreating]                 = useState(false);
  const [draft, setDraft]                       = useState<Draft>(emptyDraft);
  const [editingCode, setEditingCode]           = useState<string | null>(null);
  const [editDraft, setEditDraft]               = useState<Draft>(emptyDraft);
  const [inlineEdit, setInlineEdit]             = useState<{ code: string; field: 'buy' | 'sell'; value: string } | null>(null);
  const [error, setError]                       = useState<string | null>(null);

  const reload = useCallback(async () => {
    const data = await api<Currency[]>('/api/currencies');
    setItems(data);
  }, []);

  useEffect(() => {
    reload().catch((e) => setError(e instanceof ApiError ? e.message : 'Failed to load'));
  }, [reload]);

  // Auto-fetch preview on mount
  const fetchPreview = useCallback(async () => {
    setPreviewLoading(true);
    try {
      const data = await api<PreviewData>('/api/settings/preview');
      setPreview(data);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Preview fetch failed');
    } finally {
      setPreviewLoading(false);
    }
  }, []);

  useEffect(() => { fetchPreview(); }, [fetchPreview]);

  async function applyField(code: string, field: 'buy' | 'sell', value: number) {
    await api(`/api/currencies/${code}`, { method: 'PUT', body: JSON.stringify({ [field]: value }) });
    await reload();
  }

  async function toggle(code: string, field: 'contactUs' | 'hidden', current: boolean) {
    await api(`/api/currencies/${code}`, { method: 'PUT', body: JSON.stringify({ [field]: !current }) });
    await reload();
  }

  async function remove(code: string) {
    if (!confirm(`Delete ${code}?`)) return;
    await api(`/api/currencies/${code}`, { method: 'DELETE' });
    await reload();
  }

  async function saveEdit() {
    if (!editingCode) return;
    try {
      await api(`/api/currencies/${editingCode}`, {
        method: 'PUT',
        body: JSON.stringify({ name: editDraft.name, symbol: editDraft.symbol, flag: editDraft.flag, buy: Number(editDraft.buy), sell: Number(editDraft.sell), order: Number(editDraft.order || 0) }),
      });
      setEditingCode(null);
      await reload();
    } catch (e) { setError(e instanceof ApiError ? e.message : 'Save failed'); }
  }

  async function saveInline() {
    if (!inlineEdit) return;
    const { code, field, value } = inlineEdit;
    const num = parseFloat(value);
    if (!isNaN(num) && num > 0) {
      const cur = items.find(c => c.code === code);
      if (cur) {
        await api(`/api/currencies/${code}`, {
          method: 'PUT',
          body: JSON.stringify({ [field]: num }),
        });
        await reload();
      }
    }
    setInlineEdit(null);
  }

  async function createNew() {
    try {
      await api('/api/currencies', {
        method: 'POST',
        body: JSON.stringify({ code: draft.code.toUpperCase(), name: draft.name, symbol: draft.symbol, flag: draft.flag, buy: Number(draft.buy), sell: Number(draft.sell), order: Number(draft.order || 0) }),
      });
      setCreating(false);
      setDraft(emptyDraft);
      await reload();
    } catch (e) { setError(e instanceof ApiError ? e.message : 'Create failed'); }
  }

  // Sources to show as columns (only those that actually returned data)
  const activeSources = FREE_SOURCES.filter((s) =>
    !preview || preview.sources.includes(s.key),
  );

  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-100 px-6 py-4">
        <div>
          <h2 className="font-serif text-xl text-ink-900">Currencies</h2>
          <p className="text-sm text-ink-500">
            {items.length} listed
            {previewLoading && <span className="ml-2 text-amber-600">· fetching live rates…</span>}
            {preview && !previewLoading && <span className="ml-2 text-emerald-600">· live rates loaded</span>}
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={fetchPreview} disabled={previewLoading}>
            <ArrowPathIcon className={`h-4 w-4 ${previewLoading ? 'animate-spin' : ''}`} />
            Refresh rates
          </Button>
          <Button size="sm" onClick={() => { setCreating(true); setDraft(emptyDraft); }}>
            <PlusIcon className="h-4 w-4" /> Add
          </Button>
        </div>
      </div>

      {error && (
        <div className="border-b border-ink-100 bg-red-50 px-6 py-3 text-sm text-red-700">{error}</div>
      )}

      {/* Big comparison table — horizontal scroll */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-ink-50/70 text-left text-xs uppercase tracking-wider text-ink-500">
            <tr>
              {/* Currency info */}
              <th className="sticky left-0 z-10 bg-ink-50/90 px-4 py-3 backdrop-blur">Currency</th>
              {/* Current live price (what's on site right now) */}
              <th className="px-4 py-3 text-right">Current Buy</th>
              <th className="px-4 py-3 text-right">Current Sell</th>
              {/* One pair of columns per source */}
              {activeSources.map((s) => (
                <th key={s.key} colSpan={2} className="border-l border-ink-200 px-4 py-3 text-center">
                  {s.label}
                  {previewLoading && <span className="ml-1 inline-block h-2 w-2 animate-pulse rounded-full bg-amber-400" />}
                </th>
              ))}
              {/* Actions */}
              <th className="px-4 py-3 text-center">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
            {/* Sub-header: Buy / Sell labels under each source */}
            <tr className="border-t border-ink-100">
              <th className="sticky left-0 z-10 bg-ink-50/90 backdrop-blur" />
              <th className="px-4 py-1 text-right text-ink-400 font-normal normal-case tracking-normal">buy</th>
              <th className="px-4 py-1 text-right text-ink-400 font-normal normal-case tracking-normal">sell</th>
              {activeSources.map((s) => (
                <>
                  <th key={`${s.key}-buy`} className="border-l border-ink-200 px-4 py-1 text-right text-ink-400 font-normal normal-case tracking-normal">buy</th>
                  <th key={`${s.key}-sell`} className="px-4 py-1 text-right text-ink-400 font-normal normal-case tracking-normal">sell</th>
                </>
              ))}
              <th /><th />
            </tr>
          </thead>
          <tbody>
            {/* Add-new row */}
            {creating && (
              <tr className="border-t border-ink-100 bg-amber-50/60">
                <td className="sticky left-0 z-10 bg-amber-50 px-4 py-2">
                  <Input value={draft.code} onChange={(e) => setDraft({ ...draft, code: e.target.value })} placeholder="USD" className="w-20" />
                </td>
                <td className="px-4 py-2">
                  <Input type="number" step="0.0001" value={draft.buy} onChange={(e) => setDraft({ ...draft, buy: e.target.value })} className="w-24 text-right" />
                </td>
                <td className="px-4 py-2">
                  <Input type="number" step="0.0001" value={draft.sell} onChange={(e) => setDraft({ ...draft, sell: e.target.value })} className="w-24 text-right" />
                </td>
                {activeSources.map((s) => <><td key={`${s.key}-b`} /><td key={`${s.key}-s`} /></>)}
                <td />
                <td className="px-4 py-2 text-right">
                  <div className="flex justify-end gap-1">
                    <Button size="sm" onClick={createNew}><CheckIcon className="h-4 w-4" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => setCreating(false)}><XMarkIcon className="h-4 w-4" /></Button>
                  </div>
                </td>
              </tr>
            )}

            {items.map((c) => {
              const isEditing = editingCode === c.code;
              const sourceRates = preview?.rates[c.code] ?? {};

              // Best buy = highest across sources, best sell = lowest — evaluated independently
              const EPS = 0.00005;
              const allBuys  = activeSources.map(s => sourceRates[s.key]?.buy  ?? 0).filter(v => v > 0);
              const allSells = activeSources.map(s => sourceRates[s.key]?.sell ?? 0).filter(v => v > 0);
              const maxBuy  = allBuys.length  ? Math.max(...allBuys)  : 0;
              const minSell = allSells.length ? Math.min(...allSells) : 0;

              return (
                <tr key={c.code} className={`border-t border-ink-100 transition-colors hover:bg-ink-50/40 ${c.hidden ? 'opacity-40' : ''}`}>
                  {/* Currency info */}
                  <td className="sticky left-0 z-10 bg-white px-4 py-3 align-middle">
                    <div className="flex items-center gap-2">
                      <Flag code={c.flag} size="sm" />
                      <div>
                        <Badge tone="gold">{c.code}</Badge>
                        <p className="text-xs text-ink-500 mt-0.5 truncate max-w-[100px]">{c.name}</p>
                      </div>
                    </div>
                  </td>

                  {/* Current prices — click to edit inline */}
                  {(['buy', 'sell'] as const).map((field) => {
                    const isInline = inlineEdit?.code === c.code && inlineEdit?.field === field;
                    const val = c[field];
                    const cls = field === 'buy' ? 'text-ink-900' : 'text-amber-700';
                    return (
                      <td key={field} className={`px-4 py-3 text-right align-middle tabular-nums font-semibold ${cls}`}>
                        {c.contactUs ? (
                          <span className="text-xs text-blue-600">تماس</span>
                        ) : isInline ? (
                          <input
                            type="number"
                            step="0.0001"
                            autoFocus
                            value={inlineEdit.value}
                            onChange={(e) => setInlineEdit({ ...inlineEdit, value: e.target.value })}
                            onBlur={saveInline}
                            onKeyDown={(e) => { if (e.key === 'Enter') saveInline(); if (e.key === 'Escape') setInlineEdit(null); }}
                            className="w-24 rounded border border-gold-400 px-1 py-0.5 text-right text-sm outline-none"
                          />
                        ) : (
                          <span
                            className="cursor-pointer rounded px-1 hover:bg-gold-50 hover:text-gold-700 transition-colors"
                            title="Click to edit"
                            onClick={() => setInlineEdit({ code: c.code, field, value: String(val) })}
                          >
                            {val.toFixed(4)}
                          </span>
                        )}
                      </td>
                    );
                  })}

                  {/* One pair of columns per source */}
                  {activeSources.map((s) => {
                    const r = sourceRates[s.key];
                    const isCurrent =
                      r && !c.contactUs &&
                      Math.abs(r.buy - c.buy) < 0.0001 &&
                      Math.abs(r.sell - c.sell) < 0.0001;
                    const buyIsBest  = !!r && maxBuy  > 0 && Math.abs(r.buy  - maxBuy)  < EPS;
                    const sellIsBest = !!r && minSell > 0 && Math.abs(r.sell - minSell) < EPS;

                    return (
                      <>
                        <td key={`${s.key}-buy`} className="border-l border-ink-100 px-3 py-3 text-right align-middle tabular-nums">
                          {previewLoading ? (
                            <span className="inline-block h-3 w-12 animate-pulse rounded bg-ink-200" />
                          ) : r ? (
                            <button
                              onClick={() => applyField(c.code, 'buy', r.buy)}
                              className={`rounded px-2 py-0.5 text-xs font-semibold transition-colors ${
                                buyIsBest ? 'text-emerald-700' : 'text-red-500'
                              } cursor-pointer hover:bg-ink-100`}
                              title={`Set buy → ${r.buy.toFixed(4)}`}
                            >
                              {r.buy.toFixed(4)}
                            </button>
                          ) : (
                            <span className="text-xs text-ink-300">—</span>
                          )}
                        </td>
                        <td key={`${s.key}-sell`} className="px-3 py-3 text-right align-middle tabular-nums">
                          {previewLoading ? (
                            <span className="inline-block h-3 w-12 animate-pulse rounded bg-ink-200" />
                          ) : r ? (
                            <button
                              onClick={() => applyField(c.code, 'sell', r.sell)}
                              className={`rounded px-2 py-0.5 text-xs font-semibold transition-colors ${
                                sellIsBest ? 'text-emerald-700' : 'text-red-500'
                              } cursor-pointer hover:bg-ink-100`}
                              title={`Set sell → ${r.sell.toFixed(4)}`}
                            >
                              {r.sell.toFixed(4)}
                            </button>
                          ) : (
                            <span className="text-xs text-ink-300">—</span>
                          )}
                        </td>
                      </>
                    );
                  })}

                  {/* Status toggles */}
                  <td className="px-4 py-3 text-center align-middle">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => toggle(c.code, 'contactUs', c.contactUs)}
                        title={c.contactUs ? 'Contact Us ON — click to disable' : 'Show price (click to set Contact Us)'}
                        className={`rounded p-1.5 transition-colors ${c.contactUs ? 'bg-blue-100 text-blue-600' : 'text-ink-300 hover:text-ink-600'}`}
                      >
                        <PhoneIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => toggle(c.code, 'hidden', c.hidden)}
                        title={c.hidden ? 'Hidden — click to show' : 'Visible — click to hide'}
                        className={`rounded p-1.5 transition-colors ${c.hidden ? 'bg-ink-200 text-ink-500' : 'text-ink-300 hover:text-ink-600'}`}
                      >
                        {c.hidden ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                      </button>
                    </div>
                  </td>

                  {/* Edit / Delete */}
                  <td className="px-4 py-3 text-right align-middle">
                    {isEditing ? (
                      <div className="flex justify-end gap-1">
                        <Button size="sm" onClick={saveEdit}><CheckIcon className="h-4 w-4" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingCode(null)}><XMarkIcon className="h-4 w-4" /></Button>
                      </div>
                    ) : (
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => { setEditingCode(c.code); setEditDraft(fromCurrency(c)); }}
                          className="rounded p-1.5 text-ink-400 hover:text-ink-700"
                          title="Edit name / flag / order"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13l6.5-6.5a2 2 0 012.828 2.828L11.828 15.828a2 2 0 01-.707.464l-3.464 1.155 1.155-3.464A2 2 0 019 13z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => remove(c.code)}
                          className="rounded p-1.5 text-ink-300 hover:text-red-600"
                          title="Delete currency"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="border-t border-ink-100 px-6 py-3 text-xs text-ink-400">
        Click any price to apply it. Green buy = highest (best for customer selling). Green sell = lowest (best for customer buying). Underline = currently active.
        <span className="ml-3"><PhoneIcon className="inline h-3 w-3 text-blue-500" /> = show "تماس بگیرید" instead of price.</span>
        <span className="ml-3"><EyeSlashIcon className="inline h-3 w-3 text-ink-500" /> = hide from public site.</span>
      </div>
    </Card>
  );
}
