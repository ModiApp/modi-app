import { useJoinLobby } from "@/hooks/useJoinLobby";
import { useUsername } from "@/providers/Username";
import { Button } from "@/ui/elements";
import React from "react";

export function JoinGameButton(props: { gameId: string }) {
  const { gameId } = props;
  const { joinLobby, isJoining } = useJoinLobby();
  const username = useUsername();

  function handleJoinGame() {
    if (!username.value) {
      username.setValue(getUsername());
    }
    joinLobby(gameId);
  }
  return (
    <Button
      color="blue"
      title="Join Game"
      onPress={handleJoinGame}
      loading={isJoining}
    />
  );
}

function getUsername() {
  const username = prompt("Enter your username:");
  if (!username) {
    return getUsername();
  }
  return username;
}
