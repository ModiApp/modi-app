import type { Game } from "@/api/src/types";
import { PresenceMap, usePresence } from "@/hooks/usePresence";
import { createContext, useContext } from "react";

interface PlayingContextValue {
  game: Game;
  presence: PresenceMap;
}

const PlayingContext = createContext<PlayingContextValue | null>(null);

export function PlayingProvider({
  children,
  game,
}: {
  children: React.ReactNode;
  game: Game;
}) {
  const presence = usePresence(game.gameId);
  
  return (
    <PlayingContext.Provider value={{ game, presence }}>
      {children}
    </PlayingContext.Provider>
  );
}

export function useCurrentGame() {
  const context = useContext(PlayingContext);
  if (!context) {
    throw new Error("useCurrentGame must be used within a PlayingProvider");
  }
  return context;
}
