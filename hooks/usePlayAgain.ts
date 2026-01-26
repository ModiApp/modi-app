import { API_BASE_URL } from '@/config/api';
import { auth } from '@/config/firebase';
import { Alert } from '@/ui/components/AlertBanner';
import { useRouter } from 'expo-router';
import { useState } from 'react';

async function playAgainApi(gameId: string) {
  const response = await fetch(`${API_BASE_URL}/games/${gameId}/play-again`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${await auth.currentUser?.getIdToken()}`,
    },
    body: JSON.stringify({}),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Failed to start a new game: ${response.statusText}`);
  }
  return response.json() as Promise<{ gameId: string }>;
}

export function usePlayAgain() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const playAgain = async (gameId: string) => {
    try {
      setIsLoading(true);
      const result = await playAgainApi(gameId);
      router.push(`/games/${result.gameId}`);
    } catch (error) {
      console.error('usePlayAgain: Error creating new game', error);
      Alert.error({ message: 'Failed to start a new game. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  return { playAgain, isPlayingAgain: isLoading };
}
