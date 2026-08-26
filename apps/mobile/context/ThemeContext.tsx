import { createContext, type PropsWithChildren, useContext, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';

export type ThemePreference = 'system' | 'light' | 'carbon-dark';

const ThemePreferenceContext = createContext<{
  preference: ThemePreference;
  resolved: 'light' | 'carbon-dark';
  setPreference: (value: ThemePreference) => void;
} | null>(null);

export function ThemePreferenceProvider({ children }: PropsWithChildren) {
  const system = useColorScheme();
  const [preference, setPreference] = useState<ThemePreference>('system');
  const resolved = preference === 'system' ? (system === 'dark' ? 'carbon-dark' : 'light') : preference;
  const value = useMemo(() => ({ preference, resolved, setPreference }), [preference, resolved]);
  return <ThemePreferenceContext.Provider value={value}>{children}</ThemePreferenceContext.Provider>;
}

export function useThemePreference() {
  const value = useContext(ThemePreferenceContext);
  if (!value) throw new Error('useThemePreference must be used inside ThemePreferenceProvider.');
  return value;
}
