import type { FastifyInstance } from 'fastify';
import { getSanitizedSolanaSystemConfig } from '../../system/solana.ts';

export async function registerSystemRoutes(app: FastifyInstance, source: NodeJS.ProcessEnv = process.env) {
  const payload = getSanitizedSolanaSystemConfig(source);
  for (const path of [
    '/api/v1/system/solana',
    '/api/v1/capilot-mobile/system/solana',
    '/api/v1/copilot-mobile/system/solana',
  ]) {
    app.get(path, async (_request, reply) => reply.header('cache-control', 'no-store').send(payload));
  }
}
