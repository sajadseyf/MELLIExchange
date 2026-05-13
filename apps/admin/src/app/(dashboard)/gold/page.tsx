import { PageHeading } from '@melli/ui';
import { GoldPanel } from '@/components/GoldPanel';

export default function GoldPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeading
        eyebrow="Prices"
        title="Gold & Karats"
        description="Update gold prices per gram for 14K, 18K, 22K and 24K. Changes are live immediately."
      />
      <GoldPanel />
    </div>
  );
}
