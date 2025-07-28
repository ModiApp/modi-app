import { cert, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

export interface ScriptDependencies {
  firestore: FirebaseFirestore.Firestore;
}

export function runScript(script: (deps: ScriptDependencies) => Promise<void>) {
  const app = initializeApp({
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    credential: cert(require('../google-service-account.json')),
  });
  const firestore = getFirestore(app);
  console.log('Running script...');
  return script({ firestore }).catch((err) => {
    console.error(err);
    process.exit(1);
  }).then(() => {
    console.log('Script completed successfully');
    process.exit(0);
  });
}