import { usePlayAgain } from '@/hooks/usePlayAgain';
import { Button, Icon } from '@/ui/elements';
import React from 'react';

export function PlayAgainButton(props: { gameId: string }) {
  const { gameId } = props;
  const { playAgain, isPlayingAgain } = usePlayAgain();

  return (
    <Button
      color="blue"
      onPress={() => playAgain(gameId)}
      loading={isPlayingAgain}
      style={{ height: '100%', aspectRatio: 1, borderRadius: 100 }}
    >
      <Icon name="refresh" size={22} color="white" />
    </Button>
  );
}
