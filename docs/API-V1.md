# PowerChain API v1

## Canonical artifacts

- `apps/api/v1/` — version registration and docs routes
- `powerchain-capilot.yaml` — OpenAPI 3.1 contract
- `api/postman/` — Postman collection/environments
- `swagger/` — Swagger UI shell

## Runtime documentation

```text
GET /swagger
GET /api/v1/openapi.yaml
GET /api/v1/postman/collection
```

## Rules

1. Every public v1 route is registered through `registerApiV1()`.
2. Decimal financial/base-unit values remain strings at API boundaries.
3. Bearer authentication protects user-scoped account, wallet, Copilot, PWRC, MCP and market endpoints.
4. `/api/v1/internal/*` is server-to-server only and is excluded from mobile namespace rewriting.
5. OpenAPI and Postman artifacts must never contain secrets.
6. New route work must update both implementation registration and the OpenAPI contract.
