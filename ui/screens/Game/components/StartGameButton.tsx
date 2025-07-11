import { useStartGame } from "@/hooks/useStartGame";
import { Button } from "@/ui/elements";
import React from "react";

export function StartGameButton(props: { gameId: string }) {
  const { gameId } = props;
  const { startGame, isStartingGame } = useStartGame();
  return (
    <Button
      color="blue"
      title="Start Game"
      onPress={() => startGame(gameId)}
      loading={isStartingGame}
    />
  );
}
