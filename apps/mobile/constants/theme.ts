export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
} as const;

export const typography = {
  title: 28,
  heading: 20,
  body: 16,
  small: 13,
  micro: 11,
} as const;

export const lightTheme = {
  background: '#F6F8F7',
  surface: '#FFFFFF',
  surfaceMuted: '#EEF2F0',
  text: '#102018',
  textMuted: '#5E6C64',
  border: '#DDE5E0',
  primary: '#0B6B3A',
  primaryPressed: '#07542D',
  primaryText: '#FFFFFF',
  success: '#167A46',
  warning: '#A46100',
  danger: '#B3261E',
  bubbleUser: '#0B6B3A',
  bubbleAssistant: '#FFFFFF',
} as const;

export const carbonDarkTheme = {
  background: '#090C0B',
  surface: '#111714',
  surfaceMuted: '#18211C',
  text: '#F2F6F3',
  textMuted: '#A7B2AB',
  border: '#26312B',
  primary: '#4BB978',
  primaryPressed: '#37915C',
  primaryText: '#061109',
  success: '#57C786',
  warning: '#E1A64C',
  danger: '#FF8A80',
  bubbleUser: '#176B40',
  bubbleAssistant: '#111714',
} as const;

// Backward-compatible alias for existing components.
export const darkTheme = carbonDarkTheme;

export type AppTheme = typeof lightTheme | typeof carbonDarkTheme;
