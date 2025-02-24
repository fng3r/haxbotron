'use client'

import { createContext } from 'react';

export const wsocket = io('http://localhost:15001', {
    path: '/ws',
    transports: ['websocket']
});
export const WSocketContext = createContext(wsocket)

export default function WebSocketProvider({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  return (
    <WSocketContext.Provider value={wsocket}>
      {children}
    </WSocketContext.Provider>
  )
} 