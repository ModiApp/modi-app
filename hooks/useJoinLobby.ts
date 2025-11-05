import { auth } from '@/config/firebase';
import { Alert } from '@/ui/components/AlertBanner';
import { usePathname, useRouter } from 'expo-router';
import { useState } from 'react';

type JoinLobbyResult =
  | { success: true }
  | { success: false; errorMessage: string };

async function joinGameApi(gameId: string) {
  const response = await fetch(
    `${process.env.EXPO_PUBLIC_API_BASE_URL}/games/${gameId}/join`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${await auth.currentUser?.getIdToken()}`,
      },
      body: JSON.stringify({}),
    },
  );

  if (!response.ok) {
    const responseText = await response.text();
    let message = responseText;

    if (responseText) {
      try {
        const parsed = JSON.parse(responseText);
        message = parsed?.message || parsed?.error || responseText;
      } catch (error) {
        // Ignore JSON parsing errors and fall back to the raw response text.
      }
    }

    throw new Error(message || `Failed to join game: ${response.statusText}`);
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

  const joinLobby = async (gameId: string): Promise<JoinLobbyResult> => {
    const trimmedGameId = gameId.trim();

    if (!trimmedGameId) {
      const message = 'Please enter a valid game ID';
      Alert.error({ message });
      return { success: false, errorMessage: message };
    }

    try {
      console.log('useJoinLobby: Joining game', { gameId: trimmedGameId });
      setIsJoining(true);

      const result = await joinGameApi(trimmedGameId);
      console.log('useJoinLobby: Successfully joined game:', result);

      // Navigate to the lobby with the game ID
      // if route is not already /games/:gameId, push to it
      if (pathname !== `games/${trimmedGameId}`) {
        router.push(`/games/${trimmedGameId}`);
      }
      return { success: true as const };
    } catch (error: any) {
      console.error('useJoinLobby: Error joining game:', error);

      const message =
        typeof error?.message === 'string' && error.message.trim().length > 0
          ? error.message.trim()
          : 'Failed to join game. Please try again.';

      Alert.error({ message });

      return { success: false as const, errorMessage: message };
    } finally {
      setIsJoining(false);
    }
  };

  return {
    joinLobby,
    isJoining,
  };
}
