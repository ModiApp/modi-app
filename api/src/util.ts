import { auth } from "./firebase";



export async function getUsername(userId: string): Promise<string> {
  const user = await auth.getUser(userId);
  return user.displayName || "Unknown Player";
}

export async function generateRandomIdForRef(ref: FirebaseFirestore.CollectionReference) {
  let id: string;
  let attempts = 0;
  const maxAttempts = 10;

  do {
    id = Math.floor(1000 + Math.random() * 9000).toString();
    attempts++;
  } while (await ref.doc(id).get().then(doc => doc.exists) && attempts < maxAttempts);

  return id;
}

// export function getCardRankValue(cardId: string): number {
//   const rank = cardId.slice(0, -1); // Remove suit
//   const rankValues: { [key: string]: number } = {
//     'A': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13
//   };
//   return rankValues[rank] || 0;
// }


// export function calculatePlayersLost(playerCards: { [playerId: string]: CardID }): string[] {
//   const lowestRankValue = Math.min(...Object.values(playerCards).map(pc => getCardRankValue(pc)));
//   return Object.keys(playerCards).filter(pc => getCardRankValue(playerCards[pc]) === lowestRankValue);
// }

// export function deleteGame(gameId: string) {
//   console.info("Deleting game", gameId, process.env.GCLOUD_PROJECT);
//   return FirebaseTools.firestore.delete(`games/${gameId}`, {
//     project: process.env.GCLOUD_PROJECT || "",
//     recursive: true,
//     force: true,
//   });
// }