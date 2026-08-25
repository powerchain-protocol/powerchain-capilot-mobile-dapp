PowerChain Copilot Mobile — Production checklist

• Identity & account

- [ ] Verify email ownership
- [ ] Add password reset / account recovery
- [ ] Add session list and revoke UI
- [ ] Add optional MFA/passkeys
- [ ] Add delete-account flow
- [ ] Add explicit privacy and consent surfaces
- [ ] Rate-limit registration and login
- [ ] Add credential-stuffing protection

• AI

- [ ] Keep provider key server-only
- [ ] Set per-account request quotas
- [ ] Add model timeout
- [ ] Add retry policy only for safe failures
- [ ] Add cancellation/abort for streamed generation
- [ ] Add conversation retention policy
- [ ] Redact secrets from logs
- [ ] Validate operational context before sending
- [ ] Separate analysis from executable action intents

• Solana

- [ ] Mainnet writes remain disabled until reviewed
- [ ] Simulate all prepared transactions
- [ ] Show exact instructions before signing
- [ ] Show fees and recipient accounts
- [ ] Validate expected program IDs
- [ ] Validate token mint and decimals
- [ ] Add transaction confirmation timeout
- [ ] Add dropped/expired transaction handling
- [ ] Keep private keys outside PowerChain
- [ ] Define separate iOS wallet strategy

• Pyth

- [ ] Define canonical feed IDs in server config
- [ ] Validate publish-time freshness
- [ ] Enforce max confidence threshold where relevant
- [ ] Cache successful results
- [ ] Surface stale fallback explicitly
- [ ] Never silently treat stale prices as current

• Birdeye

- [ ] Add cache and rate-limit backoff
- [ ] Validate Solana addresses
- [ ] Add liquidity warnings
- [ ] Distinguish price unavailable from asset unknown
- [ ] Never expose API key to Expo

• Database

- [ ] Run migrations in CI
- [ ] Validate migration on staging copy
- [ ] Enable backups
- [ ] Add retention policy
- [ ] Add index monitoring
- [ ] Add connection pooling
- [ ] Add database metrics
- [ ] Protect audit records against application-level mutation

• Mobile

- [ ] Verify development build
- [ ] Verify Android wallet connection
- [ ] Verify iOS fallback
- [ ] Test Light / Dark / Dark Green
- [ ] Test offline mode
- [ ] Test slow provider responses
- [ ] Test revoked sessions
- [ ] Test expired sessions
- [ ] Test 0 / 2000 composer
- [ ] Test keyboard / safe area
- [ ] Test long wallet addresses
- [ ] Test long organization names
- [ ] Test failed and retried messages
- [ ] Verify app icons on real devices

• Observability

- [ ] Correlation IDs end-to-end
- [ ] Crash reporting
- [ ] API latency
- [ ] AI latency and error metrics
- [ ] RPC latency
- [ ] Oracle latency
- [ ] Birdeye rate-limit metrics
- [ ] Database query latency
- [ ] Auth failure metrics
- [ ] Wallet verification audit events
