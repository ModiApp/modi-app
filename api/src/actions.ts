import { db } from "@/firebase";
import type {
    DealCardsAction,
    DealerDrawAction,
    DeckReshuffleAction,
    EndRoundAction,
    GameActions,
    GameActionType,
    GameStartedAction,
    KungAction,
    PlayerJoinedAction,
    PlayerLeftAction,
    ReceiveCardAction,
    RevealCardsAction,
    StickAction,
    TallyingAction,
} from "@/types/actions.types";
import type { CardID } from "@/types/card.types";

export async function createAndStoreAction(
  gameId: string,
  action: Omit<GameActions, "id" | "timestamp">
): Promise<string> {
  const actionId = generateActionId();
  const timestamp = new Date();

  const gameAction: GameActions = {
    ...action,
    id: actionId,
    timestamp: timestamp as any,
  } as GameActions;

  const batch = db.batch();
  const actionRef = db.collection("games").doc(gameId).collection("actions").doc(actionId);
  batch.set(actionRef, gameAction);
  await batch.commit();

  return actionId;
}

export function addActionToBatch(
  batch: FirebaseFirestore.WriteBatch,
  gameId: string,
  action: Omit<GameActions, "id" | "timestamp">,
  timestamp?: Date
): string {
  const actionId = generateActionId();
  const actionTimestamp = timestamp || new Date();

  const gameAction: GameActions = {
    ...action,
    id: actionId,
    timestamp: actionTimestamp as any,
  } as GameActions;

  const actionRef = db.collection("games").doc(gameId).collection("actions").doc(actionId);
  batch.set(actionRef, gameAction);
  return actionId;
}

function generateActionId() {
  return `action_${Date.now()}_${Math.random().toString(36).slice(2, 9)}` as const;
}

export function createDealCardsAction(
  dealerId: string,
  dealingOrder: string[]
): Omit<DealCardsAction, "id" | "timestamp"> {
  return { type: GameActionType.DEAL_CARDS, playerId: dealerId, dealingOrder };
}

export function createSwapCardsAction(
  playerId: string,
  targetPlayerId: string,
  isDealerDraw: boolean = false,
  previousCard?: CardID
): Omit<SwapCardsAction | DealerDrawAction, "id" | "timestamp"> {
  if (isDealerDraw) {
    if (!previousCard) throw new Error("previousCard is required for dealer draw actions");
    return { type: GameActionType.DEALER_DRAW, playerId, previousCard } as Omit<
      DealerDrawAction,
      "id" | "timestamp"
    >;
  }
  return { type: GameActionType.SWAP_CARDS, playerId, targetPlayerId } as Omit<
    SwapCardsAction,
    "id" | "timestamp"
  >;
}

export function createStickAction(
  playerId: string,
  isDealer: boolean
): Omit<StickAction, "id" | "timestamp"> {
  return { type: GameActionType.STICK, playerId, isDealer, action: isDealer ? "dealer-stick" : "player-stick" };
}

export function createEndRoundAction(
  dealerId: string,
  newDealer: string
): Omit<EndRoundAction, "id" | "timestamp"> {
  return { type: GameActionType.END_ROUND, playerId: dealerId, newDealer };
}

export function createDeckReshuffleAction(
  triggerPlayerId: string,
  currentDealer: string
): Omit<DeckReshuffleAction, "id" | "timestamp"> {
  return { type: GameActionType.DECK_RESHUFFLE, playerId: triggerPlayerId, currentDealer };
}

export function createKungAction(
  playerId: string,
  playerIdWithKing: string,
  cardId: CardID
): Omit<KungAction, "id" | "timestamp"> {
  return { type: GameActionType.KUNG, playerId, playerIdWithKing, cardId };
}

export function createGameStartedAction(
  hostId: string,
  initialDealer: string
): Omit<GameStartedAction, "id" | "timestamp"> {
  return { type: GameActionType.GAME_STARTED, playerId: hostId, initialDealer };
}

export function createPlayerJoinedAction(
  playerId: string,
  username: string
): Omit<PlayerJoinedAction, "id" | "timestamp"> {
  return { type: GameActionType.PLAYER_JOINED, playerId, username, joinEvent: true };
}

export function createRevealCardsAction(
  dealerId: string,
  playerCards: { [playerId: string]: CardID }
): Omit<RevealCardsAction, "id" | "timestamp"> {
  return { type: GameActionType.REVEAL_CARDS, playerId: dealerId, playerCards, revealEvent: true };
}

export function createPlayerLeftAction(
  playerId: string,
  username: string
): Omit<PlayerLeftAction, "id" | "timestamp"> {
  return { type: GameActionType.PLAYER_LEFT, playerId, username, leaveEvent: true };
}

export function createReceiveCardAction(playerId: string, card: CardID): ReceiveCardAction {
  return {
    id: `private-${generateActionId()}`,
    type: GameActionType.RECEIVE_CARD,
    playerId,
    card,
    timestamp: new Date() as any,
  };
}

export function createTallyingAction(
  playerId: string,
  playersLost: string[]
): Omit<TallyingAction, "id" | "timestamp"> {
  return { type: GameActionType.TALLYING, playerId, playersLost };
}


