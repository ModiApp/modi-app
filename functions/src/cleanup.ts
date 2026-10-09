import * as admin from 'firebase-admin';

const TWO_HOURS = 2 * 60 * 60 * 1000;
const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

const STALE_THRESHOLDS: { status: string; maxIdleMs: number; archiveReason: string }[] = [
  { status: 'gathering-players', maxIdleMs: TWO_HOURS, archiveReason: 'abandoned_lobby' },
  { status: 'active', maxIdleMs: TWENTY_FOUR_HOURS, archiveReason: 'abandoned_active' },
  { status: 'ended', maxIdleMs: SEVEN_DAYS, archiveReason: 'completed' },
];

// gRPC status returned when a write precondition (e.g. lastUpdateTime) fails
const FAILED_PRECONDITION = 9;

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
  const failures: unknown[] = [];

  for (const { status, maxIdleMs, archiveReason } of STALE_THRESHOLDS) {
    const games = await firestore.collection('games').where('status', '==', status).get();
    const cutoff = now - maxIdleMs;

    for (const doc of games.docs) {
      // Isolate failures so one bad game can't block every other cleanup step
      try {
        const lastActivity = await getLastActivityMillis(doc, cutoff);

        // Never archive a game we can't date. Treating a missing timestamp as 0
        // made every game look decades old and archived games mid-play. Stamp it
        // instead so it ages out from now rather than being skipped forever.
        if (lastActivity === null) {
          console.warn(`Game ${doc.id} (${status}) has no activity timestamp, stamping createdAt`);
          await doc.ref.update({ createdAt: admin.firestore.FieldValue.serverTimestamp() });
          continue;
        }

        if (lastActivity < cutoff && (await archiveGame(firestore, database, doc, archiveReason))) {
          archivedGames++;
        }
      } catch (error) {
        console.error(`Failed to clean up game ${doc.id}:`, error);
        failures.push(error);
      }
    }
  }

  // Archive subcollections left behind under deleted game docs
  const archivedOrphans = await archiveOrphanedSubcollections(firestore, failures);

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

  // Surface partial failures to the scheduler after doing all the work we could
  if (failures.length > 0) {
    throw new Error(`Cleanup finished with ${failures.length} failure(s); see logs above`);
  }

  return { archivedGames, archivedOrphans, deletedPresence };
}

/**
 * The most recent sign of life for a game: the newest of its updatedAt/createdAt
 * fields and its latest action. Every gameplay handler writes an action, so the
 * actions subcollection reflects activity even when the game doc isn't stamped.
 * Skips the actions query when the doc's own timestamps are already newer than
 * `cutoff`. Returns null if no timestamp exists at all.
 */
async function getLastActivityMillis(
  doc: admin.firestore.DocumentSnapshot,
  cutoff: number,
): Promise<number | null> {
  const data = doc.data() ?? {};
  const docMillis = Math.max(toMillis(data.updatedAt) ?? -Infinity, toMillis(data.createdAt) ?? -Infinity);
  if (docMillis >= cutoff) return docMillis;

  const latestAction = await doc.ref.collection('actions').orderBy('timestamp', 'desc').limit(1).get();
  const actionMillis = latestAction.empty ? null : toMillis(latestAction.docs[0].data().timestamp);

  const lastActivity = Math.max(docMillis, actionMillis ?? -Infinity);
  return lastActivity === -Infinity ? null : lastActivity;
}

function toMillis(value: unknown): number | null {
  if (value instanceof admin.firestore.Timestamp) return value.toMillis();
  if (value instanceof Date) return value.getTime();
  return null;
}

/**
 * Archive a game by moving it to the archivedGames collection
 * Preserves all game data including subcollections for historical analysis.
 * Returns false without deleting anything if the game changed while archiving.
 */
async function archiveGame(
  firestore: admin.firestore.Firestore,
  database: admin.database.Database,
  gameDoc: admin.firestore.QueryDocumentSnapshot,
  archiveReason: string,
): Promise<boolean> {
  const gameId = gameDoc.id;
  console.log(`Archiving game: ${gameId} (reason: ${archiveReason})`);

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

  await copySubcollections(firestore, gameDoc.ref, archivedGameRef);

  // Only delete the game if nobody touched it since we decided it was stale.
  // Gameplay handlers update the game doc, so a start/join/move mid-archive
  // fails this precondition and the game survives.
  try {
    await gameDoc.ref.delete({ lastUpdateTime: gameDoc.updateTime });
  } catch (error: any) {
    if (error?.code !== FAILED_PRECONDITION) throw error;
    console.log(`Game ${gameId} changed while archiving, keeping it`);
    await firestore.recursiveDelete(archivedGameRef);
    return false;
  }

  // Deleting a doc doesn't delete its subcollections, so delete the rest of the tree.
  // If this fails, the orphan sweep picks the leftovers up on the next run.
  await firestore.recursiveDelete(gameDoc.ref);

  // Delete presence data for this game (no need to archive ephemeral data)
  await database.ref(`presence/${gameId}`).remove();

  console.log(`Game ${gameId} archived successfully`);
  return true;
}

/**
 * Archive subcollections still sitting under game docs that no longer exist.
 * Older versions of archiveGame only deleted the top-level docs of known
 * subcollections, leaving privateActions/{playerId}/actions behind. Those
 * orphans also make the game ID look free, so a new game could reuse it.
 */
async function archiveOrphanedSubcollections(
  firestore: admin.firestore.Firestore,
  failures: unknown[],
): Promise<number> {
  // listDocuments includes "missing" docs that only exist as a parent of subcollections
  const gameRefs = await firestore.collection('games').listDocuments();
  let archivedOrphans = 0;

  for (let i = 0; i < gameRefs.length; i += 100) {
    const snapshots = await firestore.getAll(...gameRefs.slice(i, i + 100));

    for (const snapshot of snapshots) {
      if (snapshot.exists) continue;

      const gameId = snapshot.id;
      try {
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

        await copySubcollections(firestore, snapshot.ref, archivedGameRef);
        await firestore.recursiveDelete(snapshot.ref);
        archivedOrphans++;
      } catch (error) {
        console.error(`Failed to archive orphaned subcollections for game ${gameId}:`, error);
        failures.push(error);
      }
    }
  }

  return archivedOrphans;
}

/**
 * Recursively copy every subcollection of `source` under `destination`.
 * Uses listDocuments so docs that exist only as parents of nested
 * subcollections (e.g. privateActions/{playerId}) are still traversed.
 */
async function copySubcollections(
  firestore: admin.firestore.Firestore,
  source: admin.firestore.DocumentReference,
  destination: admin.firestore.DocumentReference,
): Promise<void> {
  const writer = firestore.bulkWriter();
  const writeErrors: unknown[] = [];

  async function copy(src: admin.firestore.DocumentReference, dst: admin.firestore.DocumentReference) {
    for (const collection of await src.listCollections()) {
      const [snapshot, docRefs] = await Promise.all([collection.get(), collection.listDocuments()]);

      for (const doc of snapshot.docs) {
        writer.set(dst.collection(collection.id).doc(doc.id), doc.data()).catch((error) => writeErrors.push(error));
      }

      await Promise.all(docRefs.map((docRef) => copy(docRef, dst.collection(collection.id).doc(docRef.id))));
    }
  }

  try {
    await copy(source, destination);
  } finally {
    await writer.close();
  }

  if (writeErrors.length > 0) throw writeErrors[0];
}
