import { PageHeading } from '@melli/ui';
import { NewsAnalysisPanel } from '@/components/NewsAnalysisPanel';

export default function NewsPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeading
        eyebrow="Market Watch"
        title="News & Analysis"
        description="Live FX and gold market news from FXStreet and Kitco. Updated every 15 minutes."
      />
      <NewsAnalysisPanel />
    </div>
  );
}
