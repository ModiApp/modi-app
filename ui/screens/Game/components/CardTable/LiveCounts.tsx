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
      {game.players.map((playerId) => {
        const playerName = game.usernames[playerId];
        return (
          <Container
            key={playerId}
            style={{
              position: "absolute",
              top: playerPositions[playerId]?.y,
              left: playerPositions[playerId]?.x,
              transform: [
                playerPositions[playerId]?.x > 0
                  ? { translateX: "-100%" }
                  : undefined,
              ].filter(Boolean) as any,
            }}
          >
            <PlayerLiveCount
              playerId={playerId}
              playerName={playerName}
              initialLives={game.initialLives}
            />
          </Container>
        );
      })}
    </>
  );
}

function PlayerLiveCount(props: { playerId: string; playerName: string; initialLives: number }) {
  const { playerId, playerName, initialLives } = props;
  const [lives, setLives] = useState(initialLives ?? 3);

  const opacity = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  useGameActions({
    async dealCards() {
      if (lives > 0) {
        opacity.value = withTiming(0, { duration: 300 });
      }
    },
    async tallying({ playersLost }) {
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

  const livesLabel = lives === 1 
    ? `${playerName} has 1 life remaining` 
    : `${playerName} has ${lives} lives remaining`;

  return (
    <Animated.View 
      style={animatedStyle}
      accessibilityRole="text"
      accessibilityLabel={livesLabel}
    >
      <LiveCount lives={lives} />
    </Animated.View>
  );
}
