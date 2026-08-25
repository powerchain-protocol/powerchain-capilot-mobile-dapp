import type { FastifyInstance } from "fastify";
import bs58 from "bs58";
import { z } from "zod";
import {
  applyPaymentSettledEvent,
  verifyPaymentKernelEnvelope,
} from "../credits/payment-kernel";

const decimalBaseUnits = z
  .string()
  .regex(/^(0|[1-9]\d*)$/)
  .refine((value) => BigInt(value) > 0n, "amountBaseUnits must be positive");

function base58Bytes(length: number, label: string) {
  return z.string().superRefine((value, ctx) => {
    try {
      const bytes = bs58.decode(value);
      if (bytes.length !== length) {
        ctx.addIssue({
          code: "custom",
          message: `${label} must decode to ${length} bytes`,
        });
      }
    } catch {
      ctx.addIssue({
        code: "custom",
        message: `${label} must be valid base58`,
      });
    }
  });
}

const optionalPositiveBaseUnits = z.string().regex(/^(0|[1-9]\d*)$/).optional();

const schema = z.object({
  eventType: z.literal("payment.settled"),
  settlementId: z.string().min(1).max(200),
  reference: base58Bytes(32, "reference"),
  amountBaseUnits: decimalBaseUnits,
  network: z.enum(["devnet", "mainnet-beta"]),
  mint: base58Bytes(32, "mint"),
  recipient: base58Bytes(32, "recipient"),
  transactionSignature: base58Bytes(64, "transactionSignature"),
  grossTransferBaseUnits: optionalPositiveBaseUnits,
  withheldTransferFeeBaseUnits: optionalPositiveBaseUnits,
  recipientNetBaseUnits: optionalPositiveBaseUnits,
}).superRefine((value, ctx) => {
  const evidence = [
    value.grossTransferBaseUnits,
    value.withheldTransferFeeBaseUnits,
    value.recipientNetBaseUnits,
  ];
  const present = evidence.filter((item) => item != null).length;
  if (present !== 0 && present !== 3) {
    ctx.addIssue({
      code: "custom",
      message: "Token transfer evidence must provide gross, withheld fee, and recipient net together",
    });
    return;
  }
  if (present === 3) {
    const gross = BigInt(value.grossTransferBaseUnits!);
    const fee = BigInt(value.withheldTransferFeeBaseUnits!);
    const net = BigInt(value.recipientNetBaseUnits!);
    if (gross !== fee + net) {
      ctx.addIssue({
        code: "custom",
        message: "grossTransferBaseUnits must equal withheldTransferFeeBaseUnits + recipientNetBaseUnits",
      });
    }
  }
});

export async function registerPaymentKernelRoutes(app: FastifyInstance) {
  app.post("/api/v1/internal/payment-kernel/events", async (request, reply) => {
    const payload = schema.parse(request.body);
    const eventId = String(
      request.headers["x-payment-kernel-event-id"] ?? "",
    );
    const timestampRaw = String(
      request.headers["x-payment-kernel-timestamp"] ?? "",
    );
    const signature = String(
      request.headers["x-payment-kernel-signature"] ?? "",
    );
    const timestamp = Number(timestampRaw);

    if (!eventId || eventId.length > 200 || !signature) {
      return reply.code(401).send({
        error: "invalid_payment_kernel_envelope",
      });
    }

    const verification = verifyPaymentKernelEnvelope({
      eventId,
      timestamp,
      payload,
      signature,
    });

    if (!verification.verified) {
      request.log.warn(
        { eventId, reason: verification.reason },
        "Rejected Payment Kernel webhook envelope",
      );
      return reply.code(401).send({
        error: "invalid_payment_kernel_signature",
        reason: verification.reason,
      });
    }

    const result = await applyPaymentSettledEvent({
      eventId,
      signatureTimestamp: timestamp,
      settlementId: payload.settlementId,
      reference: payload.reference,
      amountBaseUnits: payload.amountBaseUnits,
      network: payload.network,
      mint: payload.mint,
      recipient: payload.recipient,
      transactionSignature: payload.transactionSignature,
      grossTransferBaseUnits: payload.grossTransferBaseUnits,
      withheldTransferFeeBaseUnits: payload.withheldTransferFeeBaseUnits,
      recipientNetBaseUnits: payload.recipientNetBaseUnits,
    });

    request.log.info(
      {
        eventId,
        settlementId: payload.settlementId,
        fundingId: result.fundingId,
        replay: result.replay,
        transportReplay: result.transportReplay,
      },
      "Applied verified payment.settled PWRC credit funding",
    );

    return result;
  });
}
