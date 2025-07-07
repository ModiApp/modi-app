import { InitialGame } from "@/functions/src/types";
import { useJoinLobby } from "@/hooks/useJoinLobby";
import { useLeaveGame } from "@/hooks/useLeaveGame";
import { useStartGame } from "@/hooks/useStartGame";
import { useAuth } from "@/providers/Auth";
import React from "react";
import LobbyScreen from "../Lobby/Base";

export function GatheringPlayers(props: { game: InitialGame }) {
  const { userId } = useAuth();
  const { leaveGame } = useLeaveGame();
  const { joinLobby } = useJoinLobby();
  const { startGame } = useStartGame();

  return (
    <LobbyScreen
      game={props.game}
      currUserId={userId || ""}
      onInviteFriendsBtnPressed={() => {}}
      onStartGameBtnPressed={() => startGame(props.game.gameId)}
      onJoinGameBtnPressed={() => joinLobby(props.game.gameId)}
      onBackBtnPressed={leaveGame}
    />
  );
}
