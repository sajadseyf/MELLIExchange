import {
  ArrowRightIcon,
  ShieldCheckIcon,
  CurrencyDollarIcon,
  ClockIcon,
  BuildingStorefrontIcon,
} from '@heroicons/react/24/outline';
import { getTranslations } from 'next-intl/server';
import Image from 'next/image';
import { Button, Container } from '@melli/ui';
import { getCurrencies, getGoldPrices, getGoldSpotPrice } from '@/lib/api';
import { RatesTable } from '@/components/RatesTable';
import { GoldCards } from '@/components/GoldCards';
import { CurrencyCalculator } from '@/components/CurrencyCalculator';
import { LiveGoldSpot } from '@/components/LiveGoldSpot';
import { Link } from '@/i18n/navigation';
import { site } from '@/lib/site';

const orgSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: site.name,
  url: site.url,
  logo: `${site.url}/logo.png`,
  description: 'Melli Exchange is a FINTRAC-registered currency exchange and gold jewelry dealer serving Coquitlam and Greater Vancouver, BC, Canada.',
  foundingDate: '2014',
  datePublished: '2014-01-01',
  dateModified: new Date().toISOString().split('T')[0],
  address: {
    '@type': 'PostalAddress',
    streetAddress: site.address.street,
    addressLocality: site.address.city,
    addressRegion: site.address.region,
    postalCode: site.address.postal,
    addressCountry: 'CA',
  },
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: site.phones[0],
    contactType: 'customer service',
    availableLanguage: ['English', 'Persian', 'Arabic', 'Chinese'],
  },
  sameAs: [site.url],
};

const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: site.name,
  url: site.url,
  description: 'Live currency exchange rates and gold prices at Melli Exchange, Coquitlam BC.',
  datePublished: '2014-01-01',
  dateModified: new Date().toISOString().split('T')[0],
  potentialAction: {
    '@type': 'SearchAction',
    target: `${site.url}/en/currencies`,
    'query-input': 'required name=currency',
  },
};

const TROY_OZ_GRAMS = 31.1035;

export default async function HomePage() {
  const [currencies, gold, spot, t] = await Promise.all([
    getCurrencies(),
    getGoldPrices(),
    getGoldSpotPrice(),
    getTranslations('home'),
  ]);
  const featured = currencies.slice(0, 6);

  // Use Kitco spot price directly; fall back to back-calculation only if spot is unavailable
  const gold24  = gold.find((r) => r.karat === 24);
  const usd     = currencies.find((c) => c.code === 'USD');
  const usdMid  = usd ? (usd.buy + usd.sell) / 2 : null;
  const usdPerOz = spot?.priceUsd
    ?? ((gold24 && usdMid) ? (gold24.pricePerGram * TROY_OZ_GRAMS) / usdMid : null);

  const stats = [
    { value: '14+', label: t('stat_currencies') },
    { value: '3',   label: t('stat_karats') },
    { value: '7',   label: t('stat_days') },
    { value: '10+',   label: t('stat_years') },
  ];

  const features = [
    { icon: CurrencyDollarIcon, title: t('f1_title'), desc: t('f1_desc') },
    { icon: ShieldCheckIcon,    title: t('f2_title'), desc: t('f2_desc') },
    { icon: ClockIcon,          title: t('f3_title'), desc: t('f3_desc') },
    { icon: BuildingStorefrontIcon, title: t('f4_title'), desc: t('f4_desc') },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }} />
      {/* Hero + Calculator */}
      <section className="py-6 lg:py-10">
        <Container>
          <div className="grid gap-4 lg:grid-cols-3">

            {/* Hero card */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-navy-900 via-navy-800 to-navy-700 lg:col-span-2">

              {/* Mobile: full-bleed background image with dark overlay */}
              <div className="absolute inset-0 lg:hidden">
                <Image
                  src="https://images.unsplash.com/photo-1610375461246-83df859d849d"
                  alt=""
                  fill
                  className="object-cover object-center"
                  sizes="100vw"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-navy-900/80" />
              </div>

              {/* Decorative glows */}
              <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-gold-500/10 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-20 -left-10 h-48 w-48 rounded-full bg-gold-400/5 blur-2xl" />

              {/* Desktop: side-by-side; mobile: stacked */}
              <div className="relative flex h-full flex-col lg:flex-row">

                {/* Left: text content */}
                <div className="flex flex-col justify-between gap-10 p-8 lg:w-[58%] lg:p-12">
                  <div>
                    {/* Eyebrow */}
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-1.5 w-1.5 rounded-full bg-gold-400" />
                      <span className="text-xs font-medium uppercase tracking-[0.2em] text-gold-400/80">
                        {t('hero_eyebrow')}
                      </span>
                    </div>

                    {/* Headline */}
                    <h1 className="mt-5 text-3xl font-bold leading-[1.15] text-white sm:text-4xl lg:text-5xl">
                      {t('hero_title')}
                    </h1>

                    {/* Description */}
                    <p className="mt-5 max-w-md text-base leading-relaxed text-navy-200/80">
                      {t('hero_desc')}
                    </p>

                    {/* CTAs */}
                    <div className="mt-8 flex flex-wrap items-center gap-3">
                      <Link href="/currencies">
                        <button className="inline-flex items-center gap-2 rounded-xl bg-gold-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-gold-900/30 transition-all hover:bg-gold-400 hover:shadow-gold-800/40 active:scale-95">
                          {t('see_rates')}
                          <ArrowRightIcon className="h-4 w-4" />
                        </button>
                      </Link>
                      <Link href="/contact">
                        <button className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-5 py-3 text-sm font-medium text-white/80 transition-all hover:border-white/30 hover:bg-white/5 hover:text-white active:scale-95">
                          {t('visit_us')}
                        </button>
                      </Link>
                    </div>
                  </div>

                  {/* Bottom trust strip */}
                  <div className="flex flex-wrap items-center gap-4 border-t border-white/10 pt-5">
                    <div className="flex items-center gap-1.5 text-xs text-white/50">
                      <ShieldCheckIcon className="h-4 w-4 text-gold-400" />
                      <a
                        href="https://www.fintrac-canafe.gc.ca/re-ie/reg-eng"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline decoration-white/30 hover:text-white hover:decoration-white/60"
                      >
                        FINTRAC Licensed
                      </a>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-white/50">
                      <CurrencyDollarIcon className="h-4 w-4 text-gold-400" />
                      <span>{t('hero_badge')}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-white/50">
                      <ClockIcon className="h-4 w-4 text-gold-400" />
                      <span>Open 7 days / week</span>
                    </div>
                  </div>
                </div>

                {/* Right: image panel (desktop only) */}
                <div className="relative hidden flex-1 lg:block">
                  <Image
                    src="https://images.unsplash.com/photo-1610375461246-83df859d849d"
                    alt="Gold bars — premium currency exchange"
                    fill
                    className="object-cover object-center"
                    sizes="(min-width: 1024px) 35vw, 0px"
                    priority
                  />
                  {/* Blend left edge into navy card */}
                  <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-navy-800/95 to-transparent" />
                  {/* Warm gold tint */}
                  <div className="absolute inset-0 bg-gold-900/15 mix-blend-multiply" />
                </div>

              </div>
            </div>

            {/* Calculator */}
            <div className="rounded-2xl border border-navy-100 bg-gradient-to-br from-navy-50 via-white to-gold-50/60 dark:border-dark-border dark:bg-dark-card dark:from-dark-card dark:via-dark-card dark:to-dark-card">
              <CurrencyCalculator currencies={currencies} />
            </div>
          </div>
        </Container>
      </section>

      {/* Stats */}
      <section className="py-2">
        <Container>
          <div className="overflow-hidden rounded-2xl border border-navy-100 bg-gradient-to-br from-navy-50 via-white to-gold-50/60 dark:border-dark-border dark:bg-dark-card dark:from-dark-card dark:via-dark-card dark:to-dark-card">
            <div className="grid grid-cols-2 divide-x divide-navy-100 sm:grid-cols-4 dark:divide-dark-border">
              {stats.map((s) => (
                <div key={s.label} className="px-6 py-7 text-center">
                  <div className="text-3xl font-bold text-gold-600 dark:text-gold-400 sm:text-4xl">{s.value}</div>
                  <div className="mt-1 text-xs font-medium uppercase tracking-wider text-navy-700 dark:text-zinc-400">{s.label}</div>
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
                  <h2 className="text-lg font-semibold text-ink-900 dark:text-white">{t('rates_title')}</h2>
                  <p className="text-xs text-ink-400 dark:text-zinc-500">{t('rates_sub')}</p>
                </div>
                <Link href="/currencies" className="text-sm font-medium text-gold-700 hover:text-gold-500 dark:text-gold-400 dark:hover:text-gold-300">
                  {t('view_all')}
                </Link>
              </div>
              <RatesTable rows={featured} compact />
              <p className="border-t border-navy-100 px-6 py-3 text-xs text-ink-400 dark:border-dark-border dark:text-zinc-500">
                Rates benchmarked against the{' '}
                <a
                  href="https://www.bankofcanada.ca/rates/exchange/daily-exchange-rates/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-gold-600 dark:hover:text-gold-400"
                >
                  Bank of Canada
                </a>
                . In-store rates include a service spread.
              </p>
            </div>

            <div className="relative overflow-hidden rounded-2xl border border-gold-200/60 bg-gradient-to-br from-gold-50 via-white to-gold-50/30 p-6 dark:border-gold-500/20 dark:bg-gradient-to-br dark:from-gold-900/20 dark:via-dark-card dark:to-dark-card">
              <div className="mb-5 flex items-baseline justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-ink-900 dark:text-white">{t('gold_title')}</h2>
                  <p className="text-xs text-ink-400 dark:text-zinc-500">{t('gold_sub')}</p>
                </div>
                <Link href="/gold" className="text-sm font-medium text-gold-700 hover:text-gold-500 dark:text-gold-400 dark:hover:text-gold-300">
                  {t('gold_details')}
                </Link>
              </div>

              {usdPerOz !== null && (
                <div className="mb-4 rounded-lg border border-gold-200 bg-gold-100/60 dark:border-gold-500/20 dark:bg-gold-900/20">
                  <div className="flex items-center justify-between px-4 py-2.5">
                    <span className="text-xs font-semibold uppercase tracking-wider text-gold-700 dark:text-gold-400">
                      {t('oz_label')}
                    </span>
                    <LiveGoldSpot initialUsd={usdPerOz} label="USD/oz" />
                  </div>
                  <p className="border-t border-gold-200/60 px-4 pb-2 pt-1.5 text-[10px] text-gold-600/70 dark:border-gold-500/10 dark:text-gold-400/50">
                    Spot price via{' '}
                    <a
                      href="https://www.kitco.com/gold-price-today-usa/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-gold-700 dark:hover:text-gold-300"
                    >
                      Kitco
                    </a>
                  </p>
                </div>
              )}

              <GoldCards rows={gold} stacked />
            </div>
          </div>
        </Container>
      </section>

      {/* Features */}
      <section className="border-t border-ink-100 py-16 dark:border-dark-border">
        <Container>
          <div className="mb-12 max-w-2xl">
            <span className="text-xs font-semibold uppercase tracking-[0.22em] text-gold-600 dark:text-gold-400">
              {t('why_eyebrow')}
            </span>
            <h2 className="mt-3 text-3xl font-semibold text-ink-900 dark:text-white sm:text-4xl">
              {t('why_title')}
            </h2>
          </div>
          <div className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f, i) => (
              <div key={f.title} className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-ink-400 dark:text-zinc-500">0{i + 1}</span>
                  <div className="h-px flex-1 bg-ink-200 dark:bg-dark-border" />
                </div>
                <f.icon className="h-7 w-7 text-gold-600 dark:text-gold-400" strokeWidth={1.5} />
                <h3 className="text-base font-semibold text-ink-900 dark:text-white">{f.title}</h3>
                <p className="text-sm leading-relaxed text-ink-500 dark:text-zinc-400">{f.desc}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Best Rate Guarantee */}
      <section className="py-6 lg:py-8">
        <Container>
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gold-600 via-gold-500 to-amber-500 p-8 shadow-lg lg:p-12">
            {/* subtle background pattern */}
            <div className="pointer-events-none absolute inset-0 opacity-10"
              style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

            <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-col gap-4">
                {/* Badge */}
                <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/40 bg-white/20 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-white backdrop-blur-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                  </svg>
                  {t('guarantee_badge')}
                </span>

                <h2 className="max-w-xl text-2xl font-bold leading-snug text-white sm:text-3xl">
                  {t('guarantee_title')}
                </h2>
                <p className="max-w-lg text-sm leading-relaxed text-white/85">
                  {t('guarantee_desc')}
                </p>
              </div>

              <div className="flex flex-shrink-0 flex-col items-start gap-3 lg:items-end">
                <Link href="/currencies">
                  <button className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-gold-700 shadow-md transition-all hover:bg-gold-50 active:scale-95">
                    {t('guarantee_cta')}
                    <ArrowRightIcon className="h-4 w-4" />
                  </button>
                </Link>
                {/* Trophy icon */}
                <div className="flex items-center gap-2 text-white/70 text-xs">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0" />
                  </svg>
                  Beat our rate → get a gift
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* CTA */}
      <section className="pb-10">
        <Container>
          <div className="rounded-2xl border border-navy-100 bg-gradient-to-br from-navy-50 via-white to-gold-50/60 p-8 dark:border-dark-border dark:bg-dark-card dark:from-dark-card dark:via-dark-card dark:to-dark-card lg:p-10">
            <div className="flex flex-col items-start gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-ink-900 dark:text-white">{t('cta_title')}</h2>
                <p className="mt-2 max-w-lg text-ink-600 dark:text-zinc-400">{t('cta_desc')}</p>
              </div>
              <div className="flex flex-shrink-0 gap-3">
                <Link href="/contact"><Button>{t('get_directions')}</Button></Link>
                <a href={`tel:${(site.phones[0] ?? '').replace(/\D/g, '')}`}><Button variant="secondary">{t('call_us')}</Button></a>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
