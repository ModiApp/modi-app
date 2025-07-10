import { Container, Text } from "@/ui/elements";
import React, { useEffect, useMemo } from "react";
import { useCardTable } from "./context";
import { Player } from "./types";
import { calculatePlayerPositions } from "./utils";

interface PlayerCirclesProps {
  players: Player[];
  currentUserId: string;
}

export function PlayerCircles({ players, currentUserId }: PlayerCirclesProps) {
  const { radius, setPlayerPositions } = useCardTable();

  const playerCircles = useMemo(
    () => calculatePlayerPositions(players, radius, currentUserId),
    [players, radius, currentUserId]
  );

  useEffect(() => {
    setPlayerPositions(
      playerCircles.reduce((acc, { playerId, x, y, rotation }) => {
        acc[playerId] = { x, y, rotation };
        return acc;
      }, {} as { [playerId: string]: { x: number; y: number; rotation: number } })
    );
  }, [playerCircles, setPlayerPositions]);

  return (
    <>
      {playerCircles.map(({ playerId, username, x, y }) => (
        <Container
          key={playerId}
          color="gray"
          style={{
            position: "absolute",
            borderRadius: 999,
            padding: 16,
            aspectRatio: 1,
            justifyContent: "center",
            alignItems: "center",
            transform: [
              { translateX: "-50%" },
              { translateY: "-50%" },
              { translateX: x },
              { translateY: y },
            ],
          }}
        >
          <Text>{playerId}</Text>
        </Container>
      ))}
    </>
  );
}
