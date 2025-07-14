import { CardBack } from "@/ui/components/Card";
import React, { useImperativeHandle, useState } from "react";
import { Animated } from "react-native";
import { CardDeck } from "./CardDeck";
import { useCardAnimations } from "./hooks/useCardAnimations";
import { CardsRef, PlayerPosition } from "./types";

interface AnimatedCardsProps {
  dealerId: string;
}

export const AnimatedCards = React.forwardRef<CardsRef, AnimatedCardsProps>(
  function AnimatedCards({ dealerId }, ref) {
    const [deckPosition, setDeckPosition] = useState<PlayerPosition | null>(
      null
    );
    const {
      cardAnimationValues,
      dealCards,
      swapCards,
      trashCards,
      revealCards,
    } = useCardAnimations();

    useImperativeHandle(
      ref,
      () => ({
        dealCards: (toPlayers: string[]) => {
          dealCards(toPlayers, deckPosition);
        },
        swapCards,
        trashCards,
        revealCards,
      }),
      [deckPosition, swapCards, trashCards, dealCards, revealCards]
    );

    return (
      <>
        <CardDeck dealerId={dealerId} onLayout={setDeckPosition} />
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

function FlippableCard(props: {}) {}
