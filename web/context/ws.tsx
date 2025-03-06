import { createContext } from 'react';

import io from 'socket.io-client';

export const wsocket = io(process.env.CORE_API_URL || 'http://localhost:15001', {
  path: '/ws',
  transports: ['websocket'],
});

export const WSocketContext = createContext(wsocket);
