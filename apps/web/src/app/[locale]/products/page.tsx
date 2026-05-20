import type { Metadata } from 'next';
import { Container, PageHeading } from '@melli/ui';
import { getTranslations } from 'next-intl/server';
import { ProductGrid } from '@/components/ProductGrid';
import { getProducts } from '@/lib/api';

export const metadata: Metadata = {
  title: 'Gold Jewelry & Products',
  description: 'Shop gold jewelry and investment products at Melli Exchange in Coquitlam, BC. Rings, necklaces, coins, and bullion at competitive prices.',
  alternates: { canonical: '/en/products' },
};

export default async function ProductsPage() {
  const [products, t] = await Promise.all([
    getProducts(),
    getTranslations('products'),
  ]);

  return (
    <Container className="py-14">
      <div className="flex flex-col gap-8">
        <PageHeading eyebrow={t('eyebrow')} title={t('title')} description={t('desc')} />
        <ProductGrid products={products} />
      </div>
    </Container>
  );
}
