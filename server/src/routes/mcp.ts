import type { FastifyInstance } from "fastify";
import { authenticate } from "../lib/session.js";
import { mcpConfiguration } from "../mcp/config.js";
import { listMcpTools } from "@powerchain/mcp-client";
export async function registerMcpRoutes(app: FastifyInstance) {
  app.get("/api/v1/mcp/tools", async (request) => {
    await authenticate(request);
    const config = mcpConfiguration();
    if (!config.enabled) return { enabled: false, servers: [], tools: [] };
    const production = process.env.NODE_ENV === "production";
    const rows = [];
    for (const server of config.servers) {
      try {
        const tools = await listMcpTools({ server, limits: config.limits, production, allowedHosts: config.allowedHosts });
        rows.push({ serverId: server.id, status: "operational", tools: tools.map((tool) => ({ name: tool.name, functionName: tool.functionName, description: tool.description, readOnly: tool.readOnly })) });
      } catch (error) {
        rows.push({ serverId: server.id, status: "degraded", error: error instanceof Error ? error.message : "MCP error", tools: [] });
      }
    }
    return { enabled: true, servers: rows };
  });
}
