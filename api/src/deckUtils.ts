import type { CardID, CardRank, CardSuit } from "@/types/card.types";

export function generateDeck(): CardID[] {
  const suits: CardSuit[] = ["H", "D", "C", "S"];
  const ranks: CardRank[] = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
  const deck: CardID[] = [];
  for (const suit of suits) {
    for (const rank of ranks) {
      deck.push(`${rank}${suit}` as CardID);
    }
  }
  return deck;
}

export function shuffleDeck(deck: CardID[]): CardID[] {
  return deck.sort(() => Math.random() - 0.5);
}


