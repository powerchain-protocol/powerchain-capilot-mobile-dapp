import type { McpInvocationSummary, PwrcMessageReceipt } from "../features/credits";

export type MessageRole = "assistant" | "user" | "system";

export type MessageStatus =
  | "queued"
  | "sending"
  | "sent"
  | "streaming"
  | "failed"
  | "cancelled";

export type MessageAttachment = {
  id: string;
  type: "image" | "document" | "evidence" | "chart";
  name: string;
  uri?: string;
  mimeType?: string;
  size?: number;
};

export type MessageCitation = {
  id: string;
  label: string;
  source?: string;
  uri?: string;
};

export type MessageAction = {
  id: string;
  label: string;
  kind:
    | "open"
    | "review"
    | "approve"
    | "retry"
    | "copy"
    | "regenerate";
  disabled?: boolean;
};

export type CopilotMessage = {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: string;
  updatedAt?: string;
  status?: MessageStatus;
  model?: string;
  agent?: string;
  skill?: string;
  attachments?: MessageAttachment[];
  citations?: MessageCitation[];
  chartIds?: string[];
  actions?: MessageAction[];
  error?: {
    code?: string;
    message: string;
    retryable?: boolean;
  };
  creditReceipt?: PwrcMessageReceipt;
  mcpInvocations?: McpInvocationSummary[];
};

export type ConversationSummary = {
  id: string;
  title: string;
  preview?: string;
  updatedAt: string;
  unread?: boolean;
  pinned?: boolean;
};

export type ConversationDetail = {
  id: string;
  title: string | null;
  context?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  messages: CopilotMessage[];
};

export type ConversationListResponse = {
  items: ConversationSummary[];
  nextCursor?: string | null;
};
