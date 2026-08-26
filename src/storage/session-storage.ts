import { STORAGE_KEYS } from "./keys";
import { secureStorage } from "./secure-storage";

export const sessionStorage = {
  getToken() {
    return secureStorage.getItem(STORAGE_KEYS.session);
  },
  setToken(token: string) {
    return secureStorage.setItem(STORAGE_KEYS.session, token);
  },
  clearToken() {
    return secureStorage.removeItem(STORAGE_KEYS.session);
  },
};
