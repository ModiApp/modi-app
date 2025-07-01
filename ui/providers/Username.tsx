import React, {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@modi/username";

const UsernameContext = createContext({
  value: "",
  setValue(username: string) {},
});

export function UsernameProvider(props: React.PropsWithChildren) {
  const [username, _setUsername] = useState("");

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((val) => {
      if (val) _setUsername(val);
    });
  }, []);

  const setUsername = useCallback((name: string) => {
    _setUsername(name);
    AsyncStorage.setItem(STORAGE_KEY, name);
  }, []);

  return (
    <UsernameContext.Provider
      value={{
        value: username,
        setValue: setUsername,
      }}
    >
      {props.children}
    </UsernameContext.Provider>
  );
}

const useUsername = () => useContext(UsernameContext);

export default useUsername;
