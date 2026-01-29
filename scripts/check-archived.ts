import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getCountFromServer } from 'firebase/firestore';
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
const auth = getAuth(app);

async function check() {
  await signInAnonymously(auth);
  
  try {
    const archivedRef = collection(firestore, 'archivedGames');
    const snapshot = await getCountFromServer(archivedRef);
    console.log(`Archived games: ${snapshot.data().count}`);
  } catch (e: any) {
    console.log('Could not count archived games:', e.code || e.message);
  }
  
  // Also check active games
  const gamesRef = collection(firestore, 'games');
  const gamesSnapshot = await getCountFromServer(gamesRef);
  console.log(`Active games: ${gamesSnapshot.data().count}`);
}

check().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
