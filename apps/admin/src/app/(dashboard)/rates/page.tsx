import { PageHeading } from '@melli/ui';
import { CompetitorRatesTable } from '@/components/CompetitorRatesTable';

export default function RatesPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeading
        eyebrow="Live Rates"
        title="Competitor Comparison"
        description="Live rates from Vanex, ArzSina, and VBCE vs your rates. 🟢 Green = best for customer. 🔴 Red = worst. Updated every 30 min."
      />
      <CompetitorRatesTable />
    </div>
  );
}
