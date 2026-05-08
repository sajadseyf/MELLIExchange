import { Router } from 'express';
import { z } from 'zod';
import { ProductModel } from '../models/Product.js';
import { requireAuth } from '../auth.js';

const router = Router();

function serialize(doc: any) {
  return {
    id: doc._id.toString(),
    name: doc.name,
    description: doc.description,
    category: doc.category,
    karat: doc.karat,
    weightGrams: doc.weightGrams,
    price: doc.price,
    images: doc.images ?? [],
    inStock: doc.inStock,
    order: doc.order,
    updatedAt: doc.updatedAt?.toISOString?.() ?? new Date().toISOString(),
  };
}

router.get('/', async (_req, res) => {
  const list = await ProductModel.find().sort({ order: 1, createdAt: -1 }).lean();
  res.json(list.map(serialize));
});

router.get('/:id', async (req, res) => {
  const doc = await ProductModel.findById(req.params.id).lean();
  if (!doc) {
    res.status(404).json({ error: 'Product not found' });
    return;
  }
  res.json(serialize(doc));
});

const productSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).default(''),
  category: z.enum(['ring', 'necklace', 'bracelet', 'earring', 'pendant', 'other']),
  karat: z.union([z.literal(14), z.literal(18), z.literal(21), z.literal(22), z.literal(24)]),
  weightGrams: z.number().nonnegative(),
  price: z.number().nonnegative(),
  images: z.array(z.string()).default([]),
  inStock: z.boolean().default(true),
  order: z.number().int().default(0),
});

router.post('/', requireAuth, async (req, res) => {
  const parsed = productSchema.safeParse(req.body);
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ');
    res.status(400).json({ error: msg });
    return;
  }
  const doc = await ProductModel.create(parsed.data);
  res.status(201).json(serialize(doc));
});

router.put('/:id', requireAuth, async (req, res) => {
  const parsed = productSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ');
    res.status(400).json({ error: msg });
    return;
  }
  const doc = await ProductModel.findByIdAndUpdate(req.params.id, parsed.data, { new: true });
  if (!doc) {
    res.status(404).json({ error: 'Product not found' });
    return;
  }
  res.json(serialize(doc));
});

router.delete('/:id', requireAuth, async (req, res) => {
  const doc = await ProductModel.findByIdAndDelete(req.params.id);
  if (!doc) {
    res.status(404).json({ error: 'Product not found' });
    return;
  }
  res.status(204).send();
});

export default router;
