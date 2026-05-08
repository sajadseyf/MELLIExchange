import { Router } from 'express';
import { z } from 'zod';
import { PostModel } from '../models/Post.js';
import { requireAuth } from '../auth.js';

const router = Router();

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// ── Public ────────────────────────────────────────────────────────────────────

router.get('/', async (_req, res) => {
  const posts = await PostModel.find({ published: true })
    .sort({ publishedAt: -1 })
    .select('-content')
    .lean();
  res.json(posts.map(serialize));
});

router.get('/:slug', async (req, res) => {
  const post = await PostModel.findOne({ slug: req.params.slug, published: true }).lean();
  if (!post) { res.status(404).json({ error: 'Not found' }); return; }

  const hasFa = !!(post as any).translations?.fa?.title;
  const hasZh = !!(post as any).translations?.zh?.title;
  const translating = !hasFa || !hasZh;

  if (translating) {
    // Fire and forget — don't block the response
    (async () => {
      try {
        const title   = (post as any).title   ?? '';
        const excerpt = (post as any).excerpt  ?? '';
        const content = (post as any).content  ?? '';
        const update: Record<string, unknown> = {};
        if (!hasFa) update['translations.fa'] = await translatePost(title, excerpt, content, 'fa');
        if (!hasZh) update['translations.zh'] = await translatePost(title, excerpt, content, 'zh');
        await PostModel.updateOne({ _id: (post as any)._id }, { $set: update });
      } catch (e) {
        console.error('[auto-translate]', e);
      }
    })();
  }

  res.json({ ...serializeFull(post), translating });
});

// ── Admin ─────────────────────────────────────────────────────────────────────

router.get('/admin/all', requireAuth, async (_req, res) => {
  const posts = await PostModel.find().sort({ createdAt: -1 }).lean();
  res.json(posts.map(serializeFull));
});

const postSchema = z.object({
  title:      z.string().min(1),
  slug:       z.string().optional(),
  excerpt:    z.string().default(''),
  content:    z.string().default(''),
  coverImage: z.string().default(''),
  tags:       z.array(z.string()).default([]),
  published:  z.boolean().default(false),
});

router.post('/', requireAuth, async (req, res) => {
  const parsed = postSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.issues[0]?.message }); return; }

  const slug = parsed.data.slug?.trim() || slugify(parsed.data.title);
  const publishedAt = parsed.data.published ? new Date() : undefined;

  const post = await PostModel.create({ ...parsed.data, slug, publishedAt });
  res.status(201).json(serializeFull(post));
});

router.put('/:id', requireAuth, async (req, res) => {
  const parsed = postSchema.partial().safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.issues[0]?.message }); return; }

  const existing = await PostModel.findById(req.params.id);
  if (!existing) { res.status(404).json({ error: 'Not found' }); return; }

  // Set publishedAt when first publishing
  if (parsed.data.published && !existing.published && !existing.publishedAt) {
    (parsed.data as any).publishedAt = new Date();
  }
  if (parsed.data.slug) {
    parsed.data.slug = slugify(parsed.data.slug);
  }

  const updated = await PostModel.findByIdAndUpdate(req.params.id, parsed.data, { new: true });
  res.json(serializeFull(updated!));
});

router.delete('/:id', requireAuth, async (req, res) => {
  const result = await PostModel.findByIdAndDelete(req.params.id);
  if (!result) { res.status(404).json({ error: 'Not found' }); return; }
  res.json({ ok: true });
});

// ── VBCE import ───────────────────────────────────────────────────────────────

// Split text into word-boundary chunks ≤ maxLen characters
function splitIntoChunks(text: string, maxLen = 380): string[] {
  const chunks: string[] = [];
  const words = text.split(/\s+/);
  let buf = '';
  for (const word of words) {
    const next = buf ? buf + ' ' + word : word;
    if (next.length > maxLen) {
      if (buf) chunks.push(buf);
      // If single word exceeds limit, split it hard
      if (word.length > maxLen) {
        for (let i = 0; i < word.length; i += maxLen) chunks.push(word.slice(i, i + maxLen));
        buf = '';
      } else {
        buf = word;
      }
    } else {
      buf = next;
    }
  }
  if (buf) chunks.push(buf);
  return chunks;
}

// Translate using MyMemory (free, no key)
async function translateText(text: string, targetLang: 'fa' | 'zh'): Promise<string> {
  if (!text.trim()) return '';
  const lang = targetLang === 'zh' ? 'zh-CN' : 'fa';

  // Preserve paragraph structure
  const paragraphs = text.split(/\n{2,}/);
  const translatedParas: string[] = [];

  for (const para of paragraphs) {
    if (!para.trim()) { translatedParas.push(''); continue; }

    const chunks = splitIntoChunks(para.replace(/\n/g, ' '));
    const translatedChunks: string[] = [];

    for (const chunk of chunks) {
      try {
        const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(chunk)}&langpair=en|${lang}`;
        const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        if (!r.ok) { translatedChunks.push(chunk); continue; }
        const data = (await r.json()) as { responseData?: { translatedText?: string }; responseStatus?: number };
        const result = data?.responseData?.translatedText ?? chunk;
        // Detect API error messages returned as translation text
        if (
          result.toUpperCase().includes('QUERY LENGTH LIMIT') ||
          result.toUpperCase().includes('MYMEMORY WARNING') ||
          data.responseStatus === 403
        ) {
          translatedChunks.push(chunk); // keep original
        } else {
          translatedChunks.push(result);
        }
        await new Promise((resolve) => setTimeout(resolve, 200));
      } catch {
        translatedChunks.push(chunk);
      }
    }
    translatedParas.push(translatedChunks.join(' '));
  }

  return translatedParas.join('\n\n');
}

async function translatePost(title: string, excerpt: string, content: string, lang: 'fa' | 'zh') {
  const [t, e, c] = await Promise.all([
    translateText(title,   lang),
    translateText(excerpt, lang),
    translateText(content, lang),
  ]);
  return { title: t, excerpt: e, content: c };
}

function sanitizeContent(text: string): string {
  return text
    .replace(/\bVBCE\b/g, 'Melli Exchange')
    .replace(/\bvbce\.ca\b/gi, 'melliexchange.ca')
    .replace(/Our team of experienced FX Traders/gi, 'Our team')
    .replace(/vanex(group)?/gi, '')
    .trim();
}

const VBCE_HEADERS = {
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5.1 Safari/605.1.15',
  'Origin': 'https://www.vbce.ca',
  'Referer': 'https://www.vbce.ca/',
};

interface VBCEArticle {
  id: number;
  title: string;
  excerpt: string;
  description: string;
  slug: string;
  published_at: string;
  featured_image?: { url?: string; formats?: { medium?: { url?: string }; small?: { url?: string } } } | null;
  categories?: Array<{ name?: string }>;
}

router.post('/import-vbce', requireAuth, async (_req, res) => {
  try {
    const LIMIT = 100;
    let start = 0;
    let total = 0;
    let imported = 0;
    let skipped = 0;

    while (true) {
      const url = `https://strapi-admin.vbce.ca/marketwatches?_sort=published_at:desc&_limit=${LIMIT}&_start=${start}`;
      const r = await fetch(url, { headers: VBCE_HEADERS });
      if (!r.ok) throw new Error(`VBCE Strapi ${r.status}`);
      const batch = (await r.json()) as VBCEArticle[];
      if (!batch.length) break;

      for (const a of batch) {
        const externalId = `vbce:${a.id}`;
        const img = a.featured_image;
        const coverImage =
          img?.formats?.medium?.url ?? img?.formats?.small?.url ?? img?.url ?? '';
        const tags = (a.categories ?? []).map((c) => c.name ?? '').filter(Boolean);

        const cleanTitle   = sanitizeContent(a.title);
        const cleanExcerpt = sanitizeContent(a.excerpt ?? '');
        const cleanContent = sanitizeContent(a.description ?? '');

        // Translate in parallel for both languages
        const [fa, zh] = await Promise.all([
          translatePost(cleanTitle, cleanExcerpt, cleanContent, 'fa'),
          translatePost(cleanTitle, cleanExcerpt, cleanContent, 'zh'),
        ]);

        const result = await PostModel.updateOne(
          { externalId },
          {
            $set: {
              title:       cleanTitle,
              slug:        a.slug,
              excerpt:     cleanExcerpt,
              content:     cleanContent,
              coverImage,
              tags,
              published:   true,
              publishedAt: new Date(a.published_at),
              externalId,
              translations: { fa, zh },
            },
            $setOnInsert: { createdAt: new Date() },
          },
          { upsert: true },
        );

        if (result.upsertedCount) imported++;
        else if (result.modifiedCount) skipped++; // updated existing
        total++;
      }

      if (batch.length < LIMIT) break;
      start += LIMIT;
    }

    res.json({ ok: true, total, imported, updated: skipped });
  } catch (err) {
    console.error('[posts/import-vbce]', err);
    res.status(502).json({ error: String(err) });
  }
});

const TRANSLATE_ERROR_MARKERS = ['QUERY LENGTH LIMIT', 'MYMEMORY WARNING'];
function isBadTranslation(s?: string) {
  if (!s) return true;
  return TRANSLATE_ERROR_MARKERS.some((m) => s.toUpperCase().includes(m));
}

// Retranslate posts — ?force=true retranslates all, otherwise skips properly-translated ones
router.post('/retranslate', requireAuth, async (req, res) => {
  const force = req.query.force === 'true';
  try {
    const all = await PostModel.find().lean();
    const needs = force ? all : all.filter((p) => {
      const fa = (p as any).translations?.fa;
      const zh = (p as any).translations?.zh;
      const faTitle = fa?.title ?? '';
      const zhTitle = zh?.title ?? '';
      // needs translation if: empty, same as English original (failed silently), or contains error marker
      return (
        !faTitle || !zhTitle ||
        faTitle === (p as any).title ||
        zhTitle === (p as any).title ||
        isBadTranslation(faTitle) ||
        isBadTranslation((p as any).translations?.fa?.content)
      );
    });

    let done = 0;
    for (const post of needs) {
      const [fa, zh] = await Promise.all([
        translatePost((post as any).title, (post as any).excerpt ?? '', (post as any).content ?? '', 'fa'),
        translatePost((post as any).title, (post as any).excerpt ?? '', (post as any).content ?? '', 'zh'),
      ]);
      await PostModel.updateOne({ _id: post._id }, { $set: { translations: { fa, zh } } });
      done++;
    }

    res.json({ ok: true, translated: done, total: all.length });
  } catch (err) {
    console.error('[posts/retranslate]', err);
    res.status(502).json({ error: String(err) });
  }
});

// ── Serializers ───────────────────────────────────────────────────────────────

function serialize(doc: any) {
  return {
    id:           doc._id?.toString(),
    title:        doc.title,
    slug:         doc.slug,
    excerpt:      doc.excerpt,
    coverImage:   doc.coverImage,
    tags:         doc.tags ?? [],
    published:    doc.published,
    publishedAt:  doc.publishedAt?.toISOString() ?? null,
    createdAt:    doc.createdAt?.toISOString(),
    updatedAt:    doc.updatedAt?.toISOString(),
    translations: doc.translations ?? {},
  };
}

function serializeFull(doc: any) {
  return { ...serialize(doc), content: doc.content };
}

export default router;
