'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button, Container, LogoMark } from '@melli/ui';
import type { AdminUser } from '@melli/types';
import { api, ApiError } from '@/lib/api';
import { TabNav } from '@/components/TabNav';

function ChangeCredentialsModal({ onClose }: { onClose: () => void }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newEmail,        setNewEmail]         = useState('');
  const [newPassword,     setNewPassword]      = useState('');
  const [confirm,         setConfirm]          = useState('');
  const [error,           setError]            = useState('');
  const [success,         setSuccess]          = useState('');
  const [saving,          setSaving]           = useState(false);

  async function handleSave() {
    setError(''); setSuccess('');
    if (newPassword && newPassword !== confirm) {
      setError('New passwords do not match'); return;
    }
    if (!newEmail && !newPassword) {
      setError('Enter a new email or new password'); return;
    }
    setSaving(true);
    try {
      const body: Record<string, string> = { currentPassword };
      if (newEmail)    body.newEmail    = newEmail;
      if (newPassword) body.newPassword = newPassword;
      await api('/api/auth/profile', { method: 'PUT', body: JSON.stringify(body) });
      setSuccess('Credentials updated! Please log in again.');
      setTimeout(() => { api('/api/auth/logout', { method: 'POST' }); window.location.href = '/login'; }, 2000);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to update');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-6 font-serif text-xl text-ink-900">Change Credentials</h2>
        <div className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-500 uppercase tracking-wide">Current Password *</label>
            <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)}
              className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm outline-none focus:border-gold-400" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-500 uppercase tracking-wide">New Email (optional)</label>
            <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="Leave blank to keep current"
              className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm outline-none focus:border-gold-400" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-500 uppercase tracking-wide">New Password (optional, min 8 chars)</label>
            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Leave blank to keep current"
              className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm outline-none focus:border-gold-400" />
          </div>
          {newPassword && (
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-500 uppercase tracking-wide">Confirm New Password</label>
              <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
                className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm outline-none focus:border-gold-400" />
            </div>
          )}
          {error   && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
          {success && <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
            <Button size="sm" onClick={handleSave} disabled={saving || !currentPassword}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user,            setUser]            = useState<AdminUser | null>(null);
  const [checking,        setChecking]        = useState(true);
  const [showCredentials, setShowCredentials] = useState(false);

  useEffect(() => {
    api<{ user: AdminUser }>('/api/auth/me')
      .then((data) => {
        setUser(data.user);
        setChecking(false);
      })
      .catch(() => {
        router.replace('/login');
      });
  }, [router]);

  async function handleLogout() {
    await api('/api/auth/logout', { method: 'POST' });
    router.replace('/login');
  }

  if (checking) {
    return (
      <main className="flex min-h-screen items-center justify-center text-ink-400">
        Loading…
      </main>
    );
  }

  return (
    <div className="min-h-screen">
      {showCredentials && <ChangeCredentialsModal onClose={() => setShowCredentials(false)} />}
      <header className="border-b border-ink-100 bg-white">
        <Container className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <LogoMark size={36} />
            <div className="leading-tight">
              <p className="font-serif text-lg text-ink-900">Melli Exchange</p>
              <p className="text-xs text-ink-400">Admin panel</p>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-ink-500">{user?.email}</span>
            <Button variant="ghost" size="sm" onClick={() => setShowCredentials(true)}>
              Change credentials
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              Sign out
            </Button>
          </div>
        </Container>
      </header>
      <TabNav />
      <main className="py-8">
        <Container>{children}</Container>
      </main>
    </div>
  );
}
