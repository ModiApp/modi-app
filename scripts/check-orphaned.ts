import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
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
const firestore = getFirestore(app);
const database = getDatabase(app);
const auth = getAuth(app);

async function checkOrphaned() {
  await signInAnonymously(auth);
  
  // Get all presence game IDs
  const presenceRef = ref(database, 'presence');
  const presenceSnapshot = await get(presenceRef);
  const presenceData = presenceSnapshot.val() || {};
  const gameIds = Object.keys(presenceData);
  
  console.log(`Checking ${gameIds.length} presence records for orphans...\n`);
  
  for (const gameId of gameIds) {
    const gameDoc = await getDoc(doc(firestore, 'games', gameId));
    const exists = gameDoc.exists();
    const status = exists ? gameDoc.data()?.status : 'NOT FOUND';
    const players = Object.keys(presenceData[gameId] || {}).length;
    
    console.log(`${gameId}: ${exists ? '✓' : '✗'} game ${status}, ${players} presence records`);
    
    if (!exists) {
      console.log(`  ⚠️  ORPHANED - should be cleaned up!`);
    }
  }
}

checkOrphaned().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
