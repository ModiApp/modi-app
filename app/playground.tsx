import {
  AnimatableCard,
  AnimatableCardRef,
} from "@/ui/components/AnimatableCardDeck";
import { Button, ScreenContainer } from "@/ui/elements";
import React, { useRef } from "react";
import { Animated } from "react-native";

export default function PlaygroundScreen() {
  const cardRef = useRef<AnimatableCardRef>(null);

  return (
    <ScreenContainer>
      <AnimatableCard
        cardWidth={80}
        x={new Animated.Value(100)}
        y={new Animated.Value(100)}
        rotation={new Animated.Value(0)}
        backOpacity={new Animated.Value(1)}
        faceOpacity={new Animated.Value(0)}
        rotateY={new Animated.Value(0)}
        scale={new Animated.Value(1)}
        ref={cardRef}
        zIndex={0}
      />
      <Button
        thin
        color="red"
        title="Flip"
        onPress={() => {
          cardRef.current?.setValue("KH");
          cardRef.current?.flip();
        }}
      />
    </ScreenContainer>
  );
}
