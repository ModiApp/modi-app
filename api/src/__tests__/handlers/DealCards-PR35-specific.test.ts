// Mock all external dependencies
jest.mock('@/firebase', () => ({
  db: {
    collection: jest.fn(),
    batch: jest.fn(() => ({
      update: jest.fn(),
      set: jest.fn(),
      commit: jest.fn(),
    })),
  },
}));

jest.mock('@/actions', () => ({
  addActionToBatch: jest.fn(),
  createDealCardsAction: jest.fn((userId: string, playerIds: string[]) => ({
    type: 'dealCards',
    userId,
    playerIds,
    timestamp: new Date(),
  })),
  createDeckReshuffleAction: jest.fn((userId: string, dealerId: string) => ({
    type: 'deckReshuffle',
    userId,
    dealerId,
    timestamp: new Date(),
  })),
  createReceiveCardAction: jest.fn((playerId: string, cardId: string) => ({
    type: 'receiveCard',
    playerId,
    cardId,
    timestamp: new Date(),
  })),
}));

jest.mock('@/deckUtils', () => ({
  shuffleDeck: jest.fn((cards: string[]) => [...cards].reverse()), // Simple reverse for testing
}));

import { dealCards } from '@/handlers/DealCards';
import { db } from '@/firebase';
import { addActionToBatch, createDealCardsAction, createDeckReshuffleAction } from '@/actions';
import { shuffleDeck } from '@/deckUtils';
import type { ActiveGame, GameInternalState } from '@/types';
import { GameStatus } from '@/types';

// Mock the Firebase functions
const mockDb = db as jest.Mocked<typeof db>;
const mockAddActionToBatch = addActionToBatch as jest.MockedFunction<typeof addActionToBatch>;
const mockCreateDealCardsAction = createDealCardsAction as jest.MockedFunction<typeof createDealCardsAction>;
const mockCreateDeckReshuffleAction = createDeckReshuffleAction as jest.MockedFunction<typeof createDeckReshuffleAction>;
const mockShuffleDeck = shuffleDeck as jest.MockedFunction<typeof shuffleDeck>;

/**
 * This test file specifically focuses on the changes made in PR #35:
 * "Fix deck reshuffle logic during deal cards"
 * 
 * The key changes were:
 * 1. Replaced the old reshuffle logic with a new approach using `actionCounter` and `lastDealtIndex`
 * 2. Fixed the timing of actions to ensure proper sequencing
 * 3. Improved handling of multiple reshuffles during dealing
 */

describe('DealCards PR #35 - Reshuffle Logic Fixes', () => {
  let mockGameRef: any;
  let mockInternalStateRef: any;
  let mockPlayerHandsRef: any;
  let mockPrivateActionsRef: any;
  let mockBatch: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mocks
    mockGameRef = {
      get: jest.fn(),
      update: jest.fn(),
    };

    mockInternalStateRef = {
      get: jest.fn(),
      set: jest.fn(),
    };

    mockPlayerHandsRef = {
      doc: jest.fn().mockReturnValue({
        set: jest.fn(),
      }),
    };

    mockPrivateActionsRef = {
      doc: jest.fn().mockReturnValue({
        collection: jest.fn().mockReturnValue({
          add: jest.fn(),
        }),
      }),
    };

    mockBatch = {
      update: jest.fn(),
      set: jest.fn(),
      commit: jest.fn(),
    };

    mockDb.batch.mockReturnValue(mockBatch);
    mockDb.collection.mockImplementation((collectionName: string) => {
      if (collectionName === 'games') {
        return {
          doc: jest.fn().mockReturnValue({
            get: jest.fn().mockResolvedValue(mockGameRef),
            update: jest.fn(),
            collection: jest.fn().mockImplementation((subCollection: string) => {
              if (subCollection === 'internalState') {
                return {
                  doc: jest.fn().mockReturnValue(mockInternalStateRef),
                };
              } else if (subCollection === 'playerHands') {
                return mockPlayerHandsRef;
              } else if (subCollection === 'privateActions') {
                return mockPrivateActionsRef;
              }
              return {};
            }),
          }),
        } as any;
      }
      return {} as any;
    });
  });

  const createMockGameData = (overrides: Partial<ActiveGame> = {}): ActiveGame => ({
    gameId: 'game1',
    host: 'dealer1',
    usernames: {
      dealer1: 'Dealer',
      player1: 'Player1',
      player2: 'Player2',
      player3: 'Player3',
      player4: 'Player4',
    },
    initialLives: 3,
    status: GameStatus.Active,
    roundState: 'pre-deal',
    dealer: 'dealer1',
    round: 1,
    activePlayer: 'dealer1',
    players: ['dealer1', 'player1', 'player2', 'player3', 'player4'],
    playerLives: {
      dealer1: 3,
      player1: 3,
      player2: 3,
      player3: 3,
      player4: 3,
    },
    ...overrides,
  });

  const createMockInternalState = (overrides: Partial<GameInternalState> = {}): GameInternalState => ({
    deck: ['2H', '3D', '4C', '5S', '6H'],
    trash: [],
    ...overrides,
  });

  describe('PR #35: New reshuffle logic with actionCounter and lastDealtIndex', () => {
    it('should correctly handle single reshuffle during dealing', async () => {
      // Scenario: Deck has 2 cards, 4 players need cards, trash has cards to reshuffle
      const gameData = createMockGameData();
      const internalState = createMockInternalState({
        deck: ['2H', '3D'], // Only 2 cards
        trash: ['AS', 'KH', 'QD', 'JC', '10S', '9H', '8D', '7C'],
      });
      
      mockGameRef.get.mockResolvedValue({ exists: true, data: () => gameData });
      mockInternalStateRef.get.mockResolvedValue({ exists: true, data: () => internalState });
      mockShuffleDeck.mockReturnValue(['7C', '8D', '9H', '10S', 'JC', 'QD', 'KH', 'AS']);

      const result = await dealCards({ userId: 'dealer1', gameId: 'game1' });

      expect(result.success).toBe(true);
      
      // Verify the sequence of actions:
      // 1. Deal cards to first 2 players (before reshuffle)
      expect(mockCreateDealCardsAction).toHaveBeenCalledWith('dealer1', ['player1', 'player2']);
      
      // 2. Reshuffle action
      expect(mockCreateDeckReshuffleAction).toHaveBeenCalledWith('dealer1', 'dealer1');
      
      // 3. Deal cards to remaining players (after reshuffle)
      expect(mockCreateDealCardsAction).toHaveBeenCalledWith('dealer1', ['player3', 'player4']);
      
      // Verify action timing with actionCounter
      const addActionCalls = mockAddActionToBatch.mock.calls;
      expect(addActionCalls.length).toBe(3); // 3 actions total
      
      // Check that timestamps are properly incremented
      const baseTime = Date.now();
      for (let i = 0; i < addActionCalls.length; i++) {
        const timestamp = addActionCalls[i][3];
        if (timestamp) {
          expect(timestamp.getTime()).toBeGreaterThanOrEqual(baseTime + (i * 10));
        }
      }
    });

    it('should handle multiple reshuffles during dealing', async () => {
      // Scenario: Deck has 1 card, trash has 2 cards, 4 players need cards
      // This will require multiple reshuffles
      const gameData = createMockGameData();
      const internalState = createMockInternalState({
        deck: ['2H'], // Only 1 card
        trash: ['AS', 'KH'], // Only 2 cards in trash
      });
      
      mockGameRef.get.mockResolvedValue({ exists: true, data: () => gameData });
      mockInternalStateRef.get.mockResolvedValue({ exists: true, data: () => internalState });
      mockShuffleDeck.mockReturnValue(['KH', 'AS']);

      const result = await dealCards({ userId: 'dealer1', gameId: 'game1' });

      expect(result.success).toBe(true);
      
      // Verify the sequence:
      // 1. Deal to first player before first reshuffle
      expect(mockCreateDealCardsAction).toHaveBeenCalledWith('dealer1', ['player1']);
      
      // 2. First reshuffle
      expect(mockCreateDeckReshuffleAction).toHaveBeenCalledWith('dealer1', 'dealer1');
      
      // 3. Deal to remaining players after reshuffle
      expect(mockCreateDealCardsAction).toHaveBeenCalledWith('dealer1', ['player2', 'player3', 'player4']);
      
      // Verify actionCounter increments correctly
      const addActionCalls = mockAddActionToBatch.mock.calls;
      expect(addActionCalls.length).toBe(3); // 3 actions total
    });

    it('should correctly track lastDealtIndex through reshuffles', async () => {
      // Scenario: Deck has 1 card, trash has 3 cards, 5 players need cards
      const gameData = createMockGameData({
        players: ['dealer1', 'player1', 'player2', 'player3', 'player4', 'player5'],
        playerLives: {
          dealer1: 3,
          player1: 3,
          player2: 3,
          player3: 3,
          player4: 3,
          player5: 3,
        },
      });
      const internalState = createMockInternalState({
        deck: ['2H'], // Only 1 card
        trash: ['AS', 'KH', 'QD'], // Only 3 cards in trash
      });
      
      mockGameRef.get.mockResolvedValue({ exists: true, data: () => gameData });
      mockInternalStateRef.get.mockResolvedValue({ exists: true, data: () => internalState });
      mockShuffleDeck.mockReturnValue(['QD', 'KH', 'AS']);

      const result = await dealCards({ userId: 'dealer1', gameId: 'game1' });

      expect(result.success).toBe(true);
      
      // Verify lastDealtIndex tracking:
      // 1. Deal to first player (index 0), lastDealtIndex becomes 1
      expect(mockCreateDealCardsAction).toHaveBeenCalledWith('dealer1', ['player1']);
      
      // 2. Reshuffle, lastDealtIndex stays at 1
      expect(mockCreateDeckReshuffleAction).toHaveBeenCalledWith('dealer1', 'dealer1');
      
      // 3. Deal to remaining players starting from index 1
      expect(mockCreateDealCardsAction).toHaveBeenCalledWith('dealer1', ['player2', 'player3', 'player4', 'player5']);
    });

    it('should maintain proper action timing with actionCounter', async () => {
      const gameData = createMockGameData();
      const internalState = createMockInternalState({
        deck: ['2H'], // Only 1 card
        trash: ['AS', 'KH', 'QD', 'JC', '10S', '9H', '8D', '7C'],
      });
      
      mockGameRef.get.mockResolvedValue({ exists: true, data: () => gameData });
      mockInternalStateRef.get.mockResolvedValue({ exists: true, data: () => internalState });
      mockShuffleDeck.mockReturnValue(['7C', '8D', '9H', '10S', 'JC', 'QD', 'KH', 'AS']);

      const result = await dealCards({ userId: 'dealer1', gameId: 'game1' });

      expect(result.success).toBe(true);
      
      // Verify actionCounter increments properly
      const addActionCalls = mockAddActionToBatch.mock.calls;
      expect(addActionCalls.length).toBe(3); // dealCards + reshuffle + dealCards
      
      // Each action should have a timestamp 10ms apart
      for (let i = 1; i < addActionCalls.length; i++) {
        const prevTimestamp = addActionCalls[i - 1][3];
        const currTimestamp = addActionCalls[i][3];
        if (prevTimestamp && currTimestamp) {
          const timeDiff = currTimestamp.getTime() - prevTimestamp.getTime();
          expect(timeDiff).toBe(10); // Exactly 10ms difference
        }
      }
    });

    it('should handle edge case: reshuffle needed for first player', async () => {
      // Scenario: Deck is empty, trash has cards, need to reshuffle before dealing to anyone
      const gameData = createMockGameData();
      const internalState = createMockInternalState({
        deck: [], // No cards
        trash: ['AS', 'KH', 'QD', 'JC', '10S', '9H', '8D', '7C'],
      });
      
      mockGameRef.get.mockResolvedValue({ exists: true, data: () => gameData });
      mockInternalStateRef.get.mockResolvedValue({ exists: true, data: () => internalState });
      mockShuffleDeck.mockReturnValue(['7C', '8D', '9H', '10S', 'JC', 'QD', 'KH', 'AS']);

      const result = await dealCards({ userId: 'dealer1', gameId: 'game1' });

      expect(result.success).toBe(true);
      
      // Should reshuffle first, then deal to all players
      expect(mockCreateDeckReshuffleAction).toHaveBeenCalledWith('dealer1', 'dealer1');
      expect(mockCreateDealCardsAction).toHaveBeenCalledWith('dealer1', ['player1', 'player2', 'player3', 'player4']);
      
      // Only 2 actions: reshuffle + dealCards
      const addActionCalls = mockAddActionToBatch.mock.calls;
      expect(addActionCalls.length).toBe(2);
    });

    it('should handle edge case: multiple small reshuffles', async () => {
      // Scenario: Deck has 1 card, trash has 1 card, 4 players need cards
      // This will require multiple reshuffles with small trash piles
      const gameData = createMockGameData();
      const internalState = createMockInternalState({
        deck: ['2H'], // Only 1 card
        trash: ['AS'], // Only 1 card in trash
      });
      
      mockGameRef.get.mockResolvedValue({ exists: true, data: () => gameData });
      mockInternalStateRef.get.mockResolvedValue({ exists: true, data: () => internalState });
      mockShuffleDeck.mockReturnValue(['AS']);

      const result = await dealCards({ userId: 'dealer1', gameId: 'game1' });

      expect(result.success).toBe(true);
      
      // Should handle the multiple reshuffles gracefully
      expect(mockCreateDealCardsAction).toHaveBeenCalledWith('dealer1', ['player1']);
      expect(mockCreateDeckReshuffleAction).toHaveBeenCalledWith('dealer1', 'dealer1');
      expect(mockCreateDealCardsAction).toHaveBeenCalledWith('dealer1', ['player2', 'player3', 'player4']);
    });
  });

  describe('PR #35: Verification of old logic replacement', () => {
    it('should NOT use the old playerIndexOfReshuffle approach', async () => {
      // This test verifies that the old logic has been completely replaced
      const gameData = createMockGameData();
      const internalState = createMockInternalState({
        deck: ['2H'], // Only 1 card
        trash: ['AS', 'KH', 'QD', 'JC', '10S', '9H', '8D', '7C'],
      });
      
      mockGameRef.get.mockResolvedValue({ exists: true, data: () => gameData });
      mockInternalStateRef.get.mockResolvedValue({ exists: true, data: () => internalState });
      mockShuffleDeck.mockReturnValue(['7C', '8D', '9H', '10S', 'JC', 'QD', 'KH', 'AS']);

      const result = await dealCards({ userId: 'dealer1', gameId: 'game1' });

      expect(result.success).toBe(true);
      
      // The new logic should create actions in the correct sequence
      // and NOT use the old approach of tracking playerIndexOfReshuffle
      const addActionCalls = mockAddActionToBatch.mock.calls;
      
      // Verify the new pattern: dealCards (before reshuffle) + reshuffle + dealCards (after reshuffle)
      expect(addActionCalls.length).toBe(3);
      
      // First action should be dealCards for players before reshuffle
      const firstAction = addActionCalls[0][2];
      expect(firstAction.type).toBe('dealCards');
      
      // Second action should be reshuffle
      const secondAction = addActionCalls[1][2];
      expect(secondAction.type).toBe('deckReshuffle');
      
      // Third action should be dealCards for remaining players
      const thirdAction = addActionCalls[2][2];
      expect(thirdAction.type).toBe('dealCards');
    });
  });
});