import { useRouter } from "expo-router";
import React, { createContext, useCallback, useEffect, useState, useRef } from "react";

import { useCreateGame } from "@/hooks/useCreateGame";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { useWarmUpServer } from "@/hooks/useWarmUpServer";
import { useUsername } from "@/providers/Username";
import { validateUsername } from "@/utils/validation";
import type { HomeScreenProps } from "./Base";

const defaultContextValue: HomeScreenProps = {
  isCreatingGame: false,
  shouldAskForUsername: false,
  isUsernameValid: false,
  usernameError: null,
  onAboutPress() {},
  onCreateGameBtnPressed() {},
  onJoinGameBtnPressed() {},
  onUsernameValidationChange() {},
};

export const HomeScreenContext =
  createContext<HomeScreenProps>(defaultContextValue);

export default function HomeScreenProvider(props: React.PropsWithChildren) {
  const router = useRouter();
  const [shouldAskForUsername, setShouldAskForUsername] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const username = useUsername();
  const { createGame, isCreatingGame } = useCreateGame();
  const { showPrompt: showPWAPrompt, isReady: isPWAReady } = usePWAInstall();
  const hasShownPWAPrompt = useRef(false);

  // Validate initial username on mount and when username changes
  const isUsernameValid = validateUsername(username.value).isValid;

  // Awaken the server as soon as a user reaches the home screen
  // since we're no longer paying to keep the server awake 24/7
  useWarmUpServer();

  const handleValidationChange = useCallback(
    (isValid: boolean, error: string | null) => {
      setUsernameError(error);
      // Clear the "enter username" prompt if they start typing a valid username
      if (isValid && shouldAskForUsername) {
        setShouldAskForUsername(false);
      }
      
      // Show PWA install prompt when username becomes valid (once per session)
      // This is the optimal time: before they join a game, so they install first
      // and play with the correct auth token (avoids mid-game disconnection)
      if (isValid && isPWAReady && !hasShownPWAPrompt.current) {
        hasShownPWAPrompt.current = true;
        showPWAPrompt();
      }
    },
    [shouldAskForUsername, isPWAReady, showPWAPrompt]
  );

  const handleCreateGame = useCallback(() => {
    if (!isUsernameValid) {
      setShouldAskForUsername(true);
      const validation = validateUsername(username.value);
      setUsernameError(validation.error);
      return;
    }
    createGame();
  }, [isUsernameValid, username.value, createGame]);

  const handleJoinGame = useCallback(() => {
    if (!isUsernameValid) {
      setShouldAskForUsername(true);
      const validation = validateUsername(username.value);
      setUsernameError(validation.error);
      return;
    }
    router.push("/join-lobby");
  }, [isUsernameValid, username.value, router]);

  return (
    <HomeScreenContext.Provider
      value={{
        isCreatingGame,
        shouldAskForUsername: shouldAskForUsername && !isUsernameValid,
        isUsernameValid,
        usernameError,
        onCreateGameBtnPressed: handleCreateGame,
        onJoinGameBtnPressed: handleJoinGame,
        onAboutPress: () => {
          router.push("/about");
        },
        onUsernameValidationChange: handleValidationChange,
      }}
    >
      {props.children}
    </HomeScreenContext.Provider>
  );
}
