import { requestJson } from '@/lib/http';
import type { AiMemoryItem, StoredChatMessage, StoredConversation } from '@/types/chat';

export async function listConversations(accessToken: string, limit = 50) {
  return requestJson<{ conversations: StoredConversation[] }>(`/api/v1/chat/conversations?limit=${Math.min(100, Math.max(1, limit))}`, { authToken: accessToken });
}

export async function listConversationMessages(accessToken: string, conversationId: string, limit = 100) {
  return requestJson<{ messages: StoredChatMessage[] }>(`/api/v1/chat/conversations/${encodeURIComponent(conversationId)}/messages?limit=${Math.min(500, Math.max(1, limit))}`, { authToken: accessToken });
}

export async function listAiMemory(accessToken: string, conversationId?: string) {
  const suffix = conversationId ? `?conversationId=${encodeURIComponent(conversationId)}` : '';
  return requestJson<{ memories: AiMemoryItem[] }>(`/api/v1/ai/memory${suffix}`, { authToken: accessToken });
}
