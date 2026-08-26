# PowerChain MCP Python/FastAPI gateway

Python MCP code is intentionally isolated under `backend/python/`; no Python source belongs in TypeScript server files.

Internal routes: `GET /health/live`, `GET /health/ready`, `GET /v1/servers`, `GET /v1/tools`, `POST /v1/tools/call`. `/v1/*` requires the internal bearer secret.
