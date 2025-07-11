import { InitialGame } from "@/functions/src/types";
import { useShare } from "@/hooks/useShare";
import { useAuth } from "@/providers/Auth";
import React from "react";
import LobbyScreen from "../Lobby/Base";

export function GatheringPlayers(props: { game: InitialGame }) {
  const { userId } = useAuth();

  const { shareGame } = useShare();

  return (
    <LobbyScreen
      game={props.game}
      currUserId={userId || ""}
      onInviteFriendsBtnPressed={() => shareGame(props.game.gameId)}
    />
  );
}
