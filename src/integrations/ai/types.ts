import type {
  PwrcCreditAccount,
  PwrcMessageReceipt,
} from "../../features/credits";

export type AiContext = {
  network?: string;
  walletAddress?: string;
  screen?: string;
  assetIds?: string[];
  metadata?: Record<string, unknown>;
};

export type AiChatRequest = {
  conversationId?: string;
  clientRequestId: string;
  message: string;
  context?: AiContext;
};

export type AiChatSettledResponse = {
  conversationId: string;
  messageId: string;
  content: string;
  model: string;
  creditReceipt: PwrcMessageReceipt;
  creditAccount: PwrcCreditAccount;
  creditSettlement: "settled";
  replay?: boolean;
};

export type AiChatPendingResponse = {
  conversationId: string;
  pendingResponseId: string;
  content: string;
  model: string;
  responseToken: string;
  creditReceipt: null;
  creditAccount: PwrcCreditAccount;
  creditSettlement: "pending_ack";
  replay?: boolean;
};

export type AiChatWireResponse =
  | AiChatSettledResponse
  | AiChatPendingResponse;

// The application-facing call only resolves after delivery acknowledgement and
// PWRC settlement. Screens therefore never render an unacknowledged response.
export type AiChatResponse = AiChatSettledResponse;
