import { Container, PageHeading, Card } from '@melli/ui';
import { MapPinIcon, PhoneIcon, EnvelopeIcon, ClockIcon } from '@heroicons/react/24/outline';
import { site } from '@/lib/site';

export const metadata = {
  title: 'Contact Us — Melli Exchange',
};

const fullAddress = `${site.address.street}, ${site.address.city}, ${site.address.region} ${site.address.postal}, ${site.address.country}`;
const mapEmbed = `https://www.google.com/maps?q=${encodeURIComponent(fullAddress)}&output=embed`;

export default function ContactPage() {
  return (
    <Container className="py-14">
      <div className="flex flex-col gap-10">
        <PageHeading
          eyebrow="Visit us"
          title="Contact us"
          description="Stop by the shop, give us a call, or send an email. We're happy to help."
        />
        <div className="grid gap-6 lg:grid-cols-5">
          <Card className="p-6 lg:col-span-2">
            <ul className="space-y-5">
              <li className="flex gap-3">
                <MapPinIcon className="mt-0.5 h-5 w-5 flex-none text-gold-600 dark:text-gold-400" />
                <div>
                  <p className="font-medium text-ink-900 dark:text-white">Address</p>
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
                  <p className="font-medium text-ink-900 dark:text-white">Phone</p>
                  <a href={`tel:${site.phone.replace(/\s/g, '')}`} className="text-sm text-ink-600 hover:text-gold-600 dark:text-zinc-400 dark:hover:text-gold-400">
                    {site.phone}
                  </a>
                </div>
              </li>
              <li className="flex gap-3">
                <EnvelopeIcon className="mt-0.5 h-5 w-5 flex-none text-gold-600 dark:text-gold-400" />
                <div>
                  <p className="font-medium text-ink-900 dark:text-white">Email</p>
                  <a href={`mailto:${site.email}`} className="text-sm text-ink-600 hover:text-gold-600 dark:text-zinc-400 dark:hover:text-gold-400">
                    {site.email}
                  </a>
                </div>
              </li>
              <li className="flex gap-3">
                <ClockIcon className="mt-0.5 h-5 w-5 flex-none text-gold-600 dark:text-gold-400" />
                <div>
                  <p className="font-medium text-ink-900 dark:text-white">Hours</p>
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
          <Card className="overflow-hidden lg:col-span-3">
            <iframe
              src={mapEmbed}
              title="Map"
              className="h-full min-h-[420px] w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </Card>
        </div>
      </div>
    </Container>
  );
}
