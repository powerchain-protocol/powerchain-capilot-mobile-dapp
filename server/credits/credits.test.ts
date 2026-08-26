import assert from 'node:assert/strict';
import { createHmac, generateKeyPairSync } from 'node:crypto';
import test from 'node:test';

import { createCreditsApiHandler } from '../api/credits-handler.ts';
import { createMeteredCopilotHandler } from '../api/metered-copilot-handler.ts';
import { createMeteredCopilotResponse } from '../copilot/metered-response.ts';
import { verifyPaymentKernelWebhook } from '../payment-kernel/verify.ts';
import { publishPendingReceiptAnchorBatch } from './anchor-worker.ts';
import { canonicalizeJson } from './canonical-json.ts';
import {
  COPILOT_RESPONSE_COST_BASE_UNITS,
  DEMO_GRANT_BASE_UNITS,
  PWRC_IDENTITY,
} from './constants.ts';
import { InsufficientPwrcCreditsError } from './errors.ts';
import { InMemoryCreditStore } from './memory-store.ts';
import { createCopilotCreditQuote, hashQuote } from './quote.ts';
import { PwrcCreditService } from './service.ts';
import { createEd25519ReceiptSigner, verifyReceiptSignature } from './signing.ts';
import type { CreditScope } from './types.ts';

const NOW = new Date('2026-08-26T08:00:00.000Z');
const SCOPE: CreditScope = { userId: 'user-1', organizationId: 'org-1', accountId: 'acct-1' };

function signer() {
  const { privateKey } = generateKeyPairSync('ed25519');
  return createEd25519ReceiptSigner({
    privateKeyPem: privateKey.export({ type: 'pkcs8', format: 'pem' }).toString(),
    keyId: 'test-key-1',
  });
}

async function fundedService(scope: CreditScope = SCOPE) {
  const store = new InMemoryCreditStore();
  const receiptSigner = signer();
  const service = new PwrcCreditService(store, { receiptSigner, solanaPayRecipient: '11111111111111111111111111111111' });
  await service.claimDemoGrant(scope, NOW);
  return { store, service, receiptSigner };
}

async function reserveOne(service: PwrcCreditService, scope: CreditScope = SCOPE, key = 'copilot:req-0001', now = NOW) {
  const quote = await service.issueQuote(scope, 1, now, key);
  const reservation = await service.reserveQuote(scope, quote, new Date(now.getTime() + 1));
  return { quote, reservation };
}

test('9-decimal sample grant funds exactly 100 canonical Copilot responses', async () => {
  const { service } = await fundedService();
  const account = await service.getAccount(SCOPE, NOW);
  assert.equal(DEMO_GRANT_BASE_UNITS, 1_000_000_000_000_000n);
  assert.equal(COPILOT_RESPONSE_COST_BASE_UNITS, 10_000_000_000_000n);
  assert.equal(account.availableBaseUnits / COPILOT_RESPONSE_COST_BASE_UNITS, 100n);
  assert.equal(account.fundedBaseUnits, account.availableBaseUnits + account.reservedBaseUnits + account.spentBaseUnits);
});

test('canonical JSON sorts object keys deterministically', () => {
  assert.equal(canonicalizeJson({ z: 'last', a: 'first', n: 1 }), '{"a":"first","n":1,"z":"last"}');
  assert.equal(canonicalizeJson({ n: 1, a: 'first', z: 'last' }), '{"a":"first","n":1,"z":"last"}');
});

test('quote hash is deterministic for the same canonical quote payload', () => {
  const input = { scope: SCOPE, quantity: 1, now: NOW, ttlMs: 300_000, quoteId: 'quote-fixed-1', idempotencyKey: 'copilot:req-fixed' };
  const first = createCopilotCreditQuote(input);
  const second = createCopilotCreditQuote(input);
  assert.equal(first.hash, second.hash);
  assert.equal(first.hash.length, 64);
  const { hash: _hash, ...body } = first;
  assert.equal(hashQuote(body), first.hash);
});

test('quote is durably persisted before reservation and idempotency returns the same quote', async () => {
  const { service } = await fundedService();
  const key = 'copilot:req-persist';
  const first = await service.issueQuote(SCOPE, 1, NOW, key);
  const second = await service.issueQuote(SCOPE, 1, new Date(NOW.getTime() + 5), key);
  assert.equal(first.id, second.id);
  assert.equal(first.hash, second.hash);
  assert.equal((await service.getQuote(SCOPE, first.hash)).canonicalPayload, first.canonicalPayload);
});

test('reservation fails closed when a locally created quote was never persisted', async () => {
  const { service } = await fundedService();
  const quote = service.createQuote(SCOPE, 1, NOW, 'copilot:req-local');
  await assert.rejects(
    () => service.reserveQuote(SCOPE, quote, new Date(NOW.getTime() + 1)),
    (error: any) => error?.code === 'QUOTE_NOT_PERSISTED',
  );
  const account = await service.getAccount(SCOPE, NOW);
  assert.equal(account.availableBaseUnits, DEMO_GRANT_BASE_UNITS);
  assert.equal(account.reservedBaseUnits, 0n);
});

test('insufficient balance fails before AI generation with HTTP-402-compatible error', async () => {
  const store = new InMemoryCreditStore();
  const service = new PwrcCreditService(store);
  const quote = await service.issueQuote(SCOPE, 1, NOW, 'copilot:req-empty');
  await assert.rejects(
    () => service.reserveQuote(SCOPE, quote, new Date(NOW.getTime() + 1)),
    (error: unknown) => error instanceof InsufficientPwrcCreditsError && error.status === 402 && error.code === 'INSUFFICIENT_PWRC_CREDITS',
  );
});

test('tenant/account scope prevents cross-organization quote and receipt access', async () => {
  const { service } = await fundedService();
  const other = { userId: SCOPE.userId, organizationId: 'org-other', accountId: 'acct-other' };
  const quote = await service.issueQuote(SCOPE, 1, NOW, 'copilot:req-scope');
  await assert.rejects(() => service.getQuote(other, quote.hash), (error: any) => error?.code === 'QUOTE_NOT_FOUND');

  const reservation = await service.reserveQuote(SCOPE, quote, new Date(NOW.getTime() + 1));
  await service.recordCompletedDelivery({ actor: SCOPE, reservationId: reservation.id, responseText: 'done', responseId: 'resp-scope-1', now: new Date(NOW.getTime() + 2) });
  const settled = await service.settleCompletedDelivery(SCOPE, reservation.id, new Date(NOW.getTime() + 3));
  await assert.rejects(() => service.getReceipt(other, settled.receipt.receiptId), (error: any) => error?.code === 'RECEIPT_NOT_FOUND');
});

test('a reservation cannot settle before a completed response is durably stored', async () => {
  const { service } = await fundedService();
  const { reservation } = await reserveOne(service);
  await assert.rejects(
    () => service.settleCompletedDelivery(SCOPE, reservation.id, new Date(NOW.getTime() + 2)),
    (error: any) => error?.code === 'RESPONSE_NOT_DURABLE',
  );
});

test('completed response settles reserved -> spent and creates one signed receipt atomically', async () => {
  const { service, receiptSigner } = await fundedService();
  const { quote, reservation } = await reserveOne(service);
  const delivery = await service.recordCompletedDelivery({
    actor: SCOPE,
    reservationId: reservation.id,
    responseText: 'verified response',
    responseId: 'resp-atomic-1',
    conversationId: 'conv-1',
    provider: 'openai',
    model: 'test-model',
    now: new Date(NOW.getTime() + 2),
  });
  const settled = await service.settleCompletedDelivery(SCOPE, reservation.id, new Date(NOW.getTime() + 3));
  const account = await service.getAccount(SCOPE, new Date(NOW.getTime() + 4));

  assert.equal(delivery.status, 'completed');
  assert.equal(settled.reservation.status, 'settled');
  assert.equal(account.reservedBaseUnits, 0n);
  assert.equal(account.spentBaseUnits, COPILOT_RESPONSE_COST_BASE_UNITS);
  assert.equal(settled.receipt.version, '1');
  assert.equal(settled.receipt.quoteId, quote.id);
  assert.equal(settled.receipt.responseId, 'resp-atomic-1');
  assert.equal(settled.receipt.organizationId, SCOPE.organizationId);
  assert.equal(settled.receipt.accountId, SCOPE.accountId);
  assert.equal(settled.receipt.amountBaseUnits, '10000000000000');
  assert.equal(settled.receipt.amountDisplay, '10000');
  assert.equal(settled.receipt.status, 'SETTLED');
  assert.equal(verifyReceiptSignature({ receiptHash: settled.receipt.receiptHash, signature: settled.receipt.signature, publicKeyPem: receiptSigner.publicKeyPem }), true);

  const ledger = await service.getLedger(SCOPE);
  assert.equal(ledger[0]?.type, 'reservation_settled');
  assert.equal(ledger[0]?.id, settled.receipt.ledgerEntryId);
});

test('settlement and release are exactly-once terminal transitions', async () => {
  const { service } = await fundedService();
  const first = await reserveOne(service, SCOPE, 'copilot:req-once-a');
  await service.recordCompletedDelivery({ actor: SCOPE, reservationId: first.reservation.id, responseText: 'a', responseId: 'resp-once-a', now: new Date(NOW.getTime() + 2) });
  const settledA = await service.settleCompletedDelivery(SCOPE, first.reservation.id, new Date(NOW.getTime() + 3));
  const settledB = await service.settleCompletedDelivery(SCOPE, first.reservation.id, new Date(NOW.getTime() + 4));
  assert.equal(settledA.receipt.receiptId, settledB.receipt.receiptId);
  await assert.rejects(() => service.releaseReservation(SCOPE, first.reservation.id), (error: any) => error?.code === 'RESERVATION_FINALIZED');

  const second = await reserveOne(service, SCOPE, 'copilot:req-once-b', new Date(NOW.getTime() + 10));
  const releasedA = await service.releaseReservation(SCOPE, second.reservation.id, new Date(NOW.getTime() + 11));
  const releasedB = await service.releaseReservation(SCOPE, second.reservation.id, new Date(NOW.getTime() + 12));
  assert.equal(releasedA.status, 'released');
  assert.equal(releasedB.status, 'released');
  await assert.rejects(() => service.settleCompletedDelivery(SCOPE, second.reservation.id), (error: any) => error?.code === 'RESPONSE_NOT_DURABLE' || error?.code === 'RESERVATION_FINALIZED');
});

test('responseId is unique across durable completed responses', async () => {
  const { service } = await fundedService();
  const one = await reserveOne(service, SCOPE, 'copilot:req-response-a');
  const two = await reserveOne(service, SCOPE, 'copilot:req-response-b', new Date(NOW.getTime() + 10));
  await service.recordCompletedDelivery({ actor: SCOPE, reservationId: one.reservation.id, responseText: 'one', responseId: 'resp-unique', now: new Date(NOW.getTime() + 20) });
  await assert.rejects(
    () => service.recordCompletedDelivery({ actor: SCOPE, reservationId: two.reservation.id, responseText: 'two', responseId: 'resp-unique', now: new Date(NOW.getTime() + 21) }),
    (error: any) => error?.code === 'RESPONSE_ID_REUSED',
  );
});

test('signed receipts form an account-scoped hash chain', async () => {
  const { service } = await fundedService();
  const first = await reserveOne(service, SCOPE, 'copilot:req-chain-a');
  await service.recordCompletedDelivery({ actor: SCOPE, reservationId: first.reservation.id, responseText: 'one', responseId: 'resp-chain-a', now: new Date(NOW.getTime() + 2) });
  const r1 = (await service.settleCompletedDelivery(SCOPE, first.reservation.id, new Date(NOW.getTime() + 3))).receipt;

  const second = await reserveOne(service, SCOPE, 'copilot:req-chain-b', new Date(NOW.getTime() + 10));
  await service.recordCompletedDelivery({ actor: SCOPE, reservationId: second.reservation.id, responseText: 'two', responseId: 'resp-chain-b', now: new Date(NOW.getTime() + 12) });
  const r2 = (await service.settleCompletedDelivery(SCOPE, second.reservation.id, new Date(NOW.getTime() + 13))).receipt;
  assert.equal(r1.previousReceiptHash, null);
  assert.equal(r2.previousReceiptHash, r1.receiptHash);
});

test('failed generation releases the reservation and never spends PWRC', async () => {
  const { service } = await fundedService();
  await assert.rejects(
    () => createMeteredCopilotResponse({
      actor: SCOPE,
      message: 'fail',
      idempotencyKey: 'copilot:req-generation-fail',
      credits: service,
      now: NOW,
      generate: async () => { throw new Error('provider failed'); },
    }),
    /provider failed/,
  );
  const account = await service.getAccount(SCOPE, new Date(NOW.getTime() + 1));
  assert.equal(account.availableBaseUnits, DEMO_GRANT_BASE_UNITS);
  assert.equal(account.reservedBaseUnits, 0n);
  assert.equal(account.spentBaseUnits, 0n);
  assert.equal((await service.getLedger(SCOPE))[0]?.type, 'reservation_released');
});

test('successful metered response is settled before it is returned; ACK is not the billing trigger', async () => {
  const { service } = await fundedService();
  const result = await createMeteredCopilotResponse({
    actor: SCOPE,
    message: 'status',
    idempotencyKey: 'copilot:req-metered-success',
    credits: service,
    now: NOW,
    generate: async () => ({ text: 'all systems nominal', conversationId: 'conv-success', provenance: { provider: 'openai', model: 'test-model' } }),
  });
  assert.equal(result.delivery.status, 'completed');
  assert.equal(result.credits.settlementStatus, 'settled');
  assert.equal(result.credits.receipt.status, 'SETTLED');
  const account = await service.getAccount(SCOPE, NOW);
  assert.equal(account.reservedBaseUnits, 0n);
  assert.equal(account.spentBaseUnits, COPILOT_RESPONSE_COST_BASE_UNITS);
});

test('reservation expiry recovery restores available credit without spend', async () => {
  const { service } = await fundedService();
  await reserveOne(service, SCOPE, 'copilot:req-expiry');
  const recovered = await service.recoverExpiredReservationsForScope(SCOPE, new Date(NOW.getTime() + 130_000));
  assert.equal(recovered, 1);
  const account = await service.getAccount(SCOPE, new Date(NOW.getTime() + 130_001));
  assert.equal(account.availableBaseUnits, DEMO_GRANT_BASE_UNITS);
  assert.equal(account.reservedBaseUnits, 0n);
  assert.equal(account.spentBaseUnits, 0n);
});

test('compensating refund appends a new immutable ledger entry instead of editing settlement history', async () => {
  const { service } = await fundedService();
  const { reservation } = await reserveOne(service, SCOPE, 'copilot:req-refund');
  await service.recordCompletedDelivery({ actor: SCOPE, reservationId: reservation.id, responseText: 'response', responseId: 'resp-refund', now: new Date(NOW.getTime() + 2) });
  await service.settleCompletedDelivery(SCOPE, reservation.id, new Date(NOW.getTime() + 3));
  const refund = await service.createCompensatingRefund({ actor: SCOPE, reservationId: reservation.id, reason: 'support-approved correction', now: new Date(NOW.getTime() + 4) });
  assert.equal(refund.ledgerEntry.type, 'settlement_refund');
  const ledger = await service.getLedger(SCOPE);
  assert.deepEqual(ledger.slice(0, 2).map((entry) => entry.type), ['settlement_refund', 'reservation_settled']);
});

test('receipt anchor outbox publishes a Merkle root and records one Solana signature for the batch', async () => {
  const { service, store } = await fundedService();
  for (const [key, responseId, offset] of [['copilot:req-anchor-a', 'resp-anchor-a', 0], ['copilot:req-anchor-b', 'resp-anchor-b', 10]] as const) {
    const { reservation } = await reserveOne(service, SCOPE, key, new Date(NOW.getTime() + offset));
    await service.recordCompletedDelivery({ actor: SCOPE, reservationId: reservation.id, responseText: responseId, responseId, now: new Date(NOW.getTime() + offset + 2) });
    await service.settleCompletedDelivery(SCOPE, reservation.id, new Date(NOW.getTime() + offset + 3));
  }
  const published = await publishPendingReceiptAnchorBatch({
    store,
    now: new Date(NOW.getTime() + 20),
    publisher: { publishMerkleRoot: async ({ merkleRoot, receiptIds }) => ({ signature: `solana:${merkleRoot}:${receiptIds.length}` }) },
  });
  assert.equal(published.attempted, 2);
  assert.equal(published.published, 2);
  assert.match(published.merkleRoot!, /^[a-f0-9]{64}$/);
  assert.match(published.signature!, /^solana:/);
  assert.equal((await service.listPendingReceiptAnchors(100, new Date(NOW.getTime() + 21))).length, 0);
});

test('failed anchor publication remains retryable through the transactional outbox', async () => {
  const { service, store } = await fundedService();
  const { reservation } = await reserveOne(service, SCOPE, 'copilot:req-anchor-fail');
  await service.recordCompletedDelivery({ actor: SCOPE, reservationId: reservation.id, responseText: 'x', responseId: 'resp-anchor-fail', now: new Date(NOW.getTime() + 2) });
  await service.settleCompletedDelivery(SCOPE, reservation.id, new Date(NOW.getTime() + 3));
  const failed = await publishPendingReceiptAnchorBatch({ store, now: new Date(NOW.getTime() + 4), publisher: { publishMerkleRoot: async () => { throw new Error('rpc offline'); } } });
  assert.equal(failed.failed, 1);
  assert.equal((await service.listPendingReceiptAnchors(100, new Date(NOW.getTime() + 4))).length, 0);
  assert.equal((await service.listPendingReceiptAnchors(100, new Date(NOW.getTime() + 10_000))).length, 1);
});

test('Solana Pay credits only a verified payment.settled event and stays idempotent', async () => {
  const store = new InMemoryCreditStore();
  const service = new PwrcCreditService(store, { solanaPayRecipient: '11111111111111111111111111111111' });
  const intent = await service.createTopUpIntent(SCOPE, COPILOT_RESPONSE_COST_BASE_UNITS, NOW, 'topup:req-0001');
  assert.match(intent.solanaPayUri, /^solana:/);
  assert.match(intent.solanaPayUri, new RegExp(`spl-token=${PWRC_IDENTITY.mint}`));
  assert.equal((await service.getAccount(SCOPE, NOW)).availableBaseUnits, 0n);

  const payload = JSON.stringify({
    eventId: 'evt-1', type: 'payment.settled', paymentId: 'pay-1', userId: SCOPE.userId,
    topUpIntentId: intent.id, asset: 'PWRC', mint: PWRC_IDENTITY.mint, network: PWRC_IDENTITY.network,
    amountBaseUnits: COPILOT_RESPONSE_COST_BASE_UNITS.toString(), transactionSignature: '5igVerifiedByPaymentKernel',
    recipient: intent.recipient, reference: intent.reference, settledAt: '2026-08-26T08:01:00.000Z',
    verification: { status: 'verified', verificationId: 'verify-1' },
  });
  const timestamp = String(new Date('2026-08-26T08:01:00.000Z').getTime() / 1000);
  const secret = 'test-kernel-secret';
  const signature = createHmac('sha256', secret).update(`${timestamp}.${payload}`, 'utf8').digest('hex');
  const verified = verifyPaymentKernelWebhook({ rawBody: payload, signature: `sha256=${signature}`, timestamp, secret, now: new Date('2026-08-26T08:01:01.000Z') });
  const credited = await service.applyVerifiedPaymentSettled(verified, new Date('2026-08-26T08:01:01.000Z'));
  assert.equal(credited.availableBaseUnits, COPILOT_RESPONSE_COST_BASE_UNITS);
  const duplicate = await service.applyVerifiedPaymentSettled(verified, new Date('2026-08-26T08:01:02.000Z'));
  assert.equal(duplicate.availableBaseUnits, COPILOT_RESPONSE_COST_BASE_UNITS);
});

test('credit APIs require authentication and metered Copilot returns exact HTTP 402 before generation', async () => {
  const credits = new PwrcCreditService(new InMemoryCreditStore());
  const authenticate = async (request: Request) => request.headers.get('authorization') === 'Bearer test-access' ? SCOPE : null;
  const creditsHandler = createCreditsApiHandler({ credits, authenticate, paymentKernelWebhookSecret: 'kernel-secret' });
  assert.equal((await creditsHandler(new Request('https://api.powerchain.test/api/v1/credits/pricing'))).status, 401);

  let generated = false;
  const copilotHandler = createMeteredCopilotHandler({ credits, authenticate, generate: async () => { generated = true; return { text: 'must not run' }; } });
  const response = await copilotHandler(new Request('https://api.powerchain.test/api/v1/copilot/responses', {
    method: 'POST',
    headers: { authorization: 'Bearer test-access', 'content-type': 'application/json', 'idempotency-key': 'copilot:req-api-402' },
    body: JSON.stringify({ message: 'test' }),
  }));
  assert.equal(response.status, 402);
  assert.equal(generated, false);
  assert.equal(((await response.json()) as any).error.code, 'INSUFFICIENT_PWRC_CREDITS');
});
