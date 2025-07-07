import ScreenContainer from "@/ui/elements/Screen";
import { useLocalSearchParams } from "expo-router";
import React from "react";
import { GatheringPlayers } from "./GatheringPlayers";
import { useGame } from "./hooks/useGame";
import { GamePlaying } from "./Playing";

const GameScreen: React.FC = () => {
  // get the game id from the url
  const { gameId } = useLocalSearchParams<{ gameId: string }>();
  const game = useGame(gameId);

  return (
    <ScreenContainer>
      {game?.status === "gathering-players" && <GatheringPlayers game={game} />}
      {game?.status === "active" && <GamePlaying game={game} />}
    </ScreenContainer>
  );
};

export default GameScreen;
