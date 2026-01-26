import { API_BASE_URL } from '@/config/api';
import { auth } from '@/config/firebase';
import { Alert } from '@/ui/components/AlertBanner';
import { useCurrentGame } from '@/ui/screens/Game/PlayingContext';
import { useState } from 'react';

async function endRoundApi(gameId: string) {
  const response = await fetch(`${API_BASE_URL}/games/${gameId}/end-round`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${await auth.currentUser?.getIdToken()}`,
    },
    body: JSON.stringify({}),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Failed to end round: ${response.statusText}`);
  }
  return response.json() as Promise<{ success: boolean }>;
}

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
  const { game } = useCurrentGame();

  const endRound = async () => {
    try {
      console.log("useEndRound: Ending round");
      setIsEndingRound(true);

      const result = await endRoundApi(game.gameId);
      console.log("useEndRound: Round ended successfully:", result);
      
      // The game state will automatically update via Firestore listeners
      // The round state will change from "tallying" to "pre-deal"
      // Player lives will be updated
      // Dealer and active player will be rotated
      // Round number will be incremented
      // All cards will be moved to trash pile
      
    } catch (error: any) {
      console.error("useEndRound: Error ending round:", error);
      
      Alert.error({ message: 'Failed to end round. Please try again.' });
    } finally {
      setIsEndingRound(false);
    }
  };

  return {
    endRound,
    isEndingRound,
  };
}
