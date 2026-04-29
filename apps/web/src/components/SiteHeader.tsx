'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { Container, LogoMark } from '@melli/ui';
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
    <header className="sticky top-0 z-30 border-b border-ink-100 bg-cream/85 backdrop-blur">
      <Container className="flex h-16 items-center justify-between gap-6 sm:h-20">
        <Link href="/" className="flex items-center gap-3">
          <LogoMark size={48} />
          <div className="leading-tight">
            <p className="font-serif text-lg text-ink-900">{site.name}</p>
            <p className="text-xs uppercase tracking-[0.18em] text-gold-600">{site.tagline}</p>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-7 md:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-ink-700 transition-colors hover:text-gold-600"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Mobile toggle */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden flex h-10 w-10 items-center justify-center rounded-lg text-ink-700 hover:bg-ink-100"
          aria-label="Toggle menu"
        >
          {open ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
        </button>
      </Container>

      {/* Mobile dropdown */}
      {open && (
        <div className="border-t border-ink-100 bg-cream md:hidden">
          <Container className="flex flex-col gap-1 py-3">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-ink-700 transition-colors hover:bg-ink-100 hover:text-gold-600"
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
