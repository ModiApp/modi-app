import { auth } from '@/config/firebase';
import { Alert } from '@/ui/components/AlertBanner';
import { usePathname, useRouter } from 'expo-router';
import { useState } from 'react';
async function joinGameApi(gameId: string) {
  const response = await fetch(`${process.env.EXPO_PUBLIC_API_BASE_URL}/games/join`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${await auth.currentUser?.getIdToken()}`,
    },
    body: JSON.stringify({ gameId }),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Failed to join game: ${response.statusText}`);
  }
  return response.json() as Promise<{ success: boolean; gameId: string }>;
}

/**
 * A hook to join an existing game lobby.
 * 
 * This hook is used in the JoinLobby screen to join an existing game by providing a game ID.
 * It validates the game ID, calls the joinGame cloud function, and navigates to the lobby on success.
 */
export function useJoinLobby() {
  const router = useRouter();
  const pathname = usePathname();
  const [isJoining, setIsJoining] = useState(false);

  const joinLobby = async (gameId: string) => {
    if (!gameId || gameId.trim().length === 0) {
      Alert.error({ message: "Please enter a valid game ID" });
      return;
    }

    try {
      console.log("useJoinLobby: Joining game", { gameId });
      setIsJoining(true);

      const result = await joinGameApi(gameId.trim());
      console.log("useJoinLobby: Successfully joined game:", result);
      
      // Navigate to the lobby with the game ID
      // if route is not already /games/:gameId, push to it
      if (pathname !== `games/${gameId}`) {
        router.push(`/games/${gameId}`);
      }
    } catch (error: any) {
      console.error("useJoinLobby: Error joining game:", error);
      
      Alert.error({ message: 'Failed to join game. Please try again.' });
    } finally {
      setIsJoining(false);
    }
  };

  return {
    joinLobby,
    isJoining,
  };
}
