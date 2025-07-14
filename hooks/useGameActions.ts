import { firestore } from "@/config/firebase";
import { CardID } from "@/functions/src/types";
import { ActionType, GameAction } from "@/functions/src/types/actions.types";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { useEffect } from "react";

interface GameActionHandlers {
  moveDeck?(toDealerId: string): Promise<void>;
  dealCards?(toPlayers: string[]): Promise<void>;
  swapCards?(fromPlayerId: string, toPlayerId: string): Promise<void>;
  hitDeck?(playerId: string): Promise<void>;
  trashCards?(): Promise<void>;
  revealCards?(playerCards: { [playerId: string]: CardID }): Promise<void>;
}

export function useGameActions(gameId: string, handlers: GameActionHandlers) {
  useEffect(() => {
    if (!gameId) return;

    const fetchAndProcessActions = async () => {
      const actionsRef = collection(firestore, "games", gameId, "actions");
      const actionsQuery = query(actionsRef, orderBy("timestamp"));
      const snapshot = await getDocs(actionsQuery);
      const actions: GameAction[] = snapshot.docs.map(doc => doc.data() as GameAction);

      // Find the index of the first GAME_STARTED action
      const startIdx = actions.findIndex(a => a.type === ActionType.GAME_STARTED);
      if (startIdx === -1) return; // No game started action, nothing to process

      // Process actions in order, starting from GAME_STARTED
      for (let i = startIdx; i < actions.length; i++) {
        await handleAction(actions[i]);
      }
    };

    fetchAndProcessActions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId]);

  const handleAction = async (action: GameAction) => {
    console.log("action", action);

    switch (action.type) {
      case ActionType.GAME_STARTED:
        return handlers.moveDeck?.(action.initialDealer);

      case ActionType.DEAL_CARDS:
        return handlers.dealCards?.(action.dealingOrder);

      case ActionType.SWAP_CARDS:
        return handlers.swapCards?.(action.playerId, action.targetPlayerId);

      case ActionType.REVEAL_CARDS:
        return handlers.revealCards?.(action.playerCards);

      case ActionType.DEALER_DRAW:
        return handlers.hitDeck?.(action.playerId);

      case ActionType.END_ROUND:
        return handlers.trashCards?.().then(() => handlers?.moveDeck?.(action.newDealer));

      default:
        return Promise.resolve();
    }
  };
} 