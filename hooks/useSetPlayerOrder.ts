import { auth } from '@/config/firebase';
import { Alert } from '@/ui/components/AlertBanner';
import { useState } from 'react';

async function setPlayerOrderApi(gameId: string, players: string[]) {
  const response = await fetch(`${process.env.EXPO_PUBLIC_API_BASE_URL}/games/${gameId}/set-player-order`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${await auth.currentUser?.getIdToken()}`,
    },
    body: JSON.stringify({ players }),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Failed to reorder players: ${response.statusText}`);
  }
  return response.json() as Promise<{ success: boolean }>;
}

export function useSetPlayerOrder() {
  const [isSettingOrder, setIsSettingOrder] = useState(false);

  const setPlayerOrder = async (gameId: string, players: string[]) => {
    if (!gameId || !players) {
      Alert.error({ message: 'Invalid arguments' });
      return;
    }
    try {
      setIsSettingOrder(true);
      await setPlayerOrderApi(gameId, players);
    } catch (error: any) {
      console.error('useSetPlayerOrder: Error setting player order:', error);
      Alert.error({ message: 'Failed to reorder players.' });
    } finally {
      setIsSettingOrder(false);
    }
  };

  return { setPlayerOrder, isSettingOrder };
}
