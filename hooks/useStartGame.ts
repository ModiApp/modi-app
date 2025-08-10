import { auth } from '@/config/firebase';
import { Alert } from '@/ui/components/AlertBanner';
import { useState } from 'react';

async function startGameApi(gameId: string) {
  const response = await fetch(`${process.env.EXPO_PUBLIC_API_BASE_URL}/games/${gameId}/start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${await auth.currentUser?.getIdToken()}`,
    },
    body: JSON.stringify({}),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Failed to start game: ${response.statusText}`);
  }
  return response.json() as Promise<{ success: boolean }>;
}

/**
 * A hook to start a game that's in the gathering-players state.
 * 
 * This hook is used in the Lobby screen to start the game when the host is ready.
 * It calls the startGame cloud function and handles the transition to active game state.
 * Only the host of the game can start it.
 */
export function useStartGame() {
  const [isStartingGame, setIsStartingGame] = useState(false);

  const startGame = async (gameId: string) => {
    if (!gameId || gameId.trim().length === 0) {
      Alert.error({ message: "Invalid game ID" });
      return;
    }

    try {
      console.log("useStartGame: Starting game", gameId);
      setIsStartingGame(true);

      const result = await startGameApi(gameId.trim());
      console.log("useStartGame: Game started successfully:", result);
      
      // The game is now active, but we stay on the same route
      // The game screen will handle the active game state
      // You might want to trigger a refresh of the game data here
      
    } catch (error: any) {
      console.error("useStartGame: Error starting game:", error);
      
      Alert.error({ message: 'Failed to start game. Please try again.' });
    } finally {
      setIsStartingGame(false);
    }
  };

  return {
    startGame,
    isStartingGame,
  };
}
