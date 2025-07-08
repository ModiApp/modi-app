import React, { useEffect, useState } from "react";
import { TouchableOpacity, ViewStyle } from "react-native";
import { Container, Text } from "../elements";

export interface PlayerCircleProps {
  playerId: string;
  username: string;
  lives?: number;
  roundState?: "pre-deal" | "playing" | "tallying";
  style: ViewStyle;
}

export function PlayerCircle({
  playerId,
  username,
  lives,
  roundState,
  style,
}: PlayerCircleProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (roundState && roundState !== "playing") {
      setOpen(true);
    } else {
      setOpen(false);
    }
  }, [roundState]);

  return (
    <TouchableOpacity
      key={playerId}
      onPress={() => setOpen((curr) => !curr)}
      activeOpacity={0.8}
      style={style}
    >
      <Container
        color="gray"
        style={{
          padding: 8,
          borderRadius: 25,
          width: 50,
          height: 50,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Text>{username.slice(0, 2)}</Text>
      </Container>
      {open && lives !== undefined && (
        <Container
          color="gray"
          style={{
            position: "absolute",
            bottom: 60,
            left: "50%",
            transform: [{ translateX: -40 }],
            padding: 6,
            borderRadius: 6,
            alignItems: "center",
          }}
        >
          <Text size={12}>{username}</Text>
          <Text size={12}>❤️ {lives}</Text>
        </Container>
      )}
    </TouchableOpacity>
  );
}
