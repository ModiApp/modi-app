import * as admin from 'firebase-admin';
import * as path from 'path';

const serviceAccount = require(path.join(process.env.HOME!, 'clawd', 'modi-firebase-sa.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://modi-again-b0b21-default-rtdb.firebaseio.com'
});

const db = admin.firestore();

async function check() {
  const snapshot = await db.collection('archivedGames').get();
  console.log('Archived games count:', snapshot.size);
  
  // Group by reason
  const reasons: Record<string, number> = {};
  snapshot.docs.forEach(doc => {
    const data = doc.data();
    const reason = data._archiveMetadata?.archiveReason || 'unknown';
    reasons[reason] = (reasons[reason] || 0) + 1;
  });
  
  console.log('\nBy reason:');
  Object.entries(reasons).forEach(([reason, count]) => {
    console.log(`  ${reason}: ${count}`);
  });
}

check().then(() => process.exit(0)).catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
