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
    desc: 'Best exchange rates in Greater Vancouver. The rate you see is what you get.',
  },
  {
    icon: ShieldCheckIcon,
    title: 'Licensed & Regulated',
    desc: 'Fully registered with FINTRAC and compliant with Canadian regulations.',
  },
  {
    icon: ClockIcon,
    title: 'Fast Service',
    desc: 'Walk in, exchange, walk out. Most transactions under 5 minutes.',
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
    <>
      {/* Hero + Calculator */}
      <section className="py-6 lg:py-10">
        <Container>
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-navy-900 via-navy-800 to-navy-900 p-8 lg:col-span-2 lg:p-12">
              <div className="relative">
                <span className="text-xs font-semibold uppercase tracking-[0.22em] text-gold-400">
                  {site.tagline}
                </span>
                <h1 className="mt-4 text-3xl font-semibold leading-tight text-white sm:text-4xl lg:text-5xl">
                  Currency exchange & gold,
                  <br />
                  done right in <span className="text-gold-400">Coquitlam</span>.
                </h1>
                <p className="mt-4 max-w-lg text-base text-navy-200">
                  Live walk-in rates for major currencies and daily gold prices. Visit our
                  location for in-person service from a team you can trust.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link href="/currencies">
                    <Button className="bg-gold-500 text-white hover:bg-gold-600 dark:bg-gold-500 dark:hover:bg-gold-600">
                      See today&apos;s rates
                      <ArrowRightIcon className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/contact">
                    <Button
                      variant="ghost"
                      className="border border-white/20 text-white hover:bg-white/10 dark:text-white dark:hover:bg-white/10"
                    >
                      Visit us
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-navy-100 bg-gradient-to-br from-navy-50 via-white to-gold-50/60 dark:border-dark-border dark:bg-dark-card dark:from-dark-card dark:via-dark-card dark:to-dark-card">
              <CurrencyCalculator currencies={currencies} />
            </div>
          </div>
        </Container>
      </section>

      {/* Stats strip */}
      <section className="py-2">
        <Container>
          <div className="overflow-hidden rounded-2xl border border-navy-100 bg-gradient-to-br from-navy-50 via-white to-gold-50/60 dark:border-dark-border dark:bg-dark-card dark:from-dark-card dark:via-dark-card dark:to-dark-card">
            <div className="grid grid-cols-2 divide-x divide-navy-100 sm:grid-cols-4 dark:divide-dark-border">
              {stats.map((s) => (
                <div key={s.label} className="px-6 py-7 text-center">
                  <div className="text-3xl font-bold text-gold-600 dark:text-gold-400 sm:text-4xl">{s.value}</div>
                  <div className="mt-1 text-xs font-medium uppercase tracking-wider text-navy-700 dark:text-zinc-400">
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* Rates + Gold */}
      <section className="py-6 lg:py-10">
        <Container>
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border border-navy-100 bg-gradient-to-br from-navy-50 via-white to-gold-50/60 dark:border-dark-border dark:bg-dark-card dark:from-dark-card dark:via-dark-card dark:to-dark-card lg:col-span-2">
              <div className="flex items-baseline justify-between border-b border-navy-100 px-6 py-4 dark:border-dark-border">
                <div>
                  <h2 className="text-lg font-semibold text-ink-900 dark:text-white">
                    Today&apos;s rates
                  </h2>
                  <p className="text-xs text-ink-400 dark:text-zinc-500">
                    Live walk-in rates against CAD
                  </p>
                </div>
                <Link
                  href="/currencies"
                  className="text-sm font-medium text-gold-700 hover:text-gold-500 dark:text-gold-400 dark:hover:text-gold-300"
                >
                  View all →
                </Link>
              </div>
              <RatesTable rows={featured} compact />
            </div>

            <div className="relative overflow-hidden rounded-2xl border border-gold-200/60 bg-gradient-to-br from-gold-50 via-white to-gold-50/30 p-6 dark:border-gold-500/20 dark:bg-gradient-to-br dark:from-gold-900/20 dark:via-dark-card dark:to-dark-card">
              <div className="mb-5 flex items-baseline justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-ink-900 dark:text-white">
                    Gold prices
                  </h2>
                  <p className="text-xs text-ink-400 dark:text-zinc-500">Per gram, in CAD</p>
                </div>
                <Link
                  href="/gold"
                  className="text-sm font-medium text-gold-700 hover:text-gold-500 dark:text-gold-400 dark:hover:text-gold-300"
                >
                  Details →
                </Link>
              </div>
              <GoldCards rows={gold} stacked />
            </div>
          </div>
        </Container>
      </section>

      {/* Features — minimal, no boxes */}
      <section className="border-t border-ink-100 py-16 dark:border-dark-border">
        <Container>
          <div className="mb-12 max-w-2xl">
            <span className="text-xs font-semibold uppercase tracking-[0.22em] text-gold-600 dark:text-gold-400">
              Why Melli Exchange
            </span>
            <h2 className="mt-3 text-3xl font-semibold text-ink-900 dark:text-white sm:text-4xl">
              Built on trust and transparency
            </h2>
          </div>
          <div className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f, i) => (
              <div key={f.title} className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-ink-400 dark:text-zinc-500">
                    0{i + 1}
                  </span>
                  <div className="h-px flex-1 bg-ink-200 dark:bg-dark-border" />
                </div>
                <f.icon className="h-7 w-7 text-gold-600 dark:text-gold-400" strokeWidth={1.5} />
                <h3 className="text-base font-semibold text-ink-900 dark:text-white">
                  {f.title}
                </h3>
                <p className="text-sm leading-relaxed text-ink-500 dark:text-zinc-400">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* CTA */}
      <section className="pb-10">
        <Container>
          <div className="rounded-2xl border border-navy-100 bg-gradient-to-br from-navy-50 via-white to-gold-50/60 p-8 dark:border-dark-border dark:bg-dark-card dark:from-dark-card dark:via-dark-card dark:to-dark-card lg:p-10">
            <div className="flex flex-col items-start gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-ink-900 dark:text-white">
                  Ready to exchange?
                </h2>
                <p className="mt-2 max-w-lg text-ink-600 dark:text-zinc-400">
                  Walk in — no appointment needed. Our team is ready to help with currency
                  exchange, gold purchases, and jewelry.
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
        </Container>
      </section>
    </>
  );
}
