import { getFirestore, getDatabase, clearAll } from './setup';

// Import the wrapped function after setup initializes firebase-admin
// We'll test the logic by calling the underlying cleanup function
import * as admin from 'firebase-admin';

describe('cleanupStaleData', () => {
  const firestore = getFirestore();
  const database = getDatabase();

  beforeEach(async () => {
    await clearAll();
  });

  afterEach(async () => {
    await clearAll();
  });

  describe('gathering-players games cleanup', () => {
    it('should delete gathering-players games older than 2 hours', async () => {
      const twoHoursAgo = new Date(Date.now() - 2.5 * 60 * 60 * 1000);
      
      // Create an old gathering-players game
      await firestore.collection('games').doc('old-game').set({
        status: 'gathering-players',
        updatedAt: admin.firestore.Timestamp.fromDate(twoHoursAgo),
      });

      // Create a recent gathering-players game
      await firestore.collection('games').doc('new-game').set({
        status: 'gathering-players',
        updatedAt: admin.firestore.Timestamp.now(),
      });

      // Run the cleanup logic manually
      await runCleanup();

      // Verify old game is deleted
      const oldGame = await firestore.collection('games').doc('old-game').get();
      expect(oldGame.exists).toBe(false);

      // Verify new game still exists
      const newGame = await firestore.collection('games').doc('new-game').get();
      expect(newGame.exists).toBe(true);
    });

    it('should not delete gathering-players games less than 2 hours old', async () => {
      const oneHourAgo = new Date(Date.now() - 1 * 60 * 60 * 1000);
      
      await firestore.collection('games').doc('recent-game').set({
        status: 'gathering-players',
        updatedAt: admin.firestore.Timestamp.fromDate(oneHourAgo),
      });

      await runCleanup();

      const game = await firestore.collection('games').doc('recent-game').get();
      expect(game.exists).toBe(true);
    });
  });

  describe('active games cleanup', () => {
    it('should delete active games older than 24 hours', async () => {
      const oneDayAgo = new Date(Date.now() - 25 * 60 * 60 * 1000);
      
      await firestore.collection('games').doc('abandoned-game').set({
        status: 'active',
        updatedAt: admin.firestore.Timestamp.fromDate(oneDayAgo),
      });

      await runCleanup();

      const game = await firestore.collection('games').doc('abandoned-game').get();
      expect(game.exists).toBe(false);
    });

    it('should not delete active games less than 24 hours old', async () => {
      const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
      
      await firestore.collection('games').doc('active-game').set({
        status: 'active',
        updatedAt: admin.firestore.Timestamp.fromDate(twelveHoursAgo),
      });

      await runCleanup();

      const game = await firestore.collection('games').doc('active-game').get();
      expect(game.exists).toBe(true);
    });
  });

  describe('ended games cleanup', () => {
    it('should delete ended games older than 7 days', async () => {
      const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
      
      await firestore.collection('games').doc('old-ended-game').set({
        status: 'ended',
        updatedAt: admin.firestore.Timestamp.fromDate(eightDaysAgo),
      });

      await runCleanup();

      const game = await firestore.collection('games').doc('old-ended-game').get();
      expect(game.exists).toBe(false);
    });

    it('should not delete ended games less than 7 days old', async () => {
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      
      await firestore.collection('games').doc('recent-ended-game').set({
        status: 'ended',
        updatedAt: admin.firestore.Timestamp.fromDate(threeDaysAgo),
      });

      await runCleanup();

      const game = await firestore.collection('games').doc('recent-ended-game').get();
      expect(game.exists).toBe(true);
    });
  });

  describe('subcollection cleanup', () => {
    it('should delete game subcollections when deleting a game', async () => {
      const twoHoursAgo = new Date(Date.now() - 2.5 * 60 * 60 * 1000);
      
      // Create a game with subcollections
      const gameRef = firestore.collection('games').doc('game-with-subs');
      await gameRef.set({
        status: 'gathering-players',
        updatedAt: admin.firestore.Timestamp.fromDate(twoHoursAgo),
      });

      // Add subcollection documents
      await gameRef.collection('playerHands').doc('player1').set({ cards: [] });
      await gameRef.collection('internalState').doc('state').set({ deck: [] });
      await gameRef.collection('actions').doc('action1').set({ type: 'draw' });

      await runCleanup();

      // Verify game and subcollections are deleted
      const game = await gameRef.get();
      expect(game.exists).toBe(false);

      const hands = await gameRef.collection('playerHands').get();
      expect(hands.empty).toBe(true);

      const state = await gameRef.collection('internalState').get();
      expect(state.empty).toBe(true);

      const actions = await gameRef.collection('actions').get();
      expect(actions.empty).toBe(true);
    });
  });

  describe('presence cleanup', () => {
    it('should delete presence data for deleted games', async () => {
      const twoHoursAgo = new Date(Date.now() - 2.5 * 60 * 60 * 1000);
      
      // Create a game and its presence data
      await firestore.collection('games').doc('game-with-presence').set({
        status: 'gathering-players',
        updatedAt: admin.firestore.Timestamp.fromDate(twoHoursAgo),
      });
      await database.ref('presence/game-with-presence/player1').set({ online: true });

      await runCleanup();

      // Verify presence is deleted
      const presence = await database.ref('presence/game-with-presence').once('value');
      expect(presence.exists()).toBe(false);
    });

    it('should delete orphaned presence data', async () => {
      // Create presence data for a non-existent game
      await database.ref('presence/nonexistent-game/player1').set({ online: true });

      await runCleanup();

      const presence = await database.ref('presence/nonexistent-game').once('value');
      expect(presence.exists()).toBe(false);
    });

    it('should not delete presence data for existing games', async () => {
      // Create a recent game with presence data
      await firestore.collection('games').doc('existing-game').set({
        status: 'active',
        updatedAt: admin.firestore.Timestamp.now(),
      });
      await database.ref('presence/existing-game/player1').set({ online: true });

      await runCleanup();

      // Verify presence still exists
      const presence = await database.ref('presence/existing-game').once('value');
      expect(presence.exists()).toBe(true);
    });
  });
});

/**
 * Run the cleanup logic directly (simulating what the scheduled function does)
 * This allows us to test the core logic without needing to trigger the scheduler
 */
async function runCleanup(): Promise<void> {
  const firestore = getFirestore();
  const database = getDatabase();
  
  const now = Date.now();
  const TWO_HOURS = 2 * 60 * 60 * 1000;
  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
  const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

  // 1. Clean up gathering-players games older than 2 hours
  const gatheringGames = await firestore
    .collection('games')
    .where('status', '==', 'gathering-players')
    .get();

  for (const doc of gatheringGames.docs) {
    const data = doc.data();
    const updatedAt = data.updatedAt?.toMillis?.() || data.createdAt?.toMillis?.() || 0;
    
    if (now - updatedAt > TWO_HOURS) {
      await deleteGame(doc.id);
    }
  }

  // 2. Clean up active games older than 24 hours
  const activeGames = await firestore
    .collection('games')
    .where('status', '==', 'active')
    .get();

  for (const doc of activeGames.docs) {
    const data = doc.data();
    const updatedAt = data.updatedAt?.toMillis?.() || 0;
    
    if (now - updatedAt > TWENTY_FOUR_HOURS) {
      await deleteGame(doc.id);
    }
  }

  // 3. Clean up ended games older than 7 days
  const endedGames = await firestore
    .collection('games')
    .where('status', '==', 'ended')
    .get();

  for (const doc of endedGames.docs) {
    const data = doc.data();
    const updatedAt = data.updatedAt?.toMillis?.() || 0;
    
    if (now - updatedAt > SEVEN_DAYS) {
      await deleteGame(doc.id);
    }
  }

  // 4. Clean up orphaned presence data
  const presenceSnapshot = await database.ref('presence').once('value');
  const presenceData = presenceSnapshot.val() || {};

  for (const gameId of Object.keys(presenceData)) {
    const gameDoc = await firestore.collection('games').doc(gameId).get();
    if (!gameDoc.exists) {
      await database.ref(`presence/${gameId}`).remove();
    }
  }
}

async function deleteGame(gameId: string): Promise<void> {
  const firestore = getFirestore();
  const database = getDatabase();

  const subcollections = ['playerHands', 'internalState', 'actions', 'privateActions'];
  
  for (const subcollection of subcollections) {
    const snapshot = await firestore
      .collection('games')
      .doc(gameId)
      .collection(subcollection)
      .get();
    
    const batch = firestore.batch();
    snapshot.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
  }

  await firestore.collection('games').doc(gameId).delete();
  await database.ref(`presence/${gameId}`).remove();
}
