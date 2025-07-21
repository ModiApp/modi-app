import { functions } from '@/config/firebase';
import { CreateGameRequest, CreateGameResponse } from '@/functions/src/createGame';
import { useRouter } from 'expo-router';
import { httpsCallable } from 'firebase/functions';
import { useState } from 'react';

const createGameFunction = httpsCallable<CreateGameRequest, CreateGameResponse>(functions, 'createGame');

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
      const game = await createGameFunction({});
      console.log("useCreateGame: Game created:", game);
      router.push(`/games/${game.data.gameId}`);
    } catch (error) {
      console.error("useCreateGame: Error creating game:", error);
    } finally {
      setIsCreatingGame(false);
    }
  };

  return { createGame, isCreatingGame };
}