import admin, { AppOptions } from 'firebase-admin';
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';


const isDevelopment = process.env.NODE_ENV === 'development';

// Initialize Firebase Admin SDK
const appConfig: AppOptions = {
  projectId: process.env.FIREBASE_PROJECT_ID,
}
if (!isDevelopment) {
  appConfig.credential = admin.credential.cert(
    JSON.parse(Buffer.from(process.env.GOOGLE_APPLICATION_CREDENTIAL_BASE64, 'base64').toString())
  )
}

const app = initializeApp(appConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);


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