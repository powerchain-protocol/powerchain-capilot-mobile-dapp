import type { PwrcCreditService } from '../credits/service.ts';
import type { CreditActor } from '../credits/scope.ts';
import { normalizeCreditScope } from '../credits/scope.ts';
import { buildCreditsGrounding } from './credits-grounding.ts';
import {
  COPILOT_MESSAGE_UNIT,
  COPILOT_RESPONSE_REFERENCE_VALUE_USD,
  PWRC_REFERENCE_PRICE_USD,
} from '../credits/constants.ts';
import { formatPwrcBaseUnits } from '../credits/units.ts';

export type CopilotProvenance = {
  provider?: string;
  model?: string;
  mcp?: Array<{ server?: string; tool: string; status: 'completed' | 'failed' }>;
};

export type MeteredCopilotGenerator = (input: {
  userId: string;
  organizationId: string;
  accountId: string;
  message: string;
  conversationId?: string;
  systemGrounding: { credits: ReturnType<typeof buildCreditsGrounding>; agent?: string };
}) => Promise<{ text: string; conversationId?: string; provenance?: CopilotProvenance; providerResponseId?: string }>;

export async function createMeteredCopilotResponse(input: {
  actor: CreditActor;
  message: string;
  idempotencyKey: string;
  conversationId?: string;
  credits: PwrcCreditService;
  generate: MeteredCopilotGenerator;
  now?: Date;
}) {
  const scope = normalizeCreditScope(input.actor);
  const now = input.now ?? new Date();

  // Authoritative lifecycle:
  // persist canonical server quote -> atomic reservation -> AI generation -> durable completed response
  // -> atomic Reserved→Spent + append-only ledger + signed receipt + anchor outbox.
  const quote = await input.credits.issueQuote(scope, 1, now, input.idempotencyKey);
  const reservation = await input.credits.reserveQuote(scope, quote, now);
  const account = await input.credits.getAccount(scope, now);
  const grounding = buildCreditsGrounding(account, quote);

  try {
    const generated = await input.generate({
      ...scope,
      message: input.message,
      conversationId: input.conversationId,
      systemGrounding: { credits: grounding },
    });
    if (!generated.text.trim()) throw new Error('Copilot provider returned an empty response.');

    // This call commits the completed-response proof before settlement starts.
    const completionNow = input.now ?? new Date();
    const delivery = await input.credits.recordCompletedDelivery({
      actor: scope,
      reservationId: reservation.id,
      responseText: generated.text,
      conversationId: generated.conversationId ?? input.conversationId,
      provider: generated.provenance?.provider,
      model: generated.provenance?.model,
      providerResponseId: generated.providerResponseId,
      now: completionNow,
    });

    // Separate transaction, fail-closed on the durable response precondition.
    const settlement = await input.credits.settleCompletedDelivery(scope, reservation.id, completionNow);
    const settledAccount = await input.credits.getAccount(scope, completionNow);

    return {
      ...generated,
      delivery: {
        responseId: delivery.responseId,
        reservationId: reservation.id,
        responseHash: delivery.responseHash,
        status: 'completed' as const,
      },
      credits: {
        quoteId: quote.id,
        quoteHash: quote.hash,
        quotePersisted: true,
        reservationId: reservation.id,
        chargedBaseUnits: quote.totalBaseUnits.toString(),
        chargedPwrc: formatPwrcBaseUnits(quote.totalBaseUnits),
        availableBaseUnits: settledAccount.availableBaseUnits.toString(),
        availablePwrc: formatPwrcBaseUnits(settledAccount.availableBaseUnits),
        settlementStatus: 'settled' as const,
        receipt: settlement.receipt,
      },
      messageUnit: {
        id: delivery.responseId,
        requestId: input.idempotencyKey,
        reservationId: reservation.id,
        quoteHash: quote.hash,
        unit: COPILOT_MESSAGE_UNIT,
        quantity: '1' as const,
        pwrcDebit: formatPwrcBaseUnits(quote.totalBaseUnits),
        baseUnitsDebit: quote.totalBaseUnits.toString(),
        referencePriceUsdPerPwrc: PWRC_REFERENCE_PRICE_USD,
        referenceValueUsd: COPILOT_RESPONSE_REFERENCE_VALUE_USD,
        referenceOnly: true as const,
        receiptId: settlement.receipt.receiptId,
        receiptHash: settlement.receipt.receiptHash,
      },
    };
  } catch (error) {
    // A failed/cancelled generation releases only an active reservation. If settlement already
    // committed, release fails closed and is intentionally ignored here.
    await input.credits.releaseReservation(scope, reservation.id).catch(() => undefined);
    throw error;
  }
}

/**
 * Compatibility endpoint: settlement is no longer triggered by ACK. This only performs an
 * idempotent readback via settleCompletedDelivery(), which returns the already-settled receipt.
 */
export async function acknowledgeMeteredCopilotDelivery(input: {
  actor: CreditActor;
  reservationId: string;
  credits: PwrcCreditService;
  now?: Date;
}) {
  const scope = normalizeCreditScope(input.actor);
  const now = input.now ?? new Date();
  const settlement = await input.credits.settleCompletedDelivery(scope, input.reservationId, now);
  const account = await input.credits.getAccount(scope, now);
  return {
    reservationId: settlement.reservation.id,
    responseId: settlement.delivery.responseId,
    status: settlement.reservation.status,
    chargedBaseUnits: settlement.reservation.amountBaseUnits.toString(),
    chargedPwrc: formatPwrcBaseUnits(settlement.reservation.amountBaseUnits),
    availableBaseUnits: account.availableBaseUnits.toString(),
    availablePwrc: formatPwrcBaseUnits(account.availableBaseUnits),
    receipt: settlement.receipt,
  };
}
