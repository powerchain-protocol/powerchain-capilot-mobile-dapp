import express from 'express';
import { PowerChainMcpClient } from '../../../packages/mcp-client/client.ts';
import { loadMcpConfig } from '../../../server/src/mcp/config.ts';

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '64kb', strict: true }));

const config = loadMcpConfig(process.env);
const servers = config.servers;
const client = new PowerChainMcpClient(servers, config.allowedHosts);
const secret = config.internalBearerSecret;

app.get('/health/live', (_req, res) => res.json({ status: 'ok', service: 'powerchain-mcp-express', version: '1.0.0' }));
app.get('/health/ready', (_req, res) => res.json({ status: secret ? 'ready' : 'not_ready', configuredServers: servers.length }));

app.use('/v1', (req, res, next) => {
  if (!secret || req.header('authorization') !== `Bearer ${secret}`) return res.status(401).json({ error: { code: 'UNAUTHENTICATED', message: 'Internal bearer authentication required.' } });
  next();
});

app.get('/v1/servers', (_req, res) => res.json({ servers: servers.map((server) => ({ id: server.id, origin: new URL(server.url).origin, allowedTools: server.allowedTools })) }));
app.get('/v1/tools', async (_req, res, next) => {
  try { res.json({ tools: await client.listTools() }); } catch (error) { next(error); }
});
app.post('/v1/tools/call', async (req, res, next) => {
  try {
    const functionName = typeof req.body?.functionName === 'string' ? req.body.functionName : '';
    const args = req.body?.arguments && typeof req.body.arguments === 'object' && !Array.isArray(req.body.arguments) ? req.body.arguments : null;
    if (!functionName || !args) return res.status(400).json({ error: { code: 'INVALID_REQUEST', message: 'functionName and object arguments are required.' } });
    res.json(await client.callFunction(functionName, args));
  } catch (error) { next(error); }
});

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(error instanceof Error ? error.message : String(error));
  res.status(502).json({ error: { code: 'MCP_GATEWAY_ERROR', message: error instanceof Error ? error.message : 'MCP gateway failure.' } });
});

const host = process.env.MCP_GATEWAY_HOST?.trim() || '127.0.0.1';
const port = Number(process.env.MCP_GATEWAY_PORT || 8091);
app.listen(port, host, () => console.log(`PowerChain MCP Express gateway listening on http://${host}:${port}`));
