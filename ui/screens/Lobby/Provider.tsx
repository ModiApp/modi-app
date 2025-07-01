import { useUsername } from "@/ui/providers/Username";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { createContext } from "react";
import { LobbyScreenProps } from "./Base";

const defaultContextValue: LobbyScreenProps = {
  lobbyId: "Lobby ID",
  currUserId: "User ID",
  attendees: [],
  showUsernameInput: true,
  onInviteFriendsBtnPressed: () => {
    console.log("Firing LobbyContext.onInviteFriendsBtnPressed");
  },
  onStartGameBtnPressed: () => {
    console.log("Firing LobbyContext.onStartGameBtnPressed");
  },
  onBackBtnPressed: () => {
    console.log("Firing LobbyContext.onBackBtnPressed");
  },
};

export const LobbyContext =
  createContext<LobbyScreenProps>(defaultContextValue);

export default function LobbyProvider({ children }: React.PropsWithChildren) {
  const router = useRouter();
  const { lobbyId } = useLocalSearchParams<{ lobbyId: string }>();
  return (
    <LobbyContext.Provider
      value={{
        lobbyId: lobbyId || defaultContextValue.lobbyId,
        currUserId: "User ID", // TODO
        attendees: [], // TODO
        showUsernameInput: !useUsername().value.length,
        onInviteFriendsBtnPressed: () => {
          console.log("Firing LobbyContext.onInviteFriendsBtnPressed");
        },
        onStartGameBtnPressed: () => {
          console.log("Firing LobbyContext.onStartGameBtnPressed");
        },
        onBackBtnPressed: () => router.push("/join-lobby"),
      }}
    >
      {children}
    </LobbyContext.Provider>
  );
}
