import React, { createContext, useContext, useMemo, useState } from "react";

type AnimationSpeedContextValue = {
  isFastForwarding: boolean;
  enableFastForward(): void;
  disableFastForward(): void;
  toggleFastForward(): void;
  getDuration(duration: number): number;
  getDelay(delay: number): number;
};

const AnimationSpeedContext = createContext<AnimationSpeedContextValue | null>(
  null
);

export function AnimationSpeedProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isFastForwarding, setIsFastForwarding] = useState(false);

  const value = useMemo<AnimationSpeedContextValue>(() => {
    const maybeSkip = (value: number) => (isFastForwarding ? 0 : value);
    return {
      isFastForwarding,
      enableFastForward: () => setIsFastForwarding(true),
      disableFastForward: () => setIsFastForwarding(false),
      toggleFastForward: () => setIsFastForwarding((current) => !current),
      getDuration: maybeSkip,
      getDelay: maybeSkip,
    };
  }, [isFastForwarding]);

  return (
    <AnimationSpeedContext.Provider value={value}>
      {children}
    </AnimationSpeedContext.Provider>
  );
}

export function useAnimationSpeed() {
  const context = useContext(AnimationSpeedContext);
  if (!context) {
    throw new Error(
      "useAnimationSpeed must be used within an AnimationSpeedProvider"
    );
  }
  return context;
}
