import Link from 'next/link';
import { ArrowRightIcon, MapPinIcon } from '@heroicons/react/24/outline';
import { Button, Container, PageHeading } from '@melli/ui';
import { getCurrencies, getGoldPrices } from '@/lib/api';
import { RatesTable } from '@/components/RatesTable';
import { GoldCards } from '@/components/GoldCards';
import { site } from '@/lib/site';

export default async function HomePage() {
  const [currencies, gold] = await Promise.all([getCurrencies(), getGoldPrices()]);
  const featured = currencies.slice(0, 6);

  return (
    <>
      <section className="border-b border-ink-100 bg-gradient-to-b from-cream to-white">
        <Container className="grid gap-10 py-16 lg:grid-cols-2 lg:py-24">
          <div className="flex flex-col justify-center gap-6">
            <span className="text-xs font-semibold uppercase tracking-[0.22em] text-gold-600">
              {site.tagline}
            </span>
            <h1 className="font-serif text-4xl text-ink-900 sm:text-5xl lg:text-6xl">
              Currency exchange & gold,<br />
              done right in <span className="text-gold-600">Coquitlam</span>.
            </h1>
            <p className="max-w-lg text-base text-ink-500">
              Live walk-in rates for major currencies and daily gold prices. Visit our location for in-person service from a team you can trust.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/currencies">
                <Button>
                  See today's rates
                  <ArrowRightIcon className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/contact">
                <Button variant="secondary">
                  <MapPinIcon className="h-4 w-4" />
                  Visit us
                </Button>
              </Link>
            </div>
          </div>
          <div className="rounded-xl2 border border-ink-100 bg-white p-6 shadow-soft">
            <div className="mb-4 flex items-baseline justify-between">
              <h2 className="font-serif text-xl text-ink-900">Today's rates</h2>
              <Link href="/currencies" className="text-sm font-medium text-gold-700 hover:text-gold-500">
                View all →
              </Link>
            </div>
            <RatesTable rows={featured} compact />
          </div>
        </Container>
      </section>

      <section className="py-16">
        <Container className="flex flex-col gap-8">
          <PageHeading
            eyebrow="Gold"
            title="Daily gold prices"
            description="Per-gram prices for 18k, 22k, and 24k gold, updated by our team."
          />
          <GoldCards rows={gold} />
        </Container>
      </section>
    </>
  );
}
