import { usePlayAgain } from '@/hooks/usePlayAgain';
import { Button, Text } from '@/ui/elements';
import React from 'react';

export function PlayAgainButton(props: { gameId: string }) {
  const { gameId } = props;
  const { playAgain, isPlayingAgain } = usePlayAgain();

  return (
    <Button
      color="blue"
      onPress={() => playAgain(gameId)}
      loading={isPlayingAgain}
      fullWidth
      style={{ flexDirection: 'row', gap: 8 }}
    >
      <Text>Play Again</Text>
    </Button>
  );
}
