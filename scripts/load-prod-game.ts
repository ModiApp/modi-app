/**
 * A script to load a game from the production database into the emulator.
 * 
 * This is useful for testing the app with a real game.
 * 
 * Usage:
 * yarn tsx scripts/load-prod-game.ts <game-id>
 */

import { runScript } from "./run-script";

runScript(async function loadProdGame({ firestore }) {
  const gameId = process.argv[2];
  const gameDoc = await firestore.collection('games').doc(gameId).get();
  if (gameDoc.exists) {
    console.log('✅ Game found:', gameDoc.data());
  } else {
    console.log('❌ Game not found');
  }
});
