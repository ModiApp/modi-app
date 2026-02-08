/**
 * This auth provider uses Firebase Auth to automatically authenticate the user on app start.
 * The whole app is wrapped with this provider, so we can access the user's auth state anywhere.
 *
 * We're currently using Firebase Anonymous authentication, which means that the user is automatically authenticated with a random ID.
 * This is fine for our use case, as we don't need a user's email or password.
 *
 * We just need a persistent user id, so we can identify the user across sessions, and authorize them to access the game.
 *
 * IMPORTANT: isLoading stays true until BOTH the user is authenticated AND the ID token
 * has been refreshed. This prevents race conditions where code assumes the token is ready
 * as soon as userId is set (e.g. useCreateGame calling getIdToken()).
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
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Use onAuthStateChanged for faster auth on returning users (Firebase caches auth state).
    // But crucially, we don't set isLoading=false until the token refresh completes.
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        console.debug("Auth state changed: signed in", user.uid);
        setUserId(user.uid);
        // Refresh token BEFORE marking loading as complete.
        // This ensures getIdToken() returns a valid token when other code runs.
        try {
          await user.getIdToken(true);
          console.debug("ID token refreshed successfully");
        } catch (e) {
          console.warn("Failed to refresh ID token", e);
        }
        setIsLoading(false);
      } else {
        // No user yet, trigger anonymous sign-in.
        // onAuthStateChanged will fire again once sign-in completes.
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
