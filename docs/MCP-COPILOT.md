# PowerChain Copilot MCP v1.0.0

## Authority

MCP is a read-only context/evidence boundary. The public mutation path remains authenticated Fastify. MCP tools cannot settle PWRC, sign wallets, authorize financial actions, or bypass human approval.

## Billing

```text
reserve 10,000 PWRC → model may use 0..N approved MCP reads → final response → delivery ACK → settle one message unit
```

MCP reads do not multiply the PWRC debit.

## Security

- production HTTPS only
- explicit `MCP_ALLOWED_HOSTS`
- explicit per-server `allowedTools`
- MCP tool must declare `readOnlyHint=true`
- DNS/private/reserved-address rejection
- redirect rejection
- credential-like argument fields blocked
- bounded argument bytes, tool schema bytes and result chars
- bounded tool-call rounds
- external results tagged untrusted before model continuation
- audit stores hashes/redacted previews, not raw tool output

## Configuration

`MCP_SERVERS_JSON` example:

```json
[
  {
    "id": "energy",
    "url": "https://mcp.example.com/mcp",
    "allowedTools": ["search_assets", "get_meter_summary"]
  }
]
```
