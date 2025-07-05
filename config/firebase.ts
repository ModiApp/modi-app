import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import { connectFunctionsEmulator, getFunctions } from 'firebase/functions';

// Your Firebase configuration
// You'll need to replace these with your actual Firebase project credentials
// For production, consider using environment variables
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "your-api-key",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "your-project-id.firebaseapp.com",
  databaseURL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL || "https://your-project-id-default-rtdb.firebaseio.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "your-project-id",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "your-project-id.appspot.com",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "your-messaging-sender-id",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "your-app-id"
};

// Check if Firebase is properly configured
const isFirebaseConfigured = firebaseConfig.apiKey !== "your-api-key";

if (!isFirebaseConfigured) {
  console.warn(
    "⚠️ Firebase is not configured. Please update the firebaseConfig in config/firebase.ts " +
    "or set the appropriate environment variables. See FIREBASE_SETUP.md for instructions."
  );
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const firestore = getFirestore(app);
const functions = getFunctions(app);
const auth = getAuth(app);

// Connect to emulators in development
const isDevelopment = process.env.NODE_ENV === 'development' || __DEV__;

if (isDevelopment && isFirebaseConfigured) {
  try {
    // Connect to Firestore emulator
    connectFirestoreEmulator(firestore, 'localhost', 8080);
    console.log('🔗 Connected to Firestore emulator on localhost:8080');
    
    // Connect to Functions emulator
    connectFunctionsEmulator(functions, 'localhost', 5001);
    console.log('🔗 Connected to Functions emulator on localhost:5001');
    
    // Connect to Realtime Database emulator (if needed)
    // connectDatabaseEmulator(database, 'localhost', 9000);
    // console.log('🔗 Connected to Realtime Database emulator on localhost:9000');
  } catch (error) {
    console.log('⚠️ Emulator connection failed (this is normal if emulators are not running):', error);
  }
}


export { auth, database, firestore, functions, isFirebaseConfigured };

