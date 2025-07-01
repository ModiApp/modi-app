import { getFirestore } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";

const db = getFirestore();

export const createGame = onCall(async (request) => {
  const userId = request.auth?.uid;
  if (!userId) {
    console.error("CreateGame:User is not authenticated");
    throw new HttpsError("unauthenticated", "User is not authenticated");
  }

  // Create a new game document in the fire store
  // The game document should only have the following fields:
  // Players: a list of player ids
  // Host: the id of the host player
  // GameState: 'gathering-players' (this will change once the host starts the game)

  // Create a new game document in the fire store
  const gameId = await generateGameId();
  console.debug("CreateGame: Generated game id:", gameId);

  
  return db.collection("games").doc(gameId).set({
    players: [userId],
    host: userId,
    gameState: "gathering-players",
  }).then((res) => {
    console.info("CreateGame: Game document created:", res);
    return { success: true, gameId };
  }).catch((err) => {
    console.error("CreateGame: Error creating game document:", err);
    throw new HttpsError("internal", "Error creating game document");
  });
});

async function generateGameId() {
  let gameId: string;
  let attempts = 0;
  const maxAttempts = 10;

  do {
    gameId = Math.floor(1000 + Math.random() * 9000).toString();
    attempts++;
  } while (await isGameIdExists(gameId) && attempts < maxAttempts);

  return gameId;
}

async function isGameIdExists(gameId: string) {
  const gameRef = db.collection("games").doc(gameId);
  const game = await gameRef.get();
  return game.exists;
}