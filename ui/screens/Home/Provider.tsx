import React, { createContext } from "react";

import useNavigation from "src/navigation/useNavigation";
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
  const navigation = useNavigation();

  return (
    <HomeScreenContext.Provider
      value={{
        isCreatingGame: false,
        shouldAskForUsername: false,
        onCreateGameBtnPressed() {},
        onJoinGameBtnPressed: () => {
          navigation.navigate("JoinLobby");
        },
      }}
    >
      {props.children}
    </HomeScreenContext.Provider>
  );
}
