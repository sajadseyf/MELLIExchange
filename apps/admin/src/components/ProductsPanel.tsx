'use client';

import { useEffect, useState, useRef } from 'react';
import { PlusIcon, TrashIcon, PencilIcon, CheckIcon, XMarkIcon, PhotoIcon } from '@heroicons/react/24/outline';
import { Button, Card, Input, Badge } from '@melli/ui';
import type { Product, ProductCategory, ProductKarat } from '@melli/types';
import { api, ApiError } from '@/lib/api';

const CATEGORIES: { value: ProductCategory; label: string }[] = [
  { value: 'ring',      label: 'Ring / انگشتر' },
  { value: 'necklace',  label: 'Necklace / گردنبند' },
  { value: 'bracelet',  label: 'Bracelet / دستبند' },
  { value: 'earring',   label: 'Earring / گوشواره' },
  { value: 'pendant',   label: 'Pendant / آویز' },
  { value: 'other',     label: 'Other / سایر' },
];

const KARATS: ProductKarat[] = [14, 18, 21, 22, 24];

const EMPTY_FORM = {
  name: '',
  description: '',
  category: 'ring' as ProductCategory,
  karat: 18 as ProductKarat,
  weightGrams: '',
  price: '',
  images: [] as string[],
  inStock: true,
  order: '0',
};

type FormState = typeof EMPTY_FORM;

// Pending = files selected but not yet uploaded (shown as local previews)
type PendingFile = { file: File; preview: string };

export function ProductsPanel() {
  const [products, setProducts]       = useState<Product[]>([]);
  const [error, setError]             = useState<string | null>(null);
  const [editingId, setEditingId]     = useState<string | null>(null);
  const [showAdd, setShowAdd]         = useState(false);
  const [form, setForm]               = useState<FormState>(EMPTY_FORM);
  const [pending, setPending]         = useState<PendingFile[]>([]);
  const [saving, setSaving]           = useState(false);
  const [deletingId, setDeletingId]   = useState<string | null>(null);
  const fileRef                       = useRef<HTMLInputElement>(null);

  async function reload() {
    const data = await api<Product[]>('/api/products');
    setProducts(data);
  }

  useEffect(() => {
    reload().catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load'));
  }, []);

  function handleFileSelect(files: FileList) {
    const newPending: PendingFile[] = Array.from(files).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setPending((prev) => [...prev, ...newPending]);
    // reset input so same file can be re-selected if needed
    if (fileRef.current) fileRef.current.value = '';
  }

  function removeUploadedImage(idx: number) {
    setForm((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }));
  }

  function removePending(idx: number) {
    setPending((prev) => {
      URL.revokeObjectURL(prev[idx]!.preview);
      return prev.filter((_, i) => i !== idx);
    });
  }

  function clearPending() {
    pending.forEach((p) => URL.revokeObjectURL(p.preview));
    setPending([]);
  }

  function startEdit(product: Product) {
    setEditingId(product.id);
    setShowAdd(false);
    clearPending();
    setForm({
      name: product.name,
      description: product.description,
      category: product.category,
      karat: product.karat,
      weightGrams: String(product.weightGrams),
      price: String(product.price),
      images: product.images ?? [],
      inStock: product.inStock,
      order: String(product.order),
    });
  }

  function startAdd() {
    setShowAdd(true);
    setEditingId(null);
    clearPending();
    setForm(EMPTY_FORM);
    setError(null);
  }

  function cancel() {
    setEditingId(null);
    setShowAdd(false);
    clearPending();
    setForm(EMPTY_FORM);
    setError(null);
  }

  async function save() {
    setError(null);
    setSaving(true);
    try {
      // Upload pending files first, only on Save
      let uploadedUrls: string[] = [];
      if (pending.length > 0) {
        const formData = new FormData();
        pending.forEach((p) => formData.append('images', p.file));
        const res = await fetch('/api/uploads', {
          method: 'POST',
          credentials: 'include',
          body: formData,
        });
        if (!res.ok) throw new Error('Image upload failed');
        const data = (await res.json()) as { urls: string[] };
        uploadedUrls = data.urls;
      }

      const body = {
        name: form.name,
        description: form.description,
        category: form.category,
        karat: Number(form.karat),
        weightGrams: Number(form.weightGrams),
        price: Number(form.price),
        images: [...form.images, ...uploadedUrls],
        inStock: form.inStock,
        order: Number(form.order),
      };
      if (editingId) {
        await api(`/api/products/${editingId}`, { method: 'PUT', body: JSON.stringify(body) });
      } else {
        await api('/api/products', { method: 'POST', body: JSON.stringify(body) });
      }
      await reload();
      cancel();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!confirm('Delete this product?')) return;
    setDeletingId(id);
    try {
      await api(`/api/products/${id}`, { method: 'DELETE' });
      await reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Delete failed');
    } finally {
      setDeletingId(null);
    }
  }

  const activeForm = showAdd || editingId !== null;

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-ink-100 px-6 py-4">
        <div>
          <h2 className="font-serif text-xl text-ink-900">Jewelry products</h2>
          <p className="text-sm text-ink-500">Manage gold jewelry listings</p>
        </div>
        {!activeForm && (
          <Button onClick={startAdd}>
            <PlusIcon className="h-4 w-4" />
            Add product
          </Button>
        )}
      </div>

      {error && (
        <div className="border-b border-ink-100 bg-burgundy/5 px-6 py-3 text-sm text-burgundy">{error}</div>
      )}

      {activeForm && (
        <div className="border-b border-ink-100 bg-ink-50 p-6 dark:bg-dark-raised">
          <h3 className="mb-4 font-medium text-ink-900 dark:text-white">
            {editingId ? 'Edit product' : 'New product'}
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="sm:col-span-2" />

            <div className="flex flex-col gap-1 sm:col-span-2">
              <label className="text-xs font-medium text-ink-600 dark:text-zinc-400">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 focus:outline-none focus:ring-2 focus:ring-gold-500 dark:border-dark-border dark:bg-dark-card dark:text-white"
                placeholder="Description / توضیحات"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-ink-600 dark:text-zinc-400">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value as ProductCategory })}
                className="rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 focus:outline-none focus:ring-2 focus:ring-gold-500 dark:border-dark-border dark:bg-dark-card dark:text-white"
              >
                {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-ink-600 dark:text-zinc-400">Karat</label>
              <select
                value={form.karat}
                onChange={(e) => setForm({ ...form, karat: Number(e.target.value) as ProductKarat })}
                className="rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 focus:outline-none focus:ring-2 focus:ring-gold-500 dark:border-dark-border dark:bg-dark-card dark:text-white"
              >
                {KARATS.map((k) => <option key={k} value={k}>{k}K</option>)}
              </select>
            </div>

            <Input label="Weight (grams)" type="number" step="0.01" value={form.weightGrams} onChange={(e) => setForm({ ...form, weightGrams: e.target.value })} />
            <Input label="Price (CAD)" type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            <Input label="Display order" type="number" step="1" value={form.order} onChange={(e) => setForm({ ...form, order: e.target.value })} />

            <div className="flex items-center gap-2">
              <input id="inStock" type="checkbox" checked={form.inStock} onChange={(e) => setForm({ ...form, inStock: e.target.checked })} className="h-4 w-4 rounded border-ink-300 text-gold-600 focus:ring-gold-500" />
              <label htmlFor="inStock" className="text-sm text-ink-700 dark:text-zinc-300">In stock</label>
            </div>

            {/* Image upload */}
            <div className="sm:col-span-2">
              <label className="mb-2 block text-xs font-medium text-ink-600 dark:text-zinc-400">
                Images ({form.images.length + pending.length} / 10)
                {pending.length > 0 && (
                  <span className="ml-2 text-amber-600">· {pending.length} pending upload on Save</span>
                )}
              </label>
              <div className="flex flex-wrap gap-3">
                {/* Already uploaded images */}
                {form.images.map((url, idx) => (
                  <div key={`saved-${idx}`} className="group relative h-20 w-20 overflow-hidden rounded-lg border border-ink-200 dark:border-dark-border">
                    <img src={url} alt="" className="h-full w-full object-cover" />
                    <button
                      onClick={() => removeUploadedImage(idx)}
                      className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <XMarkIcon className="h-5 w-5 text-white" />
                    </button>
                    {idx === 0 && pending.length === 0 && (
                      <span className="absolute bottom-0 left-0 right-0 bg-gold-600/80 py-0.5 text-center text-[9px] font-medium uppercase text-white">
                        Cover
                      </span>
                    )}
                  </div>
                ))}
                {/* Pending (not yet uploaded) — shown with local preview */}
                {pending.map((p, idx) => (
                  <div key={`pending-${idx}`} className="group relative h-20 w-20 overflow-hidden rounded-lg border-2 border-dashed border-amber-400">
                    <img src={p.preview} alt="" className="h-full w-full object-cover opacity-80" />
                    <button
                      onClick={() => removePending(idx)}
                      className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <XMarkIcon className="h-5 w-5 text-white" />
                    </button>
                    {form.images.length === 0 && idx === 0 && (
                      <span className="absolute bottom-0 left-0 right-0 bg-gold-600/80 py-0.5 text-center text-[9px] font-medium uppercase text-white">
                        Cover
                      </span>
                    )}
                  </div>
                ))}
                {form.images.length + pending.length < 10 && (
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-ink-300 text-ink-400 transition-colors hover:border-gold-400 hover:text-gold-600 dark:border-dark-border dark:text-zinc-500"
                  >
                    <PhotoIcon className="h-6 w-6" />
                    <span className="text-[10px]">Add</span>
                  </button>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
              />
              <p className="mt-1 text-xs text-ink-400 dark:text-zinc-500">First image is cover. Max 8 MB per file. Images upload when you click Save.</p>
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <Button onClick={save} disabled={saving || uploading}>
              <CheckIcon className="h-4 w-4" />
              {saving ? 'Saving…' : 'Save'}
            </Button>
            <Button onClick={cancel}>
              <XMarkIcon className="h-4 w-4" />
              Cancel
            </Button>
          </div>
        </div>
      )}

      {products.length === 0 && !activeForm ? (
        <div className="p-10 text-center text-sm text-ink-400">
          No products yet. Click &quot;Add product&quot; to get started.
        </div>
      ) : (
        <div className="divide-y divide-ink-100 dark:divide-dark-border">
          {products.map((product) => (
            <div key={product.id} className="flex items-start gap-4 px-6 py-4">
              {product.images?.[0] ? (
                <img src={product.images[0]} alt={product.name} className="h-14 w-14 flex-shrink-0 rounded-lg object-cover" />
              ) : (
                <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-lg bg-gold-50 text-2xl dark:bg-dark-raised">💍</div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-ink-900 dark:text-white">{product.name}</span>
                  <Badge tone="gold">{product.karat}K</Badge>
                  {product.images?.length > 1 && (
                    <Badge tone="ink">{product.images.length} photos</Badge>
                  )}
                  {!product.inStock && <Badge tone="danger">Out of stock</Badge>}
                </div>
                <p className="mt-0.5 line-clamp-1 text-sm text-ink-500 dark:text-zinc-400">
                  {product.description || '—'}
                </p>
                <p className="mt-1 text-xs text-ink-400 dark:text-zinc-500">
                  {product.weightGrams}g · CAD ${product.price.toFixed(2)}
                </p>
              </div>
              <div className="flex flex-shrink-0 gap-2">
                <button onClick={() => startEdit(product)} className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-500 hover:bg-ink-100 hover:text-ink-900 dark:text-zinc-400 dark:hover:bg-dark-raised dark:hover:text-white" aria-label="Edit">
                  <PencilIcon className="h-4 w-4" />
                </button>
                <button onClick={() => remove(product.id)} disabled={deletingId === product.id} className="flex h-8 w-8 items-center justify-center rounded-lg text-burgundy/60 hover:bg-burgundy/10 hover:text-burgundy" aria-label="Delete">
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
