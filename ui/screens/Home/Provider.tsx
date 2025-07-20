import { useRouter } from "expo-router";
import React, { createContext, useState } from "react";

import { useCreateGame } from "@/hooks/useCreateGame";
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
