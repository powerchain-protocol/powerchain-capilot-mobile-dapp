import {
  COPILOT_RESPONSE_COST_BASE_UNITS,
  COPILOT_RESPONSE_COST_PWRC,
  COPILOT_MESSAGE_UNIT,
  COPILOT_RESPONSE_REFERENCE_VALUE_USD,
  CREDIT_PRICE_VERSION,
  DEMO_GRANT_BASE_UNITS,
  DEMO_GRANT_PWRC,
  DEMO_GRANT_RESPONSES,
  PAYMENT_KERNEL_MAX_BODY_BYTES,
  PWRC_REFERENCE_PRICE_USD,
  PWRC_REFERENCE_PRICE_MICRO_USD_PER_TOKEN,
  PWRC_REFERENCE_PRICE_SOURCE,
  PWRC_REFERENCE_FUNDING_PRESETS_PWRC,
  PWRC_IDENTITY,
} from '../credits/constants.ts';
import { CreditError } from '../credits/errors.ts';
import type { PwrcCreditService } from '../credits/service.ts';
import { formatPwrcBaseUnits, formatUsdMicroUnitsFixed, parseBaseUnits } from '../credits/units.ts';
import type { CreditAccount, CreditLedgerEntry, CreditQuote, CreditScope, TokenizedReceipt, TopUpIntent } from '../credits/types.ts';
import { personalCreditScope } from '../credits/scope.ts';
import { PaymentKernelVerificationError, verifyPaymentKernelWebhook } from '../payment-kernel/verify.ts';

export type AuthenticatedPrincipal = { userId: string; organizationId?: string | null; accountId?: string | null };
export type RequestAuthenticator = (request: Request) => Promise<AuthenticatedPrincipal | null>;


function billingScope(principal: AuthenticatedPrincipal): CreditScope {
  const personal = personalCreditScope(principal.userId);
  return {
    userId: principal.userId,
    organizationId: principal.organizationId?.trim() || personal.organizationId,
    accountId: principal.accountId?.trim() || principal.userId,
  };
}

function json(body: unknown, status = 200, extraHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store, private',
      ...extraHeaders,
    },
  });
}

function accountJson(account: CreditAccount) {
  return {
    userId: account.userId,
    organizationId: account.organizationId,
    accountId: account.accountId,
    availableBaseUnits: account.availableBaseUnits.toString(),
    reservedBaseUnits: account.reservedBaseUnits.toString(),
    spentBaseUnits: account.spentBaseUnits.toString(),
    fundedBaseUnits: account.fundedBaseUnits.toString(),
    availablePwrc: formatPwrcBaseUnits(account.availableBaseUnits),
    reservedPwrc: formatPwrcBaseUnits(account.reservedBaseUnits),
    spentPwrc: formatPwrcBaseUnits(account.spentBaseUnits),
    fundedPwrc: formatPwrcBaseUnits(account.fundedBaseUnits),
    responseCreditsRemaining: (account.availableBaseUnits / COPILOT_RESPONSE_COST_BASE_UNITS).toString(),
    version: account.version.toString(),
    updatedAt: account.updatedAt.toISOString(),
  };
}

function quoteJson(quote: CreditQuote) {
  return {
    id: quote.id,
    hash: quote.hash,
    idempotencyKey: quote.idempotencyKey,
    organizationId: quote.organizationId,
    accountId: quote.accountId,
    priceVersion: quote.priceVersion,
    product: quote.product,
    quantity: quote.quantity,
    unitCostBaseUnits: quote.unitCostBaseUnits.toString(),
    totalBaseUnits: quote.totalBaseUnits.toString(),
    totalPwrc: formatPwrcBaseUnits(quote.totalBaseUnits),
    issuedAt: quote.issuedAt.toISOString(),
    expiresAt: quote.expiresAt.toISOString(),
  };
}

function ledgerJson(entry: CreditLedgerEntry) {
  return {
    id: entry.id,
    organizationId: entry.organizationId,
    accountId: entry.accountId,
    sequence: entry.sequence.toString(),
    type: entry.type,
    availableDeltaBaseUnits: entry.availableDeltaBaseUnits.toString(),
    reservedDeltaBaseUnits: entry.reservedDeltaBaseUnits.toString(),
    spentDeltaBaseUnits: entry.spentDeltaBaseUnits.toString(),
    fundedDeltaBaseUnits: entry.fundedDeltaBaseUnits.toString(),
    availableAfterBaseUnits: entry.availableAfterBaseUnits.toString(),
    reservedAfterBaseUnits: entry.reservedAfterBaseUnits.toString(),
    spentAfterBaseUnits: entry.spentAfterBaseUnits.toString(),
    fundedAfterBaseUnits: entry.fundedAfterBaseUnits.toString(),
    reservationId: entry.reservationId,
    paymentId: entry.paymentId,
    quoteHash: entry.quoteHash,
    metadata: entry.metadata,
    createdAt: entry.createdAt.toISOString(),
  };
}


function receiptJson(receipt: TokenizedReceipt) {
  return { ...receipt };
}

function topUpJson(intent: TopUpIntent) {
  return {
    id: intent.id,
    organizationId: intent.organizationId,
    accountId: intent.accountId,
    requestedBaseUnits: intent.requestedBaseUnits.toString(),
    requestedPwrc: formatPwrcBaseUnits(intent.requestedBaseUnits),
    recipient: intent.recipient,
    reference: intent.reference,
    solanaPayUri: intent.solanaPayUri,
    status: intent.status,
    createdAt: intent.createdAt.toISOString(),
    expiresAt: intent.expiresAt.toISOString(),
    paymentId: intent.paymentId,
    settledAt: intent.settledAt?.toISOString(),
  };
}

async function bodyJson(request: Request): Promise<Record<string, unknown>> {
  const value = (await request.json()) as unknown;
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new TypeError('JSON object body required.');
  return value as Record<string, unknown>;
}

async function requireAuth(authenticate: RequestAuthenticator, request: Request) {
  const principal = await authenticate(request);
  if (!principal?.userId) throw new CreditError('Authentication required.', 'UNAUTHENTICATED', 401);
  return principal;
}

export function creditErrorResponse(error: unknown): Response {
  if (error instanceof CreditError) {
    return json({ error: { code: error.code, message: error.message, details: error.details } }, error.status);
  }
  if (error instanceof PaymentKernelVerificationError) {
    return json({ error: { code: error.code, message: error.message } }, error.status);
  }
  if (error instanceof TypeError || error instanceof RangeError) {
    return json({ error: { code: 'INVALID_REQUEST', message: error.message } }, 400);
  }
  return json({ error: { code: 'INTERNAL_ERROR', message: 'Request failed.' } }, 500);
}

export function createCreditsApiHandler(deps: {
  credits: PwrcCreditService;
  authenticate: RequestAuthenticator;
  paymentKernelWebhookSecret: string;
}) {
  return async function handle(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, '') || '/';

    try {
      if (request.method === 'POST' && path === '/internal/v1/payment-kernel/webhook') {
        const contentType = request.headers.get('content-type') ?? '';
        if (!contentType.toLowerCase().includes('application/json')) {
          return json({ error: { code: 'UNSUPPORTED_MEDIA_TYPE', message: 'Payment Kernel webhook requires application/json.' } }, 415);
        }
        const declaredLength = Number(request.headers.get('content-length') ?? '0');
        if (Number.isFinite(declaredLength) && declaredLength > PAYMENT_KERNEL_MAX_BODY_BYTES) {
          return json({ error: { code: 'PAYLOAD_TOO_LARGE', message: 'Payment Kernel webhook body is too large.' } }, 413);
        }
        const rawBody = await request.text();
        if (Buffer.byteLength(rawBody, 'utf8') > PAYMENT_KERNEL_MAX_BODY_BYTES) {
          return json({ error: { code: 'PAYLOAD_TOO_LARGE', message: 'Payment Kernel webhook body is too large.' } }, 413);
        }
        const verified = verifyPaymentKernelWebhook({
          rawBody,
          signature: request.headers.get('x-powerchain-signature') ?? '',
          timestamp: request.headers.get('x-powerchain-timestamp') ?? '',
          secret: deps.paymentKernelWebhookSecret,
        });
        const account = await deps.credits.applyVerifiedPaymentSettled(verified);
        return json({ ok: true, eventId: verified.eventId, account: accountJson(account) });
      }

      const principal = await requireAuth(deps.authenticate, request);
      const scope = billingScope(principal);

      if (request.method === 'GET' && path === '/api/v1/credits/pricing') {
        return json({
          priceVersion: CREDIT_PRICE_VERSION,
          unit: 'copilot.response',
          responseCostBaseUnits: COPILOT_RESPONSE_COST_BASE_UNITS.toString(),
          responseCostPwrc: COPILOT_RESPONSE_COST_PWRC.toString(),
          messageUnit: COPILOT_MESSAGE_UNIT,
          referenceEconomics: {
            source: PWRC_REFERENCE_PRICE_SOURCE,
            referencePriceUsdPerPwrc: PWRC_REFERENCE_PRICE_USD,
            responseReferenceValueUsd: COPILOT_RESPONSE_REFERENCE_VALUE_USD,
            liveMarketPrice: false,
            disclaimer: 'Configured initial/reference value only; not a live PWRC market price.',
          },
          fundingPresets: PWRC_REFERENCE_FUNDING_PRESETS_PWRC.map((pwrc) => ({
            pwrc: pwrc.toString(),
            responses: (pwrc / COPILOT_RESPONSE_COST_PWRC).toString(),
            referenceValueUsd: formatUsdMicroUnitsFixed(pwrc * PWRC_REFERENCE_PRICE_MICRO_USD_PER_TOKEN, 2),
          })),
          unmeteredReads: ['pricing', 'account', 'ledger'] as const,
          demoGrantBaseUnits: DEMO_GRANT_BASE_UNITS.toString(),
          demoGrantPwrc: DEMO_GRANT_PWRC.toString(),
          demoGrantResponses: DEMO_GRANT_RESPONSES.toString(),
          demoGrantIsSample: true,
          accounting: { representation: 'integer-base-units', decimals: PWRC_IDENTITY.decimals },
          topUpSettlementAuthority: 'payment-kernel',
          topUpCreditEvent: 'payment.settled',
          receiptVerification: deps.credits.getReceiptVerificationKey(),
          pwrc: PWRC_IDENTITY,
        });
      }

      if (request.method === 'GET' && path === '/api/v1/credits/account') {
        return json({ account: accountJson(await deps.credits.getAccount(scope)) });
      }

      if (request.method === 'GET' && path === '/api/v1/credits/ledger') {
        const limit = Number(url.searchParams.get('limit') ?? '50');
        const beforeRaw = url.searchParams.get('before');
        const before = beforeRaw ? parseBaseUnits(beforeRaw) : undefined;
        const entries = await deps.credits.getLedger(scope, limit, before);
        return json({ entries: entries.map(ledgerJson), nextBefore: entries.at(-1)?.sequence.toString() ?? null });
      }

      if (request.method === 'POST' && path === '/api/v1/credits/quotes') {
        const body = await bodyJson(request);
        const quantity = body.quantity === undefined ? 1 : Number(body.quantity);
        const idempotencyKey = request.headers.get('idempotency-key')?.trim() || '';
        if (!idempotencyKey) return json({ error: { code: 'IDEMPOTENCY_KEY_REQUIRED', message: 'Idempotency-Key header is required.' } }, 400);
        return json({ quote: quoteJson(await deps.credits.issueQuote(scope, quantity, new Date(), idempotencyKey)) }, 201);
      }

      const quoteMatch = path.match(/^\/api\/v1\/credits\/quotes\/([a-f0-9]{64})$/i);
      if (request.method === 'GET' && quoteMatch?.[1]) {
        return json({ quote: quoteJson(await deps.credits.getQuote(scope, quoteMatch[1])) });
      }

      const receiptMatch = path.match(/^\/api\/v1\/credits\/receipts\/([^/]+)$/);
      if (request.method === 'GET' && receiptMatch?.[1]) {
        const receipt = await deps.credits.getReceipt(scope, decodeURIComponent(receiptMatch[1]));
        return json({ receipt: receiptJson(receipt) });
      }

      if (request.method === 'POST' && path === '/api/v1/credits/demo-grant') {
        const result = await deps.credits.claimDemoGrant(scope);
        return json({ account: accountJson(result.account), ledgerEntry: ledgerJson(result.ledgerEntry) }, 201);
      }

      if (request.method === 'POST' && path === '/api/v1/credits/top-ups/solana-pay') {
        const body = await bodyJson(request);
        const amountBaseUnits = typeof body.amountBaseUnits === 'string' ? body.amountBaseUnits : '';
        const intent = await deps.credits.createTopUpIntent(
          scope,
          amountBaseUnits,
          new Date(),
          request.headers.get('idempotency-key') ?? undefined,
        );
        return json({ topUp: topUpJson(intent) }, 201);
      }

      const topUpStatusMatch = path.match(/^\/api\/v1\/credits\/top-ups\/([^/]+)$/);
      if (request.method === 'GET' && topUpStatusMatch?.[1]) {
        const intent = await deps.credits.getTopUpIntent(scope, decodeURIComponent(topUpStatusMatch[1]));
        return json({ topUp: topUpJson(intent) });
      }

      return json({ error: { code: 'NOT_FOUND', message: 'Route not found.' } }, 404);
    } catch (error) {
      return creditErrorResponse(error);
    }
  };
}
