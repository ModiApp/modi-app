import { InitialGameState } from "@/functions/src/types";
import React from "react";
import { Container, Text } from "../elements";

export function PlayersList(props: { game: InitialGameState }) {
  const { players, playerInfo } = props.game;
  return (
    <Container
      color="lightGreen"
      style={{
        padding: 16,
        borderRadius: 16,
        width: 300,
        height: 300,
        position: "relative",
      }}
    >
      {players.map((playerId, index) => {
        const angle = (index * 2 * Math.PI) / players.length;
        const radius = 120; // Slightly less than container width/2 to account for padding
        const x = radius * Math.cos(angle);
        const y = radius * Math.sin(angle);

        return (
          <Container
            key={playerId}
            color="gray"
            style={{
              padding: 8,
              borderRadius: 25,
              width: 50,
              height: 50,
              position: "absolute",
              left: "50%",
              top: "50%",
              transform: [
                { translateX: x - 25 }, // -25 to center (half of width)
                { translateY: y - 25 }, // -25 to center (half of height)
              ],
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Text>{playerInfo[playerId]?.username.slice(0, 2)}</Text>
          </Container>
        );
      })}
    </Container>
  );
}
