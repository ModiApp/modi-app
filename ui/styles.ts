import { Dimensions } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export type ColorName = 'blue' | 'red' | 'feltGreen' | 'lightGreen' | 'white' | 'transparent';
export const colors: { [key in ColorName]: string } = {
  feltGreen: '#35654D',
  lightGreen: '#428161',
  blue: '#177E89',
  red: '#DB3A34',
  white: 'white',
  transparent: 'transparent',
};
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
