export type InitialGameState = {
  gameId: string;
  gameState: 'gathering-players';
  players: string[];
  host: string;
}

export type Game = InitialGameState;