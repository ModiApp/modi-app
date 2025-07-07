import { ActiveGame } from "@/functions/src/types";
import { useUserId } from "@/providers/Auth";
import { PlayersList } from "@/ui/components/PlayerList";
import { Container, Text } from "@/ui/elements";
import React from "react";
import { PlayerControls } from "./PlayerControls";

export function GamePlaying(props: { game: ActiveGame }) {
  const { game } = props;
  const currentUserId = useUserId();

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
      <Container style={{ marginBottom: 20 }}>
        <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 8 }}>
          Game #{game.gameId}
        </Text>
        <Text style={{ fontSize: 16, marginBottom: 4 }}>
          Round: {game.round} | State: {game.roundState}
        </Text>
        <Text style={{ fontSize: 14, color: "#666" }}>
          Dealer: {game.usernames[game.dealer]} | Active:{" "}
          {game.usernames[game.activePlayer]}
        </Text>
      </Container>

      {/* Players List */}
      <Container style={{ alignItems: "center", marginBottom: 20 }}>
        <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 16 }}>
          Players ({game.players.length})
        </Text>
        <PlayersList game={game} currUserId={currentUserId} />
      </Container>

      {/* Player Lives */}
      <Container style={{ marginBottom: 20 }}>
        <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 12 }}>
          Lives
        </Text>
        <Container style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {game.players.map((playerId) => (
            <Container
              key={playerId}
              color="blue"
              style={{
                padding: 8,
                borderRadius: 8,
                minWidth: 80,
                alignItems: "center",
              }}
            >
              <Text size={12} style={{ fontSize: 12, marginBottom: 4 }}>
                {game.usernames[playerId]}
              </Text>
              <Text style={{ fontSize: 16, fontWeight: "bold" }}>
                ❤️ {game.playerLives[playerId]}
              </Text>
            </Container>
          ))}
        </Container>
      </Container>

      {/* Game Status */}
      <Container style={{ flex: 1, justifyContent: "flex-end" }}>
        <PlayerControls game={game} currUserId={currentUserId} />
      </Container>
    </Container>
  );
}
