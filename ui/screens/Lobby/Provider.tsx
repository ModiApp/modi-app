import { useRouter } from "expo-router";
import React, { createContext } from "react";
import { LobbyScreenProps } from "./Base";

const defaultContextValue: LobbyScreenProps = {
  game: {
    gameId: "Game ID",
    gameState: "gathering-players",
    players: [],
    playerInfo: {},
    host: "Host ID",
  },
  currUserId: "User ID",
  onInviteFriendsBtnPressed: () => {
    console.log("Firing LobbyContext.onInviteFriendsBtnPressed");
  },
  onStartGameBtnPressed: () => {
    console.log("Firing LobbyContext.onStartGameBtnPressed");
  },
  onJoinGameBtnPressed: () => {
    console.log("Firing LobbyContext.onJoinGameBtnPressed");
  },
  onBackBtnPressed: () => {
    console.log("Firing LobbyContext.onBackBtnPressed");
  },
};

export const LobbyContext =
  createContext<LobbyScreenProps>(defaultContextValue);

export default function LobbyProvider({ children }: React.PropsWithChildren) {
  const router = useRouter();
  return (
    <LobbyContext.Provider
      value={{
        game: defaultContextValue.game,
        currUserId: "User ID",
        onInviteFriendsBtnPressed: () => {
          console.log("Firing LobbyContext.onInviteFriendsBtnPressed");
        },
        onStartGameBtnPressed: () => {
          console.log("Firing LobbyContext.onStartGameBtnPressed");
        },
        onJoinGameBtnPressed: () => {
          console.log("Firing LobbyContext.onJoinGameBtnPressed");
        },
        onBackBtnPressed: () => router.push("/join-lobby"),
      }}
    >
      {children}
    </LobbyContext.Provider>
  );
}
