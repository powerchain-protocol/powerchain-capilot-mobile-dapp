import {
  createContext,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import { StatusBar } from "expo-status-bar";
import {
  darkGreenTheme,
  darkTheme,
  lightTheme,
  themes,
  type ThemeName,
  type ThemeTokens,
} from "./themes";

type ThemeContextValue = {
  theme: ThemeTokens;
  themeName: ThemeName;
  setThemeName: (name: ThemeName) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function PowerChainThemeProvider({
  children,
  defaultTheme = "light",
}: PropsWithChildren<{ defaultTheme?: ThemeName }>) {
  const [themeName, setThemeName] = useState<ThemeName>(defaultTheme);

  const theme = useMemo(() => themes[themeName], [themeName]);

  return (
    <ThemeContext.Provider value={{ theme, themeName, setThemeName }}>
      <StatusBar style={theme.dark ? "light" : "dark"} />
      {children}
    </ThemeContext.Provider>
  );
}

export function usePowerChainTheme() {
  const value = useContext(ThemeContext);
  if (!value) {
    throw new Error(
      "usePowerChainTheme must be used inside PowerChainThemeProvider",
    );
  }
  return value;
}

export const PowerChainThemes = {
  light: lightTheme,
  dark: darkTheme,
  darkGreen: darkGreenTheme,
} as const;
