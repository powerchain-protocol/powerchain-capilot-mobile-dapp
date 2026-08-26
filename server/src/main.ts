import { createPwrcCreditKernel } from '../create-kernel.ts';
import { createPostgresClient } from '../infra/postgres.ts';
import { createPrismaClient } from '../infra/prisma.ts';
import { createOptionalMongo, createOptionalRedis } from '../infra/optional-stores.ts';
import { createSessionAuthenticator } from '../auth/session-auth.ts';
import { PrismaSessionStore } from '../auth/prisma-session-store.ts';
import { loadServerEnv } from '../config/env.ts';
import { createManagedAiRouter } from './providers/factory.ts';
import { createManagedCopilotGenerator } from './providers/managed-generator.ts';
import { createAuditedMcpExecutor } from './mcp/executor.ts';
import { PrismaLikeMcpAuditWriter } from './mcp/audit.ts';
import { PrismaEncryptedChatService } from '../chat/service.ts';
import { PrismaAiMemoryService } from '../ai/memory/service.ts';
import { createFastifyApp } from './app.ts';

async function main() {
  const env = loadServerEnv();
  if (!env.database.url) throw new Error('DATABASE_URL is required to start the production API.');
  const [{ client: database, close: closeDatabase }, prisma, redis, mongo] = await Promise.all([
    createPostgresClient(env.database.url),
    createPrismaClient(env.database.url),
    createOptionalRedis(env.database.redisUrl),
    createOptionalMongo({ url: env.database.mongoUrl, dbName: env.database.mongoDbName }),
  ]);
  if (redis && typeof (redis as { connect?: () => Promise<void> }).connect === 'function') await (redis as { connect(): Promise<void> }).connect();

  const sessions = new PrismaSessionStore(prisma.session);
  const authenticate = createSessionAuthenticator({ mode: env.auth.tokenMode, jwtSecret: env.auth.jwtSecret, sessions });
  const chat = env.chat.enabled && env.chat.encryptionKey
    ? new PrismaEncryptedChatService(prisma.conversation, prisma.chatMessage, env.chat.encryptionKey)
    : null;
  const memory = env.chat.memoryEnabled && env.chat.encryptionKey
    ? new PrismaAiMemoryService(prisma.aiMemory, env.chat.encryptionKey)
    : null;
  const router = createManagedAiRouter();
  const audit = new PrismaLikeMcpAuditWriter(prisma.mcpToolInvocation);
  const mcp = createAuditedMcpExecutor({ audit });
  const generator = createManagedCopilotGenerator({
    router,
    mcp,
    memory,
    maxOutputTokens: env.ai.maxOutputTokens,
    reasoningEffort: env.ai.reasoningEffort,
  });
  const kernel = createPwrcCreditKernel({
    database,
    authenticate,
    generateCopilotResponse: generator,
    solanaPayRecipient: env.payment.solanaPayRecipient,
    paymentKernelWebhookSecret: env.payment.kernelWebhookSecret,
    chat,
  });
  const app = await createFastifyApp({
    handlers: { credits: kernel.creditsApi, copilot: kernel.copilotApi, authenticate },
    redis,
    managedAiProviders: router.configuredProviders(),
    chat,
    memory,
  });
  const host = process.env.HOST?.trim() || '127.0.0.1';
  const port = Number(process.env.PORT || 8000);
  const shutdown = async () => {
    await app.close();
    await prisma.$disconnect();
    if (mongo) await mongo.client.close();
    if (redis && typeof (redis as { quit?: () => Promise<unknown> }).quit === 'function') await (redis as { quit(): Promise<unknown> }).quit();
    await closeDatabase();
  };
  process.once('SIGINT', () => void shutdown().finally(() => process.exit(0)));
  process.once('SIGTERM', () => void shutdown().finally(() => process.exit(0)));
  await app.listen({ host, port });
}

void main();
