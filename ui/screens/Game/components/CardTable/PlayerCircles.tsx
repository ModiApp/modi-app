import { useUserId } from "@/providers/Auth";
import { Container, Text } from "@/ui/elements";
import { useCurrentGame } from "@/ui/screens/Game/PlayingContext";
import React, { useEffect, useMemo } from "react";
import { useCardTable } from "./context";
import { calculatePlayerPositions } from "./utils";

export function PlayerCircles() {
  const { game } = useCurrentGame();
  const currUserId = useUserId();
  const { radius, setPlayerPositions } = useCardTable();

  const playerCircles = useMemo(
    () => calculatePlayerPositions(game.players, radius, currUserId),
    [game.players, radius, currUserId]
  );

  useEffect(() => {
    if (!radius) return;
    setPlayerPositions(
      playerCircles.reduce((acc, { playerId, x, y, rotation }) => {
        acc[playerId] = { x, y, rotation };
        return acc;
      }, {} as { [playerId: string]: { x: number; y: number; rotation: number } })
    );
  }, [playerCircles, setPlayerPositions, radius]);

  return (
    <>
      {playerCircles.map(({ playerId, x, y }) => {
        return (
          <Container
            key={playerId}
            style={{
              position: "absolute",
              borderRadius: 2,
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              paddingHorizontal: 4,
              paddingVertical: 2,
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
            <Text size={10}>{game.usernames[playerId].slice(0, 2)}</Text>
          </Container>
        );
      })}
    </>
  );
}
