import { useJoinLobby } from "@/hooks/useJoinLobby";
import { useUsername } from "@/providers/Username";
import { Button } from "@/ui/elements";
import React, { useState } from "react";

export function JoinGameButton(props: { gameId: string }) {
  const { gameId } = props;
  const { joinLobby } = useJoinLobby();
  const username = useUsername();
  const [isJoining, setIsJoining] = useState(false);

  async function handleJoinGame() {
    setIsJoining(true);
    if (!username.value) {
      await username.setValue(getUsername());
    }
    await joinLobby(gameId);
    setIsJoining(false);
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
