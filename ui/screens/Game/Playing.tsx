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
    <Container style={{ flex: 1, padding: 16 }}>
      {/* Game Header */}
      <Container style={{ marginBottom: 16 }}>
        <Text size={24}>Game #{game.gameId}</Text>
        <Text size={16}>
          Round: {game.round} | State: {game.roundState}
        </Text>
        <Text size={14}>
          Dealer: {game.usernames[game.dealer]} | Active:{" "}
          {game.usernames[game.activePlayer]}
        </Text>
      </Container>

      {/* Card Table */}
      <CardTable>
        <PlayerCircles players={players} currentUserId={currentUserId} />
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
  );
}
