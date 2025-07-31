import { auth } from "@/config/firebase";
import { updateProfile } from "firebase/auth";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

const UsernameContext = createContext<{
  value: string;
  setValue: (name: string) => Promise<void>;
  isLoading: boolean;
}>({
  value: "",
  setValue: () => Promise.resolve(),
  isLoading: true,
});

export function UsernameProvider(props: { children: React.ReactNode }) {
  const { children } = props;
  const [username, setUsernameState] = useState(
    auth.currentUser?.displayName || ""
  );
  const [isLoading, setIsLoading] = useState(!auth.currentUser);

  useEffect(() => {
    // Get username from Firebase Auth's displayName
    const user = auth.currentUser;
    if (user && user.displayName) {
      setUsernameState(user.displayName);
    }
    // Listen for auth state changes in case user logs in/out
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUsernameState(user?.displayName || "");
      setIsLoading(false);
    });
    return unsubscribe;
  }, []);

  const setUsername = useCallback(async (name: string) => {
    setUsernameState(name);
    const user = auth.currentUser;
    if (user) {
      await updateProfile(user, { displayName: name });
    }
  }, []);

  return (
    <UsernameContext.Provider
      value={{ value: username, setValue: setUsername, isLoading }}
    >
      {children}
    </UsernameContext.Provider>
  );
}

export function useUsername() {
  return useContext(UsernameContext);
}
