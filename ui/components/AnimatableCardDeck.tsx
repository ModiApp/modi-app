import type { CardID } from "@/api/src/types/card.types";
import { Card, CardBack } from "@/ui/components/Card";
import React, {
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { StyleSheet } from "react-native";
import Animated, {
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

export interface AnimatableCardDeckRef {
  getCards(): readonly AnimatedCard[];
}

export interface AnimatedCard extends CardAnimatableProps, AnimatableCardRef {}

interface AnimatableCardDeckProps {
  cardWidth: number;
  numCards?: number;
}

export const AnimatableCardDeck = React.forwardRef<
  AnimatableCardDeckRef,
  AnimatableCardDeckProps
>(function AnimatableCardDeck(props, ref) {
  const { cardWidth, numCards = 52 } = props;
  const cards = useRef<readonly CardAnimatableProps[]>(
    createInitialCardDeck(numCards)
  ).current;
  const cardRefs = useRef<React.RefObject<AnimatableCardRef>[]>(
    createCardRefs(numCards)
  ).current;

  // Randomize card rotations after mount to create the fanned deck look
  // This runs client-side only, avoiding SSR hydration mismatch
  useEffect(() => {
    cards.forEach((card) => {
      card.rotation.value = Math.floor(Math.random() * 4);
    });
  }, [cards]);

  useImperativeHandle(ref, () => ({
    getCards: () => {
      return cards.map((card, index) => ({
        ...card,
        ...cardRefs[index].current,
      }));
    },
  }));

  return (
    <>
      {cards.map((card, index) => (
        <AnimatableCard
          key={index}
          ref={cardRefs[index]}
          cardWidth={cardWidth}
          zIndex={index - cards.length}
          {...card}
        />
      ))}
    </>
  );
});

export interface CardAnimatableProps {
  x: SharedValue<number>;
  y: SharedValue<number>;
  rotation: SharedValue<number>;
  backOpacity: SharedValue<number>;
  faceOpacity: SharedValue<number>;
  rotateY: SharedValue<number>;
  scale: SharedValue<number>;
}

interface AnimatableCardProps extends CardAnimatableProps {
  cardWidth: number;
}

export interface AnimatableCardRef {
  setValue(value: CardID | null): void;
  setZIndex(zIndex: number): void;
  isFaceDown(): boolean;
  ensureFaceUp(): Promise<void>;
  flip(): Promise<void>;
  ensureFaceDown(): Promise<void>;
}

export const AnimatableCard = React.forwardRef<
  AnimatableCardRef,
  AnimatableCardProps & { zIndex: number }
>(function AnimatableCard(props, ref) {
  const {
    cardWidth,
    x,
    y,
    rotation,
    backOpacity,
    faceOpacity,
    rotateY,
    scale,
  } = props;
  const [value, setValue] = useState<CardID | null>(null);
  const [zIndex, setZIndex] = useState<number>(props.zIndex);
  const isFaceDownRef = useRef<boolean>(true);

  const width = cardWidth;
  const height = cardWidth * 1.4;

  // Animated styles
  const animatedStyle = useAnimatedStyle(
    () => ({
      zIndex,
      width,
      height,
      position: "absolute",
      transform: [
        { translateX: -width / 2 },
        { translateY: -height / 2 },
        { translateX: x.value },
        { translateY: y.value },
        { rotate: `${rotation.value}deg` },
        { rotateY: `${rotateY.value}deg` },
        { scale: scale.value },
      ],
    }),
    [zIndex, width, height]
  );

  const backOpacityStyle = useAnimatedStyle(() => ({
    opacity: backOpacity.value,
  }));
  const faceOpacityStyle = useAnimatedStyle(() => ({
    opacity: faceOpacity.value,
  }));

  const flip = useCallback(
    function flip() {
      const wasFaceDown = isFaceDownRef.current;
      isFaceDownRef.current = !isFaceDownRef.current;
      return cardFlipAnimation(
        { rotateY, backOpacity, faceOpacity },
        wasFaceDown
      );
    },
    [rotateY, backOpacity, faceOpacity]
  );

  const ensureFaceUp = useCallback(
    function ensureFaceUp() {
      if (isFaceDownRef.current) {
        return flip();
      }
      return Promise.resolve();
    },
    [flip]
  );

  const ensureFaceDown = useCallback(
    function ensureFaceDown() {
      if (!isFaceDownRef.current) {
        return flip();
      }
      return Promise.resolve();
    },
    [flip]
  );

  useImperativeHandle(
    ref,
    () => ({
      setValue,
      setZIndex,
      isFaceDown: () => isFaceDownRef.current,
      ensureFaceUp,
      ensureFaceDown,
      flip,
    }),
    [setValue, setZIndex, ensureFaceUp, ensureFaceDown, flip]
  );

  return (
    <Animated.View style={animatedStyle}>
      <Animated.View style={[backOpacityStyle, StyleSheet.absoluteFill]}>
        <CardBack width={width} height={height} />
      </Animated.View>
      <Animated.View style={[faceOpacityStyle, StyleSheet.absoluteFill]}>
        {value && <Card cardId={value} width={width} height={height} />}
      </Animated.View>
    </Animated.View>
  );
});

function createInitialCardDeck(
  numCards: number
): readonly CardAnimatableProps[] {
  return Object.freeze(
    Array.from({ length: numCards }, () =>
      Object.freeze({
        x: useSharedValue(0),
        y: useSharedValue(0),
        // Use deterministic initial value to avoid React hydration mismatch (#418)
        // Random rotation during SSR vs client render causes hydration to fail
        rotation: useSharedValue(0),
        backOpacity: useSharedValue(1),
        faceOpacity: useSharedValue(0),
        rotateY: useSharedValue(0),
        scale: useSharedValue(1),
      })
    )
  );
}

function createCardRefs(
  numCards: number
): React.RefObject<AnimatableCardRef>[] {
  return Array.from({ length: numCards }, () => ({
    current: {
      setValue: () => {},
      setZIndex: () => {},
      isFaceDown: () => true,
      ensureFaceUp: () => Promise.resolve(),
      ensureFaceDown: () => Promise.resolve(),
      flip: () => Promise.resolve(),
    },
  }));
}

function cardFlipAnimation(
  card: Pick<CardAnimatableProps, "rotateY" | "backOpacity" | "faceOpacity">,
  wasFaceDown: boolean
): Promise<void> {
  const { rotateY, backOpacity, faceOpacity } = card;
  return new Promise<void>((resolve) => {
    const finalBackOpacity = wasFaceDown ? 0 : 1;
    const finalFaceOpacity = wasFaceDown ? 1 : 0;
    // Animate rotateY to 90, swap opacities, then animate back to 0
    rotateY.value = withTiming(90, { duration: 150 }, () => {
      backOpacity.value = finalBackOpacity;
      faceOpacity.value = finalFaceOpacity;
      rotateY.value = withTiming(0, { duration: 150 }, () => {
        resolve();
      });
    });
  });
}
