import type { Game } from "@/api/src/types";
import { firestore } from "@/config/firebase";
import { useSessionTimeout, SessionTimeoutState } from "@/hooks/useSessionTimeout";
import { useConnection } from "@/providers/Connection";
import { doc, onSnapshot, FirestoreError } from "firebase/firestore";
import { useEffect, useState, useRef } from "react";

export interface UseGameResult {
  /** The current game state, null if not found, undefined if loading */
  game: Game | null | undefined;
  /** Session timeout state for handling disconnects gracefully */
  session: SessionTimeoutState;
  /** Whether the game data is currently loading */
  isLoading: boolean;
  /** Any error that occurred while fetching game data */
  error: FirestoreError | null;
}

/** 
 * Exports a live subscription to a game with graceful timeout handling.
 * Instead of silently redirecting on disconnect, provides session state
 * for showing appropriate UI feedback.
 */
export function useGame(gameId: string): UseGameResult {
  const [game, setGame] = useState<Game | null | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);
  const { isConnected } = useConnection();
  const hadGameRef = useRef(false);

  const session = useSessionTimeout({
    gameId,
    // No auto-navigation - let the UI handle it
  });

  // Use refs to access session methods without adding them to dependency arrays
  // This prevents infinite rerender loops caused by session object recreation
  const sessionRef = useRef(session);
  sessionRef.current = session;

  const isConnectedRef = useRef(isConnected);
  isConnectedRef.current = isConnected;

  useEffect(() => {
    if (!gameId) {
      setGame(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    hadGameRef.current = false;

    const gameRef = doc(firestore, `games/${gameId}`);
    
    const unsubscribe = onSnapshot(
      gameRef,
      (snapshot) => {
        const currentSession = sessionRef.current;
        
        if (snapshot.exists()) {
          const gameData = snapshot.data() as Game;
          setGame(gameData);
          setIsLoading(false);
          setError(null);
          
          // Game exists - track that we had a valid game
          hadGameRef.current = true;
          
          // If we were in expired/reconnecting state, reset to active
          if (currentSession.sessionState === 'expired' || currentSession.sessionState === 'reconnecting') {
            currentSession.resetSession();
          }
        } else {
          setGame(null);
          setIsLoading(false);
          setError(null);
          
          // Game doesn't exist
          if (hadGameRef.current) {
            // We had a game before, now it's gone - session expired
            currentSession.expireSession(
              'This game session has ended or was removed.',
              false // Can't rejoin a deleted game
            );
          } else {
            // Never had a game - it doesn't exist
            currentSession.expireSession(
              'Game not found. It may have been deleted or the link is invalid.',
              false
            );
          }
        }
      },
      (err: FirestoreError) => {
        console.error('[useGame] Firestore error:', err);
        setError(err);
        setIsLoading(false);

        const currentSession = sessionRef.current;
        const connected = isConnectedRef.current;

        // Check error type and provide appropriate message
        if (err.code === 'permission-denied') {
          currentSession.expireSession(
            'You no longer have access to this game.',
            true // Might be able to rejoin
          );
        } else if (err.code === 'unavailable') {
          // Firestore unavailable - connection issue
          // Don't expire immediately, the connection provider will handle reconnect
          if (!connected) {
            currentSession.expireSession(
              'Connection lost. Please check your internet connection.',
              true
            );
          }
        } else {
          currentSession.expireSession(
            'Unable to load game. Please try again.',
            true
          );
        }
      }
    );
    
    return () => {
      unsubscribe();
    };
  }, [gameId]); // Only depend on gameId - session access via ref

  return {
    game,
    session,
    isLoading,
    error,
  };
}