import { PageHeading } from '@melli/ui';
import { AdminChartsPanel } from '@/components/AdminChartsPanel';

export default function ChartsPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeading
        eyebrow="Charts"
        title="Rate History"
        description="Historical view of your own exchange rates and precious metals. Data from your database only."
      />
      <AdminChartsPanel />
    </div>
  );
}
