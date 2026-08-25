import {
  createHash,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
import { prisma } from "../lib/prisma";
import { env } from "../config/env";
import { creditId } from "./ids";
import {
  accountView,
  receiptView,
  releaseExpiredReservations,
  settleMessageCreditsInTransaction,
} from "./service";

type CreditDb = any;

function tokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function newDeliveryToken() {
  return randomBytes(32).toString("base64url");
}

function safeTokenMatch(token: string, expectedHash: string) {
  const actual = Buffer.from(tokenHash(token), "hex");
  const expected = Buffer.from(expectedHash, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export async function createPendingCopilotResponse(
  tx: CreditDb,
  input: {
    userId: string;
    reservationId: string;
    conversationId: string;
    content: string;
    provider: string;
    model: string;
    upstreamResponseId?: string;
    mcpInvocations?: unknown;
  },
) {
  const responseToken = newDeliveryToken();
  const expiresAt = new Date(
    Date.now() + env.PWRC_CREDIT_ACK_TTL_SECONDS * 1000,
  );

  const claimed = await tx.pwrcCreditReservation.updateMany({
    where: { id: input.reservationId, status: "RESERVED" },
    data: { expiresAt },
  });
  if (claimed.count !== 1) {
    throw Object.assign(new Error("PWRC reservation expired before response preparation."), {
      statusCode: 409,
      code: "PWRC_RESERVATION_NOT_PREPARABLE",
    });
  }

  const pending = await tx.pwrcPendingResponse.create({
    data: {
      id: creditId("ppresp"),
      userId: input.userId,
      reservationId: input.reservationId,
      conversationId: input.conversationId,
      responseTokenHash: tokenHash(responseToken),
      content: input.content,
      provider: input.provider,
      model: input.model,
      upstreamResponseId: input.upstreamResponseId,
      mcpInvocations: input.mcpInvocations,
      expiresAt,
    },
  });

  return {
    pending,
    responseToken,
  };
}

export async function getPendingCopilotResponseReplay(input: {
  userId: string;
  reservationId: string;
}) {
  await releaseExpiredReservations({ userId: input.userId });
  return prisma.$transaction(async (tx) => {
    const pending = await tx.pwrcPendingResponse.findUnique({
      where: { reservationId: input.reservationId },
    });
    if (!pending || pending.userId !== input.userId) return null;
    if (pending.status !== "PENDING") return null;
    if (pending.expiresAt.getTime() <= Date.now()) return null;

    const responseToken = newDeliveryToken();
    const nextHash = tokenHash(responseToken);
    const rotated = await tx.pwrcPendingResponse.updateMany({
      where: {
        id: pending.id,
        status: "PENDING",
        responseTokenHash: pending.responseTokenHash,
        expiresAt: { gt: new Date() },
      },
      data: { responseTokenHash: nextHash },
    });

    if (rotated.count !== 1) {
      throw Object.assign(
        new Error("Concurrent Copilot response recovery detected. Retry recovery."),
        { statusCode: 409, code: "COPILOT_RECOVERY_RACE" },
      );
    }

    const current = await tx.pwrcPendingResponse.findUniqueOrThrow({
      where: { id: pending.id },
    });

    return {
      pending: current,
      responseToken,
    };
  });
}

export async function acknowledgePendingCopilotResponse(input: {
  userId: string;
  clientRequestId: string;
  responseToken: string;
  requestId: string;
}) {
  await releaseExpiredReservations({ userId: input.userId });
  return prisma.$transaction(async (tx) => {
    const reservation = await tx.pwrcCreditReservation.findUnique({
      where: {
        userId_clientRequestId: {
          userId: input.userId,
          clientRequestId: input.clientRequestId,
        },
      },
    });

    if (!reservation) {
      throw Object.assign(new Error("PWRC reservation not found."), {
        statusCode: 404,
        code: "PWRC_RESERVATION_NOT_FOUND",
      });
    }

    const pending = await tx.pwrcPendingResponse.findUnique({
      where: { reservationId: reservation.id },
      include: { aiMessage: true },
    });

    if (!pending || pending.userId !== input.userId) {
      throw Object.assign(new Error("Pending Copilot response not found."), {
        statusCode: 404,
        code: "COPILOT_PENDING_RESPONSE_NOT_FOUND",
      });
    }

    if (
      pending.status === "ACKNOWLEDGED" &&
      pending.aiMessage
    ) {
      const receipt = await tx.pwrcMessageReceipt.findUniqueOrThrow({
        where: { reservationId: reservation.id },
      });
      const account = await tx.pwrcCreditAccount.findUniqueOrThrow({
        where: { id: reservation.accountId },
      });
      return {
        replay: true,
        conversationId: pending.conversationId,
        messageId: pending.aiMessage.id,
        content: pending.aiMessage.content,
        model: pending.aiMessage.model ?? pending.model,
        creditReceipt: receiptView(receipt),
        creditAccount: accountView(account),
      };
    }

    if (!safeTokenMatch(input.responseToken, pending.responseTokenHash)) {
      throw Object.assign(new Error("Invalid Copilot response acknowledgement token."), {
        statusCode: 401,
        code: "INVALID_COPILOT_RESPONSE_TOKEN",
      });
    }

    if (
      pending.status !== "PENDING" ||
      reservation.status !== "RESERVED"
    ) {
      throw Object.assign(new Error("Copilot response is no longer acknowledgeable."), {
        statusCode: 409,
        code: "COPILOT_RESPONSE_NOT_ACKNOWLEDGEABLE",
      });
    }

    if (
      pending.expiresAt.getTime() <= Date.now() ||
      reservation.expiresAt.getTime() <= Date.now()
    ) {
      throw Object.assign(new Error("Copilot response acknowledgement expired."), {
        statusCode: 409,
        code: "COPILOT_RESPONSE_ACK_EXPIRED",
      });
    }

    const assistant = await tx.aiMessage.create({
      data: {
        conversationId: pending.conversationId,
        role: "ASSISTANT",
        content: pending.content,
        provider: pending.provider,
        model: pending.model,
        metadata: {
          upstreamResponseId: pending.upstreamResponseId,
          creditReservationId: reservation.id,
          creditQuoteHash: reservation.quoteHash,
          deliveryAcknowledged: true,
          mcpInvocations: pending.mcpInvocations ?? [],
        },
      },
    });

    const credit = await settleMessageCreditsInTransaction(tx, {
      userId: input.userId,
      reservationId: reservation.id,
      conversationId: pending.conversationId,
      aiMessageId: assistant.id,
      requestId: input.requestId,
      mcpInvocations: pending.mcpInvocations ?? [],
    });

    await tx.pwrcPendingResponse.update({
      where: { id: pending.id },
      data: {
        status: "ACKNOWLEDGED",
        acknowledgedAt: new Date(),
        aiMessageId: assistant.id,
      },
    });

    await tx.auditEvent.create({
      data: {
        userId: input.userId,
        action: "ai.response.acknowledged_and_settled",
        resourceType: "conversation",
        resourceId: pending.conversationId,
        requestId: input.requestId,
        metadata: {
          messageId: assistant.id,
          provider: pending.provider,
          model: pending.model,
          pwrcMessageReceiptId: credit.receipt.id,
          pwrcDebitBaseUnits: credit.receipt.debitBaseUnits,
          pwrcDebit: credit.receipt.debitPwrc,
          referenceUsd: credit.receipt.referenceUsd,
        },
      },
    });

    return {
      replay: false,
      conversationId: pending.conversationId,
      messageId: assistant.id,
      content: assistant.content,
      model: pending.model,
      creditReceipt: credit.receipt,
      creditAccount: credit.account,
    };
  });
}

export async function expirePendingResponses() {
  const result = await prisma.pwrcPendingResponse.updateMany({
    where: {
      status: "PENDING",
      expiresAt: { lt: new Date() },
    },
    data: {
      status: "EXPIRED",
      content: "",
      upstreamResponseId: null,
      responseTokenHash: "revoked",
    },
  });
  return result.count;
}
