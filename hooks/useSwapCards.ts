import { auth } from '@/config/firebase';
import { Alert } from '@/ui/components/AlertBanner';
import { useCurrentGame } from '@/ui/screens/Game/PlayingContext';
import { useState } from 'react';

async function swapCardApi(gameId: string) {
  const response = await fetch(`${process.env.EXPO_PUBLIC_API_BASE_URL}/games/${gameId}/swap`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${await auth.currentUser?.getIdToken()}`,
    },
    body: JSON.stringify({}),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Failed to swap cards: ${response.statusText}`);
  }
  return response.json() as Promise<{ success: boolean }>;
}

/**
 * A hook to swap cards between the active player and the next alive player to their left.
 * 
 * This hook is used in the GamePlaying screen when the active player wants to swap their card.
 * It calls the swapCard cloud function and handles the card swapping logic.
 * Only the current active player can swap cards, and only when the round state is "playing".
 * 
 * Special cases:
 * - If the active player is the dealer, they draw a new card from the deck instead of swapping
 * - If the next player has a king, the swap is disallowed and the turn passes to that player
 * - After the dealer draws, the round state changes to "tallying"
 */
export function useSwapCards() {
  const [isSwapping, setIsSwapping] = useState(false);
  const { game } = useCurrentGame();

  const swapCard = async () => {
    try {
      console.log("useSwapCards: Swapping cards");
      setIsSwapping(true);

      const result = await swapCardApi(game.gameId);
      console.log("useSwapCards: Cards swapped successfully:", result);
      
      // The game state will automatically update via Firestore listeners
      // Player hands will be updated with their new cards
      // The active player will change to the next player
      // If the dealer drew, the round state will change to "tallying"
      
    } catch (error: any) {
      console.error("useSwapCards: Error swapping cards:", error);
      
      Alert.error({ message: 'Failed to swap cards. Please try again.' });
    } finally {
      setIsSwapping(false);
    }
  };

  return {
    swapCard,
    isSwapping,
  };
}
