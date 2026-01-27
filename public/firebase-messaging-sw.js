// Firebase Cloud Messaging Service Worker for Web Push Notifications
// This file handles push notifications when the app is in the background or closed

importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

// Firebase config will be passed via message from the main app
let firebaseConfig = null;

// Listen for config from main app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'FIREBASE_CONFIG') {
    firebaseConfig = event.data.config;
    initializeFirebase();
  }
});

function initializeFirebase() {
  if (!firebaseConfig) {
    console.log('[SW] No Firebase config yet, waiting...');
    return;
  }

  try {
    firebase.initializeApp(firebaseConfig);
    const messaging = firebase.messaging();
    
    // Handle background messages
    messaging.onBackgroundMessage((payload) => {
      console.log('[SW] Received background message:', payload);

      const notificationTitle = payload.notification?.title || "It's your turn!";
      const notificationOptions = {
        body: payload.notification?.body || 'Your turn in Modi',
        icon: '/icon.png',
        badge: '/icon.png',
        tag: payload.data?.gameId || 'modi-notification',
        data: payload.data,
        requireInteraction: true,
        vibrate: [200, 100, 200],
      };

      self.registration.showNotification(notificationTitle, notificationOptions);
    });
    
    console.log('[SW] Firebase initialized successfully');
  } catch (error) {
    // May already be initialized
    console.log('[SW] Firebase init error (may be already initialized):', error.message);
  }
}

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event);
  
  event.notification.close();

  const gameId = event.notification.data?.gameId;
  const urlToOpen = gameId ? `/game/${gameId}` : '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Check if there's already a window open
      for (const client of windowClients) {
        if ('focus' in client) {
          return client.focus().then(() => {
            if (gameId && client.navigate) {
              return client.navigate(urlToOpen);
            }
          });
        }
      }
      // If no window is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Try to initialize immediately if config was cached
// This helps with page refreshes
self.addEventListener('install', (event) => {
  console.log('[SW] Service worker installed');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Service worker activated');
  event.waitUntil(clients.claim());
});
