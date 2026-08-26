import type { FastifyInstance } from 'fastify';
import { loadMcpConfig } from '../mcp/config.ts';
import { PowerChainMcpClient } from '../../../packages/mcp-client/client.ts';

export async function registerMcpAdminRoutes(app: FastifyInstance, source: NodeJS.ProcessEnv = process.env) {
  const config = loadMcpConfig(source);
  const requireInternal = async (request: { headers: Record<string, string | string[] | undefined> }, reply: { code(status: number): unknown }) => {
    const expected = config.internalBearerSecret;
    const header = request.headers.authorization;
    const actual = Array.isArray(header) ? header[0] : header;
    if (!expected || actual !== `Bearer ${expected}`) return reply.code(401);
  };
  app.get('/internal/mcp/servers', { preHandler: requireInternal }, async () => ({ servers: config.servers.map((server) => ({ id: server.id, url: new URL(server.url).origin, allowedTools: server.allowedTools })) }));
  app.get('/internal/mcp/tools', { preHandler: requireInternal }, async () => {
    const client = new PowerChainMcpClient(config.servers, config.allowedHosts);
    const tools = await client.listTools();
    return { tools: tools.map(({ serverId, externalName, functionName, description, inputSchema }) => ({ serverId, externalName, functionName, description, inputSchema, readOnly: true })) };
  });
}
