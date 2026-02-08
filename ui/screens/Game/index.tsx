import { useAuth } from "@/providers/Auth";
import { NotificationPrompt } from "@/ui/components/NotificationPrompt";
import { Container } from "@/ui/elements";
import ScreenContainer from "@/ui/elements/Screen";
import { GameActionProvider } from "@/ui/screens/Game/GameActionsProvider";
import { useLocalSearchParams } from "expo-router";
import React from "react";
import { ActivityIndicator } from "react-native";
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
  const { userId: currentUserId, isLoading: isAuthLoading } = useAuth();
  if (isAuthLoading || !currentUserId || game === undefined) {
    return (
      <ScreenContainer>
        <Container style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color="white" />
        </Container>
      </ScreenContainer>
    );
  }
  if (!game) {
    // Game not found — useGame will redirect to "/". Show spinner while redirecting.
    return (
      <ScreenContainer>
        <Container style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color="white" />
        </Container>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <PlayingProvider game={game}>
        <GameActionProvider>
          <Container style={{ flex: 1, justifyContent: "space-between" }}>
            <Container
              style={{
                justifyContent: "center",
                paddingTop: 28,
                paddingVertical: 32,
                alignItems: "center",
              }}
            >
              <ShareGameInfo />
              <WinnerInfo />
              <NotificationPrompt />
            </Container>
            <Container style={{ flex: 1, marginBottom: 16 }}>
              <CardTable>
                <PlayerCircles />
                <AnimatedCards />
                {game.status !== "gathering-players" && <LiveCounts />}
              </CardTable>
            </Container>
            <Container
              style={{
                flexDirection: "row",
                minHeight: 24,
                gap: 16,
                width: "100%",
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
