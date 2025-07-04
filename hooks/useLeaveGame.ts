import { LeaveGameRequest, LeaveGameResponse } from '@/functions/src/leaveGame';
import { useRouter } from 'expo-router';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useState } from 'react';

const functions = getFunctions();
const leaveGameFunction = httpsCallable<LeaveGameRequest, LeaveGameResponse>(functions, 'leaveGame');

/**
 * A hook to leave the current game.
 * 
 * This hook is used to leave the game the user is currently participating in.
 * It calls the leaveGame cloud function and navigates back to the home screen on success.
 */
export function useLeaveGame() {
  const router = useRouter();
  const [isLeaving, setIsLeaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const leaveGame = async () => {
    try {
      console.log("useLeaveGame: Leaving game");
      setIsLeaving(true);
      setError(null);

      const result = await leaveGameFunction({});

      console.log("useLeaveGame: Successfully left game:", result.data);
      
      // Navigate back to home screen
      router.push("/");
    } catch (error: any) {
      console.error("useLeaveGame: Error leaving game:", error);
      
      // Handle different types of errors
      if (error.code === 'functions/failed-precondition') {
        setError("You cannot leave this game. You may be the host or the game has already started.");
      } else if (error.code === 'functions/unauthenticated') {
        setError("Please sign in to leave a game.");
      } else if (error.code === 'functions/not-found') {
        setError("Game not found.");
      } else {
        setError("Failed to leave game. Please try again.");
      }
    } finally {
      setIsLeaving(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  return {
    leaveGame,
    isLeaving,
    error,
    clearError,
  };
}
