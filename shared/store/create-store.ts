export type StoreListener<T> = (state: T) => void;

export function createStore<T>(initial: T) {
  let state = initial;
  const listeners = new Set<StoreListener<T>>();
  return {
    getState: () => state,
    setState(next: T | ((current: T) => T)) {
      state = typeof next === 'function' ? (next as (current: T) => T)(state) : next;
      for (const listener of listeners) listener(state);
    },
    subscribe(listener: StoreListener<T>) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
