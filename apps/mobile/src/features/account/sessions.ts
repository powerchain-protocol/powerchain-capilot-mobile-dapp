import { apiFetch } from "../../api/client";

export type AccountSession = {
  id: string;
  createdAt: string;
  expiresAt: string;
  current: boolean;
  ipAddress?: string | null;
  userAgent?: string | null;
};

export async function listSessions() {
  return apiFetch<{ sessions: AccountSession[] }>(
    "/account/sessions",
  );
}

export async function revokeSession(id: string) {
  return apiFetch<void>(
    `/account/sessions/${encodeURIComponent(id)}`,
    { method: "DELETE" },
  );
}

export async function revokeOtherSessions() {
  return apiFetch<void>(
    "/account/sessions/others",
    { method: "DELETE" },
  );
}
