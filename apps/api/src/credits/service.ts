import { prisma } from "../lib/prisma";
import { env } from "../config/env";
import {
  PWRC_BASE_UNITS_PER_TOKEN,
  PWRC_DEMO_GRANT_TOKENS,
  PWRC_MESSAGE_COST_BASE_UNITS,
  PWRC_MESSAGE_REFERENCE_USD_MICROS,
  PWRC_PRICING_VERSION,
  PWRC_REFERENCE_USD_MICROS_PER_TOKEN,
  PWRC_MINT,
  PWRC_NETWORK,
  PWRC_TOKEN_2022_PROGRAM,
} from "./constants";
import { decimalToBigInt, formatPwrcBaseUnits, formatUsdMicros, responseRunway } from "./format";
import { creditId } from "./ids";
import { buildPwrcMessageQuote } from "./pricing";
import { InsufficientPwrcCreditsError } from "./errors";
import {
  assertPwrcBalanceInvariant,
  isPwrcMessageQuoteSnapshot,
  PWRC_BILLING_TRIGGER,
  PWRC_QUOTE_KIND,
  PWRC_QUOTE_SCHEMA_VERSION,
  type PwrcMessageQuoteSnapshot,
} from "@powerchain/pwrc-credits";

// Prisma transaction clients expose the same model delegates used below.
// Keeping this internal type narrow avoids coupling the credit domain to the
// generated client namespace while still preserving transaction boundaries.
type CreditDb = any;

async function ensureAccountInDb(db: CreditDb, userId: string) {
  return db.pwrcCreditAccount.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });
}

export async function ensurePwrcCreditAccount(userId: string) {
  return ensureAccountInDb(prisma, userId);
}

export function accountView(account: any) {
  const available = decimalToBigInt(account.availableBaseUnits);
  const reserved = decimalToBigInt(account.reservedBaseUnits);
  const spent = decimalToBigInt(account.spentBaseUnits);
  const funded = decimalToBigInt(account.fundedBaseUnits);

  assertPwrcBalanceInvariant({
    availableBaseUnits: available,
    reservedBaseUnits: reserved,
    spentBaseUnits: spent,
    fundedBaseUnits: funded,
  });

  return {
    id: account.id,
    availableBaseUnits: available.toString(),
    reservedBaseUnits: reserved.toString(),
    spentBaseUnits: spent.toString(),
    fundedBaseUnits: funded.toString(),
    availablePwrc: formatPwrcBaseUnits(available),
    reservedPwrc: formatPwrcBaseUnits(reserved),
    spentPwrc: formatPwrcBaseUnits(spent),
    fundedPwrc: formatPwrcBaseUnits(funded),
    responseRunway: responseRunway(available),
    lowCredit:
      responseRunway(available) < env.PWRC_LOW_CREDIT_RESPONSES,
    version: account.version,
    updatedAt: account.updatedAt.toISOString(),
  };
}

function quoteFromReservation(reservation: any): PwrcMessageQuoteSnapshot {
  const snapshot = reservation.quoteSnapshot;
  if (isPwrcMessageQuoteSnapshot(snapshot) && snapshot.quoteHash === reservation.quoteHash) {
    return snapshot;
  }

  const current = buildPwrcMessageQuote();
  if (current.quoteHash !== reservation.quoteHash) {
    throw Object.assign(
      new Error("PWRC reservation quote snapshot is missing or incompatible."),
      { statusCode: 409, code: "PWRC_QUOTE_SNAPSHOT_MISMATCH" },
    );
  }
  return current;
}

export async function getPwrcCreditAccountView(userId: string) {
  await releaseExpiredReservations({ userId });
  const account = await ensurePwrcCreditAccount(userId);
  return accountView(account);
}

export async function reserveMessageCredits(input: {
  userId: string;
  conversationId?: string;
  clientRequestId: string;
  requestId: string;
  idempotencyKey: string;
  requestHash: string;
}) {
  if (!env.PWRC_CREDITS_ENABLED) {
    throw Object.assign(new Error("PWRC Copilot credits are disabled."), {
      statusCode: 503,
      code: "PWRC_CREDITS_DISABLED",
    });
  }

  await releaseExpiredReservations({ userId: input.userId });
  const quote = buildPwrcMessageQuote();
  const amount = PWRC_MESSAGE_COST_BASE_UNITS;
  const expiresAt = new Date(
    Date.now() + env.PWRC_CREDIT_RESERVATION_TTL_SECONDS * 1000,
  );

  return prisma.$transaction(async (tx) => {
    const account = await ensureAccountInDb(tx, input.userId);

    const existing = await tx.pwrcCreditReservation.findFirst({
      where: {
        userId: input.userId,
        OR: [
          { clientRequestId: input.clientRequestId },
          { idempotencyKey: input.idempotencyKey },
        ],
      },
    });

    if (existing) {
      if (existing.requestHash && existing.requestHash !== input.requestHash) {
        throw Object.assign(
          new Error("Copilot idempotency key was reused for a different request."),
          {
            statusCode: 409,
            code: "COPILOT_IDEMPOTENCY_CONFLICT",
          },
        );
      }

      const currentAccount = await tx.pwrcCreditAccount.findUniqueOrThrow({
        where: { id: account.id },
      });
      return {
        reservation: existing,
        quote:
          existing.status === "RESERVED"
            ? quoteFromReservation(existing)
            : quote,
        account: accountView(currentAccount),
        replay: true,
      };
    }

    const updated = await tx.pwrcCreditAccount.updateMany({
      where: {
        id: account.id,
        availableBaseUnits: { gte: amount.toString() },
      },
      data: {
        availableBaseUnits: { decrement: amount.toString() },
        reservedBaseUnits: { increment: amount.toString() },
        version: { increment: 1 },
      },
    });

    if (updated.count !== 1) {
      const current = await tx.pwrcCreditAccount.findUniqueOrThrow({
        where: { id: account.id },
      });
      const available = decimalToBigInt(current.availableBaseUnits);
      throw new InsufficientPwrcCreditsError({
        availableBaseUnits: available.toString(),
        requiredBaseUnits: amount.toString(),
        responseRunway: responseRunway(available),
      });
    }

    const reservation = await tx.pwrcCreditReservation.create({
      data: {
        id: creditId("pcr"),
        userId: input.userId,
        accountId: account.id,
        conversationId: input.conversationId,
        clientRequestId: input.clientRequestId,
        requestId: input.requestId,
        idempotencyKey: input.idempotencyKey,
        requestHash: input.requestHash,
        quoteHash: quote.quoteHash,
        quoteSnapshot: quote,
        quoteSchemaVersion: quote.quoteSchemaVersion,
        pricingVersion: quote.pricingVersion,
        responseUnits: quote.responseUnits,
        referenceUsdMicros: quote.referenceUsdMicros,
        referencePriceMicros: quote.referenceUsdMicrosPerPwrc,
        network: quote.network,
        mint: quote.mint,
        tokenProgram: quote.tokenProgram,
        amountBaseUnits: amount.toString(),
        expiresAt,
      },
    });

    await tx.pwrcCreditLedgerEntry.create({
      data: {
        id: creditId("pcl"),
        userId: input.userId,
        accountId: account.id,
        entryType: "RESERVE",
        deltaAvailableBaseUnits: (-amount).toString(),
        deltaReservedBaseUnits: amount.toString(),
        reservationId: reservation.id,
        description: "Reserved 10,000 PWRC for one Copilot completed-response unit.",
        metadata: {
          pricingVersion: PWRC_PRICING_VERSION,
          quoteHash: quote.quoteHash,
          clientRequestId: input.clientRequestId,
          requestHash: input.requestHash,
        },
      },
    });

    const current = await tx.pwrcCreditAccount.findUniqueOrThrow({
      where: { id: account.id },
    });

    return {
      reservation,
      quote,
      account: accountView(current),
      replay: false,
    };
  });
}

export async function releaseReservation(
  reservationId: string,
  reason: string,
  status: "RELEASED" | "EXPIRED" = "RELEASED",
) {
  return prisma.$transaction(async (tx) =>
    releaseReservationInTransaction(tx, reservationId, reason, status),
  );
}

export async function releaseReservationInTransaction(
  tx: CreditDb,
  reservationId: string,
  reason: string,
  status: "RELEASED" | "EXPIRED" = "RELEASED",
) {
  const reservation = await tx.pwrcCreditReservation.findUnique({
    where: { id: reservationId },
  });
  if (!reservation) return null;
  if (reservation.status !== "RESERVED") return reservation;

  const claimed = await tx.pwrcCreditReservation.updateMany({
    where: { id: reservation.id, status: "RESERVED" },
    data: {
      status,
      releasedAt: new Date(),
      releaseReason: reason,
    },
  });
  if (claimed.count !== 1) return reservation;

  await tx.pwrcPendingResponse.updateMany({
    where: { reservationId: reservation.id, status: "PENDING" },
    data: {
      status: status === "EXPIRED" ? "EXPIRED" : "CANCELLED",
      content: "",
      upstreamResponseId: null,
      responseTokenHash: "revoked",
    },
  });

  const amount = decimalToBigInt(reservation.amountBaseUnits);

  await tx.pwrcCreditAccount.update({
    where: { id: reservation.accountId },
    data: {
      availableBaseUnits: { increment: amount.toString() },
      reservedBaseUnits: { decrement: amount.toString() },
      version: { increment: 1 },
    },
  });

  await tx.pwrcCreditLedgerEntry.create({
    data: {
      id: creditId("pcl"),
      userId: reservation.userId,
      accountId: reservation.accountId,
      entryType: status === "EXPIRED" ? "EXPIRE" : "RELEASE",
      deltaAvailableBaseUnits: amount.toString(),
      deltaReservedBaseUnits: (-amount).toString(),
      reservationId: reservation.id,
      description:
        status === "EXPIRED"
          ? "Expired Copilot PWRC reservation recovered."
          : "Copilot PWRC reservation released without charge.",
      metadata: { reason },
    },
  });

  return tx.pwrcCreditReservation.findUnique({
    where: { id: reservation.id },
  });
}

export async function settleMessageCreditsInTransaction(
  tx: CreditDb,
  input: {
    userId: string;
    reservationId: string;
    conversationId: string;
    aiMessageId: string;
    requestId: string;
    mcpInvocations?: unknown;
  },
) {
  const reservation = await tx.pwrcCreditReservation.findUniqueOrThrow({
    where: { id: input.reservationId },
  });

  if (reservation.userId !== input.userId) {
    throw new Error("PWRC credit reservation tenant mismatch.");
  }

  const existing = await tx.pwrcMessageReceipt.findUnique({
    where: { reservationId: reservation.id },
  });
  if (existing) {
    const account = await tx.pwrcCreditAccount.findUniqueOrThrow({
      where: { id: reservation.accountId },
    });
    return { receipt: receiptView(existing), account: accountView(account) };
  }

  const claimed = await tx.pwrcCreditReservation.updateMany({
    where: { id: reservation.id, status: "RESERVED" },
    data: { status: "SETTLED", settledAt: new Date() },
  });
  if (claimed.count !== 1) {
    throw new Error(`PWRC reservation ${reservation.id} is not settleable.`);
  }

  const amount = decimalToBigInt(reservation.amountBaseUnits);

  await tx.pwrcCreditAccount.update({
    where: { id: reservation.accountId },
    data: {
      reservedBaseUnits: { decrement: amount.toString() },
      spentBaseUnits: { increment: amount.toString() },
      version: { increment: 1 },
    },
  });

  const receipt = await tx.pwrcMessageReceipt.create({
    data: {
      id: creditId("pmsg"),
      userId: input.userId,
      accountId: reservation.accountId,
      reservationId: reservation.id,
      conversationId: input.conversationId,
      aiMessageId: input.aiMessageId,
      requestId: input.requestId,
      quoteHash: reservation.quoteHash,
      responseUnits: 1,
      debitBaseUnits: amount.toString(),
      referenceUsdMicros: reservation.referenceUsdMicros.toString(),
      referencePriceMicros: reservation.referencePriceMicros.toString(),
      pricingVersion: reservation.pricingVersion,
      quoteSchemaVersion: reservation.quoteSchemaVersion,
      quoteKind: PWRC_QUOTE_KIND,
      billingTrigger: PWRC_BILLING_TRIGGER,
      network: reservation.network,
      mint: reservation.mint,
      tokenProgram: reservation.tokenProgram,
      decimals: 9,
      mcpInvocations: input.mcpInvocations,
    },
  });

  await tx.pwrcCreditLedgerEntry.create({
    data: {
      id: creditId("pcl"),
      userId: input.userId,
      accountId: reservation.accountId,
      entryType: "SETTLE",
      deltaReservedBaseUnits: (-amount).toString(),
      deltaSpentBaseUnits: amount.toString(),
      reservationId: reservation.id,
      messageReceiptId: receipt.id,
      description: "Settled one completed Copilot response for 10,000 PWRC.",
      metadata: {
        pricingVersion: PWRC_PRICING_VERSION,
        quoteHash: reservation.quoteHash,
        referenceUsd: "0.02",
        referencePriceIsLive: false,
      },
    },
  });

  const account = await tx.pwrcCreditAccount.findUniqueOrThrow({
    where: { id: reservation.accountId },
  });

  return { receipt: receiptView(receipt), account: accountView(account) };
}

export function receiptView(receipt: any) {
  const debit = decimalToBigInt(receipt.debitBaseUnits);
  const referenceUsdMicros = decimalToBigInt(receipt.referenceUsdMicros);
  const referencePriceMicros = decimalToBigInt(receipt.referencePriceMicros);
  return {
    id: receipt.id,
    quoteSchemaVersion: receipt.quoteSchemaVersion ?? PWRC_QUOTE_SCHEMA_VERSION,
    quoteKind: receipt.quoteKind ?? PWRC_QUOTE_KIND,
    billingTrigger: receipt.billingTrigger ?? PWRC_BILLING_TRIGGER,
    asset: "PWRC" as const,
    network: receipt.network ?? PWRC_NETWORK,
    mint: receipt.mint ?? PWRC_MINT,
    tokenProgram: receipt.tokenProgram ?? PWRC_TOKEN_2022_PROGRAM,
    decimals: 9 as const,
    messageUnit: 1 as const,
    quoteHash: receipt.quoteHash,
    debitBaseUnits: debit.toString(),
    debitPwrc: formatPwrcBaseUnits(debit),
    referenceUsd: formatUsdMicros(referenceUsdMicros),
    referenceUsdMicros: referenceUsdMicros.toString(),
    referencePriceUsdPerPwrc: formatUsdMicros(referencePriceMicros),
    referencePriceIsLive: false as const,
    pricingVersion: receipt.pricingVersion,
    mcpInvocations: Array.isArray(receipt.mcpInvocations) ? receipt.mcpInvocations : [],
    createdAt: receipt.createdAt.toISOString(),
  };
}

export async function releaseExpiredReservations(input: {
  userId?: string;
} = {}) {
  const expired = await prisma.pwrcCreditReservation.findMany({
    where: {
      status: "RESERVED",
      expiresAt: { lt: new Date() },
      ...(input.userId ? { userId: input.userId } : {}),
    },
    select: { id: true },
    take: 200,
  });

  let released = 0;
  for (const item of expired) {
    const result = await releaseReservation(
      item.id,
      "reservation_expired",
      "EXPIRED",
    );
    if (result?.status === "EXPIRED") released += 1;
  }
  return released;
}

export async function grantDemoCredits(userId: string) {
  if (!env.PWRC_DEMO_GRANT_ENABLED || env.NODE_ENV === "production") {
    throw Object.assign(new Error("PWRC demo grants are disabled."), {
      statusCode: 403,
      code: "PWRC_DEMO_GRANT_DISABLED",
    });
  }

  const amount = PWRC_DEMO_GRANT_TOKENS * PWRC_BASE_UNITS_PER_TOKEN;

  try {
    return await prisma.$transaction(async (tx) => {
      const account = await ensureAccountInDb(tx, userId);
      const prior = await tx.pwrcCreditLedgerEntry.findFirst({
        where: { userId, entryType: "DEMO_GRANT" },
      });
      if (prior) {
        const current = await tx.pwrcCreditAccount.findUniqueOrThrow({
          where: { id: account.id },
        });
        return { granted: false, account: accountView(current) };
      }

      // A partial unique index on DEMO_GRANT/userId is the final concurrency
      // guard. If a second request races this transaction, its entire balance
      // increment is rolled back when the unique ledger insert loses.
      const updated = await tx.pwrcCreditAccount.update({
        where: { id: account.id },
        data: {
          availableBaseUnits: { increment: amount.toString() },
          fundedBaseUnits: { increment: amount.toString() },
          version: { increment: 1 },
        },
      });

      await tx.pwrcCreditLedgerEntry.create({
        data: {
          id: creditId("pcl"),
          userId,
          accountId: account.id,
          entryType: "DEMO_GRANT",
          deltaAvailableBaseUnits: amount.toString(),
          deltaFundedBaseUnits: amount.toString(),
          description:
            "Demo grant: 1,000,000 sample PWRC credits (100 completed responses).",
          metadata: { sampleCredits: true, responseUnits: 100 },
        },
      });

      return { granted: true, account: accountView(updated) };
    });
  } catch (error) {
    if ((error as { code?: string }).code !== "P2002") throw error;
    const account = await ensurePwrcCreditAccount(userId);
    return { granted: false, account: accountView(account) };
  }
}

export async function getCreditLedger(userId: string, limit = 50) {
  const items = await prisma.pwrcCreditLedgerEntry.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: Math.min(Math.max(limit, 1), 100),
  });

  return items.map((entry) => ({
    id: entry.id,
    entryType: entry.entryType,
    deltaAvailableBaseUnits: decimalToBigInt(entry.deltaAvailableBaseUnits).toString(),
    deltaReservedBaseUnits: decimalToBigInt(entry.deltaReservedBaseUnits).toString(),
    deltaSpentBaseUnits: decimalToBigInt(entry.deltaSpentBaseUnits).toString(),
    deltaFundedBaseUnits: decimalToBigInt(entry.deltaFundedBaseUnits).toString(),
    reservationId: entry.reservationId,
    messageReceiptId: entry.messageReceiptId,
    paymentSettlementId: entry.paymentSettlementId,
    description: entry.description,
    metadata: entry.metadata,
    createdAt: entry.createdAt.toISOString(),
  }));
}

export async function getFundingHistory(userId: string, limit = 50) {
  const items = await prisma.pwrcCreditFunding.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: Math.min(Math.max(limit, 1), 100),
  });
  return items.map((item) => ({
    id: item.id,
    paymentSettlementId: item.paymentSettlementId,
    paymentReference: item.paymentReference,
    transactionSignature: item.transactionSignature,
    amountBaseUnits: decimalToBigInt(item.amountBaseUnits).toString(),
    amountPwrc: formatPwrcBaseUnits(decimalToBigInt(item.amountBaseUnits)),
    recipient: item.recipient,
    pricingVersion: item.pricingVersion,
    messageQuoteHash: item.messageQuoteHash,
    grossTransferBaseUnits: item.grossTransferBaseUnits == null ? null : decimalToBigInt(item.grossTransferBaseUnits).toString(),
    withheldTransferFeeBaseUnits: item.withheldTransferFeeBaseUnits == null ? null : decimalToBigInt(item.withheldTransferFeeBaseUnits).toString(),
    recipientNetBaseUnits: item.recipientNetBaseUnits == null ? null : decimalToBigInt(item.recipientNetBaseUnits).toString(),
    network: item.network,
    mint: item.mint,
    createdAt: item.createdAt.toISOString(),
  }));
}

export async function getMessageReceipt(userId: string, receiptId: string) {
  const receipt = await prisma.pwrcMessageReceipt.findFirst({
    where: { id: receiptId, userId },
  });
  return receipt ? receiptView(receipt) : null;
}

export async function getPwrcCreditReconciliation(userId: string) {
  await releaseExpiredReservations({ userId });
  const account = await ensurePwrcCreditAccount(userId);

  const [ledger, activeReservations, receipts, settleLedger, fundingRows, fundingLedger, settledReservations] =
    await Promise.all([
      prisma.pwrcCreditLedgerEntry.aggregate({
        where: { accountId: account.id },
        _sum: {
          deltaAvailableBaseUnits: true,
          deltaReservedBaseUnits: true,
          deltaSpentBaseUnits: true,
          deltaFundedBaseUnits: true,
        },
      }),
      prisma.pwrcCreditReservation.aggregate({
        where: { accountId: account.id, status: "RESERVED" },
        _sum: { amountBaseUnits: true },
        _count: { _all: true },
      }),
      prisma.pwrcMessageReceipt.aggregate({
        where: { accountId: account.id },
        _sum: { debitBaseUnits: true },
        _count: { _all: true },
      }),
      prisma.pwrcCreditLedgerEntry.aggregate({
        where: { accountId: account.id, entryType: "SETTLE" },
        _sum: { deltaSpentBaseUnits: true },
        _count: { _all: true },
      }),
      prisma.pwrcCreditFunding.aggregate({
        where: { accountId: account.id },
        _sum: { amountBaseUnits: true },
        _count: { _all: true },
      }),
      prisma.pwrcCreditLedgerEntry.aggregate({
        where: { accountId: account.id, entryType: "FUNDING" },
        _sum: { deltaFundedBaseUnits: true },
        _count: { _all: true },
      }),
      prisma.pwrcCreditReservation.count({
        where: { accountId: account.id, status: "SETTLED" },
      }),
    ]);

  const actual = {
    available: decimalToBigInt(account.availableBaseUnits),
    reserved: decimalToBigInt(account.reservedBaseUnits),
    spent: decimalToBigInt(account.spentBaseUnits),
    funded: decimalToBigInt(account.fundedBaseUnits),
  };
  const expected = {
    available: decimalToBigInt(ledger._sum.deltaAvailableBaseUnits ?? 0),
    reserved: decimalToBigInt(ledger._sum.deltaReservedBaseUnits ?? 0),
    spent: decimalToBigInt(ledger._sum.deltaSpentBaseUnits ?? 0),
    funded: decimalToBigInt(ledger._sum.deltaFundedBaseUnits ?? 0),
  };
  const reservationTotal = decimalToBigInt(
    activeReservations._sum.amountBaseUnits ?? 0,
  );
  const receiptDebit = decimalToBigInt(receipts._sum.debitBaseUnits ?? 0);
  const settleLedgerDebit = decimalToBigInt(
    settleLedger._sum.deltaSpentBaseUnits ?? 0,
  );
  const fundingTotal = decimalToBigInt(fundingRows._sum.amountBaseUnits ?? 0);
  const fundingLedgerTotal = decimalToBigInt(
    fundingLedger._sum.deltaFundedBaseUnits ?? 0,
  );

  const checks = {
    availableMatchesLedger: actual.available === expected.available,
    reservedMatchesLedger: actual.reserved === expected.reserved,
    spentMatchesLedger: actual.spent === expected.spent,
    fundedMatchesLedger: actual.funded === expected.funded,
    activeReservationsMatchReserved: actual.reserved === reservationTotal,
    conservation:
      actual.funded ===
      actual.available + actual.reserved + actual.spent,
    receiptsMatchSpent: receiptDebit === actual.spent,
    settleLedgerMatchesReceipts:
      settleLedgerDebit === receiptDebit &&
      settleLedger._count._all === receipts._count._all,
    settledReservationsMatchReceipts:
      settledReservations === receipts._count._all,
    fundingRowsMatchFundingLedger:
      fundingTotal === fundingLedgerTotal &&
      fundingRows._count._all === fundingLedger._count._all,
  };

  return {
    status: Object.values(checks).every(Boolean) ? "balanced" : "exception",
    checks,
    account: accountView(account),
    ledgerExpectedBaseUnits: Object.fromEntries(
      Object.entries(expected).map(([key, value]) => [key, value.toString()]),
    ),
    activeReservations: activeReservations._count._all,
    activeReservationBaseUnits: reservationTotal.toString(),
    receiptCount: receipts._count._all,
    receiptDebitBaseUnits: receiptDebit.toString(),
    settledReservationCount: settledReservations,
    fundingCount: fundingRows._count._all,
    fundingBaseUnits: fundingTotal.toString(),
    fundingLedgerBaseUnits: fundingLedgerTotal.toString(),
    checkedAt: new Date().toISOString(),
  };
}
