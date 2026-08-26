# Security

## Mobile trust boundary

The mobile application is an untrusted client. It may prepare requests and display server-supplied evidence, but it must not be the authority for balances, settlement, approvals, role checks, pricing, or execution policy.

## Required controls

- Keep secrets out of `EXPO_PUBLIC_*` variables and the repository.
- Validate authentication, authorization, organization scope, and approval policy on the server.
- Treat wallet signatures as authorization evidence, not as a substitute for application policy checks.
- Use request IDs and idempotency keys for money-moving or state-changing operations; PWRC Solana Pay intent creation supports `Idempotency-Key` and database uniqueness.
- Revalidate mutable execution inputs immediately before signing or settlement.
- Never fabricate telemetry, balances, transaction hashes, evidence timestamps, provider health, or settlement status when upstream data is unavailable.
- Redact tokens and credentials from logs and crash reports.
- Use TLS for non-local API traffic.

Report security issues privately through the repository's configured security reporting channel rather than public issues when disclosure could expose users or infrastructure.

## PWRC Credit Kernel

- Quote reservations revalidate the canonical deterministic hash and current price contract before reserving funds.
- Payment Kernel webhooks are HMAC authenticated, time-window checked, body-size limited, and bound to the stored top-up user, amount, recipient, and Solana Pay reference.
- The Postgres ledger is append-only and the reconciliation view must remain balanced before release.
- Never credit from wallet UI state, RPC observation alone, or a merely submitted transaction; only verified `payment.settled` crosses the funding boundary.

## Operational infrastructure controls

The isolated operations backend treats EMS telemetry, IoT heartbeats, DePIN state and market data as external evidence rather than trusted UI state. Operational reads are site-scoped; safe-action preparation resolves device/node/alarm/wallet ownership before creating an intent. Provider ingestion is internal-only, bounded and idempotent, and event history is append-only. External RPC/market responses are bounded by timeout and maximum response size. Cached mobile operational data is never promoted to fresh authority merely because the network is unavailable.
