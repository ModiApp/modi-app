import { getFirestore } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { createAndStoreAction, createPlayerJoinedAction } from "./actionUtils";
import { Game, GameStatus, InitialGame } from "./types";
import { getUsername } from "./util";

const db = getFirestore();

export interface PlayAgainRequest {
  gameId: string;
}

export interface PlayAgainResponse {
  gameId: string;
}

export const playAgain = onCall<PlayAgainRequest, Promise<PlayAgainResponse>>(async (request) => {
  const userId = request.auth?.uid;
  if (!userId) {
    console.error("PlayAgain: User is not authenticated");
    throw new HttpsError("unauthenticated", "User is not authenticated");
  }

  const { gameId } = request.data;
  if (!gameId) {
    console.error("PlayAgain: Game ID is required");
    throw new HttpsError("invalid-argument", "Game ID is required");
  }

  const gameRef = db.collection("games").doc(gameId);
  const username = await getUsername(userId);
  let nextGameId = await generateGameId();

  await db.runTransaction(async (tx) => {
    const gameDoc = await tx.get(gameRef);
    if (!gameDoc.exists) {
      console.error("PlayAgain: Game not found", gameId);
      throw new HttpsError("not-found", "Game not found");
    }

    const gameData = gameDoc.data() as Game & { nextGameId?: string };
    if (gameData.status !== GameStatus.Ended) {
      console.error("PlayAgain: Game is not ended", gameData.status);
      throw new HttpsError("failed-precondition", "Game has not ended");
    }

    nextGameId = gameData.nextGameId || nextGameId;

    const nextGameRef = db.collection("games").doc(nextGameId);

    if (!gameData.nextGameId) {
      const newGame: InitialGame = {
        gameId: nextGameId,
        status: GameStatus.GatheringPlayers,
        players: [userId],
        host: userId,
        usernames: { [userId]: username },
        initialLives: gameData.initialLives,
      };
      tx.set(nextGameRef, newGame);
      tx.update(gameRef, { nextGameId });
      return;
    }

    const nextGameDoc = await tx.get(nextGameRef);
    if (!nextGameDoc.exists) {
      console.error("PlayAgain: Next game not found", nextGameId);
      throw new HttpsError("not-found", "Next game not found");
    }

    const nextGameData = nextGameDoc.data() as InitialGame;
    if (nextGameData.status !== GameStatus.GatheringPlayers) {
      console.error("PlayAgain: Next game already started", nextGameId);
      throw new HttpsError(
        "failed-precondition",
        "Next game already started"
      );
    }

    if (!nextGameData.players.includes(userId)) {
      tx.update(nextGameRef, {
        players: [...nextGameData.players, userId],
        usernames: { ...nextGameData.usernames, [userId]: username },
      });
    }
  });

  const joinedAction = createPlayerJoinedAction(userId, username);
  await createAndStoreAction(nextGameId, joinedAction);

  console.info("PlayAgain: Player", userId, "joined next game", nextGameId);
  return { gameId: nextGameId };
});

async function generateGameId() {
  let newId: string;
  let attempts = 0;
  const maxAttempts = 10;

  do {
    newId = Math.floor(1000 + Math.random() * 9000).toString();
    attempts++;
  } while (await isGameIdExists(newId) && attempts < maxAttempts);

  return newId;
}

async function isGameIdExists(gameId: string) {
  const ref = db.collection("games").doc(gameId);
  const doc = await ref.get();
  return doc.exists;
}
