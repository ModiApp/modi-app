import { firestore } from "@/config/firebase";
import { CardID } from "@/functions/src/types";
import {
  ActionType,
  DealerDrawAction,
  GameAction,
  KungAction,
  TallyingAction,
} from "@/functions/src/types/actions.types";
import { useUserId } from "@/providers/Auth";
import { useCurrentGame } from "@/ui/screens/Game/PlayingContext";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
} from "react";

interface GameActionHandlers {
  moveDeck?(toDealerId: string): Promise<void>;
  dealCards?(toPlayers: string[]): Promise<void>;
  swapCards?(fromPlayerId: string, toPlayerId: string): Promise<void>;
  hitDeck?(action: DealerDrawAction): Promise<void>;
  trashCards?(): Promise<void>;
  revealCards?(playerCards: { [playerId: string]: CardID }): Promise<void>;
  kung?(action: KungAction): Promise<void>;
  tallying?(action: TallyingAction): Promise<void>;
}

type HandlerId = symbol;

type HandlerEntry = {
  id: HandlerId;
  handlers: GameActionHandlers;
};

type GameActionContextType = {
  registerHandlers: (handlers: GameActionHandlers) => HandlerId;
  unregisterHandlers: (id: HandlerId) => void;
};

const GameActionContext = createContext<GameActionContextType | null>(null);

export function GameActionProvider({ children }: { children: ReactNode }) {
  const {
    game: { gameId },
  } = useCurrentGame();
  const userId = useUserId();
  const handlerEntries = useRef<HandlerEntry[]>([]);
  const actionQueue = useRef<GameAction[]>([]).current;
  const processing = useRef(false);

  // Register/unregister API
  const registerHandlers = useCallback((handlers: GameActionHandlers) => {
    const id = Symbol();
    handlerEntries.current.push({ id, handlers });
    return id;
  }, []);

  const unregisterHandlers = useCallback((id: HandlerId) => {
    handlerEntries.current = handlerEntries.current.filter(
      (entry) => entry.id !== id
    );
  }, []);

  // Action processing
  async function processActionQueue() {
    if (processing.current) return;
    processing.current = true;
    while (actionQueue.length) {
      const action = actionQueue.shift();
      if (!action) continue;
      await processAction(action);
    }
    processing.current = false;
  }

  // Call all registered handlers for each action
  const processAction = async (action: GameAction) => {
    await Promise.all(
      handlerEntries.current.map(async ({ handlers }) => {
        return handleAction(action, handlers);
      })
    );
  };

  const handleAction = (action: GameAction, handlers: GameActionHandlers) => {
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
        // Run both trashCards and moveDeck in parallel for each handler
        return Promise.all([
          handlers.trashCards?.(),
          handlers.moveDeck?.(action.newDealer),
        ]);
      case ActionType.RECEIVE_CARD:
        return handlers.revealCards?.({ [action.playerId]: action.card });
      case ActionType.DECK_RESHUFFLE:
        console.warn("Deck reshuffled without action handler", action);
        return;
      case ActionType.STICK:
        console.warn("Stick action without action handler", action);
        return;
      case ActionType.KUNG:
        return handlers.kung?.(action);
      case ActionType.SPECIAL_EVENT:
        console.warn("Special event action without action handler", action);
        return;
      case ActionType.PLAYER_JOINED:
        console.warn("Player joined action without action handler", action);
        return;
      case ActionType.PLAYER_LEFT:
        console.warn("Player left action without action handler", action);
        return;
      case ActionType.TALLYING:
        return handlers.tallying?.(action);
      default:
        const item: never = action;
        throw new Error(`Unknown action type: ${item}`);
    }
  };

  // Firestore subscription
  useEffect(() => {
    if (!gameId || !userId) return;

    const actionsRef = collection(firestore, "games", gameId, "actions");
    const privateActionsRef = collection(
      firestore,
      "games",
      gameId,
      "privateActions",
      userId,
      "actions"
    );
    const actionsQuery = query(actionsRef, orderBy("timestamp"));
    const privateActionsQuery = query(privateActionsRef, orderBy("timestamp"));

    function addActionToQueue(action: GameAction) {
      actionQueue.push(action);
      actionQueue.sort(
        (a, b) => a.timestamp.toMillis() - b.timestamp.toMillis()
      );
      processActionQueue();
    }

    const unsubscribePublicActions = onSnapshot(actionsQuery, (snapshot) => {
      snapshot
        .docChanges()
        .filter((change) => change.type === "added")
        .forEach((change) => {
          const action = change.doc.data() as GameAction;
          addActionToQueue(action);
        });
    });

    const unsubscribePrivateActions = onSnapshot(
      privateActionsQuery,
      (snapshot) => {
        snapshot
          .docChanges()
          .filter((change) => change.type === "added")
          .forEach((change) => {
            const action = change.doc.data() as GameAction;
            addActionToQueue(action);
          });
      }
    );

    return () => {
      unsubscribePublicActions();
      unsubscribePrivateActions();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId, userId]);

  return (
    <GameActionContext.Provider
      value={{ registerHandlers, unregisterHandlers }}
    >
      {children}
    </GameActionContext.Provider>
  );
}

// Hook for consumers to register their handlers
export function useGameActions(handlers: GameActionHandlers) {
  const context = useContext(GameActionContext);
  if (!context) {
    throw new Error("useGameActions must be used within a GameActionProvider");
  }
  const { registerHandlers, unregisterHandlers } = context;
  const handlerIdRef = useRef<HandlerId | null>(null);

  useEffect(() => {
    handlerIdRef.current = registerHandlers(handlers);
    return () => {
      if (handlerIdRef.current) {
        unregisterHandlers(handlerIdRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handlers]);
}
