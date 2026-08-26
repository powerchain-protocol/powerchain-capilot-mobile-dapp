import { randomUUID } from 'node:crypto';

import {
  DEFAULT_RESERVATION_TTL_MS,
  DEMO_GRANT_BASE_UNITS,
  PWRC_IDENTITY,
} from './constants.ts';
import { CreditConflictError, CreditNotFoundError, InsufficientPwrcCreditsError } from './errors.ts';
import { assertCreditQuoteIntegrity, canonicalQuotePayload, createCopilotCreditQuote } from './quote.ts';
import { createTokenizedReceipt, hashCompletedResponse } from './receipt.ts';
import { createEphemeralDevelopmentReceiptSigner, type ReceiptSigner } from './signing.ts';
import { normalizeCreditScope, type CreditActor } from './scope.ts';
import { createSolanaPayTopUp } from './solana-pay.ts';
import type { CreditStore, CreditStoreTransaction } from './store.ts';
import type {
  CopilotDelivery,
  CreditAccount,
  CreditQuote,
  CreditReservation,
  PersistedCreditQuote,
  ReceiptAnchorOutboxEvent,
  TokenizedReceipt,
  TopUpIntent,
  VerifiedPaymentCredit,
} from './types.ts';

function applyDeltas(
  account: CreditAccount,
  deltas: Partial<Pick<CreditAccount, 'availableBaseUnits' | 'reservedBaseUnits' | 'spentBaseUnits' | 'fundedBaseUnits'>>,
  now: Date,
) {
  const next: CreditAccount = {
    ...account,
    availableBaseUnits: account.availableBaseUnits + (deltas.availableBaseUnits ?? 0n),
    reservedBaseUnits: account.reservedBaseUnits + (deltas.reservedBaseUnits ?? 0n),
    spentBaseUnits: account.spentBaseUnits + (deltas.spentBaseUnits ?? 0n),
    fundedBaseUnits: account.fundedBaseUnits + (deltas.fundedBaseUnits ?? 0n),
    version: account.version + 1n,
    updatedAt: now,
  };
  if (next.availableBaseUnits < 0n || next.reservedBaseUnits < 0n || next.spentBaseUnits < 0n || next.fundedBaseUnits < 0n) {
    throw new Error('Credit account invariant violated: balances cannot be negative.');
  }
  if (next.availableBaseUnits + next.reservedBaseUnits + next.spentBaseUnits !== next.fundedBaseUnits) {
    throw new Error('Credit account invariant violated: funded != available + reserved + spent.');
  }
  return next;
}

function persistedQuote(quote: CreditQuote, persistedAt: Date): PersistedCreditQuote {
  const { hash: _hash, ...body } = quote;
  return { ...quote, canonicalPayload: canonicalQuotePayload(body), persistedAt };
}

function sameScope(a: { userId: string; organizationId: string; accountId: string }, b: { userId: string; organizationId: string; accountId: string }) {
  return a.userId === b.userId && a.organizationId === b.organizationId && a.accountId === b.accountId;
}

export class PwrcCreditService {
  private readonly store: CreditStore;
  private readonly options: { solanaPayRecipient?: string; receiptSigner?: ReceiptSigner };
  private readonly receiptSigner: ReceiptSigner;

  constructor(store: CreditStore, options: { solanaPayRecipient?: string; receiptSigner?: ReceiptSigner } = {}) {
    this.store = store;
    this.options = options;
    this.receiptSigner = options.receiptSigner ?? createEphemeralDevelopmentReceiptSigner();
  }

  createQuote(actor: CreditActor, quantity = 1, now = new Date(), idempotencyKey = `quote:${randomUUID()}`): CreditQuote {
    return createCopilotCreditQuote({ scope: normalizeCreditScope(actor), quantity, now, idempotencyKey });
  }

  async issueQuote(
    actor: CreditActor,
    quantity = 1,
    now = new Date(),
    idempotencyKey = `quote:${randomUUID()}`,
  ): Promise<PersistedCreditQuote> {
    const scope = normalizeCreditScope(actor);
    return this.store.transaction(async (tx) => {
      await tx.getOrCreateAccount(scope, now);
      const existing = await tx.getQuoteByIdempotency(scope, idempotencyKey);
      if (existing) {
        if (existing.quantity !== quantity) throw new CreditConflictError('Idempotency-Key already issued a quote with different quantity.', 'IDEMPOTENCY_KEY_REUSED');
        return existing;
      }
      const quote = createCopilotCreditQuote({ scope, quantity, now, idempotencyKey });
      const record = persistedQuote(quote, now);
      await tx.saveQuote(record);
      return (await tx.getQuote(record.hash)) ?? record;
    });
  }

  async getQuote(actor: CreditActor, hash: string): Promise<PersistedCreditQuote> {
    const scope = normalizeCreditScope(actor);
    return this.store.transaction(async (tx) => {
      const quote = await tx.getQuote(hash);
      if (!quote || !sameScope(quote, scope)) throw new CreditNotFoundError('PWRC quote not found.', 'QUOTE_NOT_FOUND');
      return quote;
    });
  }

  async getAccount(actor: CreditActor, now = new Date()): Promise<CreditAccount> {
    const scope = normalizeCreditScope(actor);
    await this.recoverExpiredReservationsForScope(scope, now);
    return this.store.transaction((tx) => tx.getOrCreateAccount(scope, now));
  }

  async getLedger(actor: CreditActor, limit = 50, beforeSequence?: bigint) {
    const scope = normalizeCreditScope(actor);
    const safeLimit = Math.max(1, Math.min(100, Math.trunc(limit)));
    return this.store.transaction((tx) => tx.listLedger(scope, safeLimit, beforeSequence));
  }

  getReceiptVerificationKey() {
    return { algorithm: 'Ed25519' as const, keyId: this.receiptSigner.keyId, publicKeyPem: this.receiptSigner.publicKeyPem };
  }

  async getReceipt(actor: CreditActor, receiptId: string): Promise<TokenizedReceipt> {
    const scope = normalizeCreditScope(actor);
    return this.store.transaction(async (tx) => {
      const receipt = await tx.getReceipt(receiptId);
      if (!receipt || receipt.organizationId !== scope.organizationId || receipt.accountId !== scope.accountId) {
        throw new CreditNotFoundError('PWRC tokenized receipt not found.', 'RECEIPT_NOT_FOUND');
      }
      return receipt;
    });
  }

  async claimDemoGrant(actor: CreditActor, now = new Date()) {
    const scope = normalizeCreditScope(actor);
    return this.store.transaction(async (tx) => {
      const account = await tx.getOrCreateAccount(scope, now);
      if (await tx.hasDemoGrant(scope)) throw new CreditConflictError('The PWRC demo grant has already been claimed for this account.', 'DEMO_GRANT_ALREADY_CLAIMED');
      const next = applyDeltas(account, { availableBaseUnits: DEMO_GRANT_BASE_UNITS, fundedBaseUnits: DEMO_GRANT_BASE_UNITS }, now);
      await tx.saveAccount(next);
      const entry = await tx.appendLedger(next, {
        type: 'demo_grant',
        availableDeltaBaseUnits: DEMO_GRANT_BASE_UNITS,
        fundedDeltaBaseUnits: DEMO_GRANT_BASE_UNITS,
        metadata: { grant: 'sample', nonTransferableAccountingCredit: true },
        createdAt: now,
      });
      await tx.markDemoGrant(scope, entry.id, now);
      return { account: next, ledgerEntry: entry };
    });
  }

  async reserveQuote(actor: CreditActor, quote: CreditQuote, now = new Date()): Promise<CreditReservation> {
    const scope = normalizeCreditScope(actor);
    assertCreditQuoteIntegrity(quote, scope, now);
    return this.store.transaction(async (tx) => {
      const existingReservation = await tx.findReservationByQuote(scope, quote.hash);
      if (existingReservation) return existingReservation;

      // Fail closed: quote persistence must have committed before the reservation transaction begins.
      const persisted = await tx.getQuote(quote.hash);
      if (!persisted || !sameScope(persisted, scope) || persisted.canonicalPayload !== persistedQuote(quote, now).canonicalPayload) {
        throw new CreditConflictError('Canonical PWRC quote must be durably persisted before reservation.', 'QUOTE_NOT_PERSISTED');
      }

      const account = await tx.getOrCreateAccount(scope, now); // PostgreSQL implementation obtains FOR UPDATE.
      const concurrentExisting = await tx.findReservationByQuote(scope, quote.hash);
      if (concurrentExisting) return concurrentExisting;
      if (account.availableBaseUnits < quote.totalBaseUnits) throw new InsufficientPwrcCreditsError(account.availableBaseUnits, quote.totalBaseUnits);

      const reservation: CreditReservation = {
        id: randomUUID(),
        ...scope,
        quoteId: quote.id,
        quoteHash: quote.hash,
        idempotencyKey: quote.idempotencyKey,
        amountBaseUnits: quote.totalBaseUnits,
        status: 'active',
        createdAt: now,
        expiresAt: new Date(Math.min(quote.expiresAt.getTime(), now.getTime() + DEFAULT_RESERVATION_TTL_MS)),
      };
      const next = applyDeltas(account, { availableBaseUnits: -reservation.amountBaseUnits, reservedBaseUnits: reservation.amountBaseUnits }, now);
      await tx.saveAccount(next);
      await tx.saveReservation(reservation);
      await tx.appendLedger(next, {
        type: 'reservation_created',
        availableDeltaBaseUnits: -reservation.amountBaseUnits,
        reservedDeltaBaseUnits: reservation.amountBaseUnits,
        reservationId: reservation.id,
        quoteHash: quote.hash,
        metadata: { quoteId: quote.id, idempotencyKey: quote.idempotencyKey, quotePersisted: true },
        createdAt: now,
      });
      return reservation;
    });
  }

  async recordCompletedDelivery(input: {
    actor: CreditActor;
    reservationId: string;
    responseText: string;
    responseId?: string;
    conversationId?: string;
    provider?: string;
    model?: string;
    providerResponseId?: string;
    now?: Date;
  }): Promise<CopilotDelivery> {
    const scope = normalizeCreditScope(input.actor);
    const now = input.now ?? new Date();
    return this.store.transaction(async (tx) => {
      const reservation = await this.requireReservation(tx, scope, input.reservationId);
      if (reservation.status !== 'active') throw new CreditConflictError(`Reservation is ${reservation.status}; response cannot be recorded.`, 'RESERVATION_NOT_ACTIVE');
      if (reservation.expiresAt <= now) {
        await this.expireReservationInTransaction(tx, reservation, now);
        throw new CreditConflictError('PWRC reservation expired before response completed.', 'RESERVATION_EXPIRED');
      }
      const quote = await tx.getQuote(reservation.quoteHash);
      if (!quote || !sameScope(quote, scope) || quote.id !== reservation.quoteId) {
        throw new CreditConflictError('Persisted quote is missing for the PWRC reservation.', 'QUOTE_NOT_PERSISTED');
      }
      const existing = await tx.getCompletedDeliveryByReservation(reservation.id);
      if (existing) return existing;
      const responseId = input.responseId?.trim() || `pmsg_${randomUUID().replaceAll('-', '')}`;
      if (await tx.getCompletedDeliveryByResponseId(responseId)) throw new CreditConflictError('responseId has already been used.', 'RESPONSE_ID_REUSED');
      const responseHash = hashCompletedResponse({ responseId, reservationId: reservation.id, quoteHash: reservation.quoteHash, text: input.responseText });
      const delivery: CopilotDelivery = {
        id: randomUUID(),
        responseId,
        ...scope,
        reservationId: reservation.id,
        quoteId: reservation.quoteId,
        quoteHash: reservation.quoteHash,
        responseHash,
        status: 'completed',
        conversationId: input.conversationId,
        provider: input.provider,
        model: input.model,
        providerResponseId: input.providerResponseId,
        completedAt: now,
      };
      await tx.saveCompletedDelivery(delivery);
      return delivery;
    });
  }

  /**
   * Atomic settlement transaction. Preconditions are checked from durable rows.
   * Balance mutation, append-only ledger, signed receipt and Solana anchor outbox are committed together.
   */
  async settleCompletedDelivery(actor: CreditActor, reservationId: string, now = new Date()) {
    const scope = normalizeCreditScope(actor);
    return this.store.transaction(async (tx) => {
      const reservation = await this.requireReservation(tx, scope, reservationId);
      const delivery = await tx.getCompletedDeliveryByReservation(reservation.id);
      if (!delivery || !sameScope(delivery, scope) || delivery.quoteHash !== reservation.quoteHash) {
        throw new CreditConflictError('A durably stored completed response is required before PWRC settlement.', 'RESPONSE_NOT_DURABLE');
      }
      if (reservation.status === 'settled') {
        const receipt = await tx.getReceiptByReservation(reservation.id);
        if (!receipt) throw new CreditConflictError('Settled reservation is missing its signed receipt.', 'RECEIPT_MISSING');
        return { reservation, delivery, receipt };
      }
      if (reservation.status !== 'active') throw new CreditConflictError(`Reservation is ${reservation.status} and cannot be settled.`, 'RESERVATION_FINALIZED');
      if (reservation.expiresAt <= now) {
        await this.expireReservationInTransaction(tx, reservation, now);
        throw new CreditConflictError('PWRC reservation expired before settlement.', 'RESERVATION_EXPIRED');
      }
      const quote = await tx.getQuote(reservation.quoteHash);
      if (!quote || quote.id !== reservation.quoteId || !sameScope(quote, scope)) throw new CreditConflictError('Persisted quote is missing at settlement.', 'QUOTE_NOT_PERSISTED');

      const account = await tx.getOrCreateAccount(scope, now);
      const next = applyDeltas(account, { reservedBaseUnits: -reservation.amountBaseUnits, spentBaseUnits: reservation.amountBaseUnits }, now);
      const settled: CreditReservation = { ...reservation, status: 'settled', settledAt: now };
      await tx.saveAccount(next);
      await tx.saveReservation(settled);
      const ledgerEntry = await tx.appendLedger(next, {
        type: 'reservation_settled',
        reservedDeltaBaseUnits: -reservation.amountBaseUnits,
        spentDeltaBaseUnits: reservation.amountBaseUnits,
        reservationId: reservation.id,
        quoteHash: reservation.quoteHash,
        metadata: { quoteId: quote.id, responseId: delivery.responseId, responseHash: delivery.responseHash, settlementReason: 'durable_completed_response' },
        createdAt: now,
      });
      const previous = await tx.getLatestReceipt(scope);
      const receipt = createTokenizedReceipt({
        quote,
        reservation: settled,
        delivery,
        ledgerEntry,
        settledAt: now,
        previousReceiptHash: previous?.receiptHash ?? null,
        signer: this.receiptSigner,
      });
      await tx.saveReceipt(receipt);
      const outbox: ReceiptAnchorOutboxEvent = {
        id: randomUUID(),
        organizationId: scope.organizationId,
        accountId: scope.accountId,
        receiptId: receipt.receiptId,
        receiptHash: receipt.receiptHash,
        eventType: 'pwrc.receipt.anchor.requested',
        status: 'pending',
        attempts: 0,
        createdAt: now,
        availableAt: now,
      };
      await tx.enqueueReceiptAnchor(outbox);
      return { reservation: settled, delivery, ledgerEntry, receipt, outbox };
    });
  }

  async settleReservation(): Promise<never> {
    throw new CreditConflictError('Direct reservation settlement is disabled; a durably stored completed response is required.', 'DIRECT_SETTLEMENT_DISABLED');
  }

  async releaseReservation(actor: CreditActor, reservationId: string, now = new Date()) {
    const scope = normalizeCreditScope(actor);
    return this.store.transaction(async (tx) => {
      const reservation = await this.requireReservation(tx, scope, reservationId);
      if (reservation.status === 'released') return reservation;
      if (reservation.status !== 'active') throw new CreditConflictError(`Reservation is already ${reservation.status}; it cannot be released.`, 'RESERVATION_FINALIZED');
      const account = await tx.getOrCreateAccount(scope, now);
      const next = applyDeltas(account, { availableBaseUnits: reservation.amountBaseUnits, reservedBaseUnits: -reservation.amountBaseUnits }, now);
      const released: CreditReservation = { ...reservation, status: 'released', releasedAt: now };
      await tx.saveAccount(next);
      await tx.saveReservation(released);
      await tx.appendLedger(next, {
        type: 'reservation_released',
        availableDeltaBaseUnits: reservation.amountBaseUnits,
        reservedDeltaBaseUnits: -reservation.amountBaseUnits,
        reservationId: reservation.id,
        quoteHash: reservation.quoteHash,
        metadata: { reason: 'generation_failed_or_cancelled' },
        createdAt: now,
      });
      return released;
    });
  }

  async recoverExpiredReservationsForScope(actor: CreditActor, now = new Date(), limit = 100): Promise<number> {
    const scope = normalizeCreditScope(actor);
    const safeLimit = Math.max(1, Math.min(500, Math.trunc(limit)));
    return this.store.transaction(async (tx) => {
      const expired = await tx.listExpiredActiveReservationsForScope(scope, now, safeLimit);
      for (const reservation of expired) await this.expireReservationInTransaction(tx, reservation, now);
      return expired.length;
    });
  }

  async recoverExpiredReservationsForUser(userId: string, now = new Date(), limit = 100) {
    return this.recoverExpiredReservationsForScope(userId, now, limit);
  }

  async recoverExpiredReservations(now = new Date(), limit = 100): Promise<number> {
    const safeLimit = Math.max(1, Math.min(500, Math.trunc(limit)));
    return this.store.transaction(async (tx) => {
      const expired = await tx.listExpiredActiveReservations(now, safeLimit);
      for (const reservation of expired) await this.expireReservationInTransaction(tx, reservation, now);
      return expired.length;
    });
  }

  async createTopUpIntent(actor: CreditActor, amountBaseUnits: string | bigint, now = new Date(), idempotencyKey?: string): Promise<TopUpIntent> {
    const scope = normalizeCreditScope(actor);
    const recipient = this.options.solanaPayRecipient?.trim();
    if (!recipient) throw new Error('PWRC_SOLANA_PAY_RECIPIENT is not configured on the server.');
    const key = idempotencyKey?.trim();
    if (key && !/^[A-Za-z0-9._:-]{8,128}$/.test(key)) throw new RangeError('Idempotency-Key must be 8-128 URL-safe characters.');
    return this.store.transaction(async (tx) => {
      await tx.getOrCreateAccount(scope, now);
      if (key) {
        const existing = await tx.findTopUpIntentByIdempotency(scope, key);
        if (existing) {
          if (existing.requestedBaseUnits !== BigInt(amountBaseUnits)) throw new CreditConflictError('Idempotency-Key was already used with a different PWRC amount.', 'IDEMPOTENCY_KEY_REUSED');
          return existing;
        }
      }
      const intent = createSolanaPayTopUp({ scope, recipient, amountBaseUnits, idempotencyKey: key, now });
      await tx.saveTopUpIntent(intent);
      return intent;
    });
  }

  async getTopUpIntent(actor: CreditActor, topUpIntentId: string, now = new Date()): Promise<TopUpIntent> {
    const scope = normalizeCreditScope(actor);
    return this.store.transaction(async (tx) => {
      const intent = await tx.getTopUpIntent(topUpIntentId);
      if (!intent || !sameScope(intent, scope)) throw new CreditNotFoundError('PWRC top-up intent not found.', 'TOPUP_NOT_FOUND');
      if (intent.status === 'pending' && intent.expiresAt <= now) {
        const expired: TopUpIntent = { ...intent, status: 'expired' };
        await tx.saveTopUpIntent(expired);
        return expired;
      }
      return intent;
    });
  }

  async applyVerifiedPaymentSettled(payment: VerifiedPaymentCredit, now = new Date()) {
    if (payment.mint !== PWRC_IDENTITY.mint || payment.network !== PWRC_IDENTITY.network) {
      throw new CreditConflictError('Payment settled for the wrong PWRC mint or network.', 'PAYMENT_ASSET_MISMATCH');
    }
    return this.store.transaction(async (tx) => {
      const intent = await tx.getTopUpIntent(payment.topUpIntentId);
      if (!intent) throw new CreditNotFoundError('PWRC top-up intent not found.', 'TOPUP_NOT_FOUND');
      if (intent.userId !== payment.userId) throw new CreditConflictError('Payment user does not match top-up intent.', 'PAYMENT_USER_MISMATCH');
      const scope = { userId: intent.userId, organizationId: intent.organizationId, accountId: intent.accountId };
      if (intent.status === 'settled' && intent.paymentId === payment.paymentId) return tx.getOrCreateAccount(scope, now);
      if (await tx.hasPaymentEvent(payment.eventId)) return tx.getOrCreateAccount(scope, now);
      if (await tx.hasPaymentId(payment.paymentId)) throw new CreditConflictError('Payment has already been credited.', 'PAYMENT_ALREADY_CREDITED');
      if (intent.status !== 'pending') throw new CreditConflictError(`Top-up intent is ${intent.status}.`, 'TOPUP_NOT_PENDING');
      if (payment.recipient !== intent.recipient || payment.reference !== intent.reference) throw new CreditConflictError('Verified settlement does not match the Solana Pay recipient/reference.', 'PAYMENT_INTENT_BINDING_MISMATCH');
      if (payment.settledAt < intent.createdAt || payment.settledAt > intent.expiresAt) throw new CreditConflictError('Payment settlement time is outside the top-up intent window.', 'PAYMENT_SETTLEMENT_TIME_MISMATCH');
      if (payment.amountBaseUnits !== intent.requestedBaseUnits) throw new CreditConflictError('Settled PWRC amount does not match the top-up intent.', 'PAYMENT_AMOUNT_MISMATCH');
      const account = await tx.getOrCreateAccount(scope, now);
      const next = applyDeltas(account, { availableBaseUnits: payment.amountBaseUnits, fundedBaseUnits: payment.amountBaseUnits }, now);
      await tx.saveAccount(next);
      await tx.saveVerifiedPaymentCredit(payment);
      await tx.saveTopUpIntent({ ...intent, status: 'settled', paymentId: payment.paymentId, settledAt: payment.settledAt });
      await tx.appendLedger(next, {
        type: 'payment_credit', availableDeltaBaseUnits: payment.amountBaseUnits, fundedDeltaBaseUnits: payment.amountBaseUnits, paymentId: payment.paymentId,
        metadata: { eventId: payment.eventId, topUpIntentId: payment.topUpIntentId, transactionSignature: payment.transactionSignature, verificationId: payment.verificationId }, createdAt: now,
      });
      return next;
    });
  }

  async createCompensatingRefund(input: { actor: CreditActor; reservationId: string; reason: string; now?: Date }) {
    const scope = normalizeCreditScope(input.actor);
    const now = input.now ?? new Date();
    return this.store.transaction(async (tx) => {
      const reservation = await this.requireReservation(tx, scope, input.reservationId);
      if (reservation.status !== 'settled') throw new CreditConflictError('Only a settled reservation can be refunded.', 'RESERVATION_NOT_SETTLED');
      const account = await tx.getOrCreateAccount(scope, now);
      if (account.spentBaseUnits < reservation.amountBaseUnits) throw new Error('Spent balance is insufficient for compensating refund.');
      const next = applyDeltas(account, { availableBaseUnits: reservation.amountBaseUnits, spentBaseUnits: -reservation.amountBaseUnits }, now);
      await tx.saveAccount(next);
      const entry = await tx.appendLedger(next, {
        type: 'settlement_refund',
        availableDeltaBaseUnits: reservation.amountBaseUnits,
        spentDeltaBaseUnits: -reservation.amountBaseUnits,
        reservationId: reservation.id,
        quoteHash: reservation.quoteHash,
        metadata: { compensating: true, reason: input.reason },
        createdAt: now,
      });
      return { account: next, ledgerEntry: entry };
    });
  }

  async listPendingReceiptAnchors(limit = 100, now = new Date()) {
    const safeLimit = Math.max(1, Math.min(500, Math.trunc(limit)));
    return this.store.transaction((tx) => tx.listPendingReceiptAnchors(safeLimit, now));
  }

  private async requireReservation(tx: CreditStoreTransaction, scope: ReturnType<typeof normalizeCreditScope>, id: string) {
    const reservation = await tx.getReservation(id);
    if (!reservation || !sameScope(reservation, scope)) throw new CreditNotFoundError('PWRC credit reservation not found.', 'RESERVATION_NOT_FOUND');
    return reservation;
  }

  private async expireReservationInTransaction(tx: CreditStoreTransaction, reservation: CreditReservation, now: Date) {
    if (reservation.status !== 'active') return reservation;
    const scope = { userId: reservation.userId, organizationId: reservation.organizationId, accountId: reservation.accountId };
    const account = await tx.getOrCreateAccount(scope, now);
    const next = applyDeltas(account, { availableBaseUnits: reservation.amountBaseUnits, reservedBaseUnits: -reservation.amountBaseUnits }, now);
    const expired: CreditReservation = { ...reservation, status: 'expired', releasedAt: now };
    await tx.saveAccount(next);
    await tx.saveReservation(expired);
    await tx.appendLedger(next, {
      type: 'reservation_expired', availableDeltaBaseUnits: reservation.amountBaseUnits, reservedDeltaBaseUnits: -reservation.amountBaseUnits,
      reservationId: reservation.id, quoteHash: reservation.quoteHash, metadata: { reason: 'reservation_ttl_expired' }, createdAt: now,
    });
    return expired;
  }
}
