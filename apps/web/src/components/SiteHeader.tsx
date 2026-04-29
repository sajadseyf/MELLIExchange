'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { Container, LogoMark } from '@melli/ui';
import { ThemeToggle } from './ThemeToggle';
import { site } from '@/lib/site';

const nav = [
  { href: '/currencies', label: 'Currency Prices' },
  { href: '/gold',       label: 'Gold Price' },
  { href: '/about',      label: 'About Us' },
  { href: '/contact',    label: 'Contact Us' },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-ink-100 bg-white/85 backdrop-blur dark:border-dark-border dark:bg-dark/85">
      <Container className="flex h-14 items-center justify-between gap-6">
        <Link href="/" className="flex items-center gap-3">
          <LogoMark size={36} />
          <div className="leading-tight">
            <p className="text-base font-semibold text-ink-900 dark:text-white">{site.name}</p>
            <p className="text-[10px] uppercase tracking-[0.18em] text-gold-600">{site.tagline}</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-ink-600 transition-colors hover:text-ink-900 dark:text-zinc-400 dark:hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setOpen(!open)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-600 hover:bg-ink-100 md:hidden dark:text-zinc-400 dark:hover:bg-dark-raised"
            aria-label="Toggle menu"
          >
            {open ? <XMarkIcon className="h-5 w-5" /> : <Bars3Icon className="h-5 w-5" />}
          </button>
        </div>
      </Container>

      {open && (
        <div className="border-t border-ink-100 bg-white md:hidden dark:border-dark-border dark:bg-dark-card">
          <Container className="flex flex-col gap-1 py-3">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-ink-700 transition-colors hover:bg-ink-100 dark:text-zinc-300 dark:hover:bg-dark-raised"
              >
                {item.label}
              </Link>
            ))}
          </Container>
        </div>
      )}
    </header>
  );
}
