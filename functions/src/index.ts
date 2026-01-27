import { onSchedule } from 'firebase-functions/v2/scheduler';
import * as admin from 'firebase-admin';

admin.initializeApp();

const firestore = admin.firestore();
const database = admin.database();

/**
 * Cleanup stale games and presence data
 * Runs every hour
 * 
 * Instead of deleting games, we archive them to preserve historical data.
 * Archived games are moved to the 'archivedGames' collection.
 */
export const cleanupStaleData = onSchedule('every 1 hours', async (event) => {
  const now = Date.now();
  const TWO_HOURS = 2 * 60 * 60 * 1000;
  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
  const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

  console.log('Starting cleanup job...');

  let archivedGames = 0;
  let deletedPresence = 0;

  try {
    // 1. Archive gathering-players games older than 2 hours (abandoned lobbies)
    const gatheringGames = await firestore
      .collection('games')
      .where('status', '==', 'gathering-players')
      .get();

    for (const doc of gatheringGames.docs) {
      const data = doc.data();
      const updatedAt = data.updatedAt?.toMillis?.() || data.createdAt?.toMillis?.() || 0;
      
      if (now - updatedAt > TWO_HOURS) {
        await archiveGame(doc.id, 'abandoned_lobby');
        archivedGames++;
      }
    }

    // 2. Archive active games older than 24 hours (abandoned mid-game)
    const activeGames = await firestore
      .collection('games')
      .where('status', '==', 'active')
      .get();

    for (const doc of activeGames.docs) {
      const data = doc.data();
      const updatedAt = data.updatedAt?.toMillis?.() || 0;
      
      if (now - updatedAt > TWENTY_FOUR_HOURS) {
        await archiveGame(doc.id, 'abandoned_active');
        archivedGames++;
      }
    }

    // 3. Archive ended games older than 7 days (completed games)
    const endedGames = await firestore
      .collection('games')
      .where('status', '==', 'ended')
      .get();

    for (const doc of endedGames.docs) {
      const data = doc.data();
      const updatedAt = data.updatedAt?.toMillis?.() || 0;
      
      if (now - updatedAt > SEVEN_DAYS) {
        await archiveGame(doc.id, 'completed');
        archivedGames++;
      }
    }

    // 4. Clean up orphaned presence data (games that no longer exist in active collection)
    const presenceSnapshot = await database.ref('presence').once('value');
    const presenceData = presenceSnapshot.val() || {};

    for (const gameId of Object.keys(presenceData)) {
      const gameDoc = await firestore.collection('games').doc(gameId).get();
      if (!gameDoc.exists) {
        await database.ref(`presence/${gameId}`).remove();
        deletedPresence++;
      }
    }

    console.log(`Cleanup complete: ${archivedGames} games archived, ${deletedPresence} presence records deleted`);
  } catch (error) {
    console.error('Cleanup error:', error);
    throw error;
  }
});

/**
 * Archive a game by moving it to the archivedGames collection
 * Preserves all game data including subcollections for historical analysis
 */
async function archiveGame(gameId: string, archiveReason: string): Promise<void> {
  console.log(`Archiving game: ${gameId} (reason: ${archiveReason})`);

  const subcollections = ['playerHands', 'internalState', 'actions', 'privateActions'];
  
  // Get the main game document
  const gameDoc = await firestore.collection('games').doc(gameId).get();
  if (!gameDoc.exists) {
    console.log(`Game ${gameId} not found, skipping archive`);
    return;
  }

  const gameData = gameDoc.data()!;

  // Create archived game document with metadata
  const archivedGameRef = firestore.collection('archivedGames').doc(gameId);
  await archivedGameRef.set({
    ...gameData,
    _archiveMetadata: {
      archivedAt: admin.firestore.FieldValue.serverTimestamp(),
      archiveReason,
      originalGameId: gameId,
    },
  });

  // Copy subcollections to archived game
  for (const subcollection of subcollections) {
    const snapshot = await firestore
      .collection('games')
      .doc(gameId)
      .collection(subcollection)
      .get();
    
    // Copy each document to the archived subcollection
    for (const subDoc of snapshot.docs) {
      await archivedGameRef
        .collection(subcollection)
        .doc(subDoc.id)
        .set(subDoc.data());
    }

    // Delete from original location
    const deleteBatch = firestore.batch();
    snapshot.docs.forEach(doc => deleteBatch.delete(doc.ref));
    await deleteBatch.commit();
  }

  // Delete the original game document
  await firestore.collection('games').doc(gameId).delete();

  // Delete presence data for this game (no need to archive ephemeral data)
  await database.ref(`presence/${gameId}`).remove();

  console.log(`Game ${gameId} archived successfully`);
}
