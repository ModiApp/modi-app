import { useUserId } from "@/providers/Auth";
import { Container } from "@/ui/elements";
import ScreenContainer from "@/ui/elements/Screen";
import { useLocalSearchParams } from "expo-router";
import React from "react";
import { CardTable } from "./components/CardTable";
import { AnimatedCards } from "./components/CardTable/AnimatedCards";
import { PlayerCircles } from "./components/CardTable/PlayerCircles";
import { ShareGameInfo } from "./components/ShareGameInfo";
import { useGame } from "./hooks/useGame";
import { PlayerControls } from "./PlayerControls";
import { PlayingProvider } from "./PlayingContext";

const GameScreen: React.FC = () => {
  // get the game id from the url
  const { gameId } = useLocalSearchParams<{ gameId: string }>();
  const game = useGame(gameId);
  const currentUserId = useUserId();
  if (!game) return <ScreenContainer />;

  return (
    <ScreenContainer>
      <PlayingProvider game={game}>
        <Container style={{ flex: 1, justifyContent: "space-between" }}>
          <Container
            style={{
              justifyContent: "center",
              paddingVertical: 32,
              paddingBottom: 16,
            }}
          >
            <ShareGameInfo />
          </Container>
          <Container style={{ flex: 1, marginBottom: 16 }}>
            <CardTable>
              <PlayerCircles />
              {game.status !== "gathering-players" && <AnimatedCards />}
            </CardTable>
          </Container>
          <Container
            style={{
              justifyContent: "flex-end",
            }}
          >
            <PlayerControls game={game} currUserId={currentUserId} />
          </Container>
        </Container>
      </PlayingProvider>
    </ScreenContainer>
  );
};

export default GameScreen;
