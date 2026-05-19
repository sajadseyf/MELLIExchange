'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const NAV = [
  {
    section: 'Prices',
    items: [
      { href: '/currencies', label: 'Currencies', icon: '💱' },
      { href: '/gold',       label: 'Gold & Karats', icon: '🥇' },
      { href: '/products',   label: 'Products',   icon: '📦' },
    ],
  },
  {
    section: 'Market',
    items: [
      { href: '/rates',  label: 'Competitor Rates', icon: '📊' },
      { href: '/charts', label: 'Charts',           icon: '📈' },
      { href: '/news',   label: 'News',             icon: '📰' },
    ],
  },
  {
    section: 'Content',
    items: [
      { href: '/posts', label: 'Posts', icon: '✍️' },
    ],
  },
  {
    section: 'Config',
    items: [
      { href: '/settings', label: 'Settings', icon: '⚙️' },
    ],
  },
];

export function Sidebar() {
  const path = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) => path === href || (path?.startsWith(href + '/') ?? false);

  const nav = (
    <nav className="flex flex-col gap-6 p-4">
      {NAV.map(({ section, items }) => (
        <div key={section}>
          <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-widest text-ink-300">
            {section}
          </p>
          <div className="flex flex-col gap-0.5">
            {items.map(({ href, label, icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={[
                  'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive(href)
                    ? 'bg-amber-50 text-amber-700'
                    : 'text-ink-600 hover:bg-ink-50 hover:text-ink-900',
                ].join(' ')}
              >
                <span className="text-base leading-none">{icon}</span>
                {label}
              </Link>
            ))}
          </div>
        </div>
      ))}
    </nav>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="fixed left-4 top-4 z-50 flex h-9 w-9 items-center justify-center rounded-lg border border-ink-200 bg-white shadow-sm lg:hidden"
        onClick={() => setOpen(!open)}
      >
        <span className="text-lg">{open ? '✕' : '☰'}</span>
      </button>

      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={[
          'fixed inset-y-0 left-0 z-40 w-56 overflow-y-auto border-r border-ink-100 bg-white transition-transform lg:hidden',
          open ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        <div className="h-16" />
        {nav}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden w-56 shrink-0 border-r border-ink-100 bg-white lg:block">
        <div className="sticky top-0 h-screen overflow-y-auto">
          {nav}
        </div>
      </aside>
    </>
  );
}
