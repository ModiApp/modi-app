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

  errorRed: '#DC2626',
  errorBg: '#FEF2F2',
  errorBorder: '#FECACA',
  successGreen: '#059669',
  successBg: '#F0FDF4',
  successBorder: '#BBF7D0',
  warningYellow: '#D97706',
  warningBg: '#FFFBEB',
  warningBorder: '#FED7AA',
  infoBg: '#EFF6FF',
  infoBorder: '#DBEAFE',
  darkText: '#1F2937',
  lightText: '#6B7280',
} as const;
export type ColorName = keyof typeof colors;
export const fontFamilies = {
  primary: 'Chalkduster',
  alert: 'system-ui, -apple-system, sans-serif',
} as const;
export type FontFamily = keyof typeof fontFamilies;
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
