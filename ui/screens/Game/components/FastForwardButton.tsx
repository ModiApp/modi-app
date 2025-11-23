import { useAnimationSpeed } from "../AnimationSpeedContext";
import { Button } from "@/ui/elements";
import Text from "@/ui/elements/Text";

export function FastForwardButton() {
  const { isFastForwarding, toggleFastForward } = useAnimationSpeed();

  return (
    <Button
      color={isFastForwarding ? "gray" : "blue"}
      onPress={toggleFastForward}
      style={{ alignSelf: "flex-start", minWidth: 140 }}
    >
      <Text>{isFastForwarding ? "Resume speed" : "Fast forward"}</Text>
    </Button>
  );
}
