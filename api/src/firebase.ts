import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin SDK
const app = initializeApp({
  projectId: 'modi-again-b0b21', // Use a consistent project ID for development
});

export const db = getFirestore(app);
export const auth = getAuth(app);

// Connect to emulators in development
const isDevelopment = process.env.NODE_ENV === 'development';

if (isDevelopment && !process.env.CONNECT_TO_PROD) {
  // Connect to Firestore emulator
  db.settings({
    host: '127.0.0.1:8080',
    ssl: false
  });
  console.log('🔗 Connected to Firestore emulator on 127.0.0.1:8080');
  
  // Connect to Auth emulator
  process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
  console.log('🔗 Connected to Auth emulator on 127.0.0.1:9099');
} else {
  console.log('🔗 Connected to Firebase in production mode');
}