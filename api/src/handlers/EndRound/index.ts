import { addActionToBatch, createEndRoundAction } from "@/actions";
import type { AuthenticatedRequest } from "@/authenticate";
import { db } from "@/firebase";
import type { ActiveGame, CardID, EndedGame, GameInternalState } from "@/types";
import { GameStatus } from "@/types";

export interface EndRoundRequest extends AuthenticatedRequest { gameId: string }
export interface EndRoundResponse { success: boolean }

function findNextAlivePlayerToLeft(
  players: string[],
  playerLives: { [playerId: string]: number },
  currentPlayerId: string
): string | null {
  const currentIndex = players.indexOf(currentPlayerId);
  if (currentIndex === -1) return null;
  for (let i = 1; i <= players.length; i++) {
    const playerIndex = (currentIndex + i) % players.length;
    const playerId = players[playerIndex];
    if (playerLives[playerId] > 0) return playerId;
  }
  return null;
}

export async function endRound({ userId, gameId }: EndRoundRequest): Promise<EndRoundResponse> {
  const gameRef = db.collection("games").doc(gameId);
  const gameDoc = await gameRef.get();
  if (!gameDoc.exists) {
    throw Object.assign(new Error("Game not found"), { status: 404 });
  }
  const gameData = gameDoc.data() as ActiveGame;
  if (gameData.status !== "active") {
    throw Object.assign(new Error("Game is not active"), { status: 412 });
  }
  if (gameData.dealer !== userId) {
    throw Object.assign(new Error("Only the dealer can end the round"), { status: 403 });
  }
  if (gameData.activePlayer !== userId) {
    throw Object.assign(new Error("Only the active player can end the round"), { status: 403 });
  }
  if (gameData.roundState !== "tallying") {
    throw Object.assign(new Error("Round can only be ended in tallying state"), { status: 412 });
  }

  const playerHandsRef = db.collection("games").doc(gameId).collection("playerHands");
  const playerHandsSnapshot = await playerHandsRef.get();
  if (playerHandsSnapshot.empty) {
    throw Object.assign(new Error("No player hands found"), { status: 404 });
  }

  const alivePlayers = Object.keys(gameData.playerLives).filter((pid) => gameData.playerLives[pid] > 0);
  if (alivePlayers.length <= 1) {
    const winners = alivePlayers.length === 1 ? alivePlayers : playerHandsSnapshot.docs.filter((d) => d.data().card !== null).map((d) => d.id);
    const endedGame: EndedGame = {
      ...gameData,
      winners,
      status: GameStatus.Ended,
      dealer: null,
      activePlayer: null,
    };
    await gameRef.set(endedGame);
    return { success: true };
  }

  const cardsToTrash: CardID[] = [];
  playerHandsSnapshot.forEach((doc) => {
    const handData = doc.data() as { card: CardID | null };
    if (handData.card) cardsToTrash.push(handData.card);
  });

  const internalStateRef = db.collection("games").doc(gameId).collection("internalState").doc("state");
  const internalStateDoc = await internalStateRef.get();
  if (!internalStateDoc.exists) {
    throw Object.assign(new Error("Game internal state not found"), { status: 404 });
  }
  const internalState = internalStateDoc.data() as GameInternalState;
  const updatedTrash = [...internalState.trash, ...cardsToTrash];

  const newDealer = findNextAlivePlayerToLeft(gameData.players, gameData.playerLives, gameData.dealer);
  if (!newDealer) {
    throw Object.assign(new Error("No alive players found for new dealer"), { status: 412 });
  }

  const batch = db.batch();
  batch.update(gameRef, {
    dealer: newDealer,
    activePlayer: newDealer,
    roundState: "pre-deal",
    round: gameData.round + 1,
    turnStartedAt: null,
  });
  const updatedInternalState: GameInternalState = { deck: internalState.deck, trash: updatedTrash };
  batch.set(internalStateRef, updatedInternalState);

  const playerHandsToClear: { [playerId: string]: CardID | null } = {};
  gameData.players.forEach((pid) => {
    playerHandsToClear[pid] = null;
  });
  Object.entries(playerHandsToClear).forEach(([pid, card]) => {
    const playerHandRef = playerHandsRef.doc(pid);
    batch.set(playerHandRef, { card });
  });

  const endRoundAction = createEndRoundAction(userId, newDealer);
  addActionToBatch(batch, gameId, endRoundAction);

  await batch.commit();
  return { success: true };
}


