import { ActiveGame } from "@/functions/src/types";
import { useCurrentCard } from "@/hooks/useCurrentCard";
import { useUserId } from "@/providers/Auth";
import { Card } from "@/ui/components/Card";
import { CardTable } from "@/ui/components/CardTable";
import { AnimatedCards } from "@/ui/components/CardTable/AnimatedCards";
import { PlayerCircles } from "@/ui/components/CardTable/PlayerCircles";
import { Container, Text } from "@/ui/elements";
import React from "react";
import { PlayerControls } from "./PlayerControls";
import { PlayingProvider } from "./PlayingContext";

export function GamePlaying(props: { game: ActiveGame }) {
  const { game } = props;
  const currentUserId = useUserId();
  const currentCard = useCurrentCard(game.gameId);

  if (!currentUserId) {
    return (
      <Container>
        <Text>Loading user...</Text>
      </Container>
    );
  }

  return (
    <PlayingProvider game={game}>
      <Container style={{ flex: 1, padding: 16 }}>
        <CardTable>
          <PlayerCircles />
          <AnimatedCards />
        </CardTable>

        <Container
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <Card cardId={currentCard} width={120} height={180} />
        </Container>

        {/* Game Controls */}
        <Container style={{ marginTop: 16 }}>
          <PlayerControls game={game} currUserId={currentUserId} />
        </Container>
      </Container>
    </PlayingProvider>
  );
}
