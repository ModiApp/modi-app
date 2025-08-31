import { useSetPlayerOrder } from "@/hooks/useSetPlayerOrder";
import { useUserId } from "@/providers/Auth";
import { Container, Text } from "@/ui/elements";
import { useCurrentGame } from "@/ui/screens/Game/PlayingContext";
import React, { useEffect, useMemo, useState } from "react";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useCardTable } from "./context";
import { degreesToRadians, radiansToDegrees } from "./utils";

export function PlayerCircles() {
  const { game } = useCurrentGame();
  const currUserId = useUserId();
  const { radius, setPlayerPositions } = useCardTable();
  const isGatheringPlayers = game.status === "gathering-players";
  const isHost = game.host === currUserId;
  const { setPlayerOrder } = useSetPlayerOrder();

  // Drag state
  const [draggedPlayerId, setDraggedPlayerId] = useState<string | null>(null);
  const [originalPositions, setOriginalPositions] = useState<{
    [key: string]: { x: number; y: number };
  }>({});

  // Animated values
  const dragX = useSharedValue(0);
  const dragY = useSharedValue(0);
  const dragScale = useSharedValue(1);

  // Track initial position for each drag
  const initialDragX = useSharedValue(0);
  const initialDragY = useSharedValue(0);

  const playerCircles = useMemo(
    () => calculatePlayerPositions(game.players, radius, currUserId),
    [game.players, radius, currUserId]
  );

  useEffect(() => {
    if (!radius) return;
    setPlayerPositions(
      playerCircles.reduce((acc, { playerId, x, y, rotation }) => {
        acc[playerId] = { x, y, rotation };
        return acc;
      }, {} as { [playerId: string]: { x: number; y: number; rotation: number } })
    );
  }, [playerCircles, setPlayerPositions, radius]);

  // Calculate which player circle is closest to drag position
  const getClosestPlayer = (x: number, y: number) => {
    // Calculate approximate radius of player circles
    // paddingHorizontal: 4 + paddingVertical: 2 + text width (~20px for 2 chars) + some buffer
    const circleRadius = 4 + 2 + 10 + 2; // ~18px radius
    const overlapMultiplier = 4; // If radius is 1, overlap at 4x radius
    const overlapRadius = circleRadius * overlapMultiplier; // ~72px

    for (const circle of playerCircles) {
      const distance = Math.sqrt((x - circle.x) ** 2 + (y - circle.y) ** 2);
      if (distance <= overlapRadius && circle.playerId !== draggedPlayerId) {
        return circle;
      }
    }
    return null;
  };

  // Handle player order update
  const handlePlayerOrderUpdate = (
    fromPlayerId: string,
    toPlayerId: string
  ) => {
    const newPlayers = [...game.players];
    const fromIndex = newPlayers.indexOf(fromPlayerId);
    const toIndex = newPlayers.indexOf(toPlayerId);

    // Swap players
    [newPlayers[fromIndex], newPlayers[toIndex]] = [
      newPlayers[toIndex],
      newPlayers[fromIndex],
    ];

    // Call the hook
    setPlayerOrder(game.gameId, newPlayers);
  };

  // Create pan gesture for a specific player
  const createPanGesture = (
    playerId: string,
    playerX: number,
    playerY: number
  ) => {
    return Gesture.Pan()
      .onBegin((event) => {
        console.log("onBegin", event);
        if (!isGatheringPlayers || !isHost || playerId === currUserId) return;

        setDraggedPlayerId(playerId);
        setOriginalPositions(
          playerCircles.reduce((acc, circle) => {
            acc[circle.playerId] = { x: circle.x, y: circle.y };
            return acc;
          }, {} as { [key: string]: { x: number; y: number } })
        );

        // Set initial position and track it
        dragX.value = playerX;
        dragY.value = playerY;
        initialDragX.value = playerX;
        initialDragY.value = playerY;
        dragScale.value = withSpring(1.2);
      })
      .onUpdate((event) => {
        if (playerId !== draggedPlayerId) return;

        // Use initial position + total translation
        dragX.value = initialDragX.value + event.translationX;
        dragY.value = initialDragY.value + event.translationY;
      })
      .onEnd((event) => {
        if (playerId !== draggedPlayerId) return;

        const finalX = initialDragX.value + event.translationX;
        const finalY = initialDragY.value + event.translationY;

        const targetPlayer = getClosestPlayer(finalX, finalY);

        if (targetPlayer) {
          // Animate dragged player to target position
          dragX.value = withSpring(targetPlayer.x);
          dragY.value = withSpring(targetPlayer.y);

          // Update player order
          runOnJS(handlePlayerOrderUpdate)(
            draggedPlayerId,
            targetPlayer.playerId
          );
        } else {
          // Return to original position
          const originalPos = originalPositions[draggedPlayerId];
          if (originalPos) {
            dragX.value = withSpring(originalPos.x);
            dragY.value = withSpring(originalPos.y);
          }
        }

        // Reset scale
        dragScale.value = withSpring(1);

        // Reset state
        runOnJS(() => {
          setDraggedPlayerId(null);
          setOriginalPositions({});
        })();
      });
  };

  // Animated style for dragged circle
  const draggedCircleStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: dragX.value },
      { translateY: dragY.value },
      { scale: dragScale.value },
    ],
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  }));

  // Render individual player circle with gesture handling
  const renderPlayerCircle = ({
    playerId,
    x,
    y,
  }: {
    playerId: string;
    x: number;
    y: number;
  }) => {
    const isDragged = playerId === draggedPlayerId;
    const isTarget =
      draggedPlayerId &&
      getClosestPlayer(dragX.value, dragY.value)?.playerId === playerId;
    const canDrag = isGatheringPlayers && isHost && playerId !== currUserId;

    const circleContent = (
      <Container
        key={playerId}
        style={{
          position: "absolute",
          borderRadius: 2,
          backgroundColor: isTarget
            ? "rgba(255, 255, 0, 0.3)"
            : "rgba(0, 0, 0, 0.5)",
          paddingHorizontal: 4,
          paddingVertical: 2,
          justifyContent: "center",
          alignItems: "center",
          transform: [
            { translateX: "-50%" },
            { translateY: "-50%" },
            { translateX: x },
            { translateY: y },
          ],
          opacity: isDragged ? 0.3 : 1,
        }}
      >
        <Text size={10}>{game.usernames[playerId].slice(0, 8)}</Text>
      </Container>
    );

    // Only wrap in GestureDetector if draggable
    if (!canDrag) {
      return circleContent;
    }

    return (
      <GestureDetector
        key={playerId}
        gesture={createPanGesture(playerId, x, y)}
      >
        {circleContent}
      </GestureDetector>
    );
  };

  // Render dragged circle overlay
  const renderDraggedCircle = () => {
    if (!draggedPlayerId) return null;

    return (
      <Animated.View
        style={[
          {
            position: "absolute",
            borderRadius: 2,
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            paddingHorizontal: 4,
            paddingVertical: 2,
            justifyContent: "center",
            alignItems: "center",
            transform: [{ translateX: "-50%" }, { translateY: "-50%" }],
            zIndex: 1000,
          },
          draggedCircleStyle,
        ]}
      >
        <Text size={10} style={{ color: "white" }}>
          {game.usernames[draggedPlayerId].slice(0, 8)}
        </Text>
      </Animated.View>
    );
  };

  // Conditional rendering based on game state and host status
  if (!isGatheringPlayers || !isHost) {
    return <>{playerCircles.map(renderPlayerCircle)}</>;
  }

  return (
    <>
      {playerCircles.map(renderPlayerCircle)}
      {renderDraggedCircle()}
    </>
  );
}

export function calculatePlayerPositions(
  players: string[],
  radius: number,
  currentUserId: string
): { playerId: string; x: number; y: number; rotation: number }[] {
  const currentUserIndex = players.findIndex(
    (player) => player === currentUserId
  );
  const currentUserAngle = (currentUserIndex * 360) / players.length;
  const rotationDegrees = 90 - currentUserAngle;

  return players.map((player, index) => {
    const baseAngle = (index * 2 * Math.PI) / players.length;
    const rotatedAngle = baseAngle + degreesToRadians(rotationDegrees);
    const x = radius * Math.cos(rotatedAngle);
    const y = radius * Math.sin(rotatedAngle);
    return {
      x,
      y,
      rotation: radiansToDegrees(rotatedAngle) - 90,
      playerId: player,
    };
  });
}
