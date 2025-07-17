import { firestore } from "@/config/firebase";
import { CardID } from "@/functions/src/types";
import { ActionType, DealerDrawAction, GameAction } from "@/functions/src/types/actions.types";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { useEffect, useRef } from "react";

interface GameActionHandlers {
  moveDeck?(toDealerId: string): Promise<void>;
  dealCards?(toPlayers: string[]): Promise<void>;
  swapCards?(fromPlayerId: string, toPlayerId: string): Promise<void>;
  hitDeck?(action: DealerDrawAction): Promise<void>;
  trashCards?(): Promise<void>;
  revealCards?(playerCards: { [playerId: string]: CardID }): Promise<void>;
}


export function useGameActions(gameId: string, handlers: GameActionHandlers) {
  const actionQueue = useRef<GameAction[]>([]).current;
  const processing = useRef(false);

  async function processActionQueue() {
    if (processing.current) return;
    processing.current = true;
    while (actionQueue.length) {
      const action = actionQueue.shift();
      if (!action) continue;
      await handleAction(action);
    }
    processing.current = false;
  }

  useEffect(() => {
    const actionsRef = collection(firestore, "games", gameId, "actions");
    const actionsQuery = query(actionsRef, orderBy("timestamp"));
    const unsubscribe = onSnapshot(actionsQuery, (snapshot) => {
      snapshot.docChanges().filter((change) => change.type === 'added').forEach((change) => {
        const action = change.doc.data() as GameAction;
        actionQueue.push(action);
        processActionQueue();
      });
    });
    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId]);

  const handleAction = async (action: GameAction) => {
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
        return handlers.hitDeck?.(action);

      case ActionType.END_ROUND:
        return handlers.trashCards?.().then(() => handlers?.moveDeck?.(action.newDealer));

      default:
        return Promise.resolve();
    }
  };
} 