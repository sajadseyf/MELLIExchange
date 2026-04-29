import { Container, PageHeading, Card } from '@melli/ui';
import { site } from '@/lib/site';

export const metadata = {
  title: 'About Us — Melli Exchange',
};

export default function AboutPage() {
  return (
    <Container className="py-14">
      <div className="flex flex-col gap-10">
        <PageHeading
          eyebrow="About"
          title={`About ${site.name}`}
          description="A Coquitlam-based currency exchange and gold dealer serving the Greater Vancouver community."
        />
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="p-6 lg:col-span-2">
            <h2 className="text-2xl font-semibold text-ink-900 dark:text-white">Who we are</h2>
            <p className="mt-3 text-ink-600 dark:text-zinc-400">
              Melli Exchange offers competitive walk-in rates for major world currencies and trusted, transparent
              pricing for gold. We focus on personal service — every customer is greeted by a real person who knows
              the market and is ready to answer questions.
            </p>
            <p className="mt-3 text-ink-600 dark:text-zinc-400">
              Our location in Coquitlam serves the Tri-Cities area, with easy access for Burnaby, Port Moody, and Greater Vancouver
              clients. Stop by during business hours — no appointment necessary.
            </p>
          </Card>
          <Card className="p-6">
            <h2 className="text-2xl font-semibold text-ink-900 dark:text-white">What we do</h2>
            <ul className="mt-3 space-y-2 text-ink-600 dark:text-zinc-400">
              <li>• Foreign currency exchange (USD, EUR, GBP, AED, IRR, and more)</li>
              <li>• Gold sale and purchase (18k, 22k, 24k)</li>
              <li>• In-person consultation</li>
              <li>• Daily-updated walk-in rates</li>
            </ul>
          </Card>
        </div>
      </div>
    </Container>
  );
}
