import { firestore } from "@/config/firebase";
import { Game } from "@/functions/src/types";
import { useRouter } from "expo-router";
import { doc, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";

/** Exports a live subscription to a game. If the game is not found, it will redirect to the home screen. */
export function useGame(gameId: string): Game | null | undefined {
  const [game, setGame] = useState<Game | null | undefined>(undefined);
  const router = useRouter();

  useEffect(() => {
    return subscribeToGame(gameId, (game) => {
      setGame(game);
      if (game === null) {
        router.replace("/");
      }
    });
  }, [gameId, router]);

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