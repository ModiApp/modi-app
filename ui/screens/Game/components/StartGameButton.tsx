import { useStartGame } from "@/hooks/useStartGame";
import { Button } from "@/ui/elements";
import React from "react";

interface StartGameButtonProps {
  gameId: string;
  fullWidth?: boolean;
}

export function StartGameButton({ gameId, fullWidth = false }: StartGameButtonProps) {
  const { startGame, isStartingGame } = useStartGame();
  return (
    <Button
      color="blue"
      title="Start Game"
      onPress={() => startGame(gameId)}
      loading={isStartingGame}
      fullWidth={fullWidth}
    />
  );
}
