import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs/promises';
import sharp from 'sharp';
import { requireAuth } from '../auth.js';

const router = Router();

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

// Store everything to memory first; we'll convert then write to disk
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // allow large HEIC before conversion
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
      const name = crypto.randomBytes(16).toString('hex');
      const filename = `${name}.jpg`;
      const dest = path.join(UPLOADS_DIR, filename);

      // Convert everything (HEIC, PNG, WebP, etc.) to JPEG via sharp
      await sharp(file.buffer)
        .rotate()           // auto-rotate based on EXIF orientation
        .jpeg({ quality: 85 })
        .toFile(dest);

      urls.push(`/uploads/${filename}`);
    }

    res.json({ urls });
  } catch (err) {
    console.error('[uploads]', err);
    res.status(500).json({ error: 'Image processing failed' });
  }
});

export default router;
