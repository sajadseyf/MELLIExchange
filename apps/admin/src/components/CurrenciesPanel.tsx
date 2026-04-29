'use client';

import { useEffect, useState } from 'react';
import { PencilSquareIcon, TrashIcon, PlusIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Badge, Button, Card, Flag, Input } from '@melli/ui';
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

  function renderDraftForm(onSave: () => void, isNew: boolean) {
    return (
      <div className="space-y-3 rounded-xl border border-ink-200 bg-gold-50/40 p-4">
        <div className="grid grid-cols-2 gap-3">
          {isNew && (
            <Input label="Code" value={draft.code} onChange={(e) => setDraft({ ...draft, code: e.target.value })} placeholder="USD" />
          )}
          <Input label="Name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="US Dollar" />
          <Input label="Symbol" value={draft.symbol} onChange={(e) => setDraft({ ...draft, symbol: e.target.value })} placeholder="$" />
          <Input label="Flag (2-letter code)" value={draft.flag} onChange={(e) => setDraft({ ...draft, flag: e.target.value })} placeholder="us" />
          <Input label="Buy" type="number" step="0.0001" value={draft.buy} onChange={(e) => setDraft({ ...draft, buy: e.target.value })} />
          <Input label="Sell" type="number" step="0.0001" value={draft.sell} onChange={(e) => setDraft({ ...draft, sell: e.target.value })} />
          <Input label="Order" type="number" value={draft.order} onChange={(e) => setDraft({ ...draft, order: e.target.value })} />
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={onSave}><CheckIcon className="h-4 w-4" /> Save</Button>
          <Button size="sm" variant="ghost" onClick={cancelEdit}><XMarkIcon className="h-4 w-4" /> Cancel</Button>
        </div>
      </div>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-ink-100 px-4 py-4 sm:px-6">
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
        <div className="border-b border-ink-100 bg-burgundy/5 px-4 py-3 text-sm text-burgundy sm:px-6">
          {error}
        </div>
      )}

      {/* Mobile card list */}
      <div className="lg:hidden divide-y divide-ink-100">
        {creating && (
          <div className="p-4">
            {renderDraftForm(createNew, true)}
          </div>
        )}
        {items.map((c) => {
          const isEditing = editing === c.code;
          if (isEditing) {
            return (
              <div key={c.code} className="p-4">
                {renderDraftForm(saveEdit, false)}
              </div>
            );
          }
          return (
            <div key={c.code} className="flex items-center gap-3 px-4 py-3">
              <Flag code={c.flag} size="md" />
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <Badge tone="gold">{c.code}</Badge>
                  <span className="font-medium text-ink-900 truncate">{c.name}</span>
                </div>
                <div className="mt-1 flex gap-4 text-sm tabular-nums">
                  <span className="text-ink-600">
                    <span className="text-xs text-ink-400">Buy </span>
                    {c.buy.toFixed(4)}
                  </span>
                  <span className="text-ink-600">
                    <span className="text-xs text-ink-400">Sell </span>
                    {c.sell.toFixed(4)}
                  </span>
                </div>
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" onClick={() => startEdit(c)}>
                  <PencilSquareIcon className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => remove(c.code)}>
                  <TrashIcon className="h-4 w-4 text-burgundy" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop table */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full table-fixed text-sm">
          <colgroup>
            <col className="w-[80px]" />
            <col className="w-[72px]" />
            <col />
            <col className="w-[72px]" />
            <col className="w-[120px]" />
            <col className="w-[120px]" />
            <col className="w-[72px]" />
            <col className="w-[112px]" />
          </colgroup>
          <thead className="bg-ink-50/60 text-left text-xs uppercase tracking-wider text-ink-500">
            <tr>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Flag</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Symbol</th>
              <th className="px-4 py-3 text-right">Buy</th>
              <th className="px-4 py-3 text-right">Sell</th>
              <th className="px-4 py-3 text-right">Order</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {creating && (
              <tr className="border-t border-ink-100 bg-gold-50/40">
                <td className="px-4 py-3 align-middle">
                  <Input value={draft.code} onChange={(e) => setDraft({ ...draft, code: e.target.value })} placeholder="USD" />
                </td>
                <td className="px-4 py-3 align-middle">
                  <Input value={draft.flag} onChange={(e) => setDraft({ ...draft, flag: e.target.value })} placeholder="us" />
                </td>
                <td className="px-4 py-3 align-middle">
                  <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="US Dollar" />
                </td>
                <td className="px-4 py-3 align-middle">
                  <Input value={draft.symbol} onChange={(e) => setDraft({ ...draft, symbol: e.target.value })} placeholder="$" />
                </td>
                <td className="px-4 py-3 align-middle">
                  <Input type="number" step="0.0001" value={draft.buy} onChange={(e) => setDraft({ ...draft, buy: e.target.value })} className="text-right" />
                </td>
                <td className="px-4 py-3 align-middle">
                  <Input type="number" step="0.0001" value={draft.sell} onChange={(e) => setDraft({ ...draft, sell: e.target.value })} className="text-right" />
                </td>
                <td className="px-4 py-3 align-middle">
                  <Input type="number" value={draft.order} onChange={(e) => setDraft({ ...draft, order: e.target.value })} className="text-right" />
                </td>
                <td className="px-4 py-3 text-right align-middle">
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
                  <td className="px-4 py-3 align-middle">
                    <Badge tone="gold">{c.code}</Badge>
                  </td>
                  <td className="px-4 py-3 align-middle">
                    {isEditing ? (
                      <Input value={draft.flag} onChange={(e) => setDraft({ ...draft, flag: e.target.value })} />
                    ) : (
                      <Flag code={c.flag} size="md" />
                    )}
                  </td>
                  <td className="px-4 py-3 align-middle">
                    {isEditing ? (
                      <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
                    ) : (
                      <span className="truncate">{c.name}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 align-middle">
                    {isEditing ? (
                      <Input value={draft.symbol} onChange={(e) => setDraft({ ...draft, symbol: e.target.value })} />
                    ) : (
                      c.symbol
                    )}
                  </td>
                  <td className="px-4 py-3 text-right align-middle tabular-nums">
                    {isEditing ? (
                      <Input type="number" step="0.0001" value={draft.buy} onChange={(e) => setDraft({ ...draft, buy: e.target.value })} className="text-right" />
                    ) : (
                      c.buy.toFixed(4)
                    )}
                  </td>
                  <td className="px-4 py-3 text-right align-middle tabular-nums">
                    {isEditing ? (
                      <Input type="number" step="0.0001" value={draft.sell} onChange={(e) => setDraft({ ...draft, sell: e.target.value })} className="text-right" />
                    ) : (
                      c.sell.toFixed(4)
                    )}
                  </td>
                  <td className="px-4 py-3 text-right align-middle tabular-nums">
                    {isEditing ? (
                      <Input type="number" value={draft.order} onChange={(e) => setDraft({ ...draft, order: e.target.value })} className="text-right" />
                    ) : (
                      c.order
                    )}
                  </td>
                  <td className="px-4 py-3 text-right align-middle">
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
