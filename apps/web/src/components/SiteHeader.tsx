import Link from 'next/link';
import { Container, LogoMark } from '@melli/ui';
import { site } from '@/lib/site';

const nav = [
  { href: '/currencies', label: 'Currency Prices' },
  { href: '/gold',       label: 'Gold Price' },
  { href: '/about',      label: 'About Us' },
  { href: '/contact',    label: 'Contact Us' },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-ink-100 bg-cream/85 backdrop-blur">
      <Container className="flex h-20 items-center justify-between gap-6">
        <Link href="/" className="flex items-center gap-3">
          <LogoMark size={48} />
          <div className="leading-tight">
            <p className="font-serif text-lg text-ink-900">{site.name}</p>
            <p className="text-xs uppercase tracking-[0.18em] text-gold-600">{site.tagline}</p>
          </div>
        </Link>
        <nav className="hidden items-center gap-7 md:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-ink-700 hover:text-gold-600"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </Container>
    </header>
  );
}
