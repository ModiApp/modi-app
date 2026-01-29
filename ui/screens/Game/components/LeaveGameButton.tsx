import { useLeaveGame } from "@/hooks/useLeaveGame";
import { Button, Icon, Text } from "@/ui/elements";
import React from "react";
import { StyleProp, ViewStyle } from "react-native";

/**
 * Removes you from the game, if you're a part of it, and returns you to the home screen.
 */
export function LeaveGameButton(props: { variant?: "small" | "large" }) {
  const { leaveGame, isLeaving } = useLeaveGame();
  const { variant = "small" } = props;

  const styles: StyleProp<ViewStyle> =
    variant === "small"
      ? { height: "100%", aspectRatio: 1, borderRadius: 100 }
      : { flexDirection: "row", gap: 8 };

  return (
    <Button
      color="red"
      onPress={leaveGame}
      loading={isLeaving}
      style={styles}
      fullWidth={variant === "large"}
      accessibilityLabel="Leave Game"
      accessibilityHint="Exit this game and return to the home screen"
    >
      <Icon name="back" size={22} color="white" />
      {variant === "large" && <Text>Leave Game</Text>}
    </Button>
  );
}
