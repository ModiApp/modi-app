import type { AuthenticatedRequest } from "@/authenticate";
import { db } from "@/firebase";
import { FieldValue } from "firebase-admin/firestore";
import { GameStatus, InitialGame } from "@/types";
import { generateRandomIdForRef, getUsername } from "@/util";

export interface CreateGameRequest extends AuthenticatedRequest {
}

export interface CreateGameResponse {
  gameId: string;
}
export async function createGame({ userId }: CreateGameRequest): Promise<CreateGameResponse> {
  const username = await getUsername(userId);
  const gamesRef = db.collection("games");
  const gameId = await generateRandomIdForRef(gamesRef);
  console.debug("CreateGame: Generated game id:", gameId);

  const game: InitialGame = {
    gameId,
    status: GameStatus.GatheringPlayers,
    players: [userId],
    host: userId,
    usernames: { [userId]: username },
    initialLives: 3,
  }
  
  // createdAt lets the cleanup job date lobbies that have no actions yet
  await gamesRef.doc(gameId).set({ ...game, createdAt: FieldValue.serverTimestamp() });
  console.info("CreateGame: Game document created:", gameId);
  return { gameId };

}

