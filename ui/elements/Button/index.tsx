import React, { useMemo } from "react";
import {
  StyleProp,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps,
  TouchableOpacity,
} from "react-native";

import Text from "src/elements/Text";
import { colors, ColorName } from "src/styles";

interface ButtonProps {
  color?: ColorName;
  title?: string;

  /** Defaults to true */
  fullWidth?: boolean;

  /** Custom styles for the title Text component */
  titleStyle?: StyleProp<TextStyle>;

  /** Lessens padding of button title. Default is false */
  thin?: boolean;
}

const Button: React.FC<ButtonProps & TouchableOpacityProps> = ({
  title,
  onPress,
  color,
  fullWidth,
  titleStyle,
  thin,
  children,
  style,
  ...props
}) => {
  const defaultStyles = useMemo<StyleProp<ViewStyle>>(
    () => ({
      backgroundColor: color ? colors[color] : undefined,
      padding: 16,
      paddingVertical: thin ? 6 : 16,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
    }),
    [color, thin, fullWidth]
  );

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[defaultStyles, style]}
      {...props}
    >
      {title ? <Text style={titleStyle}>{title}</Text> : children}
    </TouchableOpacity>
  );
};

export default Button;
