import React from "react";
import {
  TextInput as RNTextInput,
  TextInputProps as RNTextInputProps,
  StyleSheet,
} from "react-native";

import { fontFamilies } from "@/ui/styles";

export type TextInputProps = Omit<
  RNTextInputProps,
  "textAlign" | "placeholderTextColor"
>;

const TextInput: React.FC<TextInputProps> = ({ style, ...props }) => {
  return (
    <RNTextInput
      style={[styles.textInput, style]}
      {...props}
      placeholderTextColor="lightgray"
      textAlign="center"
    />
  );
};

const styles = StyleSheet.create({
  textInput: {
    backgroundColor: "white",
    color: "black",
    padding: 18,
    fontSize: 28,
    textAlign: "center",
    borderRadius: 50,
    fontFamily: fontFamilies.primary,
    includeFontPadding: false,
    textAlignVertical: "center",
  },
});

export default TextInput;
