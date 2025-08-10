import { addActionToBatch, createRevealCardsAction, createStickAction, createTallyingAction } from "@/actions";
import type { AuthenticatedRequest } from "@/authenticate";
import { db } from "@/firebase";
import type { ActiveGame, CardID } from "@/types";
import { calculatePlayersLost } from "@/util";

export interface StickRequest extends AuthenticatedRequest { gameId: string }
export interface StickResponse { success: boolean }

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

export async function stick({ userId, gameId }: StickRequest): Promise<StickResponse> {
  const gameRef = db.collection("games").doc(gameId);
  const gameDoc = await gameRef.get();
  if (!gameDoc.exists) {
    throw Object.assign(new Error("Game not found"), { status: 404 });
  }
  const gameData = gameDoc.data() as ActiveGame;

  let updateData: Partial<ActiveGame> = {};
  const isDealer = gameData.dealer === userId;
  if (isDealer) {
    updateData = { roundState: "tallying" };
  } else {
    const nextPlayerId = findNextAlivePlayerToLeft(gameData.players, gameData.playerLives, userId);
    if (!nextPlayerId) {
      throw Object.assign(new Error("No alive players found to pass turn to"), { status: 412 });
    }
    updateData = { activePlayer: nextPlayerId };
  }

  const batch = db.batch();
  batch.update(gameRef, updateData);
  const stickAction = createStickAction(userId, isDealer);
  addActionToBatch(batch, gameId, stickAction);

  if (isDealer) {
    const playerHandsRef = db.collection("games").doc(gameId).collection("playerHands");
    const playerHandsSnapshot = await playerHandsRef.get();
    if (!playerHandsSnapshot.empty) {
      const playerCards: { [playerId: string]: CardID } = {};
      playerHandsSnapshot.forEach((doc) => {
        const pid = doc.id;
        const handData = doc.data() as { card: CardID | null };
        if (gameData.playerLives[pid] > 0 && handData.card) {
          playerCards[pid] = handData.card;
        }
      });
      const revealCardsAction = createRevealCardsAction(userId, playerCards);
      const revealTimestamp = new Date();
      addActionToBatch(batch, gameId, revealCardsAction, revealTimestamp);
      const playersLost = calculatePlayersLost(playerCards);
      const tallyingAction = createTallyingAction(userId, playersLost);
      const tallyingTimestamp = new Date(revealTimestamp.getTime() + 1);
      addActionToBatch(batch, gameId, tallyingAction, tallyingTimestamp);

      const updatedPlayerLives = { ...gameData.playerLives };
      playersLost.forEach((pid) => {
        updatedPlayerLives[pid] = Math.max(0, updatedPlayerLives[pid] - 1);
      });
      batch.update(gameRef, { playerLives: updatedPlayerLives });
    }
  }

  await batch.commit();
  return { success: true };
}


