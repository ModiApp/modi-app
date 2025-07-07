import React from "react";
import { Platform } from "react-native";

import BaseIcon from "@expo/vector-icons/Ionicons";
import {
  IconProps as BaseIconProps,
  Icon as BaseIconType,
} from "@expo/vector-icons/build/createIconSet";

type IconName = "back" | "home";
interface IconProps extends BaseIconProps<IconName> {
  size?: number;
}

type IoniconIconName = typeof BaseIcon extends BaseIconType<infer G, infer FN>
  ? G
  : never;

console.log(Platform.OS);

const iconNameMap = {
  back: "arrow-back",
  home: "home-sharp",
} satisfies Record<IconName, IoniconIconName>;

const Icon: React.FC<IconProps> = ({ name, ...props }) => {
  return <BaseIcon name={iconNameMap[name]} {...props} />;
};

export default Icon;
