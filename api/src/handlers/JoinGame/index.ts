import { addActionToBatch, createPlayerJoinedAction } from "@/actions";
import type { AuthenticatedRequest } from "@/authenticate";
import { db } from "@/firebase";
import type { InitialGame } from "@/types";
import { getUsername } from "@/util";

export interface JoinGameRequest extends AuthenticatedRequest { gameId: string }

export interface JoinGameResponse {
  success: boolean;
  gameId: string;
}

export async function joinGame({ userId, gameId }: JoinGameRequest): Promise<JoinGameResponse> {
  if (!gameId) {
    throw Object.assign(new Error("Game ID is required"), { status: 400 });
  }

  const username = await getUsername(userId);

  const gameRef = db.collection("games").doc(gameId);
  const gameDoc = await gameRef.get();
  if (!gameDoc.exists) {
    throw Object.assign(new Error("Game not found"), { status: 404 });
  }

  const gameData = gameDoc.data() as InitialGame;
  if (gameData.status !== "gathering-players") {
    throw Object.assign(new Error("Game is not accepting players"), { status: 412 });
  }

  if (gameData.players && gameData.players.includes(userId)) {
    return { success: true, gameId };
  }

  const batch = db.batch();
  const updateData: Partial<InitialGame> = {
    players: [...(gameData.players || []), userId],
    usernames: { ...gameData.usernames, [userId]: username },
  };
  batch.update(gameRef, updateData);

  const playerJoinedAction = createPlayerJoinedAction(userId, username);
  addActionToBatch(batch, gameId, playerJoinedAction);

  await batch.commit();
  return { success: true, gameId };
}


