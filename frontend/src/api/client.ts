import { mobileEnv } from "../config/env";
import { AppError, mapHttpStatusToErrorCode } from "../shared/errors";
import { sessionStore } from "../store/session-store";

const API_URL = mobileEnv.apiUrl;


export type ApiErrorPayload = {
  error: string;
  message?: string;
  details?: unknown;
};

export async function getSessionToken() {
  const current = sessionStore.getState();
  if (current.hydrated) return current.token;
  return sessionStore.hydrate();
}

export async function setSessionToken(token: string) {
  await sessionStore.setToken(token);
}

export async function clearSessionToken() {
  await sessionStore.clear();
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const token = await getSessionToken();

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    let payload: ApiErrorPayload | null = null;
    try {
      payload = (await response.json()) as ApiErrorPayload;
    } catch {
      // Ignore malformed server error payload.
    }

    throw new AppError(
      payload?.message ?? payload?.error ?? `Request failed (${response.status})`,
      {
        code: mapHttpStatusToErrorCode(response.status),
        status: response.status,
        details: payload,
        retryable: response.status === 429 || response.status >= 500,
      },
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
