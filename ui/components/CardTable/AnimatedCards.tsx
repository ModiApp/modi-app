import { CardBack } from "@/ui/components/Card";
import React, { useImperativeHandle, useState } from "react";
import { Animated } from "react-native";
import { CardDeck } from "./CardDeck";
import { useCardAnimations } from "./hooks/useCardAnimations";
import { CardsRef, CardTableConfig, PlayerPosition } from "./types";

interface AnimatedCardsProps {
  dealerId: string;
  config?: Partial<CardTableConfig>;
}

export const AnimatedCards = React.forwardRef<CardsRef, AnimatedCardsProps>(
  function AnimatedCards({ dealerId, config }, ref) {
    const [deckPosition, setDeckPosition] = useState<PlayerPosition | null>(
      null
    );
    const { cardAnimationValues, dealCards, swapCards, trashCards } =
      useCardAnimations(config);

    useImperativeHandle(
      ref,
      () => ({
        dealCards: (toPlayers: string[]) => {
          dealCards(toPlayers, deckPosition);
        },
        swapCards,
        trashCards,
      }),
      [deckPosition, swapCards, trashCards, dealCards]
    );

    return (
      <>
        <CardDeck
          dealerId={dealerId}
          onLayout={setDeckPosition}
          distanceFromDealer={config?.deckDistanceFromDealer}
        />
        {cardAnimationValues.map((value, index) => (
          <Animated.View
            key={index}
            style={{
              position: "absolute",
              transform: [
                { translateX: "-50%" },
                { translateY: "-50%" },
                { translateX: value.x },
                { translateY: value.y },
                {
                  rotate: value.rotation.interpolate({
                    inputRange: [0, 360],
                    outputRange: ["0deg", "360deg"],
                  }),
                },
              ],
            }}
          >
            <CardBack width={20} height={30} />
          </Animated.View>
        ))}
      </>
    );
  }
);
