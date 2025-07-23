import { firestore } from "@/config/firebase";
import {
  GameAction,
  GameActions,
  GameActionType,
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

type GameActionHandlers = {
  [HandlerKey in GameActionType]?: (
    action: GameAction<HandlerKey>
  ) => Promise<void>;
};

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
  const actionQueue = useRef<GameActions[]>([]).current;
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
  const processAction = async (action: GameActions) => {
    console.log("Processing action:", action);
    await Promise.all(
      handlerEntries.current.map(async ({ handlers }) => {
        // @ts-expect-error too complex for typescript
        return handlers[action.type]?.(action);
      })
    );
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

    function addActionToQueue(action: GameActions) {
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
          const action = change.doc.data() as GameActions;
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
            const action = change.doc.data() as GameActions;
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
