import {
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
import bs58 from "bs58";
import {
  assertSettlementReplayCompatible,
  parseBaseUnitString,
  type VerifiedPwrcSettlement,
} from "@powerchain/pwrc-credits";
import { prisma } from "../lib/prisma";
import { env } from "../config/env";
import { creditId } from "./ids";
import {
  PWRC_BASE_UNITS_PER_TOKEN,
  PWRC_FUNDING_PRESETS,
} from "./constants";
import { accountView } from "./service";
import { buildPwrcMessageQuote } from "./pricing";
import { decimalToBigInt, formatPwrcBaseUnits } from "./format";

function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, item]) => `${JSON.stringify(key)}:${stable(item)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

export function paymentKernelPayloadHash(payload: unknown) {
  return createHash("sha256").update(stable(payload)).digest("hex");
}

function settlementEvidence(input: {
  settlementId: string;
  reference: string;
  amountBaseUnits: string;
  network: string;
  mint: string;
  recipient: string;
  transactionSignature: string;
  grossTransferBaseUnits?: string | null;
  withheldTransferFeeBaseUnits?: string | null;
  recipientNetBaseUnits?: string | null;
}): VerifiedPwrcSettlement {
  return {
    settlementId: input.settlementId,
    reference: input.reference,
    amountBaseUnits: input.amountBaseUnits,
    network: input.network,
    mint: input.mint,
    recipient: input.recipient,
    transactionSignature: input.transactionSignature,
    grossTransferBaseUnits: input.grossTransferBaseUnits ?? null,
    withheldTransferFeeBaseUnits: input.withheldTransferFeeBaseUnits ?? null,
    recipientNetBaseUnits: input.recipientNetBaseUnits ?? null,
  };
}

function signingInput(input: {
  eventId: string;
  timestamp: number;
  payload: unknown;
}) {
  return `${input.timestamp}.${input.eventId}.${stable(input.payload)}`;
}

export function signPaymentKernelPayload(input: {
  eventId: string;
  timestamp: number;
  payload: unknown;
}) {
  if (!env.PAYMENT_KERNEL_WEBHOOK_SECRET) {
    throw new Error("PAYMENT_KERNEL_WEBHOOK_SECRET is not configured.");
  }
  return createHmac("sha256", env.PAYMENT_KERNEL_WEBHOOK_SECRET)
    .update(signingInput(input))
    .digest("hex");
}

export function verifyPaymentKernelEnvelope(input: {
  eventId: string;
  timestamp: number;
  payload: unknown;
  signature: string;
}) {
  if (!Number.isSafeInteger(input.timestamp) || input.timestamp <= 0) {
    return { verified: false as const, reason: "invalid_timestamp" };
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  const skew = Math.abs(nowSeconds - input.timestamp);
  if (skew > env.PAYMENT_KERNEL_WEBHOOK_MAX_SKEW_SECONDS) {
    return { verified: false as const, reason: "timestamp_outside_window" };
  }

  if (!/^[a-f0-9]{64}$/i.test(input.signature)) {
    return { verified: false as const, reason: "invalid_signature_encoding" };
  }

  const expected = signPaymentKernelPayload({
    eventId: input.eventId,
    timestamp: input.timestamp,
    payload: input.payload,
  });
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(input.signature, "hex");
  const verified = a.length === b.length && timingSafeEqual(a, b);
  return verified
    ? { verified: true as const, reason: null }
    : { verified: false as const, reason: "signature_mismatch" };
}

function solanaPayUrl(input: {
  recipient: string;
  mint: string;
  reference: string;
  responses: number;
  amountPwrc: string;
  intentId: string;
}) {
  const params = new URLSearchParams({
    amount: input.amountPwrc,
    "spl-token": input.mint,
    reference: input.reference,
    label: "PowerChain Copilot",
    message: `${input.responses} Copilot responses / ${input.amountPwrc} PWRC`,
    memo: `PowerChain Copilot credits ${input.intentId}`,
  });
  return `solana:${input.recipient}?${params.toString()}`;
}

function topupView(intent: any) {
  const amount = decimalToBigInt(intent.amountBaseUnits);
  return {
    id: intent.id,
    reference: intent.reference,
    idempotencyKey: intent.idempotencyKey,
    settlementId: intent.settlementId,
    responses: intent.responseUnits,
    amountPwrc: formatPwrcBaseUnits(amount),
    amountBaseUnits: amount.toString(),
    pricingVersion: intent.pricingVersion,
    messageQuoteHash: intent.messageQuoteHash,
    network: intent.network,
    mint: intent.mint,
    recipient: intent.recipient,
    status: intent.status,
    expiresAt: intent.expiresAt.toISOString(),
    settledAt: intent.settledAt?.toISOString() ?? null,
    solanaPayUrl:
      intent.status === "PENDING" && intent.expiresAt.getTime() > Date.now()
        ? solanaPayUrl({
            recipient: intent.recipient,
            mint: intent.mint,
            reference: intent.reference,
            responses: intent.responseUnits,
            amountPwrc: formatPwrcBaseUnits(amount),
            intentId: intent.id,
          })
        : null,
  };
}

export async function createTopupIntent(input: {
  userId: string;
  responses: number;
  idempotencyKey: string;
}) {
  if (!env.PWRC_TOPUPS_ENABLED) {
    throw Object.assign(new Error("PWRC Solana Pay top-ups are disabled."), {
      statusCode: 503,
      code: "PWRC_TOPUPS_DISABLED",
    });
  }
  if (!env.PWRC_TREASURY_ADDRESS) {
    throw Object.assign(new Error("PWRC treasury recipient is not configured."), {
      statusCode: 503,
      code: "PWRC_TREASURY_NOT_CONFIGURED",
    });
  }
  if (!env.PAYMENT_KERNEL_WEBHOOK_SECRET) {
    throw Object.assign(new Error("Payment Kernel verification is not configured."), {
      statusCode: 503,
      code: "PAYMENT_KERNEL_NOT_CONFIGURED",
    });
  }

  const preset = PWRC_FUNDING_PRESETS.find(
    (item) => item.responses === input.responses,
  );
  if (!preset) {
    throw Object.assign(new Error("Unsupported PWRC funding preset."), {
      statusCode: 400,
      code: "INVALID_PWRC_TOPUP_PRESET",
    });
  }

  const existing = await prisma.pwrcTopupIntent.findUnique({
    where: {
      userId_idempotencyKey: {
        userId: input.userId,
        idempotencyKey: input.idempotencyKey,
      },
    },
  });
  if (existing) {
    if (existing.responseUnits !== input.responses) {
      throw Object.assign(
        new Error("PWRC top-up idempotency key was reused for a different preset."),
        {
          statusCode: 409,
          code: "PWRC_TOPUP_IDEMPOTENCY_CONFLICT",
        },
      );
    }
    return { ...topupView(existing), replay: true };
  }

  const account = await prisma.pwrcCreditAccount.upsert({
    where: { userId: input.userId },
    update: {},
    create: { userId: input.userId },
  });
  const amountBaseUnits = preset.pwrc * PWRC_BASE_UNITS_PER_TOKEN;
  const messageQuote = buildPwrcMessageQuote();
  const reference = bs58.encode(randomBytes(32));
  const expiresAt = new Date(
    Date.now() + env.PWRC_TOPUP_TTL_MINUTES * 60 * 1000,
  );

  try {
    const intent = await prisma.pwrcTopupIntent.create({
      data: {
        id: creditId("ptop"),
        userId: input.userId,
        accountId: account.id,
        reference,
        idempotencyKey: input.idempotencyKey,
        amountBaseUnits: amountBaseUnits.toString(),
        responseUnits: preset.responses,
        pricingVersion: messageQuote.pricingVersion,
        messageQuoteHash: messageQuote.quoteHash,
        network: env.PWRC_CREDIT_NETWORK,
        mint: env.PWRC_MINT,
        recipient: env.PWRC_TREASURY_ADDRESS,
        expiresAt,
      },
    });
    return { ...topupView(intent), replay: false };
  } catch (error) {
    if ((error as { code?: string }).code !== "P2002") throw error;
    const replay = await prisma.pwrcTopupIntent.findUniqueOrThrow({
      where: {
        userId_idempotencyKey: {
          userId: input.userId,
          idempotencyKey: input.idempotencyKey,
        },
      },
    });
    return { ...topupView(replay), replay: true };
  }
}

export async function listTopupIntents(userId: string, limit = 20) {
  await expireTopupIntents();
  const items = await prisma.pwrcTopupIntent.findMany({
    where: { userId },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: Math.min(Math.max(limit, 1), 100),
  });
  return items.map(topupView);
}

export async function expireTopupIntents() {
  const result = await prisma.pwrcTopupIntent.updateMany({
    where: {
      status: "PENDING",
      expiresAt: { lt: new Date() },
    },
    data: { status: "EXPIRED" },
  });
  return result.count;
}

export async function applyPaymentSettledEvent(input: {
  eventId: string;
  signatureTimestamp: number;
  settlementId: string;
  reference: string;
  amountBaseUnits: string;
  network: string;
  mint: string;
  recipient: string;
  transactionSignature: string;
  grossTransferBaseUnits?: string;
  withheldTransferFeeBaseUnits?: string;
  recipientNetBaseUnits?: string;
}) {
  const payload = {
    eventType: "payment.settled" as const,
    settlementId: input.settlementId,
    reference: input.reference,
    amountBaseUnits: input.amountBaseUnits,
    network: input.network,
    mint: input.mint,
    recipient: input.recipient,
    transactionSignature: input.transactionSignature,
    grossTransferBaseUnits: input.grossTransferBaseUnits ?? null,
    withheldTransferFeeBaseUnits: input.withheldTransferFeeBaseUnits ?? null,
    recipientNetBaseUnits: input.recipientNetBaseUnits ?? null,
  };
  const payloadHash = paymentKernelPayloadHash(payload);

  const priorEvent = await prisma.pwrcPaymentKernelEvent.findUnique({
    where: { id: input.eventId },
  });
  if (priorEvent) {
    if (
      priorEvent.payloadHash !== payloadHash ||
      priorEvent.settlementId !== input.settlementId
    ) {
      throw Object.assign(
        new Error("Payment Kernel event ID was reused with different content."),
        {
          statusCode: 409,
          code: "PAYMENT_KERNEL_EVENT_ID_CONFLICT",
        },
      );
    }

    const accountFunding = await prisma.pwrcCreditFunding.findUnique({
      where: { paymentSettlementId: priorEvent.settlementId },
    });
    if (!accountFunding) {
      throw Object.assign(new Error("Payment Kernel replay record has no funding record."), {
        statusCode: 409,
        code: "PAYMENT_KERNEL_REPLAY_INCONSISTENT",
      });
    }
    const account = await prisma.pwrcCreditAccount.findUniqueOrThrow({
      where: { id: accountFunding.accountId },
    });
    return {
      replay: true,
      transportReplay: true,
      account: accountView(account),
      fundingId: accountFunding.id,
    };
  }

  try {
    return await prisma.$transaction(async (tx) => {
      const prior = await tx.pwrcCreditFunding.findUnique({
        where: { paymentSettlementId: input.settlementId },
        include: { topupIntent: true },
      });
      if (prior) {
        const priorAmount = decimalToBigInt(prior.amountBaseUnits).toString();
        try {
          assertSettlementReplayCompatible(
            settlementEvidence({
              settlementId: prior.paymentSettlementId,
              reference: prior.paymentReference ?? "",
              amountBaseUnits: priorAmount,
              network: prior.network,
              mint: prior.mint,
              recipient: prior.recipient || prior.topupIntent?.recipient || "",
              transactionSignature: prior.transactionSignature ?? "",
              grossTransferBaseUnits: prior.grossTransferBaseUnits?.toString() ?? null,
              withheldTransferFeeBaseUnits: prior.withheldTransferFeeBaseUnits?.toString() ?? null,
              recipientNetBaseUnits: prior.recipientNetBaseUnits?.toString() ?? null,
            }),
            settlementEvidence(input),
          );
        } catch {
          throw Object.assign(
            new Error("Payment settlement ID was reused with different content."),
            {
              statusCode: 409,
              code: "PAYMENT_SETTLEMENT_ID_CONFLICT",
            },
          );
        }

        const account = await tx.pwrcCreditAccount.findUniqueOrThrow({
          where: { id: prior.accountId },
        });
        await tx.pwrcPaymentKernelEvent.create({
          data: {
            id: input.eventId,
            settlementId: input.settlementId,
            eventType: "payment.settled",
            payloadHash,
            signatureTimestamp: new Date(input.signatureTimestamp * 1000),
            fundingId: prior.id,
          },
        });
        return {
          replay: true,
          transportReplay: false,
          account: accountView(account),
          fundingId: prior.id,
        };
      }

      const intent = await tx.pwrcTopupIntent.findUnique({
        where: { reference: input.reference },
      });
      if (!intent) {
        throw Object.assign(new Error("Unknown PWRC top-up reference."), {
          statusCode: 404,
          code: "PWRC_TOPUP_REFERENCE_NOT_FOUND",
        });
      }

      const expectedAmount = decimalToBigInt(intent.amountBaseUnits).toString();
      if (
        input.amountBaseUnits !== expectedAmount ||
        input.network !== intent.network ||
        input.mint !== intent.mint ||
        input.recipient !== intent.recipient
      ) {
        throw Object.assign(new Error("Payment settlement does not match PWRC top-up intent."), {
          statusCode: 409,
          code: "PWRC_TOPUP_SETTLEMENT_MISMATCH",
        });
      }

      if (intent.expiresAt.getTime() <= Date.now()) {
        await tx.pwrcTopupIntent.updateMany({
          where: { id: intent.id, status: "PENDING" },
          data: { status: "EXPIRED" },
        });
        throw Object.assign(new Error("PWRC top-up intent expired."), {
          statusCode: 409,
          code: "PWRC_TOPUP_EXPIRED",
        });
      }

      // Atomic claim is deliberately performed before any balance mutation.
      // PostgreSQL re-checks the PENDING predicate after a competing row lock,
      // preventing two settlement IDs from funding the same top-up intent.
      const claimed = await tx.pwrcTopupIntent.updateMany({
        where: {
          id: intent.id,
          status: "PENDING",
          expiresAt: { gt: new Date() },
        },
        data: {
          status: "SETTLED",
          settlementId: input.settlementId,
          settledAt: new Date(),
        },
      });

      if (claimed.count !== 1) {
        const current = await tx.pwrcTopupIntent.findUniqueOrThrow({
          where: { id: intent.id },
        });
        if (current.settlementId === input.settlementId) {
          const existingFunding = await tx.pwrcCreditFunding.findUnique({
            where: { paymentSettlementId: input.settlementId },
          });
          if (existingFunding) {
            const account = await tx.pwrcCreditAccount.findUniqueOrThrow({
              where: { id: existingFunding.accountId },
            });
            await tx.pwrcPaymentKernelEvent.create({
              data: {
                id: input.eventId,
                settlementId: input.settlementId,
                eventType: "payment.settled",
                payloadHash,
                signatureTimestamp: new Date(input.signatureTimestamp * 1000),
                fundingId: existingFunding.id,
              },
            });
            return {
              replay: true,
              transportReplay: false,
              account: accountView(account),
              fundingId: existingFunding.id,
            };
          }
        }
        throw Object.assign(new Error("PWRC top-up intent has already been claimed."), {
          statusCode: 409,
          code: "PWRC_TOPUP_ALREADY_CLAIMED",
        });
      }

      const amount = parseBaseUnitString(input.amountBaseUnits);
      const updated = await tx.pwrcCreditAccount.update({
        where: { id: intent.accountId },
        data: {
          availableBaseUnits: { increment: amount.toString() },
          fundedBaseUnits: { increment: amount.toString() },
          version: { increment: 1 },
        },
      });

      const funding = await tx.pwrcCreditFunding.create({
        data: {
          id: creditId("pfund"),
          userId: intent.userId,
          accountId: intent.accountId,
          topupIntentId: intent.id,
          paymentSettlementId: input.settlementId,
          paymentReference: input.reference,
          transactionSignature: input.transactionSignature,
          recipient: input.recipient,
          pricingVersion: intent.pricingVersion,
          messageQuoteHash: intent.messageQuoteHash,
          grossTransferBaseUnits: input.grossTransferBaseUnits,
          withheldTransferFeeBaseUnits: input.withheldTransferFeeBaseUnits,
          recipientNetBaseUnits: input.recipientNetBaseUnits,
          amountBaseUnits: amount.toString(),
          network: input.network,
          mint: input.mint,
        },
      });

      await tx.pwrcCreditLedgerEntry.create({
        data: {
          id: creditId("pcl"),
          userId: intent.userId,
          accountId: intent.accountId,
          entryType: "FUNDING",
          deltaAvailableBaseUnits: amount.toString(),
          deltaFundedBaseUnits: amount.toString(),
          paymentSettlementId: input.settlementId,
          description: `PWRC funding settled: ${formatPwrcBaseUnits(amount)} PWRC.`,
          metadata: {
            topupIntentId: intent.id,
            reference: input.reference,
            transactionSignature: input.transactionSignature,
            verifiedBy: "payment-kernel",
            eventType: "payment.settled",
            eventId: input.eventId,
            payloadHash,
          },
        },
      });

      await tx.pwrcPaymentKernelEvent.create({
        data: {
          id: input.eventId,
          settlementId: input.settlementId,
          eventType: "payment.settled",
          payloadHash,
          signatureTimestamp: new Date(input.signatureTimestamp * 1000),
          fundingId: funding.id,
        },
      });

      return {
        replay: false,
        transportReplay: false,
        account: accountView(updated),
        fundingId: funding.id,
      };
    });
  } catch (error) {
    if ((error as { code?: string }).code !== "P2002") throw error;

    const duplicateTransaction = await prisma.pwrcCreditFunding.findFirst({
      where: { transactionSignature: input.transactionSignature },
    });
    if (duplicateTransaction && duplicateTransaction.paymentSettlementId !== input.settlementId) {
      throw Object.assign(
        new Error("The verified Solana transaction signature has already funded PWRC credits."),
        {
          statusCode: 409,
          code: "PAYMENT_TRANSACTION_ALREADY_USED",
        },
      );
    }

    const event = await prisma.pwrcPaymentKernelEvent.findUnique({
      where: { id: input.eventId },
    });
    if (!event) throw error;
    if (
      event.payloadHash !== payloadHash ||
      event.settlementId !== input.settlementId
    ) {
      throw Object.assign(
        new Error("Payment Kernel event ID conflict after concurrent delivery."),
        {
          statusCode: 409,
          code: "PAYMENT_KERNEL_EVENT_ID_CONFLICT",
        },
      );
    }
    const funding = await prisma.pwrcCreditFunding.findUniqueOrThrow({
      where: { paymentSettlementId: event.settlementId },
    });
    const account = await prisma.pwrcCreditAccount.findUniqueOrThrow({
      where: { id: funding.accountId },
    });
    return {
      replay: true,
      transportReplay: true,
      account: accountView(account),
      fundingId: funding.id,
    };
  }
}
