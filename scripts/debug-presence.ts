import { initializeApp } from 'firebase/app';
import { getDatabase, ref, get } from 'firebase/database';
import { getAuth, signInAnonymously } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth(app);

async function debug() {
  await signInAnonymously(auth);
  
  // Check root of database to see structure
  const rootRef = ref(database);
  const rootSnapshot = await get(rootRef);
  const rootData = rootSnapshot.val() || {};
  
  console.log('Root keys:', Object.keys(rootData));
  
  // Check presence specifically
  const presenceRef = ref(database, 'presence');
  const presenceSnapshot = await get(presenceRef);
  const presenceData = presenceSnapshot.val();
  
  console.log('\nPresence data:');
  console.log(JSON.stringify(presenceData, null, 2));
}

debug().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
