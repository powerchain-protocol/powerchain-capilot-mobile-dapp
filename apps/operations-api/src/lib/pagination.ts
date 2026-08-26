import { operationalError } from "./operational-error.js";

export const MAX_PAGE_SIZE = 100;
export const DEFAULT_PAGE_SIZE = 30;

export function pageLimit(value: unknown): number {
  if (value == null || value === "") return DEFAULT_PAGE_SIZE;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > MAX_PAGE_SIZE) {
    throw operationalError("INVALID_PAGE_LIMIT", 400, `limit must be between 1 and ${MAX_PAGE_SIZE}.`);
  }
  return parsed;
}

export function encodeCursor(input: { createdAt: Date; id: string }): string {
  return Buffer.from(JSON.stringify({ t: input.createdAt.toISOString(), id: input.id })).toString("base64url");
}

export function decodeCursor(value: unknown): { createdAt: Date; id: string } | null {
  if (value == null || value === "") return null;
  try {
    const raw = JSON.parse(Buffer.from(String(value), "base64url").toString("utf8")) as { t?: unknown; id?: unknown };
    if (typeof raw.t !== "string" || typeof raw.id !== "string") throw new Error();
    const createdAt = new Date(raw.t);
    if (!Number.isFinite(createdAt.getTime())) throw new Error();
    return { createdAt, id: raw.id };
  } catch {
    throw operationalError("INVALID_CURSOR", 400, "Cursor is malformed.");
  }
}
