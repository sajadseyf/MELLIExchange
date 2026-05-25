import type { Metadata } from 'next';
import { Container, PageHeading } from '@melli/ui';
import { getTranslations } from 'next-intl/server';
import { ProductGrid } from '@/components/ProductGrid';
import { getProducts } from '@/lib/api';
import { getPageMetadata } from '@/lib/seo';

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  return getPageMetadata('products', params.locale, '/products');
}

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
