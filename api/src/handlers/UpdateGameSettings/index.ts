import type { AuthenticatedRequest } from "@/authenticate";
import { db } from "@/firebase";
import { GameStatus, type Game } from "@/types";

export interface UpdateGameSettingsRequest extends AuthenticatedRequest {
  gameId: string;
  initialLives?: number;
}

export interface UpdateGameSettingsResponse {
  success: boolean;
}

export async function updateGameSettings({
  userId,
  gameId,
  initialLives,
}: UpdateGameSettingsRequest): Promise<UpdateGameSettingsResponse> {
  const gameRef = db.collection("games").doc(gameId);
  const gameDoc = await gameRef.get();

  if (!gameDoc.exists) {
    const error = new Error("Game not found") as Error & { status: number };
    error.status = 404;
    throw error;
  }

  const game = gameDoc.data() as Game;

  if (game.host !== userId) {
    const error = new Error("Only the host can update game settings") as Error & { status: number };
    error.status = 403;
    throw error;
  }

  if (game.status !== GameStatus.GatheringPlayers) {
    const error = new Error("Game settings can only be updated before the game starts") as Error & { status: number };
    error.status = 400;
    throw error;
  }

  const updates: Partial<Game> = {};

  if (initialLives !== undefined) {
    if (initialLives < 1 || initialLives > 5) {
      const error = new Error("Initial lives must be between 1 and 5") as Error & { status: number };
      error.status = 400;
      throw error;
    }
    updates.initialLives = initialLives;
  }

  if (Object.keys(updates).length > 0) {
    await gameRef.update(updates);
    console.info("UpdateGameSettings: Game settings updated:", gameId, updates);
  }

  return { success: true };
}

