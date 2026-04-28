import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { AdminModel } from '../models/Admin.js';
import { clearAuthCookie, requireAuth, setAuthCookie, signToken } from '../auth.js';

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid credentials' });
    return;
  }
  const { email, password } = parsed.data;
  const admin = await AdminModel.findOne({ email: email.toLowerCase() });
  if (!admin) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }
  const ok = await bcrypt.compare(password, admin.passwordHash);
  if (!ok) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }
  const token = signToken({ sub: String(admin._id), email: admin.email });
  setAuthCookie(res, token);
  res.json({ user: { id: String(admin._id), email: admin.email } });
});

router.post('/logout', (_req, res) => {
  clearAuthCookie(res);
  res.json({ ok: true });
});

router.get('/me', requireAuth, async (req, res) => {
  const admin = await AdminModel.findById(req.auth!.sub);
  if (!admin) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  res.json({ user: { id: String(admin._id), email: admin.email } });
});

export default router;
