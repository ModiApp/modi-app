import { firestore } from "@/config/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";

/** Exports a live subscription to a game */
export function useGame(gameId: string) {
  const [game, setGame] = useState<any>(null);
  useEffect(() => {
    return subscribeToGame(gameId, (game) => {
      console.log("Game updated:", game);
      setGame(game);
    });
  }, [gameId]);

  return game
}



const subscribeToGame = (gameId: string, callback: (gameState: any | null) => void): () => void => {
  const gameRef = doc(firestore, `games/${gameId}`);
  
  const unsubscribe = onSnapshot(gameRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.data());
    } else {
      callback(null);
    }
  });
  
  return () => {
      unsubscribe();
  };
};