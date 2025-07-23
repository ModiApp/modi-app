import { LiveCount } from "@/ui/components/AnimatedLiveCount";
import { ScreenContainer } from "@/ui/elements";
import React from "react";

export default function PlaygroundScreen() {
  return (
    <ScreenContainer>
      <LiveCount lives={0} />
    </ScreenContainer>
  );
}
