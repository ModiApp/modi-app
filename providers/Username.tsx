import { useAsyncStorage } from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "@modi/username";

export function useUsername() {
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

  return { value: username, setValue: setUsername };
}
