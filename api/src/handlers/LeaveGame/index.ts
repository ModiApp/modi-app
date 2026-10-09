import { addActionToBatch, createPlayerLeftAction } from "@/actions";
import type { AuthenticatedRequest } from "@/authenticate";
import { db } from "@/firebase";
import type { Game } from "@/types";
import { GameStatus } from "@/types";

export interface LeaveGameRequest extends AuthenticatedRequest { gameId: string }
export interface LeaveGameResponse { success: boolean; gameId: string }

export async function leaveGame({ userId, gameId }: LeaveGameRequest): Promise<LeaveGameResponse> {
  const gameRef = db.collection("games").doc(gameId);
  const gameDoc = await gameRef.get();
  if (!gameDoc.exists) return { success: true, gameId: "" };
  const gameData = gameDoc.data() as Game;

  // Leaving a finished game is just navigation. Keep the game intact so the
  // cleanup job archives it with every player, rather than stripping players
  // or deleting it when the last one leaves.
  if (gameData.status === GameStatus.Ended) return { success: true, gameId };

  const username = gameData.usernames?.[userId] || "Unknown Player";

  const batch = db.batch();
  const updatedPlayers = gameData.players.filter((pid: string) => pid !== userId);
  if (updatedPlayers.length === 0) {
    // Delete the whole game tree. Deleting just the doc would leave subcollections
    // behind, including privateActions/{playerId}/actions whose parent docs don't exist.
    await db.recursiveDelete(gameDoc.ref);
    return { success: true, gameId: "" };
  }

  const updateData: Partial<Game> = { players: updatedPlayers } as Partial<Game>;
  if (userId === gameData.host) {
    updateData.host = updatedPlayers[0];
  }
  if (gameData.usernames && gameData.usernames[userId]) {
    const { [userId]: _, ...remaining } = gameData.usernames;
    updateData.usernames = remaining as any;
  }
  batch.update(gameDoc.ref, updateData);

  const playerLeftAction = createPlayerLeftAction(userId, username);
  addActionToBatch(batch, gameId, playerLeftAction);

  await batch.commit();
  return { success: true, gameId };
}


