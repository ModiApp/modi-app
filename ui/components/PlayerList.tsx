import { InitialGameState } from "@/functions/src/types";
import React from "react";
import { Container, Text } from "../elements";

export function PlayersList(props: {
  game: InitialGameState;
  currUserId: string;
}) {
  const { players, playerInfo } = props.game;
  const { currUserId } = props;

  // Find the index of the current user
  const currentUserIndex = players.indexOf(currUserId);

  // Calculate the rotation needed to move the current user to the bottom
  // Each player is positioned at (index * 360 / players.length) degrees
  // We want the current user at 90 degrees (bottom)
  const currentUserAngle = (currentUserIndex * 360) / players.length;
  const rotationDegrees = 90 - currentUserAngle;

  return (
    <Container
      color="lightGreen"
      style={{
        padding: 16,
        borderRadius: 16,
        width: 300,
        height: 300,
        position: "relative",
        transform: [{ rotate: `${rotationDegrees}deg` }],
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
                { rotate: `${-rotationDegrees}deg` }, // Counter-rotate to keep text upright
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
