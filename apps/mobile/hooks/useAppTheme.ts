import { carbonDarkTheme, lightTheme } from '@/constants/theme';
import { useThemePreference } from '@/context/ThemeContext';

export function useAppTheme() {
  const { resolved } = useThemePreference();
  return resolved === 'carbon-dark' ? carbonDarkTheme : lightTheme;
}
