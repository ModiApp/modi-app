import React from "react";

import { useUsername } from "@/providers/Username";
import TextInput, { TextInputProps } from "@/ui/elements/TextInput";

type UsernameInputProps = Exclude<
  TextInputProps,
  "placeholder" | "value" | "onEndEditing"
>;
function UsernameInput(props: UsernameInputProps) {
  const username = useUsername();

  return (
    <TextInput
      placeholder="Username"
      value={username.value}
      onChangeText={username.setValue}
      {...props}
    />
  );
}

export default UsernameInput;
