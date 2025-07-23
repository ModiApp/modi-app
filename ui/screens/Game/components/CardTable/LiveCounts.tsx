import { LiveCount } from "@/ui/components/AnimatedLiveCount";
import { Container } from "@/ui/elements";
import { useState } from "react";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useGameActions } from "../../GameActionsProvider";
import { useCurrentGame } from "../../PlayingContext";
import { useCardTable } from "./context";

export function LiveCounts() {
  const { game } = useCurrentGame();
  const { playerPositions } = useCardTable();

  return (
    <>
      {game.players.map((playerId) => (
        <Container
          key={playerId}
          style={{
            position: "absolute",
            top: playerPositions[playerId]?.y,
            left: playerPositions[playerId]?.x,
          }}
        >
          <PlayerLiveCount
            playerId={playerId}
            initialLives={game.initialLives}
          />
        </Container>
      ))}
    </>
  );
}

function PlayerLiveCount(props: { playerId: string; initialLives: number }) {
  const { playerId, initialLives } = props;
  const [lives, setLives] = useState(initialLives ?? 3);

  // Animated opacity
  const opacity = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  useGameActions({
    async dealCards() {
      // animate live count opacity to 0
      opacity.value = withTiming(0, { duration: 300 });
    },
    async tallying({ playersLost }) {
      // animate live count opacity to 1
      await new Promise<void>((resolve) => {
        opacity.value = withTiming(1, { duration: 300 }, () => resolve());
      });
      await new Promise((res) => setTimeout(res, 300));
      if (playersLost.includes(playerId)) {
        setLives((prev) => prev - 1);
      }
      await new Promise((res) => setTimeout(res, 300));
    },
  });

  return (
    <Animated.View style={animatedStyle}>
      <LiveCount lives={lives} />
    </Animated.View>
  );
}
