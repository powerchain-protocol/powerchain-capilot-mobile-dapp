import { createStore } from "./create-store";

export type AppStoreState = {
  bootstrapped: boolean;
  online: boolean;
  appVisible: boolean;
  lastError: string | null;
};

export const appStore = createStore<AppStoreState>({
  bootstrapped: false,
  online: true,
  appVisible: true,
  lastError: null,
});
