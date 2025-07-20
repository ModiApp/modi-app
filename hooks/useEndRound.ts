import { functions } from '@/config/firebase';
import { EndRoundRequest, EndRoundResponse } from '@/functions/src/endRound';
import { httpsCallable } from 'firebase/functions';
import { useState } from 'react';
import { Alert } from '@/ui/components/AlertBanner';

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

  const endRound = async () => {
    try {
      console.log("useEndRound: Ending round");
      setIsEndingRound(true);

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
        Alert.error({ message: "No active game found where you are the dealer." });
      } else if (error.code === 'functions/failed-precondition') {
        if (error.message?.includes('not active')) {
          Alert.error({ message: "Game is not active." });
        } else if (error.message?.includes('tallying')) {
          Alert.error({ message: "Round can only be ended in tallying state." });
        } else if (error.message?.includes('No player hands found')) {
          Alert.error({ message: "No player hands found." });
        } else if (error.message?.includes('No valid player cards found')) {
          Alert.error({ message: "No valid player cards found." });
        } else if (error.message?.includes('No alive players found for new dealer')) {
          Alert.error({ message: "No alive players found for new dealer." });
        } else if (error.message?.includes('No alive players found for new active player')) {
          Alert.error({ message: "No alive players found for new active player." });
        } else {
          Alert.error({ message: "Round cannot be ended right now." });
        }
      } else if (error.code === 'functions/permission-denied') {
        if (error.message?.includes('dealer')) {
          Alert.error({ message: "Only the dealer can end the round." });
        } else if (error.message?.includes('active player')) {
          Alert.error({ message: "Only the active player can end the round." });
        } else {
          Alert.error({ message: "You don't have permission to end the round." });
        }
      } else if (error.code === 'functions/unauthenticated') {
        Alert.error({ message: "Please sign in to end the round." });
      } else if (error.code === 'functions/invalid-argument') {
        Alert.error({ message: "Invalid request." });
      } else {
        Alert.error({ message: "Failed to end round. Please try again." });
      }
    } finally {
      setIsEndingRound(false);
    }
  };

  return {
    endRound,
    isEndingRound,
  };
}
