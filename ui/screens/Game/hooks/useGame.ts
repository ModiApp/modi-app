import type { Game } from "@/api/src/types";
import { firestore } from "@/config/firebase";
import { useAuth } from "@/providers/Auth";
import { useRouter } from "expo-router";
import { doc, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";

/** Exports a live subscription to a game. If the game is not found, it will redirect to the home screen. */
export function useGame(gameId: string): Game | null | undefined {
  const [game, setGame] = useState<Game | null | undefined>(undefined);
  const router = useRouter();
  const { isLoading: isAuthLoading, userId } = useAuth();

  useEffect(() => {
    // Don't subscribe to Firestore until auth is ready.
    // On mobile Safari, auth can be slower than on desktop Chrome.
    // Subscribing before auth is ready can cause permission errors or empty snapshots,
    // which triggers a premature redirect to "/" (the green screen bug).
    if (isAuthLoading || !userId) {
      return;
    }

    return subscribeToGame(gameId, (game) => {
      setGame(game);
      if (game === null) {
        router.replace("/");
      }
    });
  }, [gameId, router, isAuthLoading, userId]);

  return game;
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