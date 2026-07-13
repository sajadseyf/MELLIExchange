import { PageHeading } from '@melli/ui';
import { CompetitorRatesTable } from '@/components/CompetitorRatesTable';
import { CurrenciesPanel } from '@/components/CurrenciesPanel';

export default function CurrenciesPage() {
  return (
    <div className="flex flex-col gap-12">
      <div className="flex flex-col gap-8">
        <PageHeading
          eyebrow="Live Rates"
          title="Competitor Comparison"
          description="Live rates from Vanex, ArzSina, VBCE, Daniel, and MoneyWay vs your rates. 🟢 Green = best for customer. 🔴 Red = worst. Auto-updates every 5 min."
        />
        <CompetitorRatesTable />
      </div>

      <div className="border-t border-ink-100" />

      <div className="flex flex-col gap-8">
        <PageHeading
          eyebrow="Prices"
          title="Currencies"
          description="Update buy and sell rates for all currencies. Changes go live on the public site immediately."
        />
        <CurrenciesPanel />
      </div>
    </div>
  );
}
