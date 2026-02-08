/**
 * This auth provider uses Firebase Auth to automatically authenticate the user on app start.
 * The whole app is wrapped with this provider, so we can access the user's auth state anywhere.
 *
 * We're currently using Firebase Anonymous authentication, which means that the user is automatically authenticated with a random ID.
 * This is fine for our use case, as we don't need a user's email or password.
 *
 * We just need a persistent user id, so we can identify the user across sessions, and authorize them to access the game.
 */
import { auth } from "@/config/firebase";
import { signInAnonymously } from "firebase/auth";
import { createContext, useContext, useEffect, useState } from "react";

interface AuthContextValue {
  userId: string | null;
  isLoading: boolean;
  error: Error | null;
}

const AuthContext = createContext<AuthContextValue>({
  userId: null,
  isLoading: true,
  error: null,
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: React.PropsWithChildren) {
  const [userId, setUserId] = useState<string | null>(auth.currentUser?.uid ?? null);
  const [isLoading, setIsLoading] = useState(!auth.currentUser);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Listen for auth state changes - this fires as soon as Firebase knows the user
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        console.debug("Auth state changed: signed in", user.uid);
        setUserId(user.uid);
        setIsLoading(false);
        // Force-refresh token in background (useful after emulator restarts)
        user.getIdToken(true).catch((e) => {
          console.warn("Failed to refresh ID token", e);
        });
      } else {
        // No user yet, trigger anonymous sign-in
        console.debug("Auth state changed: no user, signing in anonymously");
        signInAnonymously(auth).catch((err) => {
          console.error("Error signing in anonymously", err);
          setError(err);
          setIsLoading(false);
        });
      }
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ userId, isLoading, error }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useUserId() {
  const { userId } = useAuth();
  if (!userId) {
    throw new Error("useUserId must be used within an AuthProvider");
  }
  return userId;
}
