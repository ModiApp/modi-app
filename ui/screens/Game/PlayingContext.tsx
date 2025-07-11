import { ActiveGame } from "@/functions/src/types";
import { createContext, useContext } from "react";

const PlayingContext = createContext<{ game: ActiveGame } | null>(null);

export function PlayingProvider({
  children,
  game,
}: {
  children: React.ReactNode;
  game: ActiveGame;
}) {
  return (
    <PlayingContext.Provider value={{ game }}>
      {children}
    </PlayingContext.Provider>
  );
}

export function useActiveGame() {
  const context = useContext(PlayingContext);
  if (!context) {
    throw new Error("useActiveGame must be used within a PlayingProvider");
  }
  return context;
}
