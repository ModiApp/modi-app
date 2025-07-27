import { useLeaveGame } from "@/hooks/useLeaveGame";
import { Button, Icon } from "@/ui/elements";
import React from "react";
import { StyleProp, ViewStyle } from "react-native";

/**
 * Removes you from the game, if you're a part of it, and returns you to the home screen.
 */
export function LeaveGameButton(props: { variant?: "small" | "large" }) {
  const { leaveGame, isLeaving } = useLeaveGame();
  const { variant = "small" } = props;

  const styles: StyleProp<ViewStyle> =
    variant === "small" ? { height: "100%", aspectRatio: 1, borderRadius: 100 } : undefined;

  const icon = variant === "large" ? "home" : "back";

  return (
    <Button
      color="red"
      onPress={leaveGame}
      loading={isLeaving}
      style={styles}
      fullWidth={variant === "large"}
    >
      <Icon name={icon} size={22} color="white" />
    </Button>
  );
}
