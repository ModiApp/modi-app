import { functions } from '@/config/firebase';
import { StickRequest, StickResponse } from '@/functions/src/stick';
import { httpsCallable } from 'firebase/functions';
import { useState } from 'react';
import { Alert } from '@/ui/components/AlertBanner';

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

  const stick = async () => {
    try {
      console.log("useStick: Sticking (passing turn)");
      setIsSticking(true);

      const result = await stickFunction({});

      console.log("useStick: Successfully stuck:", result.data);
      
      // The game state will automatically update via Firestore listeners
      // If the player was the dealer, the round state will change to "tallying"
      // If the player was not the dealer, the active player will change to the next player
      
    } catch (error: any) {
      console.error("useStick: Error sticking:", error);
      
      // Handle different types of errors
      if (error.code === 'functions/not-found') {
        Alert.error({ message: 'No active game found where you are the active player during playing state.' });
      } else if (error.code === 'functions/failed-precondition') {
        if (error.message?.includes('No alive players')) {
          Alert.error({ message: 'No alive players found to pass turn to.' });
        } else {
          Alert.error({ message: 'Cannot stick right now.' });
        }
      } else if (error.code === 'functions/unauthenticated') {
        Alert.error({ message: 'Please sign in to stick.' });
      } else if (error.code === 'functions/invalid-argument') {
        Alert.error({ message: 'Invalid request.' });
      } else {
        Alert.error({ message: 'Failed to stick. Please try again.' });
      }
    } finally {
      setIsSticking(false);
    }
  };

  return {
    stick,
    isSticking,
  };
}
