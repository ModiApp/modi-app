import React from "react";
import { View, ViewProps } from "react-native";

import { ColorName, colors } from "@/ui/styles";

export interface ContainerProps extends ViewProps {
  color?: ColorName;
}

function Container({ color, style, ...props }: ContainerProps) {
  const extraStyles = [
    color ? { backgroundColor: colors[color] } : null,
  ].filter(Boolean);

  return <View {...props} style={[style, ...extraStyles]} />;
}

export default Container;
