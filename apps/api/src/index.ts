import { app } from './app.js';
import { env } from './env.js';
import { connectDb } from './db.js';
import { startPriceSync } from './priceSync.js';

async function main() {
  await connectDb();
  app.listen(env.port, () => {
    console.log(`[api] listening on http://localhost:${env.port}`);
    startPriceSync();
  });
}

main().catch((err) => {
  console.error('[fatal]', err);
  process.exit(1);
});
