import React from "react";
import { ViewStyle } from "react-native";
import { Container } from "../elements";
import { PlayerCircle } from "./PlayerCircle";

export interface PlayersListGame {
  players: string[];
  usernames: { [playerId: string]: string };
  playerLives?: { [playerId: string]: number };
  roundState?: "pre-deal" | "playing" | "tallying";
}

export function PlayersList(props: {
  game: PlayersListGame;
  currUserId: string;
}) {
  const { players, usernames, playerLives, roundState } = props.game;
  const { currUserId } = props;

  // Find the index of the current user
  const currentUserIndex = players.indexOf(currUserId);

  // Calculate the rotation needed to move the current user to the bottom
  // Each player is positioned at (index * 360 / players.length) degrees
  // We want the current user at 90 degrees (bottom)
  const currentUserAngle = (currentUserIndex * 360) / players.length;
  const rotationDegrees = 90 - currentUserAngle;

  // Calculate dynamic radius based on number of players
  // Base radius for 2-4 players, scales up for more players
  const baseRadius = 80;
  const maxRadius = 140;
  const radius = Math.min(
    baseRadius + (players.length - 2) * 3, // Increase by 3px per additional player
    maxRadius
  );

  return (
    <Container
      color="lightGreen"
      style={{
        padding: 16,
        borderRadius: 999, // Make it circular
        width: (radius + 50) * 2, // Container width = 2 * (radius + player circle radius)
        height: (radius + 50) * 2, // Container height = 2 * (radius + player circle radius)
        position: "relative",
        transform: [{ rotate: `${rotationDegrees}deg` }],
      }}
    >
      {players.map((playerId, index) => {
        const angle = (index * 2 * Math.PI) / players.length;
        const x = radius * Math.cos(angle);
        const y = radius * Math.sin(angle);

        const style: ViewStyle = {
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: [
            { translateX: x - 25 },
            { translateY: y - 25 },
            { rotate: `${-rotationDegrees}deg` },
          ],
        };

        return (
          <PlayerCircle
            key={playerId}
            playerId={playerId}
            username={usernames[playerId]}
            lives={playerLives ? playerLives[playerId] : undefined}
            roundState={roundState}
            style={style}
          />
        );
      })}
    </Container>
  );
}
