import { useJoinLobby } from "@/hooks/useJoinLobby";
import { useRouter } from "expo-router";
import React, { createContext, useState } from "react";
import { JoinLobbyScreenProps } from "./Base";

const defaultContextValue: JoinLobbyScreenProps = {
  isLobbyIdInvalid: false,
  isValidatingLobbyId: false,
  validationError: undefined,
  lobbyId: "",
  onLobbyIdChange() {},
  onLobbyIdSet() {},
  onCancel() {},
};

export const JoinLobbyContext =
  createContext<JoinLobbyScreenProps>(defaultContextValue);

export default function JoinLobbyProvider(props: React.PropsWithChildren) {
  const router = useRouter();
  const { joinLobby, isJoining } = useJoinLobby();
  const [validationError, setValidationError] = useState<string | undefined>();
  const [lobbyId, setLobbyId] = useState("");

  const handleLobbyIdChange = (value: string) => {
    if (validationError) {
      setValidationError(undefined);
    }
    setLobbyId(value);
  };

  const handleLobbyIdSet = async (nextLobbyId: string) => {
    if (isJoining) {
      return;
    }

    setValidationError(undefined);

    const result = await joinLobby(nextLobbyId);

    if (!result.success) {
      setValidationError(result.errorMessage);
      setLobbyId("");
      return;
    }

    setLobbyId("");
  };

  const handleCancel = () => {
    router.replace("/");
    setLobbyId("");
    setValidationError(undefined);
  };

  return (
    <JoinLobbyContext.Provider
      value={{
        isValidatingLobbyId: isJoining,
        validationError,
        lobbyId,
        onLobbyIdChange: handleLobbyIdChange,
        isLobbyIdInvalid: Boolean(validationError), // This will be handled by the error state
        onLobbyIdSet: handleLobbyIdSet,
        onCancel: handleCancel,
      }}
    >
      {props.children}
    </JoinLobbyContext.Provider>
  );
}
