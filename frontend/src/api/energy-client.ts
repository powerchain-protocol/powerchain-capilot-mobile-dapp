import { mobileEnv } from "../config/env";
import { AppError, mapHttpStatusToErrorCode } from "../shared/errors";
import { getSessionToken } from "./client";

export async function energyApiFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const token = await getSessionToken();
  const response = await fetch(`${mobileEnv.energyApiUrl}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    let payload: { error?: string; message?: string; details?: unknown } | null = null;
    try {
      payload = (await response.json()) as typeof payload;
    } catch {
      // Preserve the HTTP status even if an upstream service returns non-JSON.
    }
    throw new AppError(
      payload?.message ?? payload?.error ?? `Energy API request failed (${response.status})`,
      {
        code: mapHttpStatusToErrorCode(response.status),
        status: response.status,
        details: payload,
        retryable: response.status === 429 || response.status >= 500,
      },
    );
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}
