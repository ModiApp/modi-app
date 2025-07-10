import React, { createContext, useContext, useState } from "react";
import { PlayerPosition } from "./types";

interface CardTableContextValue {
  radius: number;
  playerPositions: { [playerId: string]: PlayerPosition };
  setPlayerPositions(positions: { [playerId: string]: PlayerPosition }): void;
}

const CardTableContext = createContext<CardTableContextValue>({
  radius: 0,
  playerPositions: {},
  setPlayerPositions: () => {},
});

export function useCardTable() {
  const context = useContext(CardTableContext);
  if (!context) {
    throw new Error("useCardTable must be used within a CardTableProvider");
  }
  return context;
}

interface CardTableProviderProps {
  children: React.ReactNode;
  radius: number;
}

export function CardTableProvider({
  children,
  radius,
}: CardTableProviderProps) {
  const [playerPositions, setPlayerPositions] = useState<{
    [playerId: string]: PlayerPosition;
  }>({});

  return (
    <CardTableContext.Provider
      value={{ radius, playerPositions, setPlayerPositions }}
    >
      {children}
    </CardTableContext.Provider>
  );
}
