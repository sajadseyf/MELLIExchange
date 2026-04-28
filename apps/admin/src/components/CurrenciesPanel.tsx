'use client';

import { useEffect, useState } from 'react';
import { PencilSquareIcon, TrashIcon, PlusIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Badge, Button, Card, Input } from '@melli/ui';
import type { Currency } from '@melli/types';
import { api, ApiError } from '@/lib/api';

type Draft = {
  code: string;
  name: string;
  symbol: string;
  flag: string;
  buy: string;
  sell: string;
  order: string;
};

const emptyDraft: Draft = { code: '', name: '', symbol: '', flag: '', buy: '', sell: '', order: '' };

function fromCurrency(c: Currency): Draft {
  return {
    code: c.code,
    name: c.name,
    symbol: c.symbol,
    flag: c.flag,
    buy: String(c.buy),
    sell: String(c.sell),
    order: String(c.order),
  };
}

export function CurrenciesPanel() {
  const [items, setItems] = useState<Currency[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    const data = await api<Currency[]>('/api/currencies');
    setItems(data);
  }

  useEffect(() => {
    reload().catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load'));
  }, []);

  function startEdit(c: Currency) {
    setEditing(c.code);
    setDraft(fromCurrency(c));
    setCreating(false);
  }

  function cancelEdit() {
    setEditing(null);
    setCreating(false);
    setDraft(emptyDraft);
  }

  async function saveEdit() {
    if (!editing) return;
    setError(null);
    try {
      await api(`/api/currencies/${editing}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: draft.name,
          symbol: draft.symbol,
          flag: draft.flag,
          buy: Number(draft.buy),
          sell: Number(draft.sell),
          order: Number(draft.order || 0),
        }),
      });
      cancelEdit();
      await reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Save failed');
    }
  }

  async function createNew() {
    setError(null);
    try {
      await api('/api/currencies', {
        method: 'POST',
        body: JSON.stringify({
          code: draft.code.toUpperCase(),
          name: draft.name,
          symbol: draft.symbol,
          flag: draft.flag,
          buy: Number(draft.buy),
          sell: Number(draft.sell),
          order: Number(draft.order || 0),
        }),
      });
      cancelEdit();
      await reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Create failed');
    }
  }

  async function remove(code: string) {
    if (!confirm(`Delete ${code}?`)) return;
    await api(`/api/currencies/${code}`, { method: 'DELETE' });
    await reload();
  }

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-ink-100 px-6 py-4">
        <div>
          <h2 className="font-serif text-xl text-ink-900">Currencies</h2>
          <p className="text-sm text-ink-500">{items.length} listed</p>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setCreating(true);
            setEditing(null);
            setDraft(emptyDraft);
          }}
        >
          <PlusIcon className="h-4 w-4" />
          Add
        </Button>
      </div>

      {error && (
        <div className="border-b border-ink-100 bg-burgundy/5 px-6 py-3 text-sm text-burgundy">
          {error}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-ink-50/60 text-left text-xs uppercase tracking-wider text-ink-500">
            <tr>
              <th className="px-6 py-3">Code</th>
              <th className="px-6 py-3">Name</th>
              <th className="px-6 py-3">Symbol</th>
              <th className="px-6 py-3">Flag</th>
              <th className="px-6 py-3 text-right">Buy</th>
              <th className="px-6 py-3 text-right">Sell</th>
              <th className="px-6 py-3 text-right">Order</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {creating && (
              <tr className="border-t border-ink-100 bg-gold-50/40">
                <td className="px-6 py-3">
                  <Input value={draft.code} onChange={(e) => setDraft({ ...draft, code: e.target.value })} placeholder="USD" />
                </td>
                <td className="px-6 py-3">
                  <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="US Dollar" />
                </td>
                <td className="px-6 py-3">
                  <Input value={draft.symbol} onChange={(e) => setDraft({ ...draft, symbol: e.target.value })} placeholder="$" />
                </td>
                <td className="px-6 py-3">
                  <Input value={draft.flag} onChange={(e) => setDraft({ ...draft, flag: e.target.value })} placeholder="🇺🇸" />
                </td>
                <td className="px-6 py-3">
                  <Input type="number" step="0.0001" value={draft.buy} onChange={(e) => setDraft({ ...draft, buy: e.target.value })} className="text-right" />
                </td>
                <td className="px-6 py-3">
                  <Input type="number" step="0.0001" value={draft.sell} onChange={(e) => setDraft({ ...draft, sell: e.target.value })} className="text-right" />
                </td>
                <td className="px-6 py-3">
                  <Input type="number" value={draft.order} onChange={(e) => setDraft({ ...draft, order: e.target.value })} className="text-right" />
                </td>
                <td className="px-6 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <Button size="sm" onClick={createNew}><CheckIcon className="h-4 w-4" /></Button>
                    <Button size="sm" variant="ghost" onClick={cancelEdit}><XMarkIcon className="h-4 w-4" /></Button>
                  </div>
                </td>
              </tr>
            )}
            {items.map((c) => {
              const isEditing = editing === c.code;
              return (
                <tr key={c.code} className="border-t border-ink-100">
                  <td className="px-6 py-3 font-mono font-semibold text-ink-900">
                    <Badge tone="gold">{c.code}</Badge>
                  </td>
                  <td className="px-6 py-3">
                    {isEditing ? (
                      <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
                    ) : (
                      c.name
                    )}
                  </td>
                  <td className="px-6 py-3">
                    {isEditing ? (
                      <Input value={draft.symbol} onChange={(e) => setDraft({ ...draft, symbol: e.target.value })} />
                    ) : (
                      c.symbol
                    )}
                  </td>
                  <td className="px-6 py-3">
                    {isEditing ? (
                      <Input value={draft.flag} onChange={(e) => setDraft({ ...draft, flag: e.target.value })} />
                    ) : (
                      <span className="text-lg">{c.flag}</span>
                    )}
                  </td>
                  <td className="px-6 py-3 text-right tabular-nums">
                    {isEditing ? (
                      <Input type="number" step="0.0001" value={draft.buy} onChange={(e) => setDraft({ ...draft, buy: e.target.value })} className="text-right" />
                    ) : (
                      c.buy.toFixed(4)
                    )}
                  </td>
                  <td className="px-6 py-3 text-right tabular-nums">
                    {isEditing ? (
                      <Input type="number" step="0.0001" value={draft.sell} onChange={(e) => setDraft({ ...draft, sell: e.target.value })} className="text-right" />
                    ) : (
                      c.sell.toFixed(4)
                    )}
                  </td>
                  <td className="px-6 py-3 text-right tabular-nums">
                    {isEditing ? (
                      <Input type="number" value={draft.order} onChange={(e) => setDraft({ ...draft, order: e.target.value })} className="text-right" />
                    ) : (
                      c.order
                    )}
                  </td>
                  <td className="px-6 py-3 text-right">
                    {isEditing ? (
                      <div className="flex justify-end gap-2">
                        <Button size="sm" onClick={saveEdit}><CheckIcon className="h-4 w-4" /></Button>
                        <Button size="sm" variant="ghost" onClick={cancelEdit}><XMarkIcon className="h-4 w-4" /></Button>
                      </div>
                    ) : (
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="ghost" onClick={() => startEdit(c)}>
                          <PencilSquareIcon className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => remove(c.code)}>
                          <TrashIcon className="h-4 w-4 text-burgundy" />
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
