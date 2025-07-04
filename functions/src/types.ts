export type InitialGameState = {
  gameId: string;
  gameState: 'gathering-players';
  players: string[];
  host: string;
  playerInfo: { [playerId: string]: { username: string } };
}

export type Game = InitialGameState;

export type UserGameParticipation = {
  gameId: string;
  joinedAt: Date;
  isHost: boolean;
}