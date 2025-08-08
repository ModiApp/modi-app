import { addActionToBatch, createPlayerLeftAction } from "@/actions";
import type { AuthenticatedRequest } from "@/authenticate";
import { db } from "@/firebase";
import type { Game } from "@/types";

export interface LeaveGameRequest extends AuthenticatedRequest {}
export interface LeaveGameResponse { success: boolean; gameId: string }

export async function leaveGame({ userId }: LeaveGameRequest): Promise<LeaveGameResponse> {
  const gamesRef = db.collection("games");
  const snapshot = await gamesRef
    .where("status", "==", "gathering-players")
    .where("players", "array-contains", userId)
    .get();

  if (snapshot.empty) {
    return { success: true, gameId: "" };
  }

  const gameDoc = snapshot.docs[0];
  const gameId = gameDoc.id;
  const gameData = gameDoc.data() as Game;

  const username = gameData.usernames?.[userId] || "Unknown Player";

  const batch = db.batch();
  const updatedPlayers = gameData.players.filter((pid: string) => pid !== userId);
  if (updatedPlayers.length === 0) {
    // Delete the whole game tree
    // Firestore Admin SDK lacks recursive delete; emulate by deleting known subcollections then the doc
    const internalStateRef = db.collection("games").doc(gameId).collection("internalState").doc("state");
    const playerHandsRef = db.collection("games").doc(gameId).collection("playerHands");
    const actionsRef = db.collection("games").doc(gameId).collection("actions");
    const privateActionsRef = db.collection("games").doc(gameId).collection("privateActions");

    // best-effort deletes
    const playerHands = await playerHandsRef.get();
    playerHands.forEach((d) => batch.delete(d.ref));
    const actions = await actionsRef.get();
    actions.forEach((d) => batch.delete(d.ref));
    const privateUsers = await privateActionsRef.get();
    for (const userDoc of privateUsers.docs) {
      const userActions = await privateActionsRef.doc(userDoc.id).collection("actions").get();
      userActions.forEach((d) => batch.delete(d.ref));
      batch.delete(userDoc.ref);
    }
    batch.delete(internalStateRef);
    batch.delete(gameDoc.ref);
    await batch.commit();
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


