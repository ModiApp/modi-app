import { CardBack } from "@/ui/components/Card";
import React, { useEffect } from "react";
import { useCardTable } from "./context";
import { CARD_TABLE_CONFIG, PlayerPosition } from "./types";
import { degreesToRadians } from "./utils";

interface CardDeckProps {
  dealerId: string;
  onLayout: (pos: PlayerPosition) => void;
}

export function CardDeck({ dealerId, onLayout }: CardDeckProps) {
  const { playerPositions } = useCardTable();

  useEffect(() => {
    if (!playerPositions[dealerId]) return;

    const x =
      playerPositions[dealerId].x +
      Math.cos(degreesToRadians(playerPositions[dealerId].rotation)) *
        CARD_TABLE_CONFIG.deckDistanceFromDealer;
    const y =
      playerPositions[dealerId].y +
      Math.sin(degreesToRadians(playerPositions[dealerId].rotation)) *
        CARD_TABLE_CONFIG.deckDistanceFromDealer;

    onLayout({
      x,
      y,
      rotation: playerPositions[dealerId].rotation,
    });
  }, [playerPositions, onLayout, dealerId]);

  if (!playerPositions[dealerId]) {
    return null;
  }

  const translateX =
    playerPositions[dealerId].x +
    Math.cos(degreesToRadians(playerPositions[dealerId].rotation)) *
      CARD_TABLE_CONFIG.deckDistanceFromDealer;
  const translateY =
    playerPositions[dealerId].y +
    Math.sin(degreesToRadians(playerPositions[dealerId].rotation)) *
      CARD_TABLE_CONFIG.deckDistanceFromDealer;

  return (
    <CardBack
      width={20}
      height={30}
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
