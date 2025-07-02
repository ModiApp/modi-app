export interface Player {
  id: string;
  name: string;
  card: Card | null; // Each player has only one card at a time
  isHost: boolean;
  isReady: boolean;
  lives: number; // Players start with 3 lives
  isDealer: boolean; // Current dealer for this round
  position: number; // Position around the table (0 = dealer, 1 = left of dealer, etc.)
  hasGoneThisRound: boolean; // Track if player has taken their turn this round
}

export interface Card {
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
  rank: 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';
  value: number; // A=1, 2=2, ..., 10=10, J=11, Q=12, K=13
}

export interface GameState {
  id: string;
  status: 'waiting' | 'highcard' | 'playing' | 'round_end' | 'finished';
  players: { [playerId: string]: Player };
  currentTurn: string | null; // player ID whose turn it is
  dealer: string | null; // player ID who is the dealer
  roundNumber: number;
  gameNumber: number; // For tracking double/triple games
  deck: Card[];
  trashPile: Card[];
  gameStartTime: number;
  lastActionTime: number;
  winner: string | null;
  
  // Round-specific state
  roundState: {
    phase: 'dealing' | 'playing' | 'showing' | 'scoring';
    highcardRound: boolean; // true if this is the initial highcard determination
    cardsDealt: boolean;
    roundComplete: boolean;
  };
  
  // Special notifications
  notifications: {
    modi: string | null; // player ID who got modi'd
    dirtyDan: string | null; // player ID who got dirty dan'd
    kung: string | null; // player ID who got kung'd
  };
}

export interface GameAction {
  type: 'JOIN_GAME' | 'LEAVE_GAME' | 'START_GAME' | 'PLAY_HIGHCARD' | 'DEAL_CARDS' | 'STICK' | 'SWAP' | 'DEALER_DRAW' | 'END_ROUND' | 'END_GAME';
  playerId: string;
  data?: any;
}

export interface GameSettings {
  maxPlayers: number;
  startingLives: number; // Default 3
  allowSpectators: boolean;
}

export interface SwapResult {
  success: boolean;
  modi: boolean; // true if swapper got a lower card
  dirtyDan: boolean; // true if cards were same rank
  kung: boolean; // true if target had king
  swappedCard?: Card; // the card that was swapped (for notifications)
} 