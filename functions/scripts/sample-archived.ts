import * as admin from 'firebase-admin';
import * as path from 'path';

const serviceAccount = require(path.join(process.env.HOME!, 'clawd', 'modi-firebase-sa.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://modi-again-b0b21-default-rtdb.firebaseio.com'
});

const db = admin.firestore();

async function check() {
  const snapshot = await db.collection('archivedGames').limit(1).get();
  const doc = snapshot.docs[0];
  const data = doc.data();
  
  console.log('Sample archived game:', doc.id);
  console.log('---');
  
  Object.entries(data).forEach(([key, value]) => {
    // Only show non-object properties (scalars, arrays of primitives)
    if (value === null || value === undefined) {
      console.log(`${key}: null`);
    } else if (typeof value !== 'object') {
      console.log(`${key}: ${value}`);
    } else if (value instanceof admin.firestore.Timestamp) {
      console.log(`${key}: ${value.toDate().toISOString()}`);
    } else if (Array.isArray(value) && value.every(v => typeof v !== 'object')) {
      console.log(`${key}: [${value.join(', ')}]`);
    } else {
      console.log(`${key}: [object]`);
    }
  });
}

check().then(() => process.exit(0)).catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
