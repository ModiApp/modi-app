import React, { useMemo } from "react";
import {
  Text as RNText,
  TextProps as RNTextProps,
  StyleProp,
  StyleSheet,
  TextStyle,
} from "react-native";
import Animated from "react-native-reanimated";

import { ColorName, colors, fontFamilies, FontFamily } from "@/ui/styles";

interface TextProps extends RNTextProps {
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
  ...textProps
}) => {
  const styles = useMemo<StyleProp<TextStyle>>(
    () => ({
      fontSize: size || 18,
      fontFamily: fontFamilies[fontFamily || "primary"],
      color: colors[color || "white"],
      includeFontPadding: false,
    }),
    [size, fontFamily, color]
  );

  return (
    <RNText {...textProps} style={StyleSheet.flatten([styles, style])}>
      {children}
    </RNText>
  );
};

export default Object.assign(Text, {
  Animated: Animated.createAnimatedComponent(Text),
});
