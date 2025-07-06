import { Dimensions } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const colors = {
  feltGreen: '#35654D',
  lightGreen: '#428161',
  blue: '#177E89',
  red: '#DB3A34',
  white: 'white',
  transparent: 'transparent',
  gray: '#4A5D5E',
} as const;
export type ColorName = keyof typeof colors;
export const fontFamilies = {
  primary: 'Chalkduster',
};
export const fontSizes = {
  sm: 14,
  md: 24,
  lg: 42,
  xl: 64,
};
export const spacings = [4, 8, 16, 32, 48];
export const sizing = {
  fullScreen: {
    width: screenWidth,
    height: screenHeight,
  },
};
