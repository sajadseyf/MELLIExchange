import type { Metadata } from 'next';
import { Container, PageHeading, Card } from '@melli/ui';
import { getTranslations } from 'next-intl/server';
import { getPageMetadata } from '@/lib/seo';
import { site } from '@/lib/site';

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  return getPageMetadata('about', params.locale, '/about');
}

export default async function AboutPage({ params }: { params: { locale: string } }) {
  const locale = params.locale ?? 'en';
  const t = await getTranslations('about');

  const webPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    name: 'About Melli Exchange',
    url: `${site.url}/${locale}/about`,
    description: 'Learn about Melli Exchange — a trusted, FINTRAC-registered currency exchange and gold jewelry store in Coquitlam, BC.',
    datePublished: '2014-01-01',
    dateModified: new Date().toISOString().split('T')[0],
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${site.url}/${locale}` },
        { '@type': 'ListItem', position: 2, name: 'About Us', item: `${site.url}/${locale}/about` },
      ],
    },
  };

  return (
    <Container className="py-14">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }} />
      <div className="flex flex-col gap-10">
        <PageHeading eyebrow={t('eyebrow')} title={t('title')} description={t('desc')} />
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="p-6 lg:col-span-2">
            <h2 className="text-2xl font-semibold text-ink-900 dark:text-white">{t('who_title')}</h2>
            <p className="mt-3 text-ink-600 dark:text-zinc-400">{t('who_p1')}</p>
            <p className="mt-3 text-ink-600 dark:text-zinc-400">{t('who_p2')}</p>
            <p className="mt-4 text-sm text-ink-500 dark:text-zinc-400">
              Melli Exchange is a registered Money Services Business with{' '}
              <a
                href="https://www.fintrac-canafe.gc.ca/re-ie/reg-eng"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-gold-700 underline hover:text-gold-600 dark:text-gold-400 dark:hover:text-gold-300"
              >
                FINTRAC (Financial Transactions and Reports Analysis Centre of Canada)
              </a>
              , Canada&apos;s financial intelligence unit, in full compliance with the{' '}
              <a
                href="https://laws-lois.justice.gc.ca/eng/acts/P-24.501/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-gold-700 underline hover:text-gold-600 dark:text-gold-400 dark:hover:text-gold-300"
              >
                Proceeds of Crime (Money Laundering) and Terrorist Financing Act
              </a>
              . You can verify our MSB registration on the{' '}
              <a
                href="https://www.canada.ca/en/financial-consumer-agency/services/financial-service-providers.html"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-gold-700 underline hover:text-gold-600 dark:text-gold-400 dark:hover:text-gold-300"
              >
                Government of Canada financial service provider registry
              </a>
              .
            </p>
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
