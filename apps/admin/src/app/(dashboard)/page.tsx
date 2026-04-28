import { CurrenciesPanel } from '@/components/CurrenciesPanel';
import { GoldPanel } from '@/components/GoldPanel';
import { PageHeading } from '@melli/ui';

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-10">
      <PageHeading
        eyebrow="Dashboard"
        title="Manage prices"
        description="Update buy and sell rates for currencies and gold prices. Changes are live on the public site immediately."
      />
      <CurrenciesPanel />
      <GoldPanel />
    </div>
  );
}
