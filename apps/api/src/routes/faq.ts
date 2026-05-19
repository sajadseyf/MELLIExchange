import { Router } from 'express';
import { requireAuth } from '../auth.js';
import { FaqModel } from '../models/Faq.js';

const router = Router();

// Public — returns active FAQs sorted by order
router.get('/', async (_req, res) => {
  const items = await FaqModel.find({ active: true }).sort({ order: 1 }).lean();
  res.json(
    items.map((d) => ({
      id:        String(d._id),
      question:  d.question,
      answer:    d.answer,
      order:     d.order,
      active:    d.active,
      updatedAt: (d as any).updatedAt,
    })),
  );
});

// Admin — all FAQs including inactive
router.get('/admin/all', requireAuth, async (_req, res) => {
  const items = await FaqModel.find().sort({ order: 1 }).lean();
  res.json(
    items.map((d) => ({
      id:        String(d._id),
      question:  d.question,
      answer:    d.answer,
      order:     d.order,
      active:    d.active,
      updatedAt: (d as any).updatedAt,
    })),
  );
});

router.post('/', requireAuth, async (req, res) => {
  const { question, answer, order, active } = req.body as {
    question: { fa: string; en: string; zh?: string };
    answer:   { fa: string; en: string; zh?: string };
    order?:   number;
    active?:  boolean;
  };
  const count = await FaqModel.countDocuments();
  const item = await FaqModel.create({
    question,
    answer,
    order:  order ?? count,
    active: active ?? true,
  });
  res.status(201).json({ id: String(item._id) });
});

router.put('/:id', requireAuth, async (req, res) => {
  const { question, answer, order, active } = req.body as {
    question?: { fa: string; en: string; zh?: string };
    answer?:   { fa: string; en: string; zh?: string };
    order?:    number;
    active?:   boolean;
  };
  const update: Record<string, unknown> = {};
  if (question !== undefined) update.question = question;
  if (answer   !== undefined) update.answer   = answer;
  if (order    !== undefined) update.order     = order;
  if (active   !== undefined) update.active    = active;

  const doc = await FaqModel.findByIdAndUpdate(req.params.id, { $set: update }, { new: true });
  if (!doc) { res.status(404).json({ error: 'Not found' }); return; }
  res.json({ ok: true });
});

router.delete('/:id', requireAuth, async (req, res) => {
  await FaqModel.findByIdAndDelete(req.params.id);
  res.status(204).end();
});

// Bulk reorder — body: [{ id, order }]
router.post('/reorder', requireAuth, async (req, res) => {
  const items = req.body as { id: string; order: number }[];
  await Promise.all(items.map(({ id, order }) =>
    FaqModel.findByIdAndUpdate(id, { $set: { order } }),
  ));
  res.json({ ok: true });
});

export default router;
