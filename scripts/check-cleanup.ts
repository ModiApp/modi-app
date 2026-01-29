import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';
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

async function checkData() {
  console.log('Signing in anonymously...');
  await signInAnonymously(auth);
  console.log('Signed in!\n');
  
  const now = Date.now();
  
  console.log('=== GAMES COLLECTION ===\n');
  
  // Check games by status
  for (const status of ['gathering-players', 'active', 'ended']) {
    const q = query(collection(firestore, 'games'), where('status', '==', status));
    const snapshot = await getDocs(q);
    console.log(`${status}: ${snapshot.size} games`);
    
    let staleCount = 0;
    snapshot.docs.slice(0, 10).forEach(doc => {
      const data = doc.data();
      const updatedAt = data.updatedAt?.toMillis?.() || data.createdAt?.toMillis?.() || 0;
      const ageHours = (now - updatedAt) / (60 * 60 * 1000);
      
      if (status === 'gathering-players' && ageHours > 2) staleCount++;
      if (status === 'active' && ageHours > 24) staleCount++;
      if (status === 'ended' && ageHours > 168) staleCount++; // 7 days
      
      if (ageHours > 1) {
        console.log(`  - ${doc.id}: ${ageHours.toFixed(1)}h old`);
      }
    });
    if (staleCount > 0) {
      console.log(`  ⚠️  ${staleCount} should have been cleaned up!`);
    }
  }
  
  console.log('\n=== ARCHIVED GAMES ===\n');
  try {
    const archivedSnapshot = await getDocs(collection(firestore, 'archivedGames'));
    console.log(`Total archived: ${archivedSnapshot.size}`);
    
    const reasons: Record<string, number> = {};
    archivedSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const reason = data.archiveReason || 'unknown';
      reasons[reason] = (reasons[reason] || 0) + 1;
    });
    Object.entries(reasons).forEach(([reason, count]) => {
      console.log(`  - ${reason}: ${count}`);
    });
  } catch (e: any) {
    console.log('Could not read archivedGames:', e.code || e.message);
  }
  
  console.log('\n=== PRESENCE DATA (Realtime DB) ===\n');
  try {
    const presenceRef = ref(database, 'presence');
    const presenceSnapshot = await get(presenceRef);
    const presenceData = presenceSnapshot.val() || {};
    const gameIds = Object.keys(presenceData);
    console.log(`Presence records: ${gameIds.length}`);
    gameIds.slice(0, 5).forEach(id => {
      const players = Object.keys(presenceData[id] || {}).length;
      console.log(`  - ${id}: ${players} players`);
    });
  } catch (e: any) {
    console.log('Could not read presence:', e.code || e.message);
  }
}

checkData().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
