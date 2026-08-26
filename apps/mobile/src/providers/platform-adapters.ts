import { RemoteAuthAdapter } from "@powerchain/platform-adapters";
import { mobileEnv } from "../config/env";
import { sessionStore } from "../store/session-store";

export const platformAuthAdapter = new RemoteAuthAdapter({
  baseUrl: mobileEnv.apiUrl,
  async getToken() {
    return sessionStore.getState().token;
  },
  async setToken(token) {
    if (token) await sessionStore.setToken(token);
    else await sessionStore.clear();
  },
});
