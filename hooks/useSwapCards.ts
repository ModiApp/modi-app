import { functions } from '@/config/firebase';
import { SwapCardRequest, SwapCardResponse } from '@/functions/src/swapCard';
import { httpsCallable } from 'firebase/functions';
import { useState } from 'react';

const swapCardFunction = httpsCallable<SwapCardRequest, SwapCardResponse>(functions, 'swapCard');

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
  const [error, setError] = useState<string | null>(null);

  const swapCard = async () => {
    try {
      console.log("useSwapCards: Swapping cards");
      setIsSwapping(true);
      setError(null);

      const result = await swapCardFunction({});

      console.log("useSwapCards: Cards swapped successfully:", result.data);
      
      // The game state will automatically update via Firestore listeners
      // Player hands will be updated with their new cards
      // The active player will change to the next player
      // If the dealer drew, the round state will change to "tallying"
      
    } catch (error: any) {
      console.error("useSwapCards: Error swapping cards:", error);
      
      // Handle different types of errors
      if (error.code === 'functions/not-found') {
        setError("No active game found where you are the active player.");
      } else if (error.code === 'functions/failed-precondition') {
        if (error.message?.includes('not active')) {
          setError("Game is not active.");
        } else if (error.message?.includes('playing')) {
          setError("Cards can only be swapped during playing state.");
        } else if (error.message?.includes('No cards left')) {
          setError("No cards left in deck or trash.");
        } else if (error.message?.includes('No alive players')) {
          setError("No alive players found to swap with.");
        } else if (error.message?.includes('no card to swap')) {
          setError("You have no card to swap.");
        } else if (error.message?.includes('Next player has no card')) {
          setError("The next player has no card to swap.");
        } else if (error.message?.includes('Players with Kings cannot swap')) {
          setError("Players with Kings cannot swap cards.");
        } else {
          setError("Cards cannot be swapped right now.");
        }
      } else if (error.code === 'functions/permission-denied') {
        setError("Only the active player can swap cards.");
      } else if (error.code === 'functions/unauthenticated') {
        setError("Please sign in to swap cards.");
      } else if (error.code === 'functions/invalid-argument') {
        setError("Invalid request.");
      } else {
        setError("Failed to swap cards. Please try again.");
      }
    } finally {
      setIsSwapping(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  return {
    swapCard,
    isSwapping,
    error,
    clearError,
  };
}
