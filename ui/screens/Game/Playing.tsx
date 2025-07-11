import { ActiveGame } from "@/functions/src/types";
import { useCurrentCard } from "@/hooks/useCurrentCard";
import { useGameActions } from "@/hooks/useGameActions";
import { useUserId } from "@/providers/Auth";
import { Card } from "@/ui/components/Card";
import {
  AnimatedCards,
  CardsRef,
  CardTable,
  PlayerCircles,
} from "@/ui/components/CardTable";
import { Container, Text } from "@/ui/elements";
import React, { useMemo, useRef } from "react";
import { PlayerControls } from "./PlayerControls";
import { PlayingProvider } from "./PlayingContext";

export function GamePlaying(props: { game: ActiveGame }) {
  const { game } = props;
  const currentUserId = useUserId();
  const currentCard = useCurrentCard(game.gameId);
  const cardsRef = useRef<CardsRef>(null);

  const players = useMemo(
    () =>
      Object.entries(game.usernames).map(([playerId, username]) => ({
        playerId,
        username,
      })),
    [game.usernames]
  );

  useGameActions({ gameId: game.gameId, cardsRef });

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
        {/* Card Table */}
        <CardTable>
          <PlayerCircles />
          <AnimatedCards dealerId={game.dealer} ref={cardsRef} />
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
