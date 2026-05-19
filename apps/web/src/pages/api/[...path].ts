import type { NextApiRequest, NextApiResponse } from 'next';
// @ts-ignore — workspace package with TS source
import { app } from '@melli/api/app';

export default function apiProxy(req: NextApiRequest, res: NextApiResponse) {
  return new Promise<void>((resolve) => {
    res.on('finish', resolve);
    app(req as any, res as any, () => resolve());
  });
}

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
};
