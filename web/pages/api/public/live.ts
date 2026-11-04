import type { NextApiRequest, NextApiResponse } from 'next';
import type { Server } from 'node:http';
import type { Socket } from 'node:net';

import { ensureLiveRelay } from '@/lib/live/relay';

export default function handler(req: NextApiRequest, res: NextApiResponse & { socket: Socket & { server: Server } }) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.status(405).end();
    return;
  }
  ensureLiveRelay(res.socket.server, true);
  res.status(200).json({ ok: true });
}
