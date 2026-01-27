// Firebase Cloud Messaging Service Worker for Web Push Notifications
// Event handlers MUST be registered synchronously at the top level

importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

// Firebase config - must be hardcoded for synchronous initialization
// These are public keys (not secrets) - safe to include in client code
const firebaseConfig = {
  apiKey: "AIzaSyDDr_45nqsYnaPev5Pb82FcnTMBXSD-4Fs",
  authDomain: "modi-again-b0b21.firebaseapp.com",
  databaseURL: "https://modi-again-b0b21-default-rtdb.firebaseio.com/",
  projectId: "modi-again-b0b21",
  storageBucket: "modi-again-b0b21.firebasestorage.app",
  messagingSenderId: "347214088273",
  appId: "1:347214088273:web:ec2a779b074bb4a4a09070",
};

// Initialize Firebase immediately (synchronously)
firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Register push handler synchronously at top level
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

console.log('[SW] Firebase messaging initialized');

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

self.addEventListener('install', (event) => {
  console.log('[SW] Service worker installed');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Service worker activated');
  event.waitUntil(clients.claim());
});
