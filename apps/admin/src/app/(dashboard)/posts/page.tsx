import { PageHeading } from '@melli/ui';
import { PostsPanel } from '@/components/PostsPanel';

export default function PostsPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeading
        eyebrow="Content"
        title="Posts"
        description="Write and manage blog articles that appear on the public news page."
      />
      <PostsPanel />
    </div>
  );
}
