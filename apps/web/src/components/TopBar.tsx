import { PhoneIcon, EnvelopeIcon, MapPinIcon, ClockIcon } from '@heroicons/react/24/solid';
import { Container } from '@melli/ui';
import { site } from '@/lib/site';

export function TopBar() {
  return (
    <div className="bg-navy-900 text-white dark:bg-dark-card dark:border-b dark:border-dark-border">
      <Container className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 py-2 text-xs">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
          <a
            href={`tel:${site.phone.replace(/\s/g, '')}`}
            className="flex items-center gap-1.5 transition-colors hover:text-gold-300"
          >
            <PhoneIcon className="h-3.5 w-3.5 text-gold-400" />
            {site.phone}
          </a>
          <a
            href={`mailto:${site.email}`}
            className="flex items-center gap-1.5 transition-colors hover:text-gold-300"
          >
            <EnvelopeIcon className="h-3.5 w-3.5 text-gold-400" />
            {site.email}
          </a>
          <span className="hidden items-center gap-1.5 sm:flex">
            <MapPinIcon className="h-3.5 w-3.5 text-gold-400" />
            {site.address.street}, {site.address.city}, {site.address.region}
          </span>
        </div>
        <div className="hidden items-center gap-1.5 md:flex">
          <ClockIcon className="h-3.5 w-3.5 text-gold-400" />
          <span>Mon–Fri 9:30–7 PM</span>
          <span className="mx-1 text-navy-500 dark:text-dark-muted">|</span>
          <span>Sat 10–6 PM</span>
        </div>
      </Container>
    </div>
  );
}
