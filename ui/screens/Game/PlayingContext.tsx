import type { Game } from "@/api/src/types";
import { createContext, useContext } from "react";

const PlayingContext = createContext<{ game: Game } | null>(null);

export function PlayingProvider({
  children,
  game,
}: {
  children: React.ReactNode;
  game: Game;
}) {
  return (
    <PlayingContext.Provider value={{ game }}>
      {children}
    </PlayingContext.Provider>
  );
}

export function useCurrentGame() {
  const context = useContext(PlayingContext);
  if (!context) {
    throw new Error("useActiveGame must be used within a PlayingProvider");
  }
  return context;
}
