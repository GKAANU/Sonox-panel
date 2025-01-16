'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

export const useSocket = () => useContext(SocketContext);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    let socketInstance: Socket | null = null;

    const connectSocket = async () => {
      if (user) {
        try {
          const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
          console.log('Connecting to socket URL:', socketUrl);

          socketInstance = io(socketUrl, {
            transports: ['websocket'],
            path: '/socket.io/',
            reconnection: true,
            reconnectionAttempts: Infinity,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            timeout: 60000,
            auth: {
              token: user.uid
            },
            secure: true,
            rejectUnauthorized: false
          });

          socketInstance.on('connect', () => {
            console.log('Socket connected successfully');
            setIsConnected(true);
          });

          socketInstance.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
            setIsConnected(false);
          });

          socketInstance.on('disconnect', (reason) => {
            console.log('Socket disconnected:', reason);
            setIsConnected(false);
          });

          socketInstance.on('error', (error) => {
            console.error('Socket error:', error);
            setIsConnected(false);
          });

          setSocket(socketInstance);
        } catch (error) {
          console.error('Error initializing socket:', error);
          setIsConnected(false);
        }
      }
    };

    connectSocket();

    return () => {
      if (socketInstance) {
        console.log('Cleaning up socket connection');
        socketInstance.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
    };
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
} 