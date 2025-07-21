import { functions } from '@/config/firebase';
import { SetPlayerOrderRequest, SetPlayerOrderResponse } from '@/functions/src/setPlayerOrder';
import { httpsCallable } from 'firebase/functions';
import { useState } from 'react';
import { Alert } from '@/ui/components/AlertBanner';

const setPlayerOrderFunction = httpsCallable<SetPlayerOrderRequest, SetPlayerOrderResponse>(functions, 'setPlayerOrder');

export function useSetPlayerOrder() {
  const [isSettingOrder, setIsSettingOrder] = useState(false);

  const setPlayerOrder = async (gameId: string, players: string[]) => {
    if (!gameId || !players) {
      Alert.error({ message: 'Invalid arguments' });
      return;
    }
    try {
      setIsSettingOrder(true);
      await setPlayerOrderFunction({ gameId, players });
    } catch (error: any) {
      console.error('useSetPlayerOrder: Error setting player order:', error);
      if (error.code === 'functions/permission-denied') {
        Alert.error({ message: 'Only the host can reorder players.' });
      } else if (error.code === 'functions/failed-precondition') {
        Alert.error({ message: 'Players can only be reordered before the game starts.' });
      } else if (error.code === 'functions/unauthenticated') {
        Alert.error({ message: 'Please sign in to reorder players.' });
      } else if (error.code === 'functions/not-found') {
        Alert.error({ message: 'Game not found.' });
      } else if (error.code === 'functions/invalid-argument') {
        Alert.error({ message: 'Invalid request.' });
      } else {
        Alert.error({ message: 'Failed to reorder players.' });
      }
    } finally {
      setIsSettingOrder(false);
    }
  };

  return { setPlayerOrder, isSettingOrder };
}
