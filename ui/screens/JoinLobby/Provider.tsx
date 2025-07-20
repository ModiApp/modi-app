import { useJoinLobby } from "@/hooks/useJoinLobby";
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
  const { joinLobby, isJoining } = useJoinLobby();

  const handleLobbyIdSet = (lobbyId: string) => {
    joinLobby(lobbyId).then(() => {
      router.push(`/games/${lobbyId}`);
    });
  };

  const handleCancel = () => {
    router.replace("/");
  };

  return (
    <JoinLobbyContext.Provider
      value={{
        isValidatingLobbyId: isJoining,
        validationError: undefined,
        isLobbyIdInvalid: false, // This will be handled by the error state
        onLobbyIdSet: handleLobbyIdSet,
        onCancel: handleCancel,
      }}
    >
      {props.children}
    </JoinLobbyContext.Provider>
  );
}
