import { auth } from '@/config/firebase';
import { CreateGameResponse } from '@/functions/src/createGame';
import { Alert } from '@/ui/components/AlertBanner';
import { useRouter } from 'expo-router';
import { useState } from 'react';

async function createGameFunction() {
  const response = await fetch('http://localhost:3000/games', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${await auth.currentUser?.getIdToken()}`,
    },
  });
  if (!response.ok) {
    throw new Error(`Failed to create game: ${response.statusText}`);
  }
  return response.json() as Promise<CreateGameResponse>;
}

/**
 * A hook to create a new game in the backend and navigate to the game screen.
 * 
 * This hook is used in the Home screen to create a new game and navigate to the game screen.
 * It's also used in the Lobby screen to create a new game and navigate to the game screen.
 */
export function useCreateGame() {
  const router = useRouter();
  const [isCreatingGame, setIsCreatingGame] = useState(false);
  const createGame = async () => {
    try {
      console.log("useCreateGame: Creating game");
      setIsCreatingGame(true);
      const game = await createGameFunction();
      console.log("useCreateGame: Game created:", game);
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