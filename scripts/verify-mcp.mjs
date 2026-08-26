import { access, readFile } from "node:fs/promises";
const required=[
  "packages/mcp-client/src/client.ts","packages/mcp-client/src/security.ts","apps/api/src/mcp/copilot-loop.ts",
  "apps/api/src/mcp/audit.ts","apps/api/src/routes/mcp.ts","apps/mcp-gateway/src/server.ts",
  "services/mcp-python/app/main.py","services/mcp-python/app/mcp_client.py","apps/api/prisma/migrations/20260825163000_mcp_tool_invocations/migration.sql",
  "apps/api/prisma/migrations/20260825164500_mcp_message_provenance/migration.sql","apps/mobile/src/components/chat/McpProvenance.tsx"
];
let failed=false;
for(const path of required){try{await access(path);console.log(`✓ ${path}`)}catch{console.error(`✗ ${path}`);failed=true}}
const ai=await readFile("apps/api/src/integrations/ai.ts","utf8");
const providers=await readFile("apps/api/src/integrations/ai-providers.ts","utf8");
const route=await readFile("apps/api/src/routes/ai.ts","utf8");
const sec=await readFile("packages/mcp-client/src/security.ts","utf8");
const client=await readFile("packages/mcp-client/src/client.ts","utf8");
const checks=[
 ["structured function calling",providers.includes("runCopilotMcpLoop")&&providers.includes("tool_calls")&&providers.includes("tool_use")],
 ["no assistant-text JSON tool parser",!ai.includes("parse_tool_call")&&!route.includes("parse_tool_call")],
 ["PWRC reservation ID passed to MCP audit",route.includes("reservationId: reservation.id")],
 ["credential egress guard",sec.includes("SECRET_KEY")&&sec.includes("assertSafeArguments")],
 ["read-only tool enforcement",client.includes("readOnlyHint")],
 ["production explicit allowlist",client.includes("requires an explicit allowedTools list")],
 ["result is bounded",client.includes("maxResultChars")],
 ["message receipt preserves MCP provenance",(await readFile("apps/api/src/credits/service.ts","utf8")).includes("mcpInvocations: input.mcpInvocations")],
 ["chat displays MCP provenance",(await readFile("apps/mobile/src/components/chat/ChatMessage.tsx","utf8")).includes("McpProvenance")],
];
for(const[label,ok]of checks){console.log(`${ok?"✓":"✗"} ${label}`);if(!ok)failed=true}
if(failed)process.exit(1);
