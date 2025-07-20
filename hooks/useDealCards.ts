import { functions } from '@/config/firebase';
import { DealCardsRequest, DealCardsResponse } from '@/functions/src/dealCards';
import { httpsCallable } from 'firebase/functions';
import { useState } from 'react';
import { Alert } from '@/ui/components/AlertBanner';

const dealCardsFunction = httpsCallable<DealCardsRequest, DealCardsResponse>(functions, 'dealCards');

/**
 * A hook to deal cards to all players in a game.
 * 
 * This hook is used in the GamePlaying screen to deal cards when the dealer is ready.
 * It calls the dealCards cloud function and handles the transition from pre-deal to playing state.
 * Only the current dealer can deal cards, and only when the round state is "pre-deal".
 */
export function useDealCards() {
  const [isDealing, setIsDealing] = useState(false);

  const dealCards = async () => {
    try {
      console.log("useDealCards: Dealing cards");
      setIsDealing(true);

      const result = await dealCardsFunction({});

      console.log("useDealCards: Cards dealt successfully:", result.data);
      
      // The game state will automatically update via Firestore listeners
      // The round state will change from "pre-deal" to "playing"
      // Player hands will be updated with their cards
      
    } catch (error: any) {
      console.error("useDealCards: Error dealing cards:", error);
      
      // Handle different types of errors
      if (error.code === 'functions/not-found') {
        Alert.error({ message: "No active game found where you are the dealer." });
      } else if (error.code === 'functions/failed-precondition') {
        if (error.message?.includes('not active')) {
          Alert.error({ message: "Game is not active." });
        } else if (error.message?.includes('pre-deal')) {
          Alert.error({ message: "Cards can only be dealt in pre-deal state." });
        } else if (error.message?.includes('No cards left')) {
          Alert.error({ message: "No cards left in deck or trash." });
        } else if (error.message?.includes('No players with lives')) {
          Alert.error({ message: "No players with lives remaining." });
        } else {
          Alert.error({ message: "Game cannot be dealt right now." });
        }
      } else if (error.code === 'functions/permission-denied') {
        Alert.error({ message: "Only the dealer can deal cards." });
      } else if (error.code === 'functions/unauthenticated') {
        Alert.error({ message: "Please sign in to deal cards." });
      } else if (error.code === 'functions/invalid-argument') {
        Alert.error({ message: "Invalid request." });
      } else {
        Alert.error({ message: "Failed to deal cards. Please try again." });
      }
    } finally {
      setIsDealing(false);
    }
  };

  return {
    dealCards,
    isDealing,
  };
}
