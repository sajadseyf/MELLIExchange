import { PageHeading } from '@melli/ui';
import { FaqPanel } from '@/components/FaqPanel';

export default function FaqPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeading
        eyebrow="Content"
        title="FAQ"
        description="Manage the frequently asked questions shown on the public site. Drag to reorder, toggle visibility per item."
      />
      <FaqPanel />
    </div>
  );
}
