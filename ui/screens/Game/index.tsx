import { useAuth } from "@/providers/Auth";
import { NotificationPrompt } from "@/ui/components/NotificationPrompt";
import { ReconnectingBanner } from "@/ui/components/ReconnectingBanner";
import { SessionExpiredOverlay } from "@/ui/components/SessionExpiredOverlay";
import { Container } from "@/ui/elements";
import ScreenContainer from "@/ui/elements/Screen";
import { GameActionProvider } from "@/ui/screens/Game/GameActionsProvider";
import { useLocalSearchParams } from "expo-router";
import React from "react";
import { ActivityIndicator, View } from "react-native";
import { CardTable } from "./components/CardTable";
import { AnimatedCards } from "./components/CardTable/AnimatedCards";
import { LiveCounts } from "./components/CardTable/LiveCounts";
import { PlayerCircles } from "./components/CardTable/PlayerCircles";
import { ShareGameInfo } from "./components/ShareGameInfo";
import { WinnerInfo } from "./components/WinnerInfo";
import { useGame } from "./hooks/useGame";
import { PlayerControls } from "./PlayerControls";
import { PlayingProvider } from "./PlayingContext";
import { colors } from "@/ui/styles";

const GameScreen: React.FC = () => {
  // get the game id from the url
  const { gameId } = useLocalSearchParams<{ gameId: string }>();
  const { game, session, isLoading } = useGame(gameId);
  const { userId: currentUserId } = useAuth();

  // Show loading state
  if (isLoading || !currentUserId) {
    return (
      <ScreenContainer>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={colors.white} />
        </View>
      </ScreenContainer>
    );
  }

  // Show session expired overlay (but keep the game UI behind it if we have game data)
  const showExpiredOverlay = session.sessionState === 'expired';
  const showReconnecting = session.sessionState === 'reconnecting';

  // If we don't have game data and session is expired, still show the overlay
  if (!game && showExpiredOverlay) {
    return (
      <ScreenContainer>
        <SessionExpiredOverlay
          session={session}
          visible={true}
        />
      </ScreenContainer>
    );
  }

  // No game and not expired - shouldn't happen, but handle gracefully
  if (!game) {
    return <ScreenContainer />;
  }

  return (
    <ScreenContainer>
      <PlayingProvider game={game}>
        <GameActionProvider>
          {/* Reconnecting banner - shows at top during temporary disconnects */}
          <ReconnectingBanner visible={showReconnecting} />
          
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
          
          {/* Session expired overlay - shows on top when session ends */}
          <SessionExpiredOverlay
            session={session}
            visible={showExpiredOverlay}
          />
        </GameActionProvider>
      </PlayingProvider>
    </ScreenContainer>
  );
};

export default GameScreen;
