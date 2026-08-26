import { createHash, randomUUID } from 'node:crypto';

import {
  DEFAULT_TOP_UP_TTL_MS,
  PWRC_FIXED_SUPPLY_BASE_UNITS,
  PWRC_IDENTITY,
} from './constants.ts';
import { assertPositiveBaseUnits, formatPwrcBaseUnits } from './units.ts';
import type { CreditScope, TopUpIntent } from './types.ts';

const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const BASE58_INDEX = new Map([...BASE58_ALPHABET].map((char, index) => [char, index]));

function base58Encode(bytes: Uint8Array): string {
  let value = 0n;
  for (const byte of bytes) value = value * 256n + BigInt(byte);

  let output = '';
  while (value > 0n) {
    const remainder = Number(value % 58n);
    value /= 58n;
    output = BASE58_ALPHABET[remainder] + output;
  }

  for (const byte of bytes) {
    if (byte !== 0) break;
    output = `1${output}`;
  }
  return output || '1';
}

function base58DecodedLength(value: string) {
  if (!value) return 0;
  let number = 0n;
  for (const char of value) {
    const digit = BASE58_INDEX.get(char);
    if (digit === undefined) return -1;
    number = number * 58n + BigInt(digit);
  }
  let bytes = 0;
  while (number > 0n) {
    bytes += 1;
    number >>= 8n;
  }
  let leadingZeros = 0;
  for (const char of value) {
    if (char !== '1') break;
    leadingZeros += 1;
  }
  return Math.max(1, bytes + leadingZeros);
}

function assertSolanaPublicKey(value: string, field: string) {
  const normalized = value.trim();
  if (base58DecodedLength(normalized) !== 32) {
    throw new RangeError(`${field} must be a base58-encoded 32-byte Solana public key.`);
  }
  return normalized;
}

function referenceForTopUp(scope: CreditScope, topUpId: string) {
  const digest = createHash('sha256')
    .update(`powerchain-pwrc-solana-pay-reference:v1\n${scope.organizationId}\n${scope.accountId}\n${scope.userId}\n${topUpId}`, 'utf8')
    .digest();
  return base58Encode(digest);
}

export function createSolanaPayTopUp(input: {
  scope: CreditScope;
  recipient: string;
  amountBaseUnits: string | bigint;
  idempotencyKey?: string;
  now?: Date;
  ttlMs?: number;
}): TopUpIntent {
  const amount = assertPositiveBaseUnits(input.amountBaseUnits);
  if (amount > PWRC_FIXED_SUPPLY_BASE_UNITS) {
    throw new RangeError('PWRC top-up amount cannot exceed the canonical fixed token supply.');
  }
  const recipient = assertSolanaPublicKey(input.recipient, 'PWRC Solana Pay recipient');
  const now = input.now ?? new Date();
  const ttlMs = input.ttlMs ?? DEFAULT_TOP_UP_TTL_MS;
  if (!Number.isSafeInteger(ttlMs) || ttlMs <= 0 || ttlMs > 24 * 60 * 60 * 1_000) {
    throw new RangeError('PWRC Solana Pay top-up TTL must be between 1 ms and 24 hours.');
  }
  const id = randomUUID();
  const reference = referenceForTopUp(input.scope, id);
  const expiresAt = new Date(now.getTime() + ttlMs);
  const params = new URLSearchParams({
    amount: formatPwrcBaseUnits(amount),
    'spl-token': PWRC_IDENTITY.mint,
    reference,
    label: 'PowerChain Copilot',
    message: 'Fund PWRC Copilot credits',
    memo: `pwrc-credit-topup:${id}`,
  });

  return {
    id,
    ...input.scope,
    requestedBaseUnits: amount,
    idempotencyKey: input.idempotencyKey,
    recipient,
    reference,
    solanaPayUri: `solana:${recipient}?${params.toString()}`,
    status: 'pending',
    createdAt: now,
    expiresAt,
  };
}
