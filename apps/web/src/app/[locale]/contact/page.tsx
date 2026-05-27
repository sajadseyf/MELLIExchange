import type { Metadata } from 'next';
import { Container, PageHeading, Card } from '@melli/ui';
import { MapPinIcon, PhoneIcon, EnvelopeIcon, ClockIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { getTranslations } from 'next-intl/server';
import { site } from '@/lib/site';
import { getPageMetadata } from '@/lib/seo';

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  return getPageMetadata('contact', params.locale, '/contact');
}

export default async function ContactPage({ params }: { params: { locale: string } }) {
  const locale = params.locale ?? 'en';
  const t  = await getTranslations('contact');
  const ta = await getTranslations('about');

  const fullAddress = `${site.address.street}, ${site.address.city}, ${site.address.region} ${site.address.postal}, ${site.address.country}`;
  const mapEmbed = `https://www.google.com/maps?q=${encodeURIComponent(fullAddress)}&output=embed`;

  const contactPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: `Contact ${site.name}`,
    url: `${site.url}/${locale}/contact`,
    mainEntity: {
      '@type': ['LocalBusiness', 'FinancialService'],
      name: site.name,
      telephone: site.phones[0],
      email: site.email,
      address: {
        '@type': 'PostalAddress',
        streetAddress: site.address.street,
        addressLocality: site.address.city,
        addressRegion: site.address.region,
        postalCode: site.address.postal,
        addressCountry: 'CA',
      },
      geo: { '@type': 'GeoCoordinates', latitude: 49.2845, longitude: -122.7916 },
      openingHoursSpecification: [
        { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'], opens: '10:00', closes: '19:00' },
        { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Sunday'], opens: '10:00', closes: '17:00' },
      ],
    },
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${site.url}/${locale}` },
        { '@type': 'ListItem', position: 2, name: t('title'), item: `${site.url}/${locale}/contact` },
      ],
    },
  };

  return (
    <Container className="py-14">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(contactPageSchema) }} />
      <div className="flex flex-col gap-10">
        <PageHeading eyebrow={t('eyebrow')} title={t('title')} description={t('desc')} />

        <div className="grid gap-6 lg:grid-cols-5">
          {/* Contact details */}
          <Card className="p-6 lg:col-span-2">
            <ul className="space-y-5">
              <li className="flex gap-3">
                <MapPinIcon className="mt-0.5 h-5 w-5 flex-none text-gold-600 dark:text-gold-400" />
                <div>
                  <p className="font-medium text-ink-900 dark:text-white">{t('address')}</p>
                  <p className="text-sm text-ink-600 dark:text-zinc-400">
                    {site.address.street}<br />
                    {site.address.city}, {site.address.region} {site.address.postal}<br />
                    {site.address.country}
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <PhoneIcon className="mt-0.5 h-5 w-5 flex-none text-gold-600 dark:text-gold-400" />
                <div>
                  <p className="font-medium text-ink-900 dark:text-white">{t('phone')}</p>
                  {site.phones.map((p) => (
                    <a key={p} href={`tel:${p.replace(/\D/g, '')}`} className="block text-sm text-ink-600 hover:text-gold-600 dark:text-zinc-400 dark:hover:text-gold-400">
                      {p}
                    </a>
                  ))}
                </div>
              </li>
              <li className="flex gap-3">
                <EnvelopeIcon className="mt-0.5 h-5 w-5 flex-none text-gold-600 dark:text-gold-400" />
                <div>
                  <p className="font-medium text-ink-900 dark:text-white">{t('email')}</p>
                  <a href={`mailto:${site.email}`} className="text-sm text-ink-600 hover:text-gold-600 dark:text-zinc-400 dark:hover:text-gold-400">
                    {site.email}
                  </a>
                </div>
              </li>
              <li className="flex gap-3">
                <ClockIcon className="mt-0.5 h-5 w-5 flex-none text-gold-600 dark:text-gold-400" />
                <div>
                  <p className="font-medium text-ink-900 dark:text-white">{t('hours')}</p>
                  <ul className="text-sm text-ink-600 dark:text-zinc-400">
                    {site.hours.map((h) => (
                      <li key={h.days}>
                        <span className="text-ink-700 dark:text-zinc-300">{h.days}</span> · {h.time}
                      </li>
                    ))}
                  </ul>
                </div>
              </li>
            </ul>
          </Card>

          {/* Map */}
          <Card className="overflow-hidden lg:col-span-3">
            <iframe src={mapEmbed} title="Map" className="h-full min-h-[420px] w-full border-0" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
          </Card>
        </div>

        {/* Services list — gives Google meaningful locale-specific body content */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <SparklesIcon className="h-5 w-5 text-gold-600 dark:text-gold-400" />
            <h2 className="text-lg font-semibold text-ink-900 dark:text-white">{ta('what_title')}</h2>
          </div>
          <ul className="grid gap-2 sm:grid-cols-2 text-sm text-ink-600 dark:text-zinc-400">
            {(['what_1', 'what_2', 'what_3', 'what_4'] as const).map((k) => (
              <li key={k} className="flex items-start gap-2">
                <span className="mt-0.5 h-1.5 w-1.5 flex-none rounded-full bg-gold-500" />
                {ta(k)}
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </Container>
  );
}
