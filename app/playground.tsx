import {
  AnimatedCards,
  CardsRef,
  CardTable,
  DEFAULT_CARD_TABLE_CONFIG,
  PlayerCircles,
} from "@/ui/components/CardTable";
import { Button, ScreenContainer } from "@/ui/elements";
import React, { useRef } from "react";

const mockPlayers = [
  { playerId: "1", username: "Peter" },
  { playerId: "2", username: "Jack" },
  { playerId: "3", username: "Ikey" },
  { playerId: "4", username: "Raquel" },
];

const currUserId = "4";

// Example of custom configuration
const customConfig = {
  ...DEFAULT_CARD_TABLE_CONFIG,
  cardDistanceFromPlayer: 120, // Cards further from players
  dealAnimationDuration: 800, // Slower dealing animation
  swapAnimationDuration: 500, // Slower swap animation
};

export default function PlaygroundScreen() {
  const cardsRef = useRef<CardsRef>(null);
  return (
    <ScreenContainer>
      <CardTable>
        <PlayerCircles players={mockPlayers} currentUserId={currUserId} />
        <AnimatedCards dealerId="2" ref={cardsRef} config={customConfig} />
      </CardTable>
      <Button
        onPress={() => cardsRef.current?.dealCards(["4", "1", "2"])}
        title="Deal Cards"
        color="red"
        style={{ marginTop: 48 }}
      />
      <Button
        onPress={() => cardsRef.current?.swapCards("1", "2")}
        title="Swap Cards"
        color="blue"
        style={{ marginTop: 16 }}
      />
    </ScreenContainer>
  );
}
