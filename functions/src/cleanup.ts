import * as admin from 'firebase-admin';

const TWO_HOURS = 2 * 60 * 60 * 1000;
const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

const STALE_THRESHOLDS: { status: string; maxIdleMs: number; archiveReason: string }[] = [
  { status: 'gathering-players', maxIdleMs: TWO_HOURS, archiveReason: 'abandoned_lobby' },
  { status: 'active', maxIdleMs: TWENTY_FOUR_HOURS, archiveReason: 'abandoned_active' },
  { status: 'ended', maxIdleMs: SEVEN_DAYS, archiveReason: 'completed' },
];

/**
 * Archive stale games and delete orphaned presence data.
 *
 * Instead of deleting games, we archive them to preserve historical data.
 * Archived games are moved to the 'archivedGames' collection.
 */
export async function runCleanup(
  firestore: admin.firestore.Firestore,
  database: admin.database.Database,
  now: number = Date.now(),
): Promise<{ archivedGames: number; archivedOrphans: number; deletedPresence: number }> {
  console.log('Starting cleanup job...');

  let archivedGames = 0;
  let deletedPresence = 0;

  for (const { status, maxIdleMs, archiveReason } of STALE_THRESHOLDS) {
    const games = await firestore.collection('games').where('status', '==', status).get();

    for (const doc of games.docs) {
      const lastActivity = await getLastActivityMillis(doc);

      // Never archive a game we can't date. Treating a missing timestamp as 0
      // made every game look decades old and archived games mid-play.
      if (lastActivity === null) {
        console.warn(`Skipping game ${doc.id} (${status}): no activity timestamp found`);
        continue;
      }

      if (now - lastActivity > maxIdleMs) {
        await archiveGame(firestore, database, doc.id, archiveReason);
        archivedGames++;
      }
    }
  }

  // Archive subcollections left behind under deleted game docs
  const archivedOrphans = await archiveOrphanedSubcollections(firestore);

  // Clean up orphaned presence data (games that no longer exist in active collection)
  const presenceSnapshot = await database.ref('presence').once('value');
  const presenceGameIds = Object.keys(presenceSnapshot.val() || {});

  for (const gameId of presenceGameIds) {
    const gameDoc = await firestore.collection('games').doc(gameId).get();
    if (!gameDoc.exists) {
      console.log(`Deleting orphaned presence for game ${gameId}`);
      await database.ref(`presence/${gameId}`).remove();
      deletedPresence++;
    }
  }

  console.log(
    `Cleanup complete: ${archivedGames} games archived, ${archivedOrphans} orphaned game trees archived, ` +
      `${deletedPresence} presence records deleted`,
  );
  return { archivedGames, archivedOrphans, deletedPresence };
}

/**
 * The most recent sign of life for a game: the newest of its updatedAt/createdAt
 * fields and its latest action. Every gameplay handler writes an action, so the
 * actions subcollection reflects activity even when the game doc isn't stamped.
 * Returns null if no timestamp exists at all.
 */
export async function getLastActivityMillis(
  doc: admin.firestore.QueryDocumentSnapshot,
): Promise<number | null> {
  const data = doc.data();
  const latestAction = await doc.ref.collection('actions').orderBy('timestamp', 'desc').limit(1).get();

  const candidates = [
    toMillis(data.updatedAt),
    toMillis(data.createdAt),
    latestAction.empty ? null : toMillis(latestAction.docs[0].data().timestamp),
  ].filter((ms): ms is number => ms !== null);

  return candidates.length > 0 ? Math.max(...candidates) : null;
}

function toMillis(value: unknown): number | null {
  if (value instanceof admin.firestore.Timestamp) return value.toMillis();
  if (value instanceof Date) return value.getTime();
  return null;
}

/**
 * Archive a game by moving it to the archivedGames collection
 * Preserves all game data including subcollections for historical analysis
 */
async function archiveGame(
  firestore: admin.firestore.Firestore,
  database: admin.database.Database,
  gameId: string,
  archiveReason: string,
): Promise<void> {
  console.log(`Archiving game: ${gameId} (reason: ${archiveReason})`);

  const gameRef = firestore.collection('games').doc(gameId);
  const gameDoc = await gameRef.get();
  if (!gameDoc.exists) {
    console.log(`Game ${gameId} not found, skipping archive`);
    return;
  }

  // Create archived game document with auto-generated ID (allows multiple archives of same gameId)
  const archivedGameRef = firestore.collection('archivedGames').doc();
  await archivedGameRef.set({
    ...gameDoc.data(),
    _archiveMetadata: {
      archivedAt: admin.firestore.FieldValue.serverTimestamp(),
      archiveReason,
      originalGameId: gameId,
    },
  });

  await copySubcollections(gameRef, archivedGameRef);

  // Deleting a doc doesn't delete its subcollections, so delete the whole tree
  await firestore.recursiveDelete(gameRef);

  // Delete presence data for this game (no need to archive ephemeral data)
  await database.ref(`presence/${gameId}`).remove();

  console.log(`Game ${gameId} archived successfully`);
}

/**
 * Archive subcollections still sitting under game docs that no longer exist.
 * Older versions of archiveGame only deleted the top-level docs of known
 * subcollections, leaving privateActions/{playerId}/actions behind. Those
 * orphans also make the game ID look free, so a new game could reuse it.
 */
async function archiveOrphanedSubcollections(firestore: admin.firestore.Firestore): Promise<number> {
  // listDocuments includes "missing" docs that only exist as a parent of subcollections
  const gameRefs = await firestore.collection('games').listDocuments();
  let archivedOrphans = 0;

  for (let i = 0; i < gameRefs.length; i += 100) {
    const snapshots = await firestore.getAll(...gameRefs.slice(i, i + 100));

    for (const snapshot of snapshots) {
      if (snapshot.exists) continue;

      const gameId = snapshot.id;
      console.log(`Archiving orphaned subcollections for game ${gameId}`);

      // Merge into the most recent archive of this game, or create one if there isn't any
      const archives = await firestore
        .collection('archivedGames')
        .where('_archiveMetadata.originalGameId', '==', gameId)
        .get();
      const latestArchive = archives.docs.sort(
        (a, b) =>
          (toMillis(b.data()._archiveMetadata?.archivedAt) ?? 0) -
          (toMillis(a.data()._archiveMetadata?.archivedAt) ?? 0),
      )[0];

      let archivedGameRef = latestArchive?.ref;
      if (!archivedGameRef) {
        archivedGameRef = firestore.collection('archivedGames').doc();
        await archivedGameRef.set({
          _archiveMetadata: {
            archivedAt: admin.firestore.FieldValue.serverTimestamp(),
            archiveReason: 'orphaned_subcollections',
            originalGameId: gameId,
          },
        });
      }

      await copySubcollections(snapshot.ref, archivedGameRef);
      await firestore.recursiveDelete(snapshot.ref);
      archivedOrphans++;
    }
  }

  return archivedOrphans;
}

/**
 * Recursively copy every subcollection of `source` under `destination`.
 * Uses listCollections/listDocuments so docs that exist only as parents of
 * nested subcollections (e.g. privateActions/{playerId}) are still traversed.
 */
async function copySubcollections(
  source: admin.firestore.DocumentReference,
  destination: admin.firestore.DocumentReference,
): Promise<void> {
  for (const collection of await source.listCollections()) {
    for (const docRef of await collection.listDocuments()) {
      const destinationDoc = destination.collection(collection.id).doc(docRef.id);
      const snapshot = await docRef.get();
      if (snapshot.exists) {
        await destinationDoc.set(snapshot.data()!);
      }
      await copySubcollections(docRef, destinationDoc);
    }
  }
}
