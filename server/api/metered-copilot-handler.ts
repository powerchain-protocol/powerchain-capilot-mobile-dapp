import { creditErrorResponse, type RequestAuthenticator } from './credits-handler.ts';
import type { PwrcCreditService } from '../credits/service.ts';
import { acknowledgeMeteredCopilotDelivery, createMeteredCopilotResponse, type MeteredCopilotGenerator } from '../copilot/metered-response.ts';
import type { ChatPersistence } from '../chat/types.ts';
import { personalCreditScope } from '../credits/scope.ts';

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store, private',
    },
  });
}

export function createMeteredCopilotHandler(deps: {
  credits: PwrcCreditService;
  authenticate: RequestAuthenticator;
  generate: MeteredCopilotGenerator;
  chat?: ChatPersistence | null;
}) {
  return async function handle(request: Request) {
    try {
      const principal = await deps.authenticate(request);
      if (!principal?.userId) return json({ error: { code: 'UNAUTHENTICATED', message: 'Authentication required.' } }, 401);
      const personal = personalCreditScope(principal.userId);
      const actor = { userId: principal.userId, organizationId: principal.organizationId?.trim() || personal.organizationId, accountId: principal.accountId?.trim() || principal.userId };
      const pathname = new URL(request.url).pathname;

      if (pathname.endsWith('/delivery-ack')) {
        if (request.method !== 'POST') return json({ error: { code: 'METHOD_NOT_ALLOWED', message: 'POST required.' } }, 405);
        const body = (await request.json()) as { reservationId?: unknown };
        const reservationId = typeof body.reservationId === 'string' ? body.reservationId.trim() : '';
        if (!reservationId) return json({ error: { code: 'INVALID_REQUEST', message: 'reservationId is required.' } }, 400);
        const settlement = await acknowledgeMeteredCopilotDelivery({ actor, reservationId, credits: deps.credits });
        return json({ settlement });
      }

      const idempotencyKey = request.headers.get('idempotency-key')?.trim() || '';
      if (!idempotencyKey) return json({ error: { code: 'IDEMPOTENCY_KEY_REQUIRED', message: 'Idempotency-Key header is required for metered Copilot responses.' } }, 400);
      const body = (await request.json()) as { message?: unknown; conversationId?: unknown; agent?: unknown };
      const message = typeof body.message === 'string' ? body.message.trim() : '';
      if (!message) return json({ error: { code: 'INVALID_REQUEST', message: 'message is required.' } }, 400);
      if (message.length > 2_000) return json({ error: { code: 'INVALID_REQUEST', message: 'message must be 2,000 characters or fewer.' } }, 400);

      let conversationId = typeof body.conversationId === 'string' ? body.conversationId.trim() : undefined;
      if (deps.chat) {
        const conversation = await deps.chat.ensureConversation({ userId: principal.userId, conversationId, titleSeed: message });
        conversationId = conversation.id;
        await deps.chat.appendMessage({ userId: principal.userId, conversationId, role: 'user', content: message });
      }

      const result = await createMeteredCopilotResponse({
        actor,
        message,
        idempotencyKey,
        conversationId,
        credits: deps.credits,
        generate: async (input) => deps.generate({
          ...input,
          systemGrounding: {
            ...input.systemGrounding,
            ...(typeof body.agent === 'string' ? { agent: body.agent } : {}),
          } as typeof input.systemGrounding,
        }),
      });

      if (deps.chat && conversationId) {
        await deps.chat.appendMessage({
          userId: principal.userId,
          conversationId,
          role: 'assistant',
          content: result.text,
          provider: result.provenance?.provider,
          model: result.provenance?.model,
          reservationId: result.delivery.reservationId,
          messageUnitId: result.messageUnit.id,
          receiptId: result.messageUnit.receiptId,
          receiptHash: result.messageUnit.receiptHash,
          pwrcDebitBaseUnits: result.messageUnit.baseUnitsDebit,
          referenceValueUsd: result.messageUnit.referenceValueUsd,
        });
      }

      return json({
        message: result.text,
        conversationId: result.conversationId ?? conversationId,
        credits: result.credits,
        delivery: result.delivery,
        provenance: result.provenance,
        messageUnit: result.messageUnit,
      });
    } catch (error) {
      return creditErrorResponse(error);
    }
  };
}
