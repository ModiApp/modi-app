import { useUserId } from "@/providers/Auth";
import { Container } from "@/ui/elements";
import ScreenContainer from "@/ui/elements/Screen";
import { GameActionProvider } from "@/ui/screens/Game/GameActionsProvider";
import { useLocalSearchParams } from "expo-router";
import React from "react";
import { CardTable } from "./components/CardTable";
import { AnimatedCards } from "./components/CardTable/AnimatedCards";
import { LiveCounts } from "./components/CardTable/LiveCounts";
import { PlayerCircles } from "./components/CardTable/PlayerCircles";
import { ShareGameInfo } from "./components/ShareGameInfo";
import { WinnerInfo } from "./components/WinnerInfo";
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
        <GameActionProvider>
          <Container style={{ flex: 1, justifyContent: "space-between" }}>
            <Container
              style={{
                justifyContent: "center",
                paddingVertical: 32,
                paddingBottom: 16,
              }}
            >
              <ShareGameInfo />
              <WinnerInfo />
            </Container>
            <Container style={{ flex: 1, marginBottom: 16 }}>
              <CardTable>
                <PlayerCircles />
                {game.status !== "gathering-players" && <AnimatedCards />}
                {game.status !== "gathering-players" && <LiveCounts />}
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
        </GameActionProvider>
      </PlayingProvider>
    </ScreenContainer>
  );
};

export default GameScreen;
