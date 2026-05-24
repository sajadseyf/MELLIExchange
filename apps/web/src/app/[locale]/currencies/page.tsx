import type { Metadata } from 'next';
import { Container, PageHeading, Card } from '@melli/ui';
import { getTranslations } from 'next-intl/server';
import { RatesTable } from '@/components/RatesTable';
import { CurrencyPriceChart } from '@/components/CurrencyPriceChart';
import { getCurrencies } from '@/lib/api';

export const metadata: Metadata = {
  title: 'Live Currency Exchange Rates',
  description: 'Live CAD currency exchange rates — USD, EUR, GBP, AED, IRR and more. Updated daily at Melli Exchange in Coquitlam, BC.',
  alternates: { canonical: '/en/currencies' },
};

const today = new Date().toISOString().split('T')[0];

const webPageSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Live Currency Exchange Rates | Melli Exchange',
  url: 'https://www.melliexchange.ca/en/currencies',
  description: 'Live CAD currency exchange rates — USD, EUR, GBP, AED, IRR and more. Updated daily at Melli Exchange in Coquitlam, BC.',
  datePublished: '2023-01-01',
  dateModified: today,
  breadcrumb: {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.melliexchange.ca/en' },
      { '@type': 'ListItem', position: 2, name: 'Currency Exchange Rates', item: 'https://www.melliexchange.ca/en/currencies' },
    ],
  },
};

export default async function CurrenciesPage() {
  const [rows, t] = await Promise.all([getCurrencies(), getTranslations('currencies')]);
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

        <p className="text-xs text-ink-400 dark:text-zinc-500">
          Our rates are benchmarked against the{' '}
          <a
            href="https://www.bankofcanada.ca/rates/exchange/daily-exchange-rates/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-gold-600 dark:hover:text-gold-400"
          >
            Bank of Canada daily exchange rates
          </a>
          . For up-to-date mid-market reference rates, visit the{' '}
          <a
            href="https://www.xe.com/currencytables/?from=CAD"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-gold-600 dark:hover:text-gold-400"
          >
            XE Currency Table
          </a>
          . In-store buy/sell rates include a service spread.
        </p>
      </div>
    </Container>
  );
}
