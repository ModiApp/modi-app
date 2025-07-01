import React from "react";

import TextInput, { TextInputProps } from "@/ui/elements/TextInput";
import { useUsername } from "@/ui/providers/Username";

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
