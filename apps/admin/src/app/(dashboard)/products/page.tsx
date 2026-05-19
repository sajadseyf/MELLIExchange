import { PageHeading } from '@melli/ui';
import { ProductsPanel } from '@/components/ProductsPanel';

export default function ProductsPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeading
        eyebrow="Inventory"
        title="Products"
        description="Manage jewelry products — prices, stock status, images, and ordering."
      />
      <ProductsPanel />
    </div>
  );
}
