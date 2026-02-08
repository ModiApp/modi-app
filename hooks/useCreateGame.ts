import { API_BASE_URL } from '@/config/api';
import { auth } from '@/config/firebase';
import { useAuth } from '@/providers/Auth';
import { Alert } from '@/ui/components/AlertBanner';
import { useRouter } from 'expo-router';
import { useState } from 'react';

type CreateGameResponse = { gameId: string };

async function createGameFunction() {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("Not authenticated - please wait for sign-in to complete");
  }
  const token = await user.getIdToken();
  const response = await fetch(`${API_BASE_URL}/games`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    throw new Error(`Failed to create game: ${response.statusText}`);
  }
  return response.json() as Promise<CreateGameResponse>;
}

/**
 * A hook to create a new game in the backend and navigate to the game screen.
 */
export function useCreateGame() {
  const router = useRouter();
  const { userId, isLoading: isAuthLoading } = useAuth();
  const [isCreatingGame, setIsCreatingGame] = useState(false);
  
  const createGame = async () => {
    if (isAuthLoading || !userId) {
      Alert.error({ message: "Still signing in, please wait..." });
      return;
    }
    try {
      setIsCreatingGame(true);
      const game = await createGameFunction();
      router.push(`/games/${game.gameId}`);
    } catch (error: any) {
      console.error("useCreateGame: Error creating game:", error);
      Alert.error({ message: ["Failed to create game", error.message].join(": ") });
    } finally {
      setIsCreatingGame(false);
    }
  };

  return { createGame, isCreatingGame };
}