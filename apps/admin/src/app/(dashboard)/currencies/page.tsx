import { PageHeading } from '@melli/ui';
import { CurrenciesPanel } from '@/components/CurrenciesPanel';

export default function CurrenciesPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeading
        eyebrow="Prices"
        title="Currencies"
        description="Update buy and sell rates for all currencies. Changes go live on the public site immediately."
      />
      <CurrenciesPanel />
    </div>
  );
}
