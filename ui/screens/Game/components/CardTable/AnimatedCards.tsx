import { useGameActions } from "@/hooks/useGameActions";
import {
  AnimatableCardDeck,
  AnimatableCardDeckRef,
  AnimatedCard,
} from "@/ui/components/AnimatableCardDeck";
import { useCurrentGame } from "@/ui/screens/Game/PlayingContext";
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
  const { game } = useCurrentGame();
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
      await staggerPromises(400, [
        () =>
          staggerPromises(100, [
            () => fromCard.ensureFaceDown(),
            () => moveCardToPlayer(playerPositions[toPlayerId], fromCard),
          ]),
        () =>
          staggerPromises(100, [
            () => toCard.ensureFaceDown(),
            () => moveCardToPlayer(playerPositions[fromPlayerId], toCard),
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
      await makeRoomForHitCard(card, playerPositions[playerId]);
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
    kung: async ({ playerId, playerIdWithKing, cardId }) => {
      const player = playerPositions[playerId];
      const king = playerPositions[playerIdWithKing];
      const card = playerHands.current[playerId]!;
      const kingCard = playerHands.current[playerIdWithKing]!;
      kingCard.setValue(cardId);
      await moveCardToPlayer(king, card);
      await staggerPromises(200, [
        () => kingCard.ensureFaceUp(),
        () => moveCardToPlayer(player, card),
      ]);
    },
  });

  return <AnimatableCardDeck ref={deck} cardWidth={80} numCards={52} />;
}

async function moveCardToPlayer(
  playerPosition: PlayerPosition,
  card: AnimatedCard
): Promise<void> {
  const { rotation } = playerPosition;
  // the card should be 40px closer to the center of the table than the player's circle
  const centerX = playerPosition.x;
  const centerY = playerPosition.y;
  const diagonalDistance = 80;
  const angle = Math.atan2(centerY, centerX);
  const x = centerX - diagonalDistance * Math.cos(angle);
  const y = centerY - diagonalDistance * Math.sin(angle);
  const pairs = [
    [card.x, x],
    [card.y, y],
    [card.rotation, rotation],
    [card.scale, 1],
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

/**
 * Move the card to the left of its current position, relative to the player's perspective.
 * This makes room for the hit card to be placed in the original position.
 */
async function makeRoomForHitCard(
  card: AnimatedCard,
  playerPosition: PlayerPosition
) {
  console.log("makeRoomForHitCard", card.x, card.y);
  // Calculate angle from center to player
  const angle = Math.atan2(playerPosition.y, playerPosition.x);

  // Calculate offset perpendicular to player angle (90 degrees = PI/2)
  // This gives us the "left" direction from the player's perspective
  const offsetAngle = angle + Math.PI / 2;

  // Move card 40px in that direction
  const offsetDistance = 20;
  const offsetX = offsetDistance * Math.cos(offsetAngle);
  const offsetY = offsetDistance * Math.sin(offsetAngle);

  console.log("offsetX", offsetX, "offsetY", offsetY);

  const newX = card.x._value + offsetX;
  const newY = card.y._value + offsetY;

  const pairs = [
    [card.x, newX],
    [card.y, newY],
  ] as const;

  return new Promise<void>((resolve) => {
    Animated.parallel(
      pairs.map(([value, toValue]) =>
        Animated.timing(value, {
          toValue,
          duration: 300,
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
          toValue: Math.floor(Math.random() * 18) - 9,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(card.scale, {
          toValue: 0.3,
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
  const diagonalDistance = 30;
  const angle = Math.atan2(centerY, centerX) - Math.PI / 2;
  const x = centerX + diagonalDistance * Math.cos(angle);
  const y = centerY + diagonalDistance * Math.sin(angle);

  function moveCard(card: AnimatedCard): Animated.CompositeAnimation {
    const pairs = [
      [card.x, x],
      [card.y, y],
      [
        card.rotation,
        playerPosition.rotation + Math.floor(Math.random() * 4) - 2,
      ],
      [card.scale, 0.3],
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

  return Animated.parallel(deck.map(moveCard));
}
