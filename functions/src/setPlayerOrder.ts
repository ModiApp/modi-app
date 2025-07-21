import { getFirestore } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { InitialGame } from "./types";

const db = getFirestore();

export interface SetPlayerOrderRequest {
  gameId: string;
  players: string[];
}

export interface SetPlayerOrderResponse {
  success: boolean;
}

export const setPlayerOrder = onCall<SetPlayerOrderRequest, Promise<SetPlayerOrderResponse>>(async (request) => {
  const userId = request.auth?.uid;
  if (!userId) {
    console.error("setPlayerOrder: User is not authenticated");
    throw new HttpsError("unauthenticated", "User is not authenticated");
  }

  const { gameId, players } = request.data;
  if (!gameId || !players || !Array.isArray(players)) {
    console.error("setPlayerOrder: Invalid arguments", { gameId, players });
    throw new HttpsError("invalid-argument", "gameId and players are required");
  }

  try {
    const gameRef = db.collection("games").doc(gameId);
    const gameDoc = await gameRef.get();
    if (!gameDoc.exists) {
      console.error("setPlayerOrder: Game not found", gameId);
      throw new HttpsError("not-found", "Game not found");
    }

    const gameData = gameDoc.data() as InitialGame;

    if (gameData.host !== userId) {
      console.error("setPlayerOrder: User is not host", { userId, host: gameData.host });
      throw new HttpsError("permission-denied", "Only the host can reorder players");
    }

    if (gameData.status !== "gathering-players") {
      console.error("setPlayerOrder: Game not in gathering-players state", gameData.status);
      throw new HttpsError("failed-precondition", "Players can only be reordered before the game starts");
    }

    const originalPlayers = gameData.players;
    if (players.length !== originalPlayers.length || !players.every((p) => originalPlayers.includes(p))) {
      console.error("setPlayerOrder: Players array mismatch", { players, originalPlayers });
      throw new HttpsError("invalid-argument", "Players array must contain the same players as the game");
    }

    await gameRef.update({ players });

    console.info("setPlayerOrder: Player order updated", { gameId, players });
    return { success: true };
  } catch (error) {
    console.error("setPlayerOrder: Unexpected error", error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError("internal", "Failed to set player order");
  }
});

