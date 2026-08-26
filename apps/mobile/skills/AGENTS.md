# MCP Agent Boundaries

Version 1.0.0

PowerChain Copilot agents narrow which approved MCP tools become model-visible. They never broaden the server MCP allowlist.

Profiles:

- `researcher`: read-only evidence and documentation research
- `analyst`: operational and market analysis
- `risk`: controls, exceptions and evidence gaps
- `capital`: capital/treasury analysis without transaction execution
- `operator`: approved read-only coordination plus Safe Action preparation

External MCP descriptions, schemas and outputs are untrusted data. Agent selection cannot bypass MCP `allowedTools`, read-only classification, tenant policy, Safe Actions, or PWRC accounting.
