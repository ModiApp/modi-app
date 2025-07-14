import { useUserId } from "@/providers/Auth";
import { Container, Text } from "@/ui/elements";
import { useActiveGame } from "@/ui/screens/Game/PlayingContext";
import { colors } from "@/ui/styles";
import React, { useEffect, useMemo } from "react";
import { useCardTable } from "./context";
import { calculatePlayerPositions } from "./utils";

export function PlayerCircles() {
  const { game } = useActiveGame();
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
        const isActivePlayer = game.activePlayer === playerId;

        return (
          <Container
            key={playerId}
            color={isActivePlayer ? "blue" : "gray"}
            style={{
              position: "absolute",
              borderRadius: 999,
              borderColor: colors.blue,
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
            <Text>{game.usernames[playerId].slice(0, 2)}</Text>
          </Container>
        );
      })}
    </>
  );
}
