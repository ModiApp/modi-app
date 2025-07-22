import ScreenContainer from "@/ui/elements/Screen";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect } from "react";
import { GatheringPlayers } from "./GatheringPlayers";
import { useGame } from "./hooks/useGame";
import { GamePlaying } from "./Playing";

const GameScreen: React.FC = () => {
  // get the game id from the url
  const { gameId } = useLocalSearchParams<{ gameId: string }>();
  const game = useGame(gameId);
  const router = useRouter();

  useEffect(() => {
    if (game === null) {
      setTimeout(() => {
        router.replace("/");
      }, 0);
    }
  }, [game, router]);

  return (
    <ScreenContainer>
      {game?.status === "gathering-players" && <GatheringPlayers game={game} />}
      {game?.status === "active" && <GamePlaying game={game} />}
    </ScreenContainer>
  );
};

export default GameScreen;
