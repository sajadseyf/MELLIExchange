import { MarketAnalysisModel } from './models/MarketAnalysis.js';
import { env } from './env.js';

const SYSTEM_PROMPT = `You are a senior FX and gold analyst for a Canadian currency exchange.
Combine the provided news sources into ONE daily market analysis.
Do not copy sentences verbatim. Keep all numbers accurate.
Focus on USD/CAD and the gold market.
Write 400-500 words per language.
Return ONLY valid JSON (no markdown, no code fences) in this exact shape:
{
  "title": { "en": "...", "fa": "..." },
  "content": { "en": "...", "fa": "..." },
  "published_at": "ISO-8601 date string"
}`;

async function fetchVBCENews(): Promise<string> {
  try {
    const res = await fetch(
      'https://strapi-admin.vbce.ca/marketwatches?_sort=published_at:desc&_limit=3',
      { headers: { 'User-Agent': 'Mozilla/5.0', 'Origin': 'https://www.vbce.ca', 'Referer': 'https://www.vbce.ca/' } },
    );
    if (!res.ok) return '';
    const articles = (await res.json()) as Array<{ title: string; description: string }>;
    return articles.map((a) => `## ${a.title}\n${a.description ?? ''}`).join('\n\n---\n\n');
  } catch { return ''; }
}

function parseRssItems(xml: string, max = 5): Array<{ title: string; description: string }> {
  const items: Array<{ title: string; description: string }> = [];
  for (const [, body] of [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)].slice(0, max)) {
    const title = (body.match(/<title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i) ?? [])[1]?.trim() ?? '';
    const desc  = (body.match(/<description[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i) ?? [])[1]?.replace(/<[^>]+>/g, '').trim() ?? '';
    if (title) items.push({ title, description: desc.slice(0, 500) });
  }
  return items;
}

async function fetchRSS(url: string): Promise<string> {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/rss+xml, application/xml' } });
    if (!res.ok) return '';
    const items = parseRssItems(await res.text(), 5);
    return items.map((i) => `## ${i.title}\n${i.description}`).join('\n\n---\n\n');
  } catch { return ''; }
}

// ── Gemini (free tier — 1500 req/day) ────────────────────────────────────────
async function callGemini(prompt: string): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${env.geminiApiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `${SYSTEM_PROMPT}\n\n${prompt}` }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 4096 },
      }),
    },
  );
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini ${res.status}: ${err.slice(0, 200)}`);
  }
  const data = (await res.json()) as {
    candidates: Array<{ content: { parts: Array<{ text: string }> } }>;
  };
  return data.candidates[0]?.content.parts[0]?.text ?? '';
}

// ── Anthropic fallback ────────────────────────────────────────────────────────
async function callAnthropic(prompt: string): Promise<string> {
  const { default: Anthropic } = await import('@anthropic-ai/sdk');
  const client = new Anthropic({ apiKey: env.anthropicApiKey });
  const msg = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: prompt }],
  });
  return msg.content.find((b) => b.type === 'text')?.text ?? '';
}

function parseJson(raw: string) {
  const clean = raw.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim();
  return JSON.parse(clean) as {
    title: { en: string; fa: string };
    content: { en: string; fa: string };
    published_at: string;
  };
}

export async function generateMarketAnalysis(): Promise<boolean> {
  const hasGemini    = !!env.geminiApiKey;
  const hasAnthropic = !!env.anthropicApiKey;

  if (!hasGemini && !hasAnthropic) {
    console.warn('[analysis] No AI API key set. Add GEMINI_API_KEY (free) or ANTHROPIC_API_KEY to .env');
    return false;
  }

  console.log('[analysis] fetching sources…');
  const [vbce, fxstreet, kitco] = await Promise.all([
    fetchVBCENews(),
    fetchRSS('https://www.fxstreet.com/rss/news'),
    fetchRSS('https://www.kitco.com/rss/kitco-news.xml'),
  ]);

  const sources: string[] = [];
  let combined = '';
  if (vbce)     { combined += `# VBCE Market Watch\n${vbce}\n\n`; sources.push('vbce'); }
  if (fxstreet) { combined += `# FXStreet RSS\n${fxstreet}\n\n`; sources.push('fxstreet'); }
  if (kitco)    { combined += `# Kitco News\n${kitco}\n\n`; sources.push('kitco'); }

  if (!combined.trim()) {
    console.warn('[analysis] no source data available');
    return false;
  }

  const prompt = `Today's date: ${new Date().toISOString().split('T')[0]}\n\nSource material:\n\n${combined.slice(0, 12000)}`;
  let usedModel = '';

  try {
    let rawText = '';

    if (hasGemini) {
      console.log('[analysis] using Gemini (free)…');
      rawText = await callGemini(prompt);
      usedModel = 'gemini-2.0-flash';
    } else {
      console.log('[analysis] using Anthropic…');
      rawText = await callAnthropic(prompt);
      usedModel = 'claude-sonnet-4-20250514';
    }

    const parsed = parseJson(rawText);
    await MarketAnalysisModel.create({
      title:       parsed.title,
      content:     parsed.content,
      publishedAt: parsed.published_at ? new Date(parsed.published_at) : new Date(),
      sources,
      model:       usedModel,
    });

    console.log(`[analysis] generated with ${usedModel}`);
    return true;
  } catch (e) {
    // If model not found, log available models hint
    console.error('[analysis] failed:', e);
    return false;
  }
}
