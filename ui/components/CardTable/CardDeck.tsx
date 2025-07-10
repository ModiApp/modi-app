import { CardBack } from "@/ui/components/Card";
import React, { useEffect } from "react";
import { useCardTable } from "./context";
import { PlayerPosition } from "./types";
import { degreesToRadians } from "./utils";

interface CardDeckProps {
  dealerId: string;
  onLayout: (pos: PlayerPosition) => void;
  distanceFromDealer?: number;
}

export function CardDeck({
  dealerId,
  onLayout,
  distanceFromDealer = 100,
}: CardDeckProps) {
  const { playerPositions } = useCardTable();

  useEffect(() => {
    if (!playerPositions[dealerId]) return;

    const x =
      playerPositions[dealerId].x +
      Math.cos(degreesToRadians(playerPositions[dealerId].rotation)) *
        distanceFromDealer;
    const y =
      playerPositions[dealerId].y +
      Math.sin(degreesToRadians(playerPositions[dealerId].rotation)) *
        distanceFromDealer;

    onLayout({
      x,
      y,
      rotation: playerPositions[dealerId].rotation,
    });
  }, [playerPositions, onLayout, dealerId, distanceFromDealer]);

  if (!playerPositions[dealerId]) {
    return null;
  }

  const translateX =
    playerPositions[dealerId].x +
    Math.cos(degreesToRadians(playerPositions[dealerId].rotation)) *
      distanceFromDealer;
  const translateY =
    playerPositions[dealerId].y +
    Math.sin(degreesToRadians(playerPositions[dealerId].rotation)) *
      distanceFromDealer;

  return (
    <CardBack
      style={{
        transform: [
          { translateX: "-50%" },
          { translateY: "-50%" },
          { translateY },
          { translateX },
          { rotate: `${playerPositions[dealerId].rotation}deg` },
        ],
      }}
    />
  );
}
