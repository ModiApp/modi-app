import { CardID } from "./card.types";

// Base action interface
interface BaseGameAction {
  id: string;
  timestamp: FirebaseFirestore.Timestamp;
  playerId: string;
}

// Specific action types
export interface GameStartedAction extends BaseGameAction {
  type: GameActionType.GAME_STARTED;
  initialDealer: string;
}

export interface DealCardsAction extends BaseGameAction {
  type: GameActionType.DEAL_CARDS;
  dealingOrder: string[];
}

export interface SwapCardsAction extends BaseGameAction {
  type: GameActionType.SWAP_CARDS;
  targetPlayerId: string;
}

export interface DealerDrawAction extends BaseGameAction {
  type: GameActionType.DEALER_DRAW;
  previousCard: CardID;
}

export interface StickAction extends BaseGameAction {
  type: GameActionType.STICK;
  isDealer: boolean;
  action: 'dealer-stick' | 'player-stick';
}

export interface RevealCardsAction extends BaseGameAction {
  type: GameActionType.REVEAL_CARDS;
  playerCards: { [playerId: string]: CardID }; // playerId -> cardId
  revealEvent: true;
}

export interface ReceiveCardAction extends BaseGameAction {
  type: GameActionType.RECEIVE_CARD;
  card: CardID;
}

export interface EndRoundAction extends BaseGameAction {
  type: GameActionType.END_ROUND;
  newDealer: string;
}

export interface DeckReshuffleAction extends BaseGameAction {
  type: GameActionType.DECK_RESHUFFLE;
  cardsShuffled: number;
  trigger: 'deck-empty';
}

export interface KungAction extends BaseGameAction {
  type: GameActionType.KUNG;
  playerIdWithKing: string;
  cardId: CardID;
}

export interface PlayerJoinedAction extends BaseGameAction {
  type: GameActionType.PLAYER_JOINED;
  username: string;
  joinEvent: true;
}

export interface PlayerLeftAction extends BaseGameAction {
  type: GameActionType.PLAYER_LEFT;
  username: string;
  leaveEvent: true;
}

export interface TallyingAction extends BaseGameAction {
  type: GameActionType.TALLYING;
  playersLost: string[];
}

// Union type for all actions
export type GameActions = 
  | GameStartedAction
  | DealCardsAction
  | SwapCardsAction
  | DealerDrawAction
  | StickAction
  | RevealCardsAction
  | EndRoundAction
  | DeckReshuffleAction
  | KungAction
  | PlayerJoinedAction
  | PlayerLeftAction
  | ReceiveCardAction
  | TallyingAction;

export type GameAction<T extends GameActionType> = GameActions & { type: T };

export enum GameActionType {
  GAME_STARTED = 'gameStarted',
  DEAL_CARDS = 'dealCards',
  SWAP_CARDS = 'swapCards',
  DEALER_DRAW = 'dealerDraw',
  STICK = 'stick',
  REVEAL_CARDS = 'revealCards',
  END_ROUND = 'endRound',
  DECK_RESHUFFLE = 'deckReshuffle',
  KUNG = 'kung',
  PLAYER_JOINED = 'playerJoined',
  PLAYER_LEFT = 'playerLeft',
  RECEIVE_CARD = 'receiveCard',
  TALLYING = 'tallying',
} 