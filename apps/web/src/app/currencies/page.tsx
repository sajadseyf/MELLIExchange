import { Container, PageHeading } from '@melli/ui';
import { RatesTable } from '@/components/RatesTable';
import { getCurrencies } from '@/lib/api';

export const metadata = {
  title: 'Currency Prices — Melli Exchange',
};

export default async function CurrenciesPage() {
  const rows = await getCurrencies();
  const updatedAt = rows[0]?.updatedAt ? new Date(rows[0].updatedAt) : null;

  return (
    <Container className="py-14">
      <div className="flex flex-col gap-8">
        <PageHeading
          eyebrow="Walk-in rates"
          title="Currency prices"
          description="Buy and sell rates against Canadian Dollar (CAD). Rates are indicative and may vary at the counter."
        />
        {updatedAt && (
          <p className="text-sm text-ink-500 dark:text-zinc-400">
            Last updated {updatedAt.toLocaleString()}
          </p>
        )}
        <RatesTable rows={rows} />
      </div>
    </Container>
  );
}
