# PowerChain MCP Express gateway

Internal-only MCP gateway. `/v1/*` requires `Authorization: Bearer $MCP_INTERNAL_BEARER_SECRET`.

Routes: `GET /health/live`, `GET /health/ready`, `GET /v1/servers`, `GET /v1/tools`, `POST /v1/tools/call`.

Production MCP servers require HTTPS, an explicit hostname allowlist, explicit non-empty `allowedTools`, and external `readOnlyHint=true` at execution time.
