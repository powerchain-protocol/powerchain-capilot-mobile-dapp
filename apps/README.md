# Applications

Deployable application units. Each application owns its runtime configuration, deployment boundary and application-specific persistence.

| App | Runtime | Responsibility |
|---|---|---|
| `mobile` | Expo / React Native / Web | iOS, Android and PWA client |
| `api` | Fastify / Node.js | Auth, Copilot, PWRC credits, Payment Kernel, public API |
| `operations-api` | Express / Node.js | EMS, IoT, DePIN operational backend |
| `mcp-gateway` | Express / Node.js | Internal TypeScript MCP execution gateway |

Cross-application code belongs in `packages/`; Python services belong in `services/`.
