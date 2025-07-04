import { InitialGameState } from "@/functions/src/types";
import { useJoinLobby } from "@/hooks/useJoinLobby";
import { useLeaveGame } from "@/hooks/useLeaveGame";
import { useAuth } from "@/providers/Auth";
import React from "react";
import LobbyScreen from "../Lobby/Base";

export function GatheringPlayers(props: { game: InitialGameState }) {
  const { userId } = useAuth();
  const { leaveGame } = useLeaveGame();
  const { joinLobby } = useJoinLobby();

  return (
    <LobbyScreen
      game={props.game}
      currUserId={userId || ""}
      showUsernameInput={false}
      onInviteFriendsBtnPressed={() => {}}
      onStartGameBtnPressed={() => {}}
      onJoinGameBtnPressed={() => joinLobby(props.game.gameId)}
      onBackBtnPressed={leaveGame}
    />
  );
}
