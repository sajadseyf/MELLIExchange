import { Container, PageHeading, Card } from '@melli/ui';
import { getTranslations } from 'next-intl/server';
import { RatesTable } from '@/components/RatesTable';
import { CurrencyPriceChart } from '@/components/CurrencyPriceChart';
import { getCurrencies } from '@/lib/api';

export default async function CurrenciesPage() {
  const [rows, t] = await Promise.all([getCurrencies(), getTranslations('currencies')]);
  const updatedAt = rows[0]?.updatedAt ? new Date(rows[0].updatedAt) : null;

  return (
    <Container className="py-14">
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
      </div>
    </Container>
  );
}
