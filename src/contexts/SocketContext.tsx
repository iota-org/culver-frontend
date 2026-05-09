import { createContext, useContext, useEffect, useState, useRef } from 'react';
import type { ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { auth } from '../lib/firebase';

type SocketContextType = {
  socket: Socket | null;
  isConnected: boolean;
};

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Listen for Firebase auth state changes
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        // User is logged in — create socket connection
        const token = await firebaseUser.getIdToken();

        socketRef.current = io('http://localhost:3000', {
          auth: { token },
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
        });

        setSocket(socketRef.current);

        socketRef.current.on('connect', () => {
          setIsConnected(true);
          console.warn('Socket connected:', socketRef.current?.id);
        });

        socketRef.current.on('disconnect', () => {
          setIsConnected(false);
        });

        // Handle token expiry — refresh and reconnect
        socketRef.current.on('connect_error', async (err) => {
          if (err.message === 'Invalid or expired token') {
            const newToken = await firebaseUser.getIdToken(true);
            if (socketRef.current) {
              socketRef.current.auth = { token: newToken };
              socketRef.current.connect();
            }
          }
        });
      } else {
        // User logged out — disconnect socket
        if (socketRef.current) {
          socketRef.current.disconnect();
          socketRef.current = null;
          setSocket(null);
          setIsConnected(false);
        }
      }
    });

    return () => {
      unsubscribe();
      socketRef.current?.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
