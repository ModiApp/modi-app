import React, { useRef, useEffect } from "react";
import { View } from "react-native";

import { useUsername } from "@/providers/Username";
import TextInput, { TextInputProps } from "@/ui/elements/TextInput";
import { Text } from "@/ui/elements";
import {
  USERNAME_MAX_LENGTH,
  validateUsername,
} from "@/utils/validation";

/** Delay before showing validation errors (ms) */
const VALIDATION_DEBOUNCE_MS = 600;

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
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  const handleChangeText = (text: string) => {
    // Trim whitespace and enforce max length
    const trimmed = text.trimStart();
    const truncated = trimmed.slice(0, USERNAME_MAX_LENGTH);
    
    username.setValue(truncated);
    
    if (onValidationChange) {
      const validation = validateUsername(truncated);
      
      // Clear any pending debounce
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
        debounceTimer.current = null;
      }
      
      if (validation.isValid) {
        // Clear errors immediately when valid
        onValidationChange(true, null);
      } else {
        // Debounce showing errors to avoid nagging while typing
        debounceTimer.current = setTimeout(() => {
          onValidationChange(validation.isValid, validation.error);
        }, VALIDATION_DEBOUNCE_MS);
      }
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
