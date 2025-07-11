import { useLeaveGame } from "@/hooks/useLeaveGame";
import { Button, Icon } from "@/ui/elements";
import React from "react";

/**
 * Removes you from the game, if you're a part of it, and returns you to the home screen.
 */
export function LeaveGameButton() {
  const { leaveGame, isLeaving } = useLeaveGame();

  return (
    <Button
      color="red"
      onPress={leaveGame}
      loading={isLeaving}
      style={{ height: "100%", aspectRatio: 1, borderRadius: 100 }}
    >
      <Icon name="back" size={22} color="white" />
    </Button>
  );
}
