import { useAuth } from "@/providers/Auth";
import { Game } from "@/types/game";
import React from "react";
import LobbyScreen from "../Lobby/Base";

export function GatheringPlayers(props: { game: Game }) {
  const { userId } = useAuth();
  const { gameId } = props.game;

  return (
    <LobbyScreen
      lobbyId={gameId}
      currUserId={userId || ""}
      attendees={props.game.players}
      showUsernameInput={false}
      onInviteFriendsBtnPressed={() => {}}
      onStartGameBtnPressed={() => {}}
      onBackBtnPressed={() => {}}
    />
  );
}
