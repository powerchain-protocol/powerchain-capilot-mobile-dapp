# PWRC Copilot Credit Kernel

The mobile app treats PWRC Copilot credits as **server-authoritative accounting state**. Wallet balances and credit balances are intentionally separate concepts.

## Integer accounting

PWRC uses 9 decimals. The kernel never uses floating-point values for accounting:

```text
1 PWRC                         = 1,000,000,000 base units
1 Copilot response             = 10,000 PWRC
1 response reservation         = 10,000,000,000,000 base units
Sample grant                   = 1,000,000 PWRC
Sample grant base units        = 1,000,000,000,000,000
Sample grant response capacity = 100
```

JSON APIs encode all base-unit values as decimal strings to avoid JavaScript's 53-bit integer limit. Domain code converts them to `bigint`.

## Account model

Each authenticated user has one account with four balances:

- `available`: spendable credit.
- `reserved`: credit held for in-flight Copilot work.
- `spent`: lifetime successfully settled Copilot usage.
- `funded`: lifetime verified funding plus the one-time sample grant.

The invariant is:

```text
funded = available + reserved + spent
```

The Postgres schema enforces this invariant with `numeric(39,0)` checks.

## Ledger

`pwrc_credit_ledger` is append-only. PostgreSQL triggers reject `UPDATE` and `DELETE` operations. Each entry records deltas and the resulting four account balances.

Supported entries:

- `demo_grant`
- `payment_credit`
- `reservation_created`
- `reservation_settled`
- `reservation_released`
- `reservation_expired`

## Quote -> reserve -> generate -> settle

A completed response uses this lifecycle:

```text
authenticated user
      |
      v
quote (SHA-256 canonical hash)
      |
      v
reserve 10,000 PWRC
      |
      +---- insufficient ----> HTTP 402 INSUFFICIENT_PWRC_CREDITS
      |
      v
Copilot generation + authenticated credit grounding
      |
      +---- failure/abort ----> release reservation
      |
      v
non-empty completed response
      |
      v
settle reservation -> spent
```

Reservations are time-bounded. Account reads recover only that authenticated user's expired reservations; they never sweep unrelated accounts. `recoverExpiredReservations()` remains available for a scheduled worker using `FOR UPDATE SKIP LOCKED` batching.

## Deterministic quote hashes

Quotes are SHA-256 hashes of a versioned canonical payload containing:

- price version
- user ID
- product
- quantity
- unit cost and total base units
- canonical PWRC mint/network/decimals
- issued and expiry timestamps

No JSON object key ordering is involved, so identical inputs produce identical hashes. Reservations revalidate the hash, canonical price version, product, quantity, unit price, total, ownership, timestamps, and expiry before moving any balance.

## Authenticated APIs

The Web `Request` handler in `server/api/credits-handler.ts` requires the host application's authentication middleware for every user route:

```text
GET  /api/v1/credits/pricing
GET  /api/v1/credits/account
GET  /api/v1/credits/ledger
POST /api/v1/credits/quotes
POST /api/v1/credits/demo-grant
POST /api/v1/credits/top-ups/solana-pay
GET  /api/v1/credits/top-ups/:id
```

The host must provide `authenticate(request) -> { userId } | null`. Do not accept user IDs from request bodies or query strings as account identity.

## HTTP 402

Insufficient credit raises:

```json
{
  "error": {
    "code": "INSUFFICIENT_PWRC_CREDITS",
    "message": "Insufficient PWRC credits for this Copilot response.",
    "details": {
      "availableBaseUnits": "0",
      "requiredBaseUnits": "10000000000000"
    }
  }
}
```

with status `402`.

## Solana Pay funding

Canonical PWRC identity:

```text
Network:   Solana mainnet-beta
Standard:  Token-2022
Decimals:  9
Mint:      PWRCRXXZxbg6FdQZfK3PMD7KP8xfxs9acvifJiG46wc
Program:   TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb
```

`POST /api/v1/credits/top-ups/solana-pay` creates a user-scoped pending intent and Solana Pay URI. Callers may send an `Idempotency-Key` (8-128 URL-safe characters); retries with the same user/key/amount return the same intent. `GET /api/v1/credits/top-ups/:id` exposes only that authenticated user's server-authoritative status. The server requires `PWRC_SOLANA_PAY_RECIPIENT`; this repository does not invent a treasury recipient.

**Creating or observing a Solana transaction never credits the account directly.**

The only funding path is:

```text
Solana Pay
  -> Payment Kernel observes/reconciles payment
  -> Payment Kernel verifies settlement
  -> signed payment.settled webhook
  -> HMAC + replay-window verification
  -> mint/network/user/top-up/amount/idempotency checks
  -> payment_credit ledger entry
  -> available + funded
```

Webhook route:

```text
POST /internal/v1/payment-kernel/webhook
```

Required headers:

```text
x-powerchain-timestamp: <unix seconds>
x-powerchain-signature: sha256=<HMAC_SHA256(timestamp + "." + rawBody)>
```

The event must include `type: "payment.settled"` and `verification.status: "verified"`. It must also carry the verified Solana Pay `recipient` and `reference`; both must exactly match the stored top-up intent before any credit mutation. Event ID, payment ID, transaction signature, top-up intent, and verification ID remain unique idempotency/audit keys. Webhook bodies are capped at 64 KiB and production kernel construction requires a webhook secret of at least 32 bytes.

## Copilot grounding

The metered Copilot wrapper injects a dedicated `powerchain.pwrc_credits` grounding object containing authenticated Credit Kernel balances, quote hash, cost, and remaining response capacity. It explicitly tells the model not to treat credit balances as wallet balances and not to claim payment settlement without Payment Kernel verification.

## Postgres

Apply in order:

```text
server/db/migrations/001_pwrc_credits.sql
server/db/migrations/002_pwrc_credit_hardening.sql
```

Then bind your PostgreSQL client to `PostgresCreditStore` through the small `TransactionalSqlClient` interface. Every service mutation executes inside one database transaction.

## Mobile session binding

The Expo client has `AuthSessionProvider`. The product's actual sign-in flow should call `setSession({ userId, accessToken })` after server authentication. Tokens are never stored in `EXPO_PUBLIC_*` configuration. The Credits and Copilot screens remain disabled until an authenticated session exists.

## Reconciliation control

Migration 002 creates `pwrc_credit_account_reconciliation`, which compares each current account balance with the sum of append-only ledger deltas. Release/operations checks should require `reconciled = true`; a mismatch is an accounting incident and must not be auto-corrected by inventing ledger history. The migration also adds a database trigger that rejects Payment Kernel event inserts whose user, amount, recipient, or Solana Pay reference do not match the stored top-up intent.


## Release invariant checklist

The v1.0.0 credit release is gated by `pnpm verify:credits`, which verifies the following product invariants:

1. 9-decimal integer PWRC base-unit accounting (`bigint` in domain code; decimal strings in JSON).
2. Deterministic SHA-256 quote hashes over a versioned canonical snapshot.
3. User-scoped credit accounts.
4. Available / reserved / spent / funded balances with `funded = available + reserved + spent`.
5. Append-only ledger persistence; PostgreSQL rejects UPDATE/DELETE and the test store returns defensive copies.
6. Reservation expiry recovery.
7. HTTP `402 INSUFFICIENT_PWRC_CREDITS`.
8. One-time **sample** grant of 1,000,000 PWRC accounting credits = exactly 100 completed responses. The sample grant does not mint or transfer on-chain PWRC.
9. Authenticated pricing/account/ledger APIs.
10. PWRC Token-2022 Solana Pay top-up intents.
11. Credits are added only after Payment Kernel verification of `payment.settled`.
12. Canonical PWRC mint/network identity plus Solana Explorer access.
13. Authenticated credit context is injected into Copilot grounding.
14. Dedicated Credits prompts are available in Prompt Library.

## Canonical server quote -> tokenized receipt proof chain

The completed-response billing path is now explicitly evidence-linked:

```text
SERVER QUOTE
   ↓
canonical quote payload
   ↓
SHA-256 quote hash
   ↓
PERSIST QUOTE
   ↓
ATOMIC RESERVATION
   ↓
AI GENERATION
   ↓
completed response hash proof
   ↓
durably persisted completed response
   ↓
SETTLE 10,000 PWRC
   ↓
SPENT BALANCE
   ↓
APPEND-ONLY LEDGER
   ↓
TOKENIZED RECEIPT
```

`pwrc_credit_quotes` stores the immutable canonical server quote snapshot before any available balance is moved into reserved balance. The quote hash remains the reservation proof anchor.

After generation succeeds, the credit kernel stores an immutable `pwrc_copilot_deliveries` record containing a SHA-256 proof of the exact server response bound to the reservation and quote. Raw assistant content is not duplicated into the credit tables; chat persistence remains the content authority.

Settlement requires the durably persisted completed-response proof. A separate atomic settlement transaction moves the 10,000 PWRC reservation from `reserved` to `spent`, appends `reservation_settled`, writes one Ed25519-signed `pwrc_signed_receipts` record, and enqueues one `pwrc_receipt_anchor_outbox` event for batched Merkle-root publication.

The tokenized receipt is a **non-transferable cryptographic billing receipt**, not an SPL token, NFT, investment asset, or new PWRC balance. Its token string is a stable proof identifier:

```text
powerchain:pwrc-receipt:v1:<sha256 receipt hash>
```

The receipt binds:

- authenticated user
- persisted quote hash
- reservation ID
- completed delivery ID
- completed response hash
- settlement ledger entry ID
- exact PWRC base-unit amount
- canonical PWRC mint/network/decimals
- issue timestamp
- `nonTransferable = true`

Quote snapshots, completed delivery proofs, tokenized receipts, and the existing credit ledger are immutable at the PostgreSQL layer. The receipt binding trigger also verifies the settled reservation, completed delivery, append-only settlement ledger entry, and exact amount before accepting a receipt.

Authenticated proof APIs:

```text
POST /api/v1/credits/quotes
GET  /api/v1/credits/quotes/:hash
GET  /api/v1/credits/receipts/:receiptId
```

Apply the third migration after migrations 001 and 002:

```text
server/db/migrations/003_pwrc_quote_delivery_receipts.sql
```

Legacy reservations that predate persisted quote snapshots are intentionally not assigned invented quote evidence. The new proof chain applies to canonical requests created after migration 003.
