import ScreenContainer from "@/ui/elements/Screen";
import Text from "@/ui/elements/Text";
import { useLocalSearchParams } from "expo-router";
import React from "react";
import { useGame } from "./hooks/useGame";

const GameScreen: React.FC = () => {
  // get the game id from the url
  const { gameId } = useLocalSearchParams<{ gameId: string }>();
  const game = useGame(gameId);

  return (
    <ScreenContainer>
      <Text>Game Screen: {JSON.stringify(game)}</Text>
    </ScreenContainer>
  );
};

export default GameScreen;
