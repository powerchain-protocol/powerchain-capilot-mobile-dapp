export type AiContext = {
  network?: string;
  walletAddress?: string;
  screen?: string;
  assetIds?: string[];
  metadata?: Record<string, unknown>;
};

export type AiChatRequest = {
  conversationId?: string;
  message: string;
  context?: AiContext;
};

export type AiChatResponse = {
  conversationId: string;
  messageId: string;
  content: string;
  model: string;
};
