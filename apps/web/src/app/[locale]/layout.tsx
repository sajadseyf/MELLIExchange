import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import '../globals.css';
import { TopBar } from '@/components/TopBar';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { site } from '@/lib/site';

const description = 'Melli Exchange — trusted currency exchange and gold jewelry dealer in Coquitlam, BC. Best rates on USD, EUR, GBP, AED and more. Walk-ins welcome.';

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} | Currency Exchange & Gold — Coquitlam, BC`,
    template: `%s | ${site.name}`,
  },
  description,
  keywords: [
    'currency exchange Coquitlam', 'currency exchange Vancouver', 'gold dealer BC',
    'exchange rate CAD', 'buy USD Canada', 'gold jewelry Coquitlam',
    'صرافی کوکیتلام', 'صرافی ونکوور', 'خرید و فروش ارز',
  ],
  authors: [{ name: site.name, url: site.url }],
  creator: site.name,
  openGraph: {
    type: 'website',
    locale: 'en_CA',
    url: site.url,
    siteName: site.name,
    title: `${site.name} | Currency Exchange & Gold`,
    description,
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: site.name }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${site.name} | Currency Exchange & Gold`,
    description,
  },
  alternates: {
    canonical: site.url,
    languages: {
      'en': `${site.url}/en`,
      'fa': `${site.url}/fa`,
      'zh': `${site.url}/zh`,
    },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const { locale } = params;

  if (!(routing.locales as readonly string[]).includes(locale)) {
    notFound();
  }

  const messages = await getMessages();
  const isRtl = locale === 'fa';

  return (
    <html lang={locale} dir={isRtl ? 'rtl' : 'ltr'} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Vazirmatn:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme:dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}})()`,
          }}
        />
      </head>
      <body className="flex min-h-screen flex-col bg-white text-ink-800 dark:bg-dark dark:text-zinc-100">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'LocalBusiness',
              name: site.name,
              description: 'Currency exchange and gold jewelry dealer in Coquitlam, BC, Canada.',
              url: site.url,
              telephone: site.phones,
              email: site.email,
              address: {
                '@type': 'PostalAddress',
                streetAddress: site.address.street,
                addressLocality: site.address.city,
                addressRegion: site.address.region,
                postalCode: site.address.postal,
                addressCountry: 'CA',
              },
              openingHoursSpecification: [
                { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday','Tuesday','Wednesday','Thursday','Friday'], opens: '09:30', closes: '19:00' },
                { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Saturday'], opens: '10:00', closes: '18:00' },
              ],
              currenciesAccepted: 'CAD, USD, EUR, GBP, AED',
              priceRange: '$$',
              sameAs: [`${site.url}/en`],
            }),
          }}
        />
        <NextIntlClientProvider messages={messages}>
          <TopBar />
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
