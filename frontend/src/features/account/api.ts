import {
  apiFetch,
  clearSessionToken,
  setSessionToken,
} from "../../api/client";
import type { Account, AuthResult } from "./types";

export async function registerAccount(input: {
  email: string;
  password: string;
  displayName: string;
}) {
  const result = await apiFetch<AuthResult>("/auth/register", {
    method: "POST",
    body: JSON.stringify(input),
  });
  await setSessionToken(result.token);
  return result.account;
}

export async function loginAccount(input: {
  email: string;
  password: string;
}) {
  const result = await apiFetch<AuthResult>("/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  });
  await setSessionToken(result.token);
  return result.account;
}

export async function getCurrentAccount() {
  return apiFetch<Account>("/account/me");
}

export async function updateProfile(input: {
  displayName?: string;
  organization?: string | null;
  jobTitle?: string | null;
  country?: string | null;
  timezone?: string | null;
  interests?: string[];
}) {
  return apiFetch<Account>("/account/profile", {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function logoutAccount() {
  try {
    await apiFetch<void>("/auth/logout", { method: "POST" });
  } finally {
    await clearSessionToken();
  }
}
