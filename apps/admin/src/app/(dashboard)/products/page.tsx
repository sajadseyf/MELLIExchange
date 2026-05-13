import { PageHeading } from '@melli/ui';
import { ProductsPanel } from '@/components/ProductsPanel';

export default function ProductsPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeading
        eyebrow="Prices"
        title="Products"
        description="Manage jewelry and bullion product listings shown on the public site."
      />
      <ProductsPanel />
    </div>
  );
}
