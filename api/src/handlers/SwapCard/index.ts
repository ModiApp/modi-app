import { addActionToBatch, createDeckReshuffleAction, createKungAction, createReceiveCardAction, createRevealCardsAction, createSwapCardsAction, createTallyingAction } from "@/actions";
import type { AuthenticatedRequest } from "@/authenticate";
import { shuffleDeck } from "@/deckUtils";
import { db } from "@/firebase";
import type { ActiveGame, CardID, GameInternalState } from "@/types";
import { calculatePlayersLost } from "@/util";

export interface SwapCardRequest extends AuthenticatedRequest {}
export interface SwapCardResponse { success: boolean }

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

export async function swapCard({ userId }: SwapCardRequest): Promise<SwapCardResponse> {
  const gamesRef = db.collection("games");
  const activePlayerQuery = gamesRef.where("activePlayer", "==", userId).where("status", "==", "active");
  const snapshot = await activePlayerQuery.get();
  if (snapshot.empty) {
    throw Object.assign(new Error("No active game found where you are the active player"), { status: 404 });
  }
  if (snapshot.size > 1) {
    throw Object.assign(new Error("Multiple active games found where you are active player"), { status: 500 });
  }

  const gameDoc = snapshot.docs[0];
  const gameId = gameDoc.id;
  const gameData = gameDoc.data() as ActiveGame;
  const gameRef = gameDoc.ref;
  if (gameData.status !== "active") {
    throw Object.assign(new Error("Game is not active"), { status: 412 });
  }
  if (gameData.activePlayer !== userId) {
    throw Object.assign(new Error("Only the active player can swap cards"), { status: 403 });
  }
  if (gameData.roundState !== "playing") {
    throw Object.assign(new Error("Cards can only be swapped during playing state"), { status: 412 });
  }

  const internalStateRef = db.collection("games").doc(gameId).collection("internalState").doc("state");
  const internalStateDoc = await internalStateRef.get();
  if (!internalStateDoc.exists) {
    throw Object.assign(new Error("Game internal state not found"), { status: 404 });
  }
  const internalState = internalStateDoc.data() as GameInternalState;

  const currentPlayerHandRef = db.collection("games").doc(gameId).collection("playerHands").doc(userId);
  const currentPlayerHandDoc = await currentPlayerHandRef.get();
  if (!currentPlayerHandDoc.exists) {
    throw Object.assign(new Error("Current player hand not found"), { status: 404 });
  }
  const currentPlayerHand = currentPlayerHandDoc.data() as { card: CardID | null };
  const currentPlayerCard = currentPlayerHand.card;
  if (!currentPlayerCard) {
    throw Object.assign(new Error("Current player has no card to swap"), { status: 412 });
  }
  if (currentPlayerCard.startsWith("K")) {
    throw Object.assign(new Error("Players with Kings cannot swap cards"), { status: 412 });
  }

  let newActivePlayer: string | undefined;
  let updatedInternalState: GameInternalState = internalState;
  let updatedPlayerHands: { [playerId: string]: CardID | null } = {};
  let isDealerDraw = false;
  let isKungEvent = false;
  let nextPlayerCard: CardID | null = null;

  const batch = db.batch();

  if (gameData.dealer === userId) {
    isDealerDraw = true;
    let currentDeck = [...internalState.deck];
    let currentTrash = [...internalState.trash];
    if (currentDeck.length === 0) {
      if (currentTrash.length === 0) {
        throw Object.assign(new Error("No cards left in deck or trash"), { status: 412 });
      }
      const reshuffleAction = createDeckReshuffleAction(userId, gameData.dealer);
      addActionToBatch(batch, gameId, reshuffleAction);
      currentDeck = shuffleDeck(currentTrash);
      currentTrash = [];
    }
    const newCard = currentDeck.pop()!;
    currentTrash.push(currentPlayerCard);
    updatedInternalState = { deck: currentDeck, trash: currentTrash };
    updatedPlayerHands[userId] = newCard;
    await gameRef.update({ roundState: "tallying" });
  } else {
    const nextPlayerId = findNextAlivePlayerToLeft(gameData.players, gameData.playerLives, userId);
    if (!nextPlayerId) {
      throw Object.assign(new Error("No alive players found to swap with"), { status: 412 });
    }
    const nextPlayerHandRef = db.collection("games").doc(gameId).collection("playerHands").doc(nextPlayerId);
    const nextPlayerHandDoc = await nextPlayerHandRef.get();
    if (!nextPlayerHandDoc.exists) {
      throw Object.assign(new Error("Next player hand not found"), { status: 404 });
    }
    const nextPlayerHand = nextPlayerHandDoc.data() as { card: CardID | null };
    if (!nextPlayerHand.card) {
      throw Object.assign(new Error("Next player has no card to swap"), { status: 412 });
    }
    nextPlayerCard = nextPlayerHand.card;
    if (nextPlayerCard.startsWith("K")) {
      newActivePlayer = nextPlayerId;
      updatedInternalState = internalState;
      updatedPlayerHands = {};
      isKungEvent = true;
    } else {
      updatedInternalState = internalState;
      updatedPlayerHands = { [userId]: nextPlayerCard, [nextPlayerId]: currentPlayerCard };
      newActivePlayer = nextPlayerId;
    }
  }

  if (gameData.dealer !== userId && newActivePlayer) {
    batch.update(gameRef, { activePlayer: newActivePlayer });
  }
  if (updatedInternalState !== internalState) {
    batch.set(internalStateRef, updatedInternalState);
  }
  if (Object.keys(updatedPlayerHands).length > 0) {
    const playerHandsRef = db.collection("games").doc(gameId).collection("playerHands");
    Object.entries(updatedPlayerHands).forEach(([pid, card]) => {
      batch.set(playerHandsRef.doc(pid), { card });
    });
  }

  if (isDealerDraw) {
    const dealerDrawAction = createSwapCardsAction(userId, "", true, currentPlayerCard);
    addActionToBatch(batch, gameId, dealerDrawAction);
    const playerHandsRef = db.collection("games").doc(gameId).collection("playerHands");
    const playerHandsSnapshot = await playerHandsRef.get();
    if (!playerHandsSnapshot.empty) {
      const playerCards: { [playerId: string]: CardID } = {};
      playerHandsSnapshot.forEach((doc) => {
        const pid = doc.id;
        const handData = doc.data() as { card: CardID | null };
        if (gameData.playerLives[pid] > 0) {
          const card = pid in updatedPlayerHands ? updatedPlayerHands[pid] : handData.card;
          if (card) playerCards[pid] = card;
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
  } else if (isKungEvent) {
    const kungAction = createKungAction(userId, newActivePlayer!, nextPlayerCard!);
    addActionToBatch(batch, gameId, kungAction);
  } else {
    const swapAction = createSwapCardsAction(userId, newActivePlayer!);
    addActionToBatch(batch, gameId, swapAction);
  }

  await batch.commit();

  const privateActionsRef = db.collection("games").doc(gameId).collection("privateActions");
  await Promise.all(
    Object.entries(updatedPlayerHands).map(async ([pid, card]) => {
      if (card) {
        const playerPrivateActions = privateActionsRef.doc(pid).collection("actions");
        const privateAction = createReceiveCardAction(pid, card);
        await playerPrivateActions.add(privateAction);
      }
    })
  );

  return { success: true };
}


