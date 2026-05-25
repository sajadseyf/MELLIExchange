import type { Metadata } from 'next';
import { Container, PageHeading, Card } from '@melli/ui';
import { getTranslations } from 'next-intl/server';
import { RatesTable } from '@/components/RatesTable';
import { CurrencyPriceChart } from '@/components/CurrencyPriceChart';
import { getCurrencies } from '@/lib/api';
import { getPageMetadata } from '@/lib/seo';
import { site } from '@/lib/site';

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  return getPageMetadata('currencies', params.locale, '/currencies');
}

export default async function CurrenciesPage({ params }: { params: { locale: string } }) {
  const locale = params.locale ?? 'en';
  const [rows, t] = await Promise.all([getCurrencies(), getTranslations('currencies')]);

  const webPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Live Currency Exchange Rates | Melli Exchange',
    url: `${site.url}/${locale}/currencies`,
    datePublished: '2023-01-01',
    dateModified: new Date().toISOString().split('T')[0],
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${site.url}/${locale}` },
        { '@type': 'ListItem', position: 2, name: 'Currency Exchange Rates', item: `${site.url}/${locale}/currencies` },
      ],
    },
  };
  const updatedAt = rows[0]?.updatedAt ? new Date(rows[0].updatedAt) : null;

  return (
    <Container className="py-14">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }} />
      <div className="flex flex-col gap-8">
        <div>
          <PageHeading eyebrow={t('eyebrow')} title={t('title')} description={t('desc')} />
          {updatedAt && (
            <p className="mt-2 text-sm text-ink-500 dark:text-zinc-400">
              {t('last_updated')} {updatedAt.toLocaleString()}
            </p>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <RatesTable rows={rows} />
          </div>
          <div className="lg:col-span-2">
            <Card className="p-6 lg:sticky lg:top-24">
              <CurrencyPriceChart currencies={rows} />
            </Card>
          </div>
        </div>

        <div className="rounded-xl border border-ink-100 bg-ink-50/60 px-5 py-4 text-sm text-ink-600 dark:border-dark-border dark:bg-dark-raised/30 dark:text-zinc-400">
          <p className="font-medium text-ink-800 dark:text-zinc-200">About our exchange rates</p>
          <p className="mt-1 leading-relaxed">
            Our buy and sell rates are updated daily and benchmarked against the{' '}
            <a
              href="https://www.bankofcanada.ca/rates/exchange/daily-exchange-rates/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-gold-700 underline hover:text-gold-600 dark:text-gold-400 dark:hover:text-gold-300"
            >
              Bank of Canada daily exchange rates
            </a>
            . For a mid-market reference, see the{' '}
            <a
              href="https://www.xe.com/currencytables/?from=CAD"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-gold-700 underline hover:text-gold-600 dark:text-gold-400 dark:hover:text-gold-300"
            >
              XE Currency Table
            </a>
            . In-store rates include a service spread and may differ from interbank rates.
          </p>
          <p className="mt-2 leading-relaxed">
            Travelling with cash? Under{' '}
            <a
              href="https://www.canada.ca/en/border-services-agency/services/cross-border-currency-report.html"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-gold-700 underline hover:text-gold-600 dark:text-gold-400 dark:hover:text-gold-300"
            >
              Canadian border rules
            </a>
            , travellers must report any amount of CAD $10,000 or more (or its equivalent in foreign currency) when entering or leaving the country.
          </p>
        </div>
      </div>
    </Container>
  );
}
