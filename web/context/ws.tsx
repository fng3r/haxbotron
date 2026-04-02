'use client';

import { ReactNode, createContext, useContext, useEffect, useMemo, useRef } from 'react';

import { useQueryClient } from '@tanstack/react-query';

import { queryKeys as roomQueryKeys } from '@/lib/queries/room';

type EventHandler<T = any> = (payload: T) => void;

class ControlPlaneSocket {
  private source: EventSource | null = null;
  private listeners = new Map<string, Set<EventHandler>>();

  public connect() {
    if (this.source) return;

    this.source = new EventSource('/api/v1/control/events');
    for (const event of ['roomct', 'joinleft', 'statuschange', 'log']) {
      this.source.addEventListener(event, (message) => {
        const payload = JSON.parse((message as MessageEvent).data);
        this.listeners.get(event)?.forEach((handler) => handler(payload));
      });
    }
  }

  public disconnect() {
    this.source?.close();
    this.source = null;
  }

  public on(event: string, handler: EventHandler) {
    const handlers = this.listeners.get(event) || new Set<EventHandler>();
    handlers.add(handler);
    this.listeners.set(event, handlers);
  }

  public off(event: string, handler: EventHandler) {
    this.listeners.get(event)?.delete(handler);
  }
}

const WSocketContext = createContext<ControlPlaneSocket | null>(null);

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
  const socketRef = useRef<ControlPlaneSocket | null>(null);

  const socket = useMemo(() => {
    if (!socketRef.current) {
      socketRef.current = new ControlPlaneSocket();
    }
    return socketRef.current;
  }, []);

  useEffect(() => {
    const invalidateRooms = () => {
      queryClient.invalidateQueries({ queryKey: roomQueryKeys.rooms });
      queryClient.invalidateQueries({ queryKey: roomQueryKeys.allRooms });
    };

    socket.connect();
    socket.on('roomct', invalidateRooms);
    socket.on('joinleft', invalidateRooms);

    return () => {
      socket.off('roomct', invalidateRooms);
      socket.off('joinleft', invalidateRooms);
      socket.disconnect();
    };
  }, [queryClient, socket]);

  return <WSocketContext.Provider value={socket}>{children}</WSocketContext.Provider>;
};
