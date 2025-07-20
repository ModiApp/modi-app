import { functions } from '@/config/firebase';
import { JoinGameRequest, JoinGameResponse } from '@/functions/src/joinGame';
import { useUsername } from '@/providers/Username';
import { usePathname, useRouter } from 'expo-router';
import { httpsCallable } from 'firebase/functions';
import { useState } from 'react';
import { Alert } from '@/ui/components/AlertBanner';

const joinGameFunction = httpsCallable<JoinGameRequest, JoinGameResponse>(functions, 'joinGame');

/**
 * A hook to join an existing game lobby.
 * 
 * This hook is used in the JoinLobby screen to join an existing game by providing a game ID.
 * It validates the game ID, calls the joinGame cloud function, and navigates to the lobby on success.
 */
export function useJoinLobby() {
  const router = useRouter();
  const pathname = usePathname();
  const { value: username } = useUsername();
  const [isJoining, setIsJoining] = useState(false);

  const joinLobby = async (gameId: string) => {
    if (!username) {
      Alert.error({ message: "Please set a username first" });
      return;
    }

    if (!gameId || gameId.trim().length === 0) {
      Alert.error({ message: "Please enter a valid game ID" });
      return;
    }

    try {
      console.log("useJoinLobby: Joining game", { gameId, username });
      setIsJoining(true);

      const result = await joinGameFunction({
        username: username.trim(),
        gameId: gameId.trim(),
      });

      console.log("useJoinLobby: Successfully joined game:", result.data);
      
      // Navigate to the lobby with the game ID
      // if route is not already /games/:gameId, push to it
      if (pathname !== `games/${gameId}`) {
        router.push(`/games/${gameId}`);
      }
    } catch (error: any) {
      console.error("useJoinLobby: Error joining game:", error);
      
      // Handle different types of errors
      if (error.code === 'functions/not-found') {
        Alert.error({ message: 'Game not found. Please check the game ID.' });
      } else if (error.code === 'functions/failed-precondition') {
        Alert.error({ message: 'Game is not accepting players right now.' });
      } else if (error.code === 'functions/already-exists') {
        Alert.error({ message: 'Username is already taken in this game.' });
      } else if (error.code === 'functions/unauthenticated') {
        Alert.error({ message: 'Please sign in to join a game.' });
      } else if (error.code === 'functions/invalid-argument') {
        Alert.error({ message: 'Invalid game ID or username.' });
      } else {
        Alert.error({ message: 'Failed to join game. Please try again.' });
      }
    } finally {
      setIsJoining(false);
    }
  };

  return {
    joinLobby,
    isJoining,
  };
}
