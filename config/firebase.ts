import AsyncStorage from '@react-native-async-storage/async-storage';
import { FirebaseError, initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth, getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import { Platform } from 'react-native';
import config from '../firebase.json';

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
const firestore = getFirestore(app);

const auth = (() => {
  try {
    // on mobile we need to configure persistence manually, on web it defaults to localStorage which is what we want
    return Platform.OS === 'web' ? getAuth(app) : initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage)
    })
  } catch (error: unknown) {
    // when hot reloading on mobile, we get an error about auth already initialized, so we return the existing instance
    if (error instanceof FirebaseError && error.code === 'auth/already-initialized') {
      console.log('Auth already initialized, returning existing instance');
      return getAuth(app);
    }
    throw error;
  }
})();


// Connect to emulators in development
const isDevelopment = process.env.NODE_ENV === 'development' || __DEV__;

// Pass in computer's LAN IP to connect to emulators from other devices on the network
const EMULATOR_HOST = process.env.EXPO_PUBLIC_EMULATOR_HOST || '127.0.0.1';

if (isDevelopment && isFirebaseConfigured && !process.env.EXPO_PUBLIC_CONNECT_TO_PROD) {
  try {
    // Connect to Firestore emulator
    connectFirestoreEmulator(firestore, EMULATOR_HOST, config.emulators.firestore.port);
    console.log(`🔗 Connected to Firestore emulator on ${EMULATOR_HOST}:${config.emulators.firestore.port}`);
    
    // Connect to Auth emulator
    connectAuthEmulator(auth, `http://${EMULATOR_HOST}:${config.emulators.auth.port}`, { disableWarnings: true });
    console.log(`🔗 Connected to Auth emulator on http://${EMULATOR_HOST}:${config.emulators.auth.port}`);
  } catch (error) {
    console.log('⚠️ Emulator connection failed (this is normal if emulators are not running):', error);
  }
} else {
  console.log('🔗 Connected to Firebase in production mode');
}

export { auth, firestore };

