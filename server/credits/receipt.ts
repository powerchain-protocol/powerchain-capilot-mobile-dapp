import { createHash, randomUUID } from 'node:crypto';

import { COPILOT_RESPONSE_COST_BASE_UNITS, COPILOT_RESPONSE_COST_PWRC, PWRC_IDENTITY } from './constants.ts';
import { canonicalizeJson } from './canonical-json.ts';
import type { ReceiptSigner } from './signing.ts';
import type { CopilotDelivery, CreditLedgerEntry, CreditReservation, PersistedCreditQuote, TokenizedReceipt } from './types.ts';

export function hashCompletedResponse(input: {
  responseId: string;
  reservationId: string;
  quoteHash: string;
  text: string;
}): string {
  const normalized = input.text.replace(/\r\n/g, '\n');
  return createHash('sha256')
    .update(canonicalizeJson({
      version: '1',
      responseId: input.responseId,
      reservationId: input.reservationId,
      quoteHash: input.quoteHash,
      text: normalized,
    }), 'utf8')
    .digest('hex');
}

export function canonicalReceiptPayload(input: Omit<TokenizedReceipt, 'receiptHash' | 'signature'>): string {
  return canonicalizeJson({
    version: input.version,
    receiptId: input.receiptId,
    quoteId: input.quoteId,
    quoteHash: input.quoteHash,
    reservationId: input.reservationId,
    responseId: input.responseId,
    organizationId: input.organizationId,
    accountId: input.accountId,
    mint: input.mint,
    amountBaseUnits: input.amountBaseUnits,
    amountDisplay: input.amountDisplay,
    status: input.status,
    settledAt: input.settledAt,
    ledgerEntryId: input.ledgerEntryId,
    previousReceiptHash: input.previousReceiptHash,
  });
}

export function createTokenizedReceipt(input: {
  quote: PersistedCreditQuote;
  reservation: CreditReservation;
  delivery: CopilotDelivery;
  ledgerEntry: CreditLedgerEntry;
  settledAt: Date;
  previousReceiptHash: string | null;
  signer: ReceiptSigner;
  receiptId?: string;
}): TokenizedReceipt {
  if (input.reservation.amountBaseUnits !== COPILOT_RESPONSE_COST_BASE_UNITS) {
    throw new Error('Tokenized receipt amount must equal the canonical 10,000 PWRC response charge.');
  }
  if (
    input.quote.organizationId !== input.reservation.organizationId ||
    input.delivery.organizationId !== input.reservation.organizationId ||
    input.ledgerEntry.organizationId !== input.reservation.organizationId ||
    input.quote.accountId !== input.reservation.accountId ||
    input.delivery.accountId !== input.reservation.accountId ||
    input.ledgerEntry.accountId !== input.reservation.accountId
  ) {
    throw new Error('PWRC receipt evidence must remain inside one organization/account scope.');
  }
  const body: Omit<TokenizedReceipt, 'receiptHash' | 'signature'> = {
    version: '1',
    receiptId: input.receiptId ?? randomUUID(),
    quoteId: input.quote.id,
    quoteHash: input.quote.hash,
    reservationId: input.reservation.id,
    responseId: input.delivery.responseId,
    organizationId: input.reservation.organizationId,
    accountId: input.reservation.accountId,
    mint: PWRC_IDENTITY.mint,
    amountBaseUnits: COPILOT_RESPONSE_COST_BASE_UNITS.toString() as '10000000000000',
    amountDisplay: COPILOT_RESPONSE_COST_PWRC.toString() as '10000',
    status: 'SETTLED',
    settledAt: input.settledAt.toISOString(),
    ledgerEntryId: input.ledgerEntry.id,
    previousReceiptHash: input.previousReceiptHash,
  };
  const receiptHash = createHash('sha256').update(canonicalReceiptPayload(body), 'utf8').digest('hex');
  return { ...body, receiptHash, signature: input.signer.signReceiptHash(receiptHash) };
}
