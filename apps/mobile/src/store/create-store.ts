import { useSyncExternalStore } from "react";

export type StoreListener = () => void;

export type ExternalStore<TState> = {
  getState(): TState;
  setState(next: TState | ((current: TState) => TState)): void;
  patch(patch: Partial<TState> | ((current: TState) => Partial<TState>)): void;
  subscribe(listener: StoreListener): () => void;
  useStore<TSelected>(selector: (state: TState) => TSelected): TSelected;
};

export function createStore<TState>(initialState: TState): ExternalStore<TState> {
  let state = initialState;
  const listeners = new Set<StoreListener>();

  function emit() {
    listeners.forEach((listener) => listener());
  }

  return {
    getState() {
      return state;
    },
    setState(next) {
      state = typeof next === "function" ? (next as (current: TState) => TState)(state) : next;
      emit();
    },
    patch(patch) {
      const partial = typeof patch === "function" ? patch(state) : patch;
      state = { ...state, ...partial };
      emit();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    useStore(selector) {
      return useSyncExternalStore(
        (listener) => {
          listeners.add(listener);
          return () => listeners.delete(listener);
        },
        () => selector(state),
        () => selector(state),
      );
    },
  };
}
