import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { authenticate } from "../lib/session";
import { prisma } from "../lib/prisma";
import { generateCopilotResponse } from "../integrations/ai";
import { rateLimit } from "../lib/rate-limit";
import { env } from "../config/env";
import {
  getCreditLedger,
  getPwrcCreditAccountView,
  releaseReservation,
  receiptView,
  reserveMessageCredits,
} from "../credits/service";
import {
  acknowledgePendingCopilotResponse,
  createPendingCopilotResponse,
  getPendingCopilotResponseReplay,
} from "../credits/pending-response";
import {
  cancelCopilotExecution,
  registerCopilotExecution,
  unregisterCopilotExecution,
} from "../credits/executions";
import { verifyCopilotResponse } from "../credits/verify-response";
import { PwrcCreditCancelledError } from "../credits/errors";
import { copilotRequestFingerprint } from "../credits/fingerprint";
import { protectUserMessage, revealMessageContent, secureConversationTitle } from "../chat/message-security.js";
const schema = z.object({
  conversationId: z.string().optional(),
  clientRequestId: z.string().min(8).max(128),
  message: z.string().trim().min(1).max(2000),
  context: z
    .object({
      network: z.string().optional(),
      walletAddress: z.string().optional(),
      screen: z.string().optional(),
      assetIds: z.array(z.string()).max(50).optional(),
      metadata: z.record(z.string(), z.unknown()).optional(),
    })
    .optional(),
});

const cancelSchema = z.object({
  clientRequestId: z.string().min(8).max(128),
});

const acknowledgeSchema = z.object({
  clientRequestId: z.string().min(8).max(128),
  responseToken: z.string().min(32).max(256),
});

const recoverSchema = z.object({
  clientRequestId: z.string().min(8).max(128),
});

export async function registerAiRoutes(app: FastifyInstance) {
  app.post(
    "/api/v1/ai/chat/recover",
    {
      preHandler: rateLimit({
        namespace: "ai-chat-recover",
        limit: Math.max(env.AI_RATE_LIMIT * 3, 60),
        windowMs: env.AI_RATE_WINDOW_MS,
      }),
    },
    async (request) => {
      const { user } = await authenticate(request);
      const input = recoverSchema.parse(request.body);
      const reservation = await prisma.pwrcCreditReservation.findUnique({
        where: {
          userId_clientRequestId: {
            userId: user.id,
            clientRequestId: input.clientRequestId,
          },
        },
      });

      if (!reservation) {
        throw Object.assign(new Error("Copilot request was not found."), {
          statusCode: 404,
          code: "COPILOT_REQUEST_NOT_FOUND",
        });
      }

      if (reservation.status === "SETTLED") {
        const settled = await prisma.pwrcMessageReceipt.findUnique({
          where: { reservationId: reservation.id },
          include: { aiMessage: true },
        });
        if (!settled?.aiMessage) {
          throw Object.assign(new Error("Settled Copilot message is unavailable."), {
            statusCode: 409,
            code: "COPILOT_REPLAY_MESSAGE_UNAVAILABLE",
          });
        }
        const account = await getPwrcCreditAccountView(user.id);
        return {
          conversationId: settled.conversationId,
          messageId: settled.aiMessage.id,
          content: settled.aiMessage.content,
          model: settled.aiMessage.model ?? env.OPENAI_MODEL,
          creditReceipt: receiptView(settled),
          creditAccount: account,
          creditSettlement: "settled" as const,
          replay: true,
        };
      }

      if (reservation.status === "RESERVED") {
        const pending = await getPendingCopilotResponseReplay({
          userId: user.id,
          reservationId: reservation.id,
        });
        if (pending) {
          const account = await getPwrcCreditAccountView(user.id);
          return {
            conversationId: pending.pending.conversationId,
            pendingResponseId: pending.pending.id,
            content: pending.pending.content,
            model: pending.pending.model,
            responseToken: pending.responseToken,
            creditReceipt: null,
            creditAccount: account,
            creditSettlement: "pending_ack" as const,
            replay: true,
          };
        }
        throw Object.assign(new Error("Copilot request is still generating."), {
          statusCode: 409,
          code: "COPILOT_REQUEST_IN_PROGRESS",
        });
      }

      throw Object.assign(
        new Error("Copilot request was released without a charge."),
        {
          statusCode: 409,
          code: "COPILOT_REQUEST_ALREADY_RELEASED",
        },
      );
    },
  );

  app.post(
    "/api/v1/ai/chat/ack",
    {
      preHandler: rateLimit({
        namespace: "ai-chat-ack",
        limit: Math.max(env.AI_RATE_LIMIT * 3, 60),
        windowMs: env.AI_RATE_WINDOW_MS,
      }),
    },
    async (request) => {
      const { user } = await authenticate(request);
      const input = acknowledgeSchema.parse(request.body);
      return acknowledgePendingCopilotResponse({
        userId: user.id,
        clientRequestId: input.clientRequestId,
        responseToken: input.responseToken,
        requestId: request.id,
      });
    },
  );

  app.post("/api/v1/ai/chat/cancel", async (request) => {
    const { user } = await authenticate(request);
    const { clientRequestId } = cancelSchema.parse(request.body);

    const generationCancelled = cancelCopilotExecution(
      user.id,
      clientRequestId,
    );

    const reservation = await prisma.pwrcCreditReservation.findUnique({
      where: {
        userId_clientRequestId: {
          userId: user.id,
          clientRequestId,
        },
      },
    });

    const released =
      reservation?.status === "RESERVED"
        ? await releaseReservation(
            reservation.id,
            "user_cancelled_generation_or_pending_delivery",
          )
        : null;

    return {
      clientRequestId,
      cancelled:
        generationCancelled || released?.status === "RELEASED",
      generationCancelled,
      reservationStatus: released?.status ?? reservation?.status ?? null,
    };
  });

  app.post(
    "/api/v1/ai/chat",
    {
      preHandler: rateLimit({
        namespace: "ai-chat",
        limit: env.AI_RATE_LIMIT,
        windowMs: env.AI_RATE_WINDOW_MS,
      }),
    },
    async (request, reply) => {
      const { user } = await authenticate(request);
      const input = schema.parse(request.body);

      const requestHash = copilotRequestFingerprint({
        conversationId: input.conversationId,
        message: input.message,
        context: input.context,
      });

      const reservationResult = await reserveMessageCredits({
        userId: user.id,
        conversationId: input.conversationId,
        clientRequestId: input.clientRequestId,
        requestId: request.id,
        idempotencyKey: `copilot:${input.clientRequestId}`,
        requestHash,
      });
      const reservation = reservationResult.reservation;

      if (reservationResult.replay) {
        if (reservation.status === "SETTLED") {
          const settled = await prisma.pwrcMessageReceipt.findUnique({
            where: { reservationId: reservation.id },
            include: { aiMessage: true },
          });

          if (settled?.aiMessage) {
            return {
              conversationId: settled.conversationId,
              messageId: settled.aiMessage.id,
              content: settled.aiMessage.content,
              model: settled.aiMessage.model ?? env.OPENAI_MODEL,
              creditReceipt: receiptView(settled),
              creditAccount: reservationResult.account,
              creditSettlement: "settled" as const,
              replay: true,
            };
          }

          throw Object.assign(
            new Error(
              "The settled Copilot response is no longer available in this conversation.",
            ),
            {
              statusCode: 409,
              code: "COPILOT_REPLAY_MESSAGE_UNAVAILABLE",
            },
          );
        }

        if (reservation.status === "RESERVED") {
          const pending = await getPendingCopilotResponseReplay({
            userId: user.id,
            reservationId: reservation.id,
          });
          if (pending) {
            return {
              conversationId: pending.pending.conversationId,
              pendingResponseId: pending.pending.id,
              content: pending.pending.content,
              model: pending.pending.model,
              responseToken: pending.responseToken,
              creditReceipt: null,
              creditAccount: reservationResult.account,
              creditSettlement: "pending_ack" as const,
              replay: true,
            };
          }

          throw Object.assign(
            new Error("This Copilot request is already in progress."),
            {
              statusCode: 409,
              code: "COPILOT_REQUEST_IN_PROGRESS",
            },
          );
        }

        throw Object.assign(
          new Error(
            "This Copilot request was released without charge. Submit a new request to retry.",
          ),
          {
            statusCode: 409,
            code: "COPILOT_REQUEST_ALREADY_RELEASED",
          },
        );
      }

      const controller = registerCopilotExecution(
        user.id,
        input.clientRequestId,
      );

      const onAborted = () => controller.abort("client_disconnected");
      request.raw.once("aborted", onAborted);

      try {
        if (controller.signal.aborted) {
          throw new PwrcCreditCancelledError();
        }

        let conversation = input.conversationId
          ? await prisma.aiConversation.findFirst({
              where: {
                id: input.conversationId,
                userId: user.id,
              },
            })
          : null;

        if (input.conversationId && !conversation) {
          await releaseReservation(
            reservation.id,
            "conversation_not_found",
          );
          return reply.code(404).send({
            error: "conversation_not_found",
          });
        }

        conversation ??= await prisma.aiConversation.create({
          data: {
            userId: user.id,
            slug: crypto.randomUUID(),
            title: secureConversationTitle(input.message),
            context: input.context,
          },
        });

        if (!reservation.conversationId) {
          await prisma.pwrcCreditReservation.update({
            where: { id: reservation.id },
            data: { conversationId: conversation.id },
          });
        }

        const protectedUserMessage = protectUserMessage(input.message);
        await prisma.aiMessage.create({
          data: {
            conversationId: conversation.id,
            role: "USER",
            slug: crypto.randomUUID(),
            ...protectedUserMessage,
            metadata: {
              ...input.context,
              creditReservationId: reservation.id,
              creditQuoteHash: reservation.quoteHash,
            },
          },
        });

        const recent = await prisma.aiMessage.findMany({
          where: { conversationId: conversation.id },
          orderBy: { createdAt: "desc" },
          take: 12,
        });

        const history = recent
          .reverse()
          .filter(
            (message) =>
              message.role === "USER" || message.role === "ASSISTANT",
          )
          .slice(0, -1)
          .map((message) => ({
            role:
              message.role === "USER"
                ? ("user" as const)
                : ("assistant" as const),
            content: revealMessageContent(message),
          }));

        const [credits, recentCreditLedger] = await Promise.all([
          getPwrcCreditAccountView(user.id),
          getCreditLedger(user.id, 5),
        ]);
        const generated = await generateCopilotResponse({
          message: input.message,
          history,
          signal: controller.signal,
          userId: user.id,
          conversationId: conversation.id,
          reservationId: reservation.id,
          requestId: request.id,
          context: {
            ...(input.context ?? {}),
            pwrcCredits: {
              availableBaseUnits: credits.availableBaseUnits,
              reservedBaseUnits: credits.reservedBaseUnits,
              spentBaseUnits: credits.spentBaseUnits,
              responseRunway: credits.responseRunway,
              completedResponseCostPwrc: reservationResult.quote.costTokens,
              completedResponseCostBaseUnits: reservationResult.quote.costBaseUnits,
              completedResponseReferenceUsd: reservationResult.quote.referenceUsd,
              referenceUsdPerPwrc: reservationResult.quote.referenceUsdPerPwrc,
              referencePriceIsLive: reservationResult.quote.referencePriceIsLive,
              pricingVersion: reservationResult.quote.pricingVersion,
              quoteSchemaVersion: reservationResult.quote.quoteSchemaVersion,
              quoteKind: reservationResult.quote.quoteKind,
              billingTrigger: reservationResult.quote.billingTrigger,
              quoteHash: reservationResult.quote.quoteHash,
              token: {
                symbol: reservationResult.quote.asset,
                decimals: reservationResult.quote.decimals,
                mint: reservationResult.quote.mint,
                network: reservationResult.quote.network,
                tokenProgram: reservationResult.quote.tokenProgram,
              },
              recentLedger: recentCreditLedger.map((entry) => ({
                entryType: entry.entryType,
                deltaAvailableBaseUnits: entry.deltaAvailableBaseUnits,
                deltaReservedBaseUnits: entry.deltaReservedBaseUnits,
                deltaSpentBaseUnits: entry.deltaSpentBaseUnits,
                deltaFundedBaseUnits: entry.deltaFundedBaseUnits,
                messageReceiptId: entry.messageReceiptId,
                paymentSettlementId: entry.paymentSettlementId,
                createdAt: entry.createdAt,
              })),
            },
          },
        });

        if (controller.signal.aborted) {
          throw new PwrcCreditCancelledError();
        }

        const verification = verifyCopilotResponse(generated.content);
        if (!verification.verified) {
          throw Object.assign(
            new Error("Copilot produced an empty response."),
            {
              statusCode: 502,
              code: "COPILOT_EMPTY_RESPONSE",
            },
          );
        }

        if (controller.signal.aborted || request.raw.aborted) {
          throw new PwrcCreditCancelledError();
        }

        const prepared = await prisma.$transaction(async (tx) => {
          const pending = await createPendingCopilotResponse(tx, {
            userId: user.id,
            reservationId: reservation.id,
            conversationId: conversation!.id,
            content: verification.content,
            provider: generated.provider,
            model: generated.model,
            upstreamResponseId: generated.responseId,
            mcpInvocations: generated.mcpInvocations,
          });

          await tx.auditEvent.create({
            data: {
              userId: user.id,
              action: "ai.response.prepared_pending_delivery_ack",
              resourceType: "conversation",
              resourceId: conversation!.id,
              requestId: request.id,
              metadata: {
                pendingResponseId: pending.pending.id,
                provider: generated.provider,
                model: generated.model,
                creditReservationId: reservation.id,
                pwrcChargeState: "reserved_not_settled",
                mcpInvocations: generated.mcpInvocations,
              },
            },
          });

          return pending;
        });

        // If the transport dies while Fastify is writing this response, no
        // acknowledgement can arrive. Release immediately when the response
        // socket closes abnormally; normal delivery remains RESERVED until ACK.
        reply.raw.once("close", () => {
          if (!reply.raw.writableFinished) {
            void releaseReservation(
              reservation.id,
              "response_transport_disconnected_before_ack",
            );
          }
        });

        const currentAccount = await getPwrcCreditAccountView(user.id);

        return {
          conversationId: conversation.id,
          pendingResponseId: prepared.pending.id,
          content: prepared.pending.content,
          model: prepared.pending.model,
          responseToken: prepared.responseToken,
          creditReceipt: null,
          creditAccount: currentAccount,
          creditSettlement: "pending_ack" as const,
        };
      } catch (error) {
        await releaseReservation(
          reservation.id,
          controller.signal.aborted
            ? "generation_cancelled_or_disconnected"
            : error instanceof Error
              ? error.message
              : "generation_failed",
        );

        if (controller.signal.aborted) {
          throw new PwrcCreditCancelledError();
        }
        throw error;
      } finally {
        request.raw.off("aborted", onAborted);
        unregisterCopilotExecution(user.id, input.clientRequestId);
      }
    },
  );
}
