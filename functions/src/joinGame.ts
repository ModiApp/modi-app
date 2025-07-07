import { getFirestore } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { InitialGame } from "./types";

const db = getFirestore();

export interface JoinGameRequest {
  username: string;
  gameId: string;
}

export interface JoinGameResponse {
  success: boolean;
  gameId: string;
}

export const joinGame = onCall<JoinGameRequest, Promise<JoinGameResponse>>(async (request) => {
  const userId = request.auth?.uid;
  if (!userId) {
    console.error("JoinGame: User is not authenticated");
    throw new HttpsError("unauthenticated", "User is not authenticated");
  }

  const { username, gameId } = request.data;

  // Validate request data
  if (!username || !gameId) {
    console.error("JoinGame: Missing required fields", { username, gameId });
    throw new HttpsError("invalid-argument", "Username and gameId are required");
  }

  if (typeof username !== "string" || username.trim().length === 0) {
    console.error("JoinGame: Invalid username", { username });
    throw new HttpsError("invalid-argument", "Username must be a non-empty string");
  }

  if (typeof gameId !== "string" || gameId.trim().length === 0) {
    console.error("JoinGame: Invalid gameId", { gameId });
    throw new HttpsError("invalid-argument", "GameId must be a non-empty string");
  }

  try {
    // Check if game exists
    const gameRef = db.collection("games").doc(gameId);
    const gameDoc = await gameRef.get();

    if (!gameDoc.exists) {
      console.error("JoinGame: Game not found", { gameId });
      throw new HttpsError("not-found", "Game not found");
    }

    const gameData = gameDoc.data() as InitialGame;
    if (!gameData) {
      console.error("JoinGame: Game data is null", { gameId });
      throw new HttpsError("internal", "Game data is corrupted");
    }

    // Check if game is in gathering-players state
    if (gameData.status !== "gathering-players") {
      console.error("JoinGame: Game is not accepting players", { gameId, status: gameData.status });
      throw new HttpsError("failed-precondition", "Game is not accepting players");
    }

    // Check if user is already in the game
    if (gameData.players && gameData.players.includes(userId)) {
      console.warn("JoinGame: User already in game", { userId, gameId });
      return { success: true, gameId };
    }

    // Update the game document
    const updateData: Partial<InitialGame> = {
      players: [...(gameData.players || []), userId],
      usernames: { ...gameData.usernames, [userId]: username.trim() },
    };

    await gameRef.update(updateData);

    console.info("JoinGame: User successfully joined game", { userId, username, gameId });
    return { success: true, gameId };

  } catch (error) {
    if (error instanceof HttpsError) {
      throw error;
    }
    console.error("JoinGame: Unexpected error", error);
    throw new HttpsError("internal", "Failed to join game");
  }
}); 