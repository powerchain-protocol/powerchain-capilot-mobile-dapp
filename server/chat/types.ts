export type ChatRole = 'user' | 'assistant' | 'system';

export type PersistedChatMessage = {
  id: string;
  conversationId: string;
  role: ChatRole;
  content: string;
  contentHash: string;
  createdAt: Date;
  provider?: string | null;
  model?: string | null;
  reservationId?: string | null;
  messageUnitId?: string | null;
  receiptId?: string | null;
  receiptHash?: string | null;
  pwrcDebitBaseUnits?: string | null;
  referenceValueUsd?: string | null;
};

export type ChatConversationSummary = {
  id: string;
  slug: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
};

export interface ChatPersistence {
  ensureConversation(input: { userId: string; conversationId?: string; titleSeed?: string }): Promise<ChatConversationSummary>;
  appendMessage(input: { userId: string; conversationId: string; role: ChatRole; content: string; provider?: string; model?: string; reservationId?: string; messageUnitId?: string; receiptId?: string; receiptHash?: string; pwrcDebitBaseUnits?: string; referenceValueUsd?: string }): Promise<PersistedChatMessage>;
  listConversations(userId: string, limit: number): Promise<ChatConversationSummary[]>;
  listMessages(userId: string, conversationId: string, limit: number): Promise<PersistedChatMessage[]>;
}
