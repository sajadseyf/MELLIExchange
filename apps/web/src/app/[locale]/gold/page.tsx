import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { getGoldPrices, getCurrencies, getGoldSpotPrice } from '@/lib/api';
import { getPageMetadata } from '@/lib/seo';
import { LiveGoldSpot } from '@/components/LiveGoldSpot';
import { KaratCard } from '@/components/KaratCard';
import { Container, PageHeading } from '@melli/ui';
import { site } from '@/lib/site';

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  return getPageMetadata('gold', params.locale, '/gold');
}

const TROY_OZ_GRAMS = 31.1035;

const KARATS = [
  { k: 24, purity: 99.9, alloy: 0.1,  color: '#FFD700', label: '24K' },
  { k: 22, purity: 91.6, alloy: 8.4,  color: '#FFC200', label: '22K' },
  { k: 18, purity: 75.0, alloy: 25.0, color: '#FFB300', label: '18K' },
  { k: 14, purity: 58.5, alloy: 41.5, color: '#E8A000', label: '14K' },
  { k: 10, purity: 41.7, alloy: 58.3, color: '#C07800', label: '10K' },
] as const;

export default async function GoldPage({ params }: { params: { locale: string } }) {
  const locale = params.locale ?? 'en';
  const [rows, currencies, t] = await Promise.all([
    getGoldPrices(),
    getCurrencies(),
    getTranslations('gold'),
  ]);

  // Fetch live gold spot directly from Yahoo Finance (bypasses stale DB)
  let liveSpot: { priceUsd: number; priceCad: number } | null = null;
  try {
    const apiBase = process.env.NEXT_PUBLIC_API_URL
      ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
    const r = await fetch(`${apiBase}/api/gold-spot`, { next: { revalidate: 60 } });
    if (r.ok) liveSpot = await r.json();
  } catch { /* fall through to karat-based estimate */ }

  const webPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Gold Prices — 18K, 21K, 22K, 24K | Melli Exchange',
    url: `${site.url}/${locale}/gold`,
    datePublished: '2023-01-01',
    dateModified: new Date().toISOString().split('T')[0],
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${site.url}/${locale}` },
        { '@type': 'ListItem', position: 2, name: 'Gold Prices', item: `${site.url}/${locale}/gold` },
      ],
    },
  };

  const usd    = currencies.find((c) => c.code === 'USD');
  const usdMid = usd ? (usd.buy + usd.sell) / 2 : null;
  const gold24 = rows.find((r) => r.karat === 24);

  const usdPerOz = liveSpot?.priceUsd
    ?? ((gold24 && usdMid) ? (gold24.pricePerGram * TROY_OZ_GRAMS) / usdMid : null);
  const cadPerOz = liveSpot?.priceCad
    ?? (gold24 ? gold24.pricePerGram * TROY_OZ_GRAMS : null);

  const updatedAt = liveSpot ? new Date().toLocaleTimeString('en-CA', { hour: '2-digit', minute: '2-digit' }) : null;

  return (
    <Container className="py-14">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }} />
      <div className="flex flex-col gap-10">

        <PageHeading eyebrow={t('eyebrow')} title={t('title')} description={t('desc')} />

        {/* World spot banner */}
        {usdPerOz !== null && (
          <div className="flex flex-col gap-4 rounded-xl border border-gold-200 bg-gradient-to-r from-gold-50 to-amber-50 px-6 py-5 dark:border-gold-500/20 dark:from-gold-900/20 dark:to-dark-card sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 animate-pulse rounded-full bg-gold-500" />
                <p className="text-xs font-semibold uppercase tracking-widest text-gold-700 dark:text-gold-400">
                  {t('oz_label')} —{' '}
                  <a
                    href="https://www.kitco.com/gold-price-today-usa/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline decoration-gold-500/50 hover:decoration-gold-500"
                  >
                    Kitco
                  </a>
                </p>
              </div>
              {updatedAt && (
                <p className="mt-1 text-xs text-ink-400 dark:text-zinc-500">Last updated {updatedAt}</p>
              )}
            </div>

            <div className="text-center">
              <p className="text-xs font-medium text-ink-400">USD / troy oz</p>
              <p className="text-4xl font-black tabular-nums text-ink-900 dark:text-white">
                <LiveGoldSpot initialUsd={usdPerOz} label="" />
              </p>
              {cadPerOz !== null && (
                <p className="mt-1 text-sm font-semibold tabular-nums text-ink-400 dark:text-zinc-500">
                  C${cadPerOz.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} CAD
                </p>
              )}
            </div>
          </div>
        )}

        {/* Karat cards */}
        <div>
          <h2 className="mb-6 text-xl font-bold text-ink-900 dark:text-white">
            {t('karats_title')}
          </h2>

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
            {KARATS.map(({ k, purity, alloy, color, label }) => {
              const row = rows.find((r) => r.karat === k);
              return (
                <KaratCard
                  key={k}
                  k={k}
                  purity={purity}
                  alloy={alloy}
                  color={color}
                  label={label}
                  pricePerGram={row?.pricePerGram}
                  purityLabel={t('purity')}
                  alloyLabel={t('alloy')}
                />
              );
            })}
          </div>

          <div className="mt-4 flex flex-wrap justify-center gap-6 rounded-xl border border-ink-100 bg-ink-50/60 px-6 py-4 dark:border-dark-border dark:bg-dark-raised/30">
            <span className="flex items-center gap-2 text-xs text-ink-500">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-amber-500" />
              Higher karat = purer = more valuable
            </span>
            <span className="flex items-center gap-2 text-xs text-ink-500">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-zinc-400" />
              Lower karat = harder = more wear-resistant
            </span>
          </div>
        </div>

        {/* About Our Gold Prices */}
        <div className="rounded-xl border border-ink-100 bg-ink-50/60 px-5 py-4 text-sm text-ink-600 dark:border-dark-border dark:bg-dark-raised/30 dark:text-zinc-400">
          <p className="font-medium text-ink-800 dark:text-zinc-200">About our gold prices</p>
          <p className="mt-1 leading-relaxed">
            Per-gram prices shown are Melli Exchange&apos;s in-store buy rates in Canadian dollars.
            The world spot price (USD/troy oz) is sourced live from{' '}
            <a
              href="https://www.kitco.com/gold-price-today-usa/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-gold-700 underline hover:text-gold-600 dark:text-gold-400 dark:hover:text-gold-300"
            >
              Kitco
            </a>
            , one of the most widely used precious metals price benchmarks in North America.
            According to the{' '}
            <a
              href="https://www.gold.org/goldhub/data/gold-prices"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-gold-700 underline hover:text-gold-600 dark:text-gold-400 dark:hover:text-gold-300"
            >
              World Gold Council
            </a>
            , gold is priced in USD per troy ounce globally and converted to local currencies at prevailing exchange rates.
          </p>
        </div>

      </div>
    </Container>
  );
}
