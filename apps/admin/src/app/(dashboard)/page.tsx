import { PageHeading } from '@melli/ui';
import { CompetitorRatesTable } from '@/components/CompetitorRatesTable';

export default function DashboardHomePage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeading
        eyebrow="Dashboard"
        title="Competitor Rates"
        description="Live rates from Daniel, Vanex, ArzSina, VBCE, and MoneyWay vs your rates. 🟢 Green = best for customer. 🔴 Red = worst. Updated every 30 min."
      />
      <CompetitorRatesTable />
    </div>
  );
}
