import { functions } from '@/config/firebase';
import { StickRequest, StickResponse } from '@/functions/src/stick';
import { httpsCallable } from 'firebase/functions';
import { useState } from 'react';

const stickFunction = httpsCallable<StickRequest, StickResponse>(functions, 'stick');

/**
 * A hook to stick (pass turn) for the active player.
 * 
 * This hook is used in the GamePlaying screen when the active player wants to stick.
 * It calls the stick cloud function and handles the turn passing logic.
 * Only the current active player can stick, and only when the round state is "playing".
 * 
 * Special cases:
 * - If the active player is the dealer, sticking updates the round state to "tallying"
 * - If the active player is not the dealer, sticking passes the turn to the next alive player to their left
 */
export function useStick() {
  const [isSticking, setIsSticking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stick = async () => {
    try {
      console.log("useStick: Sticking (passing turn)");
      setIsSticking(true);
      setError(null);

      const result = await stickFunction({});

      console.log("useStick: Successfully stuck:", result.data);
      
      // The game state will automatically update via Firestore listeners
      // If the player was the dealer, the round state will change to "tallying"
      // If the player was not the dealer, the active player will change to the next player
      
    } catch (error: any) {
      console.error("useStick: Error sticking:", error);
      
      // Handle different types of errors
      if (error.code === 'functions/not-found') {
        setError("No active game found where you are the active player during playing state.");
      } else if (error.code === 'functions/failed-precondition') {
        if (error.message?.includes('No alive players')) {
          setError("No alive players found to pass turn to.");
        } else {
          setError("Cannot stick right now.");
        }
      } else if (error.code === 'functions/unauthenticated') {
        setError("Please sign in to stick.");
      } else if (error.code === 'functions/invalid-argument') {
        setError("Invalid request.");
      } else {
        setError("Failed to stick. Please try again.");
      }
    } finally {
      setIsSticking(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  return {
    stick,
    isSticking,
    error,
    clearError,
  };
}
