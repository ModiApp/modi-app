// Test utilities for Firebase Cloud Functions experimentation

// Card generation utilities for test setup
export const generateTestDeck = (): string[] => {
  const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
  const ranks = ['ace', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'jack', 'queen', 'king'];
  
  const deck: string[] = [];
  for (const suit of suits) {
    for (const rank of ranks) {
      deck.push(`${rank}_of_${suit}`);
    }
  }
  
  return deck;
};

export const shuffleTestDeck = (deck: string[]): string[] => {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const cardIdentifierToCard = (identifier: string): { suit: string; rank: string; value: number } => {
  const [rank, of, suit] = identifier.split('_');
  
  const rankMap: { [key: string]: { rank: string; value: number } } = {
    'ace': { rank: 'A', value: 1 },
    'two': { rank: '2', value: 2 },
    'three': { rank: '3', value: 3 },
    'four': { rank: '4', value: 4 },
    'five': { rank: '5', value: 5 },
    'six': { rank: '6', value: 6 },
    'seven': { rank: '7', value: 7 },
    'eight': { rank: '8', value: 8 },
    'nine': { rank: '9', value: 9 },
    'ten': { rank: '10', value: 10 },
    'jack': { rank: 'J', value: 11 },
    'queen': { rank: 'Q', value: 12 },
    'king': { rank: 'K', value: 13 }
  };
  
  return {
    suit,
    rank: rankMap[rank].rank,
    value: rankMap[rank].value
  };
};

// Test game constants
export const TEST_GAME_ID = 'test-game-123';
export const TEST_PLAYER_1_ID = 'test-player-1';
export const TEST_PLAYER_2_ID = 'test-player-2';

// Mock test game data
export const createTestGameData = () => ({
  id: TEST_GAME_ID,
  deck: shuffleTestDeck(generateTestDeck()),
  players: {
    [TEST_PLAYER_1_ID]: {
      id: TEST_PLAYER_1_ID,
      name: 'Test Player 1',
      card: null,
      isHost: true,
      isReady: true,
      lives: 3,
      isDealer: false,
      position: 0,
      hasGoneThisRound: false
    },
    [TEST_PLAYER_2_ID]: {
      id: TEST_PLAYER_2_ID,
      name: 'Test Player 2',
      card: null,
      isHost: false,
      isReady: true,
      lives: 3,
      isDealer: false,
      position: 1,
      hasGoneThisRound: false
    }
  },
  currentPlayer: TEST_PLAYER_1_ID,
  lastActionTime: Date.now()
}); 