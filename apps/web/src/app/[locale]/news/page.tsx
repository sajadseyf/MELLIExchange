import { Container, PageHeading } from '@melli/ui';
import { getPosts, getMarketNews } from '@/lib/api';
import type { NewsItem } from '@/lib/api';
import { Link } from '@/i18n/navigation';
import type { Post, PostTranslation } from '@melli/types';

const CATEGORY_GRADIENT: Record<string, string> = {
  gold:  'from-amber-400 to-yellow-600',
  cad:   'from-red-500 to-red-700',
  usd:   'from-green-600 to-emerald-800',
  eur:   'from-blue-500 to-indigo-700',
  gbp:   'from-purple-500 to-purple-800',
  jpy:   'from-rose-400 to-red-600',
  oil:   'from-stone-500 to-stone-800',
  fx:    'from-slate-500 to-slate-700',
};

const CATEGORY_ICON: Record<string, string> = {
  gold: '🥇', cad: '🍁', usd: '💵', eur: '🇪🇺',
  gbp: '🇬🇧', jpy: '🇯🇵', oil: '🛢️', fx: '📊',
};

const SOURCE_BADGE: Record<string, string> = {
  vbce:     'bg-red-600 text-white',
  fxstreet: 'bg-blue-600 text-white',
  kitco:    'bg-amber-500 text-white',
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return new Date(dateStr).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' });
}

function localizedPost(post: Post, locale: string) {
  const t: PostTranslation | undefined = locale === 'fa' ? post.translations?.fa : undefined;
  return { title: t?.title || post.title, excerpt: t?.excerpt || post.excerpt };
}

function OurPostCard({ post, locale }: { post: Post; locale: string }) {
  const { title, excerpt } = localizedPost(post, locale);
  const isRtl = locale === 'fa';
  const date = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })
    : '';
  return (
    <Link href={`/news/${post.slug}`}>
      <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-gold-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg dark:border-gold-500/20 dark:bg-dark-card">
        {post.coverImage ? (
          <div className="h-48 overflow-hidden">
            <img src={post.coverImage} alt={title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
          </div>
        ) : (
          <div className="flex h-48 items-center justify-center bg-gradient-to-br from-gold-400 to-amber-600">
            <span className="text-5xl">🏦</span>
          </div>
        )}
        <div className="flex flex-1 flex-col gap-2 p-5" dir={isRtl ? 'rtl' : 'ltr'}>
          <span className="w-fit rounded-full bg-gold-100 px-2.5 py-0.5 text-xs font-bold text-gold-700 dark:bg-gold-900/30 dark:text-gold-400">
            Melli Exchange
          </span>
          <h2 className="flex-1 text-base font-bold leading-snug text-ink-900 group-hover:text-gold-700 dark:text-white line-clamp-3">
            {title}
          </h2>
          {excerpt && <p className="text-sm text-ink-500 dark:text-zinc-400 line-clamp-2">{excerpt}</p>}
          {date && <p className="text-xs text-ink-400">{date}</p>}
        </div>
      </article>
    </Link>
  );
}

function NewsCard({ item }: { item: NewsItem }) {
  const grad = CATEGORY_GRADIENT[item.category] ?? CATEGORY_GRADIENT.fx!;
  const icon = CATEGORY_ICON[item.category] ?? '📰';
  const badge = SOURCE_BADGE[item.source] ?? 'bg-ink-600 text-white';
  const ago = item.pubDate ? timeAgo(item.pubDate) : '';

  return (
    <a href={item.link} target="_blank" rel="noopener noreferrer" className="group">
      <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg dark:border-dark-border dark:bg-dark-card">
        {/* Image or gradient placeholder */}
        {item.image ? (
          <div className="h-44 overflow-hidden">
            <img src={item.image} alt={item.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
          </div>
        ) : (
          <div className={`flex h-44 items-center justify-center bg-gradient-to-br ${grad}`}>
            <span className="text-6xl drop-shadow-lg">{icon}</span>
          </div>
        )}

        <div className="flex flex-1 flex-col gap-2 p-4">
          <div className="flex items-center justify-between gap-2">
            <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${badge}`}>
              {item.sourceLabel}
            </span>
            {ago && <span className="text-[11px] text-ink-400 dark:text-zinc-500">{ago}</span>}
          </div>
          <h3 className="flex-1 text-sm font-bold leading-snug text-ink-900 group-hover:text-gold-700 dark:text-white dark:group-hover:text-gold-400 line-clamp-3">
            {item.title}
          </h3>
          {item.description && (
            <p className="text-xs leading-relaxed text-ink-500 dark:text-zinc-400 line-clamp-2">
              {item.description}
            </p>
          )}
          <span className="mt-auto text-xs font-semibold text-gold-600 group-hover:underline">
            Read more →
          </span>
        </div>
      </article>
    </a>
  );
}

interface Props { params: { locale: string } }

export default async function NewsPage({ params }: Props) {
  const { locale } = params;
  const [posts, news] = await Promise.all([getPosts(), getMarketNews()]);

  const vbce     = news.filter(n => n.source === 'vbce');
  const rest     = news.filter(n => n.source !== 'vbce');

  return (
    <Container className="py-14">
      <div className="flex flex-col gap-12">
        <PageHeading
          eyebrow="Market Watch"
          title="News & Analysis"
          description="Currency and gold market news from VBCE, FXStreet, and our team."
        />

        {/* VBCE — featured large cards */}
        {vbce.length > 0 && (
          <section className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold text-ink-900 dark:text-white">VBCE Market Watch</h2>
              <span className="flex items-center gap-1.5 text-xs text-ink-400 dark:text-zinc-500">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
                Daily FX Update
              </span>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {vbce.slice(0, 6).map((item, i) => <NewsCard key={i} item={item} />)}
            </div>
          </section>
        )}

        {/* Our posts */}
        {posts.length > 0 && (
          <section className="flex flex-col gap-4">
            <h2 className="text-lg font-bold text-ink-900 dark:text-white">From Melli Exchange</h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => <OurPostCard key={post.id} post={post} locale={locale} />)}
            </div>
          </section>
        )}

        {/* FXStreet & Kitco */}
        {rest.length > 0 && (
          <section className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold text-ink-900 dark:text-white">Live Market News</h2>
              <span className="flex items-center gap-1.5 text-xs text-ink-400 dark:text-zinc-500">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                FXStreet
              </span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {rest.map((item, i) => <NewsCard key={i} item={item} />)}
            </div>
          </section>
        )}

        {news.length === 0 && posts.length === 0 && (
          <div className="py-20 text-center text-sm text-ink-400 dark:text-zinc-500">
            News temporarily unavailable. Please check back soon.
          </div>
        )}
      </div>
    </Container>
  );
}
