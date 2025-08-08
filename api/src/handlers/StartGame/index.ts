import { addActionToBatch, createGameStartedAction } from "@/actions";
import type { AuthenticatedRequest } from "@/authenticate";
import { generateDeck, shuffleDeck } from "@/deckUtils";
import { db } from "@/firebase";
import type { ActiveGame, CardID, GameInternalState, InitialGame } from "@/types";
import { GameStatus } from "@/types";

export interface StartGameRequest extends AuthenticatedRequest {
  gameId: string;
}

export interface StartGameResponse {
  success: boolean;
}

export async function startGame({ userId, gameId }: StartGameRequest): Promise<StartGameResponse> {
  if (!gameId) {
    throw Object.assign(new Error("Game ID is required"), { status: 400 });
  }

  const gameRef = db.collection("games").doc(gameId);
  const gameDoc = await gameRef.get();
  if (!gameDoc.exists) {
    throw Object.assign(new Error("Game not found"), { status: 404 });
  }

  const gameData = gameDoc.data() as InitialGame;
  if (gameData.host !== userId) {
    throw Object.assign(new Error("Only the host can start the game"), { status: 403 });
  }
  if (gameData.status !== "gathering-players") {
    throw Object.assign(new Error("Game is not in the correct state to start"), { status: 412 });
  }
  if (gameData.players.length < 2) {
    throw Object.assign(new Error("Need at least 2 players to start the game"), { status: 412 });
  }

  const deck = shuffleDeck(generateDeck());

  const playerLives: { [playerId: string]: number } = {};
  gameData.players.forEach((pid) => {
    playerLives[pid] = gameData.initialLives;
  });

  const activeGame: ActiveGame = {
    ...gameData,
    status: GameStatus.Active,
    playerLives,
    dealer: gameData.host,
    round: 1,
    activePlayer: gameData.host,
    roundState: "pre-deal",
  };

  const internalState: GameInternalState = { deck, trash: [] };

  const playerHands: { [playerId: string]: CardID | null } = {};
  gameData.players.forEach((pid) => {
    playerHands[pid] = null;
  });

  const batch = db.batch();
  batch.set(gameRef, activeGame);
  const internalStateRef = db.collection("games").doc(gameId).collection("internalState").doc("state");
  batch.set(internalStateRef, internalState);
  const playerHandsRef = db.collection("games").doc(gameId).collection("playerHands");
  Object.entries(playerHands).forEach(([pid, card]) => {
    batch.set(playerHandsRef.doc(pid), { card });
  });

  const gameStartedAction = createGameStartedAction(userId, gameData.host);
  addActionToBatch(batch, gameId, gameStartedAction);

  await batch.commit();
  return { success: true };
}


