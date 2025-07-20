import { functions } from '@/config/firebase';
import { LeaveGameRequest, LeaveGameResponse } from '@/functions/src/leaveGame';
import { useRouter } from 'expo-router';
import { httpsCallable } from 'firebase/functions';
import { useState } from 'react';
import { Alert } from '@/ui/components/AlertBanner';

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

  const leaveGame = async () => {
    try {
      console.log("useLeaveGame: Leaving game");
      setIsLeaving(true);

      const result = await leaveGameFunction({});

      console.log("useLeaveGame: Successfully left game:", result.data);
      
      // Navigate back to home screen
      router.push("/");
    } catch (error: any) {
      console.error("useLeaveGame: Error leaving game:", error);
      
      // Handle different types of errors
      if (error.code === 'functions/failed-precondition') {
        Alert.error({ message: 'You cannot leave this game. You may be the host or the game has already started.' });
      } else if (error.code === 'functions/unauthenticated') {
        Alert.error({ message: 'Please sign in to leave a game.' });
      } else if (error.code === 'functions/not-found') {
        Alert.error({ message: 'Game not found.' });
      } else {
        Alert.error({ message: 'Failed to leave game. Please try again.' });
      }
    } finally {
      setIsLeaving(false);
    }
  };

  return {
    leaveGame,
    isLeaving,
  };
}
