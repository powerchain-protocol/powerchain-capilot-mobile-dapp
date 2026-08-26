# PWRC Copilot Credits Specification

**Product version:** 1.0.0

## Reference economics

The configured initial/reference value is **1 PWRC = $0.000002**. It is not a live market price and must never be presented as one. Reference-value calculations use integer micro-USD units server-side.

| Completed responses | PWRC | Configured reference value |
|---:|---:|---:|
| 1 | 10,000 | $0.02 |
| 50 | 500,000 | $1.00 |
| 250 | 2,500,000 | $5.00 |
| 500 | 5,000,000 | $10.00 |
| 1,000 | 10,000,000 | $20.00 |

`$1 reference value = 500,000 PWRC = 50 completed responses`.

## Message unit

One completed and settled Copilot response is one accounting message unit:

```text
1 completed response
= 1 MSG UNIT
= 10,000 PWRC
= 10,000,000,000,000 base units
≈ $0.02 configured reference value
```

Each completed response receives a server-generated `pmsg_...` identifier. It is an accounting identifier, not a token mint, NFT, or transferable asset. Conversation content is not written on-chain.

## Authoritative lifecycle

The authoritative v1.0.0 lifecycle remains:

`persist quote -> reserve -> generate -> persist completed response -> atomic settlement -> append-only ledger -> signed receipt -> Merkle anchor outbox`.

Failed, cancelled, disconnected, empty, or otherwise unsuccessful generation releases an active reservation. Payment top-ups become credits only after the Payment Kernel verifies `payment.settled`.

## UX policy

- Pricing and balance reads are authenticated API reads and do not consume a message unit.
- Prompt Library entries display the cost before sending.
- The composer displays `10,000 PWRC / response · ≈ $0.02 ref`.
- Completed assistant messages display their `pmsg_...` message unit and signed-receipt proof.
- Low or insufficient credits route directly to the PWRC Credit Center.


## Signed receipt compatibility

The cryptographically signed `TokenizedReceipt` v1 schema remains unchanged from the authoritative billing lifecycle. Reference economics and request-idempotency metadata are carried in a server-produced message-unit envelope linked to that signed receipt. This avoids silently changing the receipt signature contract while still giving the UI an auditable `requestId -> quoteHash -> reservationId -> pmsg_... -> receiptId` chain.

Encrypted assistant chat rows persist only billing-proof metadata (`message_unit_id`, receipt id/hash, debit base units, configured reference value) alongside the existing encrypted content. Plaintext conversation content is not copied into billing tables or the Solana anchor.


## Funding presets

The PWRC Credit Center uses message-denominated presets returned by the authenticated pricing API:

| PWRC | Responses | Configured reference value |
|---:|---:|---:|
| 500,000 | 50 | $1.00 |
| 2,500,000 | 250 | $5.00 |
| 5,000,000 | 500 | $10.00 |
| 10,000,000 | 1,000 | $20.00 |

The client treats these as presentation/reference economics only. Solana Pay settlement remains token-denominated and the Payment Kernel remains the sole crediting authority.
