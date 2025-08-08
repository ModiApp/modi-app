import { auth } from '@/config/firebase';
import { Alert } from '@/ui/components/AlertBanner';
import { useRouter } from 'expo-router';
import { useState } from 'react';

async function leaveGameApi() {
  const response = await fetch(`${process.env.EXPO_PUBLIC_API_BASE_URL}/games/leave`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${await auth.currentUser?.getIdToken()}`,
    },
    body: JSON.stringify({}),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Failed to leave game: ${response.statusText}`);
  }
  return response.json() as Promise<{ success: boolean; gameId: string }>;
}

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

      const result = await leaveGameApi();
      console.log("useLeaveGame: Successfully left game:", result);
      
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
