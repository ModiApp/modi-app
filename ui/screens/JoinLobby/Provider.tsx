import React, { createContext } from "react";
import useNavigation from "src/navigation/useNavigation";
import { JoinLobbyScreenProps } from "./Base";

const defaultContextValue: JoinLobbyScreenProps = {
  isLobbyIdInvalid: false,
  isValidatingLobbyId: false,
  validationError: undefined,
  onLobbyIdSet() {},
  onCancel() {},
};

export const JoinLobbyContext =
  createContext<JoinLobbyScreenProps>(defaultContextValue);

export default function JoinLobbyProvider(props: React.PropsWithChildren) {
  const navigation = useNavigation();
  return (
    <JoinLobbyContext.Provider
      value={{
        ...defaultContextValue,
        onCancel: () => navigation.navigate("Home"),
        onLobbyIdSet: (lobbyId) => navigation.navigate("Lobby", { lobbyId }),
      }}
    >
      {props.children}
    </JoinLobbyContext.Provider>
  );
}
