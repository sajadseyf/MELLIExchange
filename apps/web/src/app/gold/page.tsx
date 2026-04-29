import { Container, PageHeading } from '@melli/ui';
import { GoldCards } from '@/components/GoldCards';
import { getGoldPrices } from '@/lib/api';

export const metadata = {
  title: 'Gold Price — Melli Exchange',
};

export default async function GoldPage() {
  const rows = await getGoldPrices();

  return (
    <Container className="py-14">
      <div className="flex flex-col gap-8">
        <PageHeading
          eyebrow="Daily gold"
          title="Gold prices"
          description="Per-gram pricing in Canadian Dollars for 18k, 22k, and 24k gold."
        />
        <GoldCards rows={rows} />
      </div>
    </Container>
  );
}
