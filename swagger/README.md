# Swagger / OpenAPI

Canonical contract: `../powerchain-capilot.yaml`.

Runtime endpoints:

- `GET /swagger` — Swagger UI
- `GET /api/v1/openapi.yaml` — OpenAPI 3.1 YAML
- `GET /api/v1/postman/collection` — Postman collection

The checked-in Swagger page loads the API contract from `/api/v1/openapi.yaml`. It uses the Swagger UI browser bundle from the public unpkg CDN; the YAML contract itself remains local and version-controlled.
