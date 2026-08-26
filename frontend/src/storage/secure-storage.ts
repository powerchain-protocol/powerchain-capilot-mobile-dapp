import * as SecureStore from "expo-secure-store";
import type { KeyValueStorage } from "./types";

export const secureStorage: KeyValueStorage = {
  async getItem(key) {
    return SecureStore.getItemAsync(key);
  },
  async setItem(key, value) {
    await SecureStore.setItemAsync(key, value, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  },
  async removeItem(key) {
    await SecureStore.deleteItemAsync(key);
  },
};
