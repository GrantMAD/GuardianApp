export type ThemeMode = 'light' | 'dark';

export const DARK_COLORS = {
  bgPrimary:   '#0F0F14',
  bgCard:      '#1A1A24',
  bgElevated:  '#22223A',
  accent:      '#7C6AF5',
  accentLight: '#9B8FF7',
  accentTeal:  '#4ECDC4',
  success:     '#22C55E',
  warning:     '#F59E0B',
  danger:      '#EF4444',
  textPrimary: '#F1F1F5',
  textMuted:   '#9090A8',
  border:      '#2A2A3E',
} as const;

export const LIGHT_COLORS = {
  bgPrimary:   '#F4F6FB',
  bgCard:      '#FFFFFF',
  bgElevated:  '#E9EDF6',
  accent:      '#7C6AF5',
  accentLight: '#9B8FF7',
  accentTeal:  '#4ECDC4',
  success:     '#16A34A',
  warning:     '#D97706',
  danger:      '#DC2626',
  textPrimary: '#0F0F1A',
  textMuted:   '#64748B',
  border:      '#D4D8E8',
} as const;

// Backward-compatible alias — keeps existing imports working
export const COLORS = DARK_COLORS;

export const FONT_SIZE = {
  xs:   12,
  sm:   14,
  base: 16,
  lg:   18,
  xl:   24,
  '2xl': 32,
  '3xl': 40,
} as const;

export const SPACING = {
  xs:  4,
  sm:  8,
  md:  12,
  lg:  16,
  xl:  24,
  '2xl': 32,
} as const;

export const RADIUS = {
  sm:  8,
  md:  12,
  lg:  16,
  xl:  20,
  '2xl': 24,
  full: 9999,
} as const;
