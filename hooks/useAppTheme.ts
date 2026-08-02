import { useFamilyStore } from '@/store/familyStore';
import { DARK_COLORS, LIGHT_COLORS } from '@/constants/theme';

export function useAppTheme() {
  const theme = useFamilyStore((s) => s.theme);
  const isDark = theme === 'dark';
  const colors = isDark ? DARK_COLORS : LIGHT_COLORS;
  return { colors, isDark, theme };
}
