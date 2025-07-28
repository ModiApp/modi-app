import { getFirestore } from "firebase-admin/firestore";
import { GameStatus, InitialGame } from "../types";
import { getUsername } from "../utils/util";

export interface CreateGameRequest {
  // No parameters needed
}

export interface CreateGameResponse {
  gameId: string;
}

export async function createGameLogic(userId: string): Promise<CreateGameResponse> {
  const db = getFirestore();
  const username = await getUsername(userId);
  const gameId = await generateGameId();
  
  console.debug("CreateGame: Generated game id:", gameId);

  const game: InitialGame = {
    gameId,
    status: GameStatus.GatheringPlayers,
    players: [userId],
    host: userId,
    usernames: { [userId]: username },
    initialLives: 3,
  }
  
  await db.doc(`games/${gameId}`).set(game);
  
  console.info("CreateGame: Game document created:", gameId);
  return { gameId };
}

async function generateGameId(): Promise<string> {
  const db = getFirestore();
  let gameId: string;
  let attempts = 0;
  const maxAttempts = 10;

  do {
    gameId = Math.floor(1000 + Math.random() * 9000).toString();
    attempts++;
  } while (await isGameIdExists(gameId) && attempts < maxAttempts);

  return gameId;
}

async function isGameIdExists(gameId: string): Promise<boolean> {
  const db = getFirestore();
  const gameRef = db.collection("games").doc(gameId);
  const game = await gameRef.get();
  return game.exists;
} 