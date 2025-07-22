import {
  AnimatableCard,
  AnimatableCardRef,
} from "@/ui/components/AnimatableCardDeck";
import { Button, ScreenContainer } from "@/ui/elements";
import React, { useRef } from "react";
import { useSharedValue } from "react-native-reanimated";

export default function PlaygroundScreen() {
  const cardRef = useRef<AnimatableCardRef>(null);

  return (
    <ScreenContainer>
      <AnimatableCard
        cardWidth={80}
        x={useSharedValue(100)}
        y={useSharedValue(100)}
        rotation={useSharedValue(0)}
        backOpacity={useSharedValue(1)}
        faceOpacity={useSharedValue(0)}
        rotateY={useSharedValue(0)}
        scale={useSharedValue(1)}
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
