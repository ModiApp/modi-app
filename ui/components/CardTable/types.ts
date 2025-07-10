import { Animated } from "react-native";

export type PlayerPosition = { x: number; y: number; rotation: number };

export interface Player {
  playerId: string;
  username: string;
}

export interface CardAnimationValue {
  x: Animated.Value;
  y: Animated.Value;
  rotation: Animated.Value;
  playerId: string;
}

export interface CardPosition {
  x: number;
  y: number;
  rotation: number;
}

export interface CardsRef {
  dealCards(toPlayers: string[]): void;
  swapCards(fromPlayerId: string, toPlayerId: string): void;
}

export interface CardTableConfig {
  cardDistanceFromPlayer: number;
  deckDistanceFromDealer: number;
  dealAnimationDuration: number;
  swapAnimationDuration: number;
  dealStaggerDelay: number;
}

export const DEFAULT_CARD_TABLE_CONFIG: CardTableConfig = {
  cardDistanceFromPlayer: 80,
  deckDistanceFromDealer: 100,
  dealAnimationDuration: 500,
  swapAnimationDuration: 300,
  dealStaggerDelay: 300,
}; 