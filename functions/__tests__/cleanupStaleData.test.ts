import { getFirestore, getDatabase, clearAll } from './setup';
import * as admin from 'firebase-admin';
import { runCleanup as runCleanupWith } from '../src/cleanup';

const runCleanup = () => runCleanupWith(getFirestore(), getDatabase());

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

  describe('nested private actions', () => {
    const threeHoursAgo = () => admin.firestore.Timestamp.fromDate(new Date(Date.now() - 3 * 60 * 60 * 1000));

    it('should archive and delete privateActions/{playerId}/actions even though the player doc does not exist', async () => {
      const gameRef = firestore.collection('games').doc('game-with-private');
      await gameRef.set({ status: 'gathering-players', createdAt: threeHoursAgo() });
      // Mirrors the API: only the nested action is written, never privateActions/{playerId}
      await gameRef.collection('privateActions').doc('player1').collection('actions').doc('p1').set({ card: 'AS' });

      await runCleanup();

      expect((await gameRef.get()).exists).toBe(false);
      expect((await gameRef.listCollections()).length).toBe(0);

      const archives = await firestore
        .collection('archivedGames')
        .where('_archiveMetadata.originalGameId', '==', 'game-with-private')
        .get();
      expect(archives.size).toBe(1);
      const archivedAction = await archives.docs[0].ref
        .collection('privateActions')
        .doc('player1')
        .collection('actions')
        .doc('p1')
        .get();
      expect(archivedAction.data()).toEqual({ card: 'AS' });
    });

    it('should move orphaned subcollections of already-deleted games into their archive', async () => {
      const archiveRef = firestore.collection('archivedGames').doc('existing-archive');
      await archiveRef.set({ _archiveMetadata: { originalGameId: 'orphan', archivedAt: threeHoursAgo() } });
      const orphanRef = firestore.collection('games').doc('orphan');
      await orphanRef.collection('privateActions').doc('player1').collection('actions').doc('p1').set({ card: 'KD' });

      const result = await runCleanup();

      expect(result.archivedOrphans).toBe(1);
      expect((await orphanRef.listCollections()).length).toBe(0);
      const archivedAction = await archiveRef
        .collection('privateActions')
        .doc('player1')
        .collection('actions')
        .doc('p1')
        .get();
      expect(archivedAction.data()).toEqual({ card: 'KD' });
    });

    it('should create an archive for orphaned subcollections with no existing archive', async () => {
      const orphanRef = firestore.collection('games').doc('lonely-orphan');
      await orphanRef.collection('privateActions').doc('player1').collection('actions').doc('p1').set({ card: '2C' });

      await runCleanup();

      expect((await orphanRef.listCollections()).length).toBe(0);
      const archives = await firestore
        .collection('archivedGames')
        .where('_archiveMetadata.originalGameId', '==', 'lonely-orphan')
        .get();
      expect(archives.size).toBe(1);
      expect(archives.docs[0].data()._archiveMetadata.archiveReason).toBe('orphaned_subcollections');
    });

    it('should not touch subcollections of games that still exist', async () => {
      const gameRef = firestore.collection('games').doc('live-with-private');
      await gameRef.set({ status: 'active', updatedAt: admin.firestore.Timestamp.now() });
      await gameRef.collection('privateActions').doc('player1').collection('actions').doc('p1').set({ card: 'QH' });

      await runCleanup();

      const action = await gameRef.collection('privateActions').doc('player1').collection('actions').doc('p1').get();
      expect(action.exists).toBe(true);
    });
  });

  describe('games without updatedAt (real game docs)', () => {
    it('should not archive an active game with recent actions but no updatedAt', async () => {
      // Real game docs written by the API have no updatedAt field. This used to be
      // read as epoch 0, archiving every in-progress game on the next hourly run.
      const gameRef = firestore.collection('games').doc('live-game');
      await gameRef.set({ status: 'active' });
      await gameRef.collection('actions').doc('a1').set({ type: 'swap-cards', timestamp: new Date() });

      await runCleanup();

      expect((await gameRef.get()).exists).toBe(true);
    });

    it('should archive an active game whose latest action is older than 24 hours', async () => {
      const gameRef = firestore.collection('games').doc('stale-game');
      await gameRef.set({ status: 'active' });
      await gameRef
        .collection('actions')
        .doc('a1')
        .set({ type: 'swap-cards', timestamp: new Date(Date.now() - 25 * 60 * 60 * 1000) });

      await runCleanup();

      expect((await gameRef.get()).exists).toBe(false);
    });

    it('should use the newest of createdAt and the latest action', async () => {
      const gameRef = firestore.collection('games').doc('lobby');
      await gameRef.set({
        status: 'gathering-players',
        createdAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 3 * 60 * 60 * 1000)),
      });
      await gameRef.collection('actions').doc('a1').set({ type: 'player-joined', timestamp: new Date() });

      await runCleanup();

      expect((await gameRef.get()).exists).toBe(true);
    });

    it('should never archive a game with no timestamps, and stamp createdAt so it can age out', async () => {
      await firestore.collection('games').doc('undated-game').set({ status: 'active' });

      await runCleanup();

      const game = await firestore.collection('games').doc('undated-game').get();
      expect(game.exists).toBe(true);
      expect(game.data()!.createdAt).toBeInstanceOf(admin.firestore.Timestamp);
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
