import express from 'express';
import path from 'path';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './env.js';
import { connectDb } from './db.js';
import authRouter from './routes/auth.js';
import currenciesRouter from './routes/currencies.js';
import goldRouter from './routes/gold.js';
import productsRouter from './routes/products.js';
import uploadsRouter from './routes/uploads.js';
import settingsRouter from './routes/settings.js';
import postsRouter from './routes/posts.js';
import competitorRouter from './routes/competitor.js';
import analysisRouter from './routes/analysis.js';
import spotRouter from './routes/spot.js';
import newsRouter from './routes/news.js';
import faqRouter from './routes/faq.js';

let dbReady = false;

export const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: env.corsOrigins, credentials: true }));

// Lazy DB connect — safe for serverless cold starts
app.use(async (_req, _res, next) => {
  if (!dbReady) {
    await connectDb();
    dbReady = true;
  }
  next();
});

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use('/api/auth',       authRouter);
app.use('/api/currencies', currenciesRouter);
app.use('/api/gold',       goldRouter);
app.use('/api/products',   productsRouter);
app.use('/api/uploads',    uploadsRouter);
app.use('/api/settings',   settingsRouter);
app.use('/api/posts',      postsRouter);
app.use('/api/competitor', competitorRouter);
app.use('/api/analysis',   analysisRouter);
app.use('/api/spot',       spotRouter);
app.use('/api/news',       newsRouter);
app.use('/api/faq',        faqRouter);

app.get('/api/v1/rates', async (_req, res) => {
  const { CurrencyModel } = await import('./models/Currency.js');
  const currencies = await CurrencyModel.find({ hidden: false }).sort({ order: 1 }).lean();
  res.json(
    currencies.map((c: any, i: number) => ({
      id: i + 1, iso: c.code, country: c.name,
      buy_price: String(c.buy), sell_price: String(c.sell),
      currency_unit: c.name, updated_at: c.updatedAt,
      major: c.order <= 10, position: c.order,
    })),
  );
});

app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[error]', err);
  res.status(500).json({ error: 'Internal server error' });
});
