import { onSchedule } from 'firebase-functions/v2/scheduler';
import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';
import { Expo, ExpoPushMessage } from 'expo-server-sdk';
import { runCleanup } from './cleanup';

admin.initializeApp();

const firestore = admin.firestore();
const database = admin.database();

/**
 * Cleanup stale games and presence data
 * Runs every hour
 */
export const cleanupStaleData = onSchedule('every 1 hours', async () => {
  try {
    await runCleanup(firestore, database);
  } catch (error) {
    console.error('Cleanup error:', error);
    throw error;
  }
});

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
  
  // Deduplication: Check if we recently sent a notification for this player/game
  // This prevents duplicate notifications if the function fires multiple times
  const dedupeKey = `notifications/${gameId}/${activePlayerId}`;
  const lastNotifSnapshot = await database.ref(dedupeKey).once('value');
  const lastNotifTime = lastNotifSnapshot.val()?.timestamp || 0;
  const now = Date.now();
  
  // Skip if we sent a notification within the last 10 seconds
  if (now - lastNotifTime < 10000) {
    console.log(`Skipping duplicate notification for ${activePlayerId} in game ${gameId}`);
    return;
  }
  
  // Mark that we're sending a notification now
  await database.ref(dedupeKey).set({ timestamp: now });
  
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
