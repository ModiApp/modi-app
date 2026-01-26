import { database } from '@/config/firebase';
import { useAuth } from '@/providers/Auth';
import {
  onDisconnect,
  onValue,
  ref,
  serverTimestamp,
  set,
} from 'firebase/database';
import { useEffect, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';

export interface PlayerPresence {
  online: boolean;
  lastSeen: number;
}

export type PresenceMap = { [playerId: string]: PlayerPresence };

/**
 * Hook to manage real-time presence for a game.
 * Uses Firebase Realtime Database for instant online/offline detection.
 */
export function usePresence(gameId: string | undefined): PresenceMap {
  const { userId } = useAuth();
  const [presence, setPresence] = useState<PresenceMap>({});

  // Set up presence tracking for current user
  useEffect(() => {
    if (!gameId || !userId) return;

    const userPresenceRef = ref(database, `presence/${gameId}/${userId}`);
    const connectedRef = ref(database, '.info/connected');

    // Track connection state
    const unsubscribeConnected = onValue(connectedRef, (snapshot) => {
      if (snapshot.val() === true) {
        // We're connected (or reconnected)
        
        // Set up onDisconnect to mark as offline when we disconnect
        onDisconnect(userPresenceRef).set({
          online: false,
          lastSeen: serverTimestamp(),
        });

        // Mark as online
        set(userPresenceRef, {
          online: true,
          lastSeen: serverTimestamp(),
        });
      }
    });

    // Handle app state changes (background/foreground)
    const handleAppStateChange = (state: AppStateStatus) => {
      if (state === 'active') {
        // App came to foreground - mark as online
        set(userPresenceRef, {
          online: true,
          lastSeen: serverTimestamp(),
        });
      } else if (state === 'background' || state === 'inactive') {
        // App went to background - mark as away
        set(userPresenceRef, {
          online: false,
          lastSeen: serverTimestamp(),
        });
      }
    };

    const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);

    // Cleanup
    return () => {
      unsubscribeConnected();
      appStateSubscription.remove();
      // Mark as offline when leaving the game screen
      set(userPresenceRef, {
        online: false,
        lastSeen: serverTimestamp(),
      });
    };
  }, [gameId, userId]);

  // Listen to all players' presence in this game
  useEffect(() => {
    if (!gameId) return;

    const gamePresenceRef = ref(database, `presence/${gameId}`);
    
    const unsubscribe = onValue(gamePresenceRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setPresence(data);
      } else {
        setPresence({});
      }
    });

    return () => unsubscribe();
  }, [gameId]);

  return presence;
}

/**
 * Check if a player is currently online
 */
export function isPlayerOnline(presence: PresenceMap, playerId: string): boolean {
  return presence[playerId]?.online ?? false;
}
