import { existsSync, readFileSync } from 'node:fs';

const required = [
  'server/credits/constants.ts',
  'server/credits/units.ts',
  'server/credits/quote.ts',
  'server/credits/receipt.ts',
  'server/credits/service.ts',
  'server/credits/postgres-store.ts',
  'server/payment-kernel/verify.ts',
  'server/copilot/credits-grounding.ts',
  'server/api/credits-handler.ts',
  'server/db/migrations/001_pwrc_credits.sql',
  'server/db/migrations/002_pwrc_credit_hardening.sql',
  'server/db/migrations/003_pwrc_quote_delivery_receipts.sql',
  'server/db/migrations/004_pwrc_authoritative_billing_lifecycle.sql',
  'prisma/migrations/20260826114500_pwrc_message_units/migration.sql',
  'docs/PWRC_COPILOT_CREDITS.md',
  'server/credits/signing.ts',
  'server/credits/anchor-worker.ts',
  'apps/mobile/app/(tabs)/credits.tsx',
  'apps/mobile/constants/prompts.ts',
];
for (const path of required) if (!existsSync(path)) throw new Error(`Missing PWRC credit implementation file: ${path}`);

const constants = readFileSync('server/credits/constants.ts', 'utf8');
for (const needle of ['PWRC_DECIMALS = 9', 'COPILOT_RESPONSE_COST_PWRC = 10_000n', 'DEMO_GRANT_PWRC = 1_000_000n', 'PWRCRXXZxbg6FdQZfK3PMD7KP8xfxs9acvifJiG46wc', 'PWRC_REFERENCE_PRICE_MICRO_USD_PER_TOKEN = 2n', "COPILOT_MESSAGE_UNIT = 'MSG UNIT'"]) {
  if (!constants.includes(needle)) throw new Error(`Missing PWRC constant invariant: ${needle}`);
}
const migration = readFileSync('server/db/migrations/001_pwrc_credits.sql', 'utf8');
for (const needle of ['numeric(39,0)', 'pwrc_credit_ledger', 'reject_pwrc_credit_ledger_mutation', 'funded_base_units = available_base_units + reserved_base_units + spent_base_units']) {
  if (!migration.includes(needle)) throw new Error(`Missing database invariant: ${needle}`);
}
const api = readFileSync('server/api/credits-handler.ts', 'utf8');
for (const needle of ['/api/v1/credits/pricing', '/api/v1/credits/account', '/api/v1/credits/ledger', '/api/v1/credits/top-ups/solana-pay', 'demoGrantIsSample: true', "topUpCreditEvent: 'payment.settled'", 'referenceEconomics', 'fundingPresets', 'unmeteredReads']) {
  if (!api.includes(needle)) throw new Error(`Missing credit API invariant: ${needle}`);
}
const service = readFileSync('server/credits/service.ts', 'utf8');
for (const needle of ['InsufficientPwrcCreditsError', 'recoverExpiredReservationsForUser', 'applyVerifiedPaymentSettled', 'PAYMENT_INTENT_BINDING_MISMATCH', 'issueQuote', 'recordCompletedDelivery', 'settleCompletedDelivery', 'createTokenizedReceipt']) {
  if (!service.includes(needle)) throw new Error(`Missing credit service invariant: ${needle}`);
}
const prompts = readFileSync('apps/mobile/constants/prompts.ts', 'utf8');
for (const needle of ['credits-balance', 'credits-capacity', 'credits-ledger', 'credits-payment-verification', 'credits-reservation-state', 'credits-quote-proof']) {
  if (!prompts.includes(needle)) throw new Error(`Missing dedicated credit prompt: ${needle}`);
}

const proofMigration = readFileSync('server/db/migrations/003_pwrc_quote_delivery_receipts.sql', 'utf8');
for (const needle of ['pwrc_credit_quotes', 'pwrc_copilot_deliveries', 'pwrc_tokenized_receipts', 'reject_pwrc_proof_mutation', 'verify_pwrc_receipt_binding']) {
  if (!proofMigration.includes(needle)) throw new Error(`Missing quote/receipt proof invariant: ${needle}`);
}
const metered = readFileSync('server/copilot/metered-response.ts', 'utf8');
for (const needle of ['issueQuote', 'recordCompletedDelivery', 'settleCompletedDelivery', 'quotePersisted: true', 'receipt', 'messageUnit', 'referenceValueUsd']) {
  if (!metered.includes(needle)) throw new Error(`Missing canonical metered-flow invariant: ${needle}`);
}

const lifecycleMigration = readFileSync('server/db/migrations/004_pwrc_authoritative_billing_lifecycle.sql', 'utf8');
for (const needle of ['pwrc_signed_receipts', 'pwrc_receipt_anchor_outbox', 'previous_receipt_hash', 'signature text NOT NULL']) {
  if (!lifecycleMigration.includes(needle)) throw new Error(`Missing authoritative billing lifecycle invariant: ${needle}`);
}
const chatMigration = readFileSync('prisma/migrations/20260826114500_pwrc_message_units/migration.sql', 'utf8');
for (const needle of ['message_unit_id', 'receipt_hash', 'pwrc_debit_base_units', 'reference_value_usd']) {
  if (!chatMigration.includes(needle)) throw new Error(`Missing persisted message-unit metadata: ${needle}`);
}
const mobileCopilot = readFileSync('apps/mobile/constants/pwrc.ts', 'utf8') + readFileSync('apps/mobile/components/chat/Composer.tsx', 'utf8') + readFileSync('apps/mobile/components/chat/MessageBubble.tsx', 'utf8');
for (const needle of ['10,000 PWRC / response', 'message.messageUnit', 'Signed receipt']) {
  if (!mobileCopilot.includes(needle)) throw new Error(`Missing mobile message-unit UX invariant: ${needle}`);
}
console.log('PWRC credit invariant verification passed (authoritative lifecycle + reference economics + MSG UNIT receipts)');
