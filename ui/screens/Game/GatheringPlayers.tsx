import { InitialGameState } from "@/functions/src/types";
import { useAuth } from "@/providers/Auth";
import React from "react";
import LobbyScreen from "../Lobby/Base";

export function GatheringPlayers(props: { game: InitialGameState }) {
  const { userId } = useAuth();

  return (
    <LobbyScreen
      game={props.game}
      currUserId={userId || ""}
      showUsernameInput={false}
      onInviteFriendsBtnPressed={() => {}}
      onStartGameBtnPressed={() => {}}
      onJoinGameBtnPressed={() => {}}
      onBackBtnPressed={() => {}}
    />
  );
}
