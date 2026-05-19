'use client';

import { useEffect, useState } from 'react';
import {
  PlusIcon, TrashIcon, PencilIcon,
  CheckIcon, XMarkIcon, ChevronUpIcon, ChevronDownIcon,
} from '@heroicons/react/24/outline';
import { Button, Card, Input } from '@melli/ui';
import type { FaqItem } from '@melli/types';
import { api, ApiError } from '@/lib/api';

const EMPTY_FORM = { questionFa: '', questionEn: '', answerFa: '', answerEn: '' };
type Form = typeof EMPTY_FORM;

export function FaqPanel() {
  const [items,     setItems]     = useState<FaqItem[]>([]);
  const [error,     setError]     = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAdd,   setShowAdd]   = useState(false);
  const [form,      setForm]      = useState<Form>(EMPTY_FORM);
  const [saving,    setSaving]    = useState(false);
  const [deletingId,setDeletingId]= useState<string | null>(null);

  async function reload() {
    const data = await api<FaqItem[]>('/api/faq/admin/all');
    setItems(data);
  }

  useEffect(() => {
    reload().catch((e) => setError(e instanceof ApiError ? e.message : 'Failed to load'));
  }, []);

  function startEdit(item: FaqItem) {
    setEditingId(item.id);
    setShowAdd(false);
    setForm({
      questionFa: item.question.fa,
      questionEn: item.question.en,
      answerFa:   item.answer.fa,
      answerEn:   item.answer.en,
    });
  }

  function cancelEdit() { setEditingId(null); setShowAdd(false); setForm(EMPTY_FORM); }

  async function save() {
    setError(null);
    setSaving(true);
    const body = {
      question: { fa: form.questionFa, en: form.questionEn },
      answer:   { fa: form.answerFa,   en: form.answerEn },
    };
    try {
      if (editingId) {
        await api(`/api/faq/${editingId}`, { method: 'PUT', body: JSON.stringify(body) });
      } else {
        await api('/api/faq', { method: 'POST', body: JSON.stringify(body) });
      }
      cancelEdit();
      await reload();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!confirm('Delete this FAQ item?')) return;
    setDeletingId(id);
    try {
      await api(`/api/faq/${id}`, { method: 'DELETE' });
      await reload();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Delete failed');
    } finally {
      setDeletingId(null);
    }
  }

  async function move(index: number, direction: 'up' | 'down') {
    const next = [...items];
    const swap = direction === 'up' ? index - 1 : index + 1;
    if (swap < 0 || swap >= next.length) return;
    const a = next[index]!;
    const b = next[swap]!;
    next[index] = b;
    next[swap]  = a;
    const reordered = next.map((item, i) => ({ id: item.id, order: i }));
    setItems(next.map((item, i) => ({ ...item, order: i })));
    await api('/api/faq/reorder', { method: 'POST', body: JSON.stringify(reordered) });
  }

  async function toggleActive(item: FaqItem) {
    await api(`/api/faq/${item.id}`, {
      method: 'PUT',
      body: JSON.stringify({ active: !item.active }),
    });
    await reload();
  }

  const formValid = form.questionFa.trim() && form.answerFa.trim();

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-ink-100 px-6 py-4">
        <div>
          <h2 className="font-serif text-xl text-ink-900">FAQ</h2>
          <p className="text-sm text-ink-500">Manage frequently asked questions shown on the public site</p>
        </div>
        {!showAdd && !editingId && (
          <Button size="sm" onClick={() => { setShowAdd(true); setForm(EMPTY_FORM); }}>
            <PlusIcon className="h-4 w-4" /> Add question
          </Button>
        )}
      </div>

      {error && (
        <div className="border-b border-ink-100 bg-burgundy/5 px-6 py-3 text-sm text-burgundy">{error}</div>
      )}

      {(showAdd || editingId) && (
        <div className="border-b border-ink-100 bg-ink-50 px-6 py-5">
          <p className="mb-4 text-sm font-semibold text-ink-700">
            {editingId ? 'Edit question' : 'New question'}
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-3">
              <p className="text-xs font-medium uppercase tracking-wide text-ink-400">فارسی</p>
              <textarea
                className="w-full rounded-lg border border-ink-200 p-3 text-sm text-ink-900 placeholder:text-ink-300 focus:border-gold-400 focus:outline-none"
                rows={2}
                placeholder="سوال (فارسی)"
                dir="rtl"
                value={form.questionFa}
                onChange={(e) => setForm({ ...form, questionFa: e.target.value })}
              />
              <textarea
                className="w-full rounded-lg border border-ink-200 p-3 text-sm text-ink-900 placeholder:text-ink-300 focus:border-gold-400 focus:outline-none"
                rows={3}
                placeholder="پاسخ (فارسی)"
                dir="rtl"
                value={form.answerFa}
                onChange={(e) => setForm({ ...form, answerFa: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-3">
              <p className="text-xs font-medium uppercase tracking-wide text-ink-400">English</p>
              <textarea
                className="w-full rounded-lg border border-ink-200 p-3 text-sm text-ink-900 placeholder:text-ink-300 focus:border-gold-400 focus:outline-none"
                rows={2}
                placeholder="Question (English)"
                value={form.questionEn}
                onChange={(e) => setForm({ ...form, questionEn: e.target.value })}
              />
              <textarea
                className="w-full rounded-lg border border-ink-200 p-3 text-sm text-ink-900 placeholder:text-ink-300 focus:border-gold-400 focus:outline-none"
                rows={3}
                placeholder="Answer (English)"
                value={form.answerEn}
                onChange={(e) => setForm({ ...form, answerEn: e.target.value })}
              />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button onClick={save} disabled={saving || !formValid}>
              <CheckIcon className="h-4 w-4" />
              {saving ? 'Saving…' : 'Save'}
            </Button>
            <Button variant="ghost" onClick={cancelEdit}>
              <XMarkIcon className="h-4 w-4" /> Cancel
            </Button>
          </div>
        </div>
      )}

      <div className="divide-y divide-ink-100">
        {items.length === 0 && (
          <p className="px-6 py-8 text-center text-sm text-ink-400">No FAQ items yet. Add your first question above.</p>
        )}
        {items.map((item, i) => (
          <div
            key={item.id}
            className={['px-6 py-4 transition-colors', !item.active ? 'opacity-50' : ''].join(' ')}
          >
            <div className="flex items-start gap-3">
              <div className="flex flex-col gap-0.5 pt-1">
                <button
                  onClick={() => move(i, 'up')}
                  disabled={i === 0}
                  className="rounded p-0.5 text-ink-300 hover:text-ink-600 disabled:opacity-20"
                >
                  <ChevronUpIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => move(i, 'down')}
                  disabled={i === items.length - 1}
                  className="rounded p-0.5 text-ink-300 hover:text-ink-600 disabled:opacity-20"
                >
                  <ChevronDownIcon className="h-4 w-4" />
                </button>
              </div>

              <div className="min-w-0 flex-1">
                <p className="font-medium text-ink-900" dir="rtl">{item.question.fa || <span className="italic text-ink-400">—</span>}</p>
                {item.question.en && (
                  <p className="mt-0.5 text-sm text-ink-500">{item.question.en}</p>
                )}
                <p className="mt-2 text-sm text-ink-600" dir="rtl">{item.answer.fa}</p>
              </div>

              <div className="flex shrink-0 items-center gap-1">
                <button
                  onClick={() => toggleActive(item)}
                  title={item.active ? 'Hide' : 'Show'}
                  className={[
                    'rounded-full px-2 py-0.5 text-xs font-medium',
                    item.active
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : 'bg-ink-100 text-ink-500 hover:bg-ink-200',
                  ].join(' ')}
                >
                  {item.active ? 'Active' : 'Hidden'}
                </button>
                <button
                  onClick={() => startEdit(item)}
                  className="rounded p-1.5 text-ink-400 hover:text-ink-700"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => remove(item.id)}
                  disabled={deletingId === item.id}
                  className="rounded p-1.5 text-ink-400 hover:text-burgundy disabled:opacity-50"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
