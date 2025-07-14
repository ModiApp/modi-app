import { useGameActions } from "@/hooks/useGameActions";
import {
  AnimatableCardDeck,
  AnimatableCardDeckRef,
  CardAnimatableProps,
} from "@/ui/components/AnimatableCardDeck";
import { useActiveGame } from "@/ui/screens/Game/PlayingContext";
import React, { useRef } from "react";
import { Animated } from "react-native";
import { useCardTable } from "./context";
import { PlayerPosition } from "./types";

export function AnimatedCards() {
  const { playerPositions } = useCardTable();
  if (!Object.keys(playerPositions).length) return null;
  return <AnimatedCardsInner />;
}

function AnimatedCardsInner() {
  const { game } = useActiveGame();
  const deck = useRef<AnimatableCardDeckRef>(null);
  const { playerPositions } = useCardTable();

  console.log("playerPositions", playerPositions);

  const virtualTrash = useRef<CardAnimatableProps[]>([]);
  const playerHands = useRef<{
    [playerId: string]: CardAnimatableProps | null;
  }>({});
  const cardsOnTable = useRef(new Set<CardAnimatableProps>());

  function getNextCardFromDeck(): CardAnimatableProps {
    const cards = deck.current?.getCardAnimationValues();
    if (!cards) throw new Error("No cards in deck");
    const totalCards = cards.length;
    const nextCardIndex = totalCards - cardsOnTable.current.size - 1;
    const nextCard = cards[nextCardIndex];
    cardsOnTable.current.add(nextCard);
    return nextCard;
  }

  // Hook into live game actions
  useGameActions(game.gameId, {
    moveDeck: (toDealerId) => {
      return new Promise((resolve) => {
        const cards = deck.current?.getCardAnimationValues();
        if (!cards) throw new Error("No cards in deck");
        const dealerPosition = playerPositions[toDealerId];
        const cardsLeftInDeck = cards.slice(
          0,
          cards.length - cardsOnTable.current.size
        );
        moveDeckNextToPlayer(cardsLeftInDeck, dealerPosition).start(() =>
          resolve()
        );
      });
    },
    dealCards: (toPlayers) => {
      return new Promise((resolve) => {
        const animations = toPlayers.map((playerId) => {
          const nextCard = getNextCardFromDeck();
          playerHands.current[playerId] = nextCard;
          return moveCardToPlayer(playerPositions[playerId], nextCard);
        });
        Animated.stagger(100, animations).start(() => resolve());
      });
    },
    swapCards: (fromPlayerId, toPlayerId) => {
      return new Promise((resolve) => {
        const fromCard = playerHands.current[fromPlayerId];
        const toCard = playerHands.current[toPlayerId];
        if (!fromCard || !toCard) throw new Error("No cards to swap");
        playerHands.current[fromPlayerId] = toCard;
        playerHands.current[toPlayerId] = fromCard;
        Animated.stagger(200, [
          moveCardToPlayer(playerPositions[toPlayerId], fromCard),
          moveCardToPlayer(playerPositions[fromPlayerId], toCard),
        ]).start(() => resolve());
      });
    },
    hitDeck: (playerId) => {
      return new Promise((resolve) => {
        const nextCard = getNextCardFromDeck();
        playerHands.current[playerId] = nextCard;
        moveCardToPlayer(playerPositions[playerId], nextCard).start(() =>
          resolve()
        );
      });
    },
    trashCards: () => {
      return new Promise((resolve) => {
        const cards = Array.from(cardsOnTable.current);
        cards.forEach((card) => virtualTrash.current.push(card));
        cardsOnTable.current.clear();
        playerHands.current = {};
        Animated.stagger(200, cards.map(moveCardToTrash)).start(() =>
          resolve()
        );
      });
    },
    revealCards: (playerCards) => {
      return new Promise((resolve) => {
        const cards = deck.current?.getCardAnimationValues();
        if (!cards) throw new Error("No cards in deck");
        deck.current?.setCardValues(
          Object.fromEntries(
            Object.entries(playerHands).map(([playerId, card]) => {
              const cardIndex = cards.find((c) => c === card);
              return [cardIndex, playerCards[playerId]] as const;
            })
          )
        );
        Animated.stagger(200, cards.map(revealCard)).start(() => resolve());
      });
    },
  });

  return <AnimatableCardDeck ref={deck} cardWidth={20} numCards={52} />;
}

function moveCardToPlayer(
  playerPosition: PlayerPosition,
  card: CardAnimatableProps
): Animated.CompositeAnimation {
  const { x, y, rotation } = playerPosition;
  const pairs = [
    [card.x, x],
    [card.y, y],
    [card.rotation, rotation],
  ] as const;

  return Animated.parallel(
    pairs.map(([value, toValue]) =>
      Animated.timing(value, {
        toValue,
        duration: 300,
        useNativeDriver: true,
      })
    )
  );
}

function moveCardToTrash(
  card: CardAnimatableProps
): Animated.CompositeAnimation {
  return Animated.parallel([
    Animated.timing(card.x, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }),
    Animated.timing(card.y, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }),
    Animated.timing(card.rotation, {
      toValue: Math.floor(Math.random() * 4) - 2,
      duration: 300,
      useNativeDriver: true,
    }),
  ]);
}

function revealCard(card: CardAnimatableProps): Animated.CompositeAnimation {
  return Animated.sequence([
    Animated.timing(card.skew, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
    }),
    Animated.parallel([
      Animated.timing(card.backOpacity, {
        toValue: 0,
        duration: 0,
        useNativeDriver: true,
      }),
      Animated.timing(card.faceOpacity, {
        toValue: 1,
        duration: 0,
        useNativeDriver: true,
      }),
    ]),
    Animated.timing(card.skew, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }),
  ]);
}

function moveDeckNextToPlayer(
  deck: CardAnimatableProps[],
  playerPosition: PlayerPosition
): Animated.CompositeAnimation {
  function moveCard(card: CardAnimatableProps): Animated.CompositeAnimation {
    return Animated.parallel([
      Animated.timing(card.x, {
        toValue: playerPosition.x,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(card.y, {
        toValue: playerPosition.y,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(card.rotation, {
        toValue: playerPosition.rotation + Math.floor(Math.random() * 4) - 2,
        duration: 300,
        useNativeDriver: true,
      }),
    ]);
  }

  return Animated.parallel(deck.map(moveCard));
}
