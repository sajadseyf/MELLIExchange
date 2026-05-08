import express from 'express';
import path from 'path';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './env.js';
import { connectDb } from './db.js';
import { startPriceSync } from './priceSync.js';
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

async function main() {
  await connectDb();

  const app = express();

  app.use(express.json());
  app.use(cookieParser());
  app.use(
    cors({
      origin: env.corsOrigins,
      credentials: true,
    }),
  );

  app.get('/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.use('/api/auth', authRouter);
  app.use('/api/currencies', currenciesRouter);
  app.use('/api/gold', goldRouter);
  app.use('/api/products', productsRouter);
  app.use('/api/uploads', uploadsRouter);
  app.use('/api/settings', settingsRouter);
  app.use('/api/posts', postsRouter);
  app.use('/api/competitor', competitorRouter);
  app.use('/api/analysis', analysisRouter);
  app.use('/api/spot', spotRouter);
  app.use('/api/news', newsRouter);
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('[error]', err);
    res.status(500).json({ error: 'Internal server error' });
  });

  app.listen(env.port, () => {
    console.log(`[api] listening on http://localhost:${env.port}`);
    startPriceSync();
  });
}

main().catch((err) => {
  console.error('[fatal]', err);
  process.exit(1);
});
