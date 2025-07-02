import { get, off, onValue, push, ref, remove, serverTimestamp, set } from 'firebase/database';
import { database } from '../config/firebase';
import { GameAction, GameSettings, GameState, Player } from '../types/_game';
import { initializeGame } from '../utils/gameLogic';

// Game database references
const gamesRef = ref(database, 'games');
const actionsRef = ref(database, 'gameActions');

// Generate a simple 4-digit game ID
const generateGameId = (): string => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

// Check if a game ID is already in use
const isGameIdAvailable = async (gameId: string): Promise<boolean> => {
  const gameRef = ref(database, `games/${gameId}`);
  const snapshot = await get(gameRef);
  return !snapshot.exists();
};

// Create a new game
export const createGame = async (settings: GameSettings): Promise<string> => {
  // Generate a unique 4-digit game ID
  let gameId: string;
  let attempts = 0;
  const maxAttempts = 10;
  
  do {
    gameId = generateGameId();
    attempts++;
    
    if (attempts > maxAttempts) {
      throw new Error('Unable to generate unique game ID. Please try again.');
    }
  } while (!(await isGameIdAvailable(gameId)));
  
  const gameRef = ref(database, `games/${gameId}`);
  const gameState = initializeGame(gameId, settings);
  
  await set(gameRef, {
    ...gameState,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  
  return gameId;
};

// Join a game
export const joinGame = async (gameId: string, player: Omit<Player, 'card' | 'lives' | 'isDealer' | 'position' | 'hasGoneThisRound'>): Promise<void> => {
  const gameRef = ref(database, `games/${gameId}`);
  const gameSnapshot = await get(gameRef);
  
  if (!gameSnapshot.exists()) {
    throw new Error('Game not found');
  }
  
  const gameState: GameState = gameSnapshot.val();
  
  if (gameState.status !== 'waiting') {
    throw new Error('Game has already started');
  }
  
  if (Object.keys(gameState.players).length >= 8) { // Max 8 players
    throw new Error('Game is full');
  }
  
  const newPlayer: Player = {
    ...player,
    card: null,
    lives: 3, // Default starting lives
    isDealer: false,
    position: 0,
    hasGoneThisRound: false
  };
  
  await set(ref(database, `games/${gameId}/players/${player.id}`), newPlayer);
  await set(ref(database, `games/${gameId}/updatedAt`), serverTimestamp());
};

// Leave a game
export const leaveGame = async (gameId: string, playerId: string): Promise<void> => {
  await remove(ref(database, `games/${gameId}/players/${playerId}`));
  await set(ref(database, `games/${gameId}/updatedAt`), serverTimestamp());
};

// Start a game (begins highcard round)
export const startGame = async (gameId: string, hostId: string): Promise<void> => {
  const gameRef = ref(database, `games/${gameId}`);
  const gameSnapshot = await get(gameRef);
  
  if (!gameSnapshot.exists()) {
    throw new Error('Game not found');
  }
  
  const gameState: GameState = gameSnapshot.val();
  
  if (gameState.players[hostId]?.isHost !== true) {
    throw new Error('Only the host can start the game');
  }
  
  if (Object.keys(gameState.players).length < 2) {
    throw new Error('Need at least 2 players to start');
  }
  
  // This will be handled by Cloud Functions
  await push(actionsRef, {
    gameId,
    type: 'START_GAME',
    playerId: hostId,
    timestamp: serverTimestamp()
  });
};

// Play highcard (for initial dealer determination)
export const playHighcard = async (gameId: string, playerId: string): Promise<void> => {
  await push(actionsRef, {
    gameId,
    type: 'PLAY_HIGHCARD',
    playerId,
    timestamp: serverTimestamp()
  });
};

// Deal cards for a round
export const dealCards = async (gameId: string, dealerId: string): Promise<void> => {
  await push(actionsRef, {
    gameId,
    type: 'DEAL_CARDS',
    playerId: dealerId,
    timestamp: serverTimestamp()
  });
};

// Stick action (keep current card)
export const stick = async (gameId: string, playerId: string): Promise<void> => {
  await push(actionsRef, {
    gameId,
    type: 'STICK',
    playerId,
    timestamp: serverTimestamp()
  });
};

// Swap action (swap with player to the left)
export const swap = async (gameId: string, playerId: string): Promise<void> => {
  await push(actionsRef, {
    gameId,
    type: 'SWAP',
    playerId,
    timestamp: serverTimestamp()
  });
};

// Dealer draw action (dealer draws from deck)
export const dealerDraw = async (gameId: string, dealerId: string): Promise<void> => {
  await push(actionsRef, {
    gameId,
    type: 'DEALER_DRAW',
    playerId: dealerId,
    timestamp: serverTimestamp()
  });
};

// End round (show cards and calculate lives lost)
export const endRound = async (gameId: string, playerId: string): Promise<void> => {
  await push(actionsRef, {
    gameId,
    type: 'END_ROUND',
    playerId,
    timestamp: serverTimestamp()
  });
};

// Subscribe to game state changes
export const subscribeToGame = (gameId: string, callback: (gameState: GameState | null) => void): () => void => {
  const gameRef = ref(database, `games/${gameId}`);
  
  const unsubscribe = onValue(gameRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val());
    } else {
      callback(null);
    }
  });
  
  return () => {
    off(gameRef);
    unsubscribe();
  };
};

// Subscribe to game actions
export const subscribeToGameActions = (gameId: string, callback: (action: GameAction) => void): () => void => {
  const actionsQuery = ref(database, 'gameActions');
  
  const unsubscribe = onValue(actionsQuery, (snapshot) => {
    if (snapshot.exists()) {
      const actions = snapshot.val();
      Object.values(actions).forEach((action: any) => {
        if (action.gameId === gameId) {
          callback(action);
        }
      });
    }
  });
  
  return () => {
    off(actionsQuery);
    unsubscribe();
  };
};

// Get current game state
export const getGameState = async (gameId: string): Promise<GameState | null> => {
  const gameRef = ref(database, `games/${gameId}`);
  const snapshot = await get(gameRef);
  
  if (snapshot.exists()) {
    return snapshot.val();
  }
  
  return null;
};

// Update player ready status
export const updatePlayerReady = async (gameId: string, playerId: string, isReady: boolean): Promise<void> => {
  await set(ref(database, `games/${gameId}/players/${playerId}/isReady`), isReady);
  await set(ref(database, `games/${gameId}/updatedAt`), serverTimestamp());
}; 