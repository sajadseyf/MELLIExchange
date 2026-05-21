import { Router } from 'express';
import multer from 'multer';
import crypto from 'crypto';
import { put } from '@vercel/blob';
import { requireAuth } from '../auth.js';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter(_req, file, cb) {
    if (!file.mimetype.startsWith('image/')) {
      cb(new Error('Only image files are allowed'));
      return;
    }
    cb(null, true);
  },
});

router.post('/', requireAuth, upload.array('images', 10), async (req, res) => {
  try {
    const files = req.files as Express.Multer.File[];
    const urls: string[] = [];

    for (const file of files) {
      const ext = file.originalname.split('.').pop()?.toLowerCase() ?? 'jpg';
      const filename = `products/${crypto.randomBytes(16).toString('hex')}.${ext}`;
      const blob = await put(filename, file.buffer, {
        access: 'public',
        contentType: file.mimetype,
      });
      urls.push(blob.url);
    }

    res.json({ urls });
  } catch (err) {
    console.error('[uploads]', err);
    res.status(500).json({ error: 'Image upload failed' });
  }
});

export default router;
