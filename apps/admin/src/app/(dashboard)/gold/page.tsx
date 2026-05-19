import { PageHeading } from '@melli/ui';
import { GoldPanel } from '@/components/GoldPanel';

export default function GoldPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeading
        eyebrow="Prices"
        title="Gold"
        description="Update gold prices per gram for each karat. Changes go live on the public site immediately."
      />
      <GoldPanel />
    </div>
  );
}
