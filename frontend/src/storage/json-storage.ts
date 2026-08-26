import { AppError } from "../shared/errors";
import type { JsonStorage, KeyValueStorage } from "./types";

export function createJsonStorage(storage: KeyValueStorage): JsonStorage {
  return {
    async get<T>(key: string) {
      const raw = await storage.getItem(key);
      if (raw == null) return null;

      try {
        return JSON.parse(raw) as T;
      } catch (cause) {
        throw new AppError(`Stored value for ${key} is invalid JSON.`, {
          code: "VALIDATION_ERROR",
          cause,
          details: { key },
        });
      }
    },
    async set<T>(key: string, value: T) {
      await storage.setItem(key, JSON.stringify(value));
    },
    async remove(key: string) {
      await storage.removeItem(key);
    },
  };
}
