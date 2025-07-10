import { useCallback, useMemo } from "react";
import { Animated } from "react-native";
import { useCardTable } from "../context";
import { CardTableConfig, DEFAULT_CARD_TABLE_CONFIG, PlayerPosition } from "../types";
import { degreesToRadians } from "../utils";
import { useCardAnimationState } from "./useCardAnimationState";

export function useCardAnimations(config: Partial<CardTableConfig> = {}) {
  const { playerPositions } = useCardTable();
  const animationState = useCardAnimationState();
  const mergedConfig = useMemo(() => ({ ...DEFAULT_CARD_TABLE_CONFIG, ...config }), [config]);

  const dealCards = useCallback(
    (toPlayers: string[], deckPosition: PlayerPosition | null) => {
      if (!deckPosition) {
        console.warn("No deck position set");
        return;
      }

      animationState.cardDealOrder.current = [...toPlayers];
      animationState.cardPositions.current = [];

      // Initialize and draw all the cards at the start position, on top of the deck
      const startingAnimationValues = toPlayers.map((playerId) => {
        return {
          x: new Animated.Value(deckPosition.x),
          y: new Animated.Value(deckPosition.y),
          rotation: new Animated.Value(deckPosition.rotation),
          playerId,
        };
      });
      animationState.setCardAnimationValues(startingAnimationValues);

      const animations = startingAnimationValues.map((value, index) => {
        const toXValue =
          playerPositions[toPlayers[index]].x +
          Math.cos(
            degreesToRadians(playerPositions[toPlayers[index]].rotation - 90)
          ) *
            mergedConfig.cardDistanceFromPlayer;
        const toYValue =
          playerPositions[toPlayers[index]].y +
          Math.sin(
            degreesToRadians(playerPositions[toPlayers[index]].rotation - 90)
          ) *
            mergedConfig.cardDistanceFromPlayer;
        const toRotationValue = playerPositions[toPlayers[index]].rotation;

        animationState.cardPositions.current.push({
          x: toXValue,
          y: toYValue,
          rotation: toRotationValue,
        });

        return Animated.parallel([
          Animated.timing(value.x, {
            toValue: toXValue,
            duration: mergedConfig.dealAnimationDuration,
            useNativeDriver: true,
          }),
          Animated.timing(value.y, {
            toValue: toYValue,
            duration: mergedConfig.dealAnimationDuration,
            useNativeDriver: true,
          }),
          Animated.timing(value.rotation, {
            toValue: toRotationValue,
            duration: mergedConfig.dealAnimationDuration,
            useNativeDriver: true,
          }),
        ]);
      });

      Animated.stagger(mergedConfig.dealStaggerDelay, animations).start();
    },
    [playerPositions, animationState, mergedConfig]
  );

  const swapCards = useCallback(
    (player1: string, player2: string) => {
      const player1Index = animationState.cardDealOrder.current.indexOf(player1);
      const player1CardPosition = animationState.cardPositions.current[player1Index];
      const player1CardAnimationValue = animationState.cardAnimationValues[player1Index];

      const player2Index = animationState.cardDealOrder.current.indexOf(player2);
      const player2CardPosition = animationState.cardPositions.current[player2Index];
      const player2CardAnimationValue = animationState.cardAnimationValues[player2Index];

      Animated.parallel([
        Animated.parallel([
          Animated.timing(player1CardAnimationValue.x, {
            toValue: player2CardPosition.x,
            duration: mergedConfig.swapAnimationDuration,
            useNativeDriver: true,
          }),
          Animated.timing(player1CardAnimationValue.y, {
            toValue: player2CardPosition.y,
            duration: mergedConfig.swapAnimationDuration,
            useNativeDriver: true,
          }),
          Animated.timing(player1CardAnimationValue.rotation, {
            toValue: player2CardPosition.rotation,
            duration: mergedConfig.swapAnimationDuration,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(player2CardAnimationValue.x, {
            toValue: player1CardPosition.x,
            duration: mergedConfig.swapAnimationDuration,
            useNativeDriver: true,
          }),
          Animated.timing(player2CardAnimationValue.y, {
            toValue: player1CardPosition.y,
            duration: mergedConfig.swapAnimationDuration,
            useNativeDriver: true,
          }),
          Animated.timing(player2CardAnimationValue.rotation, {
            toValue: player1CardPosition.rotation,
            duration: mergedConfig.swapAnimationDuration,
            useNativeDriver: true,
          }),
        ]),
      ]).start();

      // Update the order tracking
      animationState.cardDealOrder.current[player1Index] = player2;
      animationState.cardDealOrder.current[player2Index] = player1;

      // Update the position tracking to match the new order
      const tempPosition = animationState.cardPositions.current[player1Index];
      animationState.cardPositions.current[player1Index] = animationState.cardPositions.current[player2Index];
      animationState.cardPositions.current[player2Index] = tempPosition;
    },
    [animationState, mergedConfig]
  );

  return {
    cardAnimationValues: animationState.cardAnimationValues,
    dealCards,
    swapCards,
    resetState: animationState.resetState,
  };
} 