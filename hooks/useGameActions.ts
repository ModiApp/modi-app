import { firestore } from "@/config/firebase";
import { ActionType, GameAction } from "@/functions/src/actions.types";
import { CardsRef } from "@/ui/components/CardTable";
import { collection, onSnapshot, orderBy, query, startAfter } from "firebase/firestore";
import { useEffect, useRef } from "react";

interface UseGameActionsProps {
  gameId: string;
  cardsRef: React.RefObject<CardsRef | null>;
}

export function useGameActions({ gameId, cardsRef }: UseGameActionsProps) {
  const lastActionId = useRef<string | null>(null);

  useEffect(() => {
    if (!gameId || !cardsRef.current) return;

    // Subscribe to actions after the last seen action
    const actionsRef = collection(firestore, "games", gameId, "actions");
    const actionsQuery = lastActionId.current
      ? query(actionsRef, orderBy("timestamp"), startAfter(lastActionId.current))
      : query(actionsRef, orderBy("timestamp"));

    const unsubscribe = onSnapshot(actionsQuery, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const action = change.doc.data() as GameAction;
          handleAction(action);
          lastActionId.current = action.id;
        }
      });
    });

    return unsubscribe;
  }, [gameId, cardsRef]);

  const handleAction = (action: GameAction) => {
    console.log("action", action);
    if (!cardsRef.current) return;

    switch (action.type) {
      case ActionType.DEAL_CARDS:
        // Trigger deal cards animation
        cardsRef.current.dealCards(action.dealingOrder);
        break;

      case ActionType.SWAP_CARDS:
        // Trigger swap cards animation
        cardsRef.current.swapCards(action.playerId, action.targetPlayerId);
        break;

      // Add other action types as needed
      case ActionType.DEALER_DRAW:
        // Could trigger a dealer draw animation
        break;

      case ActionType.END_ROUND:
        // Could trigger end round animations
        break;

      default:
        // Handle other action types
        break;
    }
  };
} 