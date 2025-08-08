import { createAndStoreAction, createPlayerJoinedAction } from "@/actions";
import type { AuthenticatedRequest } from "@/authenticate";
import { db } from "@/firebase";
import type { Game, InitialGame } from "@/types";
import { GameStatus } from "@/types";
import { getUsername } from "@/util";

export interface PlayAgainRequest extends AuthenticatedRequest {
  gameId: string;
}

export interface PlayAgainResponse {
  gameId: string;
}

export async function playAgain({ userId, gameId }: PlayAgainRequest): Promise<PlayAgainResponse> {
  if (!gameId) {
    throw Object.assign(new Error("Game ID is required"), { status: 400 });
  }

  const gameRef = db.collection("games").doc(gameId);
  const username = await getUsername(userId);

  let nextGameId = await generateGameId();

  await db.runTransaction(async (tx) => {
    const gameDoc = await tx.get(gameRef);
    if (!gameDoc.exists) {
      throw Object.assign(new Error("Game not found"), { status: 404 });
    }
    const gameData = gameDoc.data() as Game & { nextGameId?: string };
    if (gameData.status !== GameStatus.Ended) {
      throw Object.assign(new Error("Game has not ended"), { status: 412 });
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
      throw Object.assign(new Error("Next game not found"), { status: 404 });
    }
    const nextGameData = nextGameDoc.data() as InitialGame;
    if (nextGameData.status !== GameStatus.GatheringPlayers) {
      throw Object.assign(new Error("Next game already started"), { status: 412 });
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
  return { gameId: nextGameId };
}

async function generateGameId() {
  let newId: string;
  let attempts = 0;
  const maxAttempts = 10;
  do {
    newId = Math.floor(1000 + Math.random() * 9000).toString();
    attempts++;
  } while ((await isGameIdExists(newId)) && attempts < maxAttempts);
  return newId;
}

async function isGameIdExists(id: string) {
  const ref = db.collection("games").doc(id);
  const doc = await ref.get();
  return doc.exists;
}


