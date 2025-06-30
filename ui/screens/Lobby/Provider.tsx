import React, { createContext } from "react";
import useUsername from "src/providers/Username";
import { LobbyNavigationProps } from "src/navigation/types";
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

export default function LobbyProvider({
  navigation,
  route,
  children,
}: React.PropsWithChildren<LobbyNavigationProps>) {
  const lobbyId = route.params.lobbyId;
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
        onBackBtnPressed: () => navigation.navigate("JoinLobby"),
      }}
    >
      {children}
    </LobbyContext.Provider>
  );
}
