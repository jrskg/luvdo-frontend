/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#000000',
    background: '#ffffff',
    backgroundElement: '#F0F0F3',
    backgroundSelected: '#E0E1E6',
    textSecondary: '#60646C',
  },
  dark: {
    text: '#ffffff',
    background: '#000000',
    backgroundElement: '#212225',
    backgroundSelected: '#2E3135',
    textSecondary: '#B0B4BA',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;

// Romantic + gaming palette — deep purple cosmos with hot pink accents
export const T = {
  // Backgrounds
  bg:         '#130025',   // deepest background
  bgSurface:  '#1e003d',   // cards, panels
  bgElevated: '#2b0554',   // elevated/active surfaces
  bgInput:    '#170030',   // input fields

  // Brand accent
  pink:      '#e91e8c',
  pinkLight: '#ff79c6',
  pinkDim:   'rgba(233,30,140,0.12)',

  // Supporting
  purple:      '#7c3aed',
  purpleLight: '#a78bfa',
  lavender:    '#c4b5fd',

  // Text
  text:      '#ffffff',
  textSub:   '#c4b5fd',   // lavender secondary
  textMuted: '#7c6a9a',

  // Borders
  border:    '#2e1060',
  borderAct: '#7c3aed',

  // Status
  success: '#10b981',
  error:   '#ef4444',
  gold:    '#f59e0b',
};

// Board-specific vivid colors
export const BOARD_COLORS = {
  red:    '#e53935',
  green:  '#43a047',
  yellow: '#fdd835',
  blue:   '#1e88e5',
  white:  '#ffffff',
  cream:  '#fafafa',
  boardBorder: '#e8d5ff',
};
