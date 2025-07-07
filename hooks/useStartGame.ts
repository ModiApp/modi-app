import { functions } from '@/config/firebase';
import { StartGameRequest, StartGameResponse } from '@/functions/src/startGame';
import { httpsCallable } from 'firebase/functions';
import { useState } from 'react';

const startGameFunction = httpsCallable<StartGameRequest, StartGameResponse>(functions, 'startGame');

/**
 * A hook to start a game that's in the gathering-players state.
 * 
 * This hook is used in the Lobby screen to start the game when the host is ready.
 * It calls the startGame cloud function and handles the transition to active game state.
 * Only the host of the game can start it.
 */
export function useStartGame() {
  const [isStartingGame, setIsStartingGame] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startGame = async (gameId: string) => {
    if (!gameId || gameId.trim().length === 0) {
      setError("Invalid game ID");
      return;
    }

    try {
      console.log("useStartGame: Starting game", gameId);
      setIsStartingGame(true);
      setError(null);

      const result = await startGameFunction({
        gameId: gameId.trim(),
      });

      console.log("useStartGame: Game started successfully:", result.data);
      
      // The game is now active, but we stay on the same route
      // The game screen will handle the active game state
      // You might want to trigger a refresh of the game data here
      
    } catch (error: any) {
      console.error("useStartGame: Error starting game:", error);
      
      // Handle different types of errors
      if (error.code === 'functions/not-found') {
        setError("Game not found. Please check the game ID.");
      } else if (error.code === 'functions/failed-precondition') {
        if (error.message?.includes('gathering-players')) {
          setError("Game is not in the correct state to start.");
        } else if (error.message?.includes('2 players')) {
          setError("Need at least 2 players to start the game.");
        } else {
          setError("Game cannot be started right now.");
        }
      } else if (error.code === 'functions/permission-denied') {
        setError("Only the host can start the game.");
      } else if (error.code === 'functions/unauthenticated') {
        setError("Please sign in to start the game.");
      } else if (error.code === 'functions/invalid-argument') {
        setError("Invalid game ID.");
      } else {
        setError("Failed to start game. Please try again.");
      }
    } finally {
      setIsStartingGame(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  return {
    startGame,
    isStartingGame,
    error,
    clearError,
  };
}
