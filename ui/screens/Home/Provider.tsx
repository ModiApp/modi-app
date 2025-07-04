import { useRouter } from "expo-router";
import React, { createContext } from "react";

import { useCreateGame } from "@/hooks/useCreateGame";
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
  const { createGame, isCreatingGame } = useCreateGame();

  return (
    <HomeScreenContext.Provider
      value={{
        isCreatingGame,
        shouldAskForUsername: false,
        onCreateGameBtnPressed: createGame,
        onJoinGameBtnPressed: () => {
          router.push("/join-lobby");
        },
      }}
    >
      {props.children}
    </HomeScreenContext.Provider>
  );
}
