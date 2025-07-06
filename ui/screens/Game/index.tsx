import ScreenContainer from "@/ui/elements/Screen";
import { useLocalSearchParams } from "expo-router";
import React from "react";
import { GatheringPlayers } from "./GatheringPlayers";
import { useGame } from "./hooks/useGame";

const GameScreen: React.FC = () => {
  // get the game id from the url
  const { gameId } = useLocalSearchParams<{ gameId: string }>();
  const game = useGame(gameId);

  return (
    <ScreenContainer>
      {game?.gameState === "gathering-players" && (
        <GatheringPlayers game={game} />
      )}
    </ScreenContainer>
  );
};

export default GameScreen;
