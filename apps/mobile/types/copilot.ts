export type ChatRole = 'user' | 'assistant';

export type McpProvenanceItem = { server?: string; tool: string; status: 'completed' | 'failed' };
export type CopilotProvenance = { provider?: string; model?: string; mcp?: McpProvenanceItem[] };

export type CopilotMessageUnit = {
  id: string;
  requestId: string;
  reservationId: string;
  quoteHash: string;
  unit: 'MSG UNIT';
  quantity: '1';
  pwrcDebit: string;
  baseUnitsDebit: string;
  referencePriceUsdPerPwrc: string;
  referenceValueUsd: string;
  referenceOnly: true;
  receiptId: string;
  receiptHash: string;
};

export type ChatMessage = {
  id: string;
  role: ChatRole;
  text: string;
  createdAt: number;
  provenance?: CopilotProvenance;
  messageUnit?: CopilotMessageUnit;
};

export type CopilotRequest = {
  message: string;
  conversationId?: string;
  agent?: 'researcher' | 'analyst' | 'risk' | 'capital' | 'operator';
};

export type SignedPwrcReceipt = {
  version: '1';
  receiptId: string;
  quoteId: string;
  quoteHash: string;
  reservationId: string;
  responseId: string;
  organizationId: string;
  accountId: string;
  mint: string;
  amountBaseUnits: '10000000000000';
  amountDisplay: '10000';
  status: 'SETTLED';
  settledAt: string;
  ledgerEntryId: string;
  previousReceiptHash: string | null;
  receiptHash: string;
  signature: string;
};

export type CopilotCreditCharge = {
  quoteId?: string;
  quoteHash: string;
  quotePersisted?: boolean;
  reservationId: string;
  chargedBaseUnits: string;
  chargedPwrc?: string;
  availableBaseUnits: string;
  availablePwrc?: string;
  settlementStatus?: 'settled';
  receipt?: SignedPwrcReceipt;
};

export type CopilotDelivery = {
  responseId: string;
  reservationId: string;
  responseHash: string;
  status: 'completed';
};

export type CopilotResponse = {
  id?: string;
  conversationId?: string;
  message?: string;
  outputText?: string;
  output_text?: string;
  credits?: CopilotCreditCharge;
  delivery?: CopilotDelivery;
  provenance?: CopilotProvenance;
  messageUnit?: CopilotMessageUnit;
};
