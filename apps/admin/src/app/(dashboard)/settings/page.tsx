import { PageHeading } from '@melli/ui';
import { SettingsPanel } from '@/components/SettingsPanel';
import { AlertsConfig } from '@/components/AlertsConfig';
import { PostsPanel } from '@/components/PostsPanel';

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-10">
      <PageHeading
        eyebrow="Settings"
        title="Configuration"
        description="Rate sources, spread, alerts, and content management."
      />
      <SettingsPanel />
      <AlertsConfig />
      <PostsPanel />
    </div>
  );
}
