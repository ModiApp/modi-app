import { CardID } from "./card.types";
export * from "./card.types";

interface GameBase {
  gameId: string;
  players: string[];
  host: string;
  usernames: { [playerId: string]: string };
  initialLives: number;
}

export interface InitialGame extends GameBase {
  status: 'gathering-players';
}

export interface ActiveGame extends GameBase {
  status: 'active';
  playerLives: { [playerId: string]: number };
  dealer: string;
  round: number;
  activePlayer: string;
  roundState: 'pre-deal' | 'playing' | 'tallying';
}

export interface EndedGame extends Omit<ActiveGame, 'status' | 'dealer' | 'activePlayer'> {
  status: 'ended';
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
  return game.status === 'gathering-players';
}

export function isActive(game: Game): game is ActiveGame {
  return game.status === 'active';
}

export function isEnded(game: Game): game is EndedGame {
  return game.status === 'ended';
}