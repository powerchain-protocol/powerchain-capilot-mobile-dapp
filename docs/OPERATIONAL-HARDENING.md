# PowerChain Operational Hardening v1.0.0

## Authority model

Physical systems remain authoritative. Telemetry and operational state may be labelled `live`, `simulation`, or `non_authoritative`. AI prepares decisions; humans approve; wallets authorize financial signatures; physical dispatch is not exposed by this release.

## Operational twin

Each authorized site can be represented by a deterministic operational twin containing EMS state, IoT and DePIN health counts, alarm counts, degraded-state reasons, source sequence watermarks, observation timestamps, receive timestamps, and authority labels.

## Telemetry integrity

Ingestion tracks source sequence, observation time, receive time, idempotency key and canonical SHA-256 payload hash. Reuse of an idempotency key or source sequence with different canonical content is rejected. Late observations are journaled but do not overwrite newer device state.

## Alarms and journal

Alarms use open / acknowledged / resolved state and info / warning / critical severity. The operational event journal is append-only at the database layer. Public list APIs use bounded cursor pagination and site authorization.

## Safe Actions

Safe Action hashes bind action type, resource identity, reason, parameters, actor/organization/site context, idempotency key and expected resource version. Dispatch preparation always produces a simulation/review state with `physicalExecutionEnabled=false`. Server signing is prohibited.

## Copilot runtime

PWRC accounting remains bigint/base-unit authoritative. One completed delivery-acknowledged response is 10,000 PWRC. Provider fallback and permitted MCP reads do not multiply billing. User chat messages support AES-256-GCM at-rest protection when `CHAT_MESSAGE_ENCRYPTION_KEY` is configured and production Copilot fails closed without it.

The runtime is organized into `ai/memory`, `ai/llm`, `ai/lora`, `mcp`, and compatibility `mpc/agents` boundaries. The agent namespace never gains approval, signing, custody or physical-dispatch authority.

## Mobile operations

The mobile app keeps five primary tabs while adding a routed Site Operations surface with authorized site selection, stale-while-revalidate caching, request deduplication, AppState refresh, digital-twin summary, real alarm/event data and evidence/snapshot export verification. `⌘/Ctrl+K` opens the operational command menu on web/desktop; mobile receives an explicit command trigger.
