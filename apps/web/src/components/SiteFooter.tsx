import { getTranslations } from 'next-intl/server';
import { Container, LogoMark } from '@melli/ui';
import { MapPinIcon, PhoneIcon, EnvelopeIcon, ClockIcon } from '@heroicons/react/24/outline';
import { Link } from '@/i18n/navigation';
import { site } from '@/lib/site';

export async function SiteFooter() {
  const t = await getTranslations('footer');
  const tNav = await getTranslations('nav');

  return (
    <footer className="bg-navy-900 text-navy-100 dark:bg-dark-card dark:border-t dark:border-dark-border">
      <Container className="grid gap-10 py-14 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="mb-4 flex items-center gap-3">
            <LogoMark size={48} />
            <div>
              <p className="text-lg font-semibold text-white">{site.name}</p>
              <p className="text-xs uppercase tracking-[0.18em] text-gold-400">{site.tagline}</p>
            </div>
          </div>
          <p className="max-w-md text-sm text-navy-200 dark:text-zinc-400">{t('desc')}</p>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gold-400">{t('visit_us')}</h4>
          <ul className="space-y-3 text-sm text-navy-200 dark:text-zinc-400">
            <li className="flex gap-2">
              <MapPinIcon className="mt-0.5 h-4 w-4 flex-none text-gold-400" />
              <span>{site.address.street}<br />{site.address.city}, {site.address.region} {site.address.postal}</span>
            </li>
            {site.phones.map((p) => (
              <li key={p} className="flex items-center gap-2">
                <PhoneIcon className="h-4 w-4 flex-none text-gold-400" />
                <a href={`tel:${p.replace(/\D/g, '')}`} className="hover:text-gold-300">{p}</a>
              </li>
            ))}
            <li className="flex items-center gap-2">
              <EnvelopeIcon className="h-4 w-4 flex-none text-gold-400" />
              <a href={`mailto:${site.email}`} className="hover:text-gold-300">{site.email}</a>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gold-400">{t('hours')}</h4>
          <ul className="space-y-2 text-sm text-navy-200 dark:text-zinc-400">
            {site.hours.map((h) => (
              <li key={h.days} className="flex items-center gap-2">
                <ClockIcon className="h-4 w-4 flex-none text-gold-400" />
                <span><span className="text-white dark:text-zinc-200">{h.days}</span> · {h.time}</span>
              </li>
            ))}
          </ul>
          <div className="mt-5 flex flex-col gap-2 text-sm">
            <Link href="/currencies" className="text-navy-200 hover:text-gold-300 dark:text-zinc-400 dark:hover:text-gold-300">{tNav('currencies')}</Link>
            <Link href="/gold" className="text-navy-200 hover:text-gold-300 dark:text-zinc-400 dark:hover:text-gold-300">{tNav('gold')}</Link>
            <Link href="/products" className="text-navy-200 hover:text-gold-300 dark:text-zinc-400 dark:hover:text-gold-300">{tNav('products')}</Link>
            <Link href="/about" className="text-navy-200 hover:text-gold-300 dark:text-zinc-400 dark:hover:text-gold-300">{tNav('about')}</Link>
            <Link href="/contact" className="text-navy-200 hover:text-gold-300 dark:text-zinc-400 dark:hover:text-gold-300">{tNav('contact')}</Link>
          </div>
        </div>
      </Container>
      <div className="border-t border-navy-800 py-5 text-center text-xs text-navy-300 dark:border-dark-border dark:text-zinc-500">
        {t('copyright', { year: new Date().getFullYear() })}
      </div>
    </footer>
  );
}
