import React, { useRef } from "react";
import { Text as RNText, StyleProp, TextStyle } from "react-native";

import { ColorName, colors, fontFamilies, FontFamily } from "@/ui/styles";

interface TextProps extends React.PropsWithChildren {
  /** Defaults to 14 */
  size?: number;

  /** Defaults to white */
  color?: ColorName;

  /** Optional override styles */
  style?: StyleProp<TextStyle>;

  fontFamily?: FontFamily;
}

const Text: React.FC<TextProps> = ({
  size,
  children,
  style,
  color,
  fontFamily,
}) => {
  const styles = useRef<StyleProp<TextStyle>>({
    fontSize: size || 18,
    fontFamily: fontFamilies[fontFamily || "primary"],
    color: colors[color || "white"],
  }).current;

  return <RNText style={[styles, style]}>{children}</RNText>;
};

export default Text;
