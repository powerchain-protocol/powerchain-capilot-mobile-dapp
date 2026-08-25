# PowerChain Copilot Mobile API Namespace & CORS — v1.0.0

## Mobile API namespace

The Expo client uses:

```text
/api/v1/capilot-mobile
```

The spelling is retained for compatibility with the existing repository and
requested deployment surface. A corrected alias is also supported:

```text
/api/v1/copilot-mobile
```

Both are routing aliases over the existing canonical `/api/v1/*` handlers.
They do not duplicate business logic or accounting state.

Examples:

```text
/api/v1/capilot-mobile/health
→ /api/v1/health

/api/v1/capilot-mobile/credits/account
→ /api/v1/credits/account

/api/v1/capilot-mobile/ai/chat
→ /api/v1/ai/chat

/api/v1/copilot-mobile/mcp/tools
→ /api/v1/mcp/tools
```

The alias is **fail-closed**. Only reviewed mobile roots are rewritten. Internal
routes such as `/api/v1/internal/payment-kernel/events` are never mirrored into
the mobile namespace.

The namespace metadata endpoint is:

```text
GET /api/v1/capilot-mobile
GET /api/v1/copilot-mobile
```

## CORS

CORS is centralized in `server/src/http/cors-policy.ts`.

Development defaults:

```env
CORS_ORIGIN=http://localhost:8081,http://localhost:19006,http://localhost:3000
CORS_ALLOW_LOCALHOST=true
CORS_CREDENTIALS=false
CORS_MAX_AGE_SECONDS=86400
```

Production example:

```env
CORS_ORIGIN=https://app.powerchain.ventures
CORS_ALLOW_LOCALHOST=false
CORS_CREDENTIALS=false
CORS_MAX_AGE_SECONDS=86400
```

Production rejects wildcard CORS, localhost origins, and enabling the localhost
escape hatch.

Native Expo/iOS/Android requests commonly omit `Origin`. They are allowed past
the CORS layer because CORS is a browser security boundary; those requests must
still pass normal authentication, tenant authorization, policy, PWRC credit,
and MCP controls.

## CORS diagnostics

Safe diagnostics are exposed at:

```text
GET /api/v1/cors
GET /api/v1/capilot-mobile/cors/
GET /api/v1/copilot-mobile/cors/
```

The response reports configured origins, whether the request Origin is allowed,
methods, headers, credentials mode, and preflight cache time. It returns no
credentials or secrets.

## TypeScript bootstrap

`frontend/tsconfig.json` intentionally extends the checked-in editor bootstrap:

```json
{
  "extends": "./expo/tsconfig.base.json"
}
```

This prevents VS Code from failing before `pnpm install` has installed Expo.

After installation, `frontend/tsconfig.expo.json` validates against the official
package-owned base:

```json
{
  "extends": "expo/tsconfig.base"
}
```

Run:

```bash
pnpm --dir frontend run verify:bootstrap
pnpm --dir frontend run typecheck:bootstrap

# after pnpm install
pnpm --dir frontend run verify:installed
```
