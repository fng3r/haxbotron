'use client';

import { ReactNode, createContext, useContext, useEffect } from 'react';

import { useQueryClient } from '@tanstack/react-query';
import io from 'socket.io-client';

import { queryKeys } from '@/lib/queries/room';

const ws = io(process.env.NEXT_PUBLIC_CORE_API_URL || 'http://localhost:15001', {
  path: '/ws',
  transports: ['websocket'],
  autoConnect: false,
});

const WSocketContext = createContext<ReturnType<typeof io>>(ws);

export const useWSocket = () => {
  const context = useContext(WSocketContext);
  if (!context) {
    throw new Error('useWSocket must be used within a WSocketProvider scope');
  }

  return context;
};

interface WSocketProviderProps {
  children: ReactNode;
}

export const WSocketProvider = ({ children }: WSocketProviderProps) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const invalidateRooms = () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.rooms });
    };

    ws.connect();

    ws.on('connect', () => {
      console.log('WS connection established');
    });

    ws.on('roomct', invalidateRooms);
    ws.on('joinleft', invalidateRooms);

    return () => {
      ws.off('roomct', invalidateRooms);
      ws.off('joinleft', invalidateRooms);

      ws.disconnect();
    };
  }, [queryClient]);

  return <WSocketContext.Provider value={ws}>{children}</WSocketContext.Provider>;
};
