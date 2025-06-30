import React from "react";
import {
  TextInput as RNTextInput,
  TextInputProps as RNTextInputProps,
  StyleSheet,
} from "react-native";

import { fontFamilies } from "src/styles";

export interface TextInputProps extends RNTextInputProps {}
const TextInput: React.FC<TextInputProps> = ({ style, ...props }) => {
  return (
    <RNTextInput
      style={[styles.textInput, style]}
      {...props}
      placeholderTextColor="lightgray"
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
  },
});

export default TextInput;
