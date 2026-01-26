import { testEnv, getFirestore, getDatabase, clearAll } from './setup';

describe('Test Infrastructure', () => {
  afterEach(async () => {
    await clearAll();
  });

  it('should connect to Firestore emulator', async () => {
    const firestore = getFirestore();
    
    // Write a test document
    const docRef = firestore.collection('test').doc('test-doc');
    await docRef.set({ value: 'test' });
    
    // Read it back
    const doc = await docRef.get();
    expect(doc.exists).toBe(true);
    expect(doc.data()?.value).toBe('test');
  });

  it('should connect to Realtime Database emulator', async () => {
    const database = getDatabase();
    
    // Write test data
    const ref = database.ref('test/test-key');
    await ref.set({ value: 'test' });
    
    // Read it back
    const snapshot = await ref.once('value');
    expect(snapshot.exists()).toBe(true);
    expect(snapshot.val()?.value).toBe('test');
  });

  it('should clear data between tests', async () => {
    const firestore = getFirestore();
    const database = getDatabase();
    
    // Write some data
    await firestore.collection('test').doc('doc1').set({ value: 1 });
    await database.ref('test/key1').set({ value: 1 });
    
    // Clear
    await clearAll();
    
    // Verify cleared
    const firestoreDoc = await firestore.collection('test').doc('doc1').get();
    const dbSnapshot = await database.ref('test/key1').once('value');
    
    expect(firestoreDoc.exists).toBe(false);
    expect(dbSnapshot.exists()).toBe(false);
  });
});
