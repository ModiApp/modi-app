import type { ActiveGame, Game } from "@/api/src/types";
import { isActive } from "@/api/src/types";
import { PresenceMap, usePresence } from "@/hooks/usePresence";
import { useAuth } from "@/providers/Auth";
import { createContext, useContext, useEffect, useRef } from "react";
import { AccessibilityInfo, Platform } from "react-native";

interface PlayingContextValue {
  game: Game;
  presence: PresenceMap;
}

const PlayingContext = createContext<PlayingContextValue | null>(null);

/**
 * Announces a message to screen readers
 */
function announceToScreenReader(message: string) {
  // AccessibilityInfo.announceForAccessibility is available on both iOS and Android
  if (Platform.OS !== "web") {
    AccessibilityInfo.announceForAccessibility(message);
  }
  // For web, we could use ARIA live regions, but that requires DOM manipulation
  // which is handled differently in React Native Web
}

/**
 * Hook to announce turn changes to screen readers
 */
function useTurnAnnouncements(game: Game) {
  const { userId: currentUserId } = useAuth();
  const prevActivePlayer = useRef<string | null>(null);
  const prevRoundState = useRef<string | null>(null);

  useEffect(() => {
    // Only announce for active games
    if (!isActive(game)) {
      prevActivePlayer.current = null;
      prevRoundState.current = null;
      return;
    }

    const activeGame: ActiveGame = game;
    const activePlayer = activeGame.activePlayer;
    const roundState = activeGame.roundState;
    const playerName = activeGame.usernames[activePlayer];
    const isCurrentUser = activePlayer === currentUserId;

    // Announce turn changes
    if (
      prevActivePlayer.current !== null &&
      prevActivePlayer.current !== activePlayer &&
      roundState === "playing"
    ) {
      if (isCurrentUser) {
        announceToScreenReader("It is now your turn");
      } else {
        announceToScreenReader(`It is now ${playerName}'s turn`);
      }
    }

    // Announce round state changes
    if (prevRoundState.current !== null && prevRoundState.current !== roundState) {
      switch (roundState) {
        case "pre-deal":
          announceToScreenReader("New round starting. Waiting for cards to be dealt.");
          break;
        case "tallying":
          announceToScreenReader("Round ended. Tallying scores.");
          break;
      }
    }

    prevActivePlayer.current = activePlayer;
    prevRoundState.current = roundState;
  }, [game, currentUserId]);
}

export function PlayingProvider({
  children,
  game,
}: {
  children: React.ReactNode;
  game: Game;
}) {
  const presence = usePresence(game.gameId);

  // Enable turn announcements for screen readers
  useTurnAnnouncements(game);
  
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
