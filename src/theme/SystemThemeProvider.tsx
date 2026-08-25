import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import { useColorScheme } from "react-native";
import { StatusBar } from "expo-status-bar";
import {
  themes,
  type ThemeName,
  type ThemeTokens,
} from "./themes";
import {
  memoryThemeStorage,
  type ThemePreference,
  type ThemeStorage,
} from "./theme-storage";

type ContextValue = {
  theme: ThemeTokens;
  preference: ThemePreference;
  resolvedThemeName: ThemeName;
  setPreference: (value: ThemePreference) => Promise<void>;
  hydrated: boolean;
};

const Context = createContext<ContextValue | null>(null);

export function SystemThemeProvider({
  children,
  storage = memoryThemeStorage,
  defaultPreference = "light",
}: PropsWithChildren<{
  storage?: ThemeStorage;
  defaultPreference?: ThemePreference;
}>) {
  const systemScheme = useColorScheme();
  const [preference, setPreferenceState] =
    useState<ThemePreference>(defaultPreference);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let active = true;

    storage
      .get()
      .then((saved) => {
        if (active && saved) setPreferenceState(saved);
      })
      .finally(() => {
        if (active) setHydrated(true);
      });

    return () => {
      active = false;
    };
  }, [storage]);

  const resolvedThemeName: ThemeName =
    preference === "system"
      ? systemScheme === "dark"
        ? "dark"
        : "light"
      : preference;

  const theme = useMemo(
    () => themes[resolvedThemeName],
    [resolvedThemeName],
  );

  async function setPreference(value: ThemePreference) {
    setPreferenceState(value);
    await storage.set(value);
  }

  return (
    <Context.Provider
      value={{
        theme,
        preference,
        resolvedThemeName,
        setPreference,
        hydrated,
      }}
    >
      <StatusBar style={theme.dark ? "light" : "dark"} />
      {children}
    </Context.Provider>
  );
}

export function useSystemPowerChainTheme() {
  const value = useContext(Context);

  if (!value) {
    throw new Error(
      "useSystemPowerChainTheme must be used inside SystemThemeProvider",
    );
  }

  return value;
}
