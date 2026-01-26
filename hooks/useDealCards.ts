import { API_BASE_URL } from '@/config/api';
import { auth } from '@/config/firebase';
import { Alert } from '@/ui/components/AlertBanner';
import { useCurrentGame } from '@/ui/screens/Game/PlayingContext';
import { useState } from 'react';

async function dealCardsApi(gameId: string) {
  const response = await fetch(`${API_BASE_URL}/games/${gameId}/deal`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${await auth.currentUser?.getIdToken()}`,
    },
    body: JSON.stringify({}),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Failed to deal cards: ${response.statusText}`);
  }
  return response.json() as Promise<{ success: boolean }>;
}

/**
 * A hook to deal cards to all players in a game.
 * 
 * This hook is used in the GamePlaying screen to deal cards when the dealer is ready.
 * It calls the dealCards cloud function and handles the transition from pre-deal to playing state.
 * Only the current dealer can deal cards, and only when the round state is "pre-deal".
 */
export function useDealCards() {
  const [isDealing, setIsDealing] = useState(false);
  const { game } = useCurrentGame();

  const dealCards = async () => {
    try {
      console.log("useDealCards: Dealing cards");
      setIsDealing(true);

      const result = await dealCardsApi(game.gameId);
      console.log("useDealCards: Cards dealt successfully:", result);
      
      // The game state will automatically update via Firestore listeners
      // The round state will change from "pre-deal" to "playing"
      // Player hands will be updated with their cards
      
    } catch (error: any) {
      console.error("useDealCards: Error dealing cards:", error);
      
      Alert.error({ message: 'Failed to deal cards. Please try again.' });
    } finally {
      setIsDealing(false);
    }
  };

  return {
    dealCards,
    isDealing,
  };
}
