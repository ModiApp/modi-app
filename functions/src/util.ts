import { auth } from "firebase-admin";
import FirebaseTools from 'firebase-tools';
import type { CardID } from "./types";

const adminAuth = auth();

export async function getUsername(userId: string): Promise<string> {
  const user = await adminAuth.getUser(userId);
  return user.displayName || "Unknown Player";
}

export function getCardRankValue(cardId: string): number {
  const rank = cardId.slice(0, -1); // Remove suit
  const rankValues: { [key: string]: number } = {
    'A': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13
  };
  return rankValues[rank] || 0;
}


export function calculatePlayersLost(playerCards: { [playerId: string]: CardID }): string[] {
  const lowestRankValue = Math.min(...Object.values(playerCards).map(pc => getCardRankValue(pc)));
  return Object.keys(playerCards).filter(pc => getCardRankValue(playerCards[pc]) === lowestRankValue);
}

export function deleteGame(gameId: string) {
  return FirebaseTools.firestore.delete(`games/${gameId}`, {
    recursive: true,
    force: true,
  });
}