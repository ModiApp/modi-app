import { Animated } from "react-native";

export type PlayerPosition = { x: number; y: number; rotation: number };

export interface CardAnimationValue {
  x: Animated.Value;
  y: Animated.Value;
  rotation: Animated.Value;
  playerId: string;
  backOpacity: Animated.Value;
  faceOpacity: Animated.Value;
  skew: Animated.Value;
}

export interface CardPosition {
  x: number;
  y: number;
  rotation: number;
}

export interface CardsRef {
  dealCards(toPlayers: string[]): void;
  swapCards(fromPlayerId: string, toPlayerId: string): void;
  trashCards(): void;
  revealCards(playerCards: { [playerId: string]: string }): void;
}

export interface CardTableConfig {
  cardDistanceFromPlayer: number;
  deckDistanceFromDealer: number;
  dealAnimationDuration: number;
  swapAnimationDuration: number;
  dealStaggerDelay: number;
}

export const CARD_TABLE_CONFIG: CardTableConfig = {
  cardDistanceFromPlayer: 80,
  deckDistanceFromDealer: 30,
  dealAnimationDuration: 500,
  swapAnimationDuration: 300,
  dealStaggerDelay: 300,
}; 