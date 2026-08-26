import { sessionStorage } from "../storage";
import { createStore } from "./create-store";

export type SessionStoreState = {
  token: string | null;
  hydrated: boolean;
  loading: boolean;
};

const store = createStore<SessionStoreState>({
  token: null,
  hydrated: false,
  loading: false,
});

let hydrationPromise: Promise<string | null> | null = null;

export const sessionStore = {
  ...store,
  async hydrate() {
    if (store.getState().hydrated) return store.getState().token;
    if (hydrationPromise) return hydrationPromise;

    store.patch({ loading: true });
    hydrationPromise = sessionStorage
      .getToken()
      .then((token) => {
        store.patch({ token, hydrated: true, loading: false });
        return token;
      })
      .finally(() => {
        hydrationPromise = null;
      });

    return hydrationPromise;
  },
  async setToken(token: string) {
    await sessionStorage.setToken(token);
    store.patch({ token, hydrated: true, loading: false });
  },
  async clear() {
    await sessionStorage.clearToken();
    store.patch({ token: null, hydrated: true, loading: false });
  },
};
