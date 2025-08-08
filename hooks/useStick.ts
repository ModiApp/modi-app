import { auth } from '@/config/firebase';
import { Alert } from '@/ui/components/AlertBanner';
import { useState } from 'react';

async function stickApi() {
  const response = await fetch(`${process.env.EXPO_PUBLIC_API_BASE_URL}/games/stick`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${await auth.currentUser?.getIdToken()}`,
    },
    body: JSON.stringify({}),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Failed to stick: ${response.statusText}`);
  }
  return response.json() as Promise<{ success: boolean }>;
}

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

      const result = await stickApi();
      console.log("useStick: Successfully stuck:", result);
      
      // The game state will automatically update via Firestore listeners
      // If the player was the dealer, the round state will change to "tallying"
      // If the player was not the dealer, the active player will change to the next player
      
    } catch (error: any) {
      console.error("useStick: Error sticking:", error);
      
      Alert.error({ message: 'Failed to stick. Please try again.' });
    } finally {
      setIsSticking(false);
    }
  };

  return {
    stick,
    isSticking,
  };
}
