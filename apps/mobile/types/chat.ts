export type StoredConversation = {
  id: string;
  slug: string;
  title: string;
  createdAt: string;
  updatedAt: string;
};

export type StoredChatMessage = {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  contentHash: string;
  provider?: string | null;
  model?: string | null;
  reservationId?: string | null;
  messageUnitId?: string | null;
  receiptId?: string | null;
  receiptHash?: string | null;
  pwrcDebitBaseUnits?: string | null;
  referenceValueUsd?: string | null;
  createdAt: string;
};

export type AiMemoryItem = { kind: 'preference' | 'context' | 'decision' | 'summary'; content: string };
