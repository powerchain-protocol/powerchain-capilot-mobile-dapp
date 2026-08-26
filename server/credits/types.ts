export type CreditScope = {
  userId: string;
  organizationId: string;
  accountId: string;
};

export type CreditBalances = {
  availableBaseUnits: bigint;
  reservedBaseUnits: bigint;
  spentBaseUnits: bigint;
  fundedBaseUnits: bigint;
};

export type CreditAccount = CreditScope & CreditBalances & {
  version: bigint;
  createdAt: Date;
  updatedAt: Date;
};

export type CreditLedgerEntryType =
  | 'demo_grant'
  | 'payment_credit'
  | 'reservation_created'
  | 'reservation_settled'
  | 'reservation_released'
  | 'reservation_expired'
  | 'settlement_refund'
  | 'settlement_reversal';

export type CreditLedgerEntry = CreditScope & {
  id: string;
  sequence: bigint;
  type: CreditLedgerEntryType;
  availableDeltaBaseUnits: bigint;
  reservedDeltaBaseUnits: bigint;
  spentDeltaBaseUnits: bigint;
  fundedDeltaBaseUnits: bigint;
  availableAfterBaseUnits: bigint;
  reservedAfterBaseUnits: bigint;
  spentAfterBaseUnits: bigint;
  fundedAfterBaseUnits: bigint;
  reservationId?: string;
  paymentId?: string;
  quoteHash?: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
};

export type CreditReservationStatus = 'active' | 'settled' | 'released' | 'expired';

export type CreditReservation = CreditScope & {
  id: string;
  quoteId: string;
  quoteHash: string;
  idempotencyKey: string;
  amountBaseUnits: bigint;
  status: CreditReservationStatus;
  createdAt: Date;
  expiresAt: Date;
  settledAt?: Date;
  releasedAt?: Date;
};

export type CreditQuote = CreditScope & {
  id: string;
  hash: string;
  idempotencyKey: string;
  priceVersion: string;
  product: 'copilot.response';
  quantity: number;
  unitCostBaseUnits: bigint;
  totalBaseUnits: bigint;
  issuedAt: Date;
  expiresAt: Date;
};

export type PersistedCreditQuote = CreditQuote & {
  canonicalPayload: string;
  persistedAt: Date;
};

export type CopilotDeliveryStatus = 'completed';

export type CopilotDelivery = CreditScope & {
  id: string;
  responseId: string;
  reservationId: string;
  quoteId: string;
  quoteHash: string;
  responseHash: string;
  status: CopilotDeliveryStatus;
  conversationId?: string;
  provider?: string;
  model?: string;
  providerResponseId?: string;
  completedAt: Date;
};

export type TokenizedReceipt = {
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

export type ReceiptAnchorOutboxEvent = {
  id: string;
  organizationId: string;
  accountId: string;
  receiptId: string;
  receiptHash: string;
  eventType: 'pwrc.receipt.anchor.requested';
  status: 'pending' | 'processing' | 'published' | 'failed';
  attempts: number;
  createdAt: Date;
  availableAt: Date;
  publishedAt?: Date;
  solanaSignature?: string;
  merkleRoot?: string;
};

export type TopUpIntentStatus = 'pending' | 'settled' | 'expired';

export type TopUpIntent = CreditScope & {
  id: string;
  requestedBaseUnits: bigint;
  idempotencyKey?: string;
  recipient: string;
  reference: string;
  solanaPayUri: string;
  status: TopUpIntentStatus;
  createdAt: Date;
  expiresAt: Date;
  paymentId?: string;
  settledAt?: Date;
};

export type VerifiedPaymentCredit = {
  eventId: string;
  paymentId: string;
  topUpIntentId: string;
  userId: string;
  amountBaseUnits: bigint;
  mint: string;
  network: string;
  transactionSignature: string;
  recipient: string;
  reference: string;
  settledAt: Date;
  verificationId: string;
};
