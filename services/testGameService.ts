import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { firestore, isFirebaseConfigured } from '../config/firebase';
import { createTestGameData, TEST_GAME_ID } from '../utils/testUtils';

// Test game interface
export interface TestGame {
  id: string;
  deck: string[];
  players: {
    [playerId: string]: {
      id: string;
      name: string;
      card: string | null;
      isHost: boolean;
      isReady: boolean;
      lives: number;
      isDealer: boolean;
      position: number;
      hasGoneThisRound: boolean;
    };
  };
  currentPlayer: string;
  lastActionTime: number;
}

// Initialize Firebase Functions
const functions = getFunctions();

// Cloud Function callables
const initializeTestGameFunction = httpsCallable(functions, 'initializeTestGame');
const drawCardFunction = httpsCallable(functions, 'drawCard');
const reshuffleDeckFunction = httpsCallable(functions, 'reshuffleDeck');
const switchCurrentPlayerFunction = httpsCallable(functions, 'switchCurrentPlayer');

// Initialize test game in Firestore
export const initializeTestGame = async (): Promise<void> => {
  if (!isFirebaseConfigured) {
    console.warn("Firebase not configured - cannot initialize test game");
    return;
  }

  try {
    const result = await initializeTestGameFunction();
    console.log('Test game initialized successfully:', result.data);
  } catch (error) {
    console.error('Error initializing test game:', error);
  }
};

// Get test game data
export const getTestGame = async (): Promise<TestGame | null> => {
  if (!isFirebaseConfigured) {
    console.warn("Firebase not configured - returning mock data");
    return createTestGameData();
  }

  try {
    const gameDoc = await getDoc(doc(firestore, 'testGames', TEST_GAME_ID));
    if (gameDoc.exists()) {
      return gameDoc.data() as TestGame;
    } else {
      console.log('Test game not found, initializing...');
      await initializeTestGame();
      return createTestGameData();
    }
  } catch (error) {
    console.error('Error getting test game:', error);
    return null;
  }
};

// Subscribe to test game changes
export const subscribeToTestGame = (callback: (game: TestGame | null) => void) => {
  if (!isFirebaseConfigured) {
    console.warn("Firebase not configured - using mock subscription");
    const mockUnsubscribe = () => {};
    callback(createTestGameData());
    return mockUnsubscribe;
  }

  return onSnapshot(doc(firestore, 'testGames', TEST_GAME_ID), (doc) => {
    if (doc.exists()) {
      callback(doc.data() as TestGame);
    } else {
      callback(null);
    }
  });
};

// Draw a card for a player using Cloud Function
export const drawCard = async (playerId: string): Promise<void> => {
  if (!isFirebaseConfigured) {
    console.warn("Firebase not configured - cannot draw card");
    return;
  }

  try {
    const result = await drawCardFunction({ playerId });
    console.log('Card drawn successfully:', result.data);
  } catch (error) {
    console.error('Error drawing card:', error);
    throw error;
  }
};

// Reshuffle the deck using Cloud Function
export const reshuffleDeck = async (): Promise<void> => {
  if (!isFirebaseConfigured) {
    console.warn("Firebase not configured - cannot reshuffle deck");
    return;
  }

  try {
    const result = await reshuffleDeckFunction();
    console.log('Deck reshuffled successfully:', result.data);
  } catch (error) {
    console.error('Error reshuffling deck:', error);
    throw error;
  }
};

// Switch current player using Cloud Function
export const switchCurrentPlayer = async (): Promise<void> => {
  if (!isFirebaseConfigured) {
    console.warn("Firebase not configured - cannot switch player");
    return;
  }

  try {
    const result = await switchCurrentPlayerFunction();
    console.log('Player switched successfully:', result.data);
  } catch (error) {
    console.error('Error switching player:', error);
    throw error;
  }
}; 