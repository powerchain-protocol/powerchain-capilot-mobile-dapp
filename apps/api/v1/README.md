# PowerChain API v1

This directory is the canonical API-v1 composition boundary. Existing route implementations remain under `apps/api/src/routes/`; this layer owns version registration, public API metadata, and documentation endpoints.

Do not register new public `/api/v1/*` routes directly in `src/app.ts`. Add the route module to `registerApiV1()` and update `powerchain-capilot.yaml`.
