import { getFirestore } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { addActionToBatch, createDealCardsAction, createDeckReshuffleAction, createReceiveCardAction } from "./actionUtils";
import { shuffleDeck } from "./deckUtils";
import { ActiveGame, CardID, GameInternalState } from "./types";

const db = getFirestore();

export interface DealCardsRequest {
  // No parameters needed - game ID is determined from user's dealer status
}

export interface DealCardsResponse {
  success: boolean;
}

export const dealCards = onCall<DealCardsRequest, Promise<DealCardsResponse>>(async (request) => {
  const userId = request.auth?.uid;
  if (!userId) {
    console.error("DealCards: User is not authenticated");
    throw new HttpsError("unauthenticated", "User is not authenticated");
  }

  console.debug("DealCards: Finding game where user", userId, "is dealer");

  // Find the game where the user is the dealer
  const gamesRef = db.collection("games");
  const dealerQuery = gamesRef.where("dealer", "==", userId).where("status", "==", "active");
  const dealerQuerySnapshot = await dealerQuery.get();

  if (dealerQuerySnapshot.empty) {
    console.error("DealCards: No active game found where user is dealer", userId);
    throw new HttpsError("not-found", "No active game found where you are the dealer");
  }

  if (dealerQuerySnapshot.size > 1) {
    console.error("DealCards: Multiple active games found where user is dealer", userId);
    throw new HttpsError("internal", "Multiple active games found where you are dealer");
  }

  const gameDoc = dealerQuerySnapshot.docs[0];
  const gameId = gameDoc.id;
  console.debug("DealCards: Found game", gameId, "where user", userId, "is dealer");

  try {
    // We already have the game document from the query
    const gameData = gameDoc.data() as ActiveGame;
    const gameRef = gameDoc.ref;

    // Check if the game is active
    if (gameData.status !== "active") {
      console.error("DealCards: Game is not active", gameData.status);
      throw new HttpsError("failed-precondition", "Game is not active");
    }

    // Check if the user is the dealer
    if (gameData.dealer !== userId) {
      console.error("DealCards: User is not the dealer", userId, "dealer is", gameData.dealer);
      throw new HttpsError("permission-denied", "Only the dealer can deal cards");
    }

    // Check if the round state is pre-deal
    if (gameData.roundState !== "pre-deal") {
      console.error("DealCards: Round state is not pre-deal", gameData.roundState);
      throw new HttpsError("failed-precondition", "Cards can only be dealt in pre-deal state");
    }

    // Get the internal state (deck and trash)
    const internalStateRef = db.collection("games").doc(gameId).collection("internalState").doc("state");
    const internalStateDoc = await internalStateRef.get();

    if (!internalStateDoc.exists) {
      console.error("DealCards: Internal state not found for game", gameId);
      throw new HttpsError("not-found", "Game internal state not found");
    }

    const internalState = internalStateDoc.data() as GameInternalState;

    // Use the new logic below:
    let deck = [...internalState.deck];
    let trash = [...internalState.trash];
    // deckReshuffled is not needed anymore

    // Get players with lives remaining
    const playersWithLives = gameData.players.filter(playerId => gameData.playerLives[playerId] > 0);

    if (playersWithLives.length === 0) {
      console.error("DealCards: No players with lives remaining");
      throw new HttpsError("failed-precondition", "No players with lives remaining");
    }

    // Find the dealer's position in the players array
    const dealerIndex = gameData.players.indexOf(gameData.dealer);
    if (dealerIndex === -1) {
      console.error("DealCards: Dealer not found in players array");
      throw new HttpsError("internal", "Dealer not found in players array");
    }

    // Create the dealing order: start from left of dealer, end with dealer
    const dealingOrder: string[] = [];
    for (let i = 1; i <= gameData.players.length; i++) {
      const playerIndex = (dealerIndex + i) % gameData.players.length;
      const playerId = gameData.players[playerIndex];
      if (gameData.playerLives[playerId] > 0) {
        dealingOrder.push(playerId);
      }
    }

    // Use a batch write to ensure all updates are atomic
    const batch = db.batch();
    const playerHandsRef = db.collection("games").doc(gameId).collection("playerHands");
    let updatedPlayerHands: { [playerId: string]: CardID } = {};


    let playerIndexOfReshuffle = 0;
    const now = Date.now();
    // Deal one card to each player in order, handling mid-deal reshuffle
    dealingOrder.forEach((playerId, i) => {
      if (deck.length === 0) {
        if (trash.length === 0) {
          // Should not happen, but just in case
          throw new HttpsError("failed-precondition", "No cards left in deck or trash");
        }
        // If we dealt cards already, emit dealCards action for players dealt so far
        if (i > 1) {
          // we need to subtract 1 from i because we haven't yet dealt this (i-th) player!
          const dealCardsAction = createDealCardsAction(userId, dealingOrder.slice(0, i - 1));
          addActionToBatch(batch, gameId, dealCardsAction, new Date(now));
          playerIndexOfReshuffle = i;
        }
        // Emit reshuffle action
        const reshuffleAction = createDeckReshuffleAction(userId, gameData.dealer);
        addActionToBatch(batch, gameId, reshuffleAction, new Date(now + 1));
        deck = shuffleDeck(trash);
        trash = [];
      }
      // Deal the card
      updatedPlayerHands[playerId] = deck.pop()!;
    });

    // Emit dealCards actions for players dealt before reshuffle
    const dealCardsAction = createDealCardsAction(userId, dealingOrder.slice(playerIndexOfReshuffle));
    addActionToBatch(batch, gameId, dealCardsAction, new Date(now + 2));

    // Update the main game document - update roundState and activePlayer
    batch.update(gameRef, {
      roundState: "playing",
      activePlayer: dealingOrder[0],
    });

    // Update the internal state
    batch.set(internalStateRef, { deck, trash });

    // Update player hands
    Object.entries(updatedPlayerHands).forEach(([playerId, card]) => {
      const playerHandRef = playerHandsRef.doc(playerId);
      batch.set(playerHandRef, { card });
    });

    // Commit the batch (all changes including actions happen atomically)
    await batch.commit();

    // NEW: After committing the batch, write private 'receive-card' actions for each player
    const privateActionsRef = db.collection("games").doc(gameId).collection("privateActions");
    await Promise.all(
      Object.entries(updatedPlayerHands).map(async ([playerId, card]) => {
        const playerPrivateActions = privateActionsRef.doc(playerId).collection("actions");
        const privateAction = createReceiveCardAction(playerId, card);
        await playerPrivateActions.add(privateAction);
      })
    );

    console.info("DealCards: Cards dealt successfully", {
      gameId,
      dealer: gameData.dealer,
      playersDealt: dealingOrder.length,
      cardsRemaining: deck.length,
      newActivePlayer: dealingOrder[0],
    });

    return { success: true };

  } catch (error) {
    console.error("DealCards: Error dealing cards", error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError("internal", "Error dealing cards");
  }
});
