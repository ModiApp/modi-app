import type { AuthenticatedRequest } from "@/authenticate";
import { db } from "@/firebase";
import { GameStatus, type InitialGame } from "@/types";

export interface UpdateGameSettingsRequest extends AuthenticatedRequest {
  gameId: string;
  initialLives: number;
}

export interface UpdateGameSettingsResponse {
  success: boolean;
  initialLives: number;
}

export async function updateGameSettings({
  userId,
  gameId,
  initialLives,
}: UpdateGameSettingsRequest): Promise<UpdateGameSettingsResponse> {
  if (!gameId) {
    throw Object.assign(new Error("gameId is required"), { status: 400 });
  }

  if (typeof initialLives !== "number" || Number.isNaN(initialLives)) {
    throw Object.assign(new Error("initialLives must be a number"), { status: 400 });
  }

  if (!Number.isInteger(initialLives)) {
    throw Object.assign(new Error("initialLives must be an integer"), { status: 400 });
  }

  if (initialLives < 1 || initialLives > 10) {
    throw Object.assign(new Error("initialLives must be between 1 and 10"), {
      status: 400,
    });
  }

  const gameRef = db.collection("games").doc(gameId);
  const gameDoc = await gameRef.get();

  if (!gameDoc.exists) {
    throw Object.assign(new Error("Game not found"), { status: 404 });
  }

  const gameData = gameDoc.data() as InitialGame;

  if (gameData.host !== userId) {
    throw Object.assign(new Error("Only the host can update settings"), {
      status: 403,
    });
  }

  if (gameData.status !== GameStatus.GatheringPlayers) {
    throw Object.assign(
      new Error("Settings can only be changed before the game starts"),
      { status: 412 }
    );
  }

  await gameRef.update({ initialLives });

  return { success: true, initialLives };
}

