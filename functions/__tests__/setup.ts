import functionsTest from 'firebase-functions-test';

// Set emulator environment variables BEFORE initializing anything
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
process.env.FIREBASE_DATABASE_EMULATOR_HOST = 'localhost:9000';

// Initialize the Firebase Functions test SDK
// This must happen before importing any functions that use firebase-admin
export const testEnv = functionsTest({
  projectId: 'demo-modi-test',
});

// Now we can import firebase-admin (it will connect to emulators)
import * as admin from 'firebase-admin';

// Initialize admin SDK for emulator use
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'demo-modi-test',
    databaseURL: 'http://localhost:9000/?ns=demo-modi-test',
  });
}

// Get references to emulated services
export const getFirestore = () => admin.firestore();
export const getDatabase = () => admin.database();

// Helper to clear all data between tests
export async function clearFirestore() {
  const firestore = getFirestore();
  const collections = await firestore.listCollections();
  
  for (const collection of collections) {
    const docs = await collection.listDocuments();
    for (const doc of docs) {
      await doc.delete();
    }
  }
}

export async function clearDatabase() {
  const database = getDatabase();
  await database.ref().remove();
}

export async function clearAll() {
  await Promise.all([clearFirestore(), clearDatabase()]);
}

// Cleanup after all tests
afterAll(async () => {
  await testEnv.cleanup();
});
