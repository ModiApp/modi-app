import { functions } from '@/config/firebase';
import { EndRoundRequest, EndRoundResponse } from '@/functions/src/endRound';
import { httpsCallable } from 'firebase/functions';
import { useState } from 'react';

const endRoundFunction = httpsCallable<EndRoundRequest, EndRoundResponse>(functions, 'endRound');

/**
 * A hook to end the current round and resolve the game state.
 * 
 * This hook is used in the GamePlaying screen to end the round when the dealer is ready.
 * It calls the endRound cloud function and handles the transition from tallying to pre-deal state.
 * Only the current dealer (who must also be the active player) can end the round,
 * and only when the round state is "tallying".
 * 
 * The function will:
 * - Find players with the lowest ranking card and decrement their lives
 * - Move all cards to the trash pile
 * - Rotate dealer and active player to the next alive player to the left
 * - Set round state back to 'pre-deal'
 * - Increment the round number
 */
export function useEndRound() {
  const [isEndingRound, setIsEndingRound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const endRound = async () => {
    try {
      console.log("useEndRound: Ending round");
      setIsEndingRound(true);
      setError(null);

      const result = await endRoundFunction({});

      console.log("useEndRound: Round ended successfully:", result.data);
      
      // The game state will automatically update via Firestore listeners
      // The round state will change from "tallying" to "pre-deal"
      // Player lives will be updated
      // Dealer and active player will be rotated
      // Round number will be incremented
      // All cards will be moved to trash pile
      
    } catch (error: any) {
      console.error("useEndRound: Error ending round:", error);
      
      // Handle different types of errors
      if (error.code === 'functions/not-found') {
        setError("No active game found where you are the dealer.");
      } else if (error.code === 'functions/failed-precondition') {
        if (error.message?.includes('not active')) {
          setError("Game is not active.");
        } else if (error.message?.includes('tallying')) {
          setError("Round can only be ended in tallying state.");
        } else if (error.message?.includes('No player hands found')) {
          setError("No player hands found.");
        } else if (error.message?.includes('No valid player cards found')) {
          setError("No valid player cards found.");
        } else if (error.message?.includes('No alive players found for new dealer')) {
          setError("No alive players found for new dealer.");
        } else if (error.message?.includes('No alive players found for new active player')) {
          setError("No alive players found for new active player.");
        } else {
          setError("Round cannot be ended right now.");
        }
      } else if (error.code === 'functions/permission-denied') {
        if (error.message?.includes('dealer')) {
          setError("Only the dealer can end the round.");
        } else if (error.message?.includes('active player')) {
          setError("Only the active player can end the round.");
        } else {
          setError("You don't have permission to end the round.");
        }
      } else if (error.code === 'functions/unauthenticated') {
        setError("Please sign in to end the round.");
      } else if (error.code === 'functions/invalid-argument') {
        setError("Invalid request.");
      } else {
        setError("Failed to end round. Please try again.");
      }
    } finally {
      setIsEndingRound(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  return {
    endRound,
    isEndingRound,
    error,
    clearError,
  };
}
