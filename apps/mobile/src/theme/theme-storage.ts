import type { ThemeName } from "./themes";

export type ThemePreference = ThemeName | "system";

export type ThemeStorage = {
  get: () => Promise<ThemePreference | null>;
  set: (value: ThemePreference) => Promise<void>;
};

let memoryValue: ThemePreference | null = null;

export const memoryThemeStorage: ThemeStorage = {
  async get() {
    return memoryValue;
  },
  async set(value) {
    memoryValue = value;
  },
};

/**
 * Bind this adapter to AsyncStorage, SecureStore, MMKV, or another
 * persistence layer already used by the host application.
 *
 * Keeping storage injection-based prevents the theme package from forcing
 * a new persistence dependency into the Expo app.
 */
export function createThemeStorage(
  getItem: () => Promise<string | null>,
  setItem: (value: string) => Promise<void>,
): ThemeStorage {
  return {
    async get() {
      const value = await getItem();

      if (
        value === "light" ||
        value === "dark" ||
        value === "darkGreen" ||
        value === "system"
      ) {
        return value;
      }

      return null;
    },
    async set(value) {
      await setItem(value);
    },
  };
}
