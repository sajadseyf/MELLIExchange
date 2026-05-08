import { Router } from 'express';
import { requireAuth } from '../auth.js';
import { MarketAnalysisModel } from '../models/MarketAnalysis.js';
import { generateMarketAnalysis } from '../analysisGenerator.js';

const router = Router();

router.get('/', requireAuth, async (req, res) => {
  const limit = Number(req.query.limit ?? 30);
  const docs = await MarketAnalysisModel.find().sort({ publishedAt: -1 }).limit(limit).lean();
  res.json(docs.map((d: any) => ({
    id:          d._id.toString(),
    title:       d.title,
    content:     d.content,
    publishedAt: d.publishedAt,
    sources:     d.sources,
    model:       d.model,
  })));
});

router.get('/:id', requireAuth, async (req, res) => {
  const doc = await MarketAnalysisModel.findById(req.params.id).lean();
  if (!doc) { res.status(404).json({ error: 'Not found' }); return; }
  res.json(doc);
});

router.post('/generate', requireAuth, async (_req, res) => {
  const { env } = await import('../env.js');
  if (!env.geminiApiKey && !env.anthropicApiKey) {
    res.status(400).json({ error: 'No AI key configured. Add GEMINI_API_KEY (free at aistudio.google.com) to apps/api/.env and restart the server.' });
    return;
  }
  res.json({ ok: true, message: 'Generation started. Refresh in ~15 seconds.' });
  generateMarketAnalysis().catch(console.error);
});

router.delete('/:id', requireAuth, async (req, res) => {
  await MarketAnalysisModel.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

export default router;
