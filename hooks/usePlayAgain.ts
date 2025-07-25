import { functions } from '@/config/firebase';
import { PlayAgainRequest, PlayAgainResponse } from '@/functions/src/playAgain';
import { useRouter } from 'expo-router';
import { httpsCallable } from 'firebase/functions';
import { useState } from 'react';
import { Alert } from '@/ui/components/AlertBanner';

const playAgainFunction = httpsCallable<PlayAgainRequest, PlayAgainResponse>(functions, 'playAgain');

export function usePlayAgain() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const playAgain = async (gameId: string) => {
    try {
      setIsLoading(true);
      const result = await playAgainFunction({ gameId });
      router.push(`/games/${result.data.gameId}`);
    } catch (error) {
      console.error('usePlayAgain: Error creating new game', error);
      Alert.error({ message: 'Failed to start a new game. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  return { playAgain, isPlayingAgain: isLoading };
}
