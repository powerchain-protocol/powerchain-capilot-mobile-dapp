# PWRC Authoritative Billing Lifecycle — v1.0.0

PowerChain Copilot uses one fail-closed server-owned billing path. The client cannot set the authoritative price, balance, quote hash, reservation state, settlement state, ledger movement, or receipt contents.

```text
SERVER QUOTE
   ↓
RFC-8785-compatible canonical billing JSON
   ↓
SHA-256 quote hash
   ↓
PERSIST IMMUTABLE QUOTE
   ↓
ATOMIC RESERVATION — 10,000 PWRC
   ├─ insufficient → HTTP 402 INSUFFICIENT_PWRC_CREDITS
   └─ reserved
         ↓
AI GENERATION / approved read-only MCP
   ├─ failed or cancelled → RELEASE RESERVATION
   └─ completed
         ↓
PERSIST COMPLETED RESPONSE PROOF
         ↓
ATOMIC SETTLEMENT
         ↓
Reserved → Spent
         ↓
APPEND-ONLY LEDGER
         ↓
ED25519-SIGNED RECEIPT + SOLANA ANCHOR OUTBOX
```

## Constants

- PWRC decimals: `9`
- Completed-response charge: `10,000 PWRC`
- Base-unit charge: `10,000,000,000,000`
- A provider fallback or 0…N approved read-only MCP calls do not create additional message charges.

## Transaction boundaries

Quote persistence commits before the reservation transaction begins. A reservation is created only from a persisted quote whose canonical payload and SHA-256 hash still validate.

The completed response proof is committed before settlement starts. Settlement then runs in one database transaction: lock account/reservation evidence, move `reserved → spent`, finalize the reservation, append the immutable ledger movement, create the signed hash-chained receipt, and enqueue the Solana receipt-anchor outbox event.

If model generation fails before response persistence, the active reservation is released. A settled/released/expired reservation cannot take another terminal transition. Repeated settlement readback is idempotent and returns the same receipt.

## Idempotency and scope

`Idempotency-Key` is required for metered response and quote creation. Quote idempotency is unique within the authenticated organization/account billing scope. `quoteHash` and `responseId` are unique proof identifiers. All quote, reservation, completed-response, account, ledger, receipt and outbox evidence is organization/account scoped.

## Canonical JSON

Billing payloads use the restricted JCS/RFC 8785 domain in `server/credits/canonical-json.ts`: sorted object keys, deterministic JSON encoding, strings for bigint/timestamps and safe integers only. This avoids floating-point ambiguity in monetary proofs.

## Signed receipt

```ts
type TokenizedReceipt = {
  version: "1";
  receiptId: string;
  quoteId: string;
  quoteHash: string;
  reservationId: string;
  responseId: string;
  organizationId: string;
  accountId: string;
  mint: string;
  amountBaseUnits: "10000000000000";
  amountDisplay: "10000";
  status: "SETTLED";
  settledAt: string;
  ledgerEntryId: string;
  previousReceiptHash: string | null;
  receiptHash: string;
  signature: string;
};
```

Receipts are server-signed with Ed25519. They are cryptographic accounting proofs, not NFTs, not transferable SPL assets, and not separate financial instruments. `previousReceiptHash` chains receipts per account.

## Solana anchoring

Receipt hashes are placed in `pwrc_receipt_anchor_outbox` during settlement. The anchor worker batches pending hashes into a Merkle root and publishes one root, not one NFT per Copilot response. Failed publication does not roll back a valid billing settlement; the durable outbox retries with a processing lease and exponential backoff.

## Refunds and reversals

Ledger rows are immutable. Refunds/reversals use compensating append-only entries (`settlement_refund` / `settlement_reversal`); historic settlement evidence is never edited or deleted.

## Required migration

Apply migrations in order through:

`server/db/migrations/004_pwrc_authoritative_billing_lifecycle.sql`
