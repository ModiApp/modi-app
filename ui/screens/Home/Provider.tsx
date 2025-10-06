import { useRouter } from "expo-router";
import React, { createContext, useState } from "react";

import { useCreateGame } from "@/hooks/useCreateGame";
import { useWarmUpServer } from "@/hooks/useWarmUpServer";
import { useUsername } from "@/providers/Username";
import type { HomeScreenProps } from "./Base";

const defaultContextValue: HomeScreenProps = {
  isCreatingGame: false,
  shouldAskForUsername: false,
  onCreateGameBtnPressed() {},
  onJoinGameBtnPressed() {},
};

export const HomeScreenContext =
  createContext<HomeScreenProps>(defaultContextValue);

export default function HomeScreenProvider(props: React.PropsWithChildren) {
  const router = useRouter();
  const [shouldAskForUsername, setShouldAskForUsername] = useState(false);
  const username = useUsername();
  const { createGame, isCreatingGame } = useCreateGame();

  // Awaken the server as soon as a user reaches the home screen
  // since we're no longer paying to keep the server awake 24/7
  useWarmUpServer();

  return (
    <HomeScreenContext.Provider
      value={{
        isCreatingGame,
        shouldAskForUsername: shouldAskForUsername && !username.value,
        onCreateGameBtnPressed: () => {
          if (!username.value) {
            setShouldAskForUsername(true);
            return;
          }
          createGame();
        },
        onJoinGameBtnPressed: () => {
          if (!username.value) {
            setShouldAskForUsername(true);
            return;
          }
          router.push("/join-lobby");
        },
      }}
    >
      {props.children}
    </HomeScreenContext.Provider>
  );
}
