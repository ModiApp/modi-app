import { HttpsError, onCall } from "firebase-functions/v2/https";
import { createGameLogic, CreateGameRequest, CreateGameResponse } from "../../api/src/gameLogic/createGame";

export const createGame = onCall<CreateGameRequest, Promise<CreateGameResponse>>(async (request) => {
  const userId = request.auth?.uid;
  if (!userId) {
    console.error("CreateGame: User is not authenticated");
    throw new HttpsError("unauthenticated", "User is not authenticated");
  }

  try {
    return await createGameLogic(userId);
  } catch (error) {
    console.error("CreateGame: Error creating game:", error);
    throw new HttpsError("internal", "Error creating game document");
  }
});