import {
  AnimatableCardDeck,
  AnimatableCardDeckRef,
} from "@/ui/components/AnimatableCardDeck";
import { ScreenContainer } from "@/ui/elements";
import React, { useEffect, useRef } from "react";
import { Animated, Platform } from "react-native";

export default function PlaygroundScreen() {
  const cardsRef = useRef<AnimatableCardDeckRef>(null);

  useEffect(() => {
    const cards = cardsRef.current?.getCardAnimationValues();
    if (!cards) return;

    Animated.stagger(
      10,
      cards.map((card) =>
        Animated.stagger(
          10,
          cards.map((card) =>
            Animated.timing(card.x, {
              toValue: 100,
              duration: 20,
              useNativeDriver: ["ios", "android"].includes(Platform.OS),
            })
          )
        )
      )
    ).start();
  }, []);

  return (
    <ScreenContainer>
      <AnimatableCardDeck cardWidth={60} ref={cardsRef} />
    </ScreenContainer>
  );
}
