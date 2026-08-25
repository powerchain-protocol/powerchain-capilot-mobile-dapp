# @powerchain/pwrc-credits

Canonical PWRC Copilot credit-domain module for PowerChain Copilot **v1.0.0**.

This package is the shared accounting contract between the API and Expo client.
It contains no UI state and no database persistence.

## Canonical identity

```text
Network        Solana mainnet-beta
Token program  Token-2022
Mint           PWRCRXXZxbg6FdQZfK3PMD7KP8xfxs9acvifJiG46wc
Decimals       9
```

## Pricing

```text
1 completed response = 10,000 PWRC
1 completed response = 10,000,000,000,000 base units
Reference value       = $0.02
Reference PWRC value  = $0.000002/PWRC
Pricing version       = pwrc-copilot-v1
```

The USD value is reference economics only and is never represented as a live
market price.

## Numeric boundary

Inside the domain:

```ts
bigint
```

At JSON/API boundaries:

```ts
string // canonical base-10 integer decimal string
```

Never convert PWRC base-unit balances through JavaScript `number`.

## Pure accounting operations

The package provides deterministic functions for:

```text
fund
reserve one response
settle one response
release one response reservation
balance-conservation validation
base-unit parsing/formatting
deterministic quote hashing
verified-settlement replay compatibility
```

## Tests

```bash
pnpm --dir packages/pwrc-credits test
```

The tests cover exact 9-decimal arithmetic, reserve/settle/release lifecycle,
zero-balance rejection, deterministic quotes, decimal-string boundaries and
verified payment idempotency.
