/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";
import { onDocumentCreated, onDocumentUpdated } from "firebase-functions/v2/firestore";
import { onCall } from "firebase-functions/v2/https";
import { TEST_GAME_ID, TestGame, shuffleTestDeck } from "./types";

// Set global options for cost control
import { setGlobalOptions } from "firebase-functions";

// Initialize Firebase Admin
initializeApp();

// Get Firestore instance
const db = getFirestore();
setGlobalOptions({ maxInstances: 10 });

/**
 * Draw a card for a player
 * Callable function that can be invoked from the client
 */
export const drawCard = onCall<{ playerId: string }>(async (request) => {
  try {
    const { playerId } = request.data;
    
    if (!playerId) {
      throw new Error("playerId is required");
    }

    logger.info(`Drawing card for player: ${playerId}`);

    // Get the test game document
    const gameRef = db.collection('testGames').doc(TEST_GAME_ID);
    const gameDoc = await gameRef.get();

    if (!gameDoc.exists) {
      throw new Error("Test game not found");
    }

    const game = gameDoc.data() as TestGame;

    // Check if deck is empty
    if (game.deck.length === 0) {
      throw new Error("Deck is empty, cannot draw card");
    }

    // Draw the top card
    const drawnCard = game.deck[0];
    const remainingDeck = game.deck.slice(1);

    // Update the game document
    await gameRef.update({
      deck: remainingDeck,
      [`players.${playerId}.card`]: drawnCard,
      lastActionTime: Date.now()
    });

    logger.info(`Player ${playerId} drew: ${drawnCard}`);

    return {
      success: true,
      drawnCard,
      remainingDeckSize: remainingDeck.length
    };

  } catch (error) {
    logger.error("Error drawing card:", error);
    throw new Error(`Failed to draw card: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
});

/**
 * Reshuffle the deck
 * Callable function that can be invoked from the client
 */
export const reshuffleDeck = onCall(async (request) => {
  try {
    logger.info("Reshuffling deck");

    // Get the test game document
    const gameRef = db.collection('testGames').doc(TEST_GAME_ID);
    const gameDoc = await gameRef.get();

    if (!gameDoc.exists) {
      throw new Error("Test game not found");
    }

    const game = gameDoc.data() as TestGame;
    
    // Collect all cards back into deck (including player cards)
    let allCards = [...game.deck];
    Object.values(game.players).forEach(player => {
      if (player.card) {
        allCards.push(player.card);
      }
    });

    // Shuffle the deck
    const shuffledDeck = shuffleTestDeck(allCards);

    // Clear all player cards
    const playerUpdates: any = {};
    Object.keys(game.players).forEach(playerId => {
      playerUpdates[`players.${playerId}.card`] = null;
    });

    // Update the game document
    await gameRef.update({
      deck: shuffledDeck,
      ...playerUpdates,
      lastActionTime: Date.now()
    });

    logger.info(`Deck reshuffled successfully. New deck size: ${shuffledDeck.length}`);

    return {
      success: true,
      deckSize: shuffledDeck.length
    };

  } catch (error) {
    logger.error("Error reshuffling deck:", error);
    throw new Error(`Failed to reshuffle deck: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
});

/**
 * Switch current player (for testing)
 * Callable function that can be invoked from the client
 */
export const switchCurrentPlayer = onCall(async (request) => {
  try {
    logger.info("Switching current player");

    // Get the test game document
    const gameRef = db.collection('testGames').doc(TEST_GAME_ID);
    const gameDoc = await gameRef.get();

    if (!gameDoc.exists) {
      throw new Error("Test game not found");
    }

    const game = gameDoc.data() as TestGame;
    const newPlayer = game.currentPlayer === 'test-player-1' ? 'test-player-2' : 'test-player-1';

    // Update the game document
    await gameRef.update({
      currentPlayer: newPlayer,
      lastActionTime: Date.now()
    });

    logger.info(`Switched to player: ${newPlayer}`);

    return {
      success: true,
      currentPlayer: newPlayer
    };

  } catch (error) {
    logger.error("Error switching player:", error);
    throw new Error(`Failed to switch player: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
});

/**
 * Initialize test game (for setup)
 * Callable function that can be invoked from the client
 */
export const initializeTestGame = onCall(async (request) => {
  try {
    logger.info("Initializing test game");

    const testGameData: TestGame = {
      id: TEST_GAME_ID,
      deck: shuffleTestDeck(['ace', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'jack', 'queen', 'king'].flatMap(rank => 
        ['hearts', 'diamonds', 'clubs', 'spades'].map(suit => `${rank}_of_${suit}`)
      )),
      players: {
        'test-player-1': {
          id: 'test-player-1',
          name: 'Test Player 1',
          card: null,
          isHost: true,
          isReady: true,
          lives: 3,
          isDealer: false,
          position: 0,
          hasGoneThisRound: false
        },
        'test-player-2': {
          id: 'test-player-2',
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
      currentPlayer: 'test-player-1',
      lastActionTime: Date.now()
    };

    // Create the test game document
    await db.collection('testGames').doc(TEST_GAME_ID).set(testGameData);

    logger.info("Test game initialized successfully");

    return {
      success: true,
      gameId: TEST_GAME_ID,
      deckSize: testGameData.deck.length
    };

  } catch (error) {
    logger.error("Error initializing test game:", error);
    throw new Error(`Failed to initialize test game: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
});

// Optional: Firestore triggers for logging
export const onTestGameCreated = onDocumentCreated('testGames/{gameId}', (event) => {
  logger.info('Test game created:', event.params.gameId);
});

export const onTestGameUpdated = onDocumentUpdated('testGames/{gameId}', (event) => {
  logger.info('Test game updated:', event.params.gameId);
});
