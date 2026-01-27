import { onSchedule } from 'firebase-functions/v2/scheduler';
import * as admin from 'firebase-admin';

admin.initializeApp();

const firestore = admin.firestore();
const database = admin.database();

/**
 * Cleanup stale games and presence data
 * Runs every hour
 */
export const cleanupStaleData = onSchedule('every 1 hours', async (event) => {
  const now = Date.now();
  const TWO_HOURS = 2 * 60 * 60 * 1000;
  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
  const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

  console.log('Starting cleanup job...');

  let deletedGames = 0;
  let deletedPresence = 0;

  try {
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
        deletedGames++;
      }
    }

    // 2. Clean up active games older than 24 hours (abandoned)
    const activeGames = await firestore
      .collection('games')
      .where('status', '==', 'active')
      .get();

    for (const doc of activeGames.docs) {
      const data = doc.data();
      const updatedAt = data.updatedAt?.toMillis?.() || 0;
      
      if (now - updatedAt > TWENTY_FOUR_HOURS) {
        await deleteGame(doc.id);
        deletedGames++;
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
        deletedGames++;
      }
    }

    // 4. Clean up orphaned presence data (games that no longer exist)
    const presenceSnapshot = await database.ref('presence').once('value');
    const presenceData = presenceSnapshot.val() || {};

    for (const gameId of Object.keys(presenceData)) {
      const gameDoc = await firestore.collection('games').doc(gameId).get();
      if (!gameDoc.exists) {
        await database.ref(`presence/${gameId}`).remove();
        deletedPresence++;
      }
    }

    console.log(`Cleanup complete: ${deletedGames} games, ${deletedPresence} presence records deleted`);
  } catch (error) {
    console.error('Cleanup error:', error);
    throw error;
  }
});

/**
 * Delete a game and all its subcollections
 */
async function deleteGame(gameId: string): Promise<void> {
  console.log(`Deleting game: ${gameId}`);

  // Delete subcollections
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

  // Delete the game document
  await firestore.collection('games').doc(gameId).delete();

  // Delete presence data for this game
  await database.ref(`presence/${gameId}`).remove();
}
