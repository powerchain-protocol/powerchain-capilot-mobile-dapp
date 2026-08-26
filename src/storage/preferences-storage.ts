import { Platform } from "react-native";
import { secureStorage } from "./secure-storage";
import type { KeyValueStorage } from "./types";

function hasWebStorage() {
  return Platform.OS === "web" && typeof globalThis.localStorage !== "undefined";
}

/**
 * Small-value persistence for preferences and route state.
 * Web uses localStorage; native uses Expo SecureStore so the application does
 * not add another persistence dependency solely for a few compact settings.
 */
export const preferencesStorage: KeyValueStorage = {
  async getItem(key) {
    if (hasWebStorage()) return globalThis.localStorage.getItem(key);
    return secureStorage.getItem(key);
  },
  async setItem(key, value) {
    if (hasWebStorage()) {
      globalThis.localStorage.setItem(key, value);
      return;
    }
    await secureStorage.setItem(key, value);
  },
  async removeItem(key) {
    if (hasWebStorage()) {
      globalThis.localStorage.removeItem(key);
      return;
    }
    await secureStorage.removeItem(key);
  },
};
