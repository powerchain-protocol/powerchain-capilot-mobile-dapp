import { randomUUID } from 'node:crypto';

import type { CreditStore, CreditStoreTransaction, LedgerMutation } from './store.ts';
import type {
  CopilotDelivery,
  CreditAccount,
  CreditLedgerEntry,
  CreditReservation,
  CreditScope,
  PersistedCreditQuote,
  ReceiptAnchorOutboxEvent,
  TokenizedReceipt,
  TopUpIntent,
  VerifiedPaymentCredit,
} from './types.ts';

const cloneAccount = (value: CreditAccount): CreditAccount => ({ ...value });
const cloneLedger = (value: CreditLedgerEntry): CreditLedgerEntry => ({ ...value, metadata: structuredClone(value.metadata) });
const cloneQuote = (value: PersistedCreditQuote): PersistedCreditQuote => ({ ...value });
const cloneReservation = (value: CreditReservation): CreditReservation => ({ ...value });
const cloneDelivery = (value: CopilotDelivery): CopilotDelivery => ({ ...value });
const cloneReceipt = (value: TokenizedReceipt): TokenizedReceipt => ({ ...value });
const cloneOutbox = (value: ReceiptAnchorOutboxEvent): ReceiptAnchorOutboxEvent => ({ ...value });
const cloneTopUp = (value: TopUpIntent): TopUpIntent => ({ ...value });
const accountKey = (scope: Pick<CreditScope, 'organizationId' | 'accountId'>) => `${scope.organizationId}\u0000${scope.accountId}`;

function sameScope(a: Pick<CreditScope, 'userId' | 'organizationId' | 'accountId'>, b: CreditScope) {
  return a.userId === b.userId && a.organizationId === b.organizationId && a.accountId === b.accountId;
}

export class InMemoryCreditStore implements CreditStore, CreditStoreTransaction {
  private accounts = new Map<string, CreditAccount>();
  private quotes = new Map<string, PersistedCreditQuote>();
  private quoteIdempotency = new Map<string, string>();
  private ledger: CreditLedgerEntry[] = [];
  private reservations = new Map<string, CreditReservation>();
  private deliveries = new Map<string, CopilotDelivery>();
  private responseIds = new Map<string, string>();
  private receipts = new Map<string, TokenizedReceipt>();
  private receiptByReservation = new Map<string, string>();
  private outbox = new Map<string, ReceiptAnchorOutboxEvent>();
  private demoGrants = new Map<string, string>();
  private topUps = new Map<string, TopUpIntent>();
  private paymentEvents = new Map<string, VerifiedPaymentCredit>();
  private paymentIds = new Set<string>();
  private sequence = 0n;
  private queue = Promise.resolve();

  async transaction<T>(fn: (tx: CreditStoreTransaction) => Promise<T>): Promise<T> {
    const previous = this.queue;
    let release!: () => void;
    this.queue = new Promise<void>((resolve) => { release = resolve; });
    await previous;
    try { return await fn(this); } finally { release(); }
  }

  async getOrCreateAccount(scope: CreditScope, now: Date): Promise<CreditAccount> {
    const key = accountKey(scope);
    const existing = this.accounts.get(key);
    if (existing) {
      if (!sameScope(existing, scope)) throw new Error('PWRC account scope mismatch.');
      return cloneAccount(existing);
    }
    const account: CreditAccount = {
      ...scope,
      availableBaseUnits: 0n,
      reservedBaseUnits: 0n,
      spentBaseUnits: 0n,
      fundedBaseUnits: 0n,
      version: 0n,
      createdAt: now,
      updatedAt: now,
    };
    this.accounts.set(key, account);
    return cloneAccount(account);
  }

  async saveAccount(account: CreditAccount) { this.accounts.set(accountKey(account), cloneAccount(account)); }

  async saveQuote(quote: PersistedCreditQuote) {
    const existing = this.quotes.get(quote.hash);
    if (existing) {
      if (existing.canonicalPayload !== quote.canonicalPayload || !sameScope(existing, quote)) {
        throw new Error('Persisted PWRC quote hash collision/integrity violation.');
      }
      return;
    }
    const idemKey = `${accountKey(quote)}\u0000${quote.idempotencyKey}`;
    const priorHash = this.quoteIdempotency.get(idemKey);
    if (priorHash && priorHash !== quote.hash) throw new Error('PWRC quote idempotency collision.');
    this.quotes.set(quote.hash, cloneQuote(quote));
    this.quoteIdempotency.set(idemKey, quote.hash);
  }

  async getQuote(hash: string) { const value = this.quotes.get(hash); return value ? cloneQuote(value) : null; }

  async getQuoteByIdempotency(scope: CreditScope, idempotencyKey: string) {
    const hash = this.quoteIdempotency.get(`${accountKey(scope)}\u0000${idempotencyKey}`);
    if (!hash) return null;
    const value = this.quotes.get(hash);
    return value ? cloneQuote(value) : null;
  }

  async appendLedger(account: CreditAccount, mutation: LedgerMutation): Promise<CreditLedgerEntry> {
    this.sequence += 1n;
    const entry: CreditLedgerEntry = {
      id: randomUUID(),
      sequence: this.sequence,
      userId: account.userId,
      organizationId: account.organizationId,
      accountId: account.accountId,
      type: mutation.type,
      availableDeltaBaseUnits: mutation.availableDeltaBaseUnits ?? 0n,
      reservedDeltaBaseUnits: mutation.reservedDeltaBaseUnits ?? 0n,
      spentDeltaBaseUnits: mutation.spentDeltaBaseUnits ?? 0n,
      fundedDeltaBaseUnits: mutation.fundedDeltaBaseUnits ?? 0n,
      availableAfterBaseUnits: account.availableBaseUnits,
      reservedAfterBaseUnits: account.reservedBaseUnits,
      spentAfterBaseUnits: account.spentBaseUnits,
      fundedAfterBaseUnits: account.fundedBaseUnits,
      reservationId: mutation.reservationId,
      paymentId: mutation.paymentId,
      quoteHash: mutation.quoteHash,
      metadata: mutation.metadata ?? {},
      createdAt: mutation.createdAt ?? account.updatedAt,
    };
    this.ledger.push(cloneLedger(entry));
    return cloneLedger(entry);
  }

  async listLedger(scope: CreditScope, limit: number, beforeSequence?: bigint) {
    return this.ledger
      .filter((entry) => sameScope(entry, scope) && (!beforeSequence || entry.sequence < beforeSequence))
      .sort((a, b) => (a.sequence < b.sequence ? 1 : -1))
      .slice(0, limit)
      .map(cloneLedger);
  }

  async getReservation(id: string) { const value = this.reservations.get(id); return value ? cloneReservation(value) : null; }

  async findReservationByQuote(scope: CreditScope, quoteHash: string) {
    const found = [...this.reservations.values()].find((r) => sameScope(r, scope) && r.quoteHash === quoteHash);
    return found ? cloneReservation(found) : null;
  }

  async saveReservation(reservation: CreditReservation) {
    const existing = this.reservations.get(reservation.id);
    if (existing && existing.status !== 'active' && existing.status !== reservation.status) {
      throw new Error('A finalized PWRC reservation cannot transition again.');
    }
    this.reservations.set(reservation.id, cloneReservation(reservation));
  }

  async listExpiredActiveReservations(now: Date, limit: number) {
    return [...this.reservations.values()]
      .filter((r) => r.status === 'active' && r.expiresAt <= now)
      .sort((a, b) => a.expiresAt.getTime() - b.expiresAt.getTime()).slice(0, limit).map(cloneReservation);
  }

  async listExpiredActiveReservationsForScope(scope: CreditScope, now: Date, limit: number) {
    return [...this.reservations.values()]
      .filter((r) => sameScope(r, scope) && r.status === 'active' && r.expiresAt <= now)
      .sort((a, b) => a.expiresAt.getTime() - b.expiresAt.getTime()).slice(0, limit).map(cloneReservation);
  }

  async saveCompletedDelivery(delivery: CopilotDelivery) {
    const byReservation = [...this.deliveries.values()].find((d) => d.reservationId === delivery.reservationId);
    if (byReservation) {
      if (byReservation.responseHash !== delivery.responseHash || byReservation.responseId !== delivery.responseId) {
        throw new Error('Completed response proof is immutable for a PWRC reservation.');
      }
      return;
    }
    const responseOwner = this.responseIds.get(delivery.responseId);
    if (responseOwner && responseOwner !== delivery.id) throw new Error('PWRC responseId must be unique.');
    this.deliveries.set(delivery.id, cloneDelivery(delivery));
    this.responseIds.set(delivery.responseId, delivery.id);
  }

  async getCompletedDeliveryByReservation(reservationId: string) {
    const found = [...this.deliveries.values()].find((d) => d.reservationId === reservationId);
    return found ? cloneDelivery(found) : null;
  }

  async getCompletedDeliveryByResponseId(responseId: string) {
    const id = this.responseIds.get(responseId);
    const found = id ? this.deliveries.get(id) : undefined;
    return found ? cloneDelivery(found) : null;
  }

  async saveReceipt(receipt: TokenizedReceipt) {
    const existingId = this.receiptByReservation.get(receipt.reservationId);
    if (existingId) {
      const existing = this.receipts.get(existingId)!;
      if (existing.receiptHash !== receipt.receiptHash) throw new Error('PWRC receipt is immutable for a reservation.');
      return;
    }
    if ([...this.receipts.values()].some((item) => item.receiptHash === receipt.receiptHash)) throw new Error('PWRC receiptHash must be unique.');
    this.receipts.set(receipt.receiptId, cloneReceipt(receipt));
    this.receiptByReservation.set(receipt.reservationId, receipt.receiptId);
  }

  async getReceipt(receiptId: string) { const value = this.receipts.get(receiptId); return value ? cloneReceipt(value) : null; }
  async getReceiptByReservation(reservationId: string) {
    const id = this.receiptByReservation.get(reservationId);
    const value = id ? this.receipts.get(id) : undefined;
    return value ? cloneReceipt(value) : null;
  }
  async getLatestReceipt(scope: Pick<CreditScope, 'organizationId' | 'accountId'>) {
    const values = [...this.receipts.values()].filter((r) => r.organizationId === scope.organizationId && r.accountId === scope.accountId);
    values.sort((a, b) => b.settledAt.localeCompare(a.settledAt) || b.receiptId.localeCompare(a.receiptId));
    return values[0] ? cloneReceipt(values[0]) : null;
  }

  async enqueueReceiptAnchor(event: ReceiptAnchorOutboxEvent) {
    if ([...this.outbox.values()].some((e) => e.receiptId === event.receiptId)) return;
    this.outbox.set(event.id, cloneOutbox(event));
  }
  async listPendingReceiptAnchors(limit: number, now: Date) {
    return [...this.outbox.values()].filter((e) => ['pending', 'failed', 'processing'].includes(e.status) && e.availableAt <= now)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()).slice(0, limit).map(cloneOutbox);
  }
  async saveReceiptAnchor(event: ReceiptAnchorOutboxEvent) { this.outbox.set(event.id, cloneOutbox(event)); }

  async hasDemoGrant(scope: CreditScope) { return this.demoGrants.has(accountKey(scope)); }
  async markDemoGrant(scope: CreditScope, ledgerEntryId: string) { this.demoGrants.set(accountKey(scope), ledgerEntryId); }

  async saveTopUpIntent(intent: TopUpIntent) { this.topUps.set(intent.id, cloneTopUp(intent)); }
  async getTopUpIntent(id: string) { const value = this.topUps.get(id); return value ? cloneTopUp(value) : null; }
  async findTopUpIntentByIdempotency(scope: CreditScope, idempotencyKey: string) {
    const value = [...this.topUps.values()].find((intent) => sameScope(intent, scope) && intent.idempotencyKey === idempotencyKey);
    return value ? cloneTopUp(value) : null;
  }

  async hasPaymentEvent(eventId: string) { return this.paymentEvents.has(eventId); }
  async hasPaymentId(paymentId: string) { return this.paymentIds.has(paymentId); }
  async saveVerifiedPaymentCredit(payment: VerifiedPaymentCredit) {
    if (this.paymentEvents.has(payment.eventId) || this.paymentIds.has(payment.paymentId)) throw new Error('Duplicate Payment Kernel settlement.');
    this.paymentEvents.set(payment.eventId, { ...payment });
    this.paymentIds.add(payment.paymentId);
  }
}
