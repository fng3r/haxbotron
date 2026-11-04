import type { NextApiRequest, NextApiResponse } from 'next';
import type { Server } from 'node:http';
import type { Socket } from 'node:net';

import { verifyToken } from '@/lib/auth/jwt';
import { ensureLiveRelay } from '@/lib/live/relay';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse & { socket: Socket & { server: Server } },
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.status(405).end();
    return;
  }
  if (!req.cookies.access_token || !(await verifyToken(req.cookies.access_token))) {
    res.status(401).end();
    return;
  }
  ensureLiveRelay(res.socket.server, false);
  res.status(200).json({ ok: true });
}
