import * as SecureStore from "expo-secure-store";
import { mobileEnv } from "../config/env";

const API_URL = mobileEnv.apiUrl;

const SESSION_KEY = "powerchain.session";

export type ApiErrorPayload = {
  error: string;
  message?: string;
  details?: unknown;
};

export async function getSessionToken() {
  return SecureStore.getItemAsync(SESSION_KEY);
}

export async function setSessionToken(token: string) {
  await SecureStore.setItemAsync(SESSION_KEY, token, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

export async function clearSessionToken() {
  await SecureStore.deleteItemAsync(SESSION_KEY);
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

    const error = new Error(
      payload?.message ?? payload?.error ?? `Request failed (${response.status})`,
    ) as Error & {
      status?: number;
      payload?: ApiErrorPayload | null;
    };

    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
