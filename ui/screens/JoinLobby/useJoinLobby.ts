import { JoinGameRequest, JoinGameResponse } from '@/functions/src/joinGame';
import { useUsername } from '@/ui/providers/Username';
import { useRouter } from 'expo-router';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useState } from 'react';

const functions = getFunctions();
const joinGameFunction = httpsCallable<JoinGameRequest, JoinGameResponse>(functions, 'joinGame');

/**
 * A hook to join an existing game lobby.
 * 
 * This hook is used in the JoinLobby screen to join an existing game by providing a game ID.
 * It validates the game ID, calls the joinGame cloud function, and navigates to the lobby on success.
 */
export function useJoinLobby() {
  const router = useRouter();
  const { value: username } = useUsername();
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const joinLobby = async (gameId: string) => {
    if (!username) {
      setError("Please set a username first");
      return;
    }

    if (!gameId || gameId.trim().length === 0) {
      setError("Please enter a valid game ID");
      return;
    }

    try {
      console.log("useJoinLobby: Joining game", { gameId, username });
      setIsJoining(true);
      setError(null);

      const result = await joinGameFunction({
        username: username.trim(),
        gameId: gameId.trim(),
      });

      console.log("useJoinLobby: Successfully joined game:", result.data);
      
      // Navigate to the lobby with the game ID
      router.push(`/lobby?lobbyId=${gameId}`);
    } catch (error: any) {
      console.error("useJoinLobby: Error joining game:", error);
      
      // Handle different types of errors
      if (error.code === 'functions/not-found') {
        setError("Game not found. Please check the game ID.");
      } else if (error.code === 'functions/failed-precondition') {
        setError("Game is not accepting players right now.");
      } else if (error.code === 'functions/already-exists') {
        setError("Username is already taken in this game.");
      } else if (error.code === 'functions/unauthenticated') {
        setError("Please sign in to join a game.");
      } else if (error.code === 'functions/invalid-argument') {
        setError("Invalid game ID or username.");
      } else {
        setError("Failed to join game. Please try again.");
      }
    } finally {
      setIsJoining(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  return {
    joinLobby,
    isJoining,
    error,
    clearError,
  };
}
