import { useGameActions } from "@/hooks/useGameActions";
import {
  AnimatableCardDeck,
  AnimatableCardDeckRef,
  AnimatedCard,
} from "@/ui/components/AnimatableCardDeck";
import { useActiveGame } from "@/ui/screens/Game/PlayingContext";
import React, { useRef } from "react";
import { Animated } from "react-native";
import { useCardTable } from "./context";
import { PlayerPosition } from "./types";

export function AnimatedCards() {
  const { playerPositions, radius } = useCardTable();
  if (!radius || !Object.keys(playerPositions).length) return null;

  return <AnimatedCardsInner />;
}

function AnimatedCardsInner() {
  const { game } = useActiveGame();
  const deck = useRef<AnimatableCardDeckRef>(null);
  const { playerPositions } = useCardTable();

  const virtualTrash = useRef<AnimatedCard[]>([]);
  const playerHands = useRef<{
    [playerId: string]: AnimatedCard | null;
  }>({});
  const cardsOnTable = useRef(new Set<AnimatedCard>());

  function getNextCardFromDeck(): AnimatedCard {
    const cards = deck.current?.getCards();
    if (!cards) throw new Error("No cards in deck");
    const totalCards = cards.length;
    const trashSize = virtualTrash.current.length;
    const cardsOnTableSize = cardsOnTable.current.size;
    const nextCardIndex = totalCards - cardsOnTableSize - trashSize - 1;
    const nextCard = cards[nextCardIndex];
    cardsOnTable.current.add(nextCard);
    return nextCard;
  }

  // Hook into live game actions
  useGameActions(game.gameId, {
    moveDeck: (toDealerId) => {
      return new Promise((resolve) => {
        const cards = deck.current?.getCards();
        if (!cards) throw new Error("No cards in deck");
        const dealerPosition = playerPositions[toDealerId];
        const cardsLeftInDeck = cards.slice(
          0,
          cards.length - cardsOnTable.current.size - virtualTrash.current.length
        );
        moveDeckNextToPlayer(cardsLeftInDeck, dealerPosition).start(() =>
          resolve()
        );
      });
    },
    dealCards: async (toPlayers) => {
      const zIndexes: { [zIndex: number]: AnimatedCard } = {};
      const animations = toPlayers.map((playerId) => {
        const nextCard = getNextCardFromDeck();
        playerHands.current[playerId] = nextCard;
        const zIndex = virtualTrash.current.length + cardsOnTable.current.size;
        zIndexes[zIndex] = nextCard;
        return () => moveCardToPlayer(playerPositions[playerId], nextCard);
      });
      await staggerPromises(400, animations);
      Object.entries(zIndexes).forEach(([zIndex, card]) => {
        card.setZIndex(Number(zIndex));
      });
    },
    swapCards: async (fromPlayerId, toPlayerId) => {
      const fromCard = playerHands.current[fromPlayerId];
      const toCard = playerHands.current[toPlayerId];
      if (!fromCard || !toCard) throw new Error("No cards to swap");
      playerHands.current[fromPlayerId] = toCard;
      playerHands.current[toPlayerId] = fromCard;
      await staggerPromises(200, [
        () =>
          staggerPromises(100, [
            () => fromCard.ensureFaceDown(),
            () => moveCardToPlayer(playerPositions[toPlayerId], fromCard),
          ]),
        () =>
          staggerPromises(100, [
            () => moveCardToPlayer(playerPositions[fromPlayerId], toCard),
            () => toCard.ensureFaceDown(),
          ]),
      ]);
    },
    hitDeck: async ({ playerId, previousCard }) => {
      const nextCard = getNextCardFromDeck();
      const zIndex = virtualTrash.current.length + cardsOnTable.current.size;
      nextCard.setZIndex(zIndex);
      const card = playerHands.current[playerId]!;
      card.setValue(previousCard);
      await card.ensureFaceUp();
      await moveCardToPlayer(playerPositions[playerId], nextCard);
      playerHands.current[playerId] = nextCard;
    },
    trashCards: async () => {
      const cards = Array.from(cardsOnTable.current);
      cards.forEach((card) => virtualTrash.current.push(card));
      cardsOnTable.current.clear();
      playerHands.current = {};
      await staggerPromises(
        200,
        cards.map((card) => () => moveCardToTrash(card))
      );
    },
    revealCards: async (playerCards) => {
      const cards = deck.current?.getCards();
      if (!cards) throw new Error("No cards in deck");

      Object.entries(playerCards).forEach(([playerId, cardId]) => {
        playerHands.current[playerId]?.setValue(cardId);
      });

      await staggerPromises(
        200,
        Object.keys(playerCards).map((playerId) => {
          return () => playerHands.current[playerId]!.ensureFaceUp();
        })
      );
    },
  });

  return <AnimatableCardDeck ref={deck} cardWidth={40} numCards={52} />;
}

async function moveCardToPlayer(
  playerPosition: PlayerPosition,
  card: AnimatedCard
): Promise<void> {
  const { rotation } = playerPosition;
  // the card should be 40px closer to the center of the table than the player's circle
  const centerX = playerPosition.x;
  const centerY = playerPosition.y;
  const diagonalDistance = 40;
  const angle = Math.atan2(centerY, centerX);
  const x = centerX - diagonalDistance * Math.cos(angle);
  const y = centerY - diagonalDistance * Math.sin(angle);
  const pairs = [
    [card.x, x],
    [card.y, y],
    [card.rotation, rotation],
  ] as const;

  return new Promise((resolve) => {
    Animated.parallel(
      pairs.map(([value, toValue]) =>
        Animated.timing(value, {
          toValue,
          duration: 500,
          useNativeDriver: true,
        })
      )
    ).start(() => resolve());
  });
}

async function moveCardToTrash(card: AnimatedCard) {
  return Promise.all([
    card.ensureFaceDown(),
    new Promise<void>((resolve) => {
      Animated.parallel([
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
      ]).start(() => resolve());
    }),
  ]);
}

function staggerPromises(
  delay: number,
  promises: (() => Promise<unknown>)[]
): Promise<unknown[]> {
  return Promise.all(
    promises.map((promise, index) => {
      return new Promise<unknown>((resolve) => {
        setTimeout(() => promise().then(resolve), index * delay);
      });
    })
  );
}

function moveDeckNextToPlayer(
  deck: AnimatedCard[],
  playerPosition: PlayerPosition
): Animated.CompositeAnimation {
  // position the deck 60px diagonal from the center of the player's circle
  const centerX = playerPosition.x;
  const centerY = playerPosition.y;
  const diagonalDistance = 40;
  const angle = Math.atan2(centerY, centerX) - Math.PI / 2;
  const x = centerX + diagonalDistance * Math.cos(angle);
  const y = centerY + diagonalDistance * Math.sin(angle);

  function moveCard(card: AnimatedCard): Animated.CompositeAnimation {
    return Animated.parallel([
      Animated.timing(card.x, {
        toValue: x,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(card.y, {
        toValue: y,
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
