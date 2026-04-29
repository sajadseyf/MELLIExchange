import {
  ShieldCheckIcon,
  CurrencyDollarIcon,
  ClockIcon,
  UserGroupIcon,
  BuildingStorefrontIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { Container, Card } from '@melli/ui';

const features = [
  {
    icon: CurrencyDollarIcon,
    title: 'Competitive Rates',
    description: 'We offer some of the best exchange rates in the Greater Vancouver area. No hidden fees, no surprises — the rate you see is the rate you get.',
  },
  {
    icon: ShieldCheckIcon,
    title: 'Licensed & Regulated',
    description: 'Fully registered with FINTRAC and compliant with all Canadian regulations. Your transactions are safe, legal, and documented.',
  },
  {
    icon: ClockIcon,
    title: 'Fast & Convenient',
    description: 'Walk in, exchange, walk out. No appointments needed. Most transactions are completed in under 5 minutes.',
  },
  {
    icon: UserGroupIcon,
    title: 'Trusted by Community',
    description: 'Serving the Coquitlam and Greater Vancouver community with integrity. Our reputation is built on trust and repeat customers.',
  },
  {
    icon: BuildingStorefrontIcon,
    title: 'Walk-in Friendly',
    description: 'Conveniently located in Coquitlam with easy access and parking. Open 6 days a week with extended hours.',
  },
  {
    icon: SparklesIcon,
    title: 'Gold & Jewelry',
    description: 'Beyond currency exchange, we deal in gold bullion and fine jewelry. Competitive per-gram pricing updated daily.',
  },
];

const stats = [
  { value: '14+',   label: 'Currencies' },
  { value: '3',     label: 'Gold Karats' },
  { value: '6',     label: 'Days a Week' },
  { value: '1000+', label: 'Happy Clients' },
];

export function WhyUs() {
  return (
    <>
      {/* Stats band */}
      <section className="bg-navy-900">
        <Container className="grid grid-cols-2 gap-6 py-12 sm:grid-cols-4 sm:py-14">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="font-serif text-4xl font-bold text-gold-400 sm:text-5xl">{s.value}</div>
              <div className="mt-1 text-sm font-medium uppercase tracking-wider text-navy-200">{s.label}</div>
            </div>
          ))}
        </Container>
      </section>

      {/* Why choose us */}
      <section className="py-16 sm:py-20">
        <Container>
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <span className="text-xs font-semibold uppercase tracking-[0.22em] text-gold-600">
              Why Melli Exchange
            </span>
            <h2 className="mt-3 font-serif text-3xl text-ink-900 sm:text-4xl">
              Your trusted partner for<br className="hidden sm:block" /> currency & gold
            </h2>
            <p className="mt-4 text-base text-ink-500">
              We combine competitive pricing, fast service, and regulatory compliance to make your exchange experience seamless.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <Card key={f.title} className="group relative overflow-hidden p-6 transition-shadow hover:shadow-soft">
                <div
                  aria-hidden
                  className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gold-100 opacity-0 transition-opacity group-hover:opacity-60"
                />
                <div className="relative">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-navy-900/5">
                    <f.icon className="h-6 w-6 text-navy-700" />
                  </div>
                  <h3 className="mb-2 font-serif text-lg text-ink-900">{f.title}</h3>
                  <p className="text-sm leading-relaxed text-ink-500">{f.description}</p>
                </div>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      {/* CTA band */}
      <section className="border-y border-ink-100 bg-gradient-to-br from-cream via-white to-gold-50">
        <Container className="grid items-center gap-8 py-14 lg:grid-cols-2 lg:py-20">
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.22em] text-gold-600">
              Visit Us Today
            </span>
            <h2 className="mt-3 font-serif text-3xl text-ink-900 sm:text-4xl">
              Ready to exchange?<br />
              Walk in — no appointment needed.
            </h2>
            <p className="mt-4 max-w-lg text-base text-ink-500">
              Our friendly team is ready to help you with currency exchange, gold purchases, and jewelry. Located in the heart of Coquitlam with convenient parking.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href="/contact"
                className="inline-flex items-center gap-2 rounded-lg bg-navy-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-navy-800"
              >
                Get Directions
              </a>
              <a
                href="tel:+10000000000"
                className="inline-flex items-center gap-2 rounded-lg border border-ink-200 bg-white px-6 py-3 text-sm font-medium text-ink-800 transition-colors hover:bg-ink-50"
              >
                Call Us
              </a>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl2 border border-ink-100 bg-white p-5 shadow-card">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-gold-600">Location</div>
              <p className="text-sm text-ink-700">1102-1163 Pinetree Wy</p>
              <p className="text-sm text-ink-700">Coquitlam, BC V3B 8A9</p>
            </div>
            <div className="rounded-xl2 border border-ink-100 bg-white p-5 shadow-card">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-gold-600">Hours</div>
              <p className="text-sm text-ink-700">Mon–Fri: 9:30–7 PM</p>
              <p className="text-sm text-ink-700">Sat: 10–6 PM</p>
            </div>
            <div className="rounded-xl2 border border-ink-100 bg-white p-5 shadow-card">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-gold-600">Services</div>
              <p className="text-sm text-ink-700">Currency Exchange</p>
              <p className="text-sm text-ink-700">Gold & Jewelry</p>
            </div>
            <div className="rounded-xl2 border border-ink-100 bg-white p-5 shadow-card">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-gold-600">Compliance</div>
              <p className="text-sm text-ink-700">FINTRAC Registered</p>
              <p className="text-sm text-ink-700">Fully Licensed</p>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
