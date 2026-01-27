import { useEffect, useRef, useState, useCallback } from 'react';
import { Platform } from 'react-native';
import { firestore, auth } from '@/config/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

// Platform-specific imports handled dynamically
let Notifications: typeof import('expo-notifications') | null = null;
let Device: typeof import('expo-device') | null = null;
let Constants: typeof import('expo-constants').default | null = null;

// Only import Expo modules on native platforms
if (Platform.OS !== 'web') {
  Notifications = require('expo-notifications');
  Device = require('expo-device');
  Constants = require('expo-constants').default;
  
  // Configure how notifications appear when app is in foreground
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export interface PushNotificationState {
  pushToken: string | null;
  notification: any | null;
  error: string | null;
  platform: 'ios' | 'android' | 'web' | null;
  permissionStatus: 'unknown' | 'granted' | 'denied' | 'prompt';
  requestPermission: () => Promise<void>;
}

/**
 * Hook to manage push notifications across all platforms.
 * Uses Expo notifications on mobile, FCM on web.
 * 
 * IMPORTANT: On web, call requestPermission() in response to a user gesture (button click)
 * as browsers block automatic permission requests.
 */
export function usePushNotifications(): PushNotificationState {
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'web' | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<'unknown' | 'granted' | 'denied' | 'prompt'>('unknown');
  
  const notificationListener = useRef<any>(null);
  const responseListener = useRef<any>(null);

  // Check current permission status on mount (without requesting)
  useEffect(() => {
    if (Platform.OS === 'web') {
      checkWebPermissionStatus();
    } else {
      checkMobilePermissionStatus();
    }
    
    // Set up listeners for when we do have permission
    if (Platform.OS === 'web') {
      setupWebPushListener(setNotification);
    } else if (Notifications) {
      // Listen for incoming notifications
      notificationListener.current = Notifications.addNotificationReceivedListener(
        (notification) => {
          setNotification(notification);
        }
      );

      // Listen for notification responses (user tapped notification)
      responseListener.current = Notifications.addNotificationResponseReceivedListener(
        (response) => {
          const data = response.notification.request.content.data;
          console.log('Notification tapped:', data);
        }
      );
    }

    return () => {
      if (Platform.OS !== 'web') {
        notificationListener.current?.remove();
        responseListener.current?.remove();
      }
    };
  }, []);

  // Check web permission status (without requesting)
  const checkWebPermissionStatus = () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setPermissionStatus('denied');
      return;
    }
    
    const status = Notification.permission;
    if (status === 'granted') {
      setPermissionStatus('granted');
      // Already have permission, get the token
      registerForWebPushAsync()
        .then(token => {
          if (token) {
            setPushToken(token);
            setPlatform('web');
            savePushToken(token, 'web');
          }
        })
        .catch(err => {
          setError(err.message);
        });
    } else if (status === 'denied') {
      setPermissionStatus('denied');
    } else {
      setPermissionStatus('prompt');
    }
  };

  // Check mobile permission status
  const checkMobilePermissionStatus = async () => {
    if (!Notifications) {
      setPermissionStatus('denied');
      return;
    }

    const { status } = await Notifications.getPermissionsAsync();
    if (status === 'granted') {
      setPermissionStatus('granted');
      // Already have permission, get the token
      registerForMobilePushAsync()
        .then(token => {
          if (token) {
            setPushToken(token);
            setPlatform(Platform.OS as 'ios' | 'android');
            savePushToken(token, Platform.OS as 'ios' | 'android');
          }
        })
        .catch(err => {
          setError(err.message);
        });
    } else if (status === 'denied') {
      setPermissionStatus('denied');
    } else {
      setPermissionStatus('prompt');
    }
  };

  // Request permission (call this from a user gesture!)
  const requestPermission = useCallback(async () => {
    setError(null);
    
    try {
      if (Platform.OS === 'web') {
        const token = await registerForWebPushAsync();
        if (token) {
          setPushToken(token);
          setPlatform('web');
          setPermissionStatus('granted');
          savePushToken(token, 'web');
        } else {
          setPermissionStatus('denied');
        }
      } else {
        const token = await registerForMobilePushAsync();
        if (token) {
          setPushToken(token);
          setPlatform(Platform.OS as 'ios' | 'android');
          setPermissionStatus('granted');
          savePushToken(token, Platform.OS as 'ios' | 'android');
        } else {
          setPermissionStatus('denied');
        }
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Push registration failed:', err);
    }
  }, []);

  return { pushToken, notification, error, platform, permissionStatus, requestPermission };
}

/**
 * Register for push notifications on mobile (Expo)
 */
async function registerForMobilePushAsync(): Promise<string | null> {
  if (!Notifications || !Device || !Constants) {
    console.log('Expo modules not available');
    return null;
  }

  // Push notifications only work on physical devices
  if (!Device.isDevice) {
    console.log('Push notifications require a physical device');
    return null;
  }

  // Check/request permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  if (finalStatus !== 'granted') {
    console.log('Push notification permission denied');
    return null;
  }

  // Get the Expo push token
  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  const token = await Notifications.getExpoPushTokenAsync({
    projectId,
  });

  // Android requires a notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  return token.data;
}

/**
 * Register for push notifications on web (FCM)
 * MUST be called from a user gesture (button click) on web!
 */
async function registerForWebPushAsync(): Promise<string | null> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    console.log('Web notifications not supported');
    return null;
  }

  // Check if service workers are supported
  if (!('serviceWorker' in navigator)) {
    console.log('Service workers not supported');
    return null;
  }

  // Request permission (this will show the browser prompt if called from user gesture)
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    console.log('Web notification permission denied');
    return null;
  }

  try {
    // Dynamically import Firebase messaging for web
    const { getMessaging, getToken } = await import('firebase/messaging');
    const { getApp } = await import('firebase/app');
    
    const app = getApp();
    const messaging = getMessaging(app);
    
    // Get VAPID key from environment
    const vapidKey = process.env.EXPO_PUBLIC_FIREBASE_VAPID_KEY;
    
    if (!vapidKey) {
      console.warn('VAPID key not configured. Set EXPO_PUBLIC_FIREBASE_VAPID_KEY in your environment.');
    }

    // Register service worker
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    console.log('Service worker registered:', registration);
    
    // Wait for service worker to be ready
    await navigator.serviceWorker.ready;
    
    // Send Firebase config to service worker
    const firebaseConfig = {
      apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
    };
    
    if (registration.active) {
      registration.active.postMessage({
        type: 'FIREBASE_CONFIG',
        config: firebaseConfig,
      });
    }

    const token = await getToken(messaging, { 
      vapidKey,
      serviceWorkerRegistration: registration,
    });
    
    console.log('FCM web token:', token);
    return token;
  } catch (error) {
    console.error('Error getting FCM token:', error);
    throw error;
  }
}

/**
 * Set up listener for web push messages when app is in foreground
 */
async function setupWebPushListener(setNotification: (n: any) => void): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    const { getMessaging, onMessage } = await import('firebase/messaging');
    const { getApp } = await import('firebase/app');
    
    const app = getApp();
    const messaging = getMessaging(app);
    
    onMessage(messaging, (payload) => {
      console.log('Web push message received:', payload);
      setNotification(payload);
      
      // Show notification manually since onMessage only fires in foreground
      if (Notification.permission === 'granted' && payload.notification) {
        new Notification(payload.notification.title || 'Modi', {
          body: payload.notification.body,
          icon: '/icon.png',
          data: payload.data,
        });
      }
    });
  } catch (error) {
    console.error('Error setting up web push listener:', error);
  }
}

/**
 * Save the push token to Firestore for this user
 */
async function savePushToken(token: string, platform: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) {
    console.log('No user logged in, cannot save push token');
    return;
  }

  try {
    // Determine token type for the Cloud Function
    const tokenType = platform === 'web' ? 'fcm' : 'expo';
    
    await setDoc(doc(firestore, 'pushTokens', user.uid), {
      token,
      tokenType,
      platform,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    console.log('Push token saved for user:', user.uid, 'platform:', platform);
  } catch (error) {
    console.error('Error saving push token:', error);
  }
}
