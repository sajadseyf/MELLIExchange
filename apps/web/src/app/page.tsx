import Link from 'next/link';
import {
  ArrowRightIcon,
  ShieldCheckIcon,
  CurrencyDollarIcon,
  ClockIcon,
  BuildingStorefrontIcon,
} from '@heroicons/react/24/outline';
import { Button, Container } from '@melli/ui';
import { getCurrencies, getGoldPrices } from '@/lib/api';
import { RatesTable } from '@/components/RatesTable';
import { GoldCards } from '@/components/GoldCards';
import { CurrencyCalculator } from '@/components/CurrencyCalculator';
import { site } from '@/lib/site';

const stats = [
  { value: '14+', label: 'Currencies' },
  { value: '3', label: 'Gold Karats' },
  { value: '6', label: 'Days / Week' },
  { value: '1000+', label: 'Happy Clients' },
];

const features = [
  {
    icon: CurrencyDollarIcon,
    title: 'Competitive Rates',
    desc: 'Best exchange rates in Greater Vancouver. No hidden fees — the rate you see is what you get.',
  },
  {
    icon: ShieldCheckIcon,
    title: 'Licensed & Regulated',
    desc: 'Fully registered with FINTRAC and compliant with all Canadian regulations.',
  },
  {
    icon: ClockIcon,
    title: 'Fast Service',
    desc: 'Walk in, exchange, walk out. No appointments needed — most transactions under 5 minutes.',
  },
  {
    icon: BuildingStorefrontIcon,
    title: 'Walk-in Friendly',
    desc: 'Located in Coquitlam with easy access and parking. Open 6 days a week.',
  },
];

export default async function HomePage() {
  const [currencies, gold] = await Promise.all([getCurrencies(), getGoldPrices()]);
  const featured = currencies.slice(0, 6);

  return (
    <section className="py-6 lg:py-10">
      <Container>
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Hero tile */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-navy-900 via-navy-800 to-navy-900 p-8 lg:col-span-2 lg:p-12">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(212,160,74,0.12),transparent_60%)]" />
            <div className="relative">
              <span className="text-xs font-semibold uppercase tracking-[0.22em] text-gold-400">
                {site.tagline}
              </span>
              <h1 className="mt-4 text-3xl font-semibold leading-tight text-white sm:text-4xl lg:text-5xl">
                Currency exchange & gold,
                <br />
                done right in{' '}
                <span className="text-gold-400">Coquitlam</span>.
              </h1>
              <p className="mt-4 max-w-lg text-base text-navy-200">
                Live walk-in rates for major currencies and daily gold prices. Visit our location
                for in-person service from a team you can trust.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/currencies">
                  <Button className="bg-gold-500 text-white hover:bg-gold-600 dark:bg-gold-500 dark:hover:bg-gold-600">
                    See today&apos;s rates
                    <ArrowRightIcon className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button variant="ghost" className="border border-white/20 text-white hover:bg-white/10 dark:text-white dark:hover:bg-white/10">
                    Visit us
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Calculator tile */}
          <div className="rounded-2xl border border-ink-100 bg-white p-1 dark:border-dark-border dark:bg-dark-card">
            <CurrencyCalculator currencies={currencies} />
          </div>

          {/* Stats row */}
          {stats.map((s) => (
            <div
              key={s.label}
              className="flex flex-col items-center justify-center rounded-2xl border border-ink-100 bg-white px-4 py-6 dark:border-dark-border dark:bg-dark-card"
            >
              <div className="text-3xl font-bold text-gold-600 dark:text-gold-400">{s.value}</div>
              <div className="mt-1 text-sm font-medium text-ink-500 dark:text-zinc-400">{s.label}</div>
            </div>
          ))}

          {/* Rates tile */}
          <div className="rounded-2xl border border-ink-100 bg-white dark:border-dark-border dark:bg-dark-card lg:col-span-2">
            <div className="flex items-baseline justify-between px-6 pt-6 pb-2">
              <h2 className="text-lg font-semibold text-ink-900 dark:text-white">Today&apos;s rates</h2>
              <Link
                href="/currencies"
                className="text-sm font-medium text-gold-700 hover:text-gold-500 dark:text-gold-400 dark:hover:text-gold-300"
              >
                View all →
              </Link>
            </div>
            <RatesTable rows={featured} compact />
          </div>

          {/* Gold tile */}
          <div className="rounded-2xl border border-ink-100 bg-white p-6 dark:border-dark-border dark:bg-dark-card">
            <div className="mb-4 flex items-baseline justify-between">
              <h2 className="text-lg font-semibold text-ink-900 dark:text-white">Gold prices</h2>
              <Link
                href="/gold"
                className="text-sm font-medium text-gold-700 hover:text-gold-500 dark:text-gold-400 dark:hover:text-gold-300"
              >
                Details →
              </Link>
            </div>
            <GoldCards rows={gold} stacked />
          </div>

          {/* Feature tiles */}
          {features.map((f) => (
            <div
              key={f.title}
              className="group rounded-2xl border border-ink-100 bg-white p-6 transition-shadow hover:shadow-soft dark:border-dark-border dark:bg-dark-card dark:hover:border-dark-muted"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-navy-900/5 dark:bg-gold-500/10">
                <f.icon className="h-5 w-5 text-navy-700 dark:text-gold-400" />
              </div>
              <h3 className="mb-1.5 text-base font-semibold text-ink-900 dark:text-white">{f.title}</h3>
              <p className="text-sm leading-relaxed text-ink-500 dark:text-zinc-400">{f.desc}</p>
            </div>
          ))}

          {/* CTA tile */}
          <div className="rounded-2xl bg-gradient-to-r from-gold-50 to-gold-100/60 p-8 dark:from-gold-900/20 dark:to-gold-800/10 dark:border dark:border-dark-border lg:col-span-3">
            <div className="flex flex-col items-start gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-ink-900 dark:text-white">
                  Ready to exchange?
                </h2>
                <p className="mt-2 max-w-lg text-ink-600 dark:text-zinc-400">
                  Walk in — no appointment needed. Our friendly team is ready to help with
                  currency exchange, gold purchases, and jewelry.
                </p>
              </div>
              <div className="flex flex-shrink-0 gap-3">
                <Link href="/contact">
                  <Button>Get Directions</Button>
                </Link>
                <a href={`tel:${site.phone.replace(/\s/g, '')}`}>
                  <Button variant="secondary">Call Us</Button>
                </a>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
