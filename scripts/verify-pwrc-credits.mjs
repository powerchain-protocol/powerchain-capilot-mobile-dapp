import { readFile, access } from "node:fs/promises";

const required = [
  "docs/PWRC-COPILOT-CREDITS.md",
  "packages/pwrc-credits/package.json",
  "packages/pwrc-credits/src/constants.ts",
  "packages/pwrc-credits/src/amount.ts",
  "packages/pwrc-credits/src/contracts.ts",
  "packages/pwrc-credits/src/ledger.ts",
  "packages/pwrc-credits/src/quote.ts",
  "packages/pwrc-credits/src/settlement.ts",
  "packages/pwrc-credits/test/accounting.test.ts",
  "apps/api/src/credits/constants.ts",
  "apps/api/src/credits/pricing.ts",
  "apps/api/src/credits/service.ts",
  "apps/api/src/credits/payment-kernel.ts",
  "apps/api/src/credits/pending-response.ts",
  "apps/api/src/credits/reaper.ts",
  "apps/api/src/routes/credits.ts",
  "apps/api/src/routes/payment-kernel.ts",
  "apps/mobile/src/features/credits/PwrcCreditsProvider.tsx",
  "apps/mobile/app/(app)/copilot-credits.tsx",
  "apps/api/prisma/migrations/20260825102000_pwrc_copilot_credits/migration.sql",
  "apps/api/prisma/migrations/20260825121000_pwrc_credit_hardening/migration.sql",
  "apps/api/prisma/migrations/20260825130000_pwrc_credit_module/migration.sql",
  "apps/api/prisma/migrations/20260825133000_pwrc_quote_snapshot_reconciliation/migration.sql",
];

let failed = false;
for (const file of required) {
  try {
    await access(file);
    console.log(`✓ ${file}`);
  } catch {
    failed = true;
    console.error(`✗ ${file}`);
  }
}

const constants = await readFile("packages/pwrc-credits/src/constants.ts", "utf8");
const coreAmount = await readFile("packages/pwrc-credits/src/amount.ts", "utf8");
const coreLedger = await readFile("packages/pwrc-credits/src/ledger.ts", "utf8");
const coreQuote = await readFile("packages/pwrc-credits/src/quote.ts", "utf8");
const coreContracts = await readFile("packages/pwrc-credits/src/contracts.ts", "utf8");
const coreSettlement = await readFile("packages/pwrc-credits/src/settlement.ts", "utf8");
const ai = await readFile("apps/api/src/routes/ai.ts", "utf8");
const pending = await readFile("apps/api/src/credits/pending-response.ts", "utf8");
const service = await readFile("apps/api/src/credits/service.ts", "utf8");
const payment = await readFile("apps/api/src/credits/payment-kernel.ts", "utf8");
const schema = await readFile("apps/api/prisma/schema.prisma", "utf8");
const initialMigration = await readFile(
  "apps/api/prisma/migrations/20260825102000_pwrc_copilot_credits/migration.sql",
  "utf8",
);
const hardeningMigration = await readFile(
  "apps/api/prisma/migrations/20260825121000_pwrc_credit_hardening/migration.sql",
  "utf8",
);
const moduleMigration = await readFile(
  "apps/api/prisma/migrations/20260825130000_pwrc_credit_module/migration.sql",
  "utf8",
);
const quoteSnapshotMigration = await readFile(
  "apps/api/prisma/migrations/20260825133000_pwrc_quote_snapshot_reconciliation/migration.sql",
  "utf8",
);
const app = `${await readFile("apps/api/src/app.ts", "utf8")}\n${await readFile("apps/api/v1/register.ts", "utf8")}`;
const paymentRoute = await readFile("apps/api/src/routes/payment-kernel.ts", "utf8");
const creditRoutes = await readFile("apps/api/src/routes/credits.ts", "utf8");
const creditScreen = await readFile("apps/mobile/app/(app)/copilot-credits.tsx", "utf8");
const aiClient = await readFile("apps/mobile/src/integrations/ai/client.ts", "utf8");
const fingerprint = await readFile("apps/api/src/credits/fingerprint.ts", "utf8");
const reaper = await readFile("apps/api/src/credits/reaper.ts", "utf8");
const serverEnv = await readFile("apps/api/src/config/env.ts", "utf8");
const quickPrompts = await readFile("apps/mobile/src/data/quick-prompts.ts", "utf8");
const providers = await readFile("apps/mobile/src/providers/AppProviders.tsx", "utf8");
const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const frontendPackage = JSON.parse(await readFile("apps/mobile/package.json", "utf8"));
const serverPackage = JSON.parse(await readFile("apps/api/package.json", "utf8"));
const creditsPackage = JSON.parse(await readFile("packages/pwrc-credits/package.json", "utf8"));

const reserveIndex = ai.indexOf("reserveMessageCredits({");
const generateIndex = ai.indexOf("generateCopilotResponse({");
const verifyIndex = ai.indexOf("const verification = verifyCopilotResponse");
const prepareIndex = ai.indexOf("await createPendingCopilotResponse");

const checks = [
  ["canonical 10,000 PWRC cost", constants.includes("PWRC_MESSAGE_COST_TOKENS = 10_000n")],
  ["9 decimals", constants.includes("PWRC_DECIMALS = 9")],
  ["reference 2 USD micros/PWRC", constants.includes("PWRC_REFERENCE_USD_MICROS_PER_TOKEN = 2n")],
  ["deterministic quote hash", coreQuote.includes("hashQuotePayload(canonical)") && coreQuote.includes('createHash("sha256")')],
  ["reserve before generation", reserveIndex >= 0 && reserveIndex < generateIndex],
  ["verify before pending delivery", verifyIndex >= 0 && verifyIndex < prepareIndex],
  ["settlement moved behind ACK", ai.includes('/api/v1/ai/chat/ack') && pending.includes("settleMessageCreditsInTransaction")],
  ["pending response token hashed", pending.includes('createHash("sha256")') && schema.includes("responseTokenHash")],
  ["frontend waits for ACK", aiClient.includes('/ai/chat/ack') && aiClient.includes('creditSettlement === "settled"')],
  ["release on generation error", ai.includes("releaseReservation")],
  ["HTTP 402 architecture", (await readFile("apps/api/src/credits/errors.ts", "utf8")).includes("statusCode = 402")],
  ["message receipt model", schema.includes("model PwrcMessageReceipt")],
  ["pending response model", schema.includes("model PwrcPendingResponse")],
  ["append-only ledger model", schema.includes("model PwrcCreditLedgerEntry")],
  ["top-up intent model", schema.includes("model PwrcTopupIntent")],
  ["payment event model", schema.includes("model PwrcPaymentKernelEvent")],
  ["account conservation constraint", initialMigration.includes("PwrcCreditAccount_conservation")],
  ["database append-only ledger", initialMigration.includes("PwrcCreditLedgerEntry_append_only")],
  ["database append-only payment events", hardeningMigration.includes("PwrcPaymentKernelEvent_append_only")],
  ["demo grant concurrency guard", hardeningMigration.includes("PwrcCreditLedgerEntry_demo_grant_once")],
  ["credit routes registered", app.includes("registerCreditRoutes(app)")],
  ["payment kernel route registered", app.includes("registerPaymentKernelRoutes(app)")],
  ["Payment Kernel envelope signature", paymentRoute.includes("verifyPaymentKernelEnvelope") && paymentRoute.includes("x-payment-kernel-event-id") && paymentRoute.includes("x-payment-kernel-timestamp")],
  ["Payment Kernel skew window", payment.includes("PAYMENT_KERNEL_WEBHOOK_MAX_SKEW_SECONDS")],
  ["atomic top-up claim before balance mutation", payment.indexOf('status: "SETTLED"') < payment.indexOf("availableBaseUnits: { increment")],
  ["top-up idempotency", schema.includes("idempotencyKey") && payment.includes("userId_idempotencyKey")],
  ["credit reconciliation", service.includes("getPwrcCreditReconciliation") && creditRoutes.includes('/api/v1/credits/reconciliation')],
  ["top-up status API", creditRoutes.includes('/api/v1/credits/topups') && payment.includes("listTopupIntents")],
  ["credit center is non-AI", !creditScreen.includes("sendCopilotMessage")],
  ["credit center shows integrity", creditScreen.includes('title="Account integrity"') && creditScreen.includes("getPwrcCreditReconciliation")],
  ["credits provider wired", providers.includes("PwrcCreditsProvider")],
  ["prompt library opens credits without AI", quickPrompts.includes('kind: "route"') && quickPrompts.includes("copilot-credits")],
  ["cancel endpoint exists", ai.includes('/api/v1/ai/chat/cancel')],
  ["idempotent settled replay", ai.includes("COPILOT_REQUEST_IN_PROGRESS") && ai.includes("replay: true")],
  ["delivery recovery endpoint", ai.includes('/api/v1/ai/chat/recover') && aiClient.includes('/ai/chat/recover')],
  ["ACK TTL configured", serverEnv.includes("PWRC_CREDIT_ACK_TTL_SECONDS") && pending.includes("PWRC_CREDIT_ACK_TTL_SECONDS")],
  ["request fingerprint persisted", fingerprint.includes('createHash("sha256")') && schema.includes("requestHash") && service.includes("COPILOT_IDEMPOTENCY_CONFLICT")],
  ["pending abandoned content scrubbed", pending.includes('content: ""') && pending.includes('responseTokenHash: "revoked"')],
  ["Payment Kernel settlement conflicts", payment.includes("PAYMENT_KERNEL_EVENT_ID_CONFLICT") && payment.includes("PAYMENT_SETTLEMENT_ID_CONFLICT")],
  ["verified Solana transaction signature required", paymentRoute.includes('base58Bytes(64, "transactionSignature")')],
  ["Solana transaction receipt single-use", moduleMigration.includes("PwrcCreditFunding_transactionSignature_key") && schema.includes("transactionSignature String?  @unique")],
  ["duplicate chain receipt conflict", payment.includes("PAYMENT_TRANSACTION_ALREADY_USED")],
  ["immutable settled message receipts", hardeningMigration.includes("PwrcMessageReceipt_immutable")],
  ["immutable funding evidence", hardeningMigration.includes("PwrcCreditFunding_immutable")],
  ["terminal reservation state guard", hardeningMigration.includes("PwrcCreditReservation_state_guard")],
  ["maintenance non-overlap and isolation", reaper.includes("let running = false") && reaper.includes("Promise.allSettled")],
  ["shared PWRC module version 1.0.0", creditsPackage.version === "1.0.0"],
  ["decimal-string API contracts", coreContracts.includes("availableBaseUnits: string") && coreContracts.includes("amountBaseUnits: string")],
  ["bigint amount parsing", coreAmount.includes("parseBaseUnitString") && coreAmount.includes("BigInt(value)")],
  ["ledger conservation invariant", coreLedger.includes("fundedBaseUnits !==") && coreLedger.includes("availableBaseUnits + state.reservedBaseUnits + state.spentBaseUnits")],
  ["settlement replay compatibility", coreSettlement.includes("assertSettlementReplayCompatible")],
  ["canonical PWRC mint in shared module", constants.includes("PWRCRXXZxbg6FdQZfK3PMD7KP8xfxs9acvifJiG46wc")],
  ["quote API authenticated", creditRoutes.includes('/api/v1/credits/quote') && creditRoutes.includes("authenticate(request)")],
  ["quote hash binds token identity and billing trigger", coreQuote.includes("billingTrigger: PWRC_BILLING_TRIGGER") && coreQuote.includes("mint: identity.mint") && coreQuote.includes("tokenProgram: identity.tokenProgram")],
  ["reservation persists quote snapshot", service.includes("quoteSnapshot: quote")],
  ["cross-table receipt reconciliation", service.includes("receiptsMatchSpent") && service.includes("settleLedgerMatchesReceipts")],
  ["cross-table funding reconciliation", service.includes("fundingRowsMatchFundingLedger")],
  ["delivery recovery CAS conflict", pending.includes("COPILOT_RECOVERY_RACE") && pending.includes("responseTokenHash: pending.responseTokenHash")],
  ["quote snapshot migration", quoteSnapshotMigration.includes('ADD COLUMN "quoteSnapshot" JSONB') && quoteSnapshotMigration.includes("transfer_evidence_check")],
  ["Copilot grounding includes quote and ledger", ai.includes("quoteHash: reservationResult.quote.quoteHash") && ai.includes("recentLedger: recentCreditLedger")],
  ["root version 1.0.0", packageJson.version === "1.0.0"],
  ["frontend version 1.0.0", frontendPackage.version === "1.0.0"],
  ["server version 1.0.0", serverPackage.version === "1.0.0"],
];

for (const [label, ok] of checks) {
  if (ok) console.log(`✓ ${label}`);
  else {
    failed = true;
    console.error(`✗ ${label}`);
  }
}


if (failed) process.exit(1);
