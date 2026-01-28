import React from "react";
import { View } from "react-native";

import { useUsername } from "@/providers/Username";
import TextInput, { TextInputProps } from "@/ui/elements/TextInput";
import { Text } from "@/ui/elements";
import {
  USERNAME_MAX_LENGTH,
  validateUsername,
} from "@/utils/validation";

type UsernameInputProps = Omit<
  TextInputProps,
  "placeholder" | "value" | "onEndEditing"
> & {
  /** Show validation error if provided */
  error?: string | null;
  /** Called when validation state changes */
  onValidationChange?: (isValid: boolean, error: string | null) => void;
};

function UsernameInput({ error, onValidationChange, ...props }: UsernameInputProps) {
  const username = useUsername();

  const handleChangeText = (text: string) => {
    // Trim whitespace and enforce max length
    const trimmed = text.trimStart();
    const truncated = trimmed.slice(0, USERNAME_MAX_LENGTH);
    
    username.setValue(truncated);
    
    if (onValidationChange) {
      const validation = validateUsername(truncated);
      onValidationChange(validation.isValid, validation.error);
    }
  };

  return (
    <View>
      <TextInput
        placeholder="Username"
        value={username.value}
        onChangeText={handleChangeText}
        maxLength={USERNAME_MAX_LENGTH}
        autoCapitalize="none"
        autoCorrect={false}
        {...props}
      />
      {error && (
        <Text
          color="error"
          size={14}
          style={{ marginTop: 8, textAlign: "center" }}
        >
          {error}
        </Text>
      )}
    </View>
  );
}

export default UsernameInput;
