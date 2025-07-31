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
import { ScreenContainer } from "@/ui/elements";
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
    signInAnonymously(auth)
      .then((result) => {
        console.debug("Signed in anonymously", result.user.uid);
        setUserId(result.user.uid);
      })
      .catch((err) => {
        console.error("Error signing in anonymously", err);
        setError(err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  return (
    <AuthContext.Provider value={{ userId, isLoading, error }}>
      {!userId && isLoading ? <ScreenContainer /> : children}
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
