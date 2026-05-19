'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '/currencies', label: 'Currencies',       icon: '💱' },
  { href: '/gold',       label: 'Gold',              icon: '🥇' },
  { href: '/products',   label: 'Products',          icon: '💍' },
  { href: '/faq',        label: 'FAQ',               icon: '❓' },
  { href: '/news',       label: 'News & Analysis',   icon: '📰' },
  { href: '/rates',      label: 'Live Rates',        icon: '📊' },
  { href: '/charts',     label: 'Charts',            icon: '📈' },
  { href: '/settings',   label: 'Settings',          icon: '⚙️'  },
] as const;

export function TabNav() {
  const path = usePathname();

  return (
    <div className="border-b border-ink-100 bg-white">
      <div className="mx-auto max-w-7xl px-4">
        <nav className="flex gap-1 overflow-x-auto">
          {TABS.map(({ href, label, icon }) => (
            <Link
              key={href}
              href={href}
              className={[
                'flex shrink-0 items-center gap-1.5 border-b-2 px-4 py-3 text-sm font-medium transition-colors',
                path === href || path.startsWith(href + '/')
                  ? 'border-gold-500 text-gold-700'
                  : 'border-transparent text-ink-500 hover:border-ink-300 hover:text-ink-700',
              ].join(' ')}
            >
              <span>{icon}</span>
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
