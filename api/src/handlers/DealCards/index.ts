import { addActionToBatch, createDealCardsAction, createDeckReshuffleAction, createReceiveCardAction } from "@/actions";
import type { AuthenticatedRequest } from "@/authenticate";
import { shuffleDeck } from "@/deckUtils";
import { db } from "@/firebase";
import type { ActiveGame, CardID, GameInternalState } from "@/types";

export interface DealCardsRequest extends AuthenticatedRequest { gameId: string }
export interface DealCardsResponse { success: boolean }

export async function dealCards({ userId, gameId }: DealCardsRequest): Promise<DealCardsResponse> {
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
    throw Object.assign(new Error("Only the dealer can deal cards"), { status: 403 });
  }
  if (gameData.roundState !== "pre-deal") {
    throw Object.assign(new Error("Cards can only be dealt in pre-deal state"), { status: 412 });
  }

  const internalStateRef = db.collection("games").doc(gameId).collection("internalState").doc("state");
  const internalStateDoc = await internalStateRef.get();
  if (!internalStateDoc.exists) {
    throw Object.assign(new Error("Game internal state not found"), { status: 404 });
  }
  const internalState = internalStateDoc.data() as GameInternalState;

  let deck = [...internalState.deck];
  let trash = [...internalState.trash];

  const playersWithLives = gameData.players.filter((pid) => gameData.playerLives[pid] > 0);
  if (playersWithLives.length === 0) {
    throw Object.assign(new Error("No players with lives remaining"), { status: 412 });
  }

  const dealerIndex = gameData.players.indexOf(gameData.dealer);
  if (dealerIndex === -1) {
    throw Object.assign(new Error("Dealer not found in players array"), { status: 500 });
  }

  const dealingOrder: string[] = [];
  for (let i = 1; i <= gameData.players.length; i++) {
    const playerIndex = (dealerIndex + i) % gameData.players.length;
    const pid = gameData.players[playerIndex];
    if (gameData.playerLives[pid] > 0) {
      dealingOrder.push(pid);
    }
  }

  const batch = db.batch();
  const playerHandsRef = db.collection("games").doc(gameId).collection("playerHands");
  const updatedPlayerHands: { [playerId: string]: CardID } = {};

  let playerIndexOfReshuffle = 0;
  const now = Date.now();
  dealingOrder.forEach((pid, i) => {
    if (deck.length === 0) {
      if (trash.length === 0) {
        throw Object.assign(new Error("No cards left in deck or trash"), { status: 412 });
      }
      if (i > 1) {
        const dealCardsAction = createDealCardsAction(userId, dealingOrder.slice(0, i - 1));
        addActionToBatch(batch, gameId, dealCardsAction, new Date(now));
        playerIndexOfReshuffle = i;
      }
      const reshuffleAction = createDeckReshuffleAction(userId, gameData.dealer);
      addActionToBatch(batch, gameId, reshuffleAction, new Date(now + 1));
      deck = shuffleDeck(trash);
      trash = [];
    }
    updatedPlayerHands[pid] = deck.pop()!;
  });

  const dealCardsAction = createDealCardsAction(userId, dealingOrder.slice(playerIndexOfReshuffle));
  addActionToBatch(batch, gameId, dealCardsAction, new Date(now + 2));

  batch.update(gameRef, { roundState: "playing", activePlayer: dealingOrder[0] });
  batch.set(internalStateRef, { deck, trash });
  Object.entries(updatedPlayerHands).forEach(([pid, card]) => {
    batch.set(playerHandsRef.doc(pid), { card });
  });

  await batch.commit();

  const privateActionsRef = db.collection("games").doc(gameId).collection("privateActions");
  await Promise.all(
    Object.entries(updatedPlayerHands).map(async ([pid, card]) => {
      const playerPrivateActions = privateActionsRef.doc(pid).collection("actions");
      const privateAction = createReceiveCardAction(pid, card);
      await playerPrivateActions.add(privateAction);
    })
  );

  return { success: true };
}


