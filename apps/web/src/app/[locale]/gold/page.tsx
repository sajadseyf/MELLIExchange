import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { getGoldPrices, getCurrencies, getGoldSpotPrice } from '@/lib/api';

export const metadata: Metadata = {
  title: 'Gold Prices — 18K, 21K, 22K, 24K',
  description: 'Today\'s gold prices in CAD at Melli Exchange, Coquitlam BC. Live 18K, 21K, 22K and 24K gold rates updated daily.',
  alternates: { canonical: '/en/gold' },
};
import { LiveGoldSpot } from '@/components/LiveGoldSpot';
import { KaratCard } from '@/components/KaratCard';
import { Container, PageHeading } from '@melli/ui';

const TROY_OZ_GRAMS = 31.1035;

const KARATS = [
  { k: 24, purity: 99.9, alloy: 0.1,  color: '#FFD700', label: '24K' },
  { k: 22, purity: 91.6, alloy: 8.4,  color: '#FFC200', label: '22K' },
  { k: 18, purity: 75.0, alloy: 25.0, color: '#FFB300', label: '18K' },
  { k: 14, purity: 58.5, alloy: 41.5, color: '#E8A000', label: '14K' },
  { k: 10, purity: 41.7, alloy: 58.3, color: '#C07800', label: '10K' },
] as const;

export default async function GoldPage() {
  const [rows, currencies, spot, t] = await Promise.all([
    getGoldPrices(),
    getCurrencies(),
    getGoldSpotPrice(),
    getTranslations('gold'),
  ]);

  const usd    = currencies.find((c) => c.code === 'USD');
  const usdMid = usd ? (usd.buy + usd.sell) / 2 : null;
  const gold24 = rows.find((r) => r.karat === 24);

  const usdPerOz = spot?.priceUsd
    ?? ((gold24 && usdMid) ? (gold24.pricePerGram * TROY_OZ_GRAMS) / usdMid : null);
  const cadPerOz = spot?.priceCad
    ?? (gold24 ? gold24.pricePerGram * TROY_OZ_GRAMS : null);

  const updatedAt = spot?.recordedAt
    ? new Date(spot.recordedAt).toLocaleTimeString('en-CA', { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <Container className="py-14">
      <div className="flex flex-col gap-10">

        <PageHeading eyebrow={t('eyebrow')} title={t('title')} description={t('desc')} />

        {/* World spot banner */}
        {usdPerOz !== null && (
          <div className="flex flex-col gap-4 rounded-xl border border-gold-200 bg-gradient-to-r from-gold-50 to-amber-50 px-6 py-5 dark:border-gold-500/20 dark:from-gold-900/20 dark:to-dark-card sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 animate-pulse rounded-full bg-gold-500" />
                <p className="text-xs font-semibold uppercase tracking-widest text-gold-700 dark:text-gold-400">
                  {t('oz_label')} — Kitco
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

      </div>
    </Container>
  );
}
