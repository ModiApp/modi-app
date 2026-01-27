import { onSchedule } from 'firebase-functions/v2/scheduler';
import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';
import { Expo, ExpoPushMessage } from 'expo-server-sdk';

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

// Initialize Expo SDK for push notifications
const expo = new Expo();

/**
 * Send push notification when it's a player's turn
 * Triggered when activePlayer changes
 * Supports both Expo (mobile) and FCM (web) tokens
 */
export const onTurnChanged = onDocumentUpdated('games/{gameId}', async (event) => {
  const before = event.data?.before.data();
  const after = event.data?.after.data();
  const gameId = event.params.gameId;

  if (!before || !after) return;

  // Only send notification if:
  // 1. Game is active
  // 2. activePlayer changed
  // 3. Not the same player (prevents notification on game start)
  if (
    after.status !== 'active' ||
    before.activePlayer === after.activePlayer ||
    !after.activePlayer
  ) {
    return;
  }

  const activePlayerId = after.activePlayer;
  const playerName = after.usernames?.[activePlayerId] || 'Player';
  
  console.log(`Turn changed in game ${gameId}, notifying ${activePlayerId}`);

  try {
    // Get the player's push token
    const tokenDoc = await firestore.collection('pushTokens').doc(activePlayerId).get();
    if (!tokenDoc.exists) {
      console.log(`No push token for player ${activePlayerId}`);
      return;
    }

    const tokenData = tokenDoc.data();
    const pushToken = tokenData?.token;
    const tokenType = tokenData?.tokenType || 'expo'; // Default to expo for backwards compatibility
    const platform = tokenData?.platform;

    if (!pushToken) {
      console.log(`Invalid push token for player ${activePlayerId}`);
      return;
    }

    // Check if player is online (don't notify if they're actively playing)
    const presenceSnapshot = await database.ref(`presence/${gameId}/${activePlayerId}`).once('value');
    const presence = presenceSnapshot.val();
    
    if (presence?.online === true) {
      console.log(`Player ${activePlayerId} is online, skipping notification`);
      return;
    }

    // Send notification based on token type
    if (tokenType === 'fcm') {
      // Web push via Firebase Cloud Messaging
      await sendFcmNotification(pushToken, gameId, playerName);
    } else {
      // Mobile push via Expo
      await sendExpoNotification(pushToken, gameId, playerName);
    }
    
    console.log(`Push notification sent to ${activePlayerId} via ${tokenType} (${platform})`);
  } catch (error) {
    console.error('Error sending turn notification:', error);
  }
});

/**
 * Send push notification via Expo (for mobile)
 */
async function sendExpoNotification(pushToken: string, gameId: string, playerName: string): Promise<void> {
  if (!Expo.isExpoPushToken(pushToken)) {
    console.log(`Invalid Expo push token: ${pushToken}`);
    return;
  }

  const message: ExpoPushMessage = {
    to: pushToken,
    sound: 'default',
    title: "It's your turn!",
    body: `Your turn in Modi`,
    data: { gameId, type: 'turn' },
    priority: 'high',
  };

  const chunks = expo.chunkPushNotifications([message]);
  for (const chunk of chunks) {
    const tickets = await expo.sendPushNotificationsAsync(chunk);
    console.log('Expo push notification sent:', tickets);
  }
}

/**
 * Send push notification via Firebase Cloud Messaging (for web)
 */
async function sendFcmNotification(fcmToken: string, gameId: string, playerName: string): Promise<void> {
  const message: admin.messaging.Message = {
    token: fcmToken,
    notification: {
      title: "It's your turn!",
      body: `Your turn in Modi`,
    },
    webpush: {
      notification: {
        title: "It's your turn!",
        body: `Your turn in Modi`,
        icon: '/icon-192.png',
        badge: '/badge-72.png',
        requireInteraction: true,
        tag: gameId,
      },
      fcmOptions: {
        link: `/game/${gameId}`,
      },
    },
    data: {
      gameId,
      type: 'turn',
    },
  };

  const response = await admin.messaging().send(message);
  console.log('FCM push notification sent:', response);
}
