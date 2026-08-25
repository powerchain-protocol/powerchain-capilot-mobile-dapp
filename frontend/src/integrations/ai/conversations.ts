import { apiFetch } from "../../api/client";
import type {
  ConversationDetail,
  ConversationListResponse,
} from "../../types/messages";

export async function listConversations(cursor?: string) {
  const params = new URLSearchParams();
  if (cursor) params.set("cursor", cursor);

  return apiFetch<ConversationListResponse>(
    `/ai/conversations${params.size ? `?${params}` : ""}`,
  );
}

export async function getConversation(id: string) {
  return apiFetch<ConversationDetail>(
    `/ai/conversations/${encodeURIComponent(id)}`,
  );
}

export async function deleteConversation(id: string) {
  return apiFetch<void>(
    `/ai/conversations/${encodeURIComponent(id)}`,
    { method: "DELETE" },
  );
}
