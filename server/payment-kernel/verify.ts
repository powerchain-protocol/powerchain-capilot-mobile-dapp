import { createHmac, timingSafeEqual } from 'node:crypto';

import {
  PAYMENT_KERNEL_REPLAY_WINDOW_MS,
  PWRC_IDENTITY,
} from '../credits/constants.ts';
import { assertPositiveBaseUnits } from '../credits/units.ts';
import type { VerifiedPaymentCredit } from '../credits/types.ts';

export class PaymentKernelVerificationError extends Error {
  readonly status = 401;
  readonly code = 'INVALID_PAYMENT_KERNEL_EVENT';

  constructor(message: string) {
    super(message);
    this.name = 'PaymentKernelVerificationError';
  }
}

type PaymentSettledPayload = {
  eventId?: unknown;
  type?: unknown;
  paymentId?: unknown;
  userId?: unknown;
  topUpIntentId?: unknown;
  asset?: unknown;
  mint?: unknown;
  network?: unknown;
  amountBaseUnits?: unknown;
  transactionSignature?: unknown;
  recipient?: unknown;
  reference?: unknown;
  settledAt?: unknown;
  verification?: {
    status?: unknown;
    verificationId?: unknown;
  } | null;
};

function requireString(value: unknown, field: string) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new PaymentKernelVerificationError(`Payment Kernel field ${field} is required.`);
  }
  return value.trim();
}

function signatureBytes(value: string) {
  const normalized = value.startsWith('sha256=') ? value.slice(7) : value;
  if (!/^[a-f0-9]{64}$/i.test(normalized)) {
    throw new PaymentKernelVerificationError('Payment Kernel signature is malformed.');
  }
  return Buffer.from(normalized, 'hex');
}

export function verifyPaymentKernelWebhook(input: {
  rawBody: string;
  signature: string;
  timestamp: string;
  secret: string;
  now?: Date;
  toleranceMs?: number;
}): VerifiedPaymentCredit {
  if (!input.secret) throw new Error('PAYMENT_KERNEL_WEBHOOK_SECRET is not configured.');
  if (!/^\d{10,11}$/.test(input.timestamp)) {
    throw new PaymentKernelVerificationError('Payment Kernel timestamp is invalid.');
  }
  const timestampSeconds = Number(input.timestamp);
  if (!Number.isSafeInteger(timestampSeconds)) {
    throw new PaymentKernelVerificationError('Payment Kernel timestamp is invalid.');
  }

  const now = input.now ?? new Date();
  const nowMs = now.getTime();
  const eventMs = timestampSeconds * 1000;
  const toleranceMs = input.toleranceMs ?? PAYMENT_KERNEL_REPLAY_WINDOW_MS;
  if (!Number.isSafeInteger(toleranceMs) || toleranceMs <= 0 || toleranceMs > 15 * 60 * 1_000) {
    throw new RangeError('Payment Kernel replay tolerance must be between 1 ms and 15 minutes.');
  }
  if (Math.abs(nowMs - eventMs) > toleranceMs) {
    throw new PaymentKernelVerificationError('Payment Kernel webhook timestamp is outside the replay window.');
  }

  const expected = createHmac('sha256', input.secret)
    .update(`${input.timestamp}.${input.rawBody}`, 'utf8')
    .digest();
  const actual = signatureBytes(input.signature);
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    throw new PaymentKernelVerificationError('Payment Kernel webhook signature verification failed.');
  }

  let payload: PaymentSettledPayload;
  try {
    payload = JSON.parse(input.rawBody) as PaymentSettledPayload;
  } catch {
    throw new PaymentKernelVerificationError('Payment Kernel payload is not valid JSON.');
  }

  if (payload.type !== 'payment.settled') {
    throw new PaymentKernelVerificationError('Only verified payment.settled events can fund PWRC credits.');
  }
  if (payload.verification?.status !== 'verified') {
    throw new PaymentKernelVerificationError('Payment Kernel has not marked this settlement verified.');
  }
  if (payload.asset !== 'PWRC') {
    throw new PaymentKernelVerificationError('Payment Kernel asset must be PWRC.');
  }

  const mint = requireString(payload.mint, 'mint');
  const network = requireString(payload.network, 'network');
  if (mint !== PWRC_IDENTITY.mint || network !== PWRC_IDENTITY.network) {
    throw new PaymentKernelVerificationError('Payment Kernel settlement does not match canonical PWRC identity.');
  }

  const amountBaseUnits = assertPositiveBaseUnits(requireString(payload.amountBaseUnits, 'amountBaseUnits'));
  const settledAtRaw = requireString(payload.settledAt, 'settledAt');
  const settledAt = new Date(settledAtRaw);
  if (Number.isNaN(settledAt.getTime())) {
    throw new PaymentKernelVerificationError('Payment Kernel settledAt is invalid.');
  }
  if (settledAt.getTime() > nowMs + toleranceMs) {
    throw new PaymentKernelVerificationError('Payment Kernel settledAt is implausibly far in the future.');
  }

  return {
    eventId: requireString(payload.eventId, 'eventId'),
    paymentId: requireString(payload.paymentId, 'paymentId'),
    userId: requireString(payload.userId, 'userId'),
    topUpIntentId: requireString(payload.topUpIntentId, 'topUpIntentId'),
    amountBaseUnits,
    mint,
    network,
    transactionSignature: requireString(payload.transactionSignature, 'transactionSignature'),
    recipient: requireString(payload.recipient, 'recipient'),
    reference: requireString(payload.reference, 'reference'),
    settledAt,
    verificationId: requireString(payload.verification?.verificationId, 'verification.verificationId'),
  };
}
