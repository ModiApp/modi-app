import type { Game } from "@/api/src/types";
import { firestore } from "@/config/firebase";
import { useSessionTimeout, SessionTimeoutState } from "@/hooks/useSessionTimeout";
import { useConnection } from "@/providers/Connection";
import { doc, onSnapshot, FirestoreError } from "firebase/firestore";
import { useEffect, useState, useCallback, useRef } from "react";

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

  // Handle game state changes
  const handleGameUpdate = useCallback((gameData: Game | null) => {
    setGame(gameData);
    setIsLoading(false);
    setError(null);

    if (gameData) {
      // Game exists - track that we had a valid game
      hadGameRef.current = true;
      
      // If we were in expired/reconnecting state, reset to active
      if (session.sessionState === 'expired' || session.sessionState === 'reconnecting') {
        session.resetSession();
      }
    } else if (gameData === null) {
      // Game doesn't exist
      if (hadGameRef.current) {
        // We had a game before, now it's gone - session expired
        session.expireSession(
          'This game session has ended or was removed.',
          false // Can't rejoin a deleted game
        );
      } else {
        // Never had a game - it doesn't exist
        session.expireSession(
          'Game not found. It may have been deleted or the link is invalid.',
          false
        );
      }
    }
  }, [session]);

  // Handle Firestore errors
  const handleError = useCallback((err: FirestoreError) => {
    console.error('[useGame] Firestore error:', err);
    setError(err);
    setIsLoading(false);

    // Check error type and provide appropriate message
    if (err.code === 'permission-denied') {
      session.expireSession(
        'You no longer have access to this game.',
        true // Might be able to rejoin
      );
    } else if (err.code === 'unavailable') {
      // Firestore unavailable - connection issue
      // Don't expire immediately, the connection provider will handle reconnect
      if (!isConnected) {
        session.expireSession(
          'Connection lost. Please check your internet connection.',
          true
        );
      }
    } else {
      session.expireSession(
        'Unable to load game. Please try again.',
        true
      );
    }
  }, [session, isConnected]);

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
        if (snapshot.exists()) {
          handleGameUpdate(snapshot.data() as Game);
        } else {
          handleGameUpdate(null);
        }
      },
      (err) => {
        handleError(err);
      }
    );
    
    return () => {
      unsubscribe();
    };
  }, [gameId, handleGameUpdate, handleError]);

  return {
    game,
    session,
    isLoading,
    error,
  };
}