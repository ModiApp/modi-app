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

describe('DealCards Handler', () => {
  let mockGameRef: any;
  let mockInternalStateRef: any;
  let mockPlayerHandsRef: any;
  let mockPrivateActionsRef: any;
  let mockBatch: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset mocks
    mockDb.collection.mockReturnValue({
      doc: jest.fn().mockReturnValue({
        get: jest.fn(),
        update: jest.fn(),
        set: jest.fn(),
        collection: jest.fn(),
      }),
    } as any);

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
    },
    initialLives: 3,
    status: GameStatus.Active,
    roundState: 'pre-deal',
    dealer: 'dealer1',
    round: 1,
    activePlayer: 'dealer1',
    players: ['dealer1', 'player1', 'player2', 'player3'],
    playerLives: {
      dealer1: 3,
      player1: 3,
      player2: 3,
      player3: 3,
    },
    ...overrides,
  });

  const createMockInternalState = (overrides: Partial<GameInternalState> = {}): GameInternalState => ({
    deck: ['2H', '3D', '4C', '5S', '6H', '7D', '8C', '9S'],
    trash: [],
    ...overrides,
  });

  describe('Basic functionality', () => {
    it('should deal cards to all players when deck has enough cards', async () => {
      const gameData = createMockGameData();
      const internalState = createMockInternalState();
      
      mockGameRef.get.mockResolvedValue({ exists: true, data: () => gameData });
      mockInternalStateRef.get.mockResolvedValue({ exists: true, data: () => internalState });

      const result = await dealCards({ userId: 'dealer1', gameId: 'game1' });

      expect(result.success).toBe(true);
      expect(mockBatch.update).toHaveBeenCalledWith(
        expect.anything(),
        { roundState: 'playing', activePlayer: 'player1' }
      );
      expect(mockBatch.set).toHaveBeenCalledWith(
        expect.anything(),
        { deck: ['2H', '3D', '4C'], trash: [] }
      );
    });

    it('should throw error if game is not found', async () => {
      mockGameRef.get.mockResolvedValue({ exists: false });

      await expect(dealCards({ userId: 'dealer1', gameId: 'nonexistent' }))
        .rejects.toThrow('Game not found');
    });

    it('should throw error if game is not active', async () => {
      const gameData = {
        gameId: 'game1',
        host: 'dealer1',
        usernames: {
          dealer1: 'Dealer',
          player1: 'Player1',
          player2: 'Player2',
          player3: 'Player3',
        },
        initialLives: 3,
        status: GameStatus.Ended,
        roundState: 'playing',
        dealer: null,
        round: 1,
        activePlayer: null,
        players: ['dealer1', 'player1', 'player2', 'player3'],
        playerLives: {
          dealer1: 3,
          player1: 3,
          player2: 3,
          player3: 3,
        },
        winners: ['player1'],
      };
      mockGameRef.get.mockResolvedValue({ exists: true, data: () => gameData });

      await expect(dealCards({ userId: 'dealer1', gameId: 'game1' }))
        .rejects.toThrow('Game is not active');
    });

    it('should throw error if user is not the dealer', async () => {
      const gameData = createMockGameData();
      mockGameRef.get.mockResolvedValue({ exists: true, data: () => gameData });

      await expect(dealCards({ userId: 'player1', gameId: 'game1' }))
        .rejects.toThrow('Only the dealer can deal cards');
    });

    it('should throw error if round state is not pre-deal', async () => {
      const gameData = createMockGameData({ roundState: 'playing' });
      mockGameRef.get.mockResolvedValue({ exists: true, data: () => gameData });

      await expect(dealCards({ userId: 'dealer1', gameId: 'game1' }))
        .rejects.toThrow('Cards can only be dealt in pre-deal state');
    });
  });

  describe('Reshuffle logic (PR #35 changes)', () => {
    it('should reshuffle trash into deck when deck runs out during dealing', async () => {
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
      expect(mockShuffleDeck).toHaveBeenCalledWith(['trash1', 'trash2', 'trash3', 'trash4', 'trash5', 'trash6', 'trash7', 'trash8']);
      
      // Should create a reshuffle action
      expect(mockCreateDeckReshuffleAction).toHaveBeenCalledWith('dealer1', 'dealer1');
      expect(mockAddActionToBatch).toHaveBeenCalledWith(
        expect.anything(),
        'game1',
        expect.objectContaining({ type: 'deckReshuffle' }),
        expect.any(Date)
      );
    });

    it('should create deal cards action for players dealt before reshuffle', async () => {
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
      
      // Should create deal cards action for the first player before reshuffle
      expect(mockCreateDealCardsAction).toHaveBeenCalledWith('dealer1', ['player1']);
      expect(mockAddActionToBatch).toHaveBeenCalledWith(
        expect.anything(),
        'game1',
        expect.objectContaining({ type: 'dealCards', playerIds: ['player1'] }),
        expect.any(Date)
      );
    });

    it('should handle multiple reshuffles during dealing', async () => {
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
      
      // Should create deal cards action for the first player before first reshuffle
      expect(mockCreateDealCardsAction).toHaveBeenCalledWith('dealer1', ['player1']);
      
      // Should create reshuffle action
      expect(mockCreateDeckReshuffleAction).toHaveBeenCalledWith('dealer1', 'dealer1');
      
      // Should create final deal cards action for remaining players
      expect(mockCreateDealCardsAction).toHaveBeenCalledWith('dealer1', ['player2', 'player3']);
    });

    it('should throw error when both deck and trash are empty', async () => {
      const gameData = createMockGameData();
      const internalState = createMockInternalState({
        deck: [], // No cards
        trash: [], // No trash
      });
      
      mockGameRef.get.mockResolvedValue({ exists: true, data: () => gameData });
      mockInternalStateRef.get.mockResolvedValue({ exists: true, data: () => internalState });

      await expect(dealCards({ userId: 'dealer1', gameId: 'game1' }))
        .rejects.toThrow('No cards left in deck or trash');
    });

    it('should use correct action timing with actionCounter', async () => {
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
      
      // Verify that addActionToBatch was called with incrementing timestamps
      const addActionCalls = mockAddActionToBatch.mock.calls;
      expect(addActionCalls.length).toBeGreaterThan(0);
      
      // Check that timestamps are incrementing by 10ms
      for (let i = 1; i < addActionCalls.length; i++) {
        const prevTimestamp = addActionCalls[i - 1][3];
        const currTimestamp = addActionCalls[i][3];
        if (prevTimestamp && currTimestamp) {
          expect(currTimestamp.getTime() - prevTimestamp.getTime()).toBeGreaterThanOrEqual(0);
        }
      }
    });

    it('should correctly track lastDealtIndex for multiple reshuffles', async () => {
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
      
      // Should create deal cards action for first player before reshuffle
      expect(mockCreateDealCardsAction).toHaveBeenCalledWith('dealer1', ['player1']);
      
      // Should create final deal cards action for remaining players after reshuffle
      expect(mockCreateDealCardsAction).toHaveBeenCalledWith('dealer1', ['player2', 'player3']);
    });
  });

  describe('Player dealing order', () => {
    it('should deal cards in correct order starting from player after dealer', async () => {
      const gameData = createMockGameData({
        dealer: 'player2',
        players: ['player1', 'player2', 'player3', 'player4'],
      });
      const internalState = createMockInternalState();
      
      mockGameRef.get.mockResolvedValue({ exists: true, data: () => gameData });
      mockInternalStateRef.get.mockResolvedValue({ exists: true, data: () => internalState });

      const result = await dealCards({ userId: 'player2', gameId: 'game1' });

      expect(result.success).toBe(true);
      // Should set activePlayer to the first player in dealing order (player3)
      expect(mockBatch.update).toHaveBeenCalledWith(
        expect.anything(),
        { roundState: 'playing', activePlayer: 'player3' }
      );
    });

    it('should skip players with no lives remaining', async () => {
      const gameData = createMockGameData({
        playerLives: {
          dealer1: 3,
          player1: 0, // No lives
          player2: 3,
          player3: 0, // No lives
        },
      });
      const internalState = createMockInternalState();
      
      mockGameRef.get.mockResolvedValue({ exists: true, data: () => gameData });
      mockInternalStateRef.get.mockResolvedValue({ exists: true, data: () => internalState });

      const result = await dealCards({ userId: 'dealer1', gameId: 'game1' });

      expect(result.success).toBe(true);
      // Should set activePlayer to the first player with lives (player2)
      expect(mockBatch.update).toHaveBeenCalledWith(
        expect.anything(),
        { roundState: 'playing', activePlayer: 'player2' }
      );
    });
  });

  describe('Edge cases', () => {
    it('should handle single player game', async () => {
      const gameData = createMockGameData({
        players: ['dealer1'],
        playerLives: { dealer1: 3 },
      });
      const internalState = createMockInternalState();
      
      mockGameRef.get.mockResolvedValue({ exists: true, data: () => gameData });
      mockInternalStateRef.get.mockResolvedValue({ exists: true, data: () => internalState });

      const result = await dealCards({ userId: 'dealer1', gameId: 'game1' });

      expect(result.success).toBe(true);
      // Should set activePlayer to dealer1 since they're the only player
      expect(mockBatch.update).toHaveBeenCalledWith(
        expect.anything(),
        { roundState: 'playing', activePlayer: 'dealer1' }
      );
    });

    it('should throw error when no players have lives', async () => {
      const gameData = createMockGameData({
        playerLives: {
          dealer1: 0,
          player1: 0,
          player2: 0,
          player3: 0,
        },
      });
      
      mockGameRef.get.mockResolvedValue({ exists: true, data: () => gameData });

      await expect(dealCards({ userId: 'dealer1', gameId: 'game1' }))
        .rejects.toThrow('No players with lives remaining');
    });
  });
});