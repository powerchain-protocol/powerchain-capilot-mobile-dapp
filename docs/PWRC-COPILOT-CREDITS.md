# PWRC Copilot Credits — v1.0.0

## Canonical economics

The configured reference value is:

```text
1 PWRC = $0.000002 reference value
1 completed Copilot response = 10,000 PWRC
10,000 × $0.000002 = $0.02 reference value
```

This is **not a live market price**. Message debits are denominated in PWRC and
remain exactly 10,000 PWRC per successfully completed response under pricing
version `pwrc-copilot-v1`.

| Completed responses | PWRC | Reference value |
|---:|---:|---:|
| 1 | 10,000 | $0.02 |
| 50 | 500,000 | $1.00 |
| 250 | 2,500,000 | $5.00 |
| 500 | 5,000,000 | $10.00 |
| 1,000 | 10,000,000 | $20.00 |

Therefore:

```text
$1 reference value = 500,000 PWRC = 50 completed responses
```

## Accounting unit

PWRC uses 9 decimals.

```text
1 PWRC = 1,000,000,000 base units
10,000 PWRC = 10,000,000,000,000 base units
```

All server-side accounting is performed with integer-valued base units stored in
`DECIMAL(38,0)` so the accounting range is not limited by signed 64-bit integer
capacity.

## Lifecycle

```text
Quote
  ↓
Reserve 10,000 PWRC
  ↓
Generate
  ↓
Verify non-empty completed response
  ↓
Settle
```

Release paths:

```text
user stops generation
client disconnects
generation fails
request setup fails
empty response
reservation expires
  ↓
release reservation
  ↓
0 PWRC spent
```

A reservation that has been settled cannot be released again.

## Balances

Each user has four exact accounting balances:

```text
available
reserved
spent
funded
```

Accounting invariant:

```text
funded = available + reserved + spent
```

for the lifetime credit pool, absent future explicit administrative correction
entries.

## Tokenized messages

Every charged completed response receives a receipt ID:

```text
pmsg_...
```

The receipt records:

```text
request
reservation
quote hash
1 MSG UNIT
10,000 PWRC debit
base-unit debit
$0.02 reference value
$0.000002/PWRC reference input
pricing version
```

This is an accounting receipt, not an NFT. Conversation content is not written
on-chain and no message-specific token mint is created.

## Payment Kernel boundary

Solana Pay only creates a **pending top-up intent**. It does not credit the user.

Credits are funded only after the server receives a signed, verified:

```text
payment.settled
```

Payment Kernel event whose:

```text
reference
amount
PWRC mint
network
recipient
```

match the pending top-up intent exactly.

`paymentSettlementId` is unique, making funding idempotent.

## API

Authenticated, non-message-charging endpoints:

```text
GET  /api/v1/credits/pricing
GET  /api/v1/credits/account
GET  /api/v1/credits/ledger
GET  /api/v1/credits/funding
GET  /api/v1/credits/messages/:id
POST /api/v1/credits/topups
POST /api/v1/credits/demo-grant
```

Internal Payment Kernel endpoint:

```text
POST /api/v1/internal/payment-kernel/events
```

AI:

```text
POST /api/v1/ai/chat
POST /api/v1/ai/chat/cancel
```

Insufficient credits return:

```text
HTTP 402
INSUFFICIENT_PWRC_CREDITS
```

## Funding presets

```text
500,000 PWRC    →   50 responses
2,500,000 PWRC  →  250 responses
5,000,000 PWRC  →  500 responses
10,000,000 PWRC → 1,000 responses
```

## Demo grant

Development can enable a one-time sample grant:

```text
1,000,000 sample PWRC = 100 completed responses
```

Production environment validation rejects demo grants.

## UX

Copilot composer:

```text
10,000 PWRC / response · ≈ $0.02 ref · N left
```

Completed answers display their `pmsg_...` receipt.

The `/copilot-credits` route shows balance, response runway, economics, Solana
identity, Explorer access, funding presets/history and append-only ledger.

Checking the credit center never consumes another 10,000-PWRC Copilot response.

## Database-enforced invariants

The migration enforces:

```text
available >= 0
reserved  >= 0
spent     >= 0
funded    >= 0
funded = available + reserved + spent
```

For v1.0.0, a settled message receipt is constrained to:

```text
responseUnits = 1
debitBaseUnits = 10,000,000,000,000
referenceUsdMicros = 20,000
referencePriceMicros = 2
```

`PwrcCreditLedgerEntry` is protected by a PostgreSQL trigger that rejects
`UPDATE` and `DELETE`, making the ledger append-only at the persistence boundary.

## Production hardening — delivery acknowledgement

The message-credit lifecycle now has an explicit delivery acknowledgement boundary:

```text
Quote
  ↓
Reserve 10,000 PWRC
  ↓
Generate
  ↓
Verify non-empty response
  ↓
Prepare pending response
  ↓
Client receives response
  ↓
POST /api/v1/ai/chat/ack
  ↓
Create assistant message + settle reservation atomically
  ↓
pmsg_... receipt
```

The frontend does not render the generated assistant content until the ACK call succeeds.
This closes the previous ambiguity where a network disconnect could occur after a server-side
settlement commit but before the client received the response.

If delivery is interrupted before acknowledgement:

```text
pending response expires
reservation releases
0 PWRC spent
```

Pending responses are durable and carry a short-lived acknowledgement token. The token is
hashed at rest. A successful acknowledgement is idempotent and returns the original settled
message/receipt on replay.

## Payment Kernel webhook replay protection

Payment Kernel webhook verification now requires:

```text
X-Payment-Kernel-Event-Id
X-Payment-Kernel-Timestamp
X-Payment-Kernel-Signature
```

The HMAC covers:

```text
timestamp + eventId + canonical payload
```

and the timestamp must be inside `PAYMENT_KERNEL_WEBHOOK_MAX_SKEW_SECONDS`.
Verified event receipts are persisted as append-only `PwrcPaymentKernelEvent` rows.

Two idempotency layers therefore exist:

```text
transport replay       → eventId
financial settlement   → paymentSettlementId
```

## Atomic top-up settlement claim

A top-up intent is atomically claimed from `PENDING` to `SETTLED` before any account balance
increment occurs. Competing settlement IDs cannot fund the same intent twice.

Top-up creation is also idempotent per user via a client-generated idempotency key.

## Credit reconciliation

Authenticated endpoint:

```text
GET /api/v1/credits/reconciliation
```

checks:

```text
available == ledger available sum
reserved  == ledger reserved sum
spent     == ledger spent sum
funded    == ledger funded sum
reserved  == active reservation total
funded    == available + reserved + spent
```

The Credits UI shows `Balanced` or `Needs review` without consuming a Copilot message credit.

## Maintenance worker

The PWRC maintenance loop now recovers all stale credit-state classes:

```text
expired reservations
expired pending responses
expired top-up intents
```

## Demo grant concurrency

The development-only 1,000,000-PWRC demo grant is protected by a partial unique database
index so concurrent claim requests cannot grant twice.

## Production hardening — acknowledgement window and delivery recovery

After a verified model response is prepared, the original generation reservation is shortened to a dedicated delivery acknowledgement window:

```text
PWRC_CREDIT_ACK_TTL_SECONDS=120
```

The value is configurable within the server validation bounds. If the client disappears during this window, the pending response expires, the reservation is released, and the abandoned pre-settlement response body is scrubbed from the pending-response row.

The delivery protocol is recoverable by `clientRequestId`:

```text
POST /api/v1/ai/chat/recover
```

Recovery never regenerates the response merely to determine accounting state. It returns either:

```text
already settled   → original message + pmsg receipt
still reserved    → same pending response + rotated ACK token
still generating  → COPILOT_REQUEST_IN_PROGRESS
released          → COPILOT_REQUEST_ALREADY_RELEASED
```

If an ACK response is lost after the database transaction committed, the client can therefore recover the settled result without a second generation or second debit.

## Production hardening — request fingerprints

`clientRequestId` is a true idempotency key, not just a duplicate identifier. Each reservation stores a deterministic SHA-256 fingerprint over the normalized request inputs:

```text
conversationId
message
bounded Copilot context
```

Reusing one `clientRequestId` with different request content is rejected with:

```text
COPILOT_IDEMPOTENCY_CONFLICT
```

This prevents an old settled response or reservation from being reused for a semantically different prompt.

## Production hardening — Payment Kernel settlement evidence

A `payment.settled` event must include the verified Solana transaction signature in addition to the expected reference, network, mint, recipient and amount.

Transport replay and financial replay are checked independently:

```text
same eventId + different payload       → PAYMENT_KERNEL_EVENT_ID_CONFLICT
same settlementId + different evidence → PAYMENT_SETTLEMENT_ID_CONFLICT
```

The event HMAC includes the timestamp, event ID and canonical payload. The configured skew window defaults to:

```text
PAYMENT_KERNEL_WEBHOOK_MAX_SKEW_SECONDS=300
```

## Persistence immutability

Financial evidence is hardened at the PostgreSQL boundary:

```text
PwrcCreditLedgerEntry   append-only
PwrcPaymentKernelEvent  append-only
PwrcMessageReceipt      immutable
PwrcCreditFunding       immutable
```

Terminal credit reservations cannot transition back into an executable state, and the reservation's economic identity fields cannot be mutated after creation.

## Maintenance isolation

The PWRC maintenance loop uses a non-overlap guard and runs independent maintenance classes with `Promise.allSettled`:

```text
reservation expiry
pending-response expiry
Solana Pay top-up expiry
```

A failure in one maintenance class is logged independently and does not stop the others from recovering stale state.

## Shared accounting module

The credit implementation is now anchored by:

```text
packages/pwrc-credits/
├── src/constants.ts
├── src/amount.ts
├── src/contracts.ts
├── src/errors.ts
├── src/ledger.ts
├── src/quote.ts
├── src/settlement.ts
└── test/
```

`@powerchain/pwrc-credits` is the canonical cross-layer contract. The server
uses it for bigint arithmetic, balance invariants, quote construction and
settlement replay validation. The Expo client imports the decimal-string DTO
contracts and safe constants instead of inventing independent credit shapes.

### Decimal-string JSON boundary

PWRC base-unit values can exceed JavaScript's 53-bit safe integer range. The
boundary rule is therefore:

```text
PostgreSQL DECIMAL(38,0)
        ↕
server bigint
        ↕
decimal-string JSON
        ↕
client bigint only when arithmetic is required
```

Examples:

```json
{
  "availableBaseUnits": "1000000000000000",
  "reservedBaseUnits": "10000000000000",
  "debitBaseUnits": "10000000000000"
}
```

Scientific notation, fractional base-unit strings, signed positive notation and
other non-canonical numeric encodings are rejected.

## Deterministic quote endpoint

Authenticated quote inspection does not consume a Copilot response:

```text
GET /api/v1/credits/quote
```

It returns the canonical `pwrc-copilot-v1` quote and SHA-256 quote hash using
string-valued base units.

## Verified Solana Pay evidence

The internal `payment.settled` boundary now validates:

```text
HMAC envelope
Payment Kernel event ID
signature timestamp / replay window
canonical decimal-string base units
32-byte base58 Solana reference
32-byte base58 PWRC mint
32-byte base58 treasury recipient
64-byte base58 Solana transaction signature
exact top-up intent amount/network/mint/recipient
atomic PENDING → SETTLED claim
settlement replay compatibility
```

Credits are posted only after all of these checks pass. A Solana Pay URI by
itself never increases a credit account.

## Bounded Copilot grounding

Copilot receives a bounded credit context containing:

```text
available / reserved / spent
response runway
message cost in PWRC and base units
reference economics
pricing version
quote hash
canonical PWRC identity
up to five recent ledger entries
```

The context explicitly marks the USD/PWRC value as non-live. Dedicated credit
prompts distinguish no-charge navigation (`Open PWRC credit center`) from paid
AI explanations/reviews.

## Single-use Solana transaction receipts

`PwrcCreditFunding.transactionSignature` is unique. The database therefore
prevents the same verified Solana transaction from funding more than one credit
posting even if distinct Payment Kernel settlement IDs are submitted.

Conflicting reuse returns:

```text
HTTP 409
PAYMENT_TRANSACTION_ALREADY_USED
```

## Quote snapshot and historical determinism

Every new message reservation persists the complete deterministic quote snapshot, including:

```text
quote schema version
quote kind
billing trigger
pricing version
PWRC symbol
Solana network
PWRC mint
Token-2022 program
9 decimals
response units
PWRC base-unit debit
reference economics
quote hash
```

Idempotent replay returns the stored snapshot. Settlement copies economic values from the reservation rather than recomputing them from current constants. This prevents a later pricing/configuration change from rewriting the economic meaning of an earlier request.

## Extended reconciliation

The account reconciliation endpoint now validates four additional cross-table controls:

```text
message-receipt debit total = account spent
SETTLE ledger total/count = message-receipt total/count
settled reservation count = message-receipt count
verified funding total/count = FUNDING ledger total/count
```

These checks complement `funded = available + reserved + spent` and active-reservation reconciliation.

## Optional token-transfer evidence

The Payment Kernel may include:

```text
grossTransferBaseUnits
withheldTransferFeeBaseUnits
recipientNetBaseUnits
```

If any are supplied, all three are required and PostgreSQL enforces:

```text
gross transfer = recipient net + withheld transfer fee
```

The credit amount remains the explicitly verified `amountBaseUnits` bound to the top-up intent. Transfer evidence is retained separately for audit and treasury reconciliation.

### Deployment note for quote-snapshot migration

`20260825133000_pwrc_quote_snapshot_reconciliation` intentionally refuses to run while any PWRC reservation remains `RESERVED`. The quote contract now binds additional immutable identity fields, so deployment should drain the short reservation/ACK window first rather than allowing one in-flight request to cross quote semantics.

Operational sequence:

```text
stop new Copilot mutations
wait for generation / ACK window to drain
run PWRC reservation reaper
confirm RESERVED count = 0
apply Prisma migration
restart API/workers
resume Copilot mutations
```
