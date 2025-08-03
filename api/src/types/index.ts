import type { CardID } from "./card.types";
export * from "./card.types";

interface GameBase {
  gameId: string;
  players: string[];
  host: string;
  usernames: { [playerId: string]: string };
  initialLives: number;
}

export const test = 'test';

export enum GameStatus {
  GatheringPlayers = 'gathering-players',
  Active = 'active',
  Ended = 'ended',
}

export interface InitialGame extends GameBase {
  status: GameStatus.GatheringPlayers;
}

export interface ActiveGame extends GameBase {
  status: GameStatus.Active;
  playerLives: { [playerId: string]: number };
  dealer: string;
  round: number;
  activePlayer: string;
  roundState: 'pre-deal' | 'playing' | 'tallying';
}

export interface EndedGame extends Omit<ActiveGame, 'status' | 'dealer' | 'activePlayer'> {
  status: GameStatus.Ended;
  winners: string[];
  dealer: null;
  activePlayer: null;
}

// Separate document for internal game state (deck, trash)
export interface GameInternalState {
  deck: CardID[];
  trash: CardID[];
}

// Separate document for each player's hand
export interface PlayerHand {
  card: CardID | null;
  playerId: string;
}



export type Game = InitialGame | ActiveGame | EndedGame;

export function isWaitingForPlayers(game: Game): game is InitialGame {
  return game.status === GameStatus.GatheringPlayers;
}

export function isActive(game: Game): game is ActiveGame {
  return game.status === GameStatus.Active;
}

export function isEnded(game: Game): game is EndedGame {
  return game.status === GameStatus.Ended;
}