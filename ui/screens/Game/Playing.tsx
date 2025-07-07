import { ActiveGame } from "@/functions/src/types";
import Text from "@/ui/elements/Text";
import React from "react";

export function GamePlaying(props: { game: ActiveGame }) {
  return <Text>Playing: {JSON.stringify(props.game, null, 2)}</Text>;
}
