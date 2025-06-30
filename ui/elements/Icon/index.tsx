import React from 'react';
import { Platform } from 'react-native';

import BaseIcon from '@expo/vector-icons/Ionicons';
import { IconProps as BaseIconProps } from '@expo/vector-icons/build/createIconSet';


type IconName = 'back' | 'home';
interface IconProps extends BaseIconProps<IconName> {
  size?: number;
}

const iconNameMap = {
  back: Platform.OS === 'ios' ? 'ios-arrow-back' : 'md-arrow-back',
  home: 'home-sharp',
} as const;

const Icon: React.FC<IconProps> = ({ name, ...props }) => {
  return <BaseIcon name={iconNameMap[name]} {...props} />;
};

export default Icon;
