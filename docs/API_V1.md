# PowerChain Copilot Mobile API v1

Version 1.0.0

The canonical API namespace is `/api/v1`. Compatibility aliases under `/api/v1/capilot-mobile` and `/api/v1/copilot-mobile` remain available where documented.

## API artifacts

- OpenAPI 3.1: `docs/api/openapi-v1.json`
- Swagger UI: `GET /api/v1/swagger`
- Runtime OpenAPI document: `GET /api/v1/openapi.json`
- Postman collection: `docs/api/postman/PowerChain-Copilot-Mobile-v1.postman_collection.json`
- Postman local environment: `docs/api/postman/PowerChain-Copilot-Mobile-Local.postman_environment.json`

Regenerate artifacts with:

```bash
pnpm api:docs
```

## Security boundaries

Authenticated APIs derive the user from the validated bearer/session context. User IDs, tenant IDs, wallet ownership and site access are not trusted from request bodies.

Chat content and AI memory are encrypted at rest. API responses contain explicit safe DTOs and never serialize ciphertext, encryption keys, provider credentials, database URLs, private RPC URLs or LoRA adapter filesystem paths.

## Operations

Operational reads are tenant/site scoped:

- `GET /api/v1/sites`
- `GET /api/v1/ems/overview?siteId=...`
- `GET /api/v1/iot/devices?siteId=...`
- `GET /api/v1/depin/nodes?siteId=...`
- `GET /api/v1/twin?siteId=...`
- `GET /api/v1/telemetry/integrity?siteId=...`
- `GET /api/v1/alarms?siteId=...`
- `GET /api/v1/events?siteId=...`

The telemetry integrity endpoint reports freshness, IoT/DePIN availability and alarm conditions without mutating operational state.

## AI boundaries

- `GET /api/v1/ai/runtime`
- `GET /api/v1/ai/readiness`
- `GET /api/v1/ai/agents`
- `GET /api/v1/ai/lora`
- `GET/POST /api/v1/ai/memory`

LoRA responses expose adapter IDs/base models only. Deployment paths are never exposed. MCP agent profiles narrow model-visible tools but cannot override server allowlists or read-only policy.

## Safe Actions

`POST /api/v1/actions/prepare` prepares bounded review/signature intents. It does not execute them.

`POST /api/v1/actions/execute` intentionally returns:

```text
405 PHYSICAL_EXECUTION_DISABLED
```

Physical dispatch, blockchain execution and server-side wallet signing remain outside this service.
