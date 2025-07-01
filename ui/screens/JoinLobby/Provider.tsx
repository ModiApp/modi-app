import { useRouter } from "expo-router";
import React, { createContext } from "react";
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
  const router = useRouter();
  return (
    <JoinLobbyContext.Provider
      value={{
        ...defaultContextValue,
        onCancel: () => router.push("/"),
        onLobbyIdSet: (lobbyId) => router.push(`/lobby?lobbyId=${lobbyId}`),
      }}
    >
      {props.children}
    </JoinLobbyContext.Provider>
  );
}
