'use client';

import { useEffect, useState } from 'react';
import { PlusIcon, TrashIcon, PencilIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Button, Card, Input } from '@melli/ui';
import type { Post } from '@melli/types';
import { api, ApiError } from '@/lib/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

const EMPTY_FORM = {
  title:      '',
  slug:       '',
  excerpt:    '',
  content:    '',
  coverImage: '',
  tags:       '',
  published:  false,
};

type FormState = typeof EMPTY_FORM;

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function PostsPanel() {
  const [posts,     setPosts]     = useState<Post[]>([]);
  const [error,     setError]     = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAdd,   setShowAdd]   = useState(false);
  const [form,      setForm]      = useState<FormState>(EMPTY_FORM);
  const [saving,    setSaving]    = useState(false);
  const [importing,      setImporting]      = useState(false);
  const [retranslating,  setRetranslating]  = useState(false);
  const [deletingId,setDeletingId]= useState<string | null>(null);

  async function reload() {
    const data = await api<Post[]>('/api/posts/admin/all');
    setPosts(data);
  }

  useEffect(() => {
    reload().catch((e) => setError(e instanceof ApiError ? e.message : 'Failed to load'));
  }, []);

  function startEdit(p: Post) {
    setEditingId(p.id);
    setShowAdd(false);
    setForm({
      title:      p.title,
      slug:       p.slug,
      excerpt:    p.excerpt,
      content:    p.content ?? '',
      coverImage: p.coverImage,
      tags:       p.tags.join(', '),
      published:  p.published,
    });
  }

  function startAdd() {
    setEditingId(null);
    setShowAdd(true);
    setForm(EMPTY_FORM);
  }

  function cancel() {
    setEditingId(null);
    setShowAdd(false);
    setForm(EMPTY_FORM);
  }

  function set(key: keyof FormState, value: string | boolean) {
    setForm((f) => {
      const next = { ...f, [key]: value };
      // Auto-generate slug from title when adding
      if (key === 'title' && showAdd && !editingId) {
        next.slug = slugify(value as string);
      }
      return next;
    });
  }

  function payload() {
    return {
      title:      form.title,
      slug:       form.slug || slugify(form.title),
      excerpt:    form.excerpt,
      content:    form.content,
      coverImage: form.coverImage,
      tags:       form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      published:  form.published,
    };
  }

  async function save() {
    setSaving(true);
    try {
      if (editingId) {
        await api(`/api/posts/${editingId}`, { method: 'PUT', body: JSON.stringify(payload()) });
      } else {
        await api('/api/posts', { method: 'POST', body: JSON.stringify(payload()) });
      }
      await reload();
      cancel();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function retranslate() {
    if (!confirm('Translate all posts to Persian & Chinese? This may take several minutes.')) return;
    setRetranslating(true);
    try {
      const result = await api<{ translated: number; total: number }>('/api/posts/retranslate?force=true', { method: 'POST', body: '{}' });
      await reload();
      alert(`Done — ${result.translated} / ${result.total} posts translated.`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Retranslate failed');
    } finally {
      setRetranslating(false);
    }
  }

  async function importVBCE() {
    if (!confirm('Import all articles from VBCE Market Watch? Existing ones will be updated.')) return;
    setImporting(true);
    try {
      const result = await api<{ total: number; imported: number; updated: number }>('/api/posts/import-vbce', { method: 'POST', body: '{}' });
      await reload();
      alert(`Done — ${result.total} articles processed: ${result.imported} new, ${result.updated} updated.`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Import failed');
    } finally {
      setImporting(false);
    }
  }

  async function remove(id: string) {
    if (!confirm('Delete this post?')) return;
    setDeletingId(id);
    try {
      await api(`/api/posts/${id}`, { method: 'DELETE' });
      await reload();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Delete failed');
    } finally {
      setDeletingId(null);
    }
  }

  const isEditing = showAdd || editingId !== null;

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-ink-100 px-6 py-4 dark:border-dark-border">
        <div>
          <h2 className="font-semibold text-ink-900 dark:text-white">Market Watch / Posts</h2>
          <p className="text-xs text-ink-400 dark:text-zinc-500">{posts.length} posts</p>
        </div>
        {!isEditing && (
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={retranslate} disabled={retranslating || importing}>
              {retranslating ? 'Translating…' : '🌐 Retranslate'}
            </Button>
            <Button size="sm" variant="ghost" onClick={importVBCE} disabled={importing || retranslating}>
              {importing ? 'Importing…' : '↓ Import VBCE'}
            </Button>
            <Button size="sm" onClick={startAdd}>
              <PlusIcon className="h-4 w-4" /> New Post
            </Button>
          </div>
        )}
      </div>

      {error && (
        <div className="mx-6 mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Editor */}
      {isEditing && (
        <div className="border-b border-ink-100 p-6 dark:border-dark-border">
          <h3 className="mb-4 font-medium text-ink-800 dark:text-zinc-200">
            {editingId ? 'Edit Post' : 'New Post'}
          </h3>
          <div className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-600 dark:text-zinc-400">Title *</label>
                <Input value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="Post title" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-600 dark:text-zinc-400">Slug</label>
                <Input value={form.slug} onChange={(e) => set('slug', e.target.value)} placeholder="auto-generated" />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-ink-600 dark:text-zinc-400">Excerpt</label>
              <Input value={form.excerpt} onChange={(e) => set('excerpt', e.target.value)} placeholder="Short summary shown on the list page" />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-ink-600 dark:text-zinc-400">Cover Image URL</label>
              <Input value={form.coverImage} onChange={(e) => set('coverImage', e.target.value)} placeholder="https://..." />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-ink-600 dark:text-zinc-400">Content (plain text / Markdown)</label>
              <textarea
                value={form.content}
                onChange={(e) => set('content', e.target.value)}
                rows={12}
                placeholder="Write your article here..."
                className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 outline-none transition-colors focus:border-gold-400 dark:border-dark-border dark:bg-dark-raised dark:text-white"
              />
            </div>

            <div className="flex items-center gap-6">
              <div className="flex-1">
                <label className="mb-1 block text-xs font-medium text-ink-600 dark:text-zinc-400">Tags (comma separated)</label>
                <Input value={form.tags} onChange={(e) => set('tags', e.target.value)} placeholder="gold, forex, cad" />
              </div>
              <label className="flex cursor-pointer items-center gap-2 pt-4">
                <input
                  type="checkbox"
                  checked={form.published}
                  onChange={(e) => set('published', e.target.checked)}
                  className="h-4 w-4 rounded accent-gold-500"
                />
                <span className="text-sm font-medium text-ink-700 dark:text-zinc-300">Published</span>
              </label>
            </div>

            <div className="flex gap-3">
              <Button size="sm" onClick={save} disabled={saving || !form.title}>
                <CheckIcon className="h-4 w-4" /> {saving ? 'Saving…' : 'Save'}
              </Button>
              <Button size="sm" variant="ghost" onClick={cancel}>
                <XMarkIcon className="h-4 w-4" /> Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Post list */}
      <div className="divide-y divide-ink-100 dark:divide-dark-border">
        {posts.length === 0 && !isEditing && (
          <p className="px-6 py-10 text-center text-sm text-ink-400 dark:text-zinc-500">No posts yet. Click "New Post" to create one.</p>
        )}
        {posts.map((p) => (
          <div key={p.id} className={`flex items-start gap-4 px-6 py-4 ${editingId === p.id ? 'bg-gold-50/40 dark:bg-gold-900/10' : ''}`}>
            {p.coverImage && (
              <img src={p.coverImage} alt="" className="h-14 w-20 flex-shrink-0 rounded-lg object-cover" />
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className={`inline-block h-2 w-2 rounded-full ${p.published ? 'bg-emerald-500' : 'bg-zinc-400'}`} />
                <span className="truncate font-medium text-ink-900 dark:text-white">{p.title}</span>
              </div>
              {p.excerpt && <p className="mt-0.5 truncate text-xs text-ink-400 dark:text-zinc-500">{p.excerpt}</p>}
              <div className="mt-1 flex flex-wrap gap-1">
                {p.tags.map((tag) => (
                  <span key={tag} className="rounded-full bg-ink-100 px-2 py-0.5 text-xs text-ink-500 dark:bg-dark-raised dark:text-zinc-400">{tag}</span>
                ))}
              </div>
            </div>
            <div className="flex shrink-0 gap-1">
              <button onClick={() => startEdit(p)} className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 dark:hover:bg-dark-raised">
                <PencilIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => remove(p.id)}
                disabled={deletingId === p.id}
                className="rounded-lg p-1.5 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
