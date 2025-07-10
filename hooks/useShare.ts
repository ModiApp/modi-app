import * as Linking from 'expo-linking';
import { Share } from 'react-native';

/**
 * Hook providing sharing functionality for inviting others to a game.
 *
 * This opens the native share sheet with a link to join the specified game.
 */
export function useShare() {
  const shareGame = async (gameId: string) => {
    try {
      const url = Linking.createURL(`/games/${gameId}`);
      await Share.share({
        message: `Join my Modi game!\n${url}`,
        url,
      });
    } catch (err) {
      console.log('useShare: Error sharing game link', err);
    }
  };

  return { shareGame };
}
