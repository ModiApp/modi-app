import { useAsyncStorage } from "@react-native-async-storage/async-storage";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

const STORAGE_KEY = "@modi/username";

const UsernameContext = createContext<{
  value: string;
  setValue: (name: string) => void;
}>({
  value: "",
  setValue: () => {},
});

export function UsernameProvider(props: { children: React.ReactNode }) {
  const { children } = props;

  const { getItem, setItem } = useAsyncStorage(STORAGE_KEY);
  const [username, setUsernameState] = useState("");

  useEffect(() => {
    getItem().then((val) => {
      if (val) setUsernameState(val);
    });
  }, [getItem]);

  const setUsername = useCallback(
    (name: string) => {
      setUsernameState(name);
      setItem(name);
    },
    [setItem]
  );

  return (
    <UsernameContext.Provider
      value={{ value: username, setValue: setUsername }}
    >
      {children}
    </UsernameContext.Provider>
  );
}

export function useUsername() {
  return useContext(UsernameContext);
}
