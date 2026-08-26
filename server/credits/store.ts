import type {
  CopilotDelivery,
  CreditAccount,
  CreditLedgerEntry,
  CreditLedgerEntryType,
  CreditReservation,
  CreditScope,
  PersistedCreditQuote,
  ReceiptAnchorOutboxEvent,
  TokenizedReceipt,
  TopUpIntent,
  VerifiedPaymentCredit,
} from './types.ts';

export type LedgerMutation = {
  type: CreditLedgerEntryType;
  availableDeltaBaseUnits?: bigint;
  reservedDeltaBaseUnits?: bigint;
  spentDeltaBaseUnits?: bigint;
  fundedDeltaBaseUnits?: bigint;
  reservationId?: string;
  paymentId?: string;
  quoteHash?: string;
  metadata?: Record<string, unknown>;
  createdAt?: Date;
};

export type CreditStoreTransaction = {
  getOrCreateAccount(scope: CreditScope, now: Date): Promise<CreditAccount>;
  saveAccount(account: CreditAccount): Promise<void>;
  saveQuote(quote: PersistedCreditQuote): Promise<void>;
  getQuote(hash: string): Promise<PersistedCreditQuote | null>;
  getQuoteByIdempotency(scope: CreditScope, idempotencyKey: string): Promise<PersistedCreditQuote | null>;
  appendLedger(account: CreditAccount, mutation: LedgerMutation): Promise<CreditLedgerEntry>;
  listLedger(scope: CreditScope, limit: number, beforeSequence?: bigint): Promise<CreditLedgerEntry[]>;
  getReservation(id: string): Promise<CreditReservation | null>;
  findReservationByQuote(scope: CreditScope, quoteHash: string): Promise<CreditReservation | null>;
  saveReservation(reservation: CreditReservation): Promise<void>;
  listExpiredActiveReservations(now: Date, limit: number): Promise<CreditReservation[]>;
  listExpiredActiveReservationsForScope(scope: CreditScope, now: Date, limit: number): Promise<CreditReservation[]>;
  saveCompletedDelivery(delivery: CopilotDelivery): Promise<void>;
  getCompletedDeliveryByReservation(reservationId: string): Promise<CopilotDelivery | null>;
  getCompletedDeliveryByResponseId(responseId: string): Promise<CopilotDelivery | null>;
  saveReceipt(receipt: TokenizedReceipt): Promise<void>;
  getReceipt(receiptId: string): Promise<TokenizedReceipt | null>;
  getReceiptByReservation(reservationId: string): Promise<TokenizedReceipt | null>;
  getLatestReceipt(scope: Pick<CreditScope, 'organizationId' | 'accountId'>): Promise<TokenizedReceipt | null>;
  enqueueReceiptAnchor(event: ReceiptAnchorOutboxEvent): Promise<void>;
  listPendingReceiptAnchors(limit: number, now: Date): Promise<ReceiptAnchorOutboxEvent[]>;
  saveReceiptAnchor(event: ReceiptAnchorOutboxEvent): Promise<void>;
  hasDemoGrant(scope: CreditScope): Promise<boolean>;
  markDemoGrant(scope: CreditScope, ledgerEntryId: string, now: Date): Promise<void>;
  saveTopUpIntent(intent: TopUpIntent): Promise<void>;
  getTopUpIntent(id: string): Promise<TopUpIntent | null>;
  findTopUpIntentByIdempotency(scope: CreditScope, idempotencyKey: string): Promise<TopUpIntent | null>;
  hasPaymentEvent(eventId: string): Promise<boolean>;
  hasPaymentId(paymentId: string): Promise<boolean>;
  saveVerifiedPaymentCredit(payment: VerifiedPaymentCredit): Promise<void>;
};

export type CreditStore = {
  transaction<T>(fn: (tx: CreditStoreTransaction) => Promise<T>): Promise<T>;
};
