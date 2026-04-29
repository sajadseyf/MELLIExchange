import Link from 'next/link';
import { Container, LogoMark } from '@melli/ui';
import { MapPinIcon, PhoneIcon, EnvelopeIcon, ClockIcon } from '@heroicons/react/24/outline';
import { site } from '@/lib/site';

export function SiteFooter() {
  return (
    <footer className="border-t border-ink-100 bg-ink-900 text-ink-100">
      <Container className="grid gap-10 py-14 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="mb-4 flex items-center gap-3">
            <LogoMark size={48} />
            <div>
              <p className="font-serif text-lg text-white">{site.name}</p>
              <p className="text-xs uppercase tracking-[0.18em] text-gold-400">{site.tagline}</p>
            </div>
          </div>
          <p className="max-w-md text-sm text-ink-300">
            Trusted currency exchange and gold dealer serving Coquitlam and the Greater Vancouver area.
          </p>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gold-400">Visit us</h4>
          <ul className="space-y-3 text-sm text-ink-300">
            <li className="flex gap-2">
              <MapPinIcon className="mt-0.5 h-4 w-4 flex-none text-gold-400" />
              <span>
                {site.address.street}<br />
                {site.address.city}, {site.address.region} {site.address.postal}
              </span>
            </li>
            <li className="flex items-center gap-2">
              <PhoneIcon className="h-4 w-4 flex-none text-gold-400" />
              <a href={`tel:${site.phone.replace(/\s/g, '')}`} className="hover:text-gold-300">{site.phone}</a>
            </li>
            <li className="flex items-center gap-2">
              <EnvelopeIcon className="h-4 w-4 flex-none text-gold-400" />
              <a href={`mailto:${site.email}`} className="hover:text-gold-300">{site.email}</a>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gold-400">Hours</h4>
          <ul className="space-y-2 text-sm text-ink-300">
            {site.hours.map((h) => (
              <li key={h.days} className="flex items-center gap-2">
                <ClockIcon className="h-4 w-4 flex-none text-gold-400" />
                <span><span className="text-ink-200">{h.days}</span> · {h.time}</span>
              </li>
            ))}
          </ul>
          <div className="mt-5 flex flex-col gap-2 text-sm">
            <Link href="/currencies" className="text-ink-300 hover:text-gold-300">Currency prices</Link>
            <Link href="/gold" className="text-ink-300 hover:text-gold-300">Gold price</Link>
            <Link href="/about" className="text-ink-300 hover:text-gold-300">About us</Link>
            <Link href="/contact" className="text-ink-300 hover:text-gold-300">Contact us</Link>
          </div>
        </div>
      </Container>
      <div className="border-t border-ink-800 py-5 text-center text-xs text-ink-400">
        © {new Date().getFullYear()} {site.name}. All rights reserved.
      </div>
    </footer>
  );
}
