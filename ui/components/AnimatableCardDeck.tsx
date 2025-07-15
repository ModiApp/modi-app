import { CardID } from "@/functions/src/types";
import { Card, CardBack } from "@/ui/components/Card";
import React, { useImperativeHandle, useRef, useState } from "react";
import { Animated, StyleSheet } from "react-native";

export interface AnimatableCardDeckRef {
  getCards(): readonly AnimatedCard[];
}

export interface AnimatedCard extends CardAnimatableProps, AnimatableCardRef {
  // no extra props
}

interface AnimatableCardDeckProps {
  cardWidth: number;
  numCards?: number;
}

/**
 * A deck of cards that can be animated however you want.
 * ```tsx
 * const deckRef = useRef<AnimatableCardDeckRef>(null);
 * <AnimatableCardDeck ref={deckRef} cardWidth={60} />
 * ```
 *
 * You can then use the ref to access the cards and control them individually:
 * ```tsx
 * const cards = deckRef.current?.getCards();
 * if (!cards) return;
 * // Set the value of the first four cards
 * cards[0].setValue("10H");
 * cards[1].setValue("10D");
 * cards[2].setValue("10C");
 * cards[3].setValue("10S");
 * ```
 *
 * You can also access the animated values of each card to animate them as you please:
 * ```tsx
 * const cards = deckRef.current?.getCards();
 * if (!cards) return;
 * Animated.stagger(10, cards.map((card) => Animated.timing(card.x, {
 *   toValue: 100,
 *   duration: 20,
 *   useNativeDriver: true,
 * }))).start();
 * ```
 */
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
  x: Animated.Value;
  y: Animated.Value;
  rotation: Animated.Value;
  backOpacity: Animated.Value;
  faceOpacity: Animated.Value;
  rotateY: Animated.Value;
  scale: Animated.Value;
}

interface AnimatableCardProps extends CardAnimatableProps {
  cardWidth: number;
}

interface AnimatableCardRef {
  setValue(value: CardID | null): void;
  setZIndex(zIndex: number): void;
}

const AnimatableCard = React.forwardRef<
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
  const width = cardWidth;
  const height = cardWidth * 1.4;
  useImperativeHandle(ref, () => ({ setValue, setZIndex }), [setValue]);

  return (
    <Animated.View
      style={{
        zIndex,
        width,
        height,
        position: "absolute",
        transform: [
          { translateX: "-50%" },
          { translateY: "-50%" },
          { translateX: x },
          { translateY: y },
          {
            rotate: rotation.interpolate({
              inputRange: [0, 360],
              outputRange: ["0deg", "360deg"],
            }),
          },
          {
            rotateY: rotateY.interpolate({
              inputRange: [0, 180],
              outputRange: ["0deg", "180deg"],
            }),
          },
          { scale: scale },
        ],
      }}
    >
      <Animated.View
        style={[{ opacity: backOpacity }, StyleSheet.absoluteFill]}
      >
        <CardBack width={width} height={height} />
      </Animated.View>
      <Animated.View
        style={[{ opacity: faceOpacity }, StyleSheet.absoluteFill]}
      >
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
        x: new Animated.Value(0),
        y: new Animated.Value(0),
        rotation: new Animated.Value(Math.floor(Math.random() * 4)),
        backOpacity: new Animated.Value(1),
        faceOpacity: new Animated.Value(0),
        rotateY: new Animated.Value(0),
        scale: new Animated.Value(1),
      })
    )
  );
}

function createCardRefs(
  numCards: number
): React.RefObject<AnimatableCardRef>[] {
  return Array.from({ length: numCards }, () => ({
    current: { setValue: () => {}, setZIndex: () => {} },
  }));
}
