# PowerChain Copilot Mobile — Platform Hardening v3

Version 1.0.0

This pass consolidates the PWRC credit kernel, managed AI/MCP stack and operational integrations into a role-oriented mobile platform contract.

## Runtime boundaries

- One completed, delivered Copilot response = one message unit = 10,000 PWRC.
- Provider fallback and approved read-only MCP calls remain inside the original PWRC reservation.
- User chat messages are encrypted at rest and user/conversation scoped.
- AI memory is encrypted, bounded, user scoped and credential-blocked. Memory is context, never live operational truth.
- Browser CORS is explicit allowlist policy; production requires configured origins.
- MCP agent profiles restrict tool exposure but never grant authorization. Authentication, tenant/site access and MCP server allowlists remain authoritative.
- LoRA adapters are deployment-local only and disabled by default.

## Managed providers

The router supports OpenAI, Anthropic, Gemini, DeepSeek, Ollama/Llama-compatible runtimes, GRIDLLM and the existing Emergent-compatible adapter. Provider fallback never creates additional PWRC charges.

## Mobile information architecture

Five visible tabs:

1. Copilot
2. Command
3. Assets
4. Alerts
5. Profile

Credits, activity, prompts and diagnostics remain routable supporting surfaces rather than crowding the primary tab bar.

## Themes

- Light
- Carbon Dark
- System preference

## API v1 additions

- `GET /api/v1/cors`
- `GET /api/v1/diagnostics` (authenticated)
- `GET /api/v1/chat/conversations`
- `GET /api/v1/chat/conversations/:conversationId/messages`
- `GET /api/v1/ai/memory`
- `POST /api/v1/ai/memory`
- `DELETE /api/v1/ai/memory/:memoryId`

The `/capilot-mobile/` and `/copilot-mobile/` compatibility aliases are preserved.
