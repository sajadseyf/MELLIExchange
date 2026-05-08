'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button, Container, LogoMark } from '@melli/ui';
import type { AdminUser } from '@melli/types';
import { api, ApiError } from '@/lib/api';
import { TabNav } from '@/components/TabNav';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    api<{ user: AdminUser }>('/api/auth/me')
      .then((data) => {
        setUser(data.user);
        setChecking(false);
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          router.replace('/login');
        }
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
