import type { Metadata } from 'next';
import { Container, PageHeading, Card } from '@melli/ui';
import { getTranslations } from 'next-intl/server';

export const metadata: Metadata = {
  title: 'About Us',
  description: 'Learn about Melli Exchange — a trusted currency exchange and gold jewelry store serving the Coquitlam and Greater Vancouver community.',
  alternates: { canonical: '/en/about' },
};

export default async function AboutPage() {
  const t = await getTranslations('about');

  return (
    <Container className="py-14">
      <div className="flex flex-col gap-10">
        <PageHeading eyebrow={t('eyebrow')} title={t('title')} description={t('desc')} />
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="p-6 lg:col-span-2">
            <h2 className="text-2xl font-semibold text-ink-900 dark:text-white">{t('who_title')}</h2>
            <p className="mt-3 text-ink-600 dark:text-zinc-400">{t('who_p1')}</p>
            <p className="mt-3 text-ink-600 dark:text-zinc-400">{t('who_p2')}</p>
          </Card>
          <Card className="p-6">
            <h2 className="text-2xl font-semibold text-ink-900 dark:text-white">{t('what_title')}</h2>
            <ul className="mt-3 space-y-2 text-ink-600 dark:text-zinc-400">
              {(['what_1', 'what_2', 'what_3', 'what_4'] as const).map((k) => (
                <li key={k}>• {t(k)}</li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </Container>
  );
}
