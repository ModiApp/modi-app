import { getFirestore } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { addActionToBatch, createEndRoundAction } from "./actionUtils";
import { ActiveGame, CardID, EndedGame, GameInternalState } from "./types";

const db = getFirestore();

export interface EndRoundRequest {
  // No parameters needed - game ID is determined from user's dealer status
}

export interface EndRoundResponse {
  success: boolean;
}

/**
 * Helper function to find the next alive player to the left of a given player
 */
function findNextAlivePlayerToLeft(
  players: string[],
  playerLives: { [playerId: string]: number },
  currentPlayerId: string
): string | null {
  const currentIndex = players.indexOf(currentPlayerId);
  if (currentIndex === -1) {
    return null;
  }

  // Start from the next player to the left and go around the circle
  for (let i = 1; i <= players.length; i++) {
    const playerIndex = (currentIndex + i) % players.length;
    const playerId = players[playerIndex];
    if (playerLives[playerId] > 0) {
      return playerId;
    }
  }

  return null; // No alive players found
}

export const endRound = onCall<EndRoundRequest, Promise<EndRoundResponse>>(async (request) => {
  const userId = request.auth?.uid;
  if (!userId) {
    console.error("EndRound: User is not authenticated");
    throw new HttpsError("unauthenticated", "User is not authenticated");
  }

  console.debug("EndRound: Finding game where user", userId, "is dealer");

  // Find the game where the user is the dealer
  const gamesRef = db.collection("games");
  const dealerQuery = gamesRef.where("dealer", "==", userId).where("status", "==", "active");
  const dealerQuerySnapshot = await dealerQuery.get();

  if (dealerQuerySnapshot.empty) {
    console.error("EndRound: No active game found where user is dealer", userId);
    throw new HttpsError("not-found", "No active game found where you are the dealer");
  }

  if (dealerQuerySnapshot.size > 1) {
    console.error("EndRound: Multiple active games found where user is dealer", userId);
    throw new HttpsError("internal", "Multiple active games found where you are dealer");
  }

  const gameDoc = dealerQuerySnapshot.docs[0];
  const gameId = gameDoc.id;
  console.debug("EndRound: Found game", gameId, "where user", userId, "is dealer");

  try {
    // We already have the game document from the query
    const gameData = gameDoc.data() as ActiveGame;
    const gameRef = gameDoc.ref;

    // Check if the game is active
    if (gameData.status !== "active") {
      console.error("EndRound: Game is not active", gameData.status);
      throw new HttpsError("failed-precondition", "Game is not active");
    }

    // Check if the user is the dealer
    if (gameData.dealer !== userId) {
      console.error("EndRound: User is not the dealer", userId, "dealer is", gameData.dealer);
      throw new HttpsError("permission-denied", "Only the dealer can end the round");
    }

    // Check if the user is the active player
    if (gameData.activePlayer !== userId) {
      console.error("EndRound: User is not the active player", userId, "active player is", gameData.activePlayer);
      throw new HttpsError("permission-denied", "Only the active player can end the round");
    }

    // Check if the round state is tallying
    if (gameData.roundState !== "tallying") {
      console.error("EndRound: Round state is not tallying", gameData.roundState);
      throw new HttpsError("failed-precondition", "Round can only be ended in tallying state");
    }

    const playerHandsRef = db.collection("games").doc(gameId).collection("playerHands");
    const playerHandsSnapshot = await playerHandsRef.get();

    if (playerHandsSnapshot.empty) {
      console.error("EndRound: No player hands found for game", gameId);
      throw new HttpsError("not-found", "No player hands found");
    }

    // TODO come up with plan for double game
    const alivePlayers = Object.keys(gameData.playerLives).filter(playerId => gameData.playerLives[playerId] > 0);
    if (alivePlayers.length <= 1) {
      const winners = alivePlayers.length === 1 ? alivePlayers : playerHandsSnapshot.docs.filter(doc => doc.data().card !== null).map(doc => doc.id);
      const endedGame: EndedGame = {
        ...gameData,
        winners,
        status: 'ended',
        dealer: null,
        activePlayer: null
      }
      await gameRef.set(endedGame);
      return { success: true };
    }

    const cardsToTrash: CardID[] = [];

    playerHandsSnapshot.forEach(doc => {
      const handData = doc.data() as { card: CardID | null };
      if (handData.card) {
        cardsToTrash.push(handData.card);
      }
    });


    // Get the internal state to update trash pile
    const internalStateRef = db.collection("games").doc(gameId).collection("internalState").doc("state");
    const internalStateDoc = await internalStateRef.get();

    if (!internalStateDoc.exists) {
      console.error("EndRound: Internal state not found for game", gameId);
      throw new HttpsError("not-found", "Game internal state not found");
    }

    const internalState = internalStateDoc.data() as GameInternalState;

    // Add all cards to trash pile
    const updatedTrash = [...internalState.trash, ...cardsToTrash];

    // Find the next alive player to the left of current dealer for new dealer
    const newDealer = findNextAlivePlayerToLeft(gameData.players, gameData.playerLives, gameData.dealer);
    
    if (!newDealer) {
      console.error("EndRound: No alive players found for new dealer");
      throw new HttpsError("failed-precondition", "No alive players found for new dealer");
    }

    // Use a batch write to ensure all updates are atomic
    const batch = db.batch();

    // Update the main game document
    batch.update(gameRef, {
      dealer: newDealer,
      activePlayer: newDealer,
      roundState: "pre-deal",
      round: gameData.round + 1
    });

    // Update the internal state with new trash pile
    const updatedInternalState: GameInternalState = {
      deck: internalState.deck,
      trash: updatedTrash,
    };
    batch.set(internalStateRef, updatedInternalState);

    // Clear all player hands (set to null)
    const playerHandsToClear: { [playerId: string]: CardID | null } = {};
    gameData.players.forEach(playerId => {
      playerHandsToClear[playerId] = null;
    });

    Object.entries(playerHandsToClear).forEach(([playerId, card]) => {
      const playerHandRef = playerHandsRef.doc(playerId);
      batch.set(playerHandRef, { card });
    });

    // Add the end round action to the batch
    const endRoundAction = createEndRoundAction(
      userId, 
      newDealer
    );
    addActionToBatch(batch, gameId, endRoundAction);

    // Commit the batch (all changes including action happen atomically)
    await batch.commit();

    console.info("EndRound: Round ended successfully", {
      gameId,
      oldDealer: gameData.dealer,
      newDealer,
      newRound: gameData.round + 1,
      cardsAddedToTrash: cardsToTrash.length,
      totalTrashSize: updatedTrash.length
    });

    return { success: true };

  } catch (error) {
    console.error("EndRound: Error ending round", error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError("internal", "Error ending round");
  }
});
