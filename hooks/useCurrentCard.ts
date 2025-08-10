import type { CardID } from '@/api/src/types/card.types';
import { firestore } from '@/config/firebase';
import { useUserId } from '@/providers/Auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';

/**
 * A hook to subscribe to the current user's card in a specific game.
 * 
 * This hook listens to changes in the user's hand document and returns
 * the current card if they have one, or null if they don't.
 */
export function useCurrentCard(gameId: string): CardID | null {
  const [card, setCard] = useState<CardID | null>(null);
  const currentUserId = useUserId();

  useEffect(() => {
    if (!currentUserId || !gameId) {
      setCard(null);
      return;
    }

    const playerHandRef = doc(firestore, `games/${gameId}/playerHands/${currentUserId}`);
    
    const unsubscribe = onSnapshot(
      playerHandRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setCard(data.card || null);
        } else {
          setCard(null);
        }
      },
      (error) => {
        console.error("useCurrentCard: Error listening to player hand:", error);
        // Fail silently as requested
        setCard(null);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [gameId, currentUserId]);

  return card;
} 