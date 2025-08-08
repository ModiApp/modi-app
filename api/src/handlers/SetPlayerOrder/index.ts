import type { AuthenticatedRequest } from "@/authenticate";
import { db } from "@/firebase";
import type { InitialGame } from "@/types";

export interface SetPlayerOrderRequest extends AuthenticatedRequest {
  gameId: string;
  players: string[];
}

export interface SetPlayerOrderResponse { success: boolean }

export async function setPlayerOrder({ userId, gameId, players }: SetPlayerOrderRequest): Promise<SetPlayerOrderResponse> {
  if (!gameId || !players || !Array.isArray(players)) {
    throw Object.assign(new Error("gameId and players are required"), { status: 400 });
  }

  const gameRef = db.collection("games").doc(gameId);
  const gameDoc = await gameRef.get();
  if (!gameDoc.exists) {
    throw Object.assign(new Error("Game not found"), { status: 404 });
  }

  const gameData = gameDoc.data() as InitialGame;
  if (gameData.host !== userId) {
    throw Object.assign(new Error("Only the host can reorder players"), { status: 403 });
  }
  if (gameData.status !== "gathering-players") {
    throw Object.assign(new Error("Players can only be reordered before the game starts"), { status: 412 });
  }

  const originalPlayers = gameData.players;
  if (players.length !== originalPlayers.length || !players.every((p) => originalPlayers.includes(p))) {
    throw Object.assign(new Error("Players array must contain the same players as the game"), { status: 400 });
  }

  await gameRef.update({ players });
  return { success: true };
}


