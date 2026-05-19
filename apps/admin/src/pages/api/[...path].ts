import type { NextApiRequest, NextApiResponse } from 'next';
import serverlessHttp from 'serverless-http';
// @ts-ignore — workspace package with TS source
import { app } from '@melli/api/app';

const handler = serverlessHttp(app);

export default async function apiProxy(req: NextApiRequest, res: NextApiResponse) {
  await handler(req as any, res as any);
}

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
};
