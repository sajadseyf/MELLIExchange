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

const ogLocaleMap: Record<string, string> = {
  en: 'en_CA', fa: 'fa_IR', ar: 'ar_AE', zh: 'zh_CN',
};

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const locale = params.locale ?? 'en';
  const description = locale === 'fa'
    ? 'ملی اکسچنج — صرافی ارز و فروشگاه جواهرات طلا در کوکیتلام، بریتیش کلمبیا. بهترین نرخ برای دلار، یورو، پوند، درهم و بیشتر.'
    : locale === 'ar'
    ? 'ملي إكسشينج — صرافة عملات ومجوهرات ذهب موثوقة في كوكيتلام، بريتيش كولومبيا. أفضل الأسعار للدولار واليورو والجنيه والدرهم والمزيد.'
    : locale === 'zh'
    ? 'Melli Exchange — 高贵林可信赖的货币兑换和黄金珠宝商，不列颠哥伦比亚省。美元、欧元、英镑、迪拉姆等货币的最优汇率。'
    : 'Melli Exchange — trusted currency exchange and gold jewelry dealer in Coquitlam, BC. Best rates on USD, EUR, GBP, AED and more. Walk-ins welcome, open 7 days.';

  return {
    metadataBase: new URL(site.url),
    title: {
      default: `${site.name} | Currency Exchange & Gold — Coquitlam, BC`,
      template: `%s | ${site.name}`,
    },
    description,
    keywords: [
      'currency exchange Coquitlam', 'currency exchange Vancouver', 'gold dealer BC',
      'exchange rate CAD', 'buy gold Vancouver', 'gold jewelry Coquitlam',
      'FINTRAC registered currency exchange BC',
      'صرافی کوکیتلام', 'صرافی ونکوور', 'خرید طلا ونکوور', 'بهترین نرخ ارز ونکوور',
      'جواهری ایرانی ونکوور', 'صرافی معتبر کانادا',
    ],
    authors: [{ name: site.name, url: site.url }],
    creator: site.name,
    openGraph: {
      type: 'website',
      locale: ogLocaleMap[locale] ?? 'en_CA',
      url: `${site.url}/${locale}`,
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
      canonical: `${site.url}/${locale}`,
      languages: {
        'x-default': `${site.url}/en`,
        en: `${site.url}/en`,
        fa: `${site.url}/fa`,
        ar: `${site.url}/ar`,
        zh: `${site.url}/zh`,
      },
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
    },
  };
}

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
  const isRtl = locale === 'fa' || locale === 'ar';

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
              '@type': ['LocalBusiness', 'FinancialService'],
              name: site.name,
              alternateName: 'Melli Currency Exchange',
              description: 'FINTRAC-registered currency exchange and gold jewelry dealer in Coquitlam, BC, Canada. Best rates on USD, EUR, GBP, AED and more.',
              url: site.url,
              telephone: site.phones[0],
              email: site.email,
              image: `${site.url}/logo.png`,
              logo: `${site.url}/logo.png`,
              foundingDate: '2014',
              datePublished: '2014-01-01',
              dateModified: new Date().toISOString().split('T')[0],
              address: {
                '@type': 'PostalAddress',
                streetAddress: site.address.street,
                addressLocality: site.address.city,
                addressRegion: site.address.region,
                postalCode: site.address.postal,
                addressCountry: 'CA',
              },
              geo: {
                '@type': 'GeoCoordinates',
                latitude: 49.2845,
                longitude: -122.7916,
              },
              hasMap: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${site.address.street}, ${site.address.city}, ${site.address.region} ${site.address.postal}`)}`,
              openingHoursSpecification: [
                { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'], opens: '10:00', closes: '19:00' },
                { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Sunday'], opens: '10:00', closes: '17:00' },
              ],
              currenciesAccepted: 'CAD, USD, EUR, GBP, AED, IRR',
              paymentAccepted: 'Cash',
              priceRange: '$$',
              areaServed: ['Coquitlam', 'Burnaby', 'Port Moody', 'New Westminster', 'Greater Vancouver'],
              knowsLanguage: ['English', 'Persian', 'Arabic', 'Chinese'],
              sameAs: [site.url],
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
