import admin, { AppOptions } from 'firebase-admin';
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';


const isLocalEnv = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';

// In development or test against emulators, set the Auth emulator host BEFORE creating the Auth service
if (isLocalEnv && !process.env.CONNECT_TO_PROD) {
  process.env.FIREBASE_AUTH_EMULATOR_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST || '0.0.0.0:9099';
}

// Initialize Firebase Admin SDK
const appConfig: AppOptions = {
  projectId: process.env.FIREBASE_PROJECT_ID,
}
if (!isLocalEnv) {
  appConfig.credential = admin.credential.cert(
    JSON.parse(Buffer.from(process.env.GOOGLE_APPLICATION_CREDENTIAL_BASE64 || 'e30=', 'base64').toString())
  )
}

const app = initializeApp(appConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);


if (isLocalEnv && !process.env.CONNECT_TO_PROD) {
  // Connect to Firestore emulator
  db.settings({
    host: process.env.FIRESTORE_EMULATOR_HOST || '0.0.0.0:8080',
    ignoreUndefinedProperties: true
  });

  console.log(`🔗 Connected to Firestore emulator on ${process.env.FIRESTORE_EMULATOR_HOST || '0.0.0.0:8080'}`);

  // Auth emulator log (host already set before getAuth)
  console.log(`🔗 Connected to Auth emulator on ${process.env.FIREBASE_AUTH_EMULATOR_HOST}`);
} else {
  console.log('🔗 Connected to Firebase in production mode');
}