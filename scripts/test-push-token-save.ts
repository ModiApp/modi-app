/**
 * Test script to verify the push token save flow works correctly
 * Run with: EXPO_PUBLIC_EMULATOR_HOST=localhost npx tsx scripts/test-push-token-save.ts
 */

import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, signInAnonymously } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyDDr_45nqsYnaPev5Pb82FcnTMBXSD-4Fs",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "modi-again-b0b21.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "modi-again-b0b21",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "modi-again-b0b21.firebasestorage.app",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "347214088273",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:347214088273:web:ec2a779b074bb4a4a09070",
};

async function main() {
  console.log('🧪 Testing push token save flow...\n');

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const firestore = getFirestore(app);

  // Connect to emulators if running locally
  const emulatorHost = process.env.EXPO_PUBLIC_EMULATOR_HOST;
  if (emulatorHost) {
    console.log(`📡 Connecting to emulators on ${emulatorHost}...`);
    connectAuthEmulator(auth, `http://${emulatorHost}:9099`);
    connectFirestoreEmulator(firestore, emulatorHost, 8080);
  } else {
    console.log('🌐 Connecting to production Firebase...');
  }

  // Sign in anonymously
  console.log('\n1️⃣ Signing in anonymously...');
  const userCredential = await signInAnonymously(auth);
  const user = userCredential.user;
  console.log(`   ✅ Signed in as: ${user.uid}`);

  // Simulate a push token
  const fakeToken = `test-fcm-token-${Date.now()}`;
  console.log(`\n2️⃣ Saving test push token...`);
  console.log(`   Token: ${fakeToken.substring(0, 30)}...`);

  try {
    // Save the token (same logic as savePushToken)
    const tokenType = 'fcm';
    const platform = 'web';
    
    await setDoc(doc(firestore, 'pushTokens', user.uid), {
      token: fakeToken,
      tokenType,
      platform,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    
    console.log(`   ✅ Token saved successfully!`);

    // Verify the token was saved
    console.log('\n3️⃣ Verifying saved token...');
    const savedDoc = await getDoc(doc(firestore, 'pushTokens', user.uid));
    
    if (savedDoc.exists()) {
      const data = savedDoc.data();
      console.log(`   ✅ Token found in Firestore:`);
      console.log(`      - token: ${data.token?.substring(0, 30)}...`);
      console.log(`      - tokenType: ${data.tokenType}`);
      console.log(`      - platform: ${data.platform}`);
      console.log(`      - updatedAt: ${data.updatedAt?.toDate?.() || data.updatedAt}`);
    } else {
      console.log(`   ❌ Token NOT found in Firestore!`);
      process.exit(1);
    }

    console.log('\n✅ All tests passed!');
  } catch (error: any) {
    console.error(`\n❌ Error saving token:`, error.message);
    console.error(error);
    process.exit(1);
  }

  process.exit(0);
}

main().catch(console.error);
