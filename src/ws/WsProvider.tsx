import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useAuthStore } from '@/store/auth';

export type WsContextValue = {
  socket: WebSocket | null;
  isConnected: boolean;
  send: (data: unknown) => void;
};

const WsContext = createContext<WsContextValue | undefined>(undefined);

export const useWs = (): WsContextValue => {
  const ctx = useContext(WsContext);
  if (!ctx) {throw new Error('useWs must be used within WsProvider');}
  return ctx;
};

export const WsProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  // const token = useAuthStore((s) => s.token);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // if (!token) {
    //   if (socketRef.current) {
    //     socketRef.current.close();
    //     socketRef.current = null;
    //   }
    //   setIsConnected(false);
    //   return;
    // }

    // const urlBase = import.meta.env.VITE_WS_URL ?? '';
    // const url = `${urlBase}?token=${encodeURIComponent(token)}`;
    const url = 'ws://161.35.77.101:4000/ws'
    const ws = new WebSocket(url);
    socketRef.current = ws;

    const handleOpen = () => setIsConnected(true);
    const handleClose = () => setIsConnected(false);

    ws.addEventListener('open', handleOpen);
    ws.addEventListener('close', handleClose);
    ws.addEventListener('error', handleClose);

    return () => {
      ws.removeEventListener('open', handleOpen);
      ws.removeEventListener('close', handleClose);
      ws.removeEventListener('error', handleClose);
      ws.close();
    };
  }, []);

  const value = useMemo<WsContextValue>(() => ({
    socket: socketRef.current,
    isConnected,
    send: (data: unknown) => {
      const socket = socketRef.current;
      if (!socket || socket.readyState !== WebSocket.OPEN) {return;}
      const payload = typeof data === 'string' ? data : JSON.stringify(data);
      socket.send(payload);
    }
  }), [isConnected]);

  return <WsContext.Provider value={value}>{children}</WsContext.Provider>;
};
