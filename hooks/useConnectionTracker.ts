import { addConnection, removeConnection, subscribeToConnections } from '@/config/firebase';
import { useEffect, useState } from 'react';

export const useConnectionTracker = () => {
  const [connectionCount, setConnectionCount] = useState(0);
  const [connectionId, setConnectionId] = useState<string | null>(null);

  useEffect(() => {
    // Generate a unique connection ID
    const id = `connection_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setConnectionId(id);

    // Add this connection to Firebase
    addConnection(id);

    // Subscribe to connection count changes
    const unsubscribe = subscribeToConnections((count) => {
      setConnectionCount(count);
    });

    // Cleanup function to remove connection when component unmounts
    return () => {
      if (connectionId) {
        removeConnection(connectionId);
      }
      unsubscribe();
    };
  }, []);

  return { connectionCount, connectionId };
}; 