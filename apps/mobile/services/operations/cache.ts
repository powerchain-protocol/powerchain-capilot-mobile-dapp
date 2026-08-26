type CacheEntry<T> = { value: T; updatedAt: number };

class OperationalCache {
  private readonly entries = new Map<string, CacheEntry<unknown>>();

  get<T>(key: string): CacheEntry<T> | undefined {
    return this.entries.get(key) as CacheEntry<T> | undefined;
  }

  set<T>(key: string, value: T) {
    const entry = { value, updatedAt: Date.now() };
    this.entries.set(key, entry);
    return entry;
  }

  delete(key: string) { this.entries.delete(key); }
  clear() { this.entries.clear(); }
}

export const operationalCache = new OperationalCache();
