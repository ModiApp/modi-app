import { ActiveGame } from "@/functions/src/types";
import { useUserId } from "@/providers/Auth";
import { Container } from "@/ui/elements";
import { CardTable } from "@/ui/screens/Game/components/CardTable";
import { AnimatedCards } from "@/ui/screens/Game/components/CardTable/AnimatedCards";
import { PlayerCircles } from "@/ui/screens/Game/components/CardTable/PlayerCircles";
import React from "react";
import { PlayerControls } from "./PlayerControls";
import { PlayingProvider } from "./PlayingContext";

export function GamePlaying(props: { game: ActiveGame }) {
  const { game } = props;
  const currentUserId = useUserId();

  return (
    <PlayingProvider game={game}>
      <Container style={{ flex: 1, padding: 16, justifyContent: "center" }}>
        <CardTable>
          <PlayerCircles />
          <AnimatedCards />
        </CardTable>
      </Container>
      <Container style={{ padding: 16 }}>
        <PlayerControls game={game} currUserId={currentUserId} />
      </Container>
    </PlayingProvider>
  );
}
