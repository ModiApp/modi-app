/**
 * Connection Provider - Monitors Firebase connection state
 * 
 * Provides connection status throughout the app for graceful handling of
 * disconnects, reconnects, and session timeouts.
 */
import { database } from '@/config/firebase';
import { onValue, ref } from 'firebase/database';
import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';

export type ConnectionState = 
  | 'connected'      // Firebase is connected and working
  | 'reconnecting'   // Lost connection, attempting to reconnect
  | 'disconnected';  // Confirmed disconnected (after timeout)

interface ConnectionContextValue {
  /** Current connection state */
  connectionState: ConnectionState;
  /** Whether Firebase is currently connected */
  isConnected: boolean;
  /** Whether we're attempting to reconnect */
  isReconnecting: boolean;
  /** Last time we were confirmed connected */
  lastConnectedAt: number | null;
  /** Force a connection check */
  checkConnection: () => void;
}

const ConnectionContext = createContext<ConnectionContextValue>({
  connectionState: 'connected',
  isConnected: true,
  isReconnecting: false,
  lastConnectedAt: null,
  checkConnection: () => {},
});

export function useConnection() {
  return useContext(ConnectionContext);
}

// Time to wait before considering connection fully lost (not just a blip)
const RECONNECT_TIMEOUT_MS = 10000; // 10 seconds

export function ConnectionProvider({ children }: React.PropsWithChildren) {
  const [connectionState, setConnectionState] = useState<ConnectionState>('connected');
  const [lastConnectedAt, setLastConnectedAt] = useState<number | null>(Date.now());
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearReconnectTimeout = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  const checkConnection = useCallback(() => {
    // This is a no-op as Firebase handles connection state automatically
    // But we expose it for manual checks if needed
    console.debug('[Connection] Manual connection check requested');
  }, []);

  useEffect(() => {
    const connectedRef = ref(database, '.info/connected');
    
    const unsubscribe = onValue(connectedRef, (snapshot) => {
      const isConnected = snapshot.val() === true;
      
      if (isConnected) {
        // Connected! Clear any pending disconnect timeout
        clearReconnectTimeout();
        setConnectionState('connected');
        setLastConnectedAt(Date.now());
        console.debug('[Connection] Firebase connected');
      } else {
        // Lost connection - start reconnecting state
        // Don't immediately mark as disconnected (might be temporary)
        setConnectionState('reconnecting');
        console.debug('[Connection] Firebase disconnected, attempting to reconnect...');
        
        // After timeout, mark as fully disconnected
        clearReconnectTimeout();
        reconnectTimeoutRef.current = setTimeout(() => {
          setConnectionState('disconnected');
          console.debug('[Connection] Firebase connection lost (timeout exceeded)');
        }, RECONNECT_TIMEOUT_MS);
      }
    });

    return () => {
      unsubscribe();
      clearReconnectTimeout();
    };
  }, [clearReconnectTimeout]);

  const value: ConnectionContextValue = {
    connectionState,
    isConnected: connectionState === 'connected',
    isReconnecting: connectionState === 'reconnecting',
    lastConnectedAt,
    checkConnection,
  };

  return (
    <ConnectionContext.Provider value={value}>
      {children}
    </ConnectionContext.Provider>
  );
}
