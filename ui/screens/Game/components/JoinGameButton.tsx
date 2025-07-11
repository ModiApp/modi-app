import { useJoinLobby } from "@/hooks/useJoinLobby";
import { Button } from "@/ui/elements";
import React from "react";

export function JoinGameButton(props: { gameId: string }) {
  const { gameId } = props;
  const { joinLobby, isJoining } = useJoinLobby();
  return (
    <Button
      color="blue"
      title="Join Game"
      onPress={() => joinLobby(gameId)}
      loading={isJoining}
    />
  );
}
